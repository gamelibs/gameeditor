/**
 * Step2 测试模块 - 发射小球机制（完整恢复原始实现）
 */
class Step2TestModule extends BaseTestModule {
    constructor(container, config = {}) {
        super(container, config);
        
        // Step2 专用状态
        this.currentSubStep = '2-1';
        this.subStepButtons = [];
        this.subDemoContainer = null;
        
        // 发射相关状态
        this.isSimpleDemo = false;
        this.usePhysicsForStep2 = false;
        this.simpleProjectiles = [];
        this.shootingBalls = [];
        this.isSimpleAnimating = false;
        
        // 各种组件引用
        this.simpleShooter = null;
        this.simpleCannon = null;
        this.shootingBall = null;
        this.simpleAimLine = null;
        this.coordinateText = null;
        this.boundaryContainer = null;
        this.simpleAimAngle = -Math.PI / 2;
        
        // Step 2-1 拖拽相关
        this.dragArea = null;
        this.dragIndicator = null;
        this.dragCoordinateText = null;
        this.dragStatusText = null;
        this.isDragging = false;
        
        // Step 2-3 交互瞄准相关
        this.interactiveArea = null;
        this.interactiveShooter = null;
        this.interactiveCannon = null;
        this.interactiveAimLine = null;
        this.interactiveCoordinateText = null;
        this.interactiveStatusText = null;
        this.aimingAreaContainer = null;
        this.currentAimAngle = -Math.PI / 2;
        this.isAiming = false;
    }

    async init() {
        // 创建模块容器
        this.moduleContainer = new PIXI.Container();
        this.moduleContainer.x = GAME_CONFIG.WIDTH / 2;
        this.moduleContainer.y = GAME_CONFIG.HEIGHT / 2;
        
        // 初始化物理系统状态（默认关闭，在Step2-5中开启）
        this.usePhysicsForStep2 = false;
        this.simpleProjectiles = [];
        
        // 创建子步骤导航
        this.createStep2SubNavigation();
        
        this.isLoaded = true;
        console.log('Step2 测试模块初始化完成');
    }

    createStep2SubNavigation() {
        // 子步骤导航容器
        this.subNavContainer = new PIXI.Container();
        this.subNavContainer.y = -200;
        this.moduleContainer.addChild(this.subNavContainer);
        this.addResource(this.subNavContainer);
        
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
        
        this.addEventHandler(button, 'pointerdown', () => {
            this.setActiveSubStep(stepKey);
        });
        
        this.addEventHandler(button, 'pointerover', () => {
            if (this.currentSubStep !== stepKey) {
                this.drawSubButton(bg, width, height, 0x34495E, 0x5DADE2);
            }
        });
        
        this.addEventHandler(button, 'pointerout', () => {
            if (this.currentSubStep !== stepKey) {
                this.drawSubButton(bg, width, height, 0x34495E, 0xFFFFFF);
            }
        });
        
        // 初始绘制
        this.drawSubButton(bg, width, height, 0x34495E, 0xFFFFFF);
        
        button.stepKey = stepKey;
        button.width = width;
        button.height = height;
        
        this.addResource(button);
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
                    this.drawSubButton(button.bg, button.width, button.height, 0x2980B9, 0xF39C12);
                } else {
                    this.drawSubButton(button.bg, button.width, button.height, 0x34495E, 0xFFFFFF);
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
            this.moduleContainer.removeChild(this.subDemoContainer);
            this.subDemoContainer.destroy();
            this.subDemoContainer = null;
        }
        
