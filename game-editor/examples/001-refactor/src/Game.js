// 主游戏类
class Game extends PIXI.utils.EventEmitter {
    constructor() {
        super();
        
        this.app = null;
        this.currentScene = null;
        this.scenes = {};
        this.state = GAME_STATES.LOADING;
        this.score = 0;
        this.level = 1;
        
        this.init();
    }
    
    init() {
        // 创建PIXI应用
        this.app = new PIXI.Application({
            width: GAME_CONFIG.WIDTH,
            height: GAME_CONFIG.HEIGHT,
            backgroundColor: 0x2E8B57,
            antialias: true,
            resolution: window.devicePixelRatio || 1,
            autoDensity: true
        });
        
        // 将画布添加到游戏容器
        const gameContainer = document.getElementById('game-container');
        gameContainer.appendChild(this.app.view);
        
        // 设置画布样式
        this.app.view.style.position = 'absolute';
        this.app.view.style.top = '50%';
        this.app.view.style.left = '50%';
        this.app.view.style.transform = 'translate(-50%, -50%)';
        
        // 响应式处理
        this.setupResponsive();
        
        // 初始化场景
        this.initScenes();
        
        // 设置主循环
        this.setupMainLoop();
        
        // 开始加载
        this.startLoading();
    }
    
    setupMainLoop() {
        // 添加主循环更新
        this.app.ticker.add(() => {
            // 更新 TWEEN 动画
            if (typeof TWEEN !== 'undefined') {
                TWEEN.update();
            }
        });
    }
    
    setupResponsive() {
        const resize = () => {
            const width = window.innerWidth;
            const height = window.innerHeight;
            
            // 计算缩放比例
            const scale = Math.min(
                width / GAME_CONFIG.WIDTH,
                height / GAME_CONFIG.HEIGHT
            );
            
            this.app.view.style.width = GAME_CONFIG.WIDTH * scale + 'px';
            this.app.view.style.height = GAME_CONFIG.HEIGHT * scale + 'px';
        };
        
        window.addEventListener('resize', resize);
        resize();
    }
    
    initScenes() {
        // 创建场景
        this.scenes.loading = new LoadingScene(this);
        this.scenes.menu = new MenuScene(this);
        this.scenes.game = new GameScene(this);
        this.scenes.test = new TestScene(this);
        
        // // 设置场景切换事件
        this.on('scene_change', this.switchScene.bind(this));
    }
    
    startLoading() {
        this.switchScene('loading');
        this.scenes.loading.startLoading();
    }
    
    switchScene(sceneName) {
        // 移除当前场景
        if (this.currentScene) {
            this.app.stage.removeChild(this.currentScene);
            this.currentScene.onExit();
        }
        
        // 切换到新场景
        this.currentScene = this.scenes[sceneName];
        if (this.currentScene) {
            this.app.stage.addChild(this.currentScene);
            this.currentScene.onEnter();
            this.state = sceneName;
        }
    }
    
    // 游戏状态管理
    setState(newState) {
        const oldState = this.state;
        this.state = newState;
        this.emit('state_change', newState, oldState);
    }
    
    // 分数管理
    addScore(points) {
        this.score += points;
        this.emit('score_update', this.score);
    }
    
    getScore() {
        return this.score;
    }
    
    resetScore() {
        this.score = 0;
        this.emit('score_update', this.score);
    }
    
    // 关卡管理
    nextLevel() {
        this.level++;
        this.emit('level_change', this.level);
    }
    
    getLevel() {
        return this.level;
    }
    
    resetLevel() {
        this.level = 1;
        this.emit('level_change', this.level);
    }
    
    // 游戏重置
    restart() {
        this.resetScore();
        this.resetLevel();
        this.switchScene('game');
    }
    
    // 暂停/恢复
    pause() {
        if (this.state === GAME_STATES.PLAYING) {
            this.setState(GAME_STATES.PAUSED);
            this.app.ticker.stop();
        }
    }
    
    resume() {
        if (this.state === GAME_STATES.PAUSED) {
            this.setState(GAME_STATES.PLAYING);
            this.app.ticker.start();
        }
    }
    
    // 游戏结束
    gameOver() {
        this.setState(GAME_STATES.GAME_OVER);
        this.emit('game_over', this.score);
    }
    
    // 销毁游戏
    destroy() {
        if (this.app) {
            this.app.destroy(true);
            this.app = null;
        }
        
        // 清理场景
        Object.values(this.scenes).forEach(scene => {
            if (scene.destroy) {
                scene.destroy();
            }
        });
        
        this.removeAllListeners();
    }
    
    // 获取游戏时间
    getGameTime() {
        return this.app ? this.app.ticker.elapsedMS : 0;
    }
    
    // 检查是否为移动设备
    isMobile() {
        return window.innerWidth <= 768;
    }
    
    // 获取适配的网格配置
    getGridConfig() {
        return this.isMobile() ? GAME_CONFIG.GRID.MOBILE : GAME_CONFIG.GRID.DESKTOP;
    }
}
