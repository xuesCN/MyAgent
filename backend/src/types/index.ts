/**
 * 消息接口
 */
export interface Message {
  id: string;
  content: string | MessageContentItem[];
  sender: "user" | "ai";
  timestamp: Date;
  isStreaming?: boolean;
}

/**
 * 消息内容项（支持多模态）
 */
export interface MessageContentItem {
  type: "text" | "image_url";
  text?: string;
  image_url?: {
    url: string;
  };
}

/**
 * 聊天请求
 */
export interface ChatRequest {
  messages: Message[];
  useSearch?: boolean;
}

/**
 * LLM 配置
 */
export interface LLMConfig {
  apiKey: string;
  baseURL: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * 搜索结果
 */
export interface SearchResult {
  answer: string;
  results: Array<{
    title: string;
    url: string;
    snippet: string;
  }>;
}

/**
 * API 响应
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

/**
 * 错误信息
 */
export interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
  timestamp: number;
}
