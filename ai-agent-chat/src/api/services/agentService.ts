import { ChatOpenAI } from "@langchain/openai";
import {
  HumanMessage,
  AIMessage,
  SystemMessage,
  BaseMessage,
  ToolMessage,
} from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import * as math from "mathjs";
import { Message, MessageContentItem } from "../../types";
import { chatService } from "./chatService";
import { tavilyService } from "./tavilyService";

const SYSTEM_PROMPT =
  "你是一个专业的AI助手，请用中文回答问题。回答要简洁明了，有逻辑性。\n\n" +
  "当你需要获取实时信息、最新新闻、当前事件、天气、股票价格等最新数据时，应该使用搜索工具。\n" +
  "当需要进行数学计算、单位转换或公式求解时，应该使用计算工具。";

const DEFAULT_MAX_STEPS = 4;

export type AgentStatus =
  | "initialized"
  | "planning"
  | "tool_running"
  | "finalizing"
  | "completed"
  | "failed";
export type PlannerNextAction = "run_tools" | "respond";
export type FinishReason = "completed" | "max_steps" | "tool_failed" | "fallback";

export interface AgentMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | MessageContentItem[];
  name?: string;
  toolCallId?: string;
  toolCalls?: PlannedToolCall[];
}

export interface PlannedToolCall {
  callId: string;
  toolName: string;
  arguments: Record<string, unknown>;
}

export interface ToolResultRecord {
  callId: string;
  toolName: string;
  arguments: Record<string, unknown>;
  ok: boolean;
  output: string;
  error?: string;
}

export interface AgentState {
  userInput: string;
  status: AgentStatus;
  messages: AgentMessage[];
  planner: {
    step: number;
    maxSteps: number;
    nextAction: PlannerNextAction;
    toolCalls: PlannedToolCall[];
    lastResponseText?: string;
  };
  tool: {
    results: ToolResultRecord[];
  };
  final: {
    answerText?: string;
    finishReason?: FinishReason;
  };
}

interface ToolCallLike {
  id?: string;
  name?: string;
  args?: Record<string, unknown>;
}

export interface LLMClientLike {
  bindTools: (
    tools: unknown[]
  ) => { invoke: (messages: BaseMessage[]) => Promise<any> };
  invoke: (messages: BaseMessage[]) => Promise<any>;
  stream: (messages: BaseMessage[]) => Promise<AsyncIterable<any>>;
}

export interface AgentRuntimeDeps {
  createLLM: (streaming?: boolean) => LLMClientLike;
  executeTool: (toolName: string, args: Record<string, unknown>) => Promise<string>;
}

export interface AgentExecutionOptions {
  userInput?: string;
  maxSteps?: number;
  deps?: Partial<AgentRuntimeDeps>;
}

const searchTool = tool(
  async (input: { query: string }) => {
    try {
      const query = typeof input.query === "string" ? input.query.trim() : "";
      if (!query) return "搜索失败：请提供有效的搜索关键词";
      const answer = await tavilyService.search(query);
      return `搜索结果：\n${answer}`;
    } catch (error: any) {
      return `搜索失败：${error.message || "未知错误"}`;
    }
  },
  {
    name: "search",
    description: "搜索最新网络信息，适用于新闻、实时事件、天气、股票等问题。",
    schema: z.object({
      query: z.string().describe("要搜索的关键词或问题"),
    }),
  }
);

const mathTool = tool(
  async (input: { expression: string }) => {
    try {
      const expression =
        typeof input.expression === "string" ? input.expression.trim() : "";
      if (!expression) return "计算失败：请提供有效的数学表达式";

      const result = math.evaluate(expression);
      const value =
        typeof result === "number" || typeof result === "string"
          ? String(result)
          : JSON.stringify(result);
      return `计算结果: ${expression} = ${value}`;
    } catch (error: any) {
      return `计算失败：${error.message || "表达式无效"}`;
    }
  },
  {
    name: "math",
    description: "执行数学计算和表达式求值。",
    schema: z.object({
      expression: z.string().describe("数学表达式"),
    }),
  }
);

