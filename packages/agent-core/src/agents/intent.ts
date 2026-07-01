import { matchProductType } from "@lynxkit/shared";
import type { ProjectType } from "@lynxkit/shared";
import type { LLMProvider } from "../providers/types.js";

/**
 * ① 意图识别 Agent
 *
 * 输入：用户自然语言需求
 * 输出：产品类型 + 置信度
 * 模型：Claude Haiku（成本极低）
 *
 * 策略：
 *   1. 先用关键词规则匹配（零成本，命中即返回）
 *   2. 规则未命中，调用 LLM 做语义理解
 */

export interface IntentInput {
  /** 用户原始输入 */
  userInput: string;
}

export interface IntentOutput {
  /** 识别的产品类型 */
  type: ProjectType;
  /** 置信度 0-1 */
  confidence: number;
  /** 是否由规则引擎命中（true=零成本） */
  ruleMatched: boolean;
}

/**
 * 意图识别 Agent
 */
export async function recognizeIntent(
  input: IntentInput,
  llm?: LLMProvider
): Promise<IntentOutput> {
  // 1. 规则匹配（零成本）
  const ruleMatch = matchProductType(input.userInput);
  if (ruleMatch) {
    return {
      type: ruleMatch.type,
      confidence: ruleMatch.confidence,
      ruleMatched: true,
    };
  }

  // 2. 规则未命中，调用 LLM
  if (!llm) {
    // 无 LLM 时默认返回 static-site
    return {
      type: "static-site",
      confidence: 0.3,
      ruleMatched: false,
    };
  }

  const response = await llm.chat({
    model: "claude-3-5-haiku-20241022",
    maxTokens: 100,
    messages: [
      {
        role: "system",
        content:
          "你是产品类型分类器。根据用户需求判断最接近的产品类型，只输出类型编号和置信度。",
      },
      {
        role: "user",
        content: `用户需求："${input.userInput}"

请判断最接近的产品类型：
1. static-site（品牌展示：官网/作品集/落地页）
2. service-booking（服务预约：教练/美容/咨询预约）
3. content-publish（内容发布：博客/知识库）
4. light-commerce（电商交易：商城/付费）
5. event-manage（活动管理：报名/签到）
6. admin-dashboard（管理后台：CRM/数据看板）

只输出格式：类型编号,置信度（0-1），例如：2,0.85`,
      },
    ],
  });

  const parsed = parseIntentResponse(response.content);
  return parsed;
}

/**
 * 解析 LLM 响应为 IntentOutput
 */
function parseIntentResponse(content: string): IntentOutput {
  const match = content.match(/(\d),\s*([\d.]+)/);
  if (!match) {
    return { type: "static-site", confidence: 0.3, ruleMatched: false };
  }
  const typeMap: Record<number, ProjectType> = {
    1: "static-site",
    2: "service-booking",
    3: "content-publish",
    4: "light-commerce",
    5: "event-manage",
    6: "admin-dashboard",
  };
  const type = typeMap[Number(match[1])] ?? "static-site";
  const confidence = Math.min(1, Math.max(0, Number(match[2])));
  return { type, confidence, ruleMatched: false };
}
