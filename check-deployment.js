#!/usr/bin/env node

// 碳排放管理系统部署检查脚本
// 用于验证系统是否正确配置和运行

const fs = require('fs');
const path = require('path');
const http = require('http');

class DeploymentChecker {
    constructor() {
        this.errors = [];
        this.warnings = [];
        this.info = [];
    }

    log(type, message) {
        const timestamp = new Date().toLocaleString();
        const formatted = `[${timestamp}] ${type.toUpperCase()}: ${message}`;
        
        console.log(formatted);
        
        switch(type) {
            case 'error':
                this.errors.push(message);
                break;
            case 'warning':
                this.warnings.push(message);
                break;
            case 'info':
                this.info.push(message);
                break;
        }
    }

    checkFileExists(filePath, required = true) {
        const fullPath = path.join(__dirname, filePath);
        const exists = fs.existsSync(fullPath);
        
        if (exists) {
            this.log('info', `✅ 文件存在: ${filePath}`);
        } else {
            if (required) {
                this.log('error', `❌ 必需文件缺失: ${filePath}`);
            } else {
                this.log('warning', `⚠️  可选文件缺失: ${filePath}`);
            }
        }
        
        return exists;
    }

    checkPackageJson() {
        this.log('info', '📦 检查package.json配置...');
        
        if (!this.checkFileExists('package.json')) {
            return false;
        }
        
        try {
            const packageData = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
            
            // 检查必需字段
            const requiredFields = ['name', 'version', 'main', 'scripts'];
            requiredFields.forEach(field => {
                if (packageData[field]) {
                    this.log('info', `✅ package.json包含${field}字段`);
                } else {
                    this.log('error', `❌ package.json缺少${field}字段`);
                }
            });
            
            // 检查启动脚本
            if (packageData.scripts && packageData.scripts.start) {
                this.log('info', `✅ 启动脚本: ${packageData.scripts.start}`);
            } else {
                this.log('error', '❌ 缺少启动脚本');
            }
            
            // 检查必需依赖
            const requiredDeps = ['express', 'compression', 'helmet', 'cors'];
            if (packageData.dependencies) {
                requiredDeps.forEach(dep => {
                    if (packageData.dependencies[dep]) {
                        this.log('info', `✅ 依赖项存在: ${dep}`);
                    } else {
                        this.log('warning', `⚠️  建议添加依赖: ${dep}`);
                    }
                });
            } else {
                this.log('error', '❌ 没有配置依赖项');
            }
            
            return true;
        } catch (error) {
            this.log('error', `❌ package.json解析错误: ${error.message}`);
            return false;
        }
    }

    checkRequiredFiles() {
        this.log('info', '📁 检查必需文件...');
        
        const requiredFiles = [
            'server.js',
            'index.html',
            'config.js'
        ];
        
        const optionalFiles = [
            'index_improved.html',
            'styles.css',
            'improvements.css',
            'script_enhanced.js',
            'start.sh',
            '.gitignore',
            'railway.toml'
        ];
        
        let allRequired = true;
        
        requiredFiles.forEach(file => {
            if (!this.checkFileExists(file, true)) {
                allRequired = false;
            }
        });
        
        optionalFiles.forEach(file => {
            this.checkFileExists(file, false);
        });
        
        return allRequired;
    }

    checkEnvironmentConfig() {
        this.log('info', '🔧 检查环境配置...');
        
        const envVars = [
            'NODE_ENV',
            'PORT',
            'AI_API_KEY',
            'AI_BASE_URL',
            'AI_MODEL'
        ];
        
        envVars.forEach(varName => {
            if (process.env[varName]) {
                this.log('info', `✅ 环境变量已设置: ${varName}`);
            } else {
                if (varName === 'NODE_ENV' || varName === 'PORT') {
                    this.log('warning', `⚠️  环境变量未设置，将使用默认值: ${varName}`);
                } else {
                    this.log('warning', `⚠️  环境变量未设置: ${varName}`);
                }
            }
        });
        
        // 检查配置文件
        this.checkFileExists('env.example', false);
    }

