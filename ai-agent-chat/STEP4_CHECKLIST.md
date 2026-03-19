# 🎯 STEP 4: 核心 Hook 重构 - 详细任务清单

## ⚠️ 风险等级：🔴 极高（需谨慎）

---

## 📋 总体目标

将 **451 行、混杂 6 个职责** 的 `useChat.ts` 重构为 **3 个清晰独立的 Hook**：

```
useChat.ts (451行，混杂)
    ↓ 拆分为 ↓
├─ useSessionManagement.ts (~80行)    ✓ 会话管理
├─ useMessageManagement.ts (~100行)   ✓ 消息管理
└─ useAgentChat.ts (~150行)           ✓ 核心集成
```

---

## 🗂️ 任务分解

### Task 1: 创建 `useSessionManagement.ts`

**文件**: `src/hooks/useSessionManagement.ts`  
**预估行数**: 80-100 行  
**依赖**: `storageService`, `ChatSession` 类型

#### 1.1 Hook 接口

```typescript
interface UseSessionManagementResult {
  sessions: ChatSession[];
  createSession: (title?: string) => Promise<ChatSession>;
  deleteSession: (sessionId: string) => Promise<void>;
  updateSession: (session: ChatSession) => Promise<void>;
}

export const useSessionManagement = (): UseSessionManagementResult => {
  // ...
}
```

#### 1.2 核心逻辑提取

**从 `useChat.ts` 提取**:

```typescript
// L21-32: 初始化加载会话
useEffect(() => {
  const loadSessions = async () => {
    const sessions = await storageService.getSessions();
    setSessions(sessions);
  };
  loadSessions();
}, []);

// L88-120: createSession
const createSession = useCallback(
  async (title: string = "新对话") => { ... },
  [chatState.sessions]
);

// L123-135: deleteSession
const deleteSession = useCallback(
  async (sessionId: string) => { ... },
  [chatState.sessions]
);

// L138-148: switchSession (改名为内部逻辑)
const switchSession = useCallback(
  (sessionId: string) => {
    const session = sessions.find((s) => s.id === sessionId);
    if (session) {
      // setChatState...
    }
  },
  [sessions]
);
```

#### 1.3 需要新增的函数

```typescript
// updateSession - 更新现有会话
const updateSession = useCallback(
  async (updatedSession: ChatSession) => {
    const newSessions = sessions.map((s) =>
      s.id === updatedSession.id ? updatedSession : s
    );
    setSessions(newSessions);
    await storageService.saveSessions(newSessions);
  },
  [sessions]
);
```

#### 1.4 测试点

- [ ] 初始化时正确加载会话
- [ ] 创建新会话
- [ ] 删除会话
- [ ] 更新会话
- [ ] localStorage 正确保存

---

### Task 2: 创建 `useMessageManagement.ts`

**文件**: `src/hooks/useMessageManagement.ts`  
**预估行数**: 100-120 行  
**依赖**: `Message`, `MessageContentItem` 类型

#### 2.1 Hook 接口

```typescript
interface UseMessageManagementResult {
  addUserMessage: (
    content: string,
    imageUrl?: string
  ) => Message | null;
  addAIPlaceholder: () => Message | null;
  updateAIMessage: (
    messageId: string,
    content: string,
    isComplete: boolean
  ) => void;
}

export const useMessageManagement = (
  currentSession: ChatSession | null,
  onSessionUpdate: (session: ChatSession) => void
): UseMessageManagementResult => {
  // ...
}
```

#### 2.2 核心逻辑提取

**从 `useChat.ts` 提取**:

