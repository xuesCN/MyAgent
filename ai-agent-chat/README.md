# AI Agent 智能对话系统

基于React框架和TypeScript构建的现代化AI Agent应用，集成火山云LLM服务和智能决策流程，提供流畅的智能对话体验。系统采用模块化设计，支持多会话管理、实时流式响应和本地数据持久化。

## ✨ 特性

- 🚀 **现代化架构**: React 18 + TypeScript + Tailwind CSS，确保类型安全和开发效率
- 🤖 **智能对话**: 集成火山云LLM服务，支持多轮对话和流式响应
- 🔍 **智能决策流程**: 内置LangGraph服务，自动决策是否调用搜索工具
- 💬 **实时交互**: 打字机效果展示，流畅的用户体验
- 📱 **响应式设计**: 完美适配桌面端、平板和移动端
- 💾 **数据持久化**: 本地存储聊天记录和设置，确保刷新不丢失
- 🎨 **科技感UI**: 现代化界面设计，支持暗色主题
- ⚡ **高性能**: 优化的组件架构和状态管理，确保流畅运行
- 📎 **多模态支持**: 支持文本和图片输入，丰富对话内容
- 👥 **多会话管理**: 支持创建、切换和删除多个对话会话

## 🛠️ 技术栈

- **前端框架**: React 18 + TypeScript
- **样式系统**: Tailwind CSS
- **状态管理**: React Hooks + Context
- **AI模型**: 火山云LLM服务 (doubao-seed-1-6-251015)
- **智能决策**: LangGraph服务
- **HTTP客户端**: OpenAI SDK
- **构建工具**: Create React App
- **图标库**: Lucide React
- **本地存储**: localStorage API

## 📁 项目结构

```
src/
├── components/          # React组件
│   ├── ChatInterface.tsx    # 聊天主界面
│   ├── MessageBubble.tsx    # 消息气泡
│   ├── TypingEffect.tsx     # 打字机效果
│   ├── Sidebar.tsx         # 侧边栏（会话管理）
│   └── ChatInput.tsx       # 输入组件（支持文本和图片）
├── api/                 # API接口
│   └── services/
│       ├── chatService.ts       # 聊天服务
│       └── langGraphService.ts  # LangGraph智能决策服务
├── hooks/               # 自定义Hooks
│   └── useChat.ts        # 聊天状态管理
├── utils/               # 工具函数
│   ├── storageService.ts # 本地存储服务
│   └── cn.ts            # 样式工具
├── types/               # TypeScript类型定义
│   └── index.ts         # 全局类型定义
├── styles/              # 样式文件
│   └── index.css        # 全局样式
├── App.tsx              # 应用主组件
└── index.tsx            # 应用入口
```

## 🚀 快速开始

### 1. 环境要求

- Node.js >= 16.14.0
- npm >= 8.0.0

### 2. 安装依赖

```bash
cd ai-agent-chat
npm install
```

### 3. 配置环境变量

复制 `.env.example` 为 `.env` 并配置您的API密钥：

```env
# 火山云API密钥
REACT_APP_VOLCANO_API_KEY=your_api_key_here

# API基础地址
REACT_APP_API_BASE_URL=https://ark.cn-beijing.volces.com/api/v3

# 模型ID
REACT_APP_MODEL_ID=doubao-seed-1-6-251015
```

### 4. 启动开发服务器

```bash
npm start
```

应用将在 http://localhost:3000 启动

### 5. 构建生产版本

```bash
npm run build
```

构建产物将输出到 `build` 目录

### 6. 运行生产版本

```bash
# 使用serve工具运行
npx serve -s build

# 或使用http-server
npx http-server build -p 3000
```

## 💡 使用说明

### 基本功能

1. **新建对话**: 点击侧边栏的"新建对话"按钮创建新的聊天会话
2. **发送消息**: 在输入框中输入消息，按Enter键或点击发送按钮发送
3. **查看历史**: 在侧边栏查看所有历史对话，点击即可切换
4. **删除对话**: 悬停在会话上，点击删除按钮即可删除
5. **添加图片**: 支持上传或粘贴图片URL，与文本消息一起发送

### 智能决策功能

系统会自动根据对话内容决定是否调用搜索工具：
- 当需要获取实时信息时，自动触发搜索
- 当需要获取特定领域知识时，自动触发搜索
- 普通对话则直接使用LLM能力响应

### 快捷操作

- **Ctrl/Cmd + Enter**: 快速发送消息
- **Esc**: 关闭侧边栏（移动端）
- **点击会话标题**: 重命名会话

## 🎨 界面特色

- **科技感设计**: 深色主题配合蓝色科技光效，营造专业氛围
- **流畅动画**: 打字机效果、加载动画、平滑过渡效果
- **现代化布局**: 侧边栏+主界面的经典聊天应用布局
- **响应式适配**: 针对移动端、平板和桌面端的优化设计
- **直观交互**: 清晰的消息气泡、状态指示器和操作按钮
- **性能优化**: 组件懒加载和虚拟滚动，确保流畅体验