    async checkServerHealth(port = 3000) {
        this.log('info', '🩺 检查服务器健康状态...');
        
        return new Promise((resolve) => {
            const options = {
                hostname: 'localhost',
                port: port,
                path: '/health',
                method: 'GET',
                timeout: 5000
            };
            
            const req = http.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const healthData = JSON.parse(data);
                        this.log('info', `✅ 服务器健康状态: ${healthData.status}`);
                        this.log('info', `ℹ️  服务器版本: ${healthData.version}`);
                        resolve(true);
                    } catch (error) {
                        this.log('warning', '⚠️  健康检查响应格式异常');
                        resolve(false);
                    }
                });
            });
            
            req.on('error', (error) => {
                this.log('warning', `⚠️  无法连接到服务器 (这在部署前是正常的): ${error.message}`);
                resolve(false);
            });
            
            req.on('timeout', () => {
                this.log('warning', '⚠️  服务器响应超时');
                req.destroy();
                resolve(false);
            });
            
            req.end();
        });
    }

    checkRailwayConfig() {
        this.log('info', '🚂 检查Railway部署配置...');
        
        if (this.checkFileExists('railway.toml', false)) {
            try {
                const railwayConfig = fs.readFileSync(path.join(__dirname, 'railway.toml'), 'utf8');
                if (railwayConfig.includes('[build]') && railwayConfig.includes('[deploy]')) {
                    this.log('info', '✅ Railway配置格式正确');
                } else {
                    this.log('warning', '⚠️  Railway配置可能不完整');
                }
            } catch (error) {
                this.log('warning', `⚠️  Railway配置读取失败: ${error.message}`);
            }
        }
        
        // 检查package.json的engines字段
        try {
            const packageData = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
            if (packageData.engines) {
                this.log('info', '✅ 已配置Node.js版本要求');
            } else {
                this.log('warning', '⚠️  建议在package.json中配置engines字段');
            }
        } catch (error) {
            // 已在其他地方处理
        }
    }

    async runFullCheck() {
        console.log('🔍 开始碳排放管理系统部署检查...\n');
        
        this.checkPackageJson();
        console.log('');
        
        this.checkRequiredFiles();
        console.log('');
        
        this.checkEnvironmentConfig();
        console.log('');
        
        this.checkRailwayConfig();
        console.log('');
        
        await this.checkServerHealth();
        console.log('');
        
        // 输出总结
        this.printSummary();
    }

    printSummary() {
        console.log('📋 检查结果总结:');
        console.log('================');
        
        if (this.errors.length > 0) {
            console.log(`❌ 错误 (${this.errors.length}个):`);
            this.errors.forEach(error => console.log(`   • ${error}`));
            console.log('');
        }
        
        if (this.warnings.length > 0) {
            console.log(`⚠️  警告 (${this.warnings.length}个):`);
            this.warnings.forEach(warning => console.log(`   • ${warning}`));
            console.log('');
        }
        
        console.log(`ℹ️  信息: ${this.info.length}个检查项通过`);
        console.log('');
        
        if (this.errors.length === 0) {
            console.log('🎉 项目已准备好部署到Railway！');
            console.log('');
            console.log('🚀 部署步骤:');
            console.log('1. git add . && git commit -m "Ready for deployment"');
            console.log('2. git push origin main');
            console.log('3. 在Railway中连接GitHub仓库');
            console.log('4. 设置环境变量 (参考 env.example)');
            console.log('5. 等待自动部署完成');
        } else {
            console.log('🔧 请解决上述错误后重新检查');
        }
    }
}

// 运行检查
if (require.main === module) {
    const checker = new DeploymentChecker();
    checker.runFullCheck();
}

module.exports = DeploymentChecker;
