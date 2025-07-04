// 游戏常量配置
const GAME_CONFIG = {
    // 游戏尺寸
    WIDTH: 1920,
    HEIGHT: 1080,
    
    // 网格配置
    GRID: {
        DESKTOP: {
            WIDTH: 16,
            BASE_HEIGHT: 14,
            CELL_WIDTH: 46,
            CELL_HEIGHT: 44
        },
        MOBILE: {
            WIDTH: 12,
            BASE_HEIGHT: 14,
            CELL_WIDTH: 46,
            CELL_HEIGHT: 44
        }
    },
    
    // 泡泡颜色（蛋形主题）
    BUBBLE_COLORS: [
        0xFF0000, // 红色（红队）
        0x0000FF, // 蓝色（蓝队）
        0xFFFF00, // 黄色（裁判）
        0x00FF00, // 绿色（草地）
        0xFFA500, // 橙色（替补）
        0x800080  // 紫色（特殊）
    ],
    
    // 物理配置
    PHYSICS: {
        GRAVITY: 0.5,
        BOUNCE_DAMPING: 0.7,
        SHOOTING_SPEED: 15
    },
    
    // 游戏机制
    GAMEPLAY: {
        MIN_MATCH_COUNT: 3,
        POINTS_PER_BUBBLE: 100,
        COMBO_MULTIPLIER: 1.5,
        REFILL_TIME_BASE: 20000
    },
    
    // 音效
    SOUNDS: {
        SHOOT: 'shoot',
        POP: 'pop',
        MATCH: 'match',
        REFILL: 'refill',
        GAME_OVER: 'game_over'
    }
};

// 游戏状态
const GAME_STATES = {
    LOADING: 'loading',
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'game_over'
};

// 事件类型
const EVENTS = {
    BUBBLE_SHOT: 'bubble_shot',
    BUBBLES_MATCHED: 'bubbles_matched',
    SCORE_UPDATED: 'score_updated',
    GAME_OVER: 'game_over',
    LEVEL_COMPLETE: 'level_complete'
};
