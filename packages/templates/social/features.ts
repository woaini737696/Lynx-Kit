export const SOCIAL_FEATURES = [
  { id: 'auth', name: '用户认证', required: true, module: 'auth' },
  { id: 'profile', name: '个人资料', required: true, module: 'profile' },
  { id: 'match', name: '智能匹配', required: true, module: 'match' },
  { id: 'chat', name: '实时聊天', required: true, module: 'chat' },
  { id: 'ai_icebreaker', name: 'AI 破冰助手', required: false, module: 'ai' },
  { id: 'sentiment', name: '情感分析', required: false, module: 'ai' },
  { id: 'discover', name: '发现页', required: true, module: 'discover' },
  { id: 'notification', name: '通知系统', required: true, module: 'notification' },
];
