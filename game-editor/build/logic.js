/**
 * 游戏模块系统框架 - Logic.js
 * 通用的类注册架构，完全由编辑器动态配置
 */

class GameModuleSystem {
    constructor() {
        this.moduleConfigs = new Map();        // 模块配置表（编辑器写入）
        this.modules = new Map();              // 已注册的模块类
    }

    /**
     * 编辑器API：注册模块配置
     * @param {string} name 模块名称
     * @param {object} config 模块配置
     */
    registerModuleConfig(name, config) {
        const moduleConfig = {
            name: name,
            file: config.file || `${name}.js`,
            className: config.className || null,
            dependencies: config.dependencies || [],
            ...config
        };
        
        this.moduleConfigs.set(name, moduleConfig);
        console.log(`📋 模块配置已注册: ${name}`);
        
        return this;
    }

    /**
     * 编辑器API：批量注册模块配置
     * @param {object} configMap 模块配置映射表
     */
    registerModuleConfigs(configMap) {
        Object.entries(configMap).forEach(([name, config]) => {
            this.registerModuleConfig(name, config);
        });
        return this;
    }

    /**
     * 注册模块类
     * @param {string} name 模块名称
     * @param {function} moduleClass 模块类
     */
    registerModule(name, moduleClass) {
        this.modules.set(name, moduleClass);
        console.log(`� 模块类已注册: ${name}`);
        return this;
    }

    /**
     * 获取模块类
     * @param {string} name 模块名称
     */
    getModule(name) {
        return this.modules.get(name);
    }

    /**
     * 获取模块配置
     * @param {string} name 模块名称
     */
    getModuleConfig(name) {
        return this.moduleConfigs.get(name);
    }
}

// 全局实例
window.gameModuleSystem = new GameModuleSystem();

// 编辑器API
window.configureGameModules = function(moduleConfigs) {
    window.gameModuleSystem.registerModuleConfigs(moduleConfigs);
    return window.gameModuleSystem;
};

console.log('📋 GameModuleSystem 类注册框架已加载');
