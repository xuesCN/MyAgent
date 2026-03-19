import Koa from "koa";
import { config } from "../config";
import { ErrorResponse } from "../types";

/**
 * 速率限制中间件
 * 基于 IP 地址进行速率限制
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const requestMap = new Map<string, RateLimitEntry>();

export async function rateLimitMiddleware(
  ctx: Koa.Context,
  next: Function,
): Promise<void> {
  const ip = ctx.ip;
  const now = Date.now();

  // 获取当前 IP 的请求记录
  let entry = requestMap.get(ip);

  // 如果记录已过期，创建新的
  if (!entry || now >= entry.resetTime) {
    entry = {
      count: 0,
      resetTime: now + config.rateLimit.window,
    };
    requestMap.set(ip, entry);
  }

  // 检查是否超过限制
  if (entry.count >= config.rateLimit.maxRequests) {
    console.warn(`[RateLimit] IP ${ip} 超过限制，当前计数: ${entry.count}`);

    ctx.status = 429;
    const response: ErrorResponse = {
      success: false,
      error: "请求过于频繁，请稍后再试",
      code: "RATE_LIMIT_EXCEEDED",
      timestamp: Date.now(),
    };
    ctx.body = response;
    return;
  }

  // 增加计数
  entry.count++;

  // 设置响应头
  ctx.set("X-RateLimit-Limit", config.rateLimit.maxRequests.toString());
  ctx.set(
    "X-RateLimit-Remaining",
    (config.rateLimit.maxRequests - entry.count).toString(),
  );
  ctx.set("X-RateLimit-Reset", entry.resetTime.toString());

  if (config.debug) {
    console.log(
      `[RateLimit] IP ${ip}: ${entry.count}/${config.rateLimit.maxRequests}`,
    );
  }

  await next();
}