        // 重置演示状态
        this.isSimpleDemo = false;
        this.isDragging = false;
        this.isAiming = false;
        this.shootingBalls = [];
    }

    // Step 2-1: 鼠标按下移动坐标显示
    createStep2_1Demo() {
        // 创建子演示容器
        this.subDemoContainer = new PIXI.Container();
        this.subDemoContainer.y = -100;
        this.moduleContainer.addChild(this.subDemoContainer);
        this.addResource(this.subDemoContainer);
        
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
        this.addEventHandler(this.dragArea, 'pointerdown', (event) => {
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
        this.addEventHandler(this.dragArea, 'pointermove', (event) => {
            if (this.isDragging) {
                const localPos = event.data.getLocalPosition(this.dragArea);
                this.updateDragCoordinates(localPos.x, localPos.y);
                this.dragIndicator.x = localPos.x;
                this.dragIndicator.y = localPos.y + 100;
            }
        });
        
        // 鼠标抬起事件
        this.addEventHandler(this.dragArea, 'pointerup', () => {
            this.isDragging = false;
            this.dragIndicator.visible = false;
            this.dragStatusText.text = '状态: 未按下';
            this.dragStatusText.style.fill = 0xFFFFFF;
        });
        
        // 鼠标离开区域时也停止拖拽
        this.addEventHandler(this.dragArea, 'pointerupoutside', () => {
            this.isDragging = false;
            this.dragIndicator.visible = false;
            this.dragStatusText.text = '状态: 离开区域';
            this.dragStatusText.style.fill = 0xE74C3C;
        });
        
        // 鼠标进入区域
        this.addEventHandler(this.dragArea, 'pointerover', () => {
            if (!this.isDragging) {
                this.dragStatusText.text = '状态: 悬停中';
                this.dragStatusText.style.fill = 0xF39C12;
            }
        });
        
        // 鼠标离开区域
        this.addEventHandler(this.dragArea, 'pointerout', () => {
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
        this.moduleContainer.addChild(this.subDemoContainer);
        this.addResource(this.subDemoContainer);
        
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
        // 创建演示区域容器
        const aimContainer = new PIXI.Container();
        aimContainer.y = 60; // 调整位置
        this.subDemoContainer.addChild(aimContainer);
        
        // 先绘制canvas四角坐标标识
        this.drawCanvasCorners(aimContainer);
        
        // 在演示区域底部中心设置射击位置
        const demoHeight = 300;
        const canvasBottom = demoHeight / 2 - 50; // 演示区域底部位置
        const shootingPosition = { x: 0, y: canvasBottom }; // 演示区域底部中心
        const aimAngle = -Math.PI / 3; // 瞄准角度（-60度）
        const aimLength = 80; // 瞄准线长度，适配演示区域
        
        // 创建射击起点
        const startPoint = new PIXI.Graphics();
        startPoint.beginFill(0xFF6B6B);
        startPoint.drawCircle(shootingPosition.x, shootingPosition.y, 8);
        startPoint.endFill();
        aimContainer.addChild(startPoint);
        
        // 添加起点标签
        const startLabel = new PIXI.Text('射击起点 (演示区域底部)', {
            fontFamily: 'Arial',
            fontSize: 11,
            fill: 0xFF6B6B
        });
        startLabel.anchor.set(0.5);
        startLabel.x = shootingPosition.x;
        startLabel.y = shootingPosition.y + 20;
        aimContainer.addChild(startLabel);
        
        // 绘制瞄准线
        const aimLine = new PIXI.Graphics();
        this.drawAimLineFromBottom(aimLine, shootingPosition, aimAngle, 0xFFFF00, aimLength);
        aimContainer.addChild(aimLine);
        
        // 添加配置参数说明
        const configText = new PIXI.Text(
            '瞄准线配置:\n' +
            `• 起点: (${shootingPosition.x}, ${shootingPosition.y})\n` +
            `• 角度: ${Math.round(aimAngle * 180 / Math.PI)}°\n` +
            `• 长度: ${aimLength}px\n\n` +
            '实际Canvas尺寸:\n' +
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
        configText.x = -200;
        configText.y = -120;
        aimContainer.addChild(configText);
        
        // 添加瞄准线说明
        const aimDescription = new PIXI.Text('从演示区域底部发出的瞄准线', {
            fontFamily: 'Arial',
            fontSize: 11,
            fill: 0xFFFF00
        });
        aimDescription.anchor.set(0.5);
        aimDescription.x = 0;
        aimDescription.y = canvasBottom + 35;
        aimContainer.addChild(aimDescription);
    }

    drawCanvasCorners(container) {
        // 限定演示区域尺寸，避免过大
        const demoWidth = 400;  // 演示区域宽度
        const demoHeight = 300; // 演示区域高度
        const halfWidth = demoWidth / 2;
        const halfHeight = demoHeight / 2;
        const adjustY = -50; // 调整Y位置使其在演示容器中合适显示
        
        // 计算缩放比例用于显示实际坐标
        const scaleX = GAME_CONFIG.WIDTH / demoWidth;
        const scaleY = GAME_CONFIG.HEIGHT / demoHeight;
        
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
        boundary.drawRect(-halfWidth, -halfHeight + adjustY, demoWidth, demoHeight);
        container.addChild(boundary);
        
        // 添加canvas标题
        const canvasTitle = new PIXI.Text(`Canvas演示区域 (缩放显示)`, {
            fontFamily: 'Arial',
            fontSize: 14,
            fill: 0xFFFFFF,
            fontWeight: 'bold'
        });
        canvasTitle.anchor.set(0.5);
        canvasTitle.x = 0;
        canvasTitle.y = -halfHeight + adjustY - 25;
        container.addChild(canvasTitle);
        
        // 添加缩放说明
        const scaleInfo = new PIXI.Text(
            `实际Canvas尺寸: ${GAME_CONFIG.WIDTH} x ${GAME_CONFIG.HEIGHT}\n` +
            `演示区域尺寸: ${demoWidth} x ${demoHeight}\n` +
            `缩放比例: ${scaleX.toFixed(1)}x (宽) / ${scaleY.toFixed(1)}x (高)`,
            {
                fontFamily: 'Arial',
                fontSize: 10,
                fill: 0xBDC3C7,
                align: 'center'
            }
        );
        scaleInfo.anchor.set(0.5);
        scaleInfo.x = 0;
        scaleInfo.y = halfHeight + adjustY + 40;
        container.addChild(scaleInfo);
        
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
        this.moduleContainer.addChild(this.subDemoContainer);
        this.addResource(this.subDemoContainer);
        
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
        this.addEventHandler(this.interactiveArea, 'pointermove', (event) => {
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
        this.addEventHandler(this.interactiveArea, 'pointerdown', (event) => {
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
        this.addEventHandler(this.interactiveArea, 'pointerup', () => {
            this.isAiming = false;
            this.interactiveStatusText.text = '状态: 停止瞄准 - 按下鼠标重新开始';
            this.interactiveStatusText.style.fill = 0xFFFFFF;
        });
        
        // 鼠标离开区域
        this.addEventHandler(this.interactiveArea, 'pointerupoutside', () => {
            this.isAiming = false;
            this.interactiveStatusText.text = '状态: 鼠标离开区域';
            this.interactiveStatusText.style.fill = 0xE74C3C;
        });
        
        // 鼠标进入区域
        this.addEventHandler(this.interactiveArea, 'pointerover', () => {
            if (!this.isAiming) {
                this.interactiveStatusText.text = '状态: 鼠标悬停 - 按下开始瞄准';
                this.interactiveStatusText.style.fill = 0xF39C12;
            }
        });
        
        // 鼠标离开区域
        this.addEventHandler(this.interactiveArea, 'pointerout', () => {
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
        
        // 绘制目标位置十字标记
        this.interactiveAimLine.lineStyle(2, this.isAiming ? 0xFF6B6B : 0xFFFF00, 0.8);
        this.interactiveAimLine.moveTo(targetX - 12, targetY);
        this.interactiveAimLine.lineTo(targetX + 12, targetY);
        this.interactiveAimLine.moveTo(targetX, targetY - 12);
        this.interactiveAimLine.lineTo(targetX, targetY + 12);
        
        // 绘制目标圆圈
        this.interactiveAimLine.lineStyle(2, this.isAiming ? 0xFF6B6B : 0xFFFF00, 0.6);
        this.interactiveAimLine.drawCircle(targetX, targetY, 15);
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
        // 计算箭头参数
        const arrowLength = 12;
        const arrowAngle = Math.PI / 6; // 30度
        const unitX = Math.cos(angle);
        const unitY = Math.sin(angle);
        
        // 计算箭头两个边的坐标
        const leftArrowX = endX - (unitX * Math.cos(arrowAngle) - unitY * Math.sin(arrowAngle)) * arrowLength;
        const leftArrowY = endY - (unitY * Math.cos(arrowAngle) + unitX * Math.sin(arrowAngle)) * arrowLength;
        
        const rightArrowX = endX - (unitX * Math.cos(-arrowAngle) - unitY * Math.sin(-arrowAngle)) * arrowLength;
        const rightArrowY = endY - (unitY * Math.cos(-arrowAngle) + unitX * Math.sin(-arrowAngle)) * arrowLength;
        
        // 绘制箭头
        this.interactiveAimLine.lineStyle(3, this.isAiming ? 0xFF6B6B : 0xFFFF00, 0.9);
        this.interactiveAimLine.moveTo(endX, endY);
        this.interactiveAimLine.lineTo(leftArrowX, leftArrowY);
        this.interactiveAimLine.moveTo(endX, endY);
        this.interactiveAimLine.lineTo(rightArrowX, rightArrowY);
    }

    createInteractiveInstructions() {
        // 创建操作说明
        const instructionText = new PIXI.Text(
            '操作说明:\n' +
            '• 移动鼠标查看坐标变化\n' +
            '• 按住鼠标左键开始瞄准\n' +
            '• 移动鼠标调整瞄准方向\n' +
            '• 松开鼠标停止瞄准\n' +
            '• 炮管会跟随鼠标旋转',
            {
                fontFamily: 'Arial',
                fontSize: 11,
                fill: 0xBDC3C7,
                align: 'left',
                lineHeight: 16
            }
        );
        instructionText.anchor.set(0.5);
        instructionText.x = 0;
        instructionText.y = 280;
        this.subDemoContainer.addChild(instructionText);
    }

    getInfo() {
        return {
            name: 'Step2TestModule',
            description: '发射小球机制测试 - 包含原始的拖拽、瞄准线和交互瞄准功能',
            version: '1.0.0'
        };
    }
}

// 暴露到全局
window.Step2TestModule = Step2TestModule;
