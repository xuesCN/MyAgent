# 🚀 LangGraph 服务改进方案

## 📊 当前代码分析

### ✅ 优点
- 基础 Agent 循环完整（LLM → Tool Calls → Results → Loop）
- 支持多模态消息（文本 + 图像）
- 流式输出实现
- 错误处理基本到位

### ❌ 不足之处
1. **工具太少** - 仅有搜索工具
2. **控制机制不足** - 无迭代次数限制、无超时、无错误重试
3. **上下文管理缺失** - 长对话无摘要、易超过 token 限制
4. **可观测性低** - 缺少监控、日志、性能指标
5. **提示词单调** - 系统提示硬编码，无动态调整
6. **流式输出基础** - 逐字符输出，无分块、无工具实时反馈

---

## 🎯 优先级改进方案

### 🔴 **P0 - 关键改进（必做）**

#### 1️⃣ **添加 Agent 执行控制**
```typescript
interface AgentConfig {
  maxIterations: number;      // 最大迭代次数（防止无限循环）
  timeoutMs: number;          // 执行超时（防止卡住）
  retryAttempts: number;      // 失败重试次数
}

// 使用示例
const config: AgentConfig = {
  maxIterations: 5,
  timeoutMs: 30000,
  retryAttempts: 2
};
```

**改进后的执行循环**:
```typescript
async function executeAgentFlow(
  userInput: string,
  messages: Message[],
  config: AgentConfig
): Promise<string> {
  let iterations = 0;
  const startTime = Date.now();

  while (iterations < config.maxIterations) {
    // 检查超时
    if (Date.now() - startTime > config.timeoutMs) {
      throw new Error('Agent 执行超时');
    }

    // ... LLM 调用逻辑 ...

    if (!response.tool_calls || response.tool_calls.length === 0) {
      break; // 无需继续循环
    }

    iterations++;
  }

  if (iterations >= config.maxIterations) {
    console.warn('⚠️ 达到最大迭代次数');
  }

  return response.content;
}
```

**收益**:
- ✅ 防止无限循环
- ✅ 防止长时间挂起
- ✅ 可预测的执行时间

---

#### 2️⃣ **添加更多工具**

目前只有搜索工具，建议添加：

**A. 计算工具 (Math)**
```typescript
const mathTool = tool(
  async (input: { expression: string }) => {
    try {
      // 使用 math.js 库
      const result = math.evaluate(input.expression);
      return `计算结果: ${result}`;
    } catch (error) {
      return `计算失败: ${error.message}`;
    }
  },
  {
    name: "math",
    description: "执行数学计算和表达式求值。支持复杂的数学运算。",
    schema: z.object({
      expression: z.string().describe("数学表达式，如: 2 + 2 * 3")
    })
  }
);
```

**B. 代码执行工具 (Code Interpreter)**
```typescript
const codeExecutorTool = tool(
  async (input: { code: string; language: string }) => {
    // 使用沙盒环境（如 Deno, Node.js）执行代码
    // 返回输出或错误
    return executeCodeInSandbox(input.code, input.language);
  },
  {
    name: "code_executor",
    description: "在沙盒环境中执行代码。支持 Python, JavaScript, Go 等。",
    schema: z.object({
      code: z.string().describe("要执行的代码"),
      language: z.enum(["python", "javascript", "rust", "go"])
    })
  }
);
```

**C. 数据查询工具 (Database)**
```typescript
const databaseTool = tool(
  async (input: { query: string; database: string }) => {
    // 执行数据库查询
    return queryDatabase(input.database, input.query);
  },
  {
    name: "database",
    description: "执行数据库查询。返回结构化数据。",
    schema: z.object({
      query: z.string().describe("SQL 查询语句"),
      database: z.enum(["products", "users", "orders"])
    })
  }
);
```

