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
import { Message, MessageContentItem } from "../../types";
import { chatService } from "./chatService";
import { tavilyService } from "./tavilyService";

// 搜索工具定义
const searchTool = tool(
  async (input: { query: string }) => {
    try {
      const searchQuery = input.query;

      if (
        !searchQuery ||
        typeof searchQuery !== "string" ||
        searchQuery.trim() === ""
      ) {
        return "搜索失败：请提供有效的搜索关键词";
      }

      console.log(`[搜索工具] 正在搜索: ${searchQuery}`);

      // 使用浏览器兼容的 tavilyService
      const searchResult = await tavilyService.search(searchQuery);

      return `搜索结果：\n${searchResult}`;
    } catch (error: any) {
      console.error("搜索工具错误:", error);
      return `搜索失败：${error.message || "未知错误"}`;
    }
  },
  {
    name: "search",
    description:
      "使用 Tavily 搜索引擎搜索最新的网络信息。当你需要获取实时信息、最新新闻、当前事件、天气、股票价格等最新数据时，应该使用此工具。",
    schema: z.object({
      query: z.string().describe("要搜索的关键词或问题"),
    }),
  }
);

// 创建 LLM（使用火山云 API）
function createLLM() {
  const config = chatService.getConfig();
  console.log("[LangGraphService] 使用的LLM配置:", config);

  // 直接传入API密钥，同时设置环境变量作为备选
  process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || config.apiKey;

  return new ChatOpenAI({
    modelName: config.model,
    openAIApiKey: config.apiKey,
    apiKey: config.apiKey, // 添加apiKey参数以兼容不同版本的LangChain
    configuration: {
      baseURL: config.baseURL,
    },
    temperature: config.temperature || 0.7,
    maxTokens: config.maxTokens || 2000,
    streaming: false,
  });
}

// 将前端 Message 转换为 LangChain Message
function convertToLangChainMessages(messages: Message[]): BaseMessage[] {
  return messages.map((msg) => {
    if (msg.sender === "user") {
      // 检查消息内容类型
      if (Array.isArray(msg.content)) {
        // 多模态消息
        return new HumanMessage({
          content: msg.content.map((item) => {
            if (item.type === "image_url") {
              return {
                type: "image_url",
                image_url: {
                  url: item.image_url.url,
                },
              };
            } else {
              return {
                type: "text",
                text: item.text,
              };
            }
          }),
        });
      } else {
        // 普通文本消息
        return new HumanMessage(msg.content);
      }
    } else {
      return new AIMessage(msg.content as string);
    }
  });
}

// 执行工具调用
async function executeTool(toolName: string, args: any): Promise<string> {
  if (toolName === "search") {
    const result = await searchTool.invoke(args);
    // 确保返回字符串
    return typeof result === "string" ? result : String(result);
  }
  throw new Error(`未知的工具: ${toolName}`);
}

// 简化的Agent工作流实现
async function executeAgentFlow(
  userInput: string,
  messages: Message[]
): Promise<string> {
  // 转换消息格式
  const langChainMessages = convertToLangChainMessages(messages);

  // 创建LLM实例
  const llm = createLLM();
  const llmWithTools = llm.bindTools([searchTool]);

  // 添加系统提示（只在第一次调用时添加）
  const systemMessage = new SystemMessage(
    "你是一个专业的AI助手，请用中文回答问题。回答要简洁明了，有逻辑性。\n\n" +
      "当你需要获取实时信息、最新新闻、当前事件、天气、股票价格等最新数据时，应该使用搜索工具。"
  );

  // 确保系统消息只添加一次
  const hasSystemMessage = langChainMessages.some(
    (msg) => msg instanceof SystemMessage
  );
  const messagesToUse = hasSystemMessage
    ? langChainMessages
    : [systemMessage, ...langChainMessages];

  // 执行LLM调用
  let response = await llmWithTools.invoke(messagesToUse);

  // 检查是否需要调用工具
  while (
    (response as any).tool_calls &&
    (response as any).tool_calls.length > 0
  ) {
    // 执行所有工具调用
    const toolResults: ToolMessage[] = [];
    for (const toolCall of (response as any).tool_calls) {
      try {
        console.log(`[LangGraph] 执行工具: ${toolCall.name}`, toolCall.args);
        const result = await executeTool(toolCall.name, toolCall.args);
        toolResults.push(
          new ToolMessage({
            content: result,
            name: toolCall.name,
            tool_call_id: toolCall.id,
          })
        );
      } catch (error: any) {
        console.error(`[LangGraph] 工具调用失败: ${toolCall.name}`, error);
        toolResults.push(
          new ToolMessage({
            content: `工具调用失败: ${error.message}`,
            name: toolCall.name,
            tool_call_id: toolCall.id,
          })
        );
      }
    }

    // 将工具结果添加到消息列表中
    messagesToUse.push(response);
    messagesToUse.push(...toolResults);

    // 再次调用LLM获取最终结果
    response = await llmWithTools.invoke(messagesToUse);
  }

  // 返回最终回答
  if (response.content && typeof response.content === "string") {
    return response.content;
  }

  return "抱歉，无法生成回答。";
}

// 执行工作流（流式版本）
export async function* executeAgentGraphStream(
  messages: Message[]
): AsyncGenerator<string, void, unknown> {
  try {
    // 从最后一个用户消息获取输入内容
    const userMessages = messages.filter((msg) => msg.sender === "user");
    const lastUserMessage = userMessages[userMessages.length - 1];
    let userInput: string;

    if (lastUserMessage && Array.isArray(lastUserMessage.content)) {
      // 提取文本内容
      const textItems = (
        lastUserMessage.content as MessageContentItem[]
      ).filter(
        (item): item is { type: "text"; text: string } => item.type === "text"
      );
      userInput = textItems.length > 0 ? textItems[0].text : "";
    } else {
      userInput = (lastUserMessage?.content as string) || "";
    }

    // 执行 Agent 流程
    const finalResponse = await executeAgentFlow(userInput, messages);

    // 模拟流式输出：逐字符输出最终响应
    if (finalResponse) {
      for (let i = 0; i < finalResponse.length; i++) {
        yield finalResponse[i];
        // 添加小延迟以模拟流式效果
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
    }
  } catch (error: any) {
    console.error("Agent 执行失败:", error);
    const errorMsg = `执行失败: ${error.message || "未知错误"}`;
    for (let i = 0; i < errorMsg.length; i++) {
      yield errorMsg[i];
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  }
}

// 执行工作流（非流式版本）
export async function executeAgentGraphSync(
  userInput: string,
  messages: Message[]
): Promise<string> {
  return await executeAgentFlow(userInput, messages);
}
