import OpenAI from 'openai';
import { LLMConfig } from '../../types';

class ChatService {
  private client: OpenAI;
  private config: LLMConfig;

  constructor() {
    // 从环境变量或默认配置初始化
    this.config = {
      apiKey: process.env.REACT_APP_VOLCANO_API_KEY || '6ac879c9-9a62-49f0-a99a-db2e0a4b8e02',
      baseURL: process.env.REACT_APP_API_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3',
      model: process.env.REACT_APP_MODEL_ID || 'doubao-seed-1-6-251015',
      temperature: 0.7,
      maxTokens: 2000
    };

    this.client = new OpenAI({
      apiKey: this.config.apiKey,
      baseURL: this.config.baseURL,
      dangerouslyAllowBrowser: true
    });
  }

  // 发送消息（流式响应）
  async sendMessageStream(message: string) {
    try {
      const stream = await this.client.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: '你是一个专业的AI助手，请用中文回答问题。回答要简洁明了，有逻辑性。'
          },
          {
            role: 'user',
            content: message
          }
        ],
        model: this.config.model,
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
        stream: true
      });

      return stream;
    } catch (error) {
      console.error('Failed to send message:', error);
      throw new Error('发送消息失败，请检查网络连接和API配置');
    }
  }

  // 发送消息（非流式）
  async sendMessage(message: string): Promise<string> {
    try {
      const response = await this.client.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: '你是一个专业的AI助手，请用中文回答问题。回答要简洁明了，有逻辑性。'
          },
          {
            role: 'user',
            content: message
          }
        ],
        model: this.config.model,
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens
      });

      return response.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('Failed to send message:', error);
      throw new Error('发送消息失败，请检查网络连接和API配置');
    }
  }

  // 测试API连接
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.sendMessage('你好');
      return response.length > 0;
    } catch (error) {
      console.error('API connection test failed:', error);
      return false;
    }
  }

  // 更新配置
  updateConfig(config: Partial<LLMConfig>): void {
    this.config = { ...this.config, ...config };
    this.client = new OpenAI({
      apiKey: this.config.apiKey,
      baseURL: this.config.baseURL,
      dangerouslyAllowBrowser: true
    });
  }

  // 获取当前配置
  getConfig(): LLMConfig {
    return { ...this.config };
  }
}

// 创建单例实例
export const chatService = new ChatService();