**D. 图像生成工具 (Image Generation)**
```typescript
const imageGenerationTool = tool(
  async (input: { prompt: string; style: string }) => {
    // 调用 DALL-E 或其他 API
    const imageUrl = await generateImage(input.prompt, input.style);
    return `生成成功: ${imageUrl}`;
  },
  {
    name: "image_generation",
    description: "根据文本描述生成图像。",
    schema: z.object({
      prompt: z.string().describe("图像描述"),
      style: z.enum(["realistic", "cartoon", "abstract"])
    })
  }
);
```

**工具注册**:
```typescript
function createLLM() {
  const config = chatService.getConfig();
  const llm = new ChatOpenAI({ /* ... */ });
  
  // 绑定所有工具
  return llm.bindTools([
    searchTool,
    mathTool,
    codeExecutorTool,
    databaseTool,
    imageGenerationTool
  ]);
}
```

**收益**:
- ✅ Agent 能力大幅提升
- ✅ 支持复杂任务
- ✅ 提供多样化功能

---

### 🟠 **P1 - 重要改进（强烈推荐）**

#### 3️⃣ **上下文管理 - 防止 Token 溢出**

```typescript
interface ContextManager {
  maxTokens: number;
  summaryThreshold: number; // 触发摘要的 token 数
}

// 消息摘要逻辑
async function summarizeMessages(
  messages: Message[],
  summaryThreshold: number
): Promise<Message[]> {
  const tokenCount = estimateTokenCount(messages);
  
  if (tokenCount > summaryThreshold) {
    // 对早期消息进行摘要
    const llm = createLLM();
    const oldMessages = messages.slice(0, -5); // 保留最后5条
    
    const summaryPrompt = `请总结以下对话，保留关键信息：\n
    ${oldMessages.map(m => `${m.sender}: ${m.content}`).join('\n')}`;
    
    const summary = await llm.invoke([new HumanMessage(summaryPrompt)]);
    
    return [
      new AIMessage(`[对话摘要]\n${summary.content}`),
      ...messages.slice(-5)
    ];
  }
  
  return messages;
}

// 使用示例
async function executeAgentFlow(userInput: string, messages: Message[]) {
  // 摘要超长对话
  const managedMessages = await summarizeMessages(messages, 8000);
  
  // 继续正常流程
  // ...
}
```

**收益**:
- ✅ 长对话支持
- ✅ Token 成本降低
- ✅ 响应更快

---

#### 4️⃣ **增强流式输出 - 实时工具反馈**

```typescript
interface StreamChunk {
  type: 'text' | 'tool_call' | 'tool_result' | 'thinking';
  content: string;
  metadata?: Record<string, any>;
}

export async function* executeAgentGraphStreamV2(
  messages: Message[]
): AsyncGenerator<StreamChunk, void, unknown> {
  try {
    const llm = createLLM();
    const llmWithTools = llm.bindTools([searchTool]);
    
    let response = await llmWithTools.invoke(messages);

    // 处理 tool calls - 实时流式返回
    while (response.tool_calls && response.tool_calls.length > 0) {
      for (const toolCall of response.tool_calls) {
        // 1. 流式返回工具调用事件
        yield {
          type: 'tool_call',
          content: toolCall.name,
          metadata: { args: toolCall.args }
        };

        try {
          // 2. 执行工具并流式返回结果
          const result = await executeTool(toolCall.name, toolCall.args);
          
          yield {
            type: 'tool_result',
            content: result,
            metadata: { toolName: toolCall.name }
          };
        } catch (error: any) {
          yield {
            type: 'tool_result',
            content: `工具执行失败: ${error.message}`,
            metadata: { toolName: toolCall.name, error: true }
          };
        }
      }

      response = await llmWithTools.invoke([...messages]); // 继续
    }

    // 3. 最终文本响应 - 逐字符流式输出
    if (response.content && typeof response.content === 'string') {
      for (const char of response.content) {
        yield {
          type: 'text',
          content: char
        };
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }
  } catch (error: any) {
    yield {
      type: 'text',
      content: `执行失败: ${error.message}`
    };
  }
}
```

