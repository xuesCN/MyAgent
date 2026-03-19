# 🚀 AI Agent 后端服务

Node.js + Koa + TypeScript 后端服务，为 AI Agent 聊天系统提供 API 支持。

## 🎯 功能

- ✅ **LLM 代理** - 代理 Volcano Cloud API，支持聊天和流式响应
- ✅ **搜索代理** - 代理 Tavily Search API，提供网络搜索能力
- ✅ **速率限制** - 基于 IP 的速率限制，防止滥用
- ✅ **请求日志** - 完整的请求/响应日志记录
- ✅ **错误处理** - 统一的错误处理和响应格式
- ✅ **CORS 支持** - 允许跨域请求

## 📦 技术栈

- **框架**: Koa2
- **语言**: TypeScript
- **包管理**: npm
- **LLM**: Volcano Cloud OpenAI API
- **搜索**: Tavily API

## 🚀 快速开始

### 1. 安装依赖

```bash
cd backend
npm install
```

### 2. 配置环境变量

复制 `.env.example` 到 `.env` 并填入实际的 API 密钥：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
# Volcano Cloud
VOLCANO_API_KEY=your_api_key
VOLCANO_BASE_URL=https://ark.cn-beijing.volces.com/api/v3
VOLCANO_MODEL=doubao-seed-1-6-251015

# Tavily Search
TAVILY_API_KEY=your_api_key

# 服务器
PORT=3001
```

### 3. 开发模式运行

```bash
npm run dev
```

成功启动后，你应该看到：

```
==================================================
✨ 后端服务已启动
📍 地址: http://localhost:3001
🔧 环境: development
📊 日志级别: debug
==================================================

可用的端点:
  GET  /api/health              - 健康检查
  POST /api/llm/chat            - LLM 聊天（非流式）
  POST /api/llm/chat-stream     - LLM 聊天（流式）
  POST /api/search              - 搜索
```

### 4. 生产模式构建

```bash
npm run build
npm start
```

## 📡 API 文档

### 健康检查

**请求**:

```bash
GET /api/health
```

**响应**:

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": 1637000000000
  },
  "timestamp": 1637000000000
}
```

---

### LLM 聊天（非流式）

**请求**:

```bash
POST /api/llm/chat
Content-Type: application/json

{
  "messages": [
    {
      "id": "1",
      "sender": "user",
      "content": "你好",
      "timestamp": "2024-01-01T00:00:00Z"
    }
  ]
}
```

**响应**:

```json
{
  "success": true,
  "data": {
    "content": "你好！请问有什么我可以帮助你的吗？"
  },
  "timestamp": 1637000000000
}
```

---

### LLM 聊天（流式）

**请求**:

```bash
POST /api/llm/chat-stream
Content-Type: application/json

{
  "messages": [
    {
      "id": "1",
      "sender": "user",
      "content": "写一个 Hello World Python 脚本",
      "timestamp": "2024-01-01T00:00:00Z"
    }
  ]
}
```

**响应** (Server-Sent Events):

```
print("Hello World")
```

---

### 搜索

**请求**:

```bash
POST /api/search
Content-Type: application/json

{
  "query": "2024年最新的 AI 技术发展"
}
```

**响应**:

```json
{
  "success": true,
  "data": {
    "answer": "2024年的 AI 技术...",
    "results": [
      {
        "title": "...",
        "url": "...",
        "snippet": "..."
      }
    ]
  },
  "timestamp": 1637000000000
}
```

---

## 🏗️ 项目结构

```
backend/
├── src/
│   ├── app.ts                 # Koa 应用主文件
│   ├── server.ts              # 服务器启动入口
│   ├── config/
│   │   └── index.ts           # 配置管理
│   ├── types/
│   │   └── index.ts           # TypeScript 类型定义
│   ├── services/
│   │   ├── llmService.ts      # LLM 服务代理
│   │   └── searchService.ts   # 搜索服务代理
│   ├── middleware/
│   │   ├── logging.ts         # 日志和错误处理
│   │   └── rateLimit.ts       # 速率限制
│   └── routes/
│       └── index.ts           # 路由定义
├── dist/                      # 编译输出
├── .env                       # 环境变量（本地）
├── .env.example               # 环境变量示例
├── tsconfig.json              # TypeScript 配置
├── package.json               # 依赖配置
└── README.md                  # 本文件
```

