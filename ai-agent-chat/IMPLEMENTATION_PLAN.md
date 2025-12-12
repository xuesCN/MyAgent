# 图片粘贴上传功能实现方案

## 1. 功能需求

- **核心功能**：支持用户在聊天输入框中通过 Ctrl+V 粘贴图片
- **图片处理**：将粘贴的图片转换为 Data URL 格式
- **提示功能**：粘贴成功后显示"图片已传入"提示
- **LLM 集成**：按照指定格式将图片 URL 和文本发送给 LLM

## 2. 实现方案

### 2.1 系统架构分析

当前系统的主要组件：

- `ChatInput.tsx`：聊天输入组件，处理用户输入
- `Message` 类型：定义消息结构，包含文本内容
- `useChat.ts`：管理聊天状态和消息发送
- `langGraphService.ts`：处理 LLM 调用和工具集成

### 2.2 技术实现思路

#### 2.2.1 图片粘贴处理

1. **添加粘贴事件监听**：在 `ChatInput` 组件中添加 `onPaste` 事件处理函数
2. **提取图片数据**：从粘贴事件中获取图片文件
3. **转换为 Data URL**：使用 `FileReader` API 将图片转换为 Data URL
4. **显示提示**：在图片处理完成后显示"图片已传入"提示

#### 2.2.2 消息格式扩展

1. **修改 Message 接口**：添加图片内容支持
2. **扩展 LLM 调用接口**：修改 `executeAgentGraphStream` 函数，支持发送包含图片的消息
3. **更新消息处理逻辑**：确保新的消息格式与现有系统兼容

#### 2.2.3 LLM 消息格式

按照用户提供的格式发送消息：

```json
{
  "role": "user",
  "content": [
    {
      "type": "image_url",
      "image_url": {
        "url": "data:image/jpeg;base64,..."
      }
    },
    {
      "type": "text",
      "text": "这是哪里？"
    }
  ]
}
```

## 3. 具体实现步骤

### 3.1 修改 `ChatInput.tsx` 组件

1. 添加 `onPaste` 事件处理函数
2. 实现图片提取和转换逻辑
3. 添加提示信息显示

### 3.2 扩展消息类型定义

1. 修改 `src/types/index.ts` 中的 `Message` 接口
2. 支持图片内容的存储

### 3.3 更新 LLM 调用接口

1. 修改 `src/api/services/langGraphService.ts`
2. 支持发送包含图片的消息
3. 更新消息转换逻辑

### 3.4 更新 `useChat.ts`

1. 修改 `sendMessage` 函数，支持发送包含图片的消息
2. 确保消息格式正确转换

## 4. 代码实现细节

### 4.1 ChatInput 组件修改

```typescript
// 添加粘贴事件处理
const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
  const items = e.clipboardData.items;
  for (let i = 0; i < items.length; i++) {
    if (items[i].type.indexOf("image") !== -1) {
      e.preventDefault();
      const file = items[i].getAsFile();
      if (file) {
        handleImageUpload(file);
      }
      break;
    }
  }
};

// 图片处理逻辑
const handleImageUpload = (file: File) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    const imageUrl = e.target?.result as string;
    // 存储图片URL，用于后续发送
    setImageUrl(imageUrl);
    // 显示提示
    setShowImagePrompt(true);
    setTimeout(() => setShowImagePrompt(false), 2000);
  };
  reader.readAsDataURL(file);
};
```

### 4.2 Message 类型扩展

```typescript
export interface Message {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
  isStreaming?: boolean;
  imageUrl?: string; // 新增图片URL字段
}
```

### 4.3 LLM 调用修改

```typescript
// 修改 convertToLangChainMessages 函数
function convertToLangChainMessages(messages: Message[]): BaseMessage[] {
  return messages.map((msg) => {
    if (msg.sender === "user") {
      // 如果有图片URL，构造多模态消息
      if (msg.imageUrl) {
        return new HumanMessage({
          content: [
            {
              type: "image_url",
              image_url: {
                url: msg.imageUrl,
              },
            },
            {
              type: "text",
              text: msg.content,
            },
          ],
        });
      }
      return new HumanMessage(msg.content);
    } else {
      return new AIMessage(msg.content);
    }
  });
}
```

## 5. 注意事项

1. **兼容性**：确保新功能与现有系统兼容
2. **性能**：处理大图片时可能导致性能问题，需要考虑限制图片大小
3. **错误处理**：添加适当的错误处理，如图片格式不支持、转换失败等
4. **用户体验**：确保提示信息清晰，不影响正常的聊天体验

## 6. 测试计划

1. 测试粘贴不同格式的图片（JPEG、PNG、GIF）
2. 测试粘贴大图片的处理情况
3. 测试图片和文本同时发送的情况
4. 测试错误处理机制
5. 测试与现有功能的兼容性
