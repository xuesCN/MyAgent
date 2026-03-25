import { warnDevOnce } from "../../utils/devLogger";

interface TavilySearchResult {
  answer: string;
  [key: string]: any;
}

export class TavilyService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    // 从环境变量读取 API 密钥
    this.apiKey = process.env.REACT_APP_TAVILY_API_KEY || "";
    this.baseUrl = "https://api.tavily.com/search";

    if (!this.apiKey.trim()) {
      warnDevOnce(
        "missing_tavily_api_key",
        "[Config] REACT_APP_TAVILY_API_KEY 未配置，涉及搜索工具的问题会失败。"
      );
    }
  }

  // 执行搜索并获取答案
  async search(query: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error("Tavily API key is not configured");
    }

    try {
      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          api_key: this.apiKey,
          query: query,
          include_answer: "advanced",
          search_depth: "advanced",
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `API request failed with status ${response.status}: ${errorText}`
        );
      }

      const data: TavilySearchResult = await response.json();
      // 返回answer字段内容
      return data.answer || "抱歉，无法获取搜索结果。";
    } catch (error) {
      console.error("Tavily search failed:", error);
      throw new Error("搜索失败，请稍后重试。");
    }
  }

  // 检查API连接
  async testConnection(): Promise<boolean> {
    if (!this.apiKey) {
      return false;
    }

    try {
      const result = await this.search("test");
      return !!result;
    } catch (error) {
      console.error("Tavily connection test failed:", error);
      return false;
    }
  }

  // 更新API密钥
  updateApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }

  // 获取当前API密钥状态
  hasApiKey(): boolean {
    return !!this.apiKey;
  }
}

// 创建单例实例
export const tavilyService = new TavilyService();
