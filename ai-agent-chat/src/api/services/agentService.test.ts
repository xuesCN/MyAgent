import { jest, describe, it, expect } from "@jest/globals";

jest.mock("@langchain/openai", () => ({
  ChatOpenAI: class MockChatOpenAI {},
}));

jest.mock("@langchain/core/messages", () => {
  class BaseMockMessage {
    content: any;

    constructor(content: any) {
      this.content = content;
    }
  }

  class HumanMessage extends BaseMockMessage {}
  class AIMessage extends BaseMockMessage {}
  class SystemMessage extends BaseMockMessage {}
  class ToolMessage extends BaseMockMessage {
    name?: string;
    tool_call_id?: string;

    constructor(payload: any) {
      super(payload.content);
      this.name = payload.name;
      this.tool_call_id = payload.tool_call_id;
    }
  }

  return {
    HumanMessage,
    AIMessage,
    SystemMessage,
    BaseMessage: BaseMockMessage,
    ToolMessage,
  };
});

jest.mock("@langchain/core/tools", () => ({
  tool: (fn: any, config: any) => ({
    ...config,
    invoke: fn,
  }),
}));

import {
  executeAgentStateSync,
  executeAgentStream,
  AgentRuntimeDeps,
} from "./agentService";
import { Message } from "../../types";

function createMessages(input: string): Message[] {
  return [
    {
      id: "u1",
      sender: "user",
      content: input,
      timestamp: new Date("2026-03-24T00:00:00.000Z"),
    },
  ];
}

function createMockDeps(params: {
  plannerResponses: any[];
  finalResponse?: any;
  toolExecutor?: (toolName: string, args: Record<string, unknown>) => Promise<string>;
}): AgentRuntimeDeps {
  let plannerIndex = 0;

  return {
    createLLM: (streaming = false) => ({
      bindTools: () => ({
        invoke: async () => {
          const current =
            params.plannerResponses[
              Math.min(plannerIndex, params.plannerResponses.length - 1)
            ];
          plannerIndex += 1;
          return current;
        },
      }),
      invoke: async () => params.finalResponse || { content: "默认最终回答" },
      stream: async () => {
        async function* gen() {
          if (streaming) {
            const text =
              (params.finalResponse?.content as string) || "默认流式回答";
            const mid = Math.max(1, Math.floor(text.length / 2));
            yield { content: text.slice(0, mid) };
            yield { content: text.slice(mid) };
          }
        }
        return gen();
      },
    }),
    executeTool:
      params.toolExecutor ||
      (async (toolName) => {
        return `${toolName} ok`;
      }),
  };
}

