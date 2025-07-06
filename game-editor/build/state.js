/**
 * 状态管理模块 - State.js
 * 由编辑器根据节点图动态生成
 */

class StateManager {
    constructor() {
        this.currentState = 'init';
        this.stateData = new Map();
        this.stateHistory = [];
        this.isInitialized = false;
    }

    async initialize(gameCore) {
        console.log('📊 状态管理器初始化...');
        this.gameCore = gameCore;
        this.isInitialized = true;
        
        // 编辑器将在此处注入具体的状态管理逻辑
        // 例如：游戏状态、关卡状态、玩家状态等
    }

    // 编辑器将根据节点图生成具体的状态管理方法
    // setState(state, data) { ... }
    // getState() { ... }
    // pushState(state, data) { ... }
    // popState() { ... }

    destroy() {
        console.log('🧹 状态管理器清理...');
        this.stateData.clear();
        this.stateHistory.length = 0;
        this.isInitialized = false;
    }
}

// 导出到全局
window.StateManager = StateManager;