function createLLM(streaming = false): LLMClientLike {
  const config = chatService.getConfig();
  return new ChatOpenAI({
    modelName: config.model,
    openAIApiKey: config.apiKey,
    apiKey: config.apiKey,
    configuration: { baseURL: config.baseURL },
    temperature: config.temperature || 0.7,
    maxTokens: config.maxTokens || 2000,
    streaming,
  }) as unknown as LLMClientLike;
}

function extractChunkText(content: unknown): string {
  if (!content) return "";
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";

  return content
    .map((item: any) =>
      typeof item === "string"
        ? item
        : item?.type === "text" && typeof item?.text === "string"
          ? item.text
          : ""
    )
    .join("");
}

function extractUserText(content: string | MessageContentItem[]): string {
  if (!Array.isArray(content)) return typeof content === "string" ? content : "";
  return content
    .filter((item): item is { type: "text"; text: string } => item.type === "text")
    .map((item) => item.text)
    .join("\n")
    .trim();
}

function toAgentMessages(messages: Message[]): AgentMessage[] {
  return messages.map((msg) => ({
    role: msg.sender === "user" ? "user" : "assistant",
    content:
      msg.sender === "user" ? msg.content : extractUserText(msg.content),
  }));
}

function toLangChainMessages(messages: AgentMessage[]): BaseMessage[] {
  const toPlainText = (content: string | MessageContentItem[]) =>
    typeof content === "string" ? content : extractUserText(content);

  return messages.map((msg) => {
    if (msg.role === "system") return new SystemMessage(toPlainText(msg.content));
    if (msg.role === "user") {
      if (typeof msg.content === "string") return new HumanMessage(msg.content);

      return new HumanMessage({
        content: msg.content.map((item) =>
          item.type === "text"
            ? { type: "text", text: item.text }
            : { type: "image_url", image_url: { url: item.image_url.url } }
        ),
      });
    }
    if (msg.role === "tool") {
      return new ToolMessage({
        content: toPlainText(msg.content),
        name: msg.name || "tool",
        tool_call_id: msg.toolCallId || "unknown",
      });
    }
    if (msg.toolCalls && msg.toolCalls.length > 0) {
      return new AIMessage({
        content: toPlainText(msg.content),
        tool_calls: msg.toolCalls.map((toolCall) => ({
          id: toolCall.callId,
          name: toolCall.toolName,
          args: toolCall.arguments,
        })),
      } as any);
    }
    return new AIMessage(toPlainText(msg.content));
  });
}

async function executeTool(
  toolName: string,
  args: Record<string, unknown>
): Promise<string> {
  if (toolName === "search") {
    const result = await searchTool.invoke(args as { query: string });
    return typeof result === "string" ? result : String(result);
  }
  if (toolName === "math") {
    const result = await mathTool.invoke(args as { expression: string });
    return typeof result === "string" ? result : String(result);
  }
  throw new Error(`未知的工具: ${toolName}`);
}

function makeId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function stableStringify(value: unknown): string {
  if (value === null || value === undefined) return "null";
  if (typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;

  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(record[k])}`).join(",")}}`;
}

function getToolSignature(toolName: string, args: Record<string, unknown>): string {
  return `${toolName}:${stableStringify(args)}`;
}

function getLastUserInput(messages: AgentMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i].role === "user") return extractUserText(messages[i].content);
  }
  return "";
}

function ensureSystemMessage(messages: AgentMessage[]): AgentMessage[] {
  if (messages.some((msg) => msg.role === "system")) return [...messages];
  return [{ role: "system", content: SYSTEM_PROMPT }, ...messages];
}

