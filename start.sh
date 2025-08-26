#!/bin/bash

# 碳排放管理系统启动脚本

echo "🌱 启动碳排放管理系统..."

# 检查Node.js版本
node_version=$(node -v)
npm_version=$(npm -v)

echo "📦 Node.js版本: $node_version"
echo "📦 npm版本: $npm_version"

# 检查是否安装了依赖
if [ ! -d "node_modules" ]; then
    echo "📥 安装依赖包..."
    npm install
fi

# 设置环境变量（如果不存在）
export NODE_ENV=${NODE_ENV:-production}
export PORT=${PORT:-3000}

# 显示配置信息
echo "🔧 运行环境: $NODE_ENV"
echo "🔌 服务端口: $PORT"

# 启动应用
echo "🚀 启动服务器..."
npm start
