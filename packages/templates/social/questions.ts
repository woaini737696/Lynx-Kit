export interface ClarifyQuestion {
  id: string;
  question: string;
  type: 'single' | 'multiple' | 'text' | 'boolean';
  options?: string[];
  default?: unknown;
  required: boolean;
}

export const SOCIAL_QUESTIONS: ClarifyQuestion[] = [
  {
    id: 'match_algorithm',
    question: '匹配算法基于什么？',
    type: 'single',
    options: ['兴趣匹配', '性格匹配', '地理位置', '综合（兴趣+性格+位置）'],
    default: '综合（兴趣+性格+位置）',
    required: true,
  },
  {
    id: 'chat_features',
    question: '聊天功能需要哪些？',
    type: 'multiple',
    options: ['文字', '图片', '语音', '视频', '表情包', '文件'],
    default: ['文字', '图片', '表情包'],
    required: true,
  },
  {
    id: 'ai_assistant',
    question: '需要哪些 AI 助手功能？',
    type: 'multiple',
    options: ['破冰开场白', '情感分析', '话题推荐', '聊天翻译', '内容审核'],
    default: ['破冰开场白', '情感分析', '话题推荐'],
    required: true,
  },
  {
    id: 'user_identity',
    question: '用户身份验证方式？',
    type: 'single',
    options: ['手机号', '邮箱', '微信', 'Apple ID', '匿名'],
    default: '手机号',
    required: true,
  },
  {
    id: 'target_audience',
    question: '目标用户群体？',
    type: 'single',
    options: ['年轻人（18-30）', '职场人士', '兴趣社群', '通用'],
    default: '年轻人（18-30）',
    required: true,
  },
  {
    id: 'monetization',
    question: '商业化模式？',
    type: 'multiple',
    options: ['免费', '会员订阅', '增值服务（VIP/打赏）', '广告'],
    default: ['免费'],
    required: false,
  },
  {
    id: 'theme',
    question: '设计风格？',
    type: 'single',
    options: ['温暖粉红', '科技蓝', '活力橙', '简约白'],
    default: '温暖粉红',
    required: true,
  },
  {
    id: 'extra_features',
    question: '其他希望包含的功能？',
    type: 'text',
    default: '',
    required: false,
  },
];
