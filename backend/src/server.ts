import { config, validateConfig } from "./config";
import createApp from "./app";
import { llmService } from "./services/llmService";
import { searchService } from "./services/searchService";

/**
 * 启动服务器
 */
async function startServer() {
  try {
    // 验证配置
    console.log("📋 验证配置...");
    validateConfig();

    // 测试 API 连接
    console.log("🔗 测试 API 连接...");

    const llmConnected = await llmService.testConnection();
    if (llmConnected) {
      console.log("✅ Volcano Cloud LLM 连接成功");
    } else {
      console.warn("⚠️  Volcano Cloud LLM 连接失败，请检查 API 密钥");
    }

    const searchConnected = await searchService.testConnection();
    if (searchConnected) {
      console.log("✅ Tavily Search 连接成功");
    } else {
      console.warn("⚠️  Tavily Search 连接失败，请检查 API 密钥");
    }

    // 创建应用
    console.log("🚀 创建 Koa 应用...");
    const app = createApp();

    // 启动服务器
    console.log(`🌍 启动服务器在端口 ${config.port}...`);
    app.listen(config.port, () => {
      console.log(`\n${"=".repeat(50)}`);
      console.log(`✨ 后端服务已启动`);
      console.log(`📍 地址: http://localhost:${config.port}`);
      console.log(`🔧 环境: ${config.nodeEnv}`);
      console.log(`📊 日志级别: ${config.logLevel}`);
      console.log(`${"=".repeat(50)}\n`);

      console.log("可用的端点:");
      console.log(`  GET  /api/health              - 健康检查`);
      console.log(`  POST /api/llm/chat            - LLM 聊天（非流式）`);
      console.log(`  POST /api/llm/chat-stream     - LLM 聊天（流式）`);
      console.log(`  POST /api/search              - 搜索\n`);
    });
  } catch (error) {
    console.error("❌ 启动失败:", error);
    process.exit(1);
  }
}

// 启动
startServer();