function normalizeToolCalls(rawToolCalls: unknown): PlannedToolCall[] {
  if (!Array.isArray(rawToolCalls)) return [];
  return (rawToolCalls as ToolCallLike[])
    .filter((toolCall) => typeof toolCall?.name === "string")
    .map((toolCall) => ({
      callId: toolCall.id || makeId("tool_call"),
      toolName: toolCall.name as string,
      arguments:
        toolCall.args && typeof toolCall.args === "object" ? toolCall.args : {},
    }));
}

function getFallbackAnswer(state: AgentState): string {
  const hasToolFailure = state.tool.results.some((result) => !result.ok);
  if (hasToolFailure) {
    return "抱歉，工具调用出现问题，我先根据已有上下文给出保守回答。请稍后重试。";
  }
  return "抱歉，无法生成回答。";
}

function resolveDeps(overrides?: Partial<AgentRuntimeDeps>): AgentRuntimeDeps {
  return {
    createLLM,
    executeTool,
    ...(overrides || {}),
  };
}

function createInitialAgentState(
  messages: Message[],
  options: AgentExecutionOptions = {}
): AgentState {
  const normalizedMessages = ensureSystemMessage(toAgentMessages(messages));
  return {
    userInput: options.userInput || getLastUserInput(normalizedMessages),
    status: "initialized",
    messages: normalizedMessages,
    planner: {
      step: 0,
      maxSteps: options.maxSteps || DEFAULT_MAX_STEPS,
      nextAction: "respond",
      toolCalls: [],
      lastResponseText: "",
    },
    tool: {
      results: [],
    },
    final: {},
  };
}

async function runPlanner(
  state: AgentState,
  depsOverrides?: Partial<AgentRuntimeDeps>
): Promise<AgentState> {
  const deps = resolveDeps(depsOverrides);
  state.status = "planning";
  state.planner.step += 1;

  const llmWithTools = deps.createLLM(false).bindTools([searchTool, mathTool]);
  const response = await llmWithTools.invoke(toLangChainMessages(state.messages));
  const toolCalls = normalizeToolCalls((response as any).tool_calls);
  const plannerContent = extractChunkText((response as any).content);
  state.planner.lastResponseText = plannerContent;

  // 仅在存在工具调用时写入 assistant 决策消息，保证 tool 上下文完整。
  if (toolCalls.length > 0) {
    state.messages.push({
      role: "assistant",
      content: plannerContent,
      toolCalls,
    });
  }

  state.planner.toolCalls = toolCalls;
  state.planner.nextAction = toolCalls.length > 0 ? "run_tools" : "respond";
  return state;
}

async function runTools(
  state: AgentState,
  depsOverrides?: Partial<AgentRuntimeDeps>
): Promise<AgentState> {
  const deps = resolveDeps(depsOverrides);
  state.status = "tool_running";

  const seenSignatures = new Set(
    state.tool.results.map((item) => getToolSignature(item.toolName, item.arguments))
  );

  for (const plannedCall of state.planner.toolCalls) {
    const signature = getToolSignature(plannedCall.toolName, plannedCall.arguments);
    if (seenSignatures.has(signature)) {
      state.tool.results.push({
        callId: plannedCall.callId,
        toolName: plannedCall.toolName,
        arguments: plannedCall.arguments,
        ok: false,
        output: `工具调用失败: 重复工具调用已拦截: ${plannedCall.toolName}`,
        error: "DUPLICATE_TOOL_CALL",
      });
      state.messages.push({
        role: "tool",
        name: plannedCall.toolName,
        toolCallId: plannedCall.callId,
        content: `工具调用失败: 重复工具调用已拦截: ${plannedCall.toolName}`,
      });
      continue;
    }

    seenSignatures.add(signature);
    try {
      const output = await deps.executeTool(plannedCall.toolName, plannedCall.arguments);
      const ok = !output.startsWith("搜索失败") && !output.startsWith("计算失败");

      state.tool.results.push({
        callId: plannedCall.callId,
        toolName: plannedCall.toolName,
        arguments: plannedCall.arguments,
        ok,
        output,
        error: ok ? undefined : "TOOL_RESULT_ERROR",
      });
      state.messages.push({
        role: "tool",
        name: plannedCall.toolName,
        toolCallId: plannedCall.callId,
        content: output,
      });
    } catch (error: any) {
      const output = `工具调用失败: ${error?.message || "未知错误"}`;
      state.tool.results.push({
        callId: plannedCall.callId,
        toolName: plannedCall.toolName,
        arguments: plannedCall.arguments,
        ok: false,
        output,
        error: "TOOL_EXEC_ERROR",
      });
      state.messages.push({
        role: "tool",
        name: plannedCall.toolName,
        toolCallId: plannedCall.callId,
        content: output,
      });
    }
  }

  state.planner.toolCalls = [];
  state.status = "planning";
  return state;
}