**前端使用示例**:
```typescript
// 在 useChat.ts 中
async function* getStreamResponse(messages: Message[]) {
  for await (const chunk of executeAgentGraphStreamV2(messages)) {
    if (chunk.type === 'tool_call') {
      // 显示" 正在使用 搜索工具..." 提示
      setAiThinking(`正在使用 ${chunk.content} 工具...`);
    } else if (chunk.type === 'tool_result') {
      // 显示搜索结果预览
      console.log('工具结果:', chunk.content);
    } else if (chunk.type === 'text') {
      // 逐字显示最终答案
      yield chunk.content;
    }
  }
}
```

**收益**:
- ✅ 用户可见 Agent "思考过程"
- ✅ 实时工具调用反馈
- ✅ 更好的用户体验

---

#### 5️⃣ **监控和日志系统**

```typescript
interface AgentMetrics {
  startTime: number;
  endTime?: number;
  iterationCount: number;
  toolCallCount: Record<string, number>;
  errorCount: number;
  totalTokens: number;
}

class AgentLogger {
  private metrics: AgentMetrics = {
    startTime: Date.now(),
    iterationCount: 0,
    toolCallCount: {},
    errorCount: 0,
    totalTokens: 0
  };

  logToolCall(toolName: string, args: any, result: string) {
    console.log(`[Tool] ${toolName}`, { args, resultLength: result.length });
    this.metrics.toolCallCount[toolName] = (this.metrics.toolCallCount[toolName] || 0) + 1;
  }

  logIteration(iterationNum: number) {
    console.log(`[Iteration] ${iterationNum}`);
    this.metrics.iterationCount = iterationNum;
  }

  logError(error: Error) {
    console.error(`[Error]`, error.message);
    this.metrics.errorCount++;
  }

  getMetrics(): AgentMetrics {
    return {
      ...this.metrics,
      endTime: Date.now(),
      duration: Date.now() - this.metrics.startTime
    };
  }
}

// 使用示例
const logger = new AgentLogger();

async function executeAgentFlow(userInput: string, messages: Message[]) {
  let iteration = 0;
  let response = await llmWithTools.invoke(messages);

  while (response.tool_calls && response.tool_calls.length > 0) {
    iteration++;
    logger.logIteration(iteration);

    for (const toolCall of response.tool_calls) {
      try {
        const result = await executeTool(toolCall.name, toolCall.args);
        logger.logToolCall(toolCall.name, toolCall.args, result);
      } catch (error: any) {
        logger.logError(error);
      }
    }

    response = await llmWithTools.invoke([...messages]);
  }

  console.log('Agent 执行完成:', logger.getMetrics());
  return response.content;
}
```

**收益**:
- ✅ 可观测性提升
- ✅ 性能瓶颈识别
- ✅ 调试信息完整

---

### 🟡 **P2 - 优化改进（选做）**

#### 6️⃣ **动态系统提示词**

```typescript
type ConversationType = 'general' | 'coding' | 'writing' | 'analysis' | 'creative';

function getSystemPrompt(type: ConversationType): string {
  const prompts: Record<ConversationType, string> = {
    general: "你是一个专业的AI助手，请用中文回答问题。回答要简洁明了，有逻辑性。",
    
    coding: "你是一个专业的编程助手。提供代码时，请使用清晰的格式和注释。" +
            "推荐使用 const/let 而不是 var，使用箭头函数，遵循现代最佳实践。",
    
    writing: "你是一个专业的文案编辑。请提供高质量、有吸引力的文本内容。" +
             "注意语法、拼写和风格一致性。使用主动语态。",
    
    analysis: "你是一个分析专家。提供数据驱动的洞察，引用具体数据和事实。" +
              "逻辑清晰，结构明确。",
    
    creative: "你是一个创意助手。激发创意思维，提供独特的观点和想法。" +
              "大胆表达，鼓励头脑风暴。"
  };

  return prompts[type] || prompts.general;
}

// 检测对话类型
function detectConversationType(userInput: string): ConversationType {
  const codingKeywords = ['代码', 'python', 'javascript', 'function', 'bug'];
  const writingKeywords = ['文章', '文案', '广告', '文字', '创意'];
  
  if (codingKeywords.some(k => userInput.includes(k))) return 'coding';
  if (writingKeywords.some(k => userInput.includes(k))) return 'writing';
  
  return 'general';
}

// 使用示例
async function executeAgentFlow(userInput: string, messages: Message[]) {
  const convType = detectConversationType(userInput);
  const systemPrompt = getSystemPrompt(convType);
  
  const systemMessage = new SystemMessage(systemPrompt);
  const messagesToUse = [systemMessage, ...convertToLangChainMessages(messages)];
  
  // 继续正常流程
  let response = await llmWithTools.invoke(messagesToUse);
  // ...
}
```