## 🔐 安全特性

### 1. API 密钥保护

- 所有 API 密钥存储在服务器环境变量中
- 前端永远不会看到真实的 API 密钥

### 2. 速率限制

- 基于 IP 地址的速率限制
- 默认：60秒内最多100个请求
- 可通过环境变量调整

### 3. CORS 安全

- 配置可信的 CORS 源
- 默认允许来自 `http://localhost:3000` 的请求

### 4. 请求日志

- 所有请求都被记录
- 便于调试和审计

## 📊 环境变量

| 变量                      | 说明                 | 默认值                                   |
| ------------------------- | -------------------- | ---------------------------------------- |
| `PORT`                    | 服务器端口           | 3001                                     |
| `NODE_ENV`                | 运行环境             | development                              |
| `VOLCANO_API_KEY`         | 火山云 API 密钥      | -                                        |
| `VOLCANO_BASE_URL`        | 火山云 API 地址      | https://ark.cn-beijing.volces.com/api/v3 |
| `VOLCANO_MODEL`           | 火山云模型           | doubao-seed-1-6-251015                   |
| `TAVILY_API_KEY`          | Tavily API 密钥      | -                                        |
| `CORS_ORIGIN`             | CORS 允许源          | http://localhost:3000                    |
| `RATE_LIMIT_WINDOW`       | 速率限制窗口（毫秒） | 60000                                    |
| `RATE_LIMIT_MAX_REQUESTS` | 速率限制请求数       | 100                                      |

## 🧪 测试

### 使用 cURL 测试健康检查

```bash
curl http://localhost:3001/api/health
```

### 使用 cURL 测试聊天

```bash
curl -X POST http://localhost:3001/api/llm/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "id": "1",
        "sender": "user",
        "content": "你好",
        "timestamp": "2024-01-01T00:00:00Z"
      }
    ]
  }'
```

## 🐛 调试

启用调试模式：

```bash
DEBUG=true npm run dev
```

调试模式下会输出更详细的日志信息。

## 📝 日志格式

```
[2024-01-01T00:00:00.000Z] POST /api/llm/chat - 127.0.0.1
[2024-01-01T00:00:00.123Z] POST /api/llm/chat - 200 - 123ms
```

## 🚀 生产部署

### 1. 构建

```bash
npm run build
```

### 2. 部署

将 `dist` 文件夹部署到服务器：

```bash
npm install --production
npm start
```

### 3. 使用 PM2 管理

```bash
npm install -g pm2

pm2 start dist/server.js --name "ai-agent-backend"
pm2 logs ai-agent-backend
```

## 🤝 前后端集成

### 前端自动发现

前端会自动从 `http://localhost:3001` 调用后端 API。

### 修改前端配置

如果后端不在本地，编辑前端代码的 API 客户端：

```typescript
// src/api/client/backendClient.ts
private baseURL = 'http://your-backend-url:3001/api';
```

## 📚 相关文档

- [后端评估文档](../BACKEND_ASSESSMENT.md)
- [前端文档](../README.md)

## 💡 常见问题

### Q: 如何修改速率限制？

编辑 `.env` 文件：

```env
RATE_LIMIT_MAX_REQUESTS=200
RATE_LIMIT_WINDOW=60000
```

### Q: 如何查看请求日志？

日志会输出到控制台。使用 PM2 可以持久化日志：

```bash
pm2 logs ai-agent-backend
```

### Q: API 密钥怎样安全存储？

密钥存储在 `.env` 文件中，该文件不会被提交到 Git（参见 `.gitignore`）。

## 📄 许可证

MIT

---

**最后更新**: 2024年1月1日  
**状态**: 🟢 Production Ready
