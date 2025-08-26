const express = require('express');
const compression = require('compression');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 安全和性能中间件
app.use(helmet({
    contentSecurityPolicy: {
        useDefaults: true,
        directives: {
            // 使用明确的破折号格式，确保各浏览器按预期解析
            "default-src": ["'self'"],
            "script-src": [
                "'self'",
                "'unsafe-inline'",
                "'unsafe-eval'",
                "https://cdnjs.cloudflare.com",
                "https://api-inference.modelscope.cn",
                "https://cdn.jsdelivr.net",
                "https://kit.fontawesome.com",
                "https://unpkg.com"
            ],
            "script-src-elem": [
                "'self'",
                "'unsafe-inline'",
                "https://cdnjs.cloudflare.com",
                "https://api-inference.modelscope.cn",
                "https://cdn.jsdelivr.net",
                "https://kit.fontawesome.com",
                "https://unpkg.com"
            ],
            // 兼容现有内联事件处理器（后续可移除）
            "script-src-attr": ["'unsafe-inline'"],
            "style-src": [
                "'self'",
                "'unsafe-inline'",
                "https://cdnjs.cloudflare.com",
                "https://cdn.jsdelivr.net",
                "https://fonts.googleapis.com"
            ],
            "font-src": [
                "'self'",
                "https://fonts.gstatic.com",
                "https://cdnjs.cloudflare.com",
                "https://ka-f.fontawesome.com"
            ],
            "img-src": ["'self'", "data:", "https:"],
            "connect-src": [
                "'self'",
                "https://api-inference.modelscope.cn",
                "wss:"
            ]
        }
    }
}));

// 为HTML响应禁用缓存，避免旧版页面（含unpkg引用）被浏览器缓存
app.use((req, res, next) => {
    if (req.method === 'GET' && (req.path === '/' || req.path.endsWith('.html'))) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('Surrogate-Control', 'no-store');
    }
    if (req.method === 'GET' && (req.path.endsWith('/config.js') || req.path.endsWith('/script.js'))) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('Surrogate-Control', 'no-store');
    }
    next();
});

// 启用GZIP压缩
app.use(compression());

// CORS配置
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://*.railway.app', 'https://*.up.railway.app'] 
        : ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true
}));

// 解析JSON请求
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 静态文件服务
app.use(express.static(path.join(__dirname), {
    maxAge: process.env.NODE_ENV === 'production' ? '1d' : '0',
    etag: true,
    lastModified: true
}));

// 增强的健康检查端点
app.get('/health', (req, res) => {
    const healthData = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '2.2.0',
        environment: process.env.NODE_ENV || 'development',
        port: PORT,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        platform: process.platform,
        nodeVersion: process.version,
        railway: {
            environment: process.env.RAILWAY_ENVIRONMENT || 'not-railway',
            project: process.env.RAILWAY_PROJECT_NAME || 'unknown',
            service: process.env.RAILWAY_SERVICE_NAME || 'unknown'
        },
        ai: {
            enabled: !!process.env.AI_API_KEY,
            configured: !!process.env.AI_BASE_URL
        }
    };
    
    // 设置健康检查响应头
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Content-Type', 'application/json');
    
    // 记录健康检查请求（仅在开发环境）
    if (process.env.NODE_ENV === 'development') {
        console.log(`💓 健康检查请求 - ${new Date().toISOString()}`);
    }
    
    res.status(200).json(healthData);
});

// API端点 - 用于前端获取环境配置
app.get('/api/config', (req, res) => {
    res.json({
        aiConfig: {
            baseUrl: process.env.AI_BASE_URL || 'https://api-inference.modelscope.cn/v1',
            model: process.env.AI_MODEL || 'deepseek-ai/DeepSeek-V3',
            // 注意：不要在这里暴露API密钥，前端会通过环境变量获取
        },
        features: {
            aiEnabled: !!process.env.AI_API_KEY,
            debugMode: process.env.NODE_ENV === 'development'
        }
    });
});

// 文件上传处理
app.post('/api/upload', (req, res) => {
    try {
        // 由于这是一个前端处理的应用，文件在客户端被解析
        // 这个端点主要用于日志记录和可能的文件元数据存储
        console.log('收到文件上传请求');
        
        res.json({ 
            success: true,
            message: '文件上传请求已收到',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('文件上传处理错误:', error);
        res.status(500).json({
            success: false,
            message: '文件上传处理失败',
            error: error.message
        });
    }
});

// 主路由
app.get('/', (req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 备用路由（兼容性）
app.get('/improved', (req, res) => {
    res.sendFile(path.join(__dirname, 'index_improved.html'));
});

// SPA路由 - 所有其他路由都返回主页面
app.get('*', (req, res) => {
    // 检查是否存在静态文件
    const filePath = path.join(__dirname, req.path);
    const fs = require('fs');
    
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        return res.sendFile(filePath);
    }
    
    // 如果不是静态文件，返回主页面
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(500).json({
        error: '服务器内部错误',
        message: process.env.NODE_ENV === 'development' ? err.message : '请稍后重试'
    });
});

// 404处理
app.use((req, res) => {
    res.status(404).json({
        error: '页面未找到',
        path: req.path
    });
});

// 启动服务器
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 碳排放管理系统正在运行`);
    console.log(`📱 本地访问: http://localhost:${PORT}`);
    console.log(`🌍 环境: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🤖 AI服务: ${process.env.AI_API_KEY ? '已启用' : '未配置'}`);
    console.log(`📊 端口绑定: ${PORT} (绑定到 0.0.0.0)`);
    console.log(`⏰ 启动时间: ${new Date().toISOString()}`);
    
    if (process.env.NODE_ENV === 'development') {
        console.log(`🔧 开发模式已启用`);
        console.log(`📝 健康检查: http://localhost:${PORT}/health`);
        console.log(`⚙️  配置接口: http://localhost:${PORT}/api/config`);
    }
    
    // Railway部署完成信号
    if (process.env.RAILWAY_ENVIRONMENT) {
        console.log(`🚄 Railway环境: ${process.env.RAILWAY_ENVIRONMENT}`);
        console.log(`✅ 服务器启动完成，等待连接...`);
    }
});

// 设置服务器超时
server.timeout = 120000; // 2分钟
server.keepAliveTimeout = 65000; // 65秒
server.headersTimeout = 66000; // 66秒

// 优雅关闭处理
process.on('SIGTERM', () => {
    console.log('📦 收到SIGTERM信号，正在优雅关闭服务器...');
    console.log(`⏰ 关闭时间: ${new Date().toISOString()}`);
    console.log(`⏱️  运行时长: ${Math.floor(process.uptime())} 秒`);
    
    server.close((err) => {
        if (err) {
            console.error('❌ 服务器关闭错误:', err);
            process.exit(1);
        }
        console.log('✅ 服务器已优雅关闭');
        process.exit(0);
    });
    
    // 强制关闭超时
    setTimeout(() => {
        console.log('⚠️  强制关闭服务器');
        process.exit(1);
    }, 30000);
});

process.on('SIGINT', () => {
    console.log('📦 收到SIGINT信号，正在关闭服务器...');
    process.exit(0);
});

// 捕获未处理的异常
process.on('uncaughtException', (err) => {
    console.error('💥 未捕获的异常:', err);
    console.log('🔄 尝试优雅关闭...');
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 未处理的Promise拒绝:', reason);
    console.log('Promise:', promise);
});
