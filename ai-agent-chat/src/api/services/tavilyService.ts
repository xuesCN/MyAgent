interface TavilySearchResult {
  answer: string;
  [key: string]: any;
}

export class TavilyService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    // 直接硬编码API密钥以确保可用性
    this.apiKey = "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";
    this.baseUrl = "https://api.tavily.com/search";

    // 同时记录环境变量中的值进行调试
    const envKey = process.env.REACT_APP_TAVILY_API_KEY;
    console.log(
      "Tavily API Key from env:",
      envKey ? "Available" : "Not available"
    );
    console.log(
      "Using API Key:",
      this.apiKey ? "Configured" : "Not configured"
    );
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
