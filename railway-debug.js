#!/usr/bin/env node

/**
 * Railway部署调试脚本
 * 检查环境配置，验证依赖，执行健康检查
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

console.log('🚄 Railway部署调试工具');
console.log('==================\n');

// 1. 检查环境变量
console.log('1️⃣ 环境变量检查:');
const requiredEnvVars = ['NODE_ENV'];
const optionalEnvVars = ['PORT', 'AI_API_KEY', 'AI_BASE_URL', 'AI_MODEL', 'RAILWAY_ENVIRONMENT'];

requiredEnvVars.forEach(envVar => {
    const value = process.env[envVar];
    console.log(`   ${envVar}: ${value ? '✅ ' + value : '❌ 未设置'}`);
});

optionalEnvVars.forEach(envVar => {
    const value = process.env[envVar];
    console.log(`   ${envVar}: ${value ? '✅ ' + value : '⚠️  未设置'}`);
});

// 2. 检查文件结构
console.log('\n2️⃣ 文件结构检查:');
const requiredFiles = [
    'server.js',
    'package.json',
    'index.html',
    'config.js'
];

requiredFiles.forEach(file => {
    const exists = fs.existsSync(path.join(__dirname, file));
    console.log(`   ${file}: ${exists ? '✅ 存在' : '❌ 缺失'}`);
});

// 3. 检查package.json
console.log('\n3️⃣ Package.json检查:');
try {
    const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
    console.log(`   启动脚本: ${packageJson.scripts?.start ? '✅ ' + packageJson.scripts.start : '❌ 未配置'}`);
    console.log(`   主入口: ${packageJson.main ? '✅ ' + packageJson.main : '❌ 未配置'}`);
    console.log(`   Node版本要求: ${packageJson.engines?.node ? '✅ ' + packageJson.engines.node : '⚠️  未指定'}`);
    
    // 检查关键依赖
    const requiredDeps = ['express', 'compression', 'helmet', 'cors'];
    console.log('   关键依赖:');
    requiredDeps.forEach(dep => {
        const version = packageJson.dependencies?.[dep];
        console.log(`     ${dep}: ${version ? '✅ ' + version : '❌ 缺失'}`);
    });
} catch (error) {
    console.log('   ❌ package.json解析失败:', error.message);
}

// 4. 检查Railway配置
console.log('\n4️⃣ Railway配置检查:');
try {
    const railwayConfig = fs.readFileSync(path.join(__dirname, 'railway.toml'), 'utf8');
    console.log('   railway.toml: ✅ 存在');
    
    if (railwayConfig.includes('healthcheckPath')) {
        console.log('   健康检查路径: ✅ 已配置');
    } else {
        console.log('   健康检查路径: ⚠️  未配置');
    }
    
    if (railwayConfig.includes('restartPolicyType')) {
        console.log('   重启策略: ✅ 已配置');
    } else {
        console.log('   重启策略: ⚠️  未配置');
    }
} catch (error) {
    console.log('   railway.toml: ❌ 不存在或无法读取');
}

// 5. 尝试启动服务器并进行健康检查
console.log('\n5️⃣ 启动测试:');
const PORT = process.env.PORT || 3000;

// 启动子进程运行服务器
const { spawn } = require('child_process');

console.log(`   正在启动服务器 (端口 ${PORT})...`);

const serverProcess = spawn('node', ['server.js'], {
    stdio: 'pipe',
    env: { ...process.env, NODE_ENV: 'development' }
});

let serverStarted = false;
let startupLogs = [];

serverProcess.stdout.on('data', (data) => {
    const log = data.toString();
    startupLogs.push(log);
    console.log(`   服务器日志: ${log.trim()}`);
    
    if (log.includes('正在运行')) {
        serverStarted = true;
        setTimeout(() => performHealthCheck(), 2000);
    }
});

serverProcess.stderr.on('data', (data) => {
    console.error(`   服务器错误: ${data.toString().trim()}`);
});

function performHealthCheck() {
    console.log('\n6️⃣ 健康检查测试:');
    
    const options = {
        hostname: 'localhost',
        port: PORT,
        path: '/health',
        method: 'GET',
        timeout: 10000
    };

    const req = http.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            try {
                const healthData = JSON.parse(data);
                console.log(`   状态码: ${res.statusCode === 200 ? '✅ ' + res.statusCode : '❌ ' + res.statusCode}`);
                console.log(`   响应状态: ${healthData.status === 'ok' ? '✅ ' + healthData.status : '❌ ' + healthData.status}`);
                console.log(`   响应时间: ${healthData.timestamp ? '✅ ' + healthData.timestamp : '❌ 无时间戳'}`);
                console.log(`   内存使用: ${healthData.memory ? '✅ ' + Math.round(healthData.memory.used / 1024 / 1024) + 'MB' : '❌ 无内存信息'}`);
                console.log(`   运行时长: ${healthData.uptime ? '✅ ' + Math.round(healthData.uptime) + '秒' : '❌ 无运行时间'}`);
                
                generateReport();
            } catch (error) {
                console.log(`   ❌ 健康检查响应解析失败: ${error.message}`);
                generateReport();
            }
        });
    });

    req.on('error', (error) => {
        console.log(`   ❌ 健康检查失败: ${error.message}`);
        generateReport();
    });

    req.on('timeout', () => {
        console.log(`   ❌ 健康检查超时`);
        generateReport();
    });

    req.setTimeout(10000);
    req.end();
}

function generateReport() {
    console.log('\n📋 诊断报告:');
    console.log('==============');
    
    const issues = [];
    const recommendations = [];
    
    // 分析问题
    if (!process.env.NODE_ENV) {
        issues.push('NODE_ENV环境变量未设置');
        recommendations.push('在Railway控制台设置 NODE_ENV=production');
    }
    
    if (!process.env.AI_API_KEY) {
        issues.push('AI_API_KEY未配置');
        recommendations.push('在Railway控制台设置AI_API_KEY');
    }
    
    if (!serverStarted) {
        issues.push('服务器启动失败');
        recommendations.push('检查服务器日志中的错误信息');
    }
    
    if (issues.length === 0) {
        console.log('✅ 未发现配置问题');
    } else {
        console.log('❌ 发现以下问题:');
        issues.forEach(issue => console.log(`   - ${issue}`));
        
        console.log('\n💡 建议修复:');
        recommendations.forEach(rec => console.log(`   - ${rec}`));
    }
    
    console.log('\n🚀 Railway部署命令:');
    console.log('==================');
    console.log('# 1. 推送代码到Git仓库');
    console.log('git add .');
    console.log('git commit -m "修复Railway部署问题"');
    console.log('git push origin main');
    console.log('');
    console.log('# 2. 在Railway控制台设置环境变量:');
    console.log('NODE_ENV=production');
    console.log('AI_API_KEY=ms-150d583e-ed00-46d3-ab35-570f03555599');
    console.log('AI_BASE_URL=https://api-inference.modelscope.cn/v1');
    console.log('AI_MODEL=deepseek-ai/DeepSeek-V3');
    console.log('');
    console.log('# 3. 重新部署应用');
    
    // 关闭服务器
    setTimeout(() => {
        if (serverProcess && !serverProcess.killed) {
            serverProcess.kill('SIGTERM');
        }
        process.exit(0);
    }, 1000);
}

// 超时保护
setTimeout(() => {
    console.log('\n⏰ 诊断超时，正在退出...');
    if (serverProcess && !serverProcess.killed) {
        serverProcess.kill('SIGTERM');
    }
    process.exit(1);
}, 30000);