```typescript
// L158-215: 消息格式化和创建
const createMessageContent = (content: string, imageUrl?: string) => {
  if (imageUrl) {
    const contentItems: MessageContentItem[] = [
      { type: 'image_url', image_url: { url: imageUrl } },
    ];
    if (content.trim()) {
      contentItems.push({ type: 'text', text: content.trim() });
    }
    return contentItems;
  }
  return content.trim();
};

// L218-245: 用户消息添加
const addUserMessage = useCallback(
  (content: string, imageUrl?: string) => {
    if (!currentSession) return null;
    
    const messageContent = createMessageContent(content, imageUrl);
    const userMessage: Message = {
      id: Date.now().toString(),
      content: messageContent,
      sender: 'user',
      timestamp: new Date(),
    };
    
    const updatedSession = {
      ...currentSession,
      messages: [...currentSession.messages, userMessage],
      updatedAt: new Date(),
    };
    
    onSessionUpdate(updatedSession);
    return userMessage;
  },
  [currentSession, onSessionUpdate]
);

// L250-260: AI 占位符添加
const addAIPlaceholder = useCallback(() => {
  if (!currentSession) return null;
  
  const aiMessage: Message = {
    id: (Date.now() + 1).toString(),
    content: '',
    sender: 'ai',
    timestamp: new Date(),
    isStreaming: true,
  };
  
  const updatedSession = {
    ...currentSession,
    messages: [...currentSession.messages, aiMessage],
    updatedAt: new Date(),
  };
  
  onSessionUpdate(updatedSession);
  return aiMessage;
}, [currentSession, onSessionUpdate]);

// L307-315: AI 消息更新
const updateAIMessage = useCallback(
  (messageId: string, content: string, isComplete: boolean = false) => {
    if (!currentSession) return;
    
    const updatedMessages = currentSession.messages.map((msg) =>
      msg.id === messageId
        ? { ...msg, content, isStreaming: !isComplete }
        : msg
    );
    
    onSessionUpdate({
      ...currentSession,
      messages: updatedMessages,
      updatedAt: new Date(),
    });
  },
  [currentSession, onSessionUpdate]
);
```

#### 2.3 测试点

- [ ] 添加用户文本消息
- [ ] 添加用户图片+文本消息
- [ ] 创建 AI 占位符
- [ ] 更新 AI 消息内容
- [ ] 标记消息流式完成

---

### Task 3: 创建 `useAgentChat.ts`（新的主 Hook）

**文件**: `src/hooks/useAgentChat.ts`  
**预估行数**: 150-180 行  
**依赖**: `useSessionManagement`, `useMessageManagement`, `executeAgentGraphStream`

#### 3.1 Hook 接口

```typescript
interface ChatStateType {
  currentSession: ChatSession | null;
  sessions: ChatSession[];
  isLoading: boolean;
  error: string | null;
}

interface UseAgentChatResult {
  chatState: ChatStateType;
  createSession: (title?: string) => Promise<void>;
  switchSession: (sessionId: string) => void;
  deleteSession: (sessionId: string) => Promise<void>;
  sendMessage: (
    content: string,
    useSearch?: boolean,
    imageUrl?: string
  ) => Promise<void>;
  initializeDefaultSession: () => Promise<void>;
}

export const useAgentChat = (): UseAgentChatResult => {
  // ...
}
```

#### 3.2 核心逻辑

