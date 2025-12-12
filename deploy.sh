#!/bin/bash

echo "🚀 AI Agent 智能对话系统部署脚本"
echo "================================="

# 检查是否在项目目录中
if [ ! -f "package.json" ]; then
    echo "❌ 请在项目根目录中运行此脚本"
    exit 1
fi

# 安装依赖
echo "📦 安装生产依赖..."
npm install --production

if [ $? -ne 0 ]; then
    echo "❌ 依赖安装失败"
    exit 1
fi

# 构建项目
echo "🔨 构建项目..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ 构建失败"
    exit 1
fi

echo "✅ 构建完成"
echo ""
echo "📁 构建文件位于: build/"
echo ""
echo "🌐 部署选项:"
echo "   1. 静态文件托管 (Netlify, Vercel, GitHub Pages)"
echo "   2. Docker容器部署"
echo "   3. 传统服务器部署"
echo ""
echo "📖 详细部署说明请查看 README.md"