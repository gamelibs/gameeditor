/**
 * 游戏配置管理器
 * 统一管理所有游戏相关的配置参数
 */
class GameConfig {
    constructor() {
        // 游戏基础配置
        this.game = {
            width: 800,
            height: 600,
            background: 0x2C3E50
        };

        // 网格配置
        this.grid = {
            rows: 6,
            cols: 8,
            eggRadius: 18,
            startX: -140,
            startY: -200,
            showGrid: true,
            gridColor: 0x888888,
            gridAlpha: 0.4
        };

        // 发射器配置
        this.shooter = {
            x: 0,
            y: 280,
            power: 1,
            maxDistance: 2000,
            physics: {
                gravity: 0.08,      // 已优化
                friction: 0.997,    // 已优化
                bounceX: 0.9,
                bounceY: 0.8,
                enableBounce: true
            }
        };

        // 发射速度配置（已优化）
        this.projectile = {
            baseSpeedDivisor: 20,           // 基础速度除数（已从40优化到20）
            minPowerMultiplier: 0.8,        // 最小力度倍数
            maxPowerMultiplier: 1.2,        // 最大力度倍数
            verticalBonus: 2.4,             // 垂直发射加成（已从1.8优化到2.4）
            verticalAngleThreshold: 0.3     // 垂直角度阈值
        };

        // 碰撞检测配置
        this.collision = {
            checkRadius: 35,
            snapThreshold: 40
        };

        // 游戏逻辑配置
        this.gameLogic = {
            minMatchCount: 3,           // 最少消除数量
            enableDirectFalling: true,  // 启用直接掉落
            enableFloatingDetection: true, // 启用悬空检测
            floatingCheckFromBottom: true  // 从底部开始检测悬空
        };

        // 动画配置
        this.animation = {
            fallingSpeed: {
                min: 4,
                max: 12
            },
            gravity: 0.3,
            explosion: {
                particleCount: 8,
                radius: 50,
                duration: 1000
            },
            elimination: {
                pulseDuration: 500,
                minAlpha: 0.3,
                maxAlpha: 1.0
            }
        };

        // 颜色配置
        this.colors = {
            // 游戏专用6种蛋颜色（高对比度）
            gameEggs: [
                0xFF0000, // 纯红色
                0xFFFF00, // 纯黄色
                0xFF69B4, // 亮粉色
                0x0066FF, // 纯蓝色
                0x00FF00, // 纯绿色
                0x9933FF  // 纯紫色
            ],
            // 装饰用颜色池
            decorative: [
                0xFF6B6B, // 红色
                0x4ECDC4, // 青色  
                0x45B7D1, // 蓝色
                0x96CEB4, // 绿色
                0xFECA57, // 黄色
                0xFF9FF3, // 粉色
                0x54A0FF, // 浅蓝
                0x5F27CD, // 紫色
                0x00D2D3, // 青绿
                0xFF6348  // 橙红
            ]
        };

        // UI配置
        this.ui = {
            button: {
                width: 100,
                height: 40,
                fontSize: 16,
                activeColor: 0x3498DB,
                inactiveColor: 0x34495E,
                textColor: 0xFFFFFF
            },
            text: {
                fontSize: 16,
                color: 0xFFFFFF,
                fontFamily: 'Arial'
            }
        };
    }

    /**
     * 获取指定路径的配置值
     * @param {string} path - 配置路径，如 'grid.rows'
     * @param {*} defaultValue - 默认值
     * @returns {*} 配置值
     */
    get(path, defaultValue = null) {
        const keys = path.split('.');
        let value = this;
        
        for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
                value = value[key];
            } else {
                return defaultValue;
            }
        }
        
        return value;
    }

    /**
     * 设置指定路径的配置值
     * @param {string} path - 配置路径
     * @param {*} value - 配置值
     */
    set(path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        let target = this;
        
        for (const key of keys) {
            if (!(key in target)) {
                target[key] = {};
            }
            target = target[key];
        }
        
        target[lastKey] = value;
    }

    /**
     * 合并配置
     * @param {Object} config - 要合并的配置对象
     */
    merge(config) {
        this._deepMerge(this, config);
    }

    /**
     * 深度合并对象
     * @private
     */
    _deepMerge(target, source) {
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                if (!target[key]) target[key] = {};
                this._deepMerge(target[key], source[key]);
            } else {
                target[key] = source[key];
            }
        }
    }

    /**
     * 获取完整配置的副本
     * @returns {Object} 配置副本
     */
    getAll() {
        return JSON.parse(JSON.stringify(this));
    }
}

// 创建全局配置实例
window.GameConfig = GameConfig;
window.gameConfig = window.gameConfig || new GameConfig();
