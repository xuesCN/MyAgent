import Router from "koa-router";
import { llmService } from "../services/llmService";
import { searchService } from "../services/searchService";
import { ApiResponse, Message } from "../types";

const router = new Router({ prefix: "/api" });

/**
 * 健康检查
 */
router.get("/health", async (ctx) => {
  console.log("[Health] 健康检查请求");

  const response: ApiResponse<{
    status: string;
    timestamp: number;
  }> = {
    success: true,
    data: {
      status: "ok",
      timestamp: Date.now(),
    },
    timestamp: Date.now(),
  };

  ctx.body = response;
});

/**
 * LLM 聊天 - 非流式
 */
router.post("/llm/chat", async (ctx) => {
  try {
    const { messages } = ctx.request.body as { messages: Message[] };

    if (!messages || !Array.isArray(messages)) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        error: "无效的消息格式",
        timestamp: Date.now(),
      };
      return;
    }

    console.log("[LLM Chat] 收到非流式请求，消息数:", messages.length);

    const response = await llmService.chat(messages);

    ctx.body = {
      success: true,
      data: {
        content: response,
      },
      timestamp: Date.now(),
    };
  } catch (error: any) {
    console.error("[LLM Chat] 错误:", error);

    ctx.status = 500;
    ctx.body = {
      success: false,
      error: error.message || "聊天失败",
      timestamp: Date.now(),
    };
  }
});

/**
 * LLM 聊天 - 流式
 */
router.post("/llm/chat-stream", async (ctx) => {
  try {
    const { messages } = ctx.request.body as { messages: Message[] };

    if (!messages || !Array.isArray(messages)) {
      ctx.status = 400;
      ctx.body = {
        success: false,
        error: "无效的消息格式",
        timestamp: Date.now(),
      };
      return;
    }

    console.log("[LLM Chat Stream] 收到流式请求，消息数:", messages.length);

    // 设置响应类型为流式
    ctx.type = "text/event-stream";
    ctx.set("Cache-Control", "no-cache");
    ctx.set("Connection", "keep-alive");

    // 开始流式响应
    const stream = llmService.chatStream(messages);

    for await (const chunk of stream) {
      ctx.res.write(chunk);
    }

    ctx.res.end();
  } catch (error: any) {
    console.error("[LLM Chat Stream] 错误:", error);

    ctx.status = 500;
    ctx.body = {
      success: false,
      error: error.message || "流式聊天失败",
      timestamp: Date.now(),
    };
  }
});

/**
 * 搜索
 */
router.post("/search", async (ctx) => {
  try {
    const { query } = ctx.request.body as { query: string };

    if (!query || typeof query !== "string") {
      ctx.status = 400;
      ctx.body = {
        success: false,
        error: "无效的搜索查询",
        timestamp: Date.now(),
      };
      return;
    }

    console.log("[Search] 搜索查询:", query);

    const result = await searchService.search(query);

    ctx.body = {
      success: true,
      data: result,
      timestamp: Date.now(),
    };
  } catch (error: any) {
    console.error("[Search] 错误:", error);

    ctx.status = 500;
    ctx.body = {
      success: false,
      error: error.message || "搜索失败",
      timestamp: Date.now(),
    };
  }
});

export default router;
