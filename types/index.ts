// 对话消息类型
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  audioUrl?: string;
  createdAt: Date;
}

// 对话记录类型
export interface Conversation {
  id: string;
  createdAt: Date;
  summary?: string;
  totalRounds: number;
  clarityScore?: number;
  logicScore?: number;
  depthScore?: number;
  improvementTips?: string[];
  messages: Message[];
}

// 观点类型
export interface Insight {
  id: string;
  conversationId: string;
  content: string;
  category?: string;
  tags?: string[];
  createdAt: Date;
}

// 对话总结类型
export interface ConversationSummary {
  coreInsights: string[];
  thinkingProcess: string;
  clarityScore: number;
  clarityExample?: string;  // 清晰度的具体例子
  logicScore: number;
  logicExample?: string;    // 逻辑性的具体例子
  depthScore: number;
  depthExample?: string;    // 深度的具体例子
  improvementTips: string[];
  logicIssues?: string[];
}
