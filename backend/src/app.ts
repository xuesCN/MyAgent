import Koa from "koa";
import cors from "koa-cors";
import bodyParser from "koa-body";
import { config } from "./config";
import {
  loggingMiddleware,
  errorHandlerMiddleware,
} from "./middleware/logging";
import { rateLimitMiddleware } from "./middleware/rateLimit";
import router from "./routes";

/**
 * 创建 Koa 应用
 */
export function createApp(): Koa {
  const app = new Koa();

  // 错误处理中间件（最先）
  app.use(errorHandlerMiddleware);

  // 日志中间件
  app.use(loggingMiddleware);

  // CORS 中间件
  app.use(
    cors({
      origin: config.cors.origin,
      credentials: true,
    }),
  );

  // 请求体解析
  app.use(
    bodyParser({
      jsonLimit: "10mb",
      formLimit: "10mb",
    }),
  );

  // 速率限制
  app.use(rateLimitMiddleware);

  // 路由
  app.use(router.routes());
  app.use(router.allowedMethods());

  // 404 处理
  app.use(async (ctx) => {
    ctx.status = 404;
    ctx.body = {
      success: false,
      error: "未找到请求的资源",
      timestamp: Date.now(),
    };
  });

  return app;
}

export default createApp;
