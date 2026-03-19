import OpenAI from "openai";
import { config } from "../config";
import { Message } from "../types";

/**
 * LLM 服务代理
 * 职责：代理 Volcano Cloud API，处理 LLM 请求
 */
class LLMService {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: config.volcano.apiKey,
      baseURL: config.volcano.baseURL,
    });

    console.log("[LLMService] 初始化完成");
    console.log("[LLMService] 模型:", config.volcano.model);
  }

  /**
   * 转换前端消息格式为 OpenAI 格式
   */
  private convertMessages(messages: Message[]): Array<any> {
    return messages.map((msg) => {
      if (msg.sender === "user") {
        if (Array.isArray(msg.content)) {
          // 多模态消息
          return {
            role: "user",
            content: msg.content.map((item: any) => {
              if (item.type === "image_url") {
                return {
                  type: "image_url",
                  image_url: {
                    url: item.image_url.url,
                  },
                };
              } else {
                return {
                  type: "text",
                  text: item.text,
                };
              }
            }),
          };
        } else {
          // 文本消息
          return {
            role: "user",
            content: msg.content,
          };
        }
      } else {
        return {
          role: "assistant",
          content: msg.content,
        };
      }
    });
  }

  /**
   * 发送消息（非流式）
   */
  async chat(messages: Message[]): Promise<string> {
    try {
      console.log("[LLMService] 发送非流式请求，消息数:", messages.length);

      const convertedMessages = this.convertMessages(messages);

      const response = await this.client.chat.completions.create({
        model: config.volcano.model,
        messages: convertedMessages,
        temperature: 0.7,
        max_tokens: 2000,
      });

      const content = response.choices[0]?.message?.content || "";
      console.log("[LLMService] 收到响应，长度:", content.length);

      return content;
    } catch (error) {
      console.error("[LLMService] 请求失败:", error);
      throw error;
    }
  }

  /**
   * 发送消息（流式）
   */
  async *chatStream(messages: Message[]): AsyncGenerator<string> {
    try {
      console.log("[LLMService] 发送流式请求，消息数:", messages.length);

      const convertedMessages = this.convertMessages(messages);

      const stream = await this.client.chat.completions.create({
        model: config.volcano.model,
        messages: convertedMessages,
        stream: true,
        temperature: 0.7,
        max_tokens: 2000,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          yield content;
        }
      }

      console.log("[LLMService] 流式请求完成");
    } catch (error) {
      console.error("[LLMService] 流式请求失败:", error);
      throw error;
    }
  }

  /**
   * 测试连接
   */
  async testConnection(): Promise<boolean> {
    try {
      console.log("[LLMService] 测试连接...");
      const response = await this.chat([
        {
          id: "test",
          sender: "user",
          content: "你好",
          timestamp: new Date(),
        },
      ]);

      return response.length > 0;
    } catch (error) {
      console.error("[LLMService] 连接测试失败:", error);
      return false;
    }
  }
}

export const llmService = new LLMService();
