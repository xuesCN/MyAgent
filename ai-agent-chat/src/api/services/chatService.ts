import OpenAI from 'openai';
import { LLMConfig } from '../../types';
import { warnDevOnce } from '../../utils/devLogger';

const API_KEY_PLACEHOLDERS = new Set([
  '',
  'your_api_key_here',
  'your-api-key',
]);

function isInvalidApiKey(apiKey: string): boolean {
  const normalized = apiKey.trim().toLowerCase();
  return API_KEY_PLACEHOLDERS.has(normalized);
}

class ChatService {
  private client: OpenAI;
  private config: LLMConfig;

  constructor() {
    // 从环境变量初始化
    this.config = {
      apiKey: process.env.REACT_APP_VOLCANO_API_KEY || '',
      baseURL: process.env.REACT_APP_API_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3',
      model: process.env.REACT_APP_MODEL_ID || 'doubao-seed-2-0-pro-260215',
      temperature: 0.7,
      maxTokens: 2000
    };

    if (isInvalidApiKey(this.config.apiKey)) {
      warnDevOnce(
        'missing_volcano_api_key',
        '[Config] REACT_APP_VOLCANO_API_KEY 未配置或仍为占位符，Agent 请求将失败。'
      );
    }

    this.client = new OpenAI({
      apiKey: this.config.apiKey,
      baseURL: this.config.baseURL,
      dangerouslyAllowBrowser: true
    });
  }

  private assertConfigValid(): void {
    if (isInvalidApiKey(this.config.apiKey)) {
      throw new Error(
        '未配置 REACT_APP_VOLCANO_API_KEY。请在 ai-agent-chat/.env 中设置有效密钥后重启 npm start。'
      );
    }
  }

  // 发送消息（流式响应）
  async sendMessageStream(message: string) {
    this.assertConfigValid();
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

  // 测试API连接
  async testConnection(): Promise<boolean> {
    try {
      const stream = await this.sendMessageStream('你好');

      for await (const chunk of stream) {
        const content = chunk.choices?.[0]?.delta?.content;
        if (typeof content === 'string' && content.length > 0) {
          return true;
        }
      }

      return false;
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
    this.assertConfigValid();
    return { ...this.config };
  }
}

// 创建单例实例
export const chatService = new ChatService();
