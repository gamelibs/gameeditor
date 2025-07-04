// 菜单场景
class MenuScene extends PIXI.Container {
    constructor(game) {
        super();
        
        this.game = game;
        
        // 初始化音频管理器（如果还没有）
        if (!this.game.audioManager) {
            this.game.audioManager = new AudioManager();
        }
        
        this.createUI();
        this.setupEvents();
    }
    
    createUI() {
        // 游戏背景
        this.createBackground();
        
        // 游戏标题
        this.createTitle();
        
        // 蛋形装饰
        this.createEggDecorations();
        
        // 菜单按钮
        this.createButtons();
        
        // 最高分显示
        this.createHighScore();
    }
    
    createBackground() {
        // 草地背景
        this.background = new PIXI.Graphics();
        this.background.beginFill(0x228B22);
        this.background.drawRect(0, 0, GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT);
        this.background.endFill();
        
        // 草地纹理
        for (let i = 0; i < 100; i++) {
            this.background.lineStyle(1, 0x32CD32, 0.3);
            const x = Math.random() * GAME_CONFIG.WIDTH;
            const y = Math.random() * GAME_CONFIG.HEIGHT;
            this.background.moveTo(x, y);
            this.background.lineTo(x + Math.random() * 20 - 10, y + Math.random() * 10 - 5);
        }
        
        this.addChild(this.background);
    }
    
    createTitle() {
        // 主标题
        this.title = new PIXI.Text('蛋蛋射击', {
            fontFamily: 'Arial',
            fontSize: 64,
            fill: 0xFFFFFF,
            fontWeight: 'bold',
            stroke: 0x000000,
            strokeThickness: 4,
            dropShadow: true,
            dropShadowColor: 0x000000,
            dropShadowBlur: 4,
            dropShadowAngle: Math.PI / 6,
            dropShadowDistance: 6
        });
        
        this.title.anchor.set(0.5);
        this.title.x = GAME_CONFIG.WIDTH / 2;
        this.title.y = 120;
        this.addChild(this.title);
        
        // 副标题
        this.subtitle = new PIXI.Text('Egg Shooter', {
            fontFamily: 'Arial',
            fontSize: 24,
            fill: 0xFFD700,
            fontStyle: 'italic'
        });
        
        this.subtitle.anchor.set(0.5);
        this.subtitle.x = GAME_CONFIG.WIDTH / 2;
        this.subtitle.y = 180;
        this.addChild(this.subtitle);
    }
    
    createEggDecorations() {
        // 左侧装饰蛋
        this.leftEgg = this.createDecorativeEgg(100, 250, 32, 40, 0xFF6B6B);
        this.addChild(this.leftEgg);
        
        // 右侧装饰蛋
        this.rightEgg = this.createDecorativeEgg(700, 350, 28, 35, 0x4ECDC4);
        this.addChild(this.rightEgg);
        
        // 装饰性框架
        this.createDecorativeFrame();
    }
    
    createDecorativeEgg(x, y, width, height, color) {
        // 使用RootManager的统一蛋形方法
        const egg = window.rootManager.createEggShape(0, 0, width, height, color, true);
        
        egg.x = x;
        egg.y = y;
        
        return egg;
    }
    
    createDecorativeFrame() {
        this.decorativeFrame = new PIXI.Graphics();
        this.decorativeFrame.lineStyle(6, 0xFFFFFF);
        
        // 装饰性框架
        const frameWidth = 120;
        const frameHeight = 80;
        const frameX = GAME_CONFIG.WIDTH / 2 - frameWidth / 2;
        const frameY = 450;
        
        this.decorativeFrame.drawRoundedRect(frameX, frameY, frameWidth, frameHeight, 10);
        
        // 装饰线条
        this.decorativeFrame.lineStyle(2, 0xFFFFFF, 0.6);
        for (let i = 1; i < 6; i++) {
            this.decorativeFrame.moveTo(frameX + (frameWidth / 6) * i, frameY);
            this.decorativeFrame.lineTo(frameX + (frameWidth / 6) * i, frameY + frameHeight);
        }
        for (let i = 1; i < 4; i++) {
            this.decorativeFrame.moveTo(frameX, frameY + (frameHeight / 4) * i);
            this.decorativeFrame.lineTo(frameX + frameWidth, frameY + (frameHeight / 4) * i);
        }
        
        this.addChild(this.decorativeFrame);
    }
    