**收益**:
- ✅ 针对性回答更精准
- ✅ 不同场景适配
- ✅ 用户满意度提升

---

#### 7️⃣ **工具结果缓存**

```typescript
class ToolResultCache {
  private cache = new Map<string, { result: string; timestamp: number }>();
  private ttl = 5 * 60 * 1000; // 5 分钟

  async execute(toolName: string, args: any): Promise<string> {
    const cacheKey = `${toolName}:${JSON.stringify(args)}`;
    
    // 检查缓存
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.ttl) {
      console.log(`[Cache Hit] ${cacheKey}`);
      return cached.result;
    }

    // 执行工具
    const result = await executeTool(toolName, args);
    
    // 保存到缓存
    this.cache.set(cacheKey, { result, timestamp: Date.now() });
    
    return result;
  }
}

const toolCache = new ToolResultCache();

// 在 executeAgentFlow 中使用
const result = await toolCache.execute(toolCall.name, toolCall.args);
```

**收益**:
- ✅ API 调用减少
- ✅ 响应速度提升
- ✅ 成本降低

---

## 📋 改进优先级总结

| 优先级 | 改进项 | 工作量 | 收益 | 推荐 |
|--------|--------|--------|------|------|
| 🔴 P0 | Agent 执行控制 | 低 | 极高 | ⭐⭐⭐⭐⭐ |
| 🔴 P0 | 添加更多工具 | 中 | 极高 | ⭐⭐⭐⭐⭐ |
| 🟠 P1 | 上下文管理 | 中 | 高 | ⭐⭐⭐⭐ |
| 🟠 P1 | 流式输出增强 | 中 | 中 | ⭐⭐⭐ |
| 🟠 P1 | 监控日志 | 低 | 中 | ⭐⭐⭐ |
| 🟡 P2 | 动态提示词 | 低 | 中 | ⭐⭐ |
| 🟡 P2 | 工具缓存 | 低 | 中 | ⭐⭐ |

---

## 🚀 快速实施方案

### **Phase 1 - 基础版（第一周）**
1. 添加 Agent 执行控制 (maxIterations, timeout)
2. 添加 2-3 个新工具（计算、代码执行）
3. 添加基础日志

**预期成果**: Agent 功能 3 倍提升，可靠性显著提高

---

### **Phase 2 - 增强版（第二周）**
1. 添加上下文管理（消息摘要）
2. 流式输出实时工具反馈
3. 工具结果缓存

**预期成果**: 用户体验明显改善，长对话支持

---

### **Phase 3 - 高级版（第三周+）**
1. 动态系统提示词
2. 更多工具集成
3. 错误重试机制
4. 性能优化

---

## 💡 建议

👉 **立即做**: P0 的两项改进（基本稳定性）
👉 **尽快做**: P1 的上下文管理（用户痛点）
👉 **可选**: P2 的优化项（锦上添花）

需要我帮你实施其中某个改进吗？推荐从 **Agent 执行控制** 开始！