async function runPlanningToolLoop(
  state: AgentState,
  depsOverrides?: Partial<AgentRuntimeDeps>
): Promise<AgentState> {
  const deps = resolveDeps(depsOverrides);

  while (state.planner.step < state.planner.maxSteps) {
    state = await runPlanner(state, deps);
    if (state.planner.nextAction === "run_tools" && state.planner.toolCalls.length > 0) {
      state = await runTools(state, deps);
      continue;
    }
    state.status = "finalizing";
    return state;
  }

  state.status = "finalizing";
  state.final.finishReason = "max_steps";
  return state;
}

function completeFinal(state: AgentState, answerText: string): AgentState {
  const finalAnswer = answerText.trim() || getFallbackAnswer(state);
  state.final.answerText = finalAnswer;

  if (!state.final.finishReason) {
    state.final.finishReason = state.tool.results.some((r) => !r.ok)
      ? "tool_failed"
      : "completed";
  }

  state.messages.push({ role: "assistant", content: finalAnswer });
  state.status = "completed";
  return state;
}

function failFinal(state: AgentState, error: unknown): AgentState {
  console.error("Final 阶段失败:", error);
  state.final.answerText = getFallbackAnswer(state);
  state.final.finishReason = "fallback";
  state.messages.push({ role: "assistant", content: state.final.answerText });
  state.status = "failed";
  return state;
}

async function runFinalSync(
  state: AgentState,
  depsOverrides?: Partial<AgentRuntimeDeps>
): Promise<AgentState> {
  const deps = resolveDeps(depsOverrides);
  state.status = "finalizing";

  // planner 已给出最终文本时，避免再发一次 LLM 请求。
  if (state.planner.lastResponseText?.trim()) {
    return completeFinal(state, state.planner.lastResponseText);
  }

  try {
    const response = await deps.createLLM(false).invoke(toLangChainMessages(state.messages));
    return completeFinal(state, extractChunkText((response as any).content));
  } catch (error) {
    return failFinal(state, error);
  }
}

