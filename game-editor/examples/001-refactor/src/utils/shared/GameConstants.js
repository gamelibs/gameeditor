/**
 * 游戏常量定义
 * 存储所有游戏中使用的常量值
 */
class GameConstants {
    // 游戏状态
    static GAME_STATES = {
        LOADING: 'loading',
        MENU: 'menu',
        PLAYING: 'playing',
        PAUSED: 'paused',
        GAME_OVER: 'game_over',
        VICTORY: 'victory'
    };

    // 测试模块类型
    static TEST_MODULES = {
        STEP1: 'step1',
        STEP2: 'step2',
        STEP3: 'step3',
        STEP4: 'step4',
        STEP5: 'step5',
        STEP6: 'step6',
        STEP7: 'step7',
        STEP8: 'step8'
    };

    // 动画类型
    static ANIMATION_TYPES = {
        FALLING: 'falling',
        EXPLOSION: 'explosion',
        PULSE: 'pulse',
        FADE: 'fade',
        SCALE: 'scale'
    };

    // 事件类型
    static EVENTS = {
        PROJECTILE_FIRED: 'projectile_fired',
        PROJECTILE_COLLISION: 'projectile_collision',
        EGGS_ELIMINATED: 'eggs_eliminated',
        EGGS_FALLING: 'eggs_falling',
        FLOATING_DETECTED: 'floating_detected',
        LEVEL_COMPLETE: 'level_complete',
        GAME_OVER: 'game_over'
    };

    // 方向定义
    static DIRECTIONS = {
        UP: 'up',
        DOWN: 'down',
        LEFT: 'left',
        RIGHT: 'right',
        UP_LEFT: 'up_left',
        UP_RIGHT: 'up_right',
        DOWN_LEFT: 'down_left',
        DOWN_RIGHT: 'down_right'
    };

    // 物理常量
    static PHYSICS = {
        GRAVITY: 0.08,
        FRICTION: 0.997,
        BOUNCE_X: 0.9,
        BOUNCE_Y: 0.8,
        MAX_VELOCITY: 50,
        MIN_VELOCITY: 0.1
    };

    // 数学常量
    static MATH = {
        PI: Math.PI,
        PI_2: Math.PI / 2,
        PI2: Math.PI * 2,
        DEG_TO_RAD: Math.PI / 180,
        RAD_TO_DEG: 180 / Math.PI
    };

    // 时间常量（毫秒）
    static TIME = {
        SECOND: 1000,
        MINUTE: 60000,
        ANIMATION_FRAME: 16.67, // 60fps
        DEBOUNCE_DELAY: 100,
        LONG_PRESS: 500
    };

    // 尺寸常量
    static SIZE = {
        EGG_RADIUS: 18,
        MIN_TOUCH_SIZE: 44,
        GRID_PADDING: 10,
        BUTTON_HEIGHT: 40,
        BUTTON_WIDTH: 100
    };

    // 颜色常量
    static COLORS = {
        PRIMARY: 0x3498DB,
        SECONDARY: 0x2ECC71,
        SUCCESS: 0x27AE60,
        WARNING: 0xF39C12,
        DANGER: 0xE74C3C,
        INFO: 0x3498DB,
        LIGHT: 0xBDC3C7,
        DARK: 0x2C3E50,
        WHITE: 0xFFFFFF,
        BLACK: 0x000000,
        TRANSPARENT: 0x000000 // with alpha
    };

    // Z-Index 层级
    static Z_INDEX = {
        BACKGROUND: 0,
        GRID_LINES: 10,
        EGGS: 20,
        PROJECTILES: 30,
        EFFECTS: 40,
        UI: 50,
        OVERLAY: 60,
        TOOLTIP: 70,
        MODAL: 80,
        DEBUG: 90
    };

    // 错误码
    static ERROR_CODES = {
        GRID_OUT_OF_BOUNDS: 'GRID_OUT_OF_BOUNDS',
        INVALID_COLOR: 'INVALID_COLOR',
        PROJECTILE_NOT_FOUND: 'PROJECTILE_NOT_FOUND',
        ANIMATION_FAILED: 'ANIMATION_FAILED',
        CONFIG_MISSING: 'CONFIG_MISSING',
        MANAGER_NOT_INITIALIZED: 'MANAGER_NOT_INITIALIZED'
    };

    // 调试级别
    static DEBUG_LEVELS = {
        NONE: 0,
        ERROR: 1,
        WARN: 2,
        INFO: 3,
        DEBUG: 4,
        VERBOSE: 5
    };

    // 本地存储键名
    static STORAGE_KEYS = {
        GAME_SETTINGS: 'eggShooter_settings',
        HIGH_SCORES: 'eggShooter_highScores',
        PLAYER_PROGRESS: 'eggShooter_progress',
        DEBUG_MODE: 'eggShooter_debugMode'
    };

    // 网格类型
    static GRID_TYPES = {
        HEXAGONAL: 'hexagonal',
        SQUARE: 'square',
        TRIANGLE: 'triangle'
    };

    // 发射模式
    static SHOOT_MODES = {
        NORMAL: 'normal',
        RAPID: 'rapid',
        PRECISION: 'precision',
        POWER: 'power'
    };

    // 特殊蛋类型（为后续扩展预留）
    static EGG_TYPES = {
        NORMAL: 'normal',
        BOMB: 'bomb',
        RAINBOW: 'rainbow',
        FROZEN: 'frozen',
        ELECTRIC: 'electric',
        MAGNET: 'magnet'
    };

    /**
     * 获取常量值
     * @param {string} category - 常量分类
     * @param {string} key - 常量键名
     * @returns {*} 常量值
     */
    static get(category, key) {
        const categoryObj = this[category];
        if (categoryObj && key in categoryObj) {
            return categoryObj[key];
        }
        console.warn(`GameConstants: 未找到常量 ${category}.${key}`);
        return null;
    }

    /**
     * 检查常量是否存在
     * @param {string} category - 常量分类
     * @param {string} key - 常量键名
     * @returns {boolean} 是否存在
     */
    static has(category, key) {
        const categoryObj = this[category];
        return categoryObj && key in categoryObj;
    }

    /**
     * 获取所有常量
     * @returns {Object} 所有常量
     */
    static getAll() {
        const result = {};
        for (const key of Object.getOwnPropertyNames(this)) {
            if (typeof this[key] === 'object' && this[key] !== null && key !== 'prototype') {
                result[key] = this[key];
            }
        }
        return result;
    }
}

// 暴露到全局
window.GameConstants = GameConstants;
