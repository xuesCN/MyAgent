# 🔧 API 安全问题修复指南

## 🚨 发现的问题

### 问题 1：Tavily API 密钥硬编码（严重）

**当前代码** (`src/api/services/tavilyService.ts L8`):
```typescript
this.apiKey = "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";
```

**危害**:
- 密钥在源代码中公开
- 可被他人利用
- API 配额被盗用

---

## ✅ 快速修复方案

### Step 1: 修复 Tavily 密钥

**改动**: `src/api/services/tavilyService.ts`

```typescript
// ❌ 删除这一行
this.apiKey = "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";

// ✅ 改为
this.apiKey = process.env.REACT_APP_TAVILY_API_KEY || '';

// 添加警告
if (!this.apiKey) {
  console.warn('⚠️  Tavily API 密钥未配置，搜索功能将不可用');
}
```

---

### Step 2: 创建 .env.example

**新建文件**: `.env.example`

```env
# AI Agent 智能对话系统 - 环境变量配置示例
# 复制此文件为 .env 并填入真实的 API 密钥

# ========== 火山云 LLM API ==========
# 获取方式: https://www.volcengine.com/
REACT_APP_VOLCANO_API_KEY=your_volcano_api_key_here
REACT_APP_API_BASE_URL=https://ark.cn-beijing.volces.com/api/v3
REACT_APP_MODEL_ID=doubao-seed-1-6-251015

# ========== Tavily 搜索 API ==========
# 获取方式: https://tavily.com/
REACT_APP_TAVILY_API_KEY=your_tavily_api_key_here

# ========== 应用配置 ==========
REACT_APP_DEBUG=false
```

---

### Step 3: 更新 .gitignore

确保 `.env` 在 `.gitignore` 中（防止提交密钥）

```bash
# 检查 .gitignore
cat .gitignore

# 应该包含：
.env
.env.local
.env.*.local
```

---

### Step 4: 修复 ChatService（可选但建议）

**改动**: `src/api/services/chatService.ts`

```typescript
constructor() {
  const apiKey = process.env.REACT_APP_VOLCANO_API_KEY;
  
  if (!apiKey) {
    console.error('❌ 错误：火volcano API 密钥未配置');
    console.error('请在 .env 文件中设置 REACT_APP_VOLCANO_API_KEY');
  }

  this.config = {
    apiKey: apiKey || 'default_key',  // 有警告但不会崩溃
    baseURL: process.env.REACT_APP_API_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3',
    model: process.env.REACT_APP_MODEL_ID || 'doubao-seed-1-6-251015',
    temperature: 0.7,
    maxTokens: 2000
  };

  this.client = new OpenAI({
    apiKey: this.config.apiKey,
    baseURL: this.config.baseURL,
    dangerouslyAllowBrowser: true
  });
}
```

---

## 📋 修复检查清单

执行顺序：

1. [ ] 修改 `tavilyService.ts`
   - 删除硬编码密钥
   - 使用环境变量

2. [ ] 创建 `.env.example`
   - 列出所有需要的环境变量
   - 添加说明注释

3. [ ] 创建 `.env` (本地)
   ```bash
   # 复制 .env.example
   cp .env.example .env
   
   # 编辑 .env，填入真实密钥
   # 不要提交到 Git！
   ```

4. [ ] 验证 .gitignore
   - 确保 `.env` 被忽略

5. [ ] 测试应用
   ```bash
   npm start
   ```

6. [ ] 验证密钥是否生效
   - 发送消息
   - 检查搜索是否工作

---

## 🔍 验证修复

### 检查 1: 密钥不在源代码中

```bash
# 搜索硬编码的密钥
grep -r "tvly-dev-" src/

# 应该返回空（没找到）
# ✅ 安全！
```

### 检查 2: 环境变量正确

```bash
# 检查 .env 文件存在
ls -la .env

# 应该显示 .env 文件
```

### 检查 3: .env 被 Git 忽略

```bash
git status

# .env 不应该在 "Changes to be committed" 中
```

### 检查 4: 应用正常运行

```bash
npm start

# 应该看到：
# ✅ 应用启动
# ✅ 可以发送消息
# ⚠️  如果环境变量未设置，会看到警告
```

---

## 📚 相关文档

详细架构说明: [API_ARCHITECTURE.md](./API_ARCHITECTURE.md)

---

## ✨ 修复后的收益

| 指标 | 修复前 | 修复后 |
|------|--------|--------|
| **安全性** | 🔴 低 | 🟢 高 |
| **密钥可见** | ❌ 是 | ✅ 否 |
| **配置清晰** | ❌ 不清楚 | ✅ 清晰 |
| **部署便捷** | ❌ 困难 | ✅ 简单 |
| **团队协作** | ❌ 不安全 | ✅ 安全 |

---

**建议**: 按照上述步骤立即修复第一个严重的安全问题！