```typescript
export const useAgentChat = () => {
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { sessions, createSession, deleteSession, updateSession } = 
    useSessionManagement();
  
  const { addUserMessage, addAIPlaceholder, updateAIMessage } =
    useMessageManagement(currentSession, (updated) => {
      setCurrentSession(updated);
      // 同步到 sessions 列表
      // 保存到 localStorage
    });
  
  // 初始化
  const initializeDefaultSession = useCallback(async () => {
    if (sessions.length === 0) {
      const newSession = await createSession('欢迎对话');
      setCurrentSession(newSession);
    } else if (!currentSession) {
      setCurrentSession(sessions[0]);
    }
  }, [sessions, currentSession, createSession]);
  
  // 切换会话
  const switchSession = useCallback(
    (sessionId: string) => {
      const session = sessions.find((s) => s.id === sessionId);
      if (session) {
        setCurrentSession(session);
      }
    },
    [sessions]
  );
  
  // 核心发送消息逻辑
  const sendMessage = useCallback(
    async (content: string, useSearch?: boolean, imageUrl?: string) => {
      if (!currentSession || (!content.trim() && !imageUrl)) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // 1. 添加用户消息
        addUserMessage(content, imageUrl);
        
        // 2. 添加 AI 占位符
        const aiMessage = addAIPlaceholder();
        if (!aiMessage) throw new Error('Failed to create AI message');
        
        // 3. 获取 AI 响应（流式）
        let aiContent = '';
        const stream = executeAgentGraphStream(currentSession.messages);
        
        for await (const chunk of stream) {
          aiContent += chunk;
          updateAIMessage(aiMessage.id, aiContent, false);
        }
        
        // 4. 标记完成
        updateAIMessage(aiMessage.id, aiContent, true);
        
        setIsLoading(false);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : '发送消息失败';
        setError(errorMsg);
        setIsLoading(false);
      }
    },
    [currentSession, addUserMessage, addAIPlaceholder, updateAIMessage]
  );
  
  return {
    chatState: { currentSession, sessions, isLoading, error },
    createSession,
    switchSession,
    deleteSession,
    sendMessage,
    initializeDefaultSession,
  };
};
```

#### 3.3 关键改动

- **状态同步**: currentSession 更新时同步到 App.tsx
- **localStorage 优化**: 一次性保存而非多次保存
- **错误处理**: 完整的 try-catch 和错误状态
- **加载状态**: 区分加载中状态

#### 3.4 测试点

- [ ] 初始化默认会话
- [ ] 创建新会话
- [ ] 切换会话
- [ ] 发送消息并接收 AI 响应
- [ ] 错误处理
- [ ] 加载状态显示

---

### Task 4: 修改 `src/App.tsx`

**文件**: `src/App.tsx`  
**变化**: 替换 Hook 导入和使用

#### 4.1 修改内容

```typescript
// ❌ BEFORE
import { useChat } from './hooks/useChat';

function App() {
  const { chatState, createSession, switchSession, deleteSession, sendMessage } = useChat();
  
  useEffect(() => {
    if (chatState.sessions.length === 0) {
      createSession('欢迎对话');
    }
  }, [chatState.sessions.length, createSession]);
}

// ✅ AFTER
import { useAgentChat } from './hooks/useAgentChat';

function App() {
  const { chatState, createSession, switchSession, deleteSession, sendMessage, initializeDefaultSession } = useAgentChat();
  
  useEffect(() => {
    initializeDefaultSession();
  }, [initializeDefaultSession]);
}
```

#### 4.2 测试点

- [ ] 应用正常启动
- [ ] 欢迎屏幕显示
- [ ] 可以创建会话
- [ ] 可以发送消息
- [ ] 可以切换会话

---

### Task 5: 清理和备份

#### 5.1 备份

```bash
# 在删除原 useChat.ts 前，创建备份
cp src/hooks/useChat.ts src/hooks/useChat.ts.backup
```

#### 5.2 删除

```bash
# 确认所有新 Hook 都正常工作后
rm src/hooks/useChat.ts
```

#### 5.3 验证

```bash
npm run lint
npm start
```

---

## 🔍 详细代码提取映射

### useChat.ts 的代码去向

| 代码段 | 原位置 | 目标文件 | 函数名 |
|--------|--------|---------|--------|
| 快速开始 useEffect | L21-32 | useSessionManagement | useEffect/loadSessions |
| createSession | L88-120 | useSessionManagement | createSession |
| switchSession | L138-148 | useAgentChat | switchSession |
| deleteSession | L123-135 | useSessionManagement | deleteSession |
| 消息格式化 | L158-215 | useMessageManagement | addUserMessage |
| 用户消息创建 | L218-245 | useMessageManagement | addUserMessage |
| AI 占位符创建 | L250-260 | useMessageManagement | addAIPlaceholder |
| AI 消息更新 | L307-315 | useMessageManagement | updateAIMessage |
| sendMessage 核心 | L150-330 | useAgentChat | sendMessage |
| 错误处理 | L319-330 | useAgentChat | sendMessage |

