// 定义消息内容项类型
export type MessageContentItem = 
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } };

export interface Message {
  id: string;
  content: string | MessageContentItem[];
  sender: 'user' | 'ai';
  timestamp: Date;
  isStreaming?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatState {
  currentSession: ChatSession | null;
  sessions: ChatSession[];
  isLoading: boolean;
  error: string | null;
}

export interface LLMConfig {
  apiKey: string;
  baseURL: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

export interface StreamResponse {
  content: string;
  isComplete: boolean;
  error?: string;
}

export type Theme = 'dark' | 'light' | 'auto';

export interface AppSettings {
  theme: Theme;
  autoSave: boolean;
  soundEnabled: boolean;
  sendOnEnter: boolean;
}