import { config } from "../config";
import { SearchResult } from "../types";

/**
 * 搜索服务代理
 * 职责：代理 Tavily Search API，处理搜索请求
 */
class SearchService {
  /**
   * 执行搜索
   */
  async search(query: string): Promise<SearchResult> {
    try {
      console.log("[SearchService] 搜索查询:", query);

      const response = await fetch(config.tavily.baseURL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          api_key: config.tavily.apiKey,
          query,
          include_answer: "advanced",
          search_depth: "advanced",
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`搜索失败: ${response.status} ${errorText}`);
      }

      const data = (await response.json()) as any;

      console.log(
        "[SearchService] 搜索完成，返回答案长度:",
        data.answer?.length || 0,
      );

      return {
        answer: data.answer || "无法获取搜索结果",
        results: data.results || [],
      };
    } catch (error) {
      console.error("[SearchService] 搜索错误:", error);
      throw error;
    }
  }

  /**
   * 测试连接
   */
  async testConnection(): Promise<boolean> {
    try {
      console.log("[SearchService] 测试连接...");
      const result = await this.search("test");
      return !!result.answer;
    } catch (error) {
      console.error("[SearchService] 连接测试失败:", error);
      return false;
    }
  }
}

export const searchService = new SearchService();