describe("agentService state pipeline", () => {
  it("普通问答: 不需要工具调用", async () => {
    const deps = createMockDeps({
      plannerResponses: [{ content: "这是普通问答的最终答案。", tool_calls: [] }],
      finalResponse: { content: "这是普通问答的最终答案。" },
    });

    const state = await executeAgentStateSync(createMessages("你好"), {
      deps,
      maxSteps: 3,
    });

    expect(state.status).toBe("completed");
    expect(state.final.answerText).toContain("普通问答");
    expect(state.tool.results).toHaveLength(0);
  });

  it("搜索场景: 规划调用 search 并写入结构化结果", async () => {
    const deps = createMockDeps({
      plannerResponses: [
        {
          content: "",
          tool_calls: [{ id: "call_search_1", name: "search", args: { query: "今天科技新闻" } }],
        },
        { content: "这是基于搜索结果的最终回答。", tool_calls: [] },
      ],
      finalResponse: { content: "这是基于搜索结果的最终回答。" },
      toolExecutor: async (toolName, args) =>
        `搜索结果：${toolName}-${(args.query as string) || ""}`,
    });

    const state = await executeAgentStateSync(createMessages("今天科技新闻"), {
      deps,
      maxSteps: 4,
    });

    expect(state.status).toBe("completed");
    expect(state.tool.results).toHaveLength(1);
    expect(state.tool.results[0].toolName).toBe("search");
    expect(state.tool.results[0].ok).toBe(true);
  });

  it("计算场景: 规划调用 math 并返回结果", async () => {
    const deps = createMockDeps({
      plannerResponses: [
        {
          content: "",
          tool_calls: [{ id: "call_math_1", name: "math", args: { expression: "2+2*3" } }],
        },
        { content: "计算结果是 8。", tool_calls: [] },
      ],
      finalResponse: { content: "计算结果是 8。" },
      toolExecutor: async () => "计算结果: 2+2*3 = 8",
    });

    const state = await executeAgentStateSync(createMessages("2+2*3 等于多少"), {
      deps,
      maxSteps: 4,
    });

    expect(state.status).toBe("completed");
    expect(state.tool.results).toHaveLength(1);
    expect(state.tool.results[0].toolName).toBe("math");
    expect(state.tool.results[0].ok).toBe(true);
    expect(state.final.answerText).toContain("8");
  });

  it("工具异常场景: 记录失败并触发失败降级", async () => {
    const deps = createMockDeps({
      plannerResponses: [
        {
          content: "",
          tool_calls: [{ id: "call_math_fail_1", name: "math", args: { expression: "1/0" } }],
        },
        { content: "我尝试调用工具但失败了，先给你保守说明。", tool_calls: [] },
      ],
      finalResponse: { content: "我尝试调用工具但失败了，先给你保守说明。" },
      toolExecutor: async () => {
        throw new Error("mock tool failure");
      },
    });

    const state = await executeAgentStateSync(createMessages("帮我算 1/0"), {
      deps,
      maxSteps: 4,
    });

    expect(state.status).toBe("completed");
    expect(state.tool.results).toHaveLength(1);
    expect(state.tool.results[0].ok).toBe(false);
    expect(state.final.finishReason).toBe("tool_failed");
  });

  it("stream 与 sync: 最终结果基本一致", async () => {
    const depsSync = createMockDeps({
      plannerResponses: [{ content: "流式与同步应一致", tool_calls: [] }],
      finalResponse: { content: "流式与同步应一致" },
    });
    const syncState = await executeAgentStateSync(createMessages("一致性测试"), {
      deps: depsSync,
      maxSteps: 3,
    });

    const depsStream = createMockDeps({
      plannerResponses: [{ content: "流式与同步应一致", tool_calls: [] }],
      finalResponse: { content: "流式与同步应一致" },
    });
    const stream = executeAgentStream(createMessages("一致性测试"), {
      deps: depsStream,
      maxSteps: 3,
    });

    let streamText = "";
    while (true) {
      const item = await stream.next();
      if (item.done) break;
      streamText += item.value;
    }

    expect(syncState.final.answerText).toBe("流式与同步应一致");
    expect(streamText).toBe(syncState.final.answerText);
  });

  it("stream 无 chunk 时: 自动走非流式兜底并返回最终文本", async () => {
    const deps: AgentRuntimeDeps = {
      createLLM: (streaming = false) => ({
        bindTools: () => ({
          invoke: async () => ({ content: "", tool_calls: [] }),
        }),
        invoke: async () => ({ content: "兜底非流式答案" }),
        stream: async () => {
          async function* gen() {
            if (streaming) {
              // 故意不产出任何 chunk
            }
          }
          return gen();
        },
      }),
      executeTool: async (toolName) => `${toolName} ok`,
    };

    const stream = executeAgentStream(createMessages("空流测试"), {
      deps,
      maxSteps: 3,
    });

    let streamText = "";
    while (true) {
      const item = await stream.next();
      if (item.done) break;
      streamText += item.value;
    }

    expect(streamText).toBe("兜底非流式答案");
  });

  it("stream 仅空白 chunk 且中断时: 返回 fallback，避免空回复", async () => {
    const deps: AgentRuntimeDeps = {
      createLLM: (streaming = false) => ({
        bindTools: () => ({
          invoke: async () => ({ content: "", tool_calls: [] }),
        }),
        invoke: async () => ({ content: "不应触发该分支" }),
        stream: async () => {
          async function* gen() {
            if (streaming) {
              yield { content: "\n  " };
              throw new Error("mock stream interrupted");
            }
          }
          return gen();
        },
      }),
      executeTool: async (toolName) => `${toolName} ok`,
    };

    const stream = executeAgentStream(createMessages("空白流测试"), {
      deps,
      maxSteps: 3,
    });

    let streamText = "";
    while (true) {
      const item = await stream.next();
      if (item.done) break;
      streamText += item.value;
    }

    expect(streamText).toBe("抱歉，无法生成回答。");
  });
});
