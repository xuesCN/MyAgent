import dotenv from "dotenv";

dotenv.config();

export const config = {
  // 服务器配置
  nodeEnv: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "3001", 10),
  isDev: process.env.NODE_ENV === "development",

  // Volcano Cloud LLM API
  volcano: {
    apiKey: process.env.VOLCANO_API_KEY || "",
    baseURL:
      process.env.VOLCANO_BASE_URL ||
      "https://ark.cn-beijing.volces.com/api/v3",
    model: process.env.VOLCANO_MODEL || "doubao-seed-1-6-251015",
  },

  // Tavily API
  tavily: {
    apiKey: process.env.TAVILY_API_KEY || "",
    baseURL: "https://api.tavily.com/search",
  },

  // 应用配置
  debug: process.env.DEBUG === "true",
  logLevel: process.env.LOG_LEVEL || "info",

  // 速率限制
  rateLimit: {
    window: parseInt(process.env.RATE_LIMIT_WINDOW || "60000", 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100", 10),
  },

  // CORS 配置
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  },
};

// 验证必要的配置
export function validateConfig() {
  const required = ["VOLCANO_API_KEY", "TAVILY_API_KEY"];

  for (const key of required) {
    if (!process.env[key]) {
      console.warn(`⚠️  Warning: ${key} is not configured`);
    }
  }
}
