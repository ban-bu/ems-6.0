# 🚄 Railway部署问题修复指南

## 问题诊断

根据您提供的错误日志，问题的根本原因是：

```
🤖 AI服务: 已启用
Stopping Container
npm error path /app
npm error command failed
npm error signal SIGTERM
```

这表明应用程序启动了，但随后被Railway平台停止了。这通常是由于：
1. **健康检查失败** - Railway无法验证应用是否正常运行
2. **启动超时** - 应用启动时间过长
3. **资源限制** - 内存或CPU使用过高

## 🔧 已实施的修复

### 1. 优化Railway配置 (`railway.toml`)
```toml
[deploy]
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
# 新增健康检查配置
healthcheckPath = "/health"
healthcheckTimeout = 30
```

### 2. 增强健康检查端点 (`/health`)
- 更详细的系统信息报告
- Railway环境特定的监控数据
- 更robust的错误处理

### 3. 改进服务器启动和关闭逻辑
- 更详细的启动日志
- 优雅的SIGTERM处理
- 更好的错误捕获和报告

### 4. 添加调试工具
- `railway-debug.js` - 本地诊断脚本
- `npm run debug` - 快速诊断命令

## 🚀 部署步骤

### 步骤 1: 本地测试
```bash
# 运行诊断脚本
npm run debug

# 如果诊断通过，测试启动
npm start
```

### 步骤 2: 推送更新的代码
```bash
git add .
git commit -m "修复Railway部署问题 - 优化健康检查和启动逻辑"
git push origin main
```

### 步骤 3: 配置Railway环境变量

在Railway项目的 `Variables` 标签页中设置：

| 变量名 | 值 | 必需 |
|--------|----|----|
| `NODE_ENV` | `production` | ✅ |
| `AI_API_KEY` | `ms-150d583e-ed00-46d3-ab35-570f03555599` | ✅ |
| `AI_BASE_URL` | `https://api-inference.modelscope.cn/v1` | ⚠️ |
| `AI_MODEL` | `deepseek-ai/DeepSeek-V3` | ⚠️ |

> 注：`AI_BASE_URL` 和 `AI_MODEL` 有默认值，但建议显式设置

### 步骤 4: 重新部署

Railway会自动检测到代码更新并重新部署。监控部署日志：

```
🚀 碳排放管理系统正在运行
📊 端口绑定: 3000 (绑定到 0.0.0.0)
⏰ 启动时间: 2024-XX-XX...
🚄 Railway环境: production
✅ 服务器启动完成，等待连接...
```

## 🔍 调试和监控

### 健康检查端点
部署完成后，访问：
```
https://your-app.railway.app/health
```

应该返回详细的系统状态信息：
```json
{
  "status": "ok",
  "timestamp": "2024-XX-XX...",
  "version": "2.2.0",
  "environment": "production",
  "uptime": 123.45,
  "railway": {
    "environment": "production",
    "project": "your-project",
    "service": "your-service"
  },
  "ai": {
    "enabled": true,
    "configured": true
  }
}
```

### Railway部署日志监控

在Railway控制台的 `Deployments` 标签页中查看：

✅ **成功的日志应该包含:**
```
🚀 碳排放管理系统正在运行
📊 端口绑定: 3000 (绑定到 0.0.0.0)
🚄 Railway环境: production
✅ 服务器启动完成，等待连接...
```

❌ **失败的日志可能包含:**
```
❌ 未捕获的异常: ...
💥 未处理的Promise拒绝: ...
📦 收到SIGTERM信号...
```

## 🛠️ 常见问题解决

### 问题 1: 健康检查仍然失败

**症状:** 应用启动后立即被停止
**解决方案:**
1. 检查PORT环境变量是否正确设置
2. 确认应用绑定到 `0.0.0.0` 而不是 `localhost`
3. 验证 `/health` 端点可访问

### 问题 2: 启动超时

**症状:** 应用启动时间过长
**解决方案:**
1. 移除不必要的同步操作
2. 优化依赖加载
3. 检查是否有阻塞的数据库连接

### 问题 3: 内存限制

**症状:** 应用因内存不足被杀死
**解决方案:**
1. 升级Railway计划以获得更多内存
2. 优化内存使用
3. 添加内存监控

### 问题 4: AI服务配置问题

**症状:** AI功能不可用
**解决方案:**
1. 验证 `AI_API_KEY` 是否正确设置
2. 测试API端点可访问性
3. 检查API配额限制

## 📊 性能优化建议

### 1. 启动优化
- 懒加载非关键依赖
- 异步初始化重型操作
- 预热关键路径

### 2. 资源管理
- 设置合适的超时值
- 实现连接池管理
- 监控内存使用

### 3. 错误处理
- 实现Circuit Breaker模式
- 添加重试机制
- 完善监控和告警

## 🔄 持续监控

### 设置监控指标
1. **响应时间** - `/health` 端点响应时间
2. **内存使用** - 进程内存消耗
3. **错误率** - 5xx错误比例
4. **可用性** - 服务在线时间

### 日志分析
定期检查Railway部署日志，关注：
- 启动时间趋势
- 错误模式
- 资源使用峰值
- 外部API调用失败

## 📞 获取帮助

如果问题仍然存在，请提供以下信息：

1. **Railway部署日志截图**
2. **健康检查端点响应**
3. **本地 `npm run debug` 输出**
4. **具体的错误信息和时间戳**

### 快速诊断命令
```bash
# 本地环境诊断
npm run debug

# 检查生产环境健康状态
curl https://your-app.railway.app/health

# 检查Railway环境变量
railway variables

# 查看实时日志
railway logs
```

## 🎯 后续改进计划

1. **监控集成** - 添加APM监控
2. **自动扩缩容** - 基于负载的自动调整
3. **备份策略** - 数据和配置备份
4. **CI/CD优化** - 自动化测试和部署
5. **安全加固** - HTTPS、安全头、API限流

---

*最后更新: 2024年*  
*适用于: Railway Platform, Node.js 16+*
