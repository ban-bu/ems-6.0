# EcoLoop EMS (静态站点) - Railway 部署指南

## 本地运行

1. 安装依赖
```bash
npm i
```
2. 启动服务
```bash
npm start
```
浏览器访问 `http://localhost:3000`。

## 通过 GitHub 部署到 Railway

前置条件：
- 已有 GitHub 仓库
- 已登录 Railway（`https://railway.app`）

步骤：
1. 在项目根目录初始化仓库并推到 GitHub：
```bash
git init
git add .
git commit -m "init: ems static site with express"
# 新建远程仓库后：
git branch -M main
git remote add origin <your_repo_url>
git push -u origin main
```
2. Railway 控制台：新建项目 → Deploy from GitHub → 选择该仓库。
3. Build & Start：无需 Build 命令；Start Command 使用默认 `npm start`。
4. 部署完成后，Railway 会提供公开访问的 URL。

## 文件说明
- `server.js`：Express 静态服务，使用 `PORT` 环境变量。
- `package.json`：包含 `start` 脚本与依赖。
- `index_improved.html`：入口页面；`styles.css`、`improvements.css`、`script.js` 等为静态资源。
- `.gitignore`：忽略 `node_modules/`、`.env` 等。

## 常见问题
- 404：请确保首页在根目录，且 `server.js` 指向 `index_improved.html`。
- 端口占用：Railway 会注入 `PORT`，不要硬编码端口。
- 静态资源路径：使用相对路径引用根目录下文件（本项目已按此配置）。

---
如需自定义入口文件，可在 `server.js` 中调整 `res.sendFile` 的路径。
