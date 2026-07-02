/**
 * ③ 需求澄清 Agent
 *
 * 串行执行。基于规则引擎（不调 LLM）按产品类型生成 5~8 个澄清问题，
 * 并把用户已回答与默认值合并为最终 answers，供后续 Agent 使用。
 */

import { AgentRole, LogLevel, ProductType } from "@lynxkit/shared";
import { BaseAgent } from "../types.js";
import type { OrchestratorContext } from "../orchestrator.js";
import type { IntentResult } from "./01-intent.js";

export type ClarifyQuestionType = "single_choice" | "text" | "boolean";

export interface ClarifyQuestion {
  id: string;
  question: string;
  type: ClarifyQuestionType;
  options?: string[];
  defaultAnswer: string | boolean;
  impact: string;
}

export interface ClarifyResult {
  questions: ClarifyQuestion[];
  /** 合并了用户回答与默认值的最终配置 */
  answers: Record<string, unknown>;
}

/**
 * 通用澄清问题（所有产品类型都会问）
 */
function commonQuestions(): ClarifyQuestion[] {
  return [
    {
      id: "q_user_scale",
      question: "预计初期日活用户量级是多少？",
      type: "single_choice",
      options: ["<1000", "1000~1万", "1万~10万", ">10万"],
      defaultAnswer: "1000~1万",
      impact: "影响数据库选型与缓存策略",
    },
    {
      id: "q_auth",
      question: "用户鉴权方式偏好？",
      type: "single_choice",
      options: ["手机号验证码", "邮箱密码", "OAuth 第三方", "免登录"],
      defaultAnswer: "手机号验证码",
      impact: "决定鉴权中间件与用户表结构",
    },
    {
      id: "q_multi_tenant",
      question: "是否需要多租户（SaaS）能力？",
      type: "boolean",
      defaultAnswer: false,
      impact: "影响数据库 schema 与权限隔离设计",
    },
    {
      id: "q_payment",
      question: "是否需要在线支付？",
      type: "boolean",
      defaultAnswer: false,
      impact: "决定是否接入支付模块与订单表",
    },
    {
      id: "q_deploy_target",
      question: "部署目标偏好？",
      type: "single_choice",
      options: ["Vercel", "自托管服务器", "Docker Compose", "桌面端打包"],
      defaultAnswer: "Vercel",
      impact: "决定构建产物与部署适配器",
    },
  ];
}

/**
 * 按产品类型追加专项问题
 */
function productSpecific(productType: ProductType): ClarifyQuestion[] {
  switch (productType) {
    case ProductType.SOCIAL:
      return [
        {
          id: "q_match_algo",
          question: "匹配算法偏好？",
          type: "single_choice",
          options: ["向量相似度", "规则标签", "混合"],
          defaultAnswer: "向量相似度",
          impact: "决定是否引入 pgvector",
        },
        {
          id: "q_realtime",
          question: "是否需要实时消息（IM）？",
          type: "boolean",
          defaultAnswer: true,
          impact: "决定是否引入 WebSocket",
        },
      ];
    case ProductType.DATA:
      return [
        {
          id: "q_chart_lib",
          question: "图表库偏好？",
          type: "single_choice",
          options: ["ECharts", "Recharts", "AntV"],
          defaultAnswer: "ECharts",
          impact: "决定前端可视化依赖",
        },
      ];
    case ProductType.APP:
      return [
        {
          id: "q_platform",
          question: "目标移动平台？",
          type: "single_choice",
          options: ["iOS+Android（Expo）", "微信小程序", "全部"],
          defaultAnswer: "iOS+Android（Expo）",
          impact: "决定前端框架选型",
        },
      ];
    case ProductType.HARDWARE:
      return [
        {
          id: "q_protocol",
          question: "设备通信协议？",
          type: "single_choice",
          options: ["MQTT", "HTTP", "CoAP"],
          defaultAnswer: "MQTT",
          impact: "决定网关与消息中间件",
        },
      ];
    case ProductType.ADMIN:
    case ProductType.SYSTEM:
    case ProductType.WORKSTATION:
    case ProductType.MARKETING:
    default:
      return [
        {
          id: "q_ai_ability",
          question: "需要的核心 AI 能力？",
          type: "single_choice",
          options: ["对话问答", "文档 RAG", "代码生成", "数据分析"],
          defaultAnswer: "对话问答",
          impact: "决定 AI 集成 Agent 生成的模块",
        },
      ];
  }
}

export class ClarifyAgent extends BaseAgent<ClarifyResult> {
  constructor(
    ctx: OrchestratorContext,
    private intent: IntentResult,
  ) {
    super(ctx, AgentRole.CLARIFY);
  }

  async run(): Promise<ClarifyResult> {
    this.log(LogLevel.INFO, "③ 需求澄清开始（规则引擎）");
    this.progress(20);

    const questions: ClarifyQuestion[] = [
      ...commonQuestions(),
      ...productSpecific(this.intent.productType),
    ].slice(0, 8);

    // 合并用户已有回答，未回答的填默认值
    const userAnswers = this.ctx.answers ?? {};
    const answers: Record<string, unknown> = {};
    for (const q of questions) {
      answers[q.id] =
        q.id in userAnswers ? userAnswers[q.id] : q.defaultAnswer;
    }

    this.log(LogLevel.INFO, "③ 需求澄清完成", {
      questionCount: questions.length,
      answered: Object.keys(answers).length,
    });
    this.progress(100);
    return { questions, answers };
  }
}
