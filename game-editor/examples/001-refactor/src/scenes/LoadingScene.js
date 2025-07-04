// 加载场景
class LoadingScene extends PIXI.Container {
    constructor(game) {
        super();
        
        this.game = game;
        this.assetLoader = new AssetLoader();
        this.loadingProgress = 0;
        
        this.createUI();
        this.setupEvents();
    }
    
    createUI() {
        // 背景
        this.background = new PIXI.Graphics();
        this.background.beginFill(0x2E8B57);
        this.background.drawRect(0, 0, GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT);
        this.background.endFill();
        this.addChild(this.background);
        
        // 蛋形图标
        this.createEggIcon();
        
        // 加载文本
        this.loadingText = new PIXI.Text('加载中...', {
            fontFamily: 'Arial',
            fontSize: 36,
            fill: 0xFFFFFF,
            fontWeight: 'bold'
        });
        this.loadingText.anchor.set(0.5);
        this.loadingText.x = GAME_CONFIG.WIDTH / 2;
        this.loadingText.y = GAME_CONFIG.HEIGHT / 2 + 100;
        this.addChild(this.loadingText);
        
        // 进度条背景
        this.progressBg = new PIXI.Graphics();
        this.progressBg.beginFill(0x000000, 0.3);
        this.progressBg.drawRoundedRect(0, 0, 400, 20, 10);
        this.progressBg.endFill();
        this.progressBg.x = (GAME_CONFIG.WIDTH - 400) / 2;
        this.progressBg.y = GAME_CONFIG.HEIGHT / 2 + 150;
        this.addChild(this.progressBg);
        
        // 进度条
        this.progressBar = new PIXI.Graphics();
        this.progressBar.x = this.progressBg.x;
        this.progressBar.y = this.progressBg.y;
        this.addChild(this.progressBar);
        
        // 百分比文本
        this.percentText = new PIXI.Text('0%', {
            fontFamily: 'Arial',
            fontSize: 24,
            fill: 0xFFFFFF
        });
        this.percentText.anchor.set(0.5);
        this.percentText.x = GAME_CONFIG.WIDTH / 2;
        this.percentText.y = GAME_CONFIG.HEIGHT / 2 + 190;
        this.addChild(this.percentText);
    }
    
    createEggIcon() {
        // 使用RootManager的统一蛋形方法创建加载图标
        this.eggIcon = window.rootManager.createEggShape(0, 0, 48, 60, 0xFFD700, true);
        
        this.eggIcon.x = GAME_CONFIG.WIDTH / 2;
        this.eggIcon.y = GAME_CONFIG.HEIGHT / 2 - 50;
        this.addChild(this.eggIcon);
        
        // 添加旋转动画
        this.game.app.ticker.add(() => {
            this.eggIcon.rotation += 0.02;
        });
    }
    
    setupEvents() {
        this.assetLoader.on('progress', this.onLoadProgress.bind(this));
        this.assetLoader.on('complete', this.onLoadComplete.bind(this));
    }
    
    onLoadProgress(progress) {
        this.loadingProgress = progress;
        this.updateProgressBar();
        
        // 更新DOM进度条
        const domProgressBar = document.querySelector('.loading-progress');
        if (domProgressBar) {
            domProgressBar.style.width = (progress * 100) + '%';
        }
    }
    
    updateProgressBar() {
        const width = 400 * this.loadingProgress;
        
        this.progressBar.clear();
        this.progressBar.beginFill(0xFFD700);
        this.progressBar.drawRoundedRect(0, 0, width, 20, 10);
        this.progressBar.endFill();
        
        // 更新百分比文本
        this.percentText.text = Math.round(this.loadingProgress * 100) + '%';
    }
    
    onLoadComplete() {
        // 隐藏DOM加载界面
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 500);
        }
        
        // 延迟切换到菜单场景
        setTimeout(() => {
            this.game.emit('scene_change', 'menu');
        }, 1000);
    }
    
    startLoading() {
        // 开始加载资源
        this.assetLoader.loadAssets().catch(error => {
            console.error('Asset loading failed:', error);
            
            // 即使加载失败也尝试继续
            setTimeout(() => {
                this.game.emit('scene_change', 'menu');
            }, 2000);
        });
    }
    
    onEnter() {
        // 场景进入时的处理
        this.visible = true;
    }
    
    onExit() {
        // 场景退出时的处理
        this.visible = false;
    }
    
    destroy() {
        if (this.assetLoader) {
            this.assetLoader.removeAllListeners();
        }
        super.destroy();
    }
}