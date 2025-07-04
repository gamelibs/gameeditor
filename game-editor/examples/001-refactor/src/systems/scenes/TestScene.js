// 测试场景 - 重构版本（只包含导航UI和模块调度）
class TestScene extends PIXI.Container {
    constructor(game) {
        super();
        
        this.game = game;
        this.currentStep = 1;
        this.stepButtons = [];
        
        // 初始化模块管理器
        this.moduleManager = new TestModuleManager();
        
        this.init();
    }
    
    init() {
        this.createBackground();
        this.createStepContent();
        this.createNavigation();
        
        // 设置模块管理器的容器
        this.moduleManager.setContainer(this.contentContainer);
        
        // 设置初始状态
        this.setActiveStep(1);
    }
    
    createBackground() {
        // 简洁的测试背景
        this.background = new PIXI.Graphics();
        this.background.beginFill(0x2C3E50);
        this.background.drawRect(0, 0, GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT);
        this.background.endFill();
        this.addChild(this.background);
        
        // 标题
        this.titleText = new PIXI.Text('游戏测试场景', {
            fontFamily: 'Arial',
            fontSize: 32,
            fill: 0xFFFFFF,
            fontWeight: 'bold'
        });
        this.titleText.anchor.set(0.5, 0);
        this.titleText.x = GAME_CONFIG.WIDTH / 2;
        this.titleText.y = 20;
        this.addChild(this.titleText);
    }
    
    createNavigation() {
        // 导航容器
        this.navContainer = new PIXI.Container();
        this.navContainer.x = GAME_CONFIG.WIDTH / 2;
        this.navContainer.y = 80;
        this.addChild(this.navContainer);
        
        // 创建Step1到Step5的按钮
        const buttonWidth = 100;
        const buttonHeight = 40;
        const spacing = 120;
        const totalWidth = (5 - 1) * spacing;
        const startX = -totalWidth / 2;
        
        for (let i = 1; i <= 5; i++) {
            const button = this.createStepButton(
                `Step${i}`,
                startX + (i - 1) * spacing,
                0,
                buttonWidth,
                buttonHeight,
                i
            );
            this.navContainer.addChild(button);
            this.stepButtons.push(button);
        }
    }
    
    createStepButton(text, x, y, width, height, stepNumber) {
        const button = new PIXI.Container();
        button.x = x;
        button.y = y;
        
        // 按钮背景
        const bg = new PIXI.Graphics();
        button.bg = bg;
        button.addChild(bg);
        
        // 按钮文本
        const buttonText = new PIXI.Text(text, {
            fontFamily: 'Arial',
            fontSize: 16,
            fill: 0xFFFFFF,
            fontWeight: 'bold'
        });
        buttonText.anchor.set(0.5);
        buttonText.x = width / 2;
        buttonText.y = height / 2;
        button.addChild(buttonText);
        
        // 交互
        button.interactive = true;
        button.buttonMode = true;
        
        button.on('pointerdown', () => {
            this.setActiveStep(stepNumber);
        });
        
        button.on('pointerover', () => {
            if (this.currentStep !== stepNumber) {
                this.drawButton(bg, width, height, 0x34495E, 0x5DADE2);
            }
        });
        
        button.on('pointerout', () => {
            if (this.currentStep !== stepNumber) {
                this.drawButton(bg, width, height, 0x34495E, 0xFFFFFF);
            }
        });
        
        // 初始绘制
        this.drawButton(bg, width, height, 0x34495E, 0xFFFFFF);
        
        button.stepNumber = stepNumber;
        button.width = width;
        button.height = height;
        
        return button;
    }
    
    drawButton(graphics, width, height, bgColor, borderColor) {
        graphics.clear();
        graphics.lineStyle(2, borderColor);
        graphics.beginFill(bgColor);
        graphics.drawRoundedRect(0, 0, width, height, 8);
        graphics.endFill();
    }
    