---

## ✅ 验收标准

### 功能完整性

- [ ] 所有原有功能保留
- [ ] 会话管理完整（CRUD）
- [ ] 消息收发正常
- [ ] AI 流式响应正常
- [ ] localStorage 持久化正常

### 代码质量

- [ ] ESLint 无警告
- [ ] TypeScript 类型完整
- [ ] 无循环依赖
- [ ] 代码重复 < 5%

### 性能

- [ ] 应用启动时间无显著变化
- [ ] 消息发送时间无显著加长
- [ ] 内存使用无显著增加

### 文档

- [ ] 函数有 JSDoc 注释
- [ ] 复杂逻辑有说明注释
- [ ] 本文档已更新

---

## 🧪 测试计划

### 单元测试

```bash
# 测试工具函数
npm test -- messageFormatter

# 测试 Hook
npm test -- useSessionManagement
npm test -- useMessageManagement
npm test -- useAgentChat
```

### 集成测试

```bash
# 测试完整流程
npm start

# 手动测试清单：
# [ ] 创建新会话 ✓
# [ ] 删除会话 ✓
# [ ] 切换会话 ✓
# [ ] 发送文本消息 ✓
# [ ] 发送图片消息 ✓
# [ ] 刷新页面数据恢复 ✓
# [ ] 快捷键发送 ✓
```

---

## ⏱️ 时间估算

| 任务 | 估计 | 人工 |
|------|------|------|
| Task 1 - Session Hook | 20分 | 低 |
| Task 2 - Message Hook | 25分 | 中 |
| Task 3 - AgentChat Hook | 30分 | 高 |
| Task 4 - 修改 App.tsx | 10分 | 低 |
| Task 5 - 测试和清理 | 15分 | 中 |
| **总计** | **100分** | **高** |

---

## ⚠️ 风险和缓解

### 风险1: 状态更新不同步

**症状**: 消息显示延迟或不显示  
**原因**: currentSession 更新逻辑错误  
**缓解**:
- [ ] 完整的状态日志输出
- [ ] 测试每个状态更新点
- [ ] 保留原 useChat.ts 作为参考

### 风险2: localStorage 保存失败

**症状**: 刷新页面数据丢失  
**原因**: 保存时序问题  
**缓解**:
- [ ] 在 updateSession 中确保保存
- [ ] 添加 localStorage 错误处理
- [ ] 进行持久化测试

### 风险3: API 调用错误

**症状**: AI 响应不显示  
**原因**: executeAgentGraphStream 错误  
**缓解**:
- [ ] 完整的错误捕获
- [ ] 错误信息显示
- [ ] 测试 LangGraph 集成

---

## 📝 提交策略

```bash
# 提交 1: 新 Hook 创建
git add src/hooks/useSessionManagement.ts src/hooks/useMessageManagement.ts src/hooks/useAgentChat.ts
git commit -m "feat: 拆分核心 Hook (STEP 4)"

# 提交 2: App.tsx 修改
git add src/App.tsx
git commit -m "refactor: 使用新 useAgentChat Hook"

# 提交 3: 清理（可选）
git rm src/hooks/useChat.ts
git commit -m "refactor: 删除旧的 useChat Hook"
```

---

## 🎯 成功标志

✅ **绿色信号**:
- npm start 无错误
- npm run lint 无警告
- 所有手动测试通过
- 新 Hook 经过完整测试

---

**预计完成时间**: 100-120 分钟  
**难度等级**: ⭐⭐⭐⭐⭐  
**风险等级**: 🔴 极高  
**收益等级**: 🟢 巨大（核心逻辑清晰化）  

---

**当准备好时，执行此清单进行 STEP 4！**