## 🔧 自定义配置

### 修改主题色彩

在 `tailwind.config.js` 中修改颜色配置：

```javascript
colors: {
  'tech-dark': '#0a0a0a',
  'tech-gray': '#1a1a1a',
  'tech-blue': '#00d4ff',
  'tech-purple': '#8b5cf6',
  'tech-green': '#00ff88',
  'tech-orange': '#ff6b35'
}
```

### 调整打字机效果

在 `TypingEffect.tsx` 中修改打字速度和光标样式：

```typescript
interface TypingEffectProps {
  speed?: number;        // 打字速度（毫秒，默认：50）
  showCursor?: boolean;   // 是否显示光标（默认：true）
  cursorChar?: string;    // 光标字符（默认：|）
}
```

### 配置LLM参数

在 `chatService.ts` 中修改模型参数：

```typescript
this.config = {
  apiKey: process.env.REACT_APP_VOLCANO_API_KEY || 'your_api_key',
  baseURL: process.env.REACT_APP_API_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3',
  model: process.env.REACT_APP_MODEL_ID || 'doubao-seed-1-6-251015',
  temperature: 0.7,        // 创造性（0-1，值越大越有创造性）
  maxTokens: 2000,        // 最大响应长度
  topP: 0.9,              // 核采样参数
  frequencyPenalty: 0.0,   // 频率惩罚
  presencePenalty: 0.0     // 存在惩罚
};
```

## 📱 响应式设计

应用采用移动优先的响应式设计，适配各种屏幕尺寸：

- **桌面端**: 左侧边栏 + 右侧聊天界面（经典布局）
- **平板端**: 可折叠侧边栏 + 全屏聊天界面
- **移动端**: 抽屉式侧边栏 + 全屏聊天界面

响应式断点：
- **移动端**: < 640px
- **平板端**: 640px - 1024px
- **桌面端**: > 1024px

## 🔒 安全考虑

- **API密钥**: 使用环境变量存储敏感信息，避免硬编码
- **本地存储**: 数据仅存储在用户本地浏览器，保护用户隐私
- **输入验证**: 对用户输入进行基本的验证和过滤，防止恶意输入
- **CORS**: 配置合理的跨域访问策略
- **错误处理**: 完善的错误处理机制，避免信息泄露

## 🐛 常见问题

### Q: API连接失败怎么办？
A: 检查以下几点：
- 确认API密钥是否正确配置在 `.env` 文件中
- 检查网络连接是否正常
- 验证API端点地址是否正确
- 检查防火墙设置是否允许访问API地址

### Q: 聊天记录丢失了怎么办？
A: 聊天记录存储在浏览器的localStorage中：
- 请确保没有清除浏览器缓存或使用隐私模式
- 如果确实丢失，可以尝试从浏览器的开发者工具中恢复

### Q: 如何修改默认模型？
A: 在 `.env` 文件中修改 `REACT_APP_MODEL_ID` 变量

### Q: 如何禁用打字机效果？
A: 在 `MessageBubble.tsx` 中将 `showTypingEffect` 设为 `false`

### Q: 支持哪些图片格式？
A: 支持常见的图片格式，如JPG、PNG、GIF等

### Q: 为什么会自动调用搜索工具？
A: 系统会根据对话内容自动决定是否需要调用搜索工具获取实时信息或特定领域知识

## 🤝 贡献指南

我们欢迎任何形式的贡献，包括但不限于：

### 提交Issue

如果您发现了bug或有新的功能建议，请提交Issue：
1. 检查是否已经存在类似的Issue
2. 清晰描述问题或建议
3. 提供必要的截图或代码示例

### 提交Pull Request

1. Fork本仓库
2. 创建您的特性分支：`git checkout -b feature/AmazingFeature`
3. 提交您的修改：`git commit -m 'Add some AmazingFeature'`
4. 推送到分支：`git push origin feature/AmazingFeature`
5. 打开Pull Request

### 开发规范

- 代码风格：遵循项目的ESLint和Prettier配置
- 类型安全：确保所有代码都有完整的TypeScript类型定义
- 测试覆盖：为新功能添加适当的测试用例
- 文档更新：更新相关文档以反映您的更改

### 开发流程

1. 克隆仓库：`git clone https://github.com/your-username/ai-agent-chat.git`
2. 安装依赖：`npm install`
3. 运行开发服务器：`npm start`
4. 运行测试：`npm test`
5. 构建生产版本：`npm run build`

## 📄 许可证

本项目采用MIT License：

```
MIT License

Copyright (c) [2024] [AI Agent 智能对话系统]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## 🔗 相关链接

- [React官方文档](https://react.dev/)
- [TypeScript官方文档](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [火山云API文档](https://www.volcengine.com/docs)
- [OpenAI SDK](https://github.com/openai/openai-node)
- [LangGraph文档](https://langchain-ai.github.io/langgraph/)
- [Lucide React图标库](https://lucide.dev/)