async function* runFinalStream(
  state: AgentState,
  depsOverrides?: Partial<AgentRuntimeDeps>
): AsyncGenerator<string, AgentState, unknown> {
  const deps = resolveDeps(depsOverrides);
  state.status = "finalizing";

  // planner 已给出最终文本时，直接流式返回该结果（单 chunk）。
  if (state.planner.lastResponseText?.trim()) {
    const precomputed = state.planner.lastResponseText.trim();
    yield precomputed;
    return completeFinal(state, precomputed);
  }

  let answer = "";
  let hasStreamedMeaningfulText = false;
  try {
    const stream = await deps.createLLM(true).stream(toLangChainMessages(state.messages));
    for await (const chunk of stream) {
      const text = extractChunkText((chunk as any).content);
      if (!text) continue;
      answer += text;
      // 只把“有实际可见文本”的 chunk 视作已成功输出，避免空白 chunk 造成空消息。
      const isMeaningful = text.trim().length > 0;
      if (isMeaningful) {
        hasStreamedMeaningfulText = true;
      }
      if (hasStreamedMeaningfulText) {
        yield text;
      }
    }

    // 某些供应商在 stream 模式下可能不返回任何文本 chunk。
    // 兜底走一次非流式请求，避免 UI 出现空回复占位。
    if (!hasStreamedMeaningfulText) {
      const syncResponse = await deps
        .createLLM(false)
        .invoke(toLangChainMessages(state.messages));
      const syncText = extractChunkText((syncResponse as any).content);
      const completedState = completeFinal(state, syncText);
      if (completedState.final.answerText) {
        yield completedState.final.answerText;
      }
      return completedState;
    }

    return completeFinal(state, answer);
  } catch (error) {
    const failedState = failFinal(state, error);
    // 避免在已有 partial 输出后再追加 fallback 文案，导致内容混杂。
    if (!hasStreamedMeaningfulText && failedState.final.answerText) {
      yield failedState.final.answerText;
    }
    return failedState;
  }
}

export async function executeAgentStateSync(
  messages: Message[],
  options: AgentExecutionOptions = {}
): Promise<AgentState> {
  const deps = resolveDeps(options.deps);
  let state = createInitialAgentState(messages, options);
  state = await runPlanningToolLoop(state, deps);
  return runFinalSync(state, deps);
}

/**
 * 主流式入口（前端默认应使用此函数）。
 * 仅输出文本 chunk，最终 return 完整 AgentState。
 */
export async function* executeAgentStream(
  messages: Message[],
  options: AgentExecutionOptions = {}
): AsyncGenerator<string, AgentState, unknown> {
  const deps = resolveDeps(options.deps);
  let state = createInitialAgentState(messages, options);
  state = await runPlanningToolLoop(state, deps);

  const iterator = runFinalStream(state, deps);
  while (true) {
    const item = await iterator.next();
    if (item.done) return item.value;
    if (item.value) yield item.value;
  }
}

/**
 * @deprecated 兼容旧测试/旧调用：该函数并不输出完整 state 事件流，
 * 仅将 executeAgentStream 的文本 chunk 包装为 { chunk }。
 * 新代码请改用 executeAgentStream。
 */
export async function* executeAgentStateStream(
  messages: Message[],
  options: AgentExecutionOptions = {}
): AsyncGenerator<{ chunk: string }, AgentState, unknown> {
  const iterator = executeAgentStream(messages, options);
  while (true) {
    const item = await iterator.next();
    if (item.done) return item.value;
    yield { chunk: item.value };
  }
}

/**
 * @deprecated 历史命名兼容入口。
 * 新代码请改用 executeAgentStream。
 */
export async function* executeAgentGraphStream(
  messages: Message[]
): AsyncGenerator<string, void, unknown> {
  try {
    const iterator = executeAgentStream(messages);
    while (true) {
      const item = await iterator.next();
      if (item.done) break;
      if (item.value) yield item.value;
    }
  } catch (error: any) {
    console.error("Agent 执行失败:", error);
    yield `执行失败: ${error.message || "未知错误"}`;
  }
}

/**
 * @deprecated 历史同步入口。
 * 新代码优先使用 executeAgentStateSync 并在上层取 final.answerText。
 */
export async function executeAgentGraphSync(
  userInput: string,
  messages: Message[]
): Promise<string> {
  const state = await executeAgentStateSync(messages, { userInput });
  return state.final.answerText || "抱歉，无法生成回答。";
}

// 测试/调试辅助导出（非主链路）
export const agentServiceTestUtils = {
  SYSTEM_PROMPT,
  resolveDeps,
  normalizeToolCalls,
  extractUserText,
  getToolSignature,
};

/**
 * @deprecated 兼容旧命名，请使用 agentServiceTestUtils。
 */
export const __internal = agentServiceTestUtils;
