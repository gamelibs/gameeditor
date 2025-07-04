// 测试场景
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
        
        // 清理旧的容器引用（兼容性保留）
        if (this.demoContainer) {
            // 如果是使用RootManager创建的容器，需要从主容器中移除
            if (this.demoContainer.container) {
                this.removeChild(this.demoContainer.container);
                this.demoContainer.destroy();
            } else {
                // 兼容旧的容器结构
                this.removeChild(this.demoContainer);
                this.demoContainer.destroy();
            }
            this.demoContainer = null;
        }
        
        // 重置所有容器引用
        this.step1Container = null;
        this.step3Container = null;
        this.step4Container = null;
        this.step5Container = null;
        
        // 清理其他资源引用
        if (this.gridManager) {
            this.gridManager.destroy();
            this.gridManager = null;
        }
        
        if (this.shooter) {
            this.shooter.destroy();
            this.shooter = null;
        }
        
        // 重置数组和状态
        this.projectiles = [];
        this.controlsContainer = null;
        this.step4StatsText = null;
        this.isSimpleDemo = false;
        this.isMatchingDemo = false;
    }
    
    createStep1Demo() {
        // 使用RootManager创建标准化的场景容器 - 居中显示
        this.step1Container = window.rootManager.createSceneContainer({
            x: GAME_CONFIG.WIDTH / 2,   // 水平居中
            y: GAME_CONFIG.HEIGHT / 2,  // 垂直居中
            width: 500,
            height: 600,
            title: '测试创建物体元素',
            titleStyle: {
                fontFamily: 'Arial',
                fontSize: 18,
                fill: 0xFF0000,  // 红色文字
                fontWeight: 'bold'
            },
            background: {
                color: 0x2C3E50,
                alpha: 0.15,
                borderColor: 0xFFFFFF,  // 白色边框
                borderWidth: 3,
                borderRadius: 0  // 直角边框
            }
        });
        
        // 将容器添加到场景中
        this.addChild(this.step1Container.container);
        
        // 保存容器引用以便于其他方法访问
        this.demoContainer = this.step1Container;
        
        // 添加一些测试用的蛋形元素
        this.createTestEggs();
    }
    

    

    

    

    
    createTestEggs() {
        // 创建4行6列的蛋形网格，模拟经典泡泡龙游戏布局
        const rows = 4;
        const cols = 6;
        const eggWidth = 40;   // 统一宽度
        const eggHeight = 50;  // 统一高度
        const spacingX = 50;   // 水平间距
        const spacingY = 45;   // 垂直间距
        
        // 彩色蛋的颜色数组
        const colors = [
            0xFF6B6B,  // 红色
            0x4ECDC4,  // 青色
            0xFECA57,  // 黄色
            0x96CEB4,  // 绿色
            0x9B59B6,  // 紫色
            0xF39C12   // 橙色
        ];
        
        // 计算起始位置（使网格居中）
        const totalWidth = (cols - 1) * spacingX;
        const totalHeight = (rows - 1) * spacingY;
        const startX = -totalWidth / 2;
        const startY = -220; // 从容器顶部开始
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                // 偶数行稍微偏移，创建六边形网格效果
                const offsetX = (row % 2) * (spacingX / 2);
                const x = startX + col * spacingX + offsetX;
                const y = startY + row * spacingY;
                
                // 为每个位置选择颜色（基于位置创建模式）
                const colorIndex = (row + col) % colors.length;
                const color = colors[colorIndex];
                
                const egg = window.rootManager.createEggShape(
                    x, 
                    y, 
                    eggWidth, 
                    eggHeight, 
                    color, 
                    true,  // 启用高光效果
                    0      // 无旋转
                );
                
                // 添加到对象层（无动画）
                this.demoContainer.addChild(egg);
            }
        }
        
        // 添加蛋形网格说明文字
        const eggLabel = new PIXI.Text('4行6列蛋形网格 (静态显示)', {
            fontFamily: 'Arial',
            fontSize: 12,
            fill: 0xBDC3C7,
            align: 'center'
        });
        eggLabel.anchor.set(0.5);
        eggLabel.x = 0;
        eggLabel.y = -260;
        this.demoContainer.addChild(eggLabel);
    }
    

    
    animateBubbleIn(bubble) {
        if (!bubble || !bubble.parent) return;
        
        const startTime = Date.now();
        const duration = 300;
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // 缓动函数
            const easeOut = 1 - Math.pow(1 - progress, 3);
            
            bubble.alpha = easeOut;
            bubble.scale.set(easeOut);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }
    
    // Step2: 发射小球机制
    createStep2Demo() {
        // 创建演示容器
        this.demoContainer = new PIXI.Container();
        this.demoContainer.x = GAME_CONFIG.WIDTH / 2;
        this.demoContainer.y = 300;
        this.addChild(this.demoContainer);
        
        // 初始化物理系统状态（默认关闭，在Step2-5中开启）
        this.usePhysicsForStep2 = false;
        this.simpleProjectiles = [];
        
        // 创建子步骤导航
        this.createStep2SubNavigation();
    }
    
    createStep2SubNavigation() {
        // 子步骤导航容器
        this.subNavContainer = new PIXI.Container();
        this.subNavContainer.y = -150;
        this.demoContainer.addChild(this.subNavContainer);
        
        // 创建子步骤按钮
        const subSteps = [
            { key: '2-1', label: 'Step2-1' },
            { key: '2-2', label: 'Step2-2' },
            { key: '2-3', label: 'Step2-3' }
        ];
        
        const buttonWidth = 100;
        const buttonHeight = 35;
        const spacing = 110;
        const totalWidth = (subSteps.length - 1) * spacing;
        const startX = -totalWidth / 2;
        
        this.subStepButtons = [];
        
        subSteps.forEach((step, index) => {
            const button = this.createSubStepButton(
                step.label,
                startX + index * spacing,
                0,
                buttonWidth,
                buttonHeight,
                step.key
            );
            this.subNavContainer.addChild(button);
            this.subStepButtons.push(button);
        });
        
        // 默认选择第一个子步骤
        this.setActiveSubStep('2-1');
    }
    
    createSubStepButton(text, x, y, width, height, stepKey) {
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
            fontSize: 12,
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
            this.setActiveSubStep(stepKey);
        });
        
        button.on('pointerover', () => {
            if (this.currentSubStep !== stepKey) {
                this.drawSubButton(bg, width, height, 0x34495E, 0x5DADE2);
            }
        });
        
        button.on('pointerout', () => {
            if (this.currentSubStep !== stepKey) {
                this.drawSubButton(bg, width, height, 0x34495E, 0xFFFFFF);
            }
        });
        
        // 初始绘制
        this.drawSubButton(bg, width, height, 0x34495E, 0xFFFFFF);
        
        button.stepKey = stepKey;
        button.width = width;
        button.height = height;
        
        return button;
    }
    
    drawSubButton(graphics, width, height, bgColor, borderColor) {
        graphics.clear();
        graphics.lineStyle(2, borderColor);
        graphics.beginFill(bgColor);
        graphics.drawRoundedRect(0, 0, width, height, 6);
        graphics.endFill();
    }
    
    setActiveSubStep(stepKey) {
        this.currentSubStep = stepKey;
        
        // 更新子步骤按钮状态
        if (this.subStepButtons) {
            this.subStepButtons.forEach(button => {
                if (button.stepKey === stepKey) {
                    // 激活状态
                    this.drawSubButton(button.bg, button.width, button.height, 0x3498DB, 0xFFFFFF);
                } else {
                    // 非激活状态
                    this.drawSubButton(button.bg, button.width, button.height, 0x34495E, 0xBDC3C7);
                }
            });
        }
        
        // 清除之前的子步骤演示
        this.clearSubStepDemo();
        
        // 创建新的子步骤演示
        switch(stepKey) {
            case '2-1':
                this.createStep2_1Demo();
                break;
            case '2-2':
                this.createStep2_2Demo();
                break;
            case '2-3':
                this.createStep2_3Demo();
                break;
        }
    }
    
    clearSubStepDemo() {
        // 清除子步骤演示内容
        if (this.subDemoContainer) {
            this.demoContainer.removeChild(this.subDemoContainer);
            this.subDemoContainer.destroy();
            this.subDemoContainer = null;
        }
        
        // 重置演示状态
        this.isSimpleDemo = false;
    }
    
    createSimpleShooter() {
        this.simpleShooter = new PIXI.Container();
        this.simpleShooter.y = 80;
        this.demoContainer.addChild(this.simpleShooter);
        
        // 射手底座
        const base = new PIXI.Graphics();
        base.beginFill(0x8B4513);
        base.drawRoundedRect(-30, -10, 60, 20, 10);
        base.endFill();
        
        // 射手身体 (足球守门员)
        const body = new PIXI.Graphics();
        body.beginFill(0x2E8B57); // 绿色球衣
        body.drawRect(-15, -25, 30, 20);
        body.endFill();
        
        // 射手头部
        const head = new PIXI.Graphics();
        head.beginFill(0xFFDBB3); // 肤色
        head.drawCircle(0, -35, 8);
        head.endFill();
        
        // 射手手臂
        const arms = new PIXI.Graphics();
        arms.lineStyle(4, 0x2E8B57);
        arms.moveTo(-15, -20);
        arms.lineTo(-25, -15);
        arms.moveTo(15, -20);
        arms.lineTo(25, -15);
        
        this.simpleShooter.addChild(base);
        this.simpleShooter.addChild(body);
        this.simpleShooter.addChild(head);
        this.simpleShooter.addChild(arms);
        
        // 炮管
        this.simpleCannon = new PIXI.Graphics();
        this.simpleCannon.beginFill(0x696969);
        this.simpleCannon.drawRoundedRect(-5, -40, 10, 25, 5);
        this.simpleCannon.endFill();
        this.simpleShooter.addChild(this.simpleCannon);
    }
    
    createShootingBall() {
        this.shootingBall = this.createDemoBubble(0, 50, 0xFF4444);
        this.shootingBall.scale.set(0.8);
        // 移除交互，只作为显示
        this.shootingBall.interactive = false;
        this.demoContainer.addChild(this.shootingBall);
        
        // 添加标签
        const label = new PIXI.Text('点击发射小球', {
            fontFamily: 'Arial',
            fontSize: 14,
            fill: 0xFFFFFF
        });
        label.anchor.set(0.5);
        label.x = 0;
        label.y = 120;
        this.demoContainer.addChild(label);
    }
    
    createSimpleAimLine() {
        this.simpleAimLine = new PIXI.Graphics();
        // 移除交互，只作为显示
        this.simpleAimLine.interactive = false;
        this.demoContainer.addChild(this.simpleAimLine);
        this.simpleAimAngle = -Math.PI / 2;
        this.updateSimpleAimLine(); // 初始绘制，不传鼠标位置
    }
    
    updateSimpleAimLine(mouseX, mouseY) {
        this.simpleAimLine.clear();
        
        // 计算瞄准方向
        const startX = 0;
        const startY = 50;
        
        // 如果有鼠标位置，直接指向鼠标位置
        let endX, endY;
        if (mouseX !== undefined && mouseY !== undefined) {
            endX = mouseX;
            endY = mouseY;
            
            // 计算角度用于炮管旋转和发射
            this.simpleAimAngle = Math.atan2(mouseY - startY, mouseX - startX);
        } else {
            // 如果没有鼠标位置，使用当前角度（用于初始化或重置）
            const length = 100;
            endX = startX + Math.cos(this.simpleAimAngle) * length;
            endY = startY + Math.sin(this.simpleAimAngle) * length;
        }
        
        // 绘制瞄准线
        this.simpleAimLine.lineStyle(3, 0xFFFF00, 0.8);
        this.simpleAimLine.moveTo(startX, startY);
        this.simpleAimLine.lineTo(endX, endY);
        
        // 绘制瞄准点
        this.simpleAimLine.beginFill(0xFFFF00, 0.6);
        this.simpleAimLine.drawCircle(endX, endY, 4);
        this.simpleAimLine.endFill();
        
        // 旋转炮管
        if (this.simpleCannon) {
            this.simpleCannon.rotation = this.simpleAimAngle;
        }
    }
    
    setupSimpleShootingInteraction() {
        // 只在演示容器上监听鼠标事件
        this.demoContainer.interactive = true;
        
        // 持续监听鼠标移动，更新瞄准线和坐标显示
        this.demoContainer.on('pointermove', (event) => {
            if (!this.isSimpleDemo) return;
            
            const localPos = event.data.getLocalPosition(this.demoContainer);
            // 直接使用鼠标位置更新瞄准线
            this.updateSimpleAimLine(localPos.x, localPos.y);
            
            // 更新鼠标坐标显示
            this.updateMouseCoordinateDisplay(localPos.x, localPos.y);
        });
        
        // 鼠标进入容器时开始显示坐标
        this.demoContainer.on('pointerover', (event) => {
            if (!this.isSimpleDemo) return;
            
            const localPos = event.data.getLocalPosition(this.demoContainer);
            this.updateMouseCoordinateDisplay(localPos.x, localPos.y);
        });
        
        // 鼠标离开容器时显示默认坐标
        this.demoContainer.on('pointerout', () => {
            if (!this.isSimpleDemo) return;
            
            this.updateMouseCoordinateDisplay(0, 0);
        });
        
        // 点击发射
        this.demoContainer.on('pointerdown', (event) => {
            if (!this.isSimpleDemo) return;
            
            // 确保瞄准角度是最新的
            const localPos = event.data.getLocalPosition(this.demoContainer);
            this.updateSimpleAimLine(localPos.x, localPos.y);
            
            this.shootSimpleBall();
        });
        
        this.isSimpleDemo = true;
        this.shootingBalls = []; // 存储发射的小球
    }
    
    shootSimpleBall() {
        if (this.isSimpleAnimating) return;
        
        // 创建发射的小球
        const ball = this.createDemoBubble(0, 50, 0xFF4444);
        ball.scale.set(0.8);
        this.demoContainer.addChild(ball);
        this.shootingBalls.push(ball);
        
        // 计算发射方向和速度
        const speed = 8;
        // 直接使用当前瞄准角度
        const velocityX = Math.cos(this.simpleAimAngle) * speed;
        const velocityY = Math.sin(this.simpleAimAngle) * speed;
        
        // 使用物理系统或传统动画
        if (window.physicsManager && this.usePhysicsForStep2) {
            // 设置物理系统边界（相对于demoContainer）
            window.physicsManager.setBounds(-300, 300, -300, 150);
            
            // 使用物理系统
            const projectileId = window.physicsManager.addProjectile({
                projectile: ball,
                velocity: { x: velocityX, y: velocityY },
                power: 1,
                physics: {
                    gravity: 0.15,     // 较轻的重力
                    friction: 0.98,    // 空气阻力
                    bounceX: 0,        // 无水平反弹（消失）
                    bounceY: 0,        // 无垂直反弹（消失）
                    enableBounce: false
                }
            });
            
            // 存储ID用于管理
            if (!this.simpleProjectiles) this.simpleProjectiles = [];
            this.simpleProjectiles.push({ id: projectileId, object: ball });
        } else {
            // 传统动画
            this.animateSimpleBall(ball, velocityX, velocityY);
        }
        
        // 添加发射效果
        this.createShootingEffect();
    }
    
    createShootingEffect() {
        // 创建发射火花效果
        const spark = new PIXI.Graphics();
        spark.beginFill(0xFFFF00, 0.8);
        spark.drawCircle(0, 0, 8);
        spark.endFill();
        spark.x = 0;
        spark.y = 50;
        this.demoContainer.addChild(spark);
        
        // 火花动画
        const startTime = Date.now();
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / 200;
            
            if (progress < 1) {
                spark.scale.set(1 + progress * 2);
                spark.alpha = 1 - progress;
                requestAnimationFrame(animate);
            } else {
                this.demoContainer.removeChild(spark);
                spark.destroy();
            }
        };
        animate();
    }
    
    animateSimpleBall(ball, velocityX, velocityY) {
        let currentVelX = velocityX;
        let currentVelY = velocityY;
        
        const animate = () => {
            if (!ball || !ball.parent) return;
            
            // 更新位置
            ball.x += currentVelX;
            ball.y += currentVelY;
            
            // 检查边界碰撞 - 碰到边界就消失
            const boundaryLeft = -300;
            const boundaryRight = 300;
            const boundaryTop = -300;
            const boundaryBottom = 150;
            
            if (ball.x < boundaryLeft || ball.x > boundaryRight || 
                ball.y < boundaryTop || ball.y > boundaryBottom) {
                this.handleBallDisappear(ball);
                return;
            }
            
            requestAnimationFrame(animate);
        };
        
        animate();
    }
    
    handleBallDisappear(ball) {
        // 创建消失效果
        const disappearEffect = new PIXI.Graphics();
        disappearEffect.beginFill(0xFFFFFF, 0.6);
        disappearEffect.drawCircle(0, 0, 15);
        disappearEffect.endFill();
        disappearEffect.x = ball.x;
        disappearEffect.y = ball.y;
        this.demoContainer.addChild(disappearEffect);
        
        // 消失动画
        const startTime = Date.now();
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / 300;
            
            if (progress < 1) {
                disappearEffect.scale.set(1 + progress);
                disappearEffect.alpha = 0.6 - progress * 0.6;
                requestAnimationFrame(animate);
            } else {
                this.demoContainer.removeChild(disappearEffect);
                disappearEffect.destroy();
            }
        };
        animate();
        
        // 移除小球
        this.demoContainer.removeChild(ball);
        ball.destroy();
        
        // 从数组中移除
        const index = this.shootingBalls.indexOf(ball);
        if (index > -1) {
            this.shootingBalls.splice(index, 1);
        }
    }
    
    createBoundaryIndicators() {
        // 创建边界指示器
        this.boundaryContainer = new PIXI.Container();
        this.demoContainer.addChild(this.boundaryContainer);
        
        const boundary = new PIXI.Graphics();
        boundary.lineStyle(2, 0xFF6666, 0.5);
        
        // 绘制边界框
        const left = -300;
        const right = 300;
        const top = -300;
        const bottom = 150;
        
        boundary.drawRect(left, top, right - left, bottom - top);
        
        this.boundaryContainer.addChild(boundary);
        
        // 添加边界说明
        const boundaryLabel = new PIXI.Text('发射边界\n小球碰到边界会消失', {
            fontFamily: 'Arial',
            fontSize: 12,
            fill: 0xFF6666,
            align: 'center'
        });
        boundaryLabel.anchor.set(0.5);
        boundaryLabel.x = 0;
        boundaryLabel.y = -280;
        this.boundaryContainer.addChild(boundaryLabel);
    }

    createMouseCoordinateDisplay() {
        // 创建鼠标坐标显示文本
        this.coordinateText = new PIXI.Text('鼠标位置: x:0, y:0', {
            fontFamily: 'Arial',
            fontSize: 16,
            fill: 0x4ecdc4,
            fontWeight: 'bold'
        });
        
        // 定位在左上角
        this.coordinateText.x = -GAME_CONFIG.WIDTH/2 + 20;
        this.coordinateText.y = -200;
        
        this.demoContainer.addChild(this.coordinateText);
    }

    updateMouseCoordinateDisplay(x, y) {
        if (this.coordinateText) {
            // 格式化坐标显示，保留一位小数
            this.coordinateText.text = `鼠标位置: x:${Math.round(x)}, y:${Math.round(y)}`;
        }
    }
    
    createSimpleShootingControls() {
        const controlsContainer = new PIXI.Container();
        controlsContainer.y = 150;
        this.demoContainer.addChild(controlsContainer);
        
        // 连续发射按钮
        const rapidFireButton = this.createControlButton('连续发射', -80, 0, () => {
            this.startRapidFire();
        });
        
        // 清空小球按钮
        const clearButton = this.createControlButton('清空小球', 80, 0, () => {
            this.clearAllBalls();
        });
        
        controlsContainer.addChild(rapidFireButton);
        controlsContainer.addChild(clearButton);
        
        // 说明文字
        const instruction = new PIXI.Text('移动鼠标瞄准，点击发射小球', {
            fontFamily: 'Arial',
            fontSize: 14,
            fill: 0xFFFFFF,
            align: 'center'
        });
        instruction.anchor.set(0.5);
        instruction.y = 40;
        controlsContainer.addChild(instruction);
    }
    
    startRapidFire() {
        // 快速连续发射
        let count = 0;
        const maxShots = 5;
        
        const rapidInterval = setInterval(() => {
            if (count >= maxShots) {
                clearInterval(rapidInterval);
                return;
            }
            
            // 每次发射随机角度
            this.simpleAimAngle = -Math.PI / 2 + (Math.random() - 0.5) * 0.8;
            this.updateSimpleAimLine(); // 使用角度模式
            this.shootSimpleBall();
            count++;
        }, 200);
    }
    
    clearAllBalls() {
        // 清除所有发射的小球
        this.shootingBalls.forEach(ball => {
            if (ball && ball.parent) {
                this.demoContainer.removeChild(ball);
                ball.destroy();
            }
        });
        this.shootingBalls = [];
    }
    
    resetSimpleShootingDemo() {
        // 清除所有小球
        this.clearAllBalls();
        
        // 重置瞄准到向上方向
        this.simpleAimAngle = -Math.PI / 2; // 直接向上
        this.updateSimpleAimLine(); // 使用角度模式
        
        this.isSimpleAnimating = false;
    }
    
    // Step3: 碰撞检测与颜色匹配
    createStep3Demo() {
        // 使用RootManager创建标准化的场景容器 - 居中显示
        this.step3Container = window.rootManager.createSceneContainer({
            x: GAME_CONFIG.WIDTH / 2,   // 水平居中
            y: GAME_CONFIG.HEIGHT / 2,  // 垂直居中
            width: 500,
            height: 600,
            title: '测试发射器',
            titleStyle: {
                fontFamily: 'Arial',
                fontSize: 18,
                fill: 0xFF0000,  // 红色文字
                fontWeight: 'bold'
            },
            background: {
                color: 0x2C3E50,
                alpha: 0.15,
                borderColor: 0xFFFFFF,  // 白色边框
                borderWidth: 3,
                borderRadius: 0  // 直角边框
            }
        });
        
        // 将容器添加到场景中
        this.addChild(this.step3Container.container);
        
        // 保存容器引用以便于其他方法访问
        this.demoContainer = this.step3Container;
        
        // 创建发射器测试
        this.createShooterTest();
    }

    createShooterTest() {
        // 设置物理系统边界（相对于step3Container）
        window.physicsManager.setBounds(-250, 250, -300, 300);
        
        // 创建自定义的鸡蛋形状发射物模板
        const customEggProjectile = window.rootManager.createEggShape(0, 0, 36, 45, 0x00FF00, true, 0);
        // 为鸡蛋添加radius属性以兼容物理系统
        customEggProjectile.radius = 18;
        
        // 创建发射器配置
        const shooterConfig = {
            x: 0,           // 在容器中心
            y: 200,         // 容器底部
            power: 1,       // 最大力度
            maxDistance: 800, // 最大发射距离
            customProjectile: customEggProjectile,  // 使用自定义鸡蛋形状
            projectile: {
                color: 0x00FF00,  // 绿色发射物
                radius: 18
            },
            physics: {
                usePhysics: true,     // 使用物理系统
                params: {
                    gravity: 0.2,
                    friction: 0.98,
                    bounceX: 0.8,
                    bounceY: 0.6,
                    enableBounce: true
                }
            },
            onAim: (angle, targetX, targetY, power) => {
                // 瞄准时更新状态显示
                if (this.shooterStatusText) {
                    const angleDegrees = Math.round(angle * 180 / Math.PI);
                    this.shooterStatusText.text = `状态: 瞄准中 - 角度: ${angleDegrees}° - 力度: ${Math.round(power * 100)}%`;
                }
                if (this.shooterCoordinateText) {
                    this.shooterCoordinateText.text = `目标坐标: X:${Math.round(targetX)}, Y:${Math.round(targetY)}`;
                }
            },
            onShoot: (projectile, velocity, power, physicsConfig) => {
                // 发射时的处理
                this.demoContainer.addChild(projectile);
                
                // 使用物理系统或传统动画
                if (physicsConfig.usePhysics) {
                    // 使用物理系统
                    const projectileId = window.physicsManager.addProjectile({
                        projectile: projectile,
                        velocity: velocity,
                        power: power,
                        physics: physicsConfig.params
                    });
                    
                    // 存储ID用于后续管理
                    if (!this.projectiles) this.projectiles = [];
                    this.projectiles.push({ id: projectileId, object: projectile });
                } else {
                    // 使用传统动画
                    this.animateProjectile(projectile, velocity);
                }
                
                // 更新发射统计
                this.shotCount++;
                if (this.shooterStatsText) {
                    this.shooterStatsText.text = `发射次数: ${this.shotCount} - 最后力度: ${Math.round(power * 100)}%`;
                }
                
                // 更新状态
                if (this.shooterStatusText) {
                    this.shooterStatusText.text = '状态: 发射完成 - 准备下一轮';
                }
            }
        };

        // 使用RootManager创建发射器
        this.shooter = window.rootManager.createShooter(shooterConfig);
        
        // 将发射器添加到容器中
        this.demoContainer.addChild(this.shooter.container);
        
        // 设置交互区域为整个容器的背景层
        this.shooter.setInteractiveArea(this.step3Container.backgroundLayer);
        
        // 设置物理系统回调
        this.setupPhysicsCallbacks();
        
        // 创建状态显示
        this.createShooterStatus();
        
        // 创建控制按钮
        this.createShooterControls();
        
        // 设置物理系统回调
        this.setupPhysicsCallbacks();
        
        // 初始化统计
        this.shotCount = 0;
        this.projectiles = [];
    }

    setupPhysicsCallbacks() {
        // 边界碰撞回调
        window.physicsManager.setCallback('onBoundaryCollision', (projectileData, boundaries) => {
            // 可以在这里添加碰撞特效
            if (this.config && this.config.debug) {
                console.log(`发射物 ${projectileData.id} 碰撞边界:`, boundaries);
            }
        });

        // 发射物停止回调
        window.physicsManager.setCallback('onProjectileStop', (projectileData, reason) => {
            if (this.config && this.config.debug) {
                console.log(`发射物 ${projectileData.id} 停止, 原因: ${reason}`);
            }
            
            // 从projectiles数组中移除
            if (this.projectiles) {
                const index = this.projectiles.findIndex(p => p.id === projectileData.id);
                if (index !== -1) {
                    this.projectiles.splice(index, 1);
                }
            }
        });

        // 发射物销毁回调
        window.physicsManager.setCallback('onProjectileDestroy', (projectileData) => {
            // 从显示容器中移除发射物
            if (projectileData.projectile && projectileData.projectile.parent) {
                projectileData.projectile.parent.removeChild(projectileData.projectile);
                projectileData.projectile.destroy();
            }
        });
    }

    createShooterStatus() {
        // 状态显示文本
        this.shooterStatusText = new PIXI.Text('状态: 准备发射 - 按住鼠标瞄准', {
            fontFamily: 'Arial',
            fontSize: 14,
            fill: 0xFFFFFF,
            fontWeight: 'bold'
        });
        this.shooterStatusText.anchor.set(0.5);
        this.shooterStatusText.x = 0;
        this.shooterStatusText.y = -250;
        this.demoContainer.addChild(this.shooterStatusText);

        // 坐标显示文本
        this.shooterCoordinateText = new PIXI.Text('目标坐标: X:0, Y:0', {
            fontFamily: 'Arial',
            fontSize: 12,
            fill: 0x4ECDC4
        });
        this.shooterCoordinateText.anchor.set(0.5);
        this.shooterCoordinateText.x = 0;
        this.shooterCoordinateText.y = -230;
        this.demoContainer.addChild(this.shooterCoordinateText);

        // 统计显示文本
        this.shooterStatsText = new PIXI.Text('发射次数: 0', {
            fontFamily: 'Arial',
            fontSize: 12,
            fill: 0xF39C12
        });
        this.shooterStatsText.anchor.set(0.5);
        this.shooterStatsText.x = 0;
        this.shooterStatsText.y = -210;
        this.demoContainer.addChild(this.shooterStatsText);

        // 添加说明文字
        const instructionText = new PIXI.Text(
            '发射器测试说明:\n' +
            '• 按住鼠标左键开始瞄准\n' +
            '• 移动鼠标调整瞄准方向\n' +
            '• 松开鼠标发射绿色小球\n' +
            '• 发射器支持位置、大小、颜色配置',
            {
                fontFamily: 'Arial',
                fontSize: 11,
                fill: 0xBDC3C7,
                align: 'center',
                lineHeight: 16
            }
        );
        instructionText.anchor.set(0.5);
        instructionText.x = 0;
        instructionText.y = -140;
        this.demoContainer.addChild(instructionText);
    }

    createShooterControls() {
        // 控制按钮容器
        const controlsContainer = new PIXI.Container();
        controlsContainer.y = 260;
        this.demoContainer.addChild(controlsContainer);

        // 第一行按钮
        const firstRowContainer = new PIXI.Container();
        firstRowContainer.y = -40;
        controlsContainer.addChild(firstRowContainer);

        // 力度控制按钮
        const power25Button = this.createControlButton('力度25%', -120, 0, () => {
            this.shooter.setPower(0.25);
        });
        const power50Button = this.createControlButton('力度50%', -40, 0, () => {
            this.shooter.setPower(0.5);
        });
        const power75Button = this.createControlButton('力度75%', 40, 0, () => {
            this.shooter.setPower(0.75);
        });
        const power100Button = this.createControlButton('力度100%', 120, 0, () => {
            this.shooter.setPower(1.0);
        });

        firstRowContainer.addChild(power25Button);
        firstRowContainer.addChild(power50Button);
        firstRowContainer.addChild(power75Button);
        firstRowContainer.addChild(power100Button);

        // 第二行按钮
        const secondRowContainer = new PIXI.Container();
        secondRowContainer.y = 0;
        controlsContainer.addChild(secondRowContainer);

        // 清除发射物按钮
        const clearButton = this.createControlButton('清除发射物', -80, 0, () => {
            this.clearAllProjectiles();
        });

        // 更换颜色按钮
        const colorButton = this.createControlButton('更换颜色', 80, 0, () => {
            this.changeProjectileColor();
        });

        secondRowContainer.addChild(clearButton);
        secondRowContainer.addChild(colorButton);

        // 功能说明
        const featuresText = new PIXI.Text(
            'RootManager发射器特性:\n' +
            '✓ 力度控制(0-1) ✓ 最大距离配置\n' +
            '✓ 发射物颜色可定制 ✓ 自定义发射物支持\n' +
            '✓ 瞄准/发射事件回调 ✓ 交互区域可设置\n' +
            '✓ 当前最大距离: 800像素',
            {
                fontFamily: 'Arial',
                fontSize: 10,
                fill: 0x2ECC71,
                align: 'center',
                lineHeight: 14
            }
        );
        featuresText.anchor.set(0.5);
        featuresText.x = 0;
        featuresText.y = 50;
        controlsContainer.addChild(featuresText);
    }

    animateProjectile(projectile, velocity) {
        // 将发射物添加到发射物数组中
        this.projectiles.push(projectile);
        
        let currentVelX = velocity.x;
        let currentVelY = velocity.y;

        const animate = () => {
            if (!projectile || !projectile.parent) return;

            // 更新位置
            projectile.x += currentVelX;
            projectile.y += currentVelY;

            // 添加重力效果
            currentVelY += 0.2;

            // 边界检查（相对于容器）
            const boundaryLeft = -240;
            const boundaryRight = 240;
            const boundaryTop = -290;
            const boundaryBottom = 290;

            // 左右边界反弹
            if (projectile.x < boundaryLeft || projectile.x > boundaryRight) {
                currentVelX = -currentVelX * 0.8;
                projectile.x = Math.max(boundaryLeft, Math.min(boundaryRight, projectile.x));
            }

            // 上边界反弹
            if (projectile.y < boundaryTop) {
                currentVelY = -currentVelY * 0.8;
                projectile.y = boundaryTop;
            }

            // 下边界消失
            if (projectile.y > boundaryBottom) {
                this.removeProjectile(projectile);
                return;
            }

            // 速度过低时停止
            if (Math.abs(currentVelX) < 0.3 && Math.abs(currentVelY) < 0.3) {
                this.removeProjectile(projectile);
                return;
            }

            requestAnimationFrame(animate);
        };

        animate();
    }

    removeProjectile(projectile) {
        // 创建消失特效
        const disappearEffect = new PIXI.Graphics();
        disappearEffect.beginFill(0xFFFFFF, 0.6);
        disappearEffect.drawCircle(0, 0, 15);
        disappearEffect.endFill();
        disappearEffect.x = projectile.x;
        disappearEffect.y = projectile.y;
        this.demoContainer.addChild(disappearEffect);

        // 消失动画
        const startTime = Date.now();
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / 300;

            if (progress < 1) {
                disappearEffect.scale.set(1 + progress);
                disappearEffect.alpha = 0.6 - progress * 0.6;
                requestAnimationFrame(animate);
            } else {
                this.demoContainer.removeChild(disappearEffect);
                disappearEffect.destroy();
            }
        };
        animate();

        // 移除发射物
        this.demoContainer.removeChild(projectile);
        projectile.destroy();

        // 从数组中移除
        const index = this.projectiles.indexOf(projectile);
        if (index > -1) {
            this.projectiles.splice(index, 1);
        }
    }

    clearAllProjectiles() {
        // 清除所有发射物
        this.projectiles.forEach(projectile => {
            if (projectile && projectile.parent) {
                this.demoContainer.removeChild(projectile);
                projectile.destroy();
            }
        });
        this.projectiles = [];
        
        // 重置统计
        this.shotCount = 0;
        if (this.shooterStatsText) {
            this.shooterStatsText.text = '发射次数: 0';
        }
        
        if (this.shooterStatusText) {
            this.shooterStatusText.text = '状态: 已清除 - 准备发射';
        }
    }

    changeProjectileColor() {
        // 随机更换发射物颜色
        const colors = [0xFF6B6B, 0x4ECDC4, 0x45B7D1, 0x96CEB4, 0xFECA57, 0xFF9FF3];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        
        // 重新创建发射器配置
        if (this.shooter) {
            // 销毁当前发射器
            this.shooter.destroy();
            
            // 创建新的自定义鸡蛋形状发射物模板
            const newCustomEggProjectile = window.rootManager.createEggShape(0, 0, 36, 45, randomColor, true, 0);
            newCustomEggProjectile.radius = 18;
            
            // 创建新配置
            const newConfig = {
                x: 0,
                y: 200,
                power: 1,       // 最大力度
                maxDistance: 800, // 最大发射距离
                customProjectile: newCustomEggProjectile,  // 使用新颜色的鸡蛋形状
                projectile: {
                    color: randomColor,
                    radius: 18
                },
                onAim: (angle, targetX, targetY, power) => {
                    if (this.shooterStatusText) {
                        const angleDegrees = Math.round(angle * 180 / Math.PI);
                        this.shooterStatusText.text = `状态: 瞄准中 - 角度: ${angleDegrees}° - 力度: ${Math.round(power * 100)}%`;
                    }
                    if (this.shooterCoordinateText) {
                        this.shooterCoordinateText.text = `目标坐标: X:${Math.round(targetX)}, Y:${Math.round(targetY)}`;
                    }
                },
                onShoot: (projectile, velocity, power) => {
                    this.demoContainer.addChild(projectile);
                    this.animateProjectile(projectile, velocity);
                    
                    this.shotCount++;
                    if (this.shooterStatsText) {
                        this.shooterStatsText.text = `发射次数: ${this.shotCount} - 最后力度: ${Math.round(power * 100)}%`;
                    }
                    
                    if (this.shooterStatusText) {
                        this.shooterStatusText.text = '状态: 发射完成 - 准备下一轮';
                    }
                }
            };
            
            // 重新创建发射器
            this.shooter = window.rootManager.createShooter(newConfig);
            this.demoContainer.addChild(this.shooter.container);
            this.shooter.setInteractiveArea(this.step3Container.backgroundLayer);
        }
        
        if (this.shooterStatusText) {
            this.shooterStatusText.text = '状态: 颜色已更换 - 准备发射';
        }
    }
    
    createMatchingGrid() {
        this.matchingGrid = new PIXI.Container();
        this.matchingGrid.y = -180;
        this.demoContainer.addChild(this.matchingGrid);
        
        // 创建特定的泡泡布局用于演示匹配
        this.gridBubbles = [];
        const colors = [0xFF0000, 0x00FF00, 0x0000FF, 0xFFFF00, 0xFF00FF];
        
        // 创建一个有明显匹配模式的网格
        const pattern = [
            [0, 1, 0, 1, 0, 1, 0, 1],
            [1, 0, 0, 2, 2, 0, 0, 1],
            [0, 0, 2, 2, 2, 2, 0, 0],
            [1, 2, 2, 3, 3, 2, 2, 1],
            [0, 1, 3, 3, 3, 3, 1, 0]
        ];
        
        for (let row = 0; row < pattern.length; row++) {
            this.gridBubbles[row] = [];
            const offsetX = (row % 2) * 20;
            
            for (let col = 0; col < pattern[row].length; col++) {
                const colorIndex = pattern[row][col];
                const bubble = window.rootManager.createInteractiveBubble(
                    col * 40 + offsetX - 160,
                    row * 35,
                    colors[colorIndex],
                    16 // 稍小的半径用于网格
                );
                bubble.scale.set(0.8);
                bubble.row = row;
                bubble.col = col;
                bubble.colorIndex = colorIndex;
                this.matchingGrid.addChild(bubble);
                this.gridBubbles[row][col] = bubble;
            }
        }
    }
    
    createMatchingShooter() {
        this.matchingShooter = new PIXI.Container();
        this.matchingShooter.y = 120;
        this.demoContainer.addChild(this.matchingShooter);
        
        // 简化的射手
        const base = new PIXI.Graphics();
        base.beginFill(0x8B4513);
        base.drawRoundedRect(-25, -8, 50, 16, 8);
        base.endFill();
        
        const cannon = new PIXI.Graphics();
        cannon.beginFill(0x696969);
        cannon.drawRoundedRect(-4, -30, 8, 20, 4);
        cannon.endFill();
        
        this.matchingShooter.addChild(base);
        this.matchingShooter.addChild(cannon);
        this.matchingCannon = cannon;
    }
    
    createMatchingBubble() {
        // 使用RootManager创建具有射击功能的泡泡
        this.matchingCurrentBubble = window.rootManager.createShootingBubble(0, 80, 0x0000FF, 18);
        this.matchingCurrentBubble.scale.set(0.9);
        this.matchingCurrentBubble.ballColor = 0x0000FF; // 保存原始颜色用于匹配
        this.demoContainer.addChild(this.matchingCurrentBubble);
        
        // 添加状态显示
        this.matchingStatusText = new PIXI.Text('状态: 准备发射 - 按住鼠标瞄准', {
            fontFamily: 'Arial',
            fontSize: 12,
            fill: 0xFFFFFF,
            fontWeight: 'bold'
        });
        this.matchingStatusText.anchor.set(0.5);
        this.matchingStatusText.x = 0;
        this.matchingStatusText.y = 105;
        this.demoContainer.addChild(this.matchingStatusText);
        
        // 添加坐标显示
        this.matchingCoordinateText = new PIXI.Text('瞄准坐标: X:0, Y:0', {
            fontFamily: 'Arial',
            fontSize: 10,
            fill: 0x4ecdc4
        });
        this.matchingCoordinateText.anchor.set(0.5);
        this.matchingCoordinateText.x = 0;
        this.matchingCoordinateText.y = 120;
        this.demoContainer.addChild(this.matchingCoordinateText);
    }
    
    createMatchingAimLine() {
        this.matchingAimLine = new PIXI.Graphics();
        this.demoContainer.addChild(this.matchingAimLine);
        this.matchingAimAngle = -Math.PI / 2;
        this.updateMatchingAimLine();
    }
     updateMatchingAimLine() {
        this.matchingAimLine.clear();
        
        const startX = 0;
        const startY = 80;
        const length = 120;
        const endX = startX + Math.cos(this.matchingAimAngle - Math.PI / 2) * length;
        const endY = startY + Math.sin(this.matchingAimAngle - Math.PI / 2) * length;
        
        // 绘制瞄准线
        this.matchingAimLine.lineStyle(3, 0xFFFF00, 0.8);
        this.matchingAimLine.moveTo(startX, startY);
        this.matchingAimLine.lineTo(endX, endY);
        
        // 绘制瞄准点
        this.matchingAimLine.beginFill(0xFFFF00, 0.6);
        this.matchingAimLine.drawCircle(endX, endY, 4);
        this.matchingAimLine.endFill();
        
        // 旋转炮管
        if (this.matchingCannon) {
            this.matchingCannon.rotation = this.matchingAimAngle;
        }
    }
    
    updateAdvancedMatchingAimLine(targetX, targetY) {
        this.matchingAimLine.clear();
        
        // 射手位置
        const shooterX = 0;
        const shooterY = 80;
        
        // 计算瞄准方向
        const deltaX = targetX - shooterX;
        const deltaY = targetY - shooterY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        // 如果距离太小，不绘制瞄准线
        if (distance < 20) return;
        
        // 计算角度
        this.matchingAimAngle = Math.atan2(deltaY, deltaX);
        
        // 限制瞄准角度（只能向上半圆瞄准）
        const minAngle = -Math.PI * 0.9; // 左侧限制
        const maxAngle = -Math.PI * 0.1; // 右侧限制
        this.matchingAimAngle = Math.max(minAngle, Math.min(maxAngle, this.matchingAimAngle));
        
        // 计算瞄准线长度
        const maxLength = 150;
        const aimLength = Math.min(distance, maxLength);
        
        // 计算终点
        const endX = shooterX + Math.cos(this.matchingAimAngle) * aimLength;
        const endY = shooterY + Math.sin(this.matchingAimAngle) * aimLength;
        
        // 使用RootManager绘制虚线瞄准线
        window.rootManager.drawDashedLine(this.matchingAimLine, shooterX, shooterY - 10, endX, endY, 0xFFFF00, 3);
        
        // 绘制瞄准点
        this.matchingAimLine.beginFill(0xFF6B6B, 0.8);
        this.matchingAimLine.drawCircle(endX, endY, 8);
        this.matchingAimLine.endFill();
        
        // 使用RootManager绘制箭头
        window.rootManager.drawArrow(this.matchingAimLine, endX, endY, this.matchingAimAngle, 0xFF6B6B);
        
        // 绘制目标位置十字标记
        this.matchingAimLine.lineStyle(2, 0xFF6B6B, 0.8);
        this.matchingAimLine.moveTo(targetX - 10, targetY);
        this.matchingAimLine.lineTo(targetX + 10, targetY);
        this.matchingAimLine.moveTo(targetX, targetY - 10);
        this.matchingAimLine.lineTo(targetX, targetY + 10);
        
        // 绘制目标圆圈
        this.matchingAimLine.lineStyle(2, 0xFF6B6B, 0.6);
        this.matchingAimLine.drawCircle(targetX, targetY, 12);
    }
    
    updateMatchingCannonRotation(targetX, targetY) {
        if (!this.matchingCannon) return;
        
        const deltaX = targetX;
        const deltaY = targetY - 80;
        const angle = Math.atan2(deltaY, deltaX);
        
        // 限制炮管旋转角度
        const limitedAngle = Math.max(-Math.PI * 0.9, Math.min(-Math.PI * 0.1, angle));
        this.matchingCannon.rotation = limitedAngle;
    }
    
    setupMatchingInteraction() {
        this.demoContainer.interactive = true;
        
        // 鼠标移动事件 - 实时显示瞄准坐标
        this.demoContainer.on('pointermove', (event) => {
            if (!this.isMatchingDemo) return;
            
            const localPos = event.data.getLocalPosition(this.demoContainer);
            
            // 更新瞄准坐标显示
            if (this.matchingCoordinateText) {
                this.matchingCoordinateText.text = `瞄准坐标: X:${Math.round(localPos.x)}, Y:${Math.round(localPos.y)}`;
            }
            
            // 如果正在瞄准，更新瞄准线
            if (this.isMatchingAiming) {
                this.currentMatchingAimPos = { x: localPos.x, y: localPos.y };
                this.updateAdvancedMatchingAimLine(localPos.x, localPos.y);
                this.updateMatchingCannonRotation(localPos.x, localPos.y);
            }
        });
        
        // 鼠标按下事件 - 开始瞄准
        this.demoContainer.on('pointerdown', (event) => {
            if (!this.isMatchingDemo || this.isMatchingAnimating) return;
            
            const localPos = event.data.getLocalPosition(this.demoContainer);
            this.isMatchingAiming = true;
            this.currentMatchingAimPos = { x: localPos.x, y: localPos.y };
            
            // 更新状态显示
            if (this.matchingStatusText) {
                this.matchingStatusText.text = '状态: 瞄准中 - 松开鼠标发射泡泡';
                this.matchingStatusText.style.fill = 0xF39C12;
            }
            
            // 立即更新瞄准线
            this.updateAdvancedMatchingAimLine(localPos.x, localPos.y);
            this.updateMatchingCannonRotation(localPos.x, localPos.y);
        });
        
        // 鼠标抬起事件 - 发射泡泡
        this.demoContainer.on('pointerup', () => {
            if (this.isMatchingAiming && !this.isMatchingAnimating) {
                this.shootAdvancedMatchingBubble();
                this.isMatchingAiming = false;
                
                // 更新状态
                if (this.matchingStatusText) {
                    this.matchingStatusText.text = '状态: 发射完成 - 等待结果';
                    this.matchingStatusText.style.fill = 0x2ECC71;
                }
                
                // 清除瞄准线
                this.matchingAimLine.clear();
            }
        });
        
        // 鼠标离开区域 - 取消瞄准
        this.demoContainer.on('pointerupoutside', () => {
            if (this.isMatchingAiming) {
                this.isMatchingAiming = false;
                if (this.matchingStatusText) {
                    this.matchingStatusText.text = '状态: 瞄准取消 - 鼠标离开区域';
                    this.matchingStatusText.style.fill = 0xE74C3C;
                }
                this.matchingAimLine.clear();
            }
        });
        
        this.isMatchingDemo = true;
        this.isMatchingAiming = false;
    }
    
    shootAdvancedMatchingBubble() {
        if (this.isMatchingAnimating || !this.currentMatchingAimPos) return;
        
        this.isMatchingAnimating = true;
        
        // 使用RootManager创建发射的泡泡
        const shootingBubble = window.rootManager.createShootingBubble(0, 80, 0x0000FF, 18);
        shootingBubble.scale.set(0.9);
        shootingBubble.colorIndex = 2; // 蓝色索引
        shootingBubble.ballColor = 0x0000FF;
        this.demoContainer.addChild(shootingBubble);
        
        // 计算发射方向和速度
        const speed = 8;
        const velocityX = Math.cos(this.matchingAimAngle) * speed;
        const velocityY = Math.sin(this.matchingAimAngle) * speed;
        
        // 隐藏当前泡泡
        this.matchingCurrentBubble.visible = false;
        
        // 创建发射特效
        this.createMatchingShootingEffect();
        
        // 动画发射
        this.animateAdvancedMatchingBubble(shootingBubble, velocityX, velocityY);
    }
    
    createMatchingShootingEffect() {
        // 创建发射火花效果
        const sparkCount = 6;
        for (let i = 0; i < sparkCount; i++) {
            const spark = new PIXI.Graphics();
            spark.beginFill(0xFFFF00, 0.8);
            spark.drawCircle(0, 0, Math.random() * 3 + 2);
            spark.endFill();
            
            spark.x = Math.random() * 15 - 7.5;
            spark.y = 80 + Math.random() * 15 - 7.5;
            this.demoContainer.addChild(spark);
            
            // 火花动画
            const startTime = Date.now();
            const direction = Math.random() * Math.PI * 2;
            const speed = Math.random() * 2 + 1;
            
            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = elapsed / 400;
                
                if (progress < 1) {
                    spark.x += Math.cos(direction) * speed;
                    spark.y += Math.sin(direction) * speed;
                    spark.alpha = 1 - progress;
                    spark.scale.set(1 + progress * 0.5);
                    requestAnimationFrame(animate);
                } else {
                    this.demoContainer.removeChild(spark);
                    spark.destroy();
                }
            };
            animate();
        }
    }
    
    animateAdvancedMatchingBubble(bubble, velocityX, velocityY) {
        let currentVelX = velocityX;
        let currentVelY = velocityY;
        
        const animate = () => {
            if (!bubble || !bubble.parent) return;
            
            // 更新位置
            bubble.x += currentVelX;
            bubble.y += currentVelY;
            
            // 添加轻微的重力效果
            currentVelY += 0.15;
            
            // 边界反弹
            if (bubble.x < -180 || bubble.x > 180) {
                currentVelX = -currentVelX * 0.8; // 能量损失
                bubble.x = Math.max(-180, Math.min(180, bubble.x));
            }
            
            // 上边界反弹
            if (bubble.y < -180) {
                currentVelY = -currentVelY * 0.8;
                bubble.y = -180;
            }
            
            // 检查碰撞
            const collision = this.checkAdvancedMatchingCollision(bubble);
            if (collision || bubble.y > 200) {
                this.handleAdvancedMatchingCollision(bubble, collision);
                return;
            }
            
            // 速度过低时停止
            if (Math.abs(currentVelX) < 0.3 && Math.abs(currentVelY) < 0.3 && bubble.y > 50) {
                this.handleAdvancedMatchingCollision(bubble, null);
                return;
            }
            
            requestAnimationFrame(animate);
        };
        
        animate();
    }
    
    checkAdvancedMatchingCollision(movingBubble) {
        // 检查与网格泡泡的碰撞
        for (let row = 0; row < this.gridBubbles.length; row++) {
            for (let col = 0; col < this.gridBubbles[row].length; col++) {
                const staticBubble = this.gridBubbles[row][col];
                if (staticBubble && staticBubble.parent) {
                    const distance = Math.sqrt(
                        Math.pow(movingBubble.x - staticBubble.x, 2) +
                        Math.pow(movingBubble.y - (staticBubble.y - 180), 2)
                    );
                    
                    if (distance < 30) {
                        return { row, col, bubble: staticBubble };
                    }
                }
            }
        }
        return null;
    }
    
    handleAdvancedMatchingCollision(bubble, collision) {
        // 创建碰撞特效
        if (collision) {
            this.createMatchingCollisionEffect(bubble.x, bubble.y);
        }
        
        // 移除发射的泡泡
        this.demoContainer.removeChild(bubble);
        bubble.destroy();
        
        if (collision) {
            // 将泡泡添加到网格
            const newRow = Math.max(0, collision.row - 1);
            const newCol = collision.col;
            
            // 检查匹配
            this.checkAdvancedColorMatches(newRow, newCol, bubble.colorIndex);
        } else {
            // 没有碰撞，显示失败消息
            this.showMatchingResult('射击失败', '泡泡未击中目标', 0xE74C3C);
        }
        
        // 重置
        setTimeout(() => {
            this.resetAdvancedMatchingDemo();
        }, 2500);
    }
    
    createMatchingCollisionEffect(x, y) {
        // 创建碰撞环效果
        const ringCount = 3;
        for (let i = 0; i < ringCount; i++) {
            const ring = new PIXI.Graphics();
            ring.lineStyle(4, 0xFFFFFF, 0.8);
            ring.drawCircle(0, 0, 5);
            ring.x = x;
            ring.y = y;
            this.demoContainer.addChild(ring);
            
            // 环形扩散动画
            const startTime = Date.now();
            const delay = i * 100;
            
            const animate = () => {
                const elapsed = Date.now() - startTime - delay;
                if (elapsed < 0) {
                    requestAnimationFrame(animate);
                    return;
                }
                
                const progress = elapsed / 600;
                
                if (progress < 1) {
                    const scale = 1 + progress * 3;
                    ring.scale.set(scale);
                    ring.alpha = 0.8 - progress * 0.8;
                    requestAnimationFrame(animate);
                } else {
                    this.demoContainer.removeChild(ring);
                    ring.destroy();
                }
            };
            animate();
        }
    }
    
    animateMatchingBubble(bubble, velocityX, velocityY) {
        let currentVelX = velocityX;
        let currentVelY = velocityY;
        
        const animate = () => {
            if (!bubble || !bubble.parent) return;
            
            // 更新位置
            bubble.x += currentVelX;
            bubble.y += currentVelY;
            
            // 边界反弹
            if (bubble.x < -180 || bubble.x > 180) {
                currentVelX = -currentVelX;
            }
            
            // 检查碰撞
            const collision = this.checkMatchingCollision(bubble);
            if (collision || bubble.y < -160) {
                this.handleMatchingCollision(bubble, collision);
                return;
            }
            
            requestAnimationFrame(animate);
        };
        
        animate();
    }
    
    checkMatchingCollision(movingBubble) {
        for (let row = 0; row < this.gridBubbles.length; row++) {
            for (let col = 0; col < this.gridBubbles[row].length; col++) {
                const staticBubble = this.gridBubbles[row][col];
                if (staticBubble && staticBubble.parent) {
                    const distance = Math.sqrt(
                        Math.pow(movingBubble.x - staticBubble.x, 2) +
                        Math.pow(movingBubble.y - (staticBubble.y - 180), 2)
                    );
                    
                    if (distance < 32) {
                        return { row, col, bubble: staticBubble };
                    }
                }
            }
        }
        return null;
    }
    
    handleMatchingCollision(bubble, collision) {
        // 移除发射的泡泡
        this.demoContainer.removeChild(bubble);
        bubble.destroy();
        
        if (collision) {
            // 将泡泡添加到网格
            const newRow = Math.max(0, collision.row - 1);
            const newCol = collision.col;
            
            // 检查匹配 - 使用新的高级方法
            this.checkAdvancedColorMatches(newRow, newCol, bubble.colorIndex);
        }
        
        // 重置
        setTimeout(() => {
            this.resetAdvancedMatchingDemo();
        }, 2500);
    }
    
    checkAdvancedColorMatches(row, col, colorIndex) {
        // 查找相同颜色的连接泡泡
        const matches = this.findConnectedMatches(row, col, colorIndex, []);
        
        if (matches.length >= 3) {
            this.showMatchingResult('🎯 匹配成功!', `找到 ${matches.length} 个连接的泡泡`, 0x00FF00);
            
            // 高亮匹配的泡泡
            matches.forEach((match, index) => {
                setTimeout(() => {
                    this.highlightBubble(match.row, match.col);
                }, index * 80);
            });
            
            // 移除匹配的泡泡
            setTimeout(() => {
                this.removeMatchedBubbles(matches);
            }, matches.length * 80 + 400);
            
            // 检查悬空泡泡
            setTimeout(() => {
                this.checkFloatingBubbles();
            }, matches.length * 80 + 800);
            
            // 更新状态
            if (this.matchingStatusText) {
                this.matchingStatusText.text = '状态: 匹配成功! 准备下一轮';
                this.matchingStatusText.style.fill = 0x2ECC71;
            }
        } else {
            this.showMatchingResult('❌ 未匹配', `只找到 ${matches.length} 个连接的泡泡 (需要3个或更多)`, 0xFFAA00);
            
            // 更新状态
            if (this.matchingStatusText) {
                this.matchingStatusText.text = '状态: 匹配失败，继续尝试';
                this.matchingStatusText.style.fill = 0xF39C12;
            }
        }
    }
    
    resetAdvancedMatchingDemo() {
        this.isMatchingAnimating = false;
        this.isMatchingAiming = false;
        
        // 重新显示当前泡泡
        if (this.matchingCurrentBubble) {
            this.matchingCurrentBubble.visible = true;
        }
        
        // 清除瞄准线
        if (this.matchingAimLine) {
            this.matchingAimLine.clear();
        }
        
        // 重置状态文本
        if (this.matchingStatusText) {
            this.matchingStatusText.text = '状态: 准备发射 - 按住鼠标瞄准';
            this.matchingStatusText.style.fill = 0xFFFFFF;
        }
        
        // 重置坐标显示
        if (this.matchingCoordinateText) {
            this.matchingCoordinateText.text = '瞄准坐标: X:0, Y:0';
        }
        
        // 重置炮管方向
        if (this.matchingCannon) {
            this.matchingCannon.rotation = -Math.PI / 2;
        }
        
        this.currentMatchingAimPos = null;
    }
    
    findConnectedMatches(row, col, colorIndex, visited) {
        const key = `${row}-${col}`;
        if (visited.includes(key)) return [];
        
        const bubble = this.gridBubbles[row] && this.gridBubbles[row][col];
        if (!bubble || !bubble.parent || bubble.colorIndex !== colorIndex) return [];
        
        visited.push(key);
        let matches = [{ row, col, bubble }];
        
        // 检查六边形相邻位置
        const neighbors = this.getHexNeighbors(row, col);
        neighbors.forEach(neighbor => {
            const connectedMatches = this.findConnectedMatches(neighbor.row, neighbor.col, colorIndex, visited);
            matches = matches.concat(connectedMatches);
        });
        
        return matches;
    }
    
    getHexNeighbors(row, col) {
        const neighbors = [];
        const isEvenRow = row % 2 === 0;
        
        // 六边形网格的相邻位置
        const offsets = isEvenRow ? [
            [-1, -1], [-1, 0], [0, -1], [0, 1], [1, -1], [1, 0]
        ] : [
            [-1, 0], [-1, 1], [0, -1], [0, 1], [1, 0], [1, 1]
        ];
        
        offsets.forEach(([dRow, dCol]) => {
            const newRow = row + dRow;
            const newCol = col + dCol;
            if (newRow >= 0 && newRow < this.gridBubbles.length &&
                newCol >= 0 && newCol < this.gridBubbles[newRow].length) {
                neighbors.push({ row: newRow, col: newCol });
            }
        });
        
        return neighbors;
    }
    
    highlightBubble(row, col) {
        const bubble = this.gridBubbles[row][col];
        if (!bubble || !bubble.parent) return;
        
        // 创建高亮效果
        const highlight = new PIXI.Graphics();
        highlight.lineStyle(4, 0xFFFF00, 1);
        highlight.drawCircle(0, 0, 20);
        highlight.x = bubble.x;
        highlight.y = bubble.y;
        this.matchingGrid.addChild(highlight);
        
        // 高亮动画
        let scale = 1;
        const pulse = () => {
            scale += 0.1;
            highlight.scale.set(scale);
            highlight.alpha = 1 - (scale - 1) * 2;
            
            if (scale < 1.5) {
                requestAnimationFrame(pulse);
            } else {
                this.matchingGrid.removeChild(highlight);
                highlight.destroy();
            }
        };
        pulse();
    }
    
    removeMatchedBubbles(matches) {
        matches.forEach(match => {
            const bubble = this.gridBubbles[match.row][match.col];
            if (bubble && bubble.parent) {
                // 消失动画
                const startTime = Date.now();
                const animate = () => {
                    const elapsed = Date.now() - startTime;
                    const progress = elapsed / 300;
                    
                    if (progress < 1) {
                        bubble.scale.set(0.8 * (1 - progress));
                        bubble.alpha = 1 - progress;
                        requestAnimationFrame(animate);
                    } else {
                        this.matchingGrid.removeChild(bubble);
                        bubble.destroy();
                        this.gridBubbles[match.row][match.col] = null;
                    }
                };
                animate();
            }
        });
    }
    
    checkFloatingBubbles() {
        // 找到所有悬空的泡泡
        const connected = new Set();
        
        // 从顶行开始标记所有连接的泡泡
        for (let col = 0; col < this.gridBubbles[0].length; col++) {
            if (this.gridBubbles[0][col]) {
                this.markConnectedBubbles(0, col, connected);
            }
        }
        
        // 找到未连接的泡泡
        const floating = [];
        for (let row = 0; row < this.gridBubbles.length; row++) {
            for (let col = 0; col < this.gridBubbles[row].length; col++) {
                const bubble = this.gridBubbles[row][col];
                if (bubble && bubble.parent && !connected.has(`${row}-${col}`)) {
                    floating.push({ row, col, bubble });
                }
            }
        }
        
        if (floating.length > 0) {
            this.showFloatingResult(`发现 ${floating.length} 个悬空泡泡`);
            
            // 移除悬空泡泡
            setTimeout(() => {
                this.removeFloatingBubbles(floating);
            }, 1000);
        }
    }
    
    markConnectedBubbles(row, col, connected) {
        const key = `${row}-${col}`;
        if (connected.has(key)) return;
        
        const bubble = this.gridBubbles[row] && this.gridBubbles[row][col];
        if (!bubble || !bubble.parent) return;
        
        connected.add(key);
        
        // 递归标记相邻的泡泡
        const neighbors = this.getHexNeighbors(row, col);
        neighbors.forEach(neighbor => {
            this.markConnectedBubbles(neighbor.row, neighbor.col, connected);
        });
    }
    
    removeFloatingBubbles(floating) {
        floating.forEach((floatingBubble, index) => {
            setTimeout(() => {
                const bubble = floatingBubble.bubble;
                if (bubble && bubble.parent) {
                    // 下落动画
                    const fallDistance = 200;
                    const startY = bubble.y;
                    const startTime = Date.now();
                    
                    const animate = () => {
                        const elapsed = Date.now() - startTime;
                        const progress = elapsed / 800;
                        
                        if (progress < 1) {
                            bubble.y = startY + fallDistance * progress * progress; // 重力加速度效果
                            bubble.rotation += 0.1;
                            bubble.alpha = 1 - progress * 0.5;
                            requestAnimationFrame(animate);
                        } else {
                            this.matchingGrid.removeChild(bubble);
                            bubble.destroy();
                            this.gridBubbles[floatingBubble.row][floatingBubble.col] = null;
                        }
                    };
                    animate();
                }
            }, index * 150);
        });
    }
    
    showMatchingResult(title, message, color) {
        // 创建结果显示
        const resultContainer = new PIXI.Container();
        
        const bg = new PIXI.Graphics();
        bg.beginFill(0x000000, 0.8);
        bg.drawRoundedRect(-100, -30, 200, 60, 10);
        bg.endFill();
        
        const titleText = new PIXI.Text(title, {
            fontFamily: 'Arial',
            fontSize: 16,
            fill: color,
            fontWeight: 'bold'
        });
        titleText.anchor.set(0.5);
        titleText.y = -10;
        
        const messageText = new PIXI.Text(message, {
            fontFamily: 'Arial',
            fontSize: 12,
            fill: 0xFFFFFF
        });
        messageText.anchor.set(0.5);
        messageText.y = 10;
        
        resultContainer.addChild(bg);
        resultContainer.addChild(titleText);
        resultContainer.addChild(messageText);
        resultContainer.x = 0;
        resultContainer.y = -50;
        
        this.demoContainer.addChild(resultContainer);
        
        // 自动移除
        setTimeout(() => {
            this.demoContainer.removeChild(resultContainer);
            resultContainer.destroy();
        }, 2000);
    }
    
    showFloatingResult(message) {
        const floatingText = new PIXI.Text(message, {
            fontFamily: 'Arial',
            fontSize: 14,
            fill: 0xFFAA00,
            fontWeight: 'bold'
        });
        floatingText.anchor.set(0.5);
        floatingText.x = 0;
        floatingText.y = 0;
        
        this.demoContainer.addChild(floatingText);
        
        // 浮动动画
        const startTime = Date.now();
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / 1500;
            
            if (progress < 1) {
                floatingText.y = -progress * 30;
                floatingText.alpha = 1 - progress;
                requestAnimationFrame(animate);
            } else {
                this.demoContainer.removeChild(floatingText);
                floatingText.destroy();
            }
        };
        animate();
    }
    
    createMatchingControls() {
        const controlsContainer = new PIXI.Container();
        controlsContainer.y = 160;
        this.demoContainer.addChild(controlsContainer);
        
        // 自动匹配按钮
        const autoMatchButton = this.createControlButton('自动匹配', -80, 0, () => {
            this.autoMatch();
        });
        
        // 重置按钮
        const resetButton = this.createControlButton('重置演示', 80, 0, () => {
            this.resetMatchingDemo();
        });
        
        controlsContainer.addChild(autoMatchButton);
        controlsContainer.addChild(resetButton);
        
        // 说明文字
        const instruction = new PIXI.Text('瞄准蓝色区域发射以创建匹配', {
            fontFamily: 'Arial',
            fontSize: 12,
            fill: 0xFFFFFF,
            align: 'center'
        });
        instruction.anchor.set(0.5);
        instruction.y = 40;
        controlsContainer.addChild(instruction);
    }
    
    createMatchingInfo() {
        const infoContainer = new PIXI.Container();
        infoContainer.x = -250;
        infoContainer.y = -100;
        this.demoContainer.addChild(infoContainer);
        
        const infoBg = new PIXI.Graphics();
        infoBg.beginFill(0x2C3E50, 0.9);
        infoBg.drawRoundedRect(0, 0, 180, 120, 8);
        infoBg.endFill();
        
        const infoTitle = new PIXI.Text('匹配规则:', {
            fontFamily: 'Arial',
            fontSize: 14,
            fill: 0xFFFFFF,
            fontWeight: 'bold'
        });
        infoTitle.x = 10;
        infoTitle.y = 10;
        
        const infoText = new PIXI.Text(
            '• 3个或更多相同颜色\n' +
            '• 必须相互连接\n' +
            '• 匹配后会消除\n' +
            '• 悬空泡泡会掉落',
            {
                fontFamily: 'Arial',
                fontSize: 11,
                fill: 0xBDC3C7,
                lineHeight: 16
            }
        );
        infoText.x = 10;
        infoText.y = 35;
        
        infoContainer.addChild(infoBg);
        infoContainer.addChild(infoTitle);
        infoContainer.addChild(infoText);
    }
    
    autoMatch() {
        // 自动瞄准到蓝色区域
        const targetX = -40; // 瞄准蓝色泡泡区域
        const targetY = -100;
        
        // 模拟按下鼠标开始瞄准
        this.isMatchingAiming = true;
        this.currentMatchingAimPos = { x: targetX, y: targetY };
        
        // 更新瞄准线
        this.updateAdvancedMatchingAimLine(targetX, targetY);
        this.updateMatchingCannonRotation(targetX, targetY);
        
        // 更新状态显示
        if (this.matchingStatusText) {
            this.matchingStatusText.text = '状态: 自动瞄准中...';
            this.matchingStatusText.style.fill = 0xF39C12;
        }
        
        // 自动发射
        setTimeout(() => {
            if (this.isMatchingAiming && !this.isMatchingAnimating) {
                this.shootAdvancedMatchingBubble();
                this.isMatchingAiming = false;
                this.matchingAimLine.clear();
            }
        }, 800);
    }
    
    resetMatchingDemo() {
        // 使用新的高级重置方法
        this.resetAdvancedMatchingDemo();
        
        // 重置网格
        this.matchingGrid.removeChildren();
        this.createMatchingGrid();
    }
    
    // 创建控制按钮的通用方法
    createControlButton(text, x, y, onClick) {
        const button = new PIXI.Container();
        
        const bg = new PIXI.Graphics();
        bg.beginFill(0x3498DB);
        bg.drawRoundedRect(0, 0, 120, 30, 6);
        bg.endFill();
        
        const buttonText = new PIXI.Text(text, {
            fontFamily: 'Arial',
            fontSize: 12,
            fill: 0xFFFFFF,
            fontWeight: 'bold'
        });
        buttonText.anchor.set(0.5);
        buttonText.x = 60;
        buttonText.y = 15;
        
        button.addChild(bg);
        button.addChild(buttonText);
        button.x = x;
        button.y = y;
        
        button.interactive = true;
        button.buttonMode = true;
        
        // 悬停效果
        button.on('pointerover', () => {
            bg.clear();
            bg.beginFill(0x2980B9);
            bg.drawRoundedRect(0, 0, 120, 30, 6);
            bg.endFill();
        });
        
        button.on('pointerout', () => {
            bg.clear();
            bg.beginFill(0x3498DB);
            bg.drawRoundedRect(0, 0, 120, 30, 6);
            bg.endFill();
        });
        
        button.on('pointerdown', () => {
            onClick();
        });
        
        return button;
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
    
    // Step 2-1: 射手角色创建 - 鼠标按下移动坐标显示
    createStep2_1Demo() {
        // 创建子演示容器
        this.subDemoContainer = new PIXI.Container();
        this.subDemoContainer.y = -100;
        this.demoContainer.addChild(this.subDemoContainer);
        
        // 创建标题
        const title = new PIXI.Text('Step 2-1: 鼠标按下移动坐标显示', {
            fontFamily: 'Arial',
            fontSize: 18,
            fill: 0xFFFFFF,
            fontWeight: 'bold'
        });
        title.anchor.set(0.5);
        title.x = 0;
        title.y = -50;
        this.subDemoContainer.addChild(title);
        
        // 创建坐标显示文本
        this.dragCoordinateText = new PIXI.Text('鼠标坐标: X:0, Y:0', {
            fontFamily: 'Arial',
            fontSize: 16,
            fill: 0x4ecdc4,
            fontWeight: 'bold'
        });
        this.dragCoordinateText.anchor.set(0.5);
        this.dragCoordinateText.x = 0;
        this.dragCoordinateText.y = -20;
        this.subDemoContainer.addChild(this.dragCoordinateText);
        
        // 创建状态显示文本
        this.dragStatusText = new PIXI.Text('状态: 未按下', {
            fontFamily: 'Arial',
            fontSize: 14,
            fill: 0xFFFFFF
        });
        this.dragStatusText.anchor.set(0.5);
        this.dragStatusText.x = 0;
        this.dragStatusText.y = 10;
        this.subDemoContainer.addChild(this.dragStatusText);
        
        // 创建可拖拽的演示区域
        this.dragArea = new PIXI.Graphics();
        this.dragArea.beginFill(0x34495E, 0.3);
        this.dragArea.lineStyle(2, 0x3498DB);
        this.dragArea.drawRoundedRect(-200, -100, 400, 200, 10);
        this.dragArea.endFill();
        this.dragArea.y = 100;
        this.subDemoContainer.addChild(this.dragArea);
        
        // 添加区域标签
        const areaLabel = new PIXI.Text('拖拽区域\n按住鼠标并移动查看坐标变化', {
            fontFamily: 'Arial',
            fontSize: 12,
            fill: 0x3498DB,
            align: 'center'
        });
        areaLabel.anchor.set(0.5);
        areaLabel.x = 0;
        areaLabel.y = 100;
        this.subDemoContainer.addChild(areaLabel);
        
        // 创建拖拽指示器
        this.dragIndicator = new PIXI.Graphics();
        this.dragIndicator.beginFill(0xFF6B6B);
        this.dragIndicator.drawCircle(0, 0, 8);
        this.dragIndicator.endFill();
        this.dragIndicator.visible = false;
        this.subDemoContainer.addChild(this.dragIndicator);
        
        // 设置拖拽交互
        this.setupDragInteraction();
        
        // 创建说明文字
        const instruction = new PIXI.Text('按住鼠标左键并在蓝色区域内移动，观察坐标变化', {
            fontFamily: 'Arial',
            fontSize: 12,
            fill: 0xBDC3C7,
            align: 'center'
        });
        instruction.anchor.set(0.5);
        instruction.x = 0;
        instruction.y = 220;
        this.subDemoContainer.addChild(instruction);
    }
    
    setupDragInteraction() {
        // 设置拖拽区域为可交互
        this.dragArea.interactive = true;
        this.dragArea.buttonMode = true;
        
        // 拖拽状态
        this.isDragging = false;
        
        // 鼠标按下事件
        this.dragArea.on('pointerdown', (event) => {
            this.isDragging = true;
            this.dragIndicator.visible = true;
            this.dragStatusText.text = '状态: 拖拽中';
            this.dragStatusText.style.fill = 0x2ECC71;
            
            // 获取相对于拖拽区域的坐标
            const localPos = event.data.getLocalPosition(this.dragArea);
            this.updateDragCoordinates(localPos.x, localPos.y);
            this.dragIndicator.x = localPos.x;
            this.dragIndicator.y = localPos.y + 100; // 相对于subDemoContainer的位置
        });
        
        // 鼠标移动事件
        this.dragArea.on('pointermove', (event) => {
            if (this.isDragging) {
                const localPos = event.data.getLocalPosition(this.dragArea);
                this.updateDragCoordinates(localPos.x, localPos.y);
                this.dragIndicator.x = localPos.x;
                this.dragIndicator.y = localPos.y + 100;
            }
        });
        
        // 鼠标抬起事件
        this.dragArea.on('pointerup', () => {
            this.isDragging = false;
            this.dragIndicator.visible = false;
            this.dragStatusText.text = '状态: 未按下';
            this.dragStatusText.style.fill = 0xFFFFFF;
        });
        
        // 鼠标离开区域时也停止拖拽
        this.dragArea.on('pointerupoutside', () => {
            this.isDragging = false;
            this.dragIndicator.visible = false;
            this.dragStatusText.text = '状态: 离开区域';
            this.dragStatusText.style.fill = 0xE74C3C;
        });
        
        // 鼠标进入区域
        this.dragArea.on('pointerover', () => {
            if (!this.isDragging) {
                this.dragStatusText.text = '状态: 悬停中';
                this.dragStatusText.style.fill = 0xF39C12;
            }
        });
        
        // 鼠标离开区域
        this.dragArea.on('pointerout', () => {
            if (!this.isDragging) {
                this.dragStatusText.text = '状态: 未按下';
                this.dragStatusText.style.fill = 0xFFFFFF;
            }
        });
    }
    
    updateDragCoordinates(x, y) {
        // 更新坐标显示，保留整数
        this.dragCoordinateText.text = `鼠标坐标: X:${Math.round(x)}, Y:${Math.round(y)}`;
    }
    
    // Step 2-2: 瞄准线显示
    createStep2_2Demo() {
        // 创建子演示容器
        this.subDemoContainer = new PIXI.Container();
        this.subDemoContainer.y = -100;
        this.demoContainer.addChild(this.subDemoContainer);
        
        // 创建标题
        const title = new PIXI.Text('Step 2-2: 瞄准线显示', {
            fontFamily: 'Arial',
            fontSize: 18,
            fill: 0xFFFFFF,
            fontWeight: 'bold'
        });
        title.anchor.set(0.5);
        title.x = 0;
        title.y = -50;
        this.subDemoContainer.addChild(title);
        
        // 创建说明文本
        const description = new PIXI.Text('演示绘制一条有指向的瞄准线', {
            fontFamily: 'Arial',
            fontSize: 14,
            fill: 0xBDC3C7,
            align: 'center'
        });
        description.anchor.set(0.5);
        description.x = 0;
        description.y = -20;
        this.subDemoContainer.addChild(description);
        
        // 创建瞄准线演示
        this.createSingleAimLine();
    }
    
    createSingleAimLine() {
        // 创建演示区域容器，将其定位在底部
        const aimContainer = new PIXI.Container();
        aimContainer.y = 100; // 调整位置以便显示canvas四角坐标
        this.subDemoContainer.addChild(aimContainer);
        
        // 先绘制canvas四角坐标标识
        this.drawCanvasCorners(aimContainer);
        
        // 可配置的射击位置参数 - 放在canvas底部中心
        const canvasBottom = GAME_CONFIG.HEIGHT / 2 - 150; // 相对于演示容器的canvas底部位置
        const shootingPosition = { x: 0, y: canvasBottom }; // canvas底部中心
        const aimAngle = -Math.PI / 3; // 瞄准角度（-60度）
        const aimLength = 120; // 瞄准线长度
        
        // 创建射击起点，定位在canvas底部
        const startPoint = new PIXI.Graphics();
        startPoint.beginFill(0xFF6B6B);
        startPoint.drawCircle(shootingPosition.x, shootingPosition.y, 8);
        startPoint.endFill();
        aimContainer.addChild(startPoint);
        
        // 添加起点标签
        const startLabel = new PIXI.Text('射击起点 (Canvas底部中心)', {
            fontFamily: 'Arial',
            fontSize: 12,
            fill: 0xFF6B6B
        });
        startLabel.anchor.set(0.5);
        startLabel.x = shootingPosition.x;
        startLabel.y = shootingPosition.y + 25;
        aimContainer.addChild(startLabel);
        
        // 绘制从底部向上的瞄准线
        const aimLine = new PIXI.Graphics();
        this.drawAimLineFromBottom(aimLine, shootingPosition, aimAngle, 0xFFFF00, aimLength);
        aimContainer.addChild(aimLine);
        
        // 添加配置参数说明
        const configText = new PIXI.Text(
            '瞄准线配置:\n' +
            `• 起点: (${shootingPosition.x}, ${shootingPosition.y})\n` +
            `• 角度: ${Math.round(aimAngle * 180 / Math.PI)}°\n` +
            `• 长度: ${aimLength}px\n\n` +
            'Canvas尺寸:\n' +
            `• 宽度: ${GAME_CONFIG.WIDTH}px\n` +
            `• 高度: ${GAME_CONFIG.HEIGHT}px`,
            {
                fontFamily: 'Arial',
                fontSize: 10,
                fill: 0xBDC3C7,
                align: 'left'
            }
        );
        configText.anchor.set(0, 0);
        configText.x = -280;
        configText.y = -150;
        aimContainer.addChild(configText);
        
        // 添加瞄准线说明
        const aimDescription = new PIXI.Text('从Canvas底部发出的瞄准线', {
            fontFamily: 'Arial',
            fontSize: 12,
            fill: 0xFFFF00
        });
        aimDescription.anchor.set(0.5);
        aimDescription.x = 0;
        aimDescription.y = canvasBottom + 50;
        aimContainer.addChild(aimDescription);
    }
    
    drawCanvasCorners(container) {
        // 计算canvas四角的相对坐标（相对于演示容器中心）
        const halfWidth = GAME_CONFIG.WIDTH / 2;
        const halfHeight = GAME_CONFIG.HEIGHT / 2;
        const adjustY = -150; // 调整Y位置使其在演示容器中合适显示
        
        const corners = [
            { x: -halfWidth, y: -halfHeight + adjustY, label: '左上角\n(0, 0)', color: 0xFF0000 },
            { x: halfWidth, y: -halfHeight + adjustY, label: `右上角\n(${GAME_CONFIG.WIDTH}, 0)`, color: 0x00FF00 },
            { x: -halfWidth, y: halfHeight + adjustY, label: `左下角\n(0, ${GAME_CONFIG.HEIGHT})`, color: 0x0000FF },
            { x: halfWidth, y: halfHeight + adjustY, label: `右下角\n(${GAME_CONFIG.WIDTH}, ${GAME_CONFIG.HEIGHT})`, color: 0xFFFF00 }
        ];
        
        corners.forEach((corner, index) => {
            // 创建角点标记
            const cornerPoint = new PIXI.Graphics();
            cornerPoint.beginFill(corner.color, 0.8);
            cornerPoint.drawCircle(0, 0, 6);
            cornerPoint.endFill();
            
            // 添加边框
            cornerPoint.lineStyle(2, 0xFFFFFF, 1);
            cornerPoint.drawCircle(0, 0, 6);
            
            cornerPoint.x = corner.x;
            cornerPoint.y = corner.y;
            container.addChild(cornerPoint);
            
            // 添加坐标标签
            const cornerLabel = new PIXI.Text(corner.label, {
                fontFamily: 'Arial',
                fontSize: 10,
                fill: corner.color,
                fontWeight: 'bold',
                align: 'center'
            });
            cornerLabel.anchor.set(0.5);
            
            // 根据角点位置调整标签位置
            let offsetX = 0, offsetY = 0;
            if (index === 0) { // 左上角
                offsetX = 25;
                offsetY = 15;
            } else if (index === 1) { // 右上角
                offsetX = -25;
                offsetY = 15;
            } else if (index === 2) { // 左下角
                offsetX = 25;
                offsetY = -15;
            } else { // 右下角
                offsetX = -25;
                offsetY = -15;
            }
            
            cornerLabel.x = corner.x + offsetX;
            cornerLabel.y = corner.y + offsetY;
            container.addChild(cornerLabel);
        });
        
        // 绘制canvas边界框
        const boundary = new PIXI.Graphics();
        boundary.lineStyle(2, 0xFFFFFF, 0.5);
        boundary.drawRect(-halfWidth, -halfHeight + adjustY, GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT);
        container.addChild(boundary);
        
        // 添加canvas标题
        const canvasTitle = new PIXI.Text('Canvas绘制区域边界', {
            fontFamily: 'Arial',
            fontSize: 14,
            fill: 0xFFFFFF,
            fontWeight: 'bold'
        });
        canvasTitle.anchor.set(0.5);
        canvasTitle.x = 0;
        canvasTitle.y = -halfHeight + adjustY - 25;
        container.addChild(canvasTitle);
        
        // 添加中心点标记
        const centerPoint = new PIXI.Graphics();
        centerPoint.beginFill(0xFF00FF, 0.8);
        centerPoint.drawCircle(0, 0, 4);
        centerPoint.endFill();
        centerPoint.lineStyle(1, 0xFFFFFF, 1);
        centerPoint.drawCircle(0, 0, 4);
        centerPoint.y = adjustY;
        container.addChild(centerPoint);
        
        const centerLabel = new PIXI.Text(`中心点\n(${GAME_CONFIG.WIDTH/2}, ${GAME_CONFIG.HEIGHT/2})`, {
            fontFamily: 'Arial',
            fontSize: 10,
            fill: 0xFF00FF,
            fontWeight: 'bold',
            align: 'center'
        });
        centerLabel.anchor.set(0.5);
        centerLabel.x = 0;
        centerLabel.y = adjustY + 20;
        container.addChild(centerLabel);
    }
    
    drawAimLineFromBottom(graphics, startPosition, angle, color, length) {
        // 计算瞄准线终点坐标
        const endX = startPosition.x + Math.cos(angle) * length;
        const endY = startPosition.y + Math.sin(angle) * length;
        
        // 绘制瞄准线主线
        graphics.lineStyle(3, color, 0.9);
        graphics.moveTo(startPosition.x, startPosition.y);
        graphics.lineTo(endX, endY);
        
        // 绘制瞄准点
        graphics.beginFill(color, 0.8);
        graphics.drawCircle(endX, endY, 6);
        graphics.endFill();
        
        // 绘制箭头指向
        this.drawAimArrow(graphics, endX, endY, Math.cos(angle), Math.sin(angle), color);
    }
    
    drawAimLine(graphics, angle, color, length) {
        // 计算瞄准线终点坐标
        const startX = 0;
        const startY = 0;
        const endX = startX + Math.cos(angle) * length;
        const endY = startY + Math.sin(angle) * length;
        
        // 绘制瞄准线主线
        graphics.lineStyle(3, color, 0.9);
        graphics.moveTo(startX, startY);
        graphics.lineTo(endX, endY);
        
        // 绘制瞄准点
        graphics.beginFill(color, 0.8);
        graphics.drawCircle(endX, endY, 6);
        graphics.endFill();
        
        // 绘制箭头指向
        this.drawAimArrow(graphics, endX, endY, Math.cos(angle), Math.sin(angle), color);
    }
    
    drawAimArrow(graphics, endX, endY, unitX, unitY, color) {
        // 计算箭头两个边的坐标
        const arrowLength = 15;
        const arrowAngle = Math.PI / 6; // 30度
        
        // 左箭头边
        const leftArrowX = endX - (unitX * Math.cos(arrowAngle) - unitY * Math.sin(arrowAngle)) * arrowLength;
        const leftArrowY = endY - (unitY * Math.cos(arrowAngle) + unitX * Math.sin(arrowAngle)) * arrowLength;
        
        // 右箭头边
        const rightArrowX = endX - (unitX * Math.cos(-arrowAngle) - unitY * Math.sin(-arrowAngle)) * arrowLength;
        const rightArrowY = endY - (unitY * Math.cos(-arrowAngle) + unitX * Math.sin(-arrowAngle)) * arrowLength;
        
        // 绘制箭头
        graphics.lineStyle(3, color, 0.9);
        graphics.moveTo(endX, endY);
        graphics.lineTo(leftArrowX, leftArrowY);
        graphics.moveTo(endX, endY);
        graphics.lineTo(rightArrowX, rightArrowY);
    }
    
    // Step 2-3: 鼠标坐标显示
    createStep2_3Demo() {
        // 创建子演示容器
        this.subDemoContainer = new PIXI.Container();
        this.subDemoContainer.y = -100;
        this.demoContainer.addChild(this.subDemoContainer);
        
        // 创建标题
        const title = new PIXI.Text('Step 2-3: 鼠标交互瞄准系统', {
            fontFamily: 'Arial',
            fontSize: 18,
            fill: 0xFFFFFF,
            fontWeight: 'bold'
        });
        title.anchor.set(0.5);
        title.x = 0;
        title.y = -50;
        this.subDemoContainer.addChild(title);
        
        // 创建说明文本
        const description = new PIXI.Text('结合鼠标坐标显示和瞄准线，实现实时交互瞄准', {
            fontFamily: 'Arial',
            fontSize: 14,
            fill: 0xBDC3C7,
            align: 'center'
        });
        description.anchor.set(0.5);
        description.x = 0;
        description.y = -20;
        this.subDemoContainer.addChild(description);
        
        // 创建鼠标坐标显示
        this.interactiveCoordinateText = new PIXI.Text('鼠标坐标: X:0, Y:0', {
            fontFamily: 'Arial',
            fontSize: 16,
            fill: 0x4ecdc4,
            fontWeight: 'bold'
        });
        this.interactiveCoordinateText.anchor.set(0.5);
        this.interactiveCoordinateText.x = 0;
        this.interactiveCoordinateText.y = 10;
        this.subDemoContainer.addChild(this.interactiveCoordinateText);
        
        // 创建状态显示
        this.interactiveStatusText = new PIXI.Text('状态: 移动鼠标开始瞄准', {
            fontFamily: 'Arial',
            fontSize: 14,
            fill: 0xFFFFFF
        });
        this.interactiveStatusText.anchor.set(0.5);
        this.interactiveStatusText.x = 0;
        this.interactiveStatusText.y = 35;
        this.subDemoContainer.addChild(this.interactiveStatusText);
        
        // 创建交互区域
        this.createInteractiveAimingArea();
        
        // 创建射手
        this.createInteractiveShooter();
        
        // 创建瞄准线
        this.createInteractiveAimLine();
        
        // 设置交互
        this.setupInteractiveAiming();
        
        // 创建说明
        this.createInteractiveInstructions();
    }
    
    createInteractiveAimingArea() {
        const aimingArea = new PIXI.Container();
        aimingArea.y = 100;
        this.subDemoContainer.addChild(aimingArea);
        
        // 创建交互区域背景
        this.interactiveArea = new PIXI.Graphics();
        this.interactiveArea.beginFill(0x34495E, 0.2);
        this.interactiveArea.lineStyle(2, 0x3498DB, 0.8);
        this.interactiveArea.drawRoundedRect(-300, -150, 600, 300, 15);
        this.interactiveArea.endFill();
        aimingArea.addChild(this.interactiveArea);
        
        // 添加区域标签
        const areaTitle = new PIXI.Text('交互瞄准区域', {
            fontFamily: 'Arial',
            fontSize: 14,
            fill: 0x3498DB,
            fontWeight: 'bold'
        });
        areaTitle.anchor.set(0.5);
        areaTitle.x = 0;
        areaTitle.y = -170;
        aimingArea.addChild(areaTitle);
        
        this.aimingAreaContainer = aimingArea;
    }
    
    createInteractiveShooter() {
        // 创建射手，位于交互区域底部中心
        this.interactiveShooter = new PIXI.Container();
        this.interactiveShooter.x = 0;
        this.interactiveShooter.y = 130; // 底部位置
        this.aimingAreaContainer.addChild(this.interactiveShooter);
        
        // 射手底座
        const base = new PIXI.Graphics();
        base.beginFill(0x8B4513);
        base.drawRoundedRect(-25, -10, 50, 20, 10);
        base.endFill();
        
        // 射手身体
        const body = new PIXI.Graphics();
        body.beginFill(0x2E8B57);
        body.drawRoundedRect(-12, -25, 24, 18, 5);
        body.endFill();
        
        // 射手头部
        const head = new PIXI.Graphics();
        head.beginFill(0xFFDBB3);
        head.drawCircle(0, -35, 7);
        head.endFill();
        
        // 可旋转的炮管
        this.interactiveCannon = new PIXI.Graphics();
        this.interactiveCannon.beginFill(0x696969);
        this.interactiveCannon.drawRoundedRect(-3, -30, 6, 20, 3);
        this.interactiveCannon.endFill();
        
        this.interactiveShooter.addChild(base);
        this.interactiveShooter.addChild(body);
        this.interactiveShooter.addChild(head);
        this.interactiveShooter.addChild(this.interactiveCannon);
        
        // 添加射手标签
        const shooterLabel = new PIXI.Text('射手 (可旋转炮管)', {
            fontFamily: 'Arial',
            fontSize: 10,
            fill: 0xFF6B6B
        });
        shooterLabel.anchor.set(0.5);
        shooterLabel.x = 0;
        shooterLabel.y = 15;
        this.interactiveShooter.addChild(shooterLabel);
    }
    
    createInteractiveAimLine() {
        // 创建瞄准线图形
        this.interactiveAimLine = new PIXI.Graphics();
        this.aimingAreaContainer.addChild(this.interactiveAimLine);
        
        // 初始瞄准角度（向上）
        this.currentAimAngle = -Math.PI / 2;
        this.isAiming = false;
        
        // 绘制初始瞄准线
        this.updateInteractiveAimLine(0, 130); // 从射手位置开始
    }
    
    setupInteractiveAiming() {
        // 设置交互区域为可交互
        this.interactiveArea.interactive = true;
        this.interactiveArea.buttonMode = true;
        
        // 鼠标移动事件
        this.interactiveArea.on('pointermove', (event) => {
            const localPos = event.data.getLocalPosition(this.aimingAreaContainer);
            
            // 更新坐标显示
            this.updateInteractiveCoordinates(localPos.x, localPos.y);
            
            // 如果正在瞄准，更新瞄准线
            if (this.isAiming) {
                this.updateInteractiveAimLine(localPos.x, localPos.y);
                this.updateCannonRotation(localPos.x, localPos.y);
            }
        });
        
        // 鼠标按下事件
        this.interactiveArea.on('pointerdown', (event) => {
            this.isAiming = true;
            const localPos = event.data.getLocalPosition(this.aimingAreaContainer);
            
            // 更新状态
            this.interactiveStatusText.text = '状态: 瞄准中 - 移动鼠标调整方向';
            this.interactiveStatusText.style.fill = 0x2ECC71;
            
            // 立即更新瞄准线
            this.updateInteractiveAimLine(localPos.x, localPos.y);
            this.updateCannonRotation(localPos.x, localPos.y);
        });
        
        // 鼠标抬起事件
        this.interactiveArea.on('pointerup', () => {
            this.isAiming = false;
            this.interactiveStatusText.text = '状态: 停止瞄准 - 按下鼠标重新开始';
            this.interactiveStatusText.style.fill = 0xFFFFFF;
        });
        
        // 鼠标离开区域
        this.interactiveArea.on('pointerupoutside', () => {
            this.isAiming = false;
            this.interactiveStatusText.text = '状态: 鼠标离开区域';
            this.interactiveStatusText.style.fill = 0xE74C3C;
        });
        
        // 鼠标进入区域
        this.interactiveArea.on('pointerover', () => {
            if (!this.isAiming) {
                this.interactiveStatusText.text = '状态: 鼠标悬停 - 按下开始瞄准';
                this.interactiveStatusText.style.fill = 0xF39C12;
            }
        });
        
        // 鼠标离开区域
        this.interactiveArea.on('pointerout', () => {
            if (!this.isAiming) {
                this.interactiveStatusText.text = '状态: 移动鼠标开始瞄准';
                this.interactiveStatusText.style.fill = 0xFFFFFF;
            }
        });
    }
    
    updateInteractiveCoordinates(x, y) {
        // 更新坐标显示
        this.interactiveCoordinateText.text = `鼠标坐标: X:${Math.round(x)}, Y:${Math.round(y)}`;
    }
    
    updateInteractiveAimLine(targetX, targetY) {
        this.interactiveAimLine.clear();
        
        // 射手位置
        const shooterX = 0;
        const shooterY = 130;
        
        // 计算瞄准方向
        const deltaX = targetX - shooterX;
        const deltaY = targetY - shooterY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        // 如果距离太小，不绘制瞄准线
        if (distance < 20) return;
        
        // 计算角度
        this.currentAimAngle = Math.atan2(deltaY, deltaX);
        
        // 限制瞄准角度（只能向上半圆瞄准）
        const minAngle = -Math.PI; // 左侧
        const maxAngle = 0; // 右侧
        this.currentAimAngle = Math.max(minAngle, Math.min(maxAngle, this.currentAimAngle));
        
        // 计算瞄准线长度（限制最大长度）
        const maxLength = 200;
        const aimLength = Math.min(distance, maxLength);
        
        // 计算终点
        const endX = shooterX + Math.cos(this.currentAimAngle) * aimLength;
        const endY = shooterY + Math.sin(this.currentAimAngle) * aimLength;
        
        // 绘制瞄准线
        if (this.isAiming) {
            this.interactiveAimLine.lineStyle(4, 0xFFFF00, 0.9);
        } else {
            this.interactiveAimLine.lineStyle(2, 0xFFFF00, 0.5);
        }
        
        this.interactiveAimLine.moveTo(shooterX, shooterY - 20); // 从炮管位置开始
        this.interactiveAimLine.lineTo(endX, endY);
        
        // 绘制瞄准点
        this.interactiveAimLine.beginFill(this.isAiming ? 0xFF6B6B : 0xFFFF00, 0.8);
        this.interactiveAimLine.drawCircle(endX, endY, this.isAiming ? 8 : 5);
        this.interactiveAimLine.endFill();
        
        // 绘制箭头
        if (this.isAiming) {
            this.drawInteractiveArrow(endX, endY, this.currentAimAngle);
        }
        
        // 绘制目标位置标记（只在瞄准时显示）
        if (this.isAiming) {
            this.interactiveAimLine.lineStyle(2, 0xFF6B6B, 0.6);
            this.interactiveAimLine.drawCircle(targetX, targetY, 10);
            
            // 绘制十字标记
            this.interactiveAimLine.moveTo(targetX - 8, targetY);
            this.interactiveAimLine.lineTo(targetX + 8, targetY);
            this.interactiveAimLine.moveTo(targetX, targetY - 8);
            this.interactiveAimLine.lineTo(targetX, targetY + 8);
        }
    }
    
    updateCannonRotation(targetX, targetY) {
        // 更新炮管旋转角度
        if (this.interactiveCannon) {
            const shooterX = 0;
            const shooterY = 130;
            const angle = Math.atan2(targetY - shooterY, targetX - shooterX);
            
            // 限制炮管旋转角度
            const limitedAngle = Math.max(-Math.PI, Math.min(0, angle));
            this.interactiveCannon.rotation = limitedAngle + Math.PI / 2; // 调整到正确方向
        }
    }
    
    drawInteractiveArrow(endX, endY, angle) {
        // 绘制箭头
        const arrowLength = 20;
        const arrowAngle = Math.PI / 6; // 30度
        
        // 计算箭头两个边的坐标
        const leftArrowX = endX - Math.cos(angle - arrowAngle) * arrowLength;
        const leftArrowY = endY - Math.sin(angle - arrowAngle) * arrowLength;
        const rightArrowX = endX - Math.cos(angle + arrowAngle) * arrowLength;
        const rightArrowY = endY - Math.sin(angle + arrowAngle) * arrowLength;
        
        // 绘制箭头线条
        this.interactiveAimLine.lineStyle(4, 0xFF6B6B, 0.9);
        this.interactiveAimLine.moveTo(endX, endY);
        this.interactiveAimLine.lineTo(leftArrowX, leftArrowY);
        this.interactiveAimLine.moveTo(endX, endY);
        this.interactiveAimLine.lineTo(rightArrowX, rightArrowY);
    }
    
    createInteractiveInstructions() {
        // 创建操作说明
        const instructionContainer = new PIXI.Container();
        instructionContainer.y = 250;
        this.subDemoContainer.addChild(instructionContainer);
        
        const instructions = new PIXI.Text(
            '操作说明:\n' +
            '• 移动鼠标查看实时坐标\n' +
            '• 按住鼠标左键开始瞄准\n' +
            '• 瞄准时移动鼠标调整方向\n' +
            '• 炮管会跟随鼠标旋转\n' +
            '• 红色箭头指向鼠标位置',
            {
                fontFamily: 'Arial',
                fontSize: 12,
                fill: 0xBDC3C7,
                align: 'left',
                lineHeight: 18
            }
        );
        instructions.anchor.set(0.5);
        instructions.x = 0;
        instructions.y = 0;
        instructionContainer.addChild(instructions);
        
        // 添加功能特性说明
        const featuresText = new PIXI.Text(
            '实现特性:\n' +
            '✓ Step 2-1: 实时鼠标坐标显示\n' +
            '✓ Step 2-2: 动态瞄准线绘制\n' +
            '✓ 炮管旋转跟随鼠标\n' +
            '✓ 瞄准状态切换\n' +
            '✓ 角度限制和距离控制',
            {
                fontFamily: 'Arial',
                fontSize: 10,
                fill: 0x2ECC71,
                align: 'left',
                lineHeight: 16
            }
        );
        featuresText.anchor.set(0, 0);
        featuresText.x = -280;
        featuresText.y = -50;
        instructionContainer.addChild(featuresText);
    }
    
   
    
    createShootingSystem() {
        // 创建发射区域容器
        const shootingArea = new PIXI.Container();
        shootingArea.y = 80;
        this.subDemoContainer.addChild(shootingArea);
        
        // 创建发射区域背景
        this.shootingArea = new PIXI.Graphics();
        this.shootingArea.beginFill(0x2C3E50, 0.3);
        this.shootingArea.lineStyle(3, 0x3498DB, 0.8);
        this.shootingArea.drawRoundedRect(-350, -200, 700, 400, 20);
        this.shootingArea.endFill();
        shootingArea.addChild(this.shootingArea);
        
        // 添加区域标签
        const areaTitle = new PIXI.Text('发射练习区域', {
            fontFamily: 'Arial',
            fontSize: 16,
            fill: 0x3498DB,
            fontWeight: 'bold'
        });
        areaTitle.anchor.set(0.5);
        areaTitle.x = 0;
        areaTitle.y = -220;
        shootingArea.addChild(areaTitle);
        
        // 创建射手
        this.createShootingShooter(shootingArea);
        
        // 创建瞄准线
        this.createShootingAimLine(shootingArea);
        
        // 创建状态显示
        this.createShootingStatus(shootingArea);
        
        // 设置发射交互
        this.setupShootingInteraction();
        
        // 初始化发射参数
        this.shootingBalls = [];
        this.isReadyToShoot = false;
        this.currentAimPosition = { x: 0, y: 0 };
        this.shootingContainer = shootingArea;
    }
    
    createShootingShooter(container) {
        // 创建射手，位于底部中心
        this.shootingShooter = new PIXI.Container();
        this.shootingShooter.x = 0;
        this.shootingShooter.y = 180; // 底部位置
        container.addChild(this.shootingShooter);
        
        // 射手底座
        const base = new PIXI.Graphics();
        base.beginFill(0x8B4513);
        base.drawRoundedRect(-30, -12, 60, 24, 12);
        base.endFill();
        
        // 射手身体
        const body = new PIXI.Graphics();
        body.beginFill(0x2E8B57);
        body.drawRoundedRect(-15, -30, 30, 22, 8);
        body.endFill();
        
        // 射手头部
        const head = new PIXI.Graphics();
        head.beginFill(0xFFDBB3);
        head.drawCircle(0, -40, 8);
        head.endFill();
        
        // 可旋转的炮管
        this.shootingCannon = new PIXI.Graphics();
        this.shootingCannon.beginFill(0x696969);
        this.shootingCannon.drawRoundedRect(-4, -35, 8, 25, 4);
        this.shootingCannon.endFill();
        
        // 当前装弹的小球
        this.loadedBall = this.createDemoBubble(0, -45, this.getRandomBubbleColor());
        this.loadedBall.scale.set(0.7);
        
        this.shootingShooter.addChild(base);
        this.shootingShooter.addChild(body);
        this.shootingShooter.addChild(head);
        this.shootingShooter.addChild(this.shootingCannon);
        this.shootingShooter.addChild(this.loadedBall);
        
        // 添加射手标签
        const shooterLabel = new PIXI.Text('射手 (装弹状态)', {
            fontFamily: 'Arial',
            fontSize: 11,
            fill: 0xFF6B6B,
            fontWeight: 'bold'
        });
        shooterLabel.anchor.set(0.5);
        shooterLabel.x = 0;
        shooterLabel.y = 20;
        this.shootingShooter.addChild(shooterLabel);
    }
    
    createShootingAimLine(container) {
        // 创建瞄准线图形
        this.shootingAimLine = new PIXI.Graphics();
        container.addChild(this.shootingAimLine);
        
        // 初始瞄准角度
        this.shootingAimAngle = -Math.PI / 2;
    }
    
    createShootingStatus(container) {
        // 创建状态显示
        this.shootingStatusText = new PIXI.Text('状态: 准备发射 - 按住鼠标瞄准', {
            fontFamily: 'Arial',
            fontSize: 14,
            fill: 0xFFFFFF,
            fontWeight: 'bold'
        });
        this.shootingStatusText.anchor.set(0.5);
        this.shootingStatusText.x = 0;
        this.shootingStatusText.y = -240;
        container.addChild(this.shootingStatusText);
        
        // 创建坐标显示
        this.shootingCoordinateText = new PIXI.Text('瞄准坐标: X:0, Y:0', {
            fontFamily: 'Arial',
            fontSize: 12,
            fill: 0x4ecdc4
        });
        this.shootingCoordinateText.anchor.set(0.5);
        this.shootingCoordinateText.x = 0;
        this.shootingCoordinateText.y = -260;
        container.addChild(this.shootingCoordinateText);
    }
    
    setupShootingInteraction() {
        // 设置发射区域为可交互
        this.shootingArea.interactive = true;
        this.shootingArea.buttonMode = true;
        
        // 鼠标移动事件
        this.shootingArea.on('pointermove', (event) => {
            const localPos = event.data.getLocalPosition(this.shootingContainer);
            
            // 更新坐标显示
            this.shootingCoordinateText.text = `瞄准坐标: X:${Math.round(localPos.x)}, Y:${Math.round(localPos.y)}`;
            
            // 如果正在瞄准，更新瞄准线
            if (this.isReadyToShoot) {
                this.currentAimPosition = { x: localPos.x, y: localPos.y };
                this.updateShootingAimLine(localPos.x, localPos.y);
                this.updateShootingCannonRotation(localPos.x, localPos.y);
            }
        });
        
        // 鼠标按下事件 - 开始瞄准
        this.shootingArea.on('pointerdown', (event) => {
            const localPos = event.data.getLocalPosition(this.shootingContainer);
            this.isReadyToShoot = true;
            this.currentAimPosition = { x: localPos.x, y: localPos.y };
            
            // 更新状态
            this.shootingStatusText.text = '状态: 瞄准中 - 松开鼠标发射';
            this.shootingStatusText.style.fill = 0xF39C12;
            
            // 立即更新瞄准线
            this.updateShootingAimLine(localPos.x, localPos.y);
            this.updateShootingCannonRotation(localPos.x, localPos.y);
        });
        
        // 鼠标抬起事件 - 发射小球
        this.shootingArea.on('pointerup', () => {
            if (this.isReadyToShoot) {
                this.fireBall();
                this.isReadyToShoot = false;
                
                // 更新状态
                this.shootingStatusText.text = '状态: 发射完成 - 按住鼠标重新瞄准';
                this.shootingStatusText.style.fill = 0x2ECC71;
                
                // 清除瞄准线
                this.shootingAimLine.clear();
                
                // 延迟重新装弹
                setTimeout(() => {
                    this.reloadBall();
                    this.shootingStatusText.text = '状态: 准备发射 - 按住鼠标瞄准';
                    this.shootingStatusText.style.fill = 0xFFFFFF;
                }, 800);
            }
        });
        
        // 鼠标离开区域
        this.shootingArea.on('pointerupoutside', () => {
            this.isReadyToShoot = false;
            this.shootingStatusText.text = '状态: 瞄准取消 - 鼠标离开区域';
            this.shootingStatusText.style.fill = 0xE74C3C;
            this.shootingAimLine.clear();
        });
    }
    
    updateShootingAimLine(targetX, targetY) {
        this.shootingAimLine.clear();
        
        // 射手位置
        const shooterX = 0;
        const shooterY = 180;
        
        // 计算瞄准方向
        const deltaX = targetX - shooterX;
        const deltaY = targetY - shooterY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        // 如果距离太小，不绘制瞄准线
        if (distance < 30) return;
        
        // 计算角度
        this.shootingAimAngle = Math.atan2(deltaY, deltaX);
        
        // 限制瞄准角度（只能向上半圆瞄准）
        const minAngle = -Math.PI; // 左侧
        const maxAngle = 0; // 右侧
        this.shootingAimAngle = Math.max(minAngle, Math.min(maxAngle, this.shootingAimAngle));
        
        // 计算瞄准线长度
        const maxLength = 250;
        const aimLength = Math.min(distance, maxLength);
        
        // 计算终点
        const endX = shooterX + Math.cos(this.shootingAimAngle) * aimLength;
        const endY = shooterY + Math.sin(this.shootingAimAngle) * aimLength;
        
        // 绘制瞄准线（虚线效果）
        this.drawDashedLine(shooterX, shooterY - 30, endX, endY, 0xFFFF00, 4);
        
        // 绘制瞄准点
        this.shootingAimLine.beginFill(0xFF6B6B, 0.8);
        this.shootingAimLine.drawCircle(endX, endY, 10);
        this.shootingAimLine.endFill();
        
        // 绘制箭头
        this.drawShootingArrow(endX, endY, this.shootingAimAngle);
        
        // 绘制目标位置十字标记
        this.shootingAimLine.lineStyle(2, 0xFF6B6B, 0.8);
        this.shootingAimLine.moveTo(targetX - 12, targetY);
        this.shootingAimLine.lineTo(targetX + 12, targetY);
        this.shootingAimLine.moveTo(targetX, targetY - 12);
        this.shootingAimLine.lineTo(targetX, targetY + 12);
        
        // 绘制目标圆圈
        this.shootingAimLine.lineStyle(2, 0xFF6B6B, 0.6);
        this.shootingAimLine.drawCircle(targetX, targetY, 15);
    }
    
    drawDashedLine(startX, startY, endX, endY, color, width) {
        // 绘制虚线效果
        const dashLength = 10;
        const gapLength = 5;
        const totalLength = Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2);
        const segments = Math.floor(totalLength / (dashLength + gapLength));
        
        const unitX = (endX - startX) / totalLength;
        const unitY = (endY - startY) / totalLength;
        
        this.shootingAimLine.lineStyle(width, color, 0.9);
        
        for (let i = 0; i < segments; i++) {
            const segmentStart = i * (dashLength + gapLength);
            const segmentEnd = segmentStart + dashLength;
            
            const x1 = startX + unitX * segmentStart;
            const y1 = startY + unitY * segmentStart;
            const x2 = startX + unitX * segmentEnd;
            const y2 = startY + unitY * segmentEnd;
            
            this.shootingAimLine.moveTo(x1, y1);
            this.shootingAimLine.lineTo(x2, y2);
        }
    }
    
    updateShootingCannonRotation(targetX, targetY) {
        // 更新炮管旋转角度
        if (this.shootingCannon) {
            const shooterX = 0;
            const shooterY = 180;
            const angle = Math.atan2(targetY - shooterY, targetX - shooterX);
            
            // 限制炮管旋转角度
            const limitedAngle = Math.max(-Math.PI, Math.min(0, angle));
            this.shootingCannon.rotation = limitedAngle + Math.PI / 2;
            
            // 同时旋转装弹的小球
            if (this.loadedBall) {
                this.loadedBall.rotation = limitedAngle + Math.PI / 2;
            }
        }
    }
    
    drawShootingArrow(endX, endY, angle) {
        // 绘制箭头
        const arrowLength = 25;
        const arrowAngle = Math.PI / 5; // 36度
        
        // 计算箭头两个边的坐标
        const leftArrowX = endX - Math.cos(angle - arrowAngle) * arrowLength;
        const leftArrowY = endY - Math.sin(angle - arrowAngle) * arrowLength;
        const rightArrowX = endX - Math.cos(angle + arrowAngle) * arrowLength;
        const rightArrowY = endY - Math.sin(angle + arrowAngle) * arrowLength;
        
        // 绘制箭头线条
        this.shootingAimLine.lineStyle(5, 0xFF6B6B, 1);
        this.shootingAimLine.moveTo(endX, endY);
        this.shootingAimLine.lineTo(leftArrowX, leftArrowY);
        this.shootingAimLine.moveTo(endX, endY);
        this.shootingAimLine.lineTo(rightArrowX, rightArrowY);
    }
    
    fireBall() {
        if (!this.loadedBall) return;
        
        // 创建发射的小球
        const ball = this.createDemoBubble(0, 150, this.loadedBall.tint || 0xFFFFFF);
        ball.scale.set(0.7);
        ball.ballColor = this.loadedBall.ballColor;
        this.shootingContainer.addChild(ball);
        this.shootingBalls.push(ball);
        
        // 计算发射速度
        const speed = 12;
        const velocityX = Math.cos(this.shootingAimAngle) * speed;
        const velocityY = Math.sin(this.shootingAimAngle) * speed;
        
        // 隐藏装弹的小球
        this.loadedBall.visible = false;
        
        // 创建发射特效
        this.createShootingEffect();
        
        // 动画发射小球
        this.animateShootingBall(ball, velocityX, velocityY);
        
        // 更新发射统计
        this.updateShootingStats();
    }
    
    createShootingEffect() {
        // 创建发射火花效果
        const sparkCount = 8;
        for (let i = 0; i < sparkCount; i++) {
            const spark = new PIXI.Graphics();
            spark.beginFill(0xFFFF00, 0.8);
            spark.drawCircle(0, 0, Math.random() * 5 + 3);
            spark.endFill();
            
            spark.x = Math.random() * 20 - 10;
            spark.y = 150 + Math.random() * 20 - 10;
            this.shootingContainer.addChild(spark);
            
            // 火花动画
            const startTime = Date.now();
            const direction = Math.random() * Math.PI * 2;
            const speed = Math.random() * 3 + 2;
            
            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = elapsed / 500;
                
                if (progress < 1) {
                    spark.x += Math.cos(direction) * speed;
                    spark.y += Math.sin(direction) * speed;
                    spark.alpha = 1 - progress;
                    spark.scale.set(1 + progress);
                    requestAnimationFrame(animate);
                } else {
                    this.shootingContainer.removeChild(spark);
                    spark.destroy();
                }
            };
            animate();
        }
    }
    
    animateShootingBall(ball, velocityX, velocityY) {
        let currentVelX = velocityX;
        let currentVelY = velocityY;
        
        const animate = () => {
            if (!ball || !ball.parent) return;
            
            // 更新位置
            ball.x += currentVelX;
            ball.y += currentVelY;
            
            // 添加重力效果
            currentVelY += 0.2;
            
            // 检查边界碰撞
            const boundaryLeft = -340;
            const boundaryRight = 340;
            const boundaryTop = -190;
            const boundaryBottom = 190;
            
            // 左右边界反弹
            if (ball.x < boundaryLeft || ball.x > boundaryRight) {
                currentVelX = -currentVelX * 0.8; // 损失一些能量
                ball.x = Math.max(boundaryLeft, Math.min(boundaryRight, ball.x));
            }
            
            // 上边界反弹
            if (ball.y < boundaryTop) {
                currentVelY = -currentVelY * 0.8;
                ball.y = boundaryTop;
            }
            
            // 下边界消失
            if (ball.y > boundaryBottom) {
                this.handleShootingBallDisappear(ball);
                return;
            }
            
            // 速度过低时停止
            if (Math.abs(currentVelX) < 0.5 && Math.abs(currentVelY) < 0.5 && ball.y > 100) {
                this.handleShootingBallDisappear(ball);
                return;
            }
            
            requestAnimationFrame(animate);
        };
        
        animate();
    }
    
    handleShootingBallDisappear(ball) {
        // 创建消失特效
        const disappearEffect = new PIXI.Graphics();
        disappearEffect.beginFill(0xFFFFFF, 0.6);
        disappearEffect.drawCircle(0, 0, 20);
        disappearEffect.endFill();
        disappearEffect.x = ball.x;
        disappearEffect.y = ball.y;
        this.shootingContainer.addChild(disappearEffect);
        
        // 消失动画
        const startTime = Date.now();
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / 400;
            
            if (progress < 1) {
                disappearEffect.scale.set(1 + progress * 2);
                disappearEffect.alpha = 0.6 - progress * 0.6;
                requestAnimationFrame(animate);
            } else {
                this.shootingContainer.removeChild(disappearEffect);
                disappearEffect.destroy();
            }
        };
        animate();
        
        // 移除小球
        this.shootingContainer.removeChild(ball);
        ball.destroy();
        
        // 从数组中移除
        const index = this.shootingBalls.indexOf(ball);
        if (index > -1) {
            this.shootingBalls.splice(index, 1);
        }
    }
    
    reloadBall() {
        // 重新装弹
        if (this.loadedBall) {
            this.loadedBall.visible = true;
            // 随机更换小球颜色
            const newColor = this.getRandomBubbleColor();
            this.loadedBall.tint = newColor;
            this.loadedBall.ballColor = newColor;
        }
    }
    
    getRandomBubbleColor() {
        const colors = [0xFF6B6B, 0x4ECDC4, 0x45B7D1, 0x96CEB4, 0xFCEAA7, 0xF38BA8, 0xA8E6CF];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    createShootingStats() {
        // 创建统计信息容器
        this.statsContainer = new PIXI.Container();
        this.statsContainer.x = -280;
        this.statsContainer.y = 150;
        this.subDemoContainer.addChild(this.statsContainer);
        
        // 统计背景
        const statsBg = new PIXI.Graphics();
        statsBg.beginFill(0x2C3E50, 0.8);
        statsBg.drawRoundedRect(0, 0, 160, 120, 10);
        statsBg.endFill();
        this.statsContainer.addChild(statsBg);
        
        // 统计标题
        const statsTitle = new PIXI.Text('发射统计', {
            fontFamily: 'Arial',
            fontSize: 14,
            fill: 0xFFFFFF,
            fontWeight: 'bold'
        });
        statsTitle.x = 10;
        statsTitle.y = 10;
        this.statsContainer.addChild(statsTitle);
        
        // 发射次数
        this.shotCountText = new PIXI.Text('发射次数: 0', {
            fontFamily: 'Arial',
            fontSize: 12,
            fill: 0x4ECDC4
        });
        this.shotCountText.x = 10;
        this.shotCountText.y = 35;
        this.statsContainer.addChild(this.shotCountText);
        
        // 当前小球数
        this.ballCountText = new PIXI.Text('场上小球: 0', {
            fontFamily: 'Arial',
            fontSize: 12,
            fill: 0x4ECDC4
        });
        this.ballCountText.x = 10;
        this.ballCountText.y = 55;
        this.statsContainer.addChild(this.ballCountText);
        
        // 最后发射角度
        this.lastAngleText = new PIXI.Text('发射角度: 0°', {
            fontFamily: 'Arial',
            fontSize: 12,
            fill: 0x4ECDC4
        });
        this.lastAngleText.x = 10;
        this.lastAngleText.y = 75;
        this.statsContainer.addChild(this.lastAngleText);
        
        // 初始化统计数据
        this.shotCount = 0;
    }
    
    updateShootingStats() {
        this.shotCount++;
        this.shotCountText.text = `发射次数: ${this.shotCount}`;
        this.ballCountText.text = `场上小球: ${this.shootingBalls.length}`;
        
        const angleDegrees = Math.round(this.shootingAimAngle * 180 / Math.PI);
        this.lastAngleText.text = `发射角度: ${angleDegrees}°`;
    }
    
    createShootingControls() {
        // 创建控制按钮容器
        const controlsContainer = new PIXI.Container();
        controlsContainer.y = 280;
        this.subDemoContainer.addChild(controlsContainer);
        
        // 清除所有小球按钮
        const clearButton = this.createControlButton('清除所有小球', -80, 0, () => {
            this.clearAllShootingBalls();
        });
        
        // 重置统计按钮
        const resetButton = this.createControlButton('重置统计', 80, 0, () => {
            this.resetShootingStats();
        });
        
        controlsContainer.addChild(clearButton);
        controlsContainer.addChild(resetButton);
        
        // 操作说明
        const instruction = new PIXI.Text(
            '操作说明: 按住鼠标左键瞄准，松开发射小球\n' +
            '特性: 重力效果、边界反弹、自动装弹',
            {
                fontFamily: 'Arial',
                fontSize: 12,
                fill: 0xBDC3C7,
                align: 'center',
                lineHeight: 16
            }
        );
        instruction.anchor.set(0.5);
        instruction.x = 0;
        instruction.y = 50;
        controlsContainer.addChild(instruction);
    }
    
    clearAllShootingBalls() {
        // 清除所有发射的小球
        this.shootingBalls.forEach(ball => {
            if (ball && ball.parent) {
                this.shootingContainer.removeChild(ball);
                ball.destroy();
            }
        });
        this.shootingBalls = [];
        this.updateShootingStats();
    }
    
    resetShootingStats() {
        // 重置统计数据
        this.shotCount = 0;
        this.shotCountText.text = '发射次数: 0';
        this.ballCountText.text = '场上小球: 0';
        this.lastAngleText.text = '发射角度: 0°';
        
        // 清除所有小球
        this.clearAllShootingBalls();
        
        // 重新装弹
        this.reloadBall();
    }
    
    // Step 2-5: 边界碰撞处理
    createStep2_5Demo() {
        // 创建子演示容器
        this.subDemoContainer = new PIXI.Container();
        this.subDemoContainer.y = -100;
        this.demoContainer.addChild(this.subDemoContainer);
        
        // 创建标题
        const title = new PIXI.Text('Step 2-5: 边界碰撞处理 + 物理系统', {
            fontFamily: 'Arial',
            fontSize: 18,
            fill: 0xFFFFFF,
            fontWeight: 'bold'
        });
        title.anchor.set(0.5);
        title.x = 0;
        title.y = -50;
        this.subDemoContainer.addChild(title);
        
        // 启用物理系统模式
        this.usePhysicsForStep2 = true;
        
        // 创建说明文本
        const description = new PIXI.Text('演示物理引擎：重力、反弹、摩擦等物理效果\n点击鼠标发射小球，观察物理反应', {
            fontFamily: 'Arial',
            fontSize: 14,
            fill: 0xBDC3C7,
            align: 'center'
        });
        description.anchor.set(0.5);
        description.x = 0;
        description.y = -20;
        this.subDemoContainer.addChild(description);
        
        // 创建物理系统边界指示
        this.createPhysicsBoundaryIndicators();
        
        // 创建射手（简化版）
        this.createPhysicsShooter();
        
        // 创建瞄准线
        this.createPhysicsAimLine();
        
        // 设置物理射击交互
        this.setupPhysicsShootingInteraction();
        
        // 创建物理控制面板
        this.createPhysicsControls();
        
        // 创建物理系统状态显示
        this.createPhysicsStatus();
        
        // 设置物理系统回调
        this.setupStep2PhysicsCallbacks();
        
        // 初始化物理射击状态
        this.physicsShootingBalls = [];
        this.physicsAimAngle = -Math.PI / 2;
        this.isPhysicsAiming = false;
    }

    // Step 4: 网格管理系统演示
    createStep4Demo() {
        // 清除之前的演示内容
        this.clearStepDemo();

        // 使用RootManager创建场景容器
        this.step4Container = window.rootManager.createSceneContainer({
            x: GAME_CONFIG.WIDTH / 2,      // 屏幕中心X
            y: GAME_CONFIG.HEIGHT / 2,     // 屏幕中心Y
            width: 500,                    // 容器宽度
            height: 600,                   // 容器高度
            title: 'Step 4: 网格管理系统',
            titleStyle: {
                fontFamily: 'Arial',
                fontSize: 16,
                fill: 0xFF0000,
                fontWeight: 'bold'
            },
            background: {
                color: 0x2C3E50,
                alpha: 0.1,
                borderColor: 0xFFFFFF,
                borderWidth: 2,
                borderRadius: 0
            }
        });

        // 将容器添加到场景
        this.addChild(this.step4Container.container);
        this.demoContainer = this.step4Container;

        // 创建网格管理器
        this.gridManager = new GridManager({
            rows: 6,                    // 6行网格
            cols: 8,                    // 8列网格
            eggRadius: 15,              // 更小的蛋半径
            startX: -140,               // 网格起始X（相对于容器中心）
            startY: -200,               // 网格起始Y（相对于容器中心）
            showGrid: true,             // 显示网格辅助线
            gridColor: 0x888888,        // 网格线颜色
            gridAlpha: 0.4              // 网格线透明度
        });

        // 在容器的addLayer中创建网格
        this.gridManager.createGridContainer(this.step4Container.addLayer);

        // 添加默认的一行小球（第0行）
        this.gridManager.addDefaultRow(0);

        // 创建控制面板
        this.createStep4Controls();

        // 显示网格统计信息
        this.updateStep4Stats();

        console.log('Step4 网格管理系统演示已创建');
    }

    // 创建Step4的控制面板
    createStep4Controls() {
        // 控制面板容器
        const controlsContainer = new PIXI.Container();
        controlsContainer.x = -220;
        controlsContainer.y = 220;
        this.step4Container.addLayer.addChild(controlsContainer);

        // 控制面板背景
        const controlsBg = new PIXI.Graphics();
        controlsBg.beginFill(0x34495E, 0.8);
        controlsBg.drawRoundedRect(0, 0, 440, 120, 8);
        controlsBg.endFill();
        controlsBg.lineStyle(2, 0x5DADE2, 0.8);
        controlsBg.drawRoundedRect(0, 0, 440, 120, 8);
        controlsContainer.addChild(controlsBg);

        // 按钮样式配置
        const buttonStyle = {
            width: 100,
            height: 30,
            fontSize: 12,
            padding: 5
        };

        let buttonX = 10;
        let buttonY = 10;

        // 添加行按钮
        const addRowBtn = this.createControlButton('添加行', buttonX, buttonY, buttonStyle);
        addRowBtn.on('pointerdown', () => {
            this.addRandomRow();
        });
        controlsContainer.addChild(addRowBtn);

        buttonX += 110;

        // 清空网格按钮
        const clearBtn = this.createControlButton('清空网格', buttonX, buttonY, buttonStyle);
        clearBtn.on('pointerdown', () => {
            this.gridManager.clearGrid();
            this.updateStep4Stats();
        });
        controlsContainer.addChild(clearBtn);

        buttonX += 110;

        // 切换网格线按钮
        const toggleGridBtn = this.createControlButton('切换网格线', buttonX, buttonY, buttonStyle);
        toggleGridBtn.on('pointerdown', () => {
            const isVisible = this.gridManager.backgroundLayer.visible;
            this.gridManager.showGridLines(!isVisible);
        });
        controlsContainer.addChild(toggleGridBtn);

        buttonX += 110;

        // 随机填充按钮
        const randomFillBtn = this.createControlButton('随机填充', buttonX, buttonY, buttonStyle);
        randomFillBtn.on('pointerdown', () => {
            this.randomFillGrid();
        });
        controlsContainer.addChild(randomFillBtn);

        // 第二行按钮
        buttonX = 10;
        buttonY = 50;

        // 添加单个小球按钮
        const addBallBtn = this.createControlButton('添加小球(0,0)', buttonX, buttonY, buttonStyle);
        addBallBtn.on('pointerdown', () => {
            this.gridManager.addBall(0, 0);
            this.updateStep4Stats();
        });
        controlsContainer.addChild(addBallBtn);

        buttonX += 110;

        // 删除小球按钮
        const removeBallBtn = this.createControlButton('删除小球(0,0)', buttonX, buttonY, buttonStyle);
        removeBallBtn.on('pointerdown', () => {
            this.gridManager.removeBall(0, 0);
            this.updateStep4Stats();
        });
        controlsContainer.addChild(removeBallBtn);

        buttonX += 110;

        // 重置网格按钮
        const resetBtn = this.createControlButton('重置演示', buttonX, buttonY, buttonStyle);
        resetBtn.on('pointerdown', () => {
            this.gridManager.clearGrid();
            this.gridManager.addDefaultRow(0);
            this.updateStep4Stats();
        });
        controlsContainer.addChild(resetBtn);

        // 创建统计显示文本
        this.step4StatsText = new PIXI.Text('网格统计信息', {
            fontFamily: 'Arial',
            fontSize: 12,
            fill: 0xFFFFFF,
            wordWrap: true,
            wordWrapWidth: 420
        });
        this.step4StatsText.x = 10;
        this.step4StatsText.y = 90;
        controlsContainer.addChild(this.step4StatsText);

        this.controlsContainer = controlsContainer;
    }

    // 创建控制按钮的辅助方法
    createControlButton(text, x, y, style) {
        const button = new PIXI.Container();
        button.x = x;
        button.y = y;
        button.interactive = true;
        button.buttonMode = true;

        // 按钮背景
        const bg = new PIXI.Graphics();
        bg.beginFill(0x3498DB, 0.8);
        bg.drawRoundedRect(0, 0, style.width, style.height, 4);
        bg.endFill();
        bg.lineStyle(1, 0x2980B9, 0.8);
        bg.drawRoundedRect(0, 0, style.width, style.height, 4);

        // 按钮文字
        const buttonText = new PIXI.Text(text, {
            fontFamily: 'Arial',
            fontSize: style.fontSize,
            fill: 0xFFFFFF,
            fontWeight: 'bold'
        });
        buttonText.anchor.set(0.5);
        buttonText.x = style.width / 2;
        buttonText.y = style.height / 2;

        button.addChild(bg);
        button.addChild(buttonText);

        // 悬停效果
        button.on('pointerover', () => {
            bg.clear();
            bg.beginFill(0x5DADE2, 0.9);
            bg.drawRoundedRect(0, 0, style.width, style.height, 4);
            bg.endFill();
            bg.lineStyle(1, 0x3498DB, 0.9);
            bg.drawRoundedRect(0, 0, style.width, style.height, 4);
        });

        button.on('pointerout', () => {
            bg.clear();
            bg.beginFill(0x3498DB, 0.8);
            bg.drawRoundedRect(0, 0, style.width, style.height, 4);
            bg.endFill();
            bg.lineStyle(1, 0x2980B9, 0.8);
            bg.drawRoundedRect(0, 0, style.width, style.height, 4);
        });

        return button;
    }

    // 添加随机行
    addRandomRow() {
        // 查找第一个空行
        let targetRow = -1;
        for (let row = 0; row < this.gridManager.config.rows; row++) {
            let hasEmptySpace = false;
            for (let col = 0; col < this.gridManager.config.cols; col++) {
                if (this.gridManager.isEmpty(row, col)) {
                    hasEmptySpace = true;
                    break;
                }
            }
            if (hasEmptySpace) {
                targetRow = row;
                break;
            }
        }

        if (targetRow === -1) {
            console.log('网格已满，无法添加更多行');
            return;
        }

        // 在目标行添加小球
        this.gridManager.addDefaultRow(targetRow);
        this.updateStep4Stats();
    }

    // 随机填充网格
    randomFillGrid() {
        const fillPercent = 0.6; // 60%填充率
        
        for (let row = 0; row < this.gridManager.config.rows; row++) {
            for (let col = 0; col < this.gridManager.config.cols; col++) {
                if (this.gridManager.isEmpty(row, col) && Math.random() < fillPercent) {
                    this.gridManager.addBall(row, col);
                }
            }
        }
        
        this.updateStep4Stats();
    }

    // 更新Step4统计信息
    updateStep4Stats() {
        if (!this.step4StatsText) return;

        const stats = this.gridManager.getGridStats();
        
        this.step4StatsText.text = `网格统计: 总位置${stats.totalSpaces} | 已占用${stats.totalBalls} | 空位${stats.emptySpaces} | 填充率${Math.round(stats.totalBalls / stats.totalSpaces * 100)}%`;
    }

    // Step 2-5 物理系统相关方法
    createPhysicsBoundaryIndicators() {
        // 创建物理边界指示器
        this.physicsBoundaryContainer = new PIXI.Container();
        this.physicsBoundaryContainer.y = 80;
        this.subDemoContainer.addChild(this.physicsBoundaryContainer);
        
        const boundary = new PIXI.Graphics();
        boundary.lineStyle(3, 0x00FF00, 0.8);
        
        // 绘制物理边界框
        const left = -300;
        const right = 300;
        const top = -300;
        const bottom = 150;
        
        boundary.drawRect(left, top, right - left, bottom - top);
        
        // 添加角落标记
        const cornerRadius = 8;
        boundary.beginFill(0x00FF00, 0.8);
        boundary.drawCircle(left, top, cornerRadius);
        boundary.drawCircle(right, top, cornerRadius);
        boundary.drawCircle(left, bottom, cornerRadius);
        boundary.drawCircle(right, bottom, cornerRadius);
        boundary.endFill();
        
        this.physicsBoundaryContainer.addChild(boundary);
        
        // 添加边界说明
        const boundaryLabel = new PIXI.Text('物理边界\n绿色区域内有重力、反弹等物理效果', {
            fontFamily: 'Arial',
            fontSize: 12,
            fill: 0x00FF00,
            align: 'center'
        });
        boundaryLabel.anchor.set(0.5);
        boundaryLabel.x = 0;
        boundaryLabel.y = top - 30;
        this.physicsBoundaryContainer.addChild(boundaryLabel);
    }

    createPhysicsShooter() {
        // 创建物理射手
        this.physicsShooter = new PIXI.Container();
        this.physicsShooter.y = 200;
        this.subDemoContainer.addChild(this.physicsShooter);
        
        // 射手底座
        const base = new PIXI.Graphics();
        base.beginFill(0x8B4513);
        base.drawRoundedRect(-25, -8, 50, 16, 8);
        base.endFill();
        
        // 射手身体
        const body = new PIXI.Graphics();
        body.beginFill(0x2E8B57);
        body.drawRoundedRect(-12, -25, 24, 18, 5);
        body.endFill();
        
        // 可旋转的炮管
        this.physicsCannon = new PIXI.Graphics();
        this.physicsCannon.beginFill(0x696969);
        this.physicsCannon.drawRoundedRect(-3, -30, 6, 20, 3);
        this.physicsCannon.endFill();
        
        this.physicsShooter.addChild(base);
        this.physicsShooter.addChild(body);
        this.physicsShooter.addChild(this.physicsCannon);
        
        // 添加射手标签
        const shooterLabel = new PIXI.Text('物理射手', {
            fontFamily: 'Arial',
            fontSize: 12,
            fill: 0x00FF00,
            fontWeight: 'bold'
        });
        shooterLabel.anchor.set(0.5);
        shooterLabel.x = 0;
        shooterLabel.y = 15;
        this.physicsShooter.addChild(shooterLabel);
    }

    createPhysicsAimLine() {
        // 创建物理瞄准线
        this.physicsAimLine = new PIXI.Graphics();
        this.subDemoContainer.addChild(this.physicsAimLine);
        
        // 初始瞄准角度
        this.physicsAimAngle = -Math.PI / 2;
        this.updatePhysicsAimLine(0, 50);
    }

    updatePhysicsAimLine(targetX, targetY) {
        this.physicsAimLine.clear();
        
        // 射手位置
        const shooterX = 0;
        const shooterY = 200;
        
        // 计算瞄准方向
        const deltaX = targetX - shooterX;
        const deltaY = targetY - shooterY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        if (distance > 20) {
            // 计算角度
            this.physicsAimAngle = Math.atan2(deltaY, deltaX);
            
            // 限制瞄准角度（只能向上半圆瞄准）
            const minAngle = -Math.PI * 0.95;
            const maxAngle = -Math.PI * 0.05;
            this.physicsAimAngle = Math.max(minAngle, Math.min(maxAngle, this.physicsAimAngle));
        }
        
        // 计算瞄准线长度
        const maxLength = 120;
        const aimLength = Math.min(distance, maxLength);
        
        // 计算终点
        const endX = shooterX + Math.cos(this.physicsAimAngle) * aimLength;
        const endY = shooterY + Math.sin(this.physicsAimAngle) * aimLength;
        
        // 绘制瞄准线
        this.physicsAimLine.lineStyle(4, 0x00FF00, 0.9);
        this.physicsAimLine.moveTo(shooterX, shooterY - 20);
        this.physicsAimLine.lineTo(endX, endY);
        
        // 绘制瞄准点
        this.physicsAimLine.beginFill(0xFFFF00, 0.8);
        this.physicsAimLine.drawCircle(endX, endY, 8);
        this.physicsAimLine.endFill();
        
        // 旋转炮管
        if (this.physicsCannon) {
            this.physicsCannon.rotation = this.physicsAimAngle + Math.PI / 2;
        }
    }

    setupPhysicsShootingInteraction() {
        // 设置物理射击区域为可交互
        this.subDemoContainer.interactive = true;
        
        // 鼠标移动事件
        this.subDemoContainer.on('pointermove', (event) => {
            const localPos = event.data.getLocalPosition(this.subDemoContainer);
            
            // 更新坐标显示
            if (this.physicsCoordinateText) {
                this.physicsCoordinateText.text = `瞄准坐标: X:${Math.round(localPos.x)}, Y:${Math.round(localPos.y)}`;
            }
            
            // 如果正在瞄准，更新瞄准线
            if (this.isPhysicsAiming) {
                this.updatePhysicsAimLine(localPos.x, localPos.y);
            }
        });
        
        // 鼠标按下事件
        this.subDemoContainer.on('pointerdown', (event) => {
            const localPos = event.data.getLocalPosition(this.subDemoContainer);
            this.isPhysicsAiming = true;
            
            // 更新状态
            if (this.physicsStatusText) {
                this.physicsStatusText.text = '状态: 瞄准中 - 松开鼠标发射物理小球';
                this.physicsStatusText.style.fill = 0xF39C12;
            }
            
            // 立即更新瞄准线
            this.updatePhysicsAimLine(localPos.x, localPos.y);
        });
        
        // 鼠标抬起事件
        this.subDemoContainer.on('pointerup', () => {
            if (this.isPhysicsAiming) {
                this.firePhysicsBall();
                this.isPhysicsAiming = false;
                
                // 更新状态
                if (this.physicsStatusText) {
                    this.physicsStatusText.text = '状态: 发射完成 - 观察物理效果';
                    this.physicsStatusText.style.fill = 0x2ECC71;
                }
            }
        });
    }

    firePhysicsBall() {
        // 创建发射的物理小球
        const ball = this.createDemoBubble(0, 200, 0x00FF88);
        ball.scale.set(0.8);
        this.subDemoContainer.addChild(ball);
        this.physicsShootingBalls.push(ball);
        
        // 计算发射速度
        const speed = 10;
        const velocityX = Math.cos(this.physicsAimAngle) * speed;
        const velocityY = Math.sin(this.physicsAimAngle) * speed;
        
        // 设置物理系统边界（相对于subDemoContainer）
        window.physicsManager.setBounds(-300, 300, -380, 230);
        
        // 使用物理系统发射
        const projectileId = window.physicsManager.addProjectile({
            projectile: ball,
            velocity: { x: velocityX, y: velocityY },
            power: 1,
            physics: {
                gravity: 0.3,        // 明显的重力效果
                friction: 0.99,      // 轻微空气阻力
                bounceX: 0.8,        // 水平反弹系数
                bounceY: 0.7,        // 垂直反弹系数
                enableBounce: true   // 启用边界反弹
            }
        });
        
        // 存储发射物ID
        if (!this.physicsProjectiles) this.physicsProjectiles = [];
        this.physicsProjectiles.push({ id: projectileId, object: ball });
        
        // 更新统计
        if (this.physicsStatsText) {
            this.physicsStatsText.text = `发射物数量: ${this.physicsShootingBalls.length}`;
        }
    }

    createPhysicsControls() {
        // 创建物理控制面板
        const controlsContainer = new PIXI.Container();
        controlsContainer.y = 280;
        this.subDemoContainer.addChild(controlsContainer);
        
        // 清除所有物理小球按钮
        const clearButton = this.createControlButton('清除所有小球', -100, 0, () => {
            this.clearAllPhysicsProjectiles();
        });
        
        // 切换物理模式按钮
        const togglePhysicsButton = this.createControlButton('切换物理模式', 100, 0, () => {
            this.togglePhysicsMode();
        });
        
        controlsContainer.addChild(clearButton);
        controlsContainer.addChild(togglePhysicsButton);
        
        // 操作说明
        const instruction = new PIXI.Text(
            '操作说明: 按住鼠标瞄准，松开发射小球\n' +
            '物理效果: 重力下降、边界反弹、摩擦减速',
            {
                fontFamily: 'Arial',
                fontSize: 12,
                fill: 0xBDC3C7,
                align: 'center',
                lineHeight: 16
            }
        );
        instruction.anchor.set(0.5);
        instruction.x = 0;
        instruction.y = 50;
        controlsContainer.addChild(instruction);
    }

    createPhysicsStatus() {
        // 创建物理状态显示
        this.physicsStatusText = new PIXI.Text('状态: 准备发射 - 按住鼠标瞄准', {
            fontFamily: 'Arial',
            fontSize: 14,
            fill: 0xFFFFFF,
            fontWeight: 'bold'
        });
        this.physicsStatusText.anchor.set(0.5);
        this.physicsStatusText.x = 0;
        this.physicsStatusText.y = 40;
        this.subDemoContainer.addChild(this.physicsStatusText);
        
        // 创建坐标显示
        this.physicsCoordinateText = new PIXI.Text('瞄准坐标: X:0, Y:0', {
            fontFamily: 'Arial',
            fontSize: 12,
            fill: 0x4ECDC4
        });
        this.physicsCoordinateText.anchor.set(0.5);
        this.physicsCoordinateText.x = 0;
        this.physicsCoordinateText.y = 60;
        this.subDemoContainer.addChild(this.physicsCoordinateText);
        
        // 创建统计显示
        this.physicsStatsText = new PIXI.Text('发射物数量: 0', {
            fontFamily: 'Arial',
            fontSize: 12,
            fill: 0xF39C12
        });
        this.physicsStatsText.anchor.set(0.5);
        this.physicsStatsText.x = 0;
        this.physicsStatsText.y = 80;
        this.subDemoContainer.addChild(this.physicsStatsText);
    }

    clearAllPhysicsProjectiles() {
        // 清除所有物理发射物
        if (this.physicsProjectiles) {
            this.physicsProjectiles.forEach(projectile => {
                window.physicsManager.removeProjectile(projectile.id);
            });
            this.physicsProjectiles = [];
        }
        
        // 清除显示对象
        this.physicsShootingBalls.forEach(ball => {
            if (ball && ball.parent) {
                this.subDemoContainer.removeChild(ball);
                ball.destroy();
            }
        });
        this.physicsShootingBalls = [];
        
        // 更新统计
        if (this.physicsStatsText) {
            this.physicsStatsText.text = '发射物数量: 0';
        }
        
        // 更新状态
        if (this.physicsStatusText) {
            this.physicsStatusText.text = '状态: 已清除 - 准备发射';
            this.physicsStatusText.style.fill = 0xFFFFFF;
        }
    }

    togglePhysicsMode() {
        // 切换物理模式（在物理系统和传统动画之间切换）
        this.usePhysicsForStep2 = !this.usePhysicsForStep2;
        
        if (this.physicsStatusText) {
            const mode = this.usePhysicsForStep2 ? '物理引擎模式' : '传统动画模式';
            this.physicsStatusText.text = `状态: 已切换到${mode}`;
            this.physicsStatusText.style.fill = 0x3498DB;
        }
        
        // 延迟恢复状态文本
        setTimeout(() => {
            if (this.physicsStatusText) {
                this.physicsStatusText.text = '状态: 准备发射 - 按住鼠标瞄准';
                this.physicsStatusText.style.fill = 0xFFFFFF;
            }
        }, 2000);
    }

    setupStep2PhysicsCallbacks() {
        // 为Step 2设置专门的物理系统回调
        window.physicsManager.setCallback('onBoundaryCollision', (projectileData, boundaries) => {
            // 边界碰撞时的特效
            if (projectileData.projectile && projectileData.projectile.parent) {
                this.createPhysicsBounceEffect(
                    projectileData.projectile.x,
                    projectileData.projectile.y,
                    boundaries
                );
            }
        });

        window.physicsManager.setCallback('onProjectileStop', (projectileData, reason) => {
            console.log(`物理发射物 ${projectileData.id} 停止, 原因: ${reason}`);
            
            // 从发射物数组中移除
            if (this.physicsProjectiles) {
                const index = this.physicsProjectiles.findIndex(p => p.id === projectileData.id);
                if (index !== -1) {
                    this.physicsProjectiles.splice(index, 1);
                }
            }
            
            // 从显示数组中移除
            if (this.physicsShootingBalls && projectileData.projectile) {
                const ballIndex = this.physicsShootingBalls.indexOf(projectileData.projectile);
                if (ballIndex !== -1) {
                    this.physicsShootingBalls.splice(ballIndex, 1);
                }
            }
            
            // 更新统计
            if (this.physicsStatsText) {
                this.physicsStatsText.text = `发射物数量: ${this.physicsShootingBalls.length}`;
            }
        });

        window.physicsManager.setCallback('onProjectileDestroy', (projectileData) => {
            // 发射物销毁时从显示容器中移除
            if (projectileData.projectile && projectileData.projectile.parent) {
                projectileData.projectile.parent.removeChild(projectileData.projectile);
                projectileData.projectile.destroy();
            }
        });
    }

    createPhysicsBounceEffect(x, y, boundaries) {
        // 创建边界反弹特效
        const effect = new PIXI.Graphics();
        
        // 根据碰撞的边界类型选择颜色和形状
        if (boundaries.left || boundaries.right) {
            effect.beginFill(0x00FF00, 0.8);
            effect.drawRect(-2, -15, 4, 30);
        } else if (boundaries.top || boundaries.bottom) {
            effect.beginFill(0x00FF00, 0.8);
            effect.drawRect(-15, -2, 30, 4);
        }
        
        effect.endFill();
        effect.x = x;
        effect.y = y;
        this.subDemoContainer.addChild(effect);
        
        // 反弹动画
        const startTime = Date.now();
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / 300;
            
            if (progress < 1) {
                effect.alpha = 0.8 - progress * 0.8;
                effect.scale.set(1 + progress * 0.5);
                requestAnimationFrame(animate);
            } else {
                this.subDemoContainer.removeChild(effect);
                effect.destroy();
            }
        };
        animate();
    }
}