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
            defaultSrc: ["'self'"],
            scriptSrc: [
                "'self'", 
                "'unsafe-inline'", 
                "'unsafe-eval'",
                "https://cdnjs.cloudflare.com",
                "https://api-inference.modelscope.cn",
                "https://cdn.jsdelivr.net",
                "https://kit.fontawesome.com"
            ],
            // 允许通过<script>标签加载上述源的脚本
            scriptSrcElem: [
                "'self'",
                "https://cdnjs.cloudflare.com",
                "https://api-inference.modelscope.cn",
                "https://cdn.jsdelivr.net",
                "https://kit.fontawesome.com"
            ],
            // 临时允许内联事件处理（如 onclick），以兼容现有页面
            // 后续可逐步移除内联事件后关闭此项
            scriptSrcAttr: ["'unsafe-inline'"],
            styleSrc: [
                "'self'", 
                "'unsafe-inline'",
                "https://cdnjs.cloudflare.com",
                "https://cdn.jsdelivr.net",
                "https://fonts.googleapis.com"
            ],
            fontSrc: [
                "'self'",
                "https://fonts.gstatic.com",
                "https://cdnjs.cloudflare.com",
                "https://ka-f.fontawesome.com"
            ],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: [
                "'self'",
                "https://api-inference.modelscope.cn",
                "wss:"
            ]
        }
    }
}));

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

// 健康检查端点
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        version: '2.2.0',
        environment: process.env.NODE_ENV || 'development'
    });
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
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 碳排放管理系统正在运行`);
    console.log(`📱 本地访问: http://localhost:${PORT}`);
    console.log(`🌍 环境: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🤖 AI服务: ${process.env.AI_API_KEY ? '已启用' : '未配置'}`);
    
    if (process.env.NODE_ENV === 'development') {
        console.log(`🔧 开发模式已启用`);
        console.log(`📝 健康检查: http://localhost:${PORT}/health`);
        console.log(`⚙️  配置接口: http://localhost:${PORT}/api/config`);
    }
});

// 优雅关闭处理
process.on('SIGTERM', () => {
    console.log('📦 正在优雅关闭服务器...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('📦 正在关闭服务器...');
    process.exit(0);
});
