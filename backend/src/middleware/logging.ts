import Koa from "koa";

/**
 * 日志中间件
 * 记录请求和响应信息
 */
export async function loggingMiddleware(
  ctx: Koa.Context,
  next: Function,
): Promise<void> {
  const startTime = Date.now();
  const method = ctx.method;
  const url = ctx.url;
  const ip = ctx.ip;

  console.log(`[${new Date().toISOString()}] ${method} ${url} - ${ip}`);

  try {
    await next();

    const duration = Date.now() - startTime;
    const status = ctx.status;

    console.log(
      `[${new Date().toISOString()}] ${method} ${url} - ${status} - ${duration}ms`,
    );
  } catch (error) {
    const duration = Date.now() - startTime;

    console.error(
      `[${new Date().toISOString()}] ${method} ${url} - ERROR - ${duration}ms`,
    );
    console.error(error);

    throw error;
  }
}

/**
 * 错误处理中间件
 */
export async function errorHandlerMiddleware(
  ctx: Koa.Context,
  next: Function,
): Promise<void> {
  try {
    await next();
  } catch (error: any) {
    console.error("[ErrorHandler]", error);

    ctx.status = error.status || 500;
    ctx.body = {
      success: false,
      error: error.message || "服务器内部错误",
      code: error.code || "INTERNAL_ERROR",
      timestamp: Date.now(),
    };
  }
}
