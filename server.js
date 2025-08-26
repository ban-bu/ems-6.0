const express = require('express');
const path = require('path');
const compression = require('compression');

const app = express();
const PORT = process.env.PORT || 3000;

const rootDir = __dirname;

app.use(compression());

// 静态资源托管，根目录即为项目目录
app.use(express.static(rootDir, {
  maxAge: '1d',
  etag: true,
  index: false
}));

// 健康检查
app.get('/healthz', (req, res) => {
  res.type('text/plain').send('ok');
});

// 首页 - 指向增强版入口
app.get('/', (req, res) => {
  res.sendFile(path.join(rootDir, 'index_improved.html'));
});

// 对于未带扩展名的路径（如潜在的前端路由），回退到首页
app.get('*', (req, res, next) => {
  if (req.path.includes('.')) return next();
  res.sendFile(path.join(rootDir, 'index_improved.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


