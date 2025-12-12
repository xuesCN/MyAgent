#!/bin/bash

echo "🚀 AI Agent 智能对话系统启动脚本"
echo "================================="

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装Node.js"
    echo "🔗 下载地址: https://nodejs.org/"
    exit 1
fi

# 检查npm是否安装
if ! command -v npm &> /dev/null; then
    echo "❌ npm 未安装，请先安装npm"
    exit 1
fi

echo "✅ Node.js 版本: $(node --version)"
echo "✅ npm 版本: $(npm --version)"
echo ""

# 安装依赖
echo "📦 正在安装项目依赖..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ 依赖安装失败"
    exit 1
fi

echo "✅ 依赖安装完成"
echo ""

# 检查环境变量文件
if [ ! -f ".env" ]; then
    echo "⚠️  未找到 .env 文件"
    echo "📝 正在创建环境变量模板..."
    
    read -p "请输入火山云API密钥 (或按Enter使用默认密钥): " api_key
    
    if [ -z "$api_key" ]; then
        api_key="6ac879c9-9a62-49f0-a99a-db2e0a4b8e02"
        echo "使用默认API密钥"
    fi
    
    cat > .env << EOF
# 火山云API配置
REACT_APP_VOLCANO_API_KEY=$api_key
REACT_APP_API_BASE_URL=https://ark.cn-beijing.volces.com/api/v3
REACT_APP_MODEL_ID=doubao-seed-1-6-251015

# 应用配置
REACT_APP_NAME=AI Agent 智能对话系统
REACT_APP_VERSION=1.0.0
EOF
    
    echo "✅ 环境变量文件已创建"
else
    echo "✅ 环境变量文件已存在"
fi

echo ""
echo "🎯 准备启动应用..."
echo ""
echo "📋 应用功能:"
echo "   • 智能对话 - 基于火山云LLM"
echo "   • 流式响应 - 实时打字机效果"
echo "   • 历史记录 - 本地存储管理"
echo "   • 响应式设计 - 支持移动端"
echo ""
echo "🌐 应用将在 http://localhost:3000 启动"
echo "   按 Ctrl+C 停止应用"
echo ""

# 启动应用
npm start