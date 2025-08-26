# 碳排放管理系统 Railway 部署指南

## 项目概述

这是一个智能碳排放管理系统，支持文档上传分析、AI助手优化建议和项目管理流程。系统已优化用于Railway平台部署。

## 🚀 快速部署到Railway

### 方式一：直接从GitHub部署（推荐）

1. **将代码推送到GitHub仓库**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/your-username/ems-2.2.git
   git push -u origin main
   ```

2. **在Railway创建新项目**
   - 访问 [Railway.app](https://railway.app)
   - 点击 "New Project"
   - 选择 "Deploy from GitHub repo"
   - 选择您的仓库

3. **配置环境变量**
   在Railway项目的Variables标签中添加：
   ```
   NODE_ENV=production
   AI_API_KEY=ms-150d583e-ed00-46d3-ab35-570f03555599
   AI_BASE_URL=https://api-inference.modelscope.cn/v1
   AI_MODEL=deepseek-ai/DeepSeek-V3
   ```

4. **部署完成**
   Railway会自动检测到Node.js项目并开始部署。

### 方式二：Railway CLI部署

1. **安装Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

2. **登录Railway**
   ```bash
   railway login
   ```

3. **初始化项目**
   ```bash
   railway init
   ```

4. **设置环境变量**
   ```bash
   railway variables set NODE_ENV=production
   railway variables set AI_API_KEY=ms-150d583e-ed00-46d3-ab35-570f03555599
   railway variables set AI_BASE_URL=https://api-inference.modelscope.cn/v1
   railway variables set AI_MODEL=deepseek-ai/DeepSeek-V3
   ```

5. **部署**
   ```bash
   railway up
   ```

## 📝 环境变量说明

### 必需的环境变量

| 变量名 | 描述 | 默认值 | 示例 |
|--------|------|--------|------|
| `NODE_ENV` | 运行环境 | `production` | `production` |
| `AI_API_KEY` | AI服务API密钥 | 内置默认值 | `ms-150d583e-ed00-46d3-ab35-570f03555599` |

### 可选的环境变量

| 变量名 | 描述 | 默认值 | 示例 |
|--------|------|--------|------|
| `PORT` | 服务端口 | `3000` | `3000` |
| `AI_BASE_URL` | AI服务基础URL | `https://api-inference.modelscope.cn/v1` | API服务地址 |
| `AI_MODEL` | AI模型名称 | `deepseek-ai/DeepSeek-V3` | 模型标识 |

## 🔧 项目结构

```
ems-2.2/
├── package.json          # 项目配置和依赖
├── server.js             # Express服务器入口
├── railway.toml          # Railway配置文件
├── config.js             # 配置管理器
├── env.example           # 环境变量示例
│
├── index_improved.html   # 主页面
├── styles.css           # 主样式文件
├── improvements.css     # 改进样式
│
├── script_enhanced.js   # 核心JavaScript功能
├── script.js           # 基础脚本
├── script_improvements.js # 改进功能脚本
└── temp_script.js      # 临时脚本
```

## 🎯 功能特性

- ✅ **文档上传分析**: 支持PDF、DOC、DOCX、TXT格式
- ✅ **AI智能分析**: 基于DeepSeek-V3模型的碳排放分析
- ✅ **Kanban看板管理**: 可视化项目流程
- ✅ **Lean精益优化**: 智能优化建议
- ✅ **Scrum敏捷执行**: 任务管理和执行
- ✅ **实时AI对话**: 智能助手功能
- ✅ **响应式设计**: 支持移动端和桌面端

## 🛠️ 技术栈

- **前端**: HTML5, CSS3, JavaScript (ES6+)
- **后端**: Node.js, Express.js
- **AI服务**: ModelScope DeepSeek-V3 API
- **部署**: Railway Platform
- **工具**: Font Awesome, 响应式设计

## 🔍 本地开发

1. **克隆项目**
   ```bash
   git clone <your-repo-url>
   cd ems-2.2
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **设置环境变量**
   ```bash
   cp env.example .env
   # 编辑.env文件设置实际值
   ```

4. **启动开发服务器**
   ```bash
   npm run dev
   ```

5. **访问应用**
   打开浏览器访问 `http://localhost:3000`

## 🔧 配置说明

### AI API配置

系统支持灵活的API配置，优先级如下：
1. Railway环境变量
2. 服务器端配置
3. 客户端默认配置

### 安全配置

- 启用了Helmet安全中间件
- 配置了CORS跨域保护
- 实现了CSP内容安全策略
- 支持HTTPS和压缩

## 📊 性能优化

- 启用GZIP压缩
- 静态文件缓存
- CDN资源优化
- 响应式图像加载

## 🐛 故障排除

### 常见问题

1. **AI功能不可用**
   - 检查`AI_API_KEY`环境变量是否正确设置
   - 确认API服务可访问

2. **静态资源加载失败**
   - 检查文件路径是否正确
   - 确认所有文件已正确上传

3. **部署失败**
   - 检查`package.json`中的scripts配置
   - 确认所有依赖已正确安装

### 调试模式

在开发环境中，设置`NODE_ENV=development`可启用：
- 详细错误日志
- 开发者工具
- 热重载功能

## 📞 支持

如需帮助或报告问题，请：
1. 检查本文档的故障排除部分
2. 查看Railway部署日志
3. 联系技术支持团队

## 🔄 更新和维护

定期更新依赖包：
```bash
npm update
```

检查安全漏洞：
```bash
npm audit
npm audit fix
```

## 📄 许可证

MIT License - 详见项目根目录LICENSE文件。