    createButtons() {
        this.buttonsContainer = new PIXI.Container();
        
        // 开始游戏按钮
        this.startButton = this.createButton('开始游戏', 320, () => {
            this.game.emit('scene_change', 'game');
        });
        
        // 测试场景按钮
        this.testButton = this.createButton('测试场景', 380, () => {
            this.game.emit('scene_change', 'test');
        });
        
        // 设置按钮
        this.settingsButton = this.createButton('游戏设置', 440, () => {
            this.showSettings();
        });
        
        // 帮助按钮
        this.helpButton = this.createButton('游戏帮助', 500, () => {
            this.showHelp();
        });
        
        this.buttonsContainer.addChild(this.startButton);
        this.buttonsContainer.addChild(this.testButton);
        this.buttonsContainer.addChild(this.settingsButton);
        this.buttonsContainer.addChild(this.helpButton);
        
        this.addChild(this.buttonsContainer);
    }
    
    createButton(text, y, onClick) {
        const button = new PIXI.Container();
        
        // 按钮背景
        const bg = new PIXI.Graphics();
        bg.beginFill(0x4169E1);
        bg.drawRoundedRect(0, 0, 200, 50, 25);
        bg.endFill();
        
        // 按钮边框
        bg.lineStyle(3, 0xFFFFFF);
        bg.drawRoundedRect(0, 0, 200, 50, 25);
        
        // 按钮文字
        const buttonText = new PIXI.Text(text, {
            fontFamily: 'Arial',
            fontSize: 24,
            fill: 0xFFFFFF,
            fontWeight: 'bold'
        });
        buttonText.anchor.set(0.5);
        buttonText.x = 100;
        buttonText.y = 25;
        
        button.addChild(bg);
        button.addChild(buttonText);
        
        // 设置位置
        button.x = (GAME_CONFIG.WIDTH - 200) / 2;
        button.y = y;
        
        // 交互设置
        button.interactive = true;
        button.buttonMode = true;
        
        // 悬停效果
        button.on('pointerover', () => {
            bg.clear();
            bg.beginFill(0x6495ED);
            bg.drawRoundedRect(0, 0, 200, 50, 25);
            bg.endFill();
            bg.lineStyle(3, 0xFFD700);
            bg.drawRoundedRect(0, 0, 200, 50, 25);
            button.scale.set(1.05);
        });
        
        button.on('pointerout', () => {
            bg.clear();
            bg.beginFill(0x4169E1);
            bg.drawRoundedRect(0, 0, 200, 50, 25);
            bg.endFill();
            bg.lineStyle(3, 0xFFFFFF);
            bg.drawRoundedRect(0, 0, 200, 50, 25);
            button.scale.set(1.0);
        });
        
        // 点击事件
        button.on('pointerdown', () => {
            // 播放按钮点击音效 - 已禁用
            // if (this.game.audioManager) {
            //     this.game.audioManager.playButton();
            // }
            onClick();
        });
        
        return button;
    }
    
    createHighScore() {
        const highScore = localStorage.getItem('eggBubbleHighScore') || '0';
        
        this.highScoreText = new PIXI.Text(`最高分: ${highScore}`, {
            fontFamily: 'Arial',
            fontSize: 20,
            fill: 0xFFD700,
            fontWeight: 'bold'
        });
        
        this.highScoreText.anchor.set(0.5);
        this.highScoreText.x = GAME_CONFIG.WIDTH / 2;
        this.highScoreText.y = 520;
        this.addChild(this.highScoreText);
    }
    
    setupEvents() {
        // 添加浮动动画
        this.game.app.ticker.add(() => {
            if (this.leftEgg) {
                this.leftEgg.rotation += 0.01;
                this.leftEgg.y += Math.sin(Date.now() * 0.001) * 0.5;
            }
            
            if (this.rightEgg) {
                this.rightEgg.rotation -= 0.015;
                this.rightEgg.y += Math.cos(Date.now() * 0.0008) * 0.3;
            }
            
            if (this.title) {
                this.title.y = 120 + Math.sin(Date.now() * 0.002) * 5;
            }
        });
    }
    
    showSettings() {
        // TODO: 实现设置界面
        console.log('显示设置界面');
    }
    
    showHelp() {
        // TODO: 实现帮助界面
        console.log('显示帮助界面');
    }
    
    onEnter() {
        this.visible = true;
        
        // 恢复音频上下文（处理浏览器自动播放策略） - 已禁用
        // if (this.game.audioManager) {
        //     this.game.audioManager.resumeAudioContext();
        // }
        
        // 更新最高分
        const highScore = localStorage.getItem('eggBubbleHighScore') || '0';
        this.highScoreText.text = `最高分: ${highScore}`;
    }
    
    onExit() {
        this.visible = false;
    }
}
