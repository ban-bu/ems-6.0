// 应用配置管理
// 自动从服务器获取配置，支持环境变量

class ConfigManager {
    constructor() {
        this.config = null;
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) {
            return this.config;
        }

        try {
            // 尝试从服务器获取配置
            const response = await fetch('/api/config');
            if (response.ok) {
                const serverConfig = await response.json();
                this.config = this.mergeConfig(this.getDefaultConfig(), serverConfig);
            } else {
                console.warn('无法从服务器获取配置，使用默认配置');
                this.config = this.getDefaultConfig();
            }
        } catch (error) {
            console.warn('配置获取失败，使用默认配置:', error);
            this.config = this.getDefaultConfig();
        }

        this.initialized = true;
        return this.config;
    }

    getDefaultConfig() {
        return {
            aiConfig: {
                baseUrl: 'https://api-inference.modelscope.cn/v1',
                model: 'deepseek-ai/DeepSeek-V3',
                // 默认API密钥 - 生产环境中应该通过环境变量设置
                apiKey: 'ms-150d583e-ed00-46d3-ab35-570f03555599'
            },
            features: {
                aiEnabled: true,
                debugMode: false
            },
            app: {
                name: '碳排放管理系统',
                version: '2.2.0'
            }
        };
    }

    mergeConfig(defaultConfig, serverConfig) {
        return {
            aiConfig: {
                ...defaultConfig.aiConfig,
                ...serverConfig.aiConfig,
                // 如果服务器没有提供API密钥，使用默认值
                apiKey: this.getApiKey()
            },
            features: {
                ...defaultConfig.features,
                ...serverConfig.features
            },
            app: {
                ...defaultConfig.app,
                ...serverConfig.app
            }
        };
    }

    getApiKey() {
        // 优先级：环境变量 > 服务器配置 > 默认值
        const fromWindow = (typeof window !== 'undefined' && window.AI_API_KEY) ? window.AI_API_KEY : null;
        const fromProcess = (typeof process !== 'undefined' && process.env && process.env.AI_API_KEY) ? process.env.AI_API_KEY : null;
        return fromWindow || fromProcess || 'ms-150d583e-ed00-46d3-ab35-570f03555599';
    }

    async getConfig() {
        if (!this.initialized) {
            await this.initialize();
        }
        return this.config;
    }

    async getAIConfig() {
        const config = await this.getConfig();
        return config.aiConfig;
    }

    async isAIEnabled() {
        const config = await this.getConfig();
        return config.features.aiEnabled;
    }

    async isDebugMode() {
        const config = await this.getConfig();
        return config.features.debugMode;
    }
}

// 创建全局配置管理器实例
window.configManager = new ConfigManager();

// 导出配置管理器（用于模块化系统）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ConfigManager;
}

// 向后兼容的AI_CONFIG对象
// 注意：这是异步的，需要等待配置加载完成
window.getAIConfig = async function() {
    return await window.configManager.getAIConfig();
};

// 为了向后兼容，提供同步接口（使用默认配置）
window.AI_CONFIG = {
    baseUrl: 'https://api-inference.modelscope.cn/v1',
    model: 'deepseek-ai/DeepSeek-V3',
    apiKey: 'ms-150d583e-ed00-46d3-ab35-570f03555599'
};

// 在页面加载完成后初始化配置
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', async () => {
        try {
            const config = await window.configManager.getConfig();
            
            // 更新全局AI_CONFIG对象
            window.AI_CONFIG = config.aiConfig;
            
            console.log('✅ 配置已加载:', {
                aiEnabled: config.features.aiEnabled,
                model: config.aiConfig.model,
                debug: config.features.debugMode
            });
            
            // 触发配置加载完成事件
            const event = new CustomEvent('configLoaded', { detail: config });
            document.dispatchEvent(event);
            
        } catch (error) {
            console.error('❌ 配置加载失败:', error);
        }
    });
}
