/**
 * Step1 测试模块 - 泡泡网格初始化
 */
class Step1TestModule extends BaseTestModule {
    constructor(container, config = {}) {
        super(container, config);
        this.step1Container = null;
    }

    async init() {
        // 创建模块容器
        this.moduleContainer = new PIXI.Container();
        
        // 创建 Step1 演示
        this.createStep1Demo();
        
        this.isLoaded = true;
        console.log('Step1 测试模块初始化完成');
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
        
        // 将容器添加到模块容器中
        this.moduleContainer.addChild(this.step1Container.container);
        this.addResource(this.step1Container);
        
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
                    true,
                    0
                );
                
                // 添加到对象层（无动画）
                this.step1Container.addChild(egg);
                this.addResource(egg);
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
        this.step1Container.addChild(eggLabel);
        this.addResource(eggLabel);
        
        // 添加控制按钮
        this.createControls();
    }

    createControls() {
        const controlsContainer = new PIXI.Container();
        controlsContainer.y = 250;
        this.step1Container.addChild(controlsContainer);
        this.addResource(controlsContainer);

        // 重新生成按钮
        const regenerateButton = this.createControlButton('重新生成', -80, 0, () => {
            this.regenerateEggs();
        });

        // 切换颜色模式按钮
        const colorModeButton = this.createControlButton('切换颜色', 80, 0, () => {
            this.toggleColorMode();
        });

        controlsContainer.addChild(regenerateButton);
        controlsContainer.addChild(colorModeButton);

        // 添加说明文字
        const instructionText = new PIXI.Text(
            'Step1 功能演示:\n' +
            '• 4行6列蛋形网格布局\n' +
            '• 六边形网格效果（偶数行偏移）\n' +
            '• 支持重新生成和颜色切换',
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
        instructionText.y = 50;
        controlsContainer.addChild(instructionText);
        this.addResource(instructionText);
    }

    regenerateEggs() {
        // 清除现有的蛋形元素
        if (this.step1Container) {
            // 移除所有蛋形元素（保留标题和说明）
            const children = this.step1Container.children.slice();
            children.forEach(child => {
                if (child.isEgg) { // 假设我们给蛋形元素标记了这个属性
                    this.step1Container.removeChild(child);
                    child.destroy();
                }
            });
        }
        
        // 重新创建蛋形元素
        this.createTestEggs();
    }

    toggleColorMode() {
        // 这里可以实现颜色模式切换逻辑
        console.log('切换颜色模式');
    }

    getInfo() {
        return {
            name: 'Step1TestModule',
            description: '泡泡网格初始化测试',
            version: '1.0.0'
        };
    }
}

// 暴露到全局
window.Step1TestModule = Step1TestModule;