    setActiveStep(stepNumber) {
        this.currentStep = stepNumber;
        
        // 更新按钮状态
        this.stepButtons.forEach(button => {
            if (button.stepNumber === stepNumber) {
                // 激活状态
                this.drawButton(button.bg, button.width, button.height, 0x3498DB, 0xFFFFFF);
            } else {
                // 非激活状态
                this.drawButton(button.bg, button.width, button.height, 0x34495E, 0xBDC3C7);
            }
        });
        
        // 更新步骤内容
        this.updateStepContent();
    }
    
    createStepContent() {
        // 内容容器
        this.contentContainer = new PIXI.Container();
        this.contentContainer.x = 50;
        this.contentContainer.y = 160;
        this.addChild(this.contentContainer);
        
        // 当前步骤显示
        this.stepInfoText = new PIXI.Text('', {
            fontFamily: 'Arial',
            fontSize: 20,
            fill: 0xFFFFFF,
            wordWrap: true,
            wordWrapWidth: GAME_CONFIG.WIDTH - 100
        });
        this.contentContainer.addChild(this.stepInfoText);
        
        // 返回菜单按钮
        this.backButton = this.createBackButton();
        this.addChild(this.backButton);
    }
    
    createBackButton() {
        const button = new PIXI.Container();
        
        const bg = new PIXI.Graphics();
        bg.beginFill(0xE74C3C);
        bg.drawRoundedRect(0, 0, 120, 40, 8);
        bg.endFill();
        
        const buttonText = new PIXI.Text('返回菜单', {
            fontFamily: 'Arial',
            fontSize: 16,
            fill: 0xFFFFFF,
            fontWeight: 'bold'
        });
        buttonText.anchor.set(0.5);
        buttonText.x = 60;
        buttonText.y = 20;
        
        button.addChild(bg);
        button.addChild(buttonText);
        button.x = GAME_CONFIG.WIDTH - 140;
        button.y = GAME_CONFIG.HEIGHT - 60;
        
        button.interactive = true;
        button.buttonMode = true;
        button.on('pointerdown', () => {
            this.game.emit('scene_change', 'menu');
        });
        
        return button;
    }
    
    updateStepContent() {
        // 清除之前的步骤内容
        this.clearStepDemo();
        
        // 根据步骤编号加载对应的测试模块
        const moduleMap = {
            1: 'step1',
            2: 'step2', 
            3: 'step3',
            4: 'step4',
            5: 'step5'
        };
        
        const moduleKey = moduleMap[this.currentStep];
        if (moduleKey) {
            this.loadTestModule(moduleKey);
        } else {
            console.warn(`未找到 Step ${this.currentStep} 对应的测试模块`);
        }
        
        console.log(`切换到 Step ${this.currentStep}`);
    }

    /**
     * 加载指定的测试模块
     */
    async loadTestModule(moduleKey) {
        try {
            console.log(`正在加载测试模块: ${moduleKey}`);
            
            // 使用模块管理器加载模块
            const moduleInstance = await this.moduleManager.loadModule(moduleKey);
            
            // 获取模块信息并更新UI
            const moduleInfo = this.moduleManager.getModuleInfo(moduleKey);
            if (moduleInfo) {
                this.stepInfoText.text = `${moduleInfo.title}\n\n${moduleInfo.description}`;
            }
            
            console.log(`测试模块 ${moduleKey} 加载完成`);
            return moduleInstance;
            
        } catch (error) {
            console.error(`加载测试模块 ${moduleKey} 失败:`, error);
            this.stepInfoText.text = `加载模块失败: ${error.message}`;
        }
    }

    clearStepDemo() {
        // 使用模块管理器卸载当前模块
        if (this.moduleManager) {
            this.moduleManager.unloadCurrentModule();
        }
    }

    onEnter() {
        this.visible = true;
        console.log('进入测试场景');
    }
    
    onExit() {
        this.visible = false;
        console.log('退出测试场景');
    }
    
    destroy() {
        // 清理模块管理器
        if (this.moduleManager) {
            this.moduleManager.destroy();
            this.moduleManager = null;
        }
        
        // 清理步骤演示内容
        this.clearStepDemo();
        
        super.destroy();
    }
}
