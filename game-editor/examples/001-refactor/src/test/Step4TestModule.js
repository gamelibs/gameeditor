/**
 * Step4 测试模块 - 碰撞检测
 */
class Step4TestModule extends BaseTestModule {
    constructor(container, config = {}) {
        super(container, config);
        
        // Step4 专用状态
        this.step4Container = null;
        this.gridManager = null;
        this.controlsContainer = null;
        this.step4StatsText = null;
        
        // 统一发射器
        this.shooter = null;
        this.shootingBalls = [];
        
        // 状态文本
        this.statusText = null;
        this.coordinateText = null;
    }

    async init() {
        // 创建模块容器
        this.moduleContainer = new PIXI.Container();
        this.moduleContainer.x = GAME_CONFIG.WIDTH / 2;
        this.moduleContainer.y = GAME_CONFIG.HEIGHT / 2;
        
        // 创建 Step4 演示
        this.createStep4Demo();
        
        this.isLoaded = true;
        console.log('Step4 测试模块初始化完成');
    }

    createStep4Demo() {
        // 使用RootManager创建标准化的场景容器
        this.step4Container = window.rootManager.createSceneContainer({
            x: 0,
            y: 0,
            width: 600,
            height: 700,
            title: 'Step4: 网格管理系统',
            titleStyle: {
                fontFamily: 'Arial',
                fontSize: 18,
                fill: 0xFF0000,
                fontWeight: 'bold'
            },
            background: {
                color: 0x2C3E50,
                alpha: 0.15,
                borderColor: 0xFFFFFF,
                borderWidth: 3,
                borderRadius: 0
            }
        });
        
        this.moduleContainer.addChild(this.step4Container.container);
        this.addResource(this.step4Container);

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
        
        // 使用RootManager的统一发射器系统
        this.createUnifiedShooter();
        
        // 创建控制面板
        this.createStep4Controls();
        
        // 创建状态显示
        this.createStep4Status();

        console.log('Step4 网格管理系统演示已创建');
    }

    createUnifiedShooter() {
        // 使用RootManager创建标准化发射器
        const shooterConfig = {
            x: 0,
            y: 250,
            power: 1.0,
            containerSize: { width: 600, height: 700 }, // 传递容器大小，让发射器自动计算距离
            customProjectile: {
                eggColor: 0x45B7D1,
                eggWidth: 32,
                eggHeight: 40,
                hasHighlight: true,
                radius: 16
            },
            physics: {
                usePhysics: true,
                params: {
                    gravity: 0.1,      // 减少重力，从0.2降到0.1
                    friction: 0.995,   // 减少摩擦力，从0.98提高到0.995
                    bounceX: 0.9,      // 提高弹性，从0.8提高到0.9
                    bounceY: 0.8,      // 提高弹性，从0.6提高到0.8
                    enableBounce: true
                }
            },
            onAim: (angle, targetX, targetY, power) => {
                // 更新状态显示
                if (this.statusText) {
                    this.statusText.text = `状态: 瞄准中 - 角度:${Math.round(angle * 180 / Math.PI)}° 力度:${Math.round(power * 100)}%`;
                    this.statusText.style.fill = 0xF39C12;
                }
                if (this.coordinateText) {
                    this.coordinateText.text = `瞄准坐标: X:${Math.round(targetX)}, Y:${Math.round(targetY)}`;
                }
            },
            onShoot: (projectile, velocity, power, physicsConfig) => {
                // 将发射物添加到场景中
                this.step4Container.addLayer.addChild(projectile);
                
                // 使用物理系统处理发射物运动
                if (physicsConfig.usePhysics && window.physicsManager) {
                    // 设置物理系统边界（根据容器大小）
                    // 容器大小为 600x700，所以边界为 -300到300，-350到350
                    window.physicsManager.setBounds(-300, 300, -350, 350);
                    
                    // 添加到物理系统
                    const projectileId = window.physicsManager.addProjectile({
                        projectile: projectile,
                        velocity: velocity,
                        power: power,
                        physics: physicsConfig.params
                    });
                    
                    // 存储发射物信息
                    if (!this.shootingBalls) this.shootingBalls = [];
                    this.shootingBalls.push({ id: projectileId, object: projectile });
                    
                    console.log('发射物已添加到物理系统，ID:', projectileId);
                } else {
                    // 回退到简单动画
                    this.animateShootingBubble(projectile, velocity.x, velocity.y);
                }
                
                // 更新状态
                if (this.statusText) {
                    this.statusText.text = '状态: 发射完成 - 观察物理运动';
                    this.statusText.style.fill = 0x2ECC71;
                }
            }
        };

        // 创建发射器
        this.shooter = window.rootManager.createShooter(shooterConfig);
        this.addResource(this.shooter); // 添加到资源管理
        this.step4Container.addLayer.addChild(this.shooter.container);
        
        // 设置交互区域为整个容器的背景层
        this.shooter.setInteractiveArea(this.step4Container.backgroundLayer);
        
        // 设置物理系统回调
        this.setupPhysicsCallbacks();
        
        console.log('统一发射器系统已创建，集成物理系统');
    }

    setupPhysicsCallbacks() {
        // 设置物理系统回调
        if (!window.physicsManager) {
            console.warn('物理系统未初始化');
            return;
        }

        // 发射物碰撞回调
        window.physicsManager.setCallback('onProjectileCollision', (projectileData) => {
            console.log('发射物碰撞:', projectileData);
        });

        // 发射物移除回调
        window.physicsManager.setCallback('onProjectileRemove', (projectileData) => {
            console.log('发射物被移除:', projectileData);
            
            // 从发射物数组中移除
            if (this.shootingBalls) {
                const index = this.shootingBalls.findIndex(p => p.id === projectileData.id);
                if (index !== -1) {
                    this.shootingBalls.splice(index, 1);
                }
            }
            
            // 重置状态
            if (this.statusText) {
                this.statusText.text = '状态: 准备发射 - 按住鼠标瞄准';
                this.statusText.style.fill = 0xFFFFFF;
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

    // 以下方法已被RootManager统一发射器替代，暂时保留animateShootingBubble作为备用
    /*
    updateAimLine(targetX, targetY) {
        const startX = this.currentShootingBubble.x;
        const startY = this.currentShootingBubble.y;
        
        // 计算角度
        this.aimAngle = Math.atan2(targetY - startY, targetX - startX);
        
        // 限制角度范围（向上发射）
        this.aimAngle = Math.max(-2.8, Math.min(-0.3, this.aimAngle));
        
        const aimLength = 80;
        const endX = startX + Math.cos(this.aimAngle) * aimLength;
        const endY = startY + Math.sin(this.aimAngle) * aimLength;
        
        // 绘制瞄准线
        this.aimLine.clear();
        this.aimLine.lineStyle(3, 0xFFFF00, 0.8);
        this.aimLine.moveTo(startX, startY);
        this.aimLine.lineTo(endX, endY);
        
        // 瞄准点
        this.aimLine.beginFill(0xFFFF00, 0.8);
        this.aimLine.drawCircle(endX, endY, 6);
        this.aimLine.endFill();
        
        // 更新坐标显示
        if (this.coordinateText) {
            this.coordinateText.text = `瞄准坐标: X:${Math.round(endX)}, Y:${Math.round(endY)}`;
        }
    }

    shootBubble() {
        if (this.isAnimating) return;
        
        this.isAnimating = true;
        
        // 创建发射的泡泡 - 使用蛋形
        const shootingBubble = window.rootManager.createEggShape(0, 250, 32, 40, 0x45B7D1, true);
        shootingBubble.scale.set(0.9);
        shootingBubble.colorIndex = 2;
        shootingBubble.ballColor = 0x45B7D1;
        this.step4Container.addLayer.addChild(shootingBubble);
        
        // 计算发射速度
        const speed = 8;
        const velocityX = Math.cos(this.aimAngle) * speed;
        const velocityY = Math.sin(this.aimAngle) * speed;
        
        // 隐藏当前泡泡
        this.currentShootingBubble.visible = false;
        
        // 清除瞄准线
        this.aimLine.clear();
        
        // 动画发射
        this.animateShootingBubble(shootingBubble, velocityX, velocityY);
    }
    */

    animateShootingBubble(bubble, velocityX, velocityY) {
        let currentVelX = velocityX;
        let currentVelY = velocityY;
        
        const animate = () => {
            if (!bubble || !bubble.parent) return;
            
            // 更新位置
            bubble.x += currentVelX;
            bubble.y += currentVelY;
            
            // 添加重力效果
            currentVelY += 0.15;
            
            // 边界反弹
            if (bubble.x < -280 || bubble.x > 280) {
                currentVelX = -currentVelX * 0.8;
                bubble.x = Math.max(-280, Math.min(280, bubble.x));
            }
            
            // 上边界反弹
            if (bubble.y < -320) {
                currentVelY = -currentVelY * 0.8;
                bubble.y = -320;
            }
            
            // 底部边界反弹
            if (bubble.y > 300) {
                currentVelY = -currentVelY * 0.8;
                bubble.y = 300;
            }
            
            // 暂时注释掉碰撞检测
            // const collision = this.checkBubbleCollision(bubble);
            // if (collision || bubble.y > 200) {
            //     this.handleBubbleCollision(bubble, collision);
            //     return;
            // }
            
            // 简单清理：泡泡掉出屏幕或速度过低时移除
            if (bubble.y > 400 || (Math.abs(currentVelX) < 0.3 && Math.abs(currentVelY) < 0.3 && bubble.y > 50)) {
                this.step4Container.addLayer.removeChild(bubble);
                bubble.destroy();
                this.resetShootingDemo();
                return;
            }
            
            requestAnimationFrame(animate);
        };
        
        animate();
    }

    // 暂时注释掉碰撞检测方法
    /*
    checkBubbleCollision(movingBubble) {
        // 检查与网格管理器中泡泡的碰撞
        for (let row = 0; row < this.gridManager.config.rows; row++) {
            for (let col = 0; col < this.gridManager.config.cols; col++) {
                if (!this.gridManager.isEmpty(row, col)) {
                    const gridPos = this.gridManager.calculateGridPosition(row, col);
                    const adjustedX = gridPos.x;
                    const adjustedY = gridPos.y; // 不需要调整Y坐标，因为网格已经相对正确定位
                    
                    const distance = Math.sqrt(
                        Math.pow(movingBubble.x - adjustedX, 2) +
                        Math.pow(movingBubble.y - adjustedY, 2)
                    );
                    
                    if (distance < 30) {
                        return { row, col, gridPos: { x: adjustedX, y: adjustedY } };
                    }
                }
            }
        }
        return null;
    }

    handleBubbleCollision(bubble, collision) {
        // 创建碰撞特效
        if (collision) {
            this.createCollisionEffect(bubble.x, bubble.y);
        }
        
        // 移除发射的泡泡
        this.step4Container.addLayer.removeChild(bubble);
        bubble.destroy();
        
        if (collision) {
            // 将泡泡添加到网格 - 寻找合适的位置
            const targetRow = Math.max(0, collision.row - 1);
            const targetCol = collision.col;
            
            // 尝试添加到网格中
            if (this.gridManager.isEmpty(targetRow, targetCol)) {
                this.gridManager.addBall(targetRow, targetCol, 0x45B7D1); // 使用发射泡泡的颜色
                this.showResult('🎯 成功添加!', `泡泡已添加到位置 (${targetRow},${targetCol})`, 0x00FF00);
            } else {
                this.showResult('位置已占用', '无法在此位置添加泡泡', 0xF39C12);
            }
            
            this.updateStep4Stats();
        } else {
            // 没有碰撞，显示失败消息
            this.showResult('射击失败', '泡泡未击中目标', 0xE74C3C);
        }
        
        // 重置状态
        setTimeout(() => {
            this.resetShootingDemo();
        }, 2500);
    }

    createCollisionEffect(x, y) {
        // 创建碰撞环效果
        const ringCount = 3;
        for (let i = 0; i < ringCount; i++) {
            const ring = new PIXI.Graphics();
            ring.lineStyle(4, 0xFFFFFF, 0.8);
            ring.drawCircle(0, 0, 5);
            ring.x = x;
            ring.y = y;
            this.step4Container.addLayer.addChild(ring);
            
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
                    this.step4Container.addLayer.removeChild(ring);
                    ring.destroy();
                }
            };
            animate();
        }
    }
    */

    showResult(title, message, color) {
        const resultText = new PIXI.Text(`${title}\n${message}`, {
            fontFamily: 'Arial',
            fontSize: 14,
            fill: color,
            align: 'center',
            fontWeight: 'bold'
        });
        resultText.anchor.set(0.5);
        resultText.x = 0;
        resultText.y = 150;
        this.step4Container.addLayer.addChild(resultText);
        
        // 淡出动画
        setTimeout(() => {
            const fadeOut = () => {
                resultText.alpha -= 0.05;
                if (resultText.alpha > 0) {
                    requestAnimationFrame(fadeOut);
                } else {
                    this.step4Container.addLayer.removeChild(resultText);
                    resultText.destroy();
                }
            };
            fadeOut();
        }, 2000);
    }

    // 以下方法已被RootManager统一发射器替代，不再需要
    /*
    resetShootingDemo() {
        this.isAnimating = false;
        this.currentShootingBubble.visible = true;
        this.aimLine.clear();
        
        if (this.statusText) {
            this.statusText.text = '状态: 准备发射 - 按住鼠标瞄准';
            this.statusText.style.fill = 0xFFFFFF;
        }
        
        if (this.coordinateText) {
            this.coordinateText.text = '瞄准坐标: X:0, Y:0';
        }
    }
    */

    createStep4Controls() {
        // 控制面板容器
        this.controlsContainer = new PIXI.Container();
        this.controlsContainer.x = -220;
        this.controlsContainer.y = 220;
        this.step4Container.addLayer.addChild(this.controlsContainer);

        // 控制面板背景
        const controlsBg = new PIXI.Graphics();
        controlsBg.beginFill(0x34495E, 0.8);
        controlsBg.drawRoundedRect(0, 0, 440, 120, 8);
        controlsBg.endFill();
        controlsBg.lineStyle(2, 0x5DADE2, 0.8);
        controlsBg.drawRoundedRect(0, 0, 440, 120, 8);
        this.controlsContainer.addChild(controlsBg);

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
        this.controlsContainer.addChild(addRowBtn);

        buttonX += 110;

        // 清空网格按钮
        const clearBtn = this.createControlButton('清空网格', buttonX, buttonY, buttonStyle);
        clearBtn.on('pointerdown', () => {
            this.gridManager.clearGrid();
            this.updateStep4Stats();
        });
        this.controlsContainer.addChild(clearBtn);

        buttonX += 110;

        // 切换网格线按钮
        const toggleGridBtn = this.createControlButton('切换网格线', buttonX, buttonY, buttonStyle);
        toggleGridBtn.on('pointerdown', () => {
            const isVisible = this.gridManager.backgroundLayer.visible;
            this.gridManager.showGridLines(!isVisible);
        });
        this.controlsContainer.addChild(toggleGridBtn);

        buttonX += 110;

        // 随机填充按钮
        const randomFillBtn = this.createControlButton('随机填充', buttonX, buttonY, buttonStyle);
        randomFillBtn.on('pointerdown', () => {
            this.randomFillGrid();
        });
        this.controlsContainer.addChild(randomFillBtn);

        // 第二行按钮
        buttonX = 10;
        buttonY = 50;

        // 添加单个小球按钮
        const addBallBtn = this.createControlButton('添加小球(0,0)', buttonX, buttonY, buttonStyle);
        addBallBtn.on('pointerdown', () => {
            this.gridManager.addBall(0, 0);
            this.updateStep4Stats();
        });
        this.controlsContainer.addChild(addBallBtn);

        buttonX += 110;

        // 删除小球按钮
        const removeBallBtn = this.createControlButton('删除小球(0,0)', buttonX, buttonY, buttonStyle);
        removeBallBtn.on('pointerdown', () => {
            this.gridManager.removeBall(0, 0);
            this.updateStep4Stats();
        });
        this.controlsContainer.addChild(removeBallBtn);

        buttonX += 110;

        // 重置网格按钮
        const resetBtn = this.createControlButton('重置演示', buttonX, buttonY, buttonStyle);
        resetBtn.on('pointerdown', () => {
            this.gridManager.clearGrid();
            this.gridManager.addDefaultRow(0);
            this.updateStep4Stats();
        });
        this.controlsContainer.addChild(resetBtn);

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
        this.controlsContainer.addChild(this.step4StatsText);
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

    createStep4Status() {
        // 状态文本
        this.statusText = new PIXI.Text('状态: 准备发射 - 按住鼠标瞄准', {
            fontFamily: 'Arial',
            fontSize: 12,
            fill: 0xFFFFFF,
            align: 'center'
        });
        this.statusText.anchor.set(0.5);
        this.statusText.x = 0;
        this.statusText.y = -320;
        this.step4Container.addLayer.addChild(this.statusText);
        this.addResource(this.statusText);
        
        // 坐标文本
        this.coordinateText = new PIXI.Text('瞄准坐标: X:0, Y:0', {
            fontFamily: 'Arial',
            fontSize: 10,
            fill: 0xBDC3C7,
            align: 'center'
        });
        this.coordinateText.anchor.set(0.5);
        this.coordinateText.x = 0;
        this.coordinateText.y = -300;
        this.step4Container.addLayer.addChild(this.coordinateText);
        this.addResource(this.coordinateText);
        
        // 统计信息将在 createStep4Controls 中创建
    }

    updateStats() {
        if (this.gridManager && this.step4StatsText) {
            const bubbleCount = this.gridManager.getBubbleCount();
            const emptySlots = this.gridManager.getEmptySlotCount();
            
            this.step4StatsText.text = 
                `网格状态统计:\n` +
                `泡泡数量: ${bubbleCount}\n` +
                `空位数量: ${emptySlots}\n` +
                `网格大小: ${this.gridManager.rows}x${this.gridManager.cols}`;
        }
    }

    addRandomBubble() {
        if (!this.gridManager) return;
        
        const colors = [0xFF6B6B, 0x4ECDC4, 0x45B7D1, 0x96CEB4, 0xFECA57, 0xFF9FF3];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        
        // 找到一个空位置
        const emptyPositions = this.gridManager.getEmptyPositions();
        if (emptyPositions.length > 0) {
            const randomPos = emptyPositions[Math.floor(Math.random() * emptyPositions.length)];
            this.gridManager.addBubble(randomPos.row, randomPos.col, randomColor);
            this.updateStats();
        }
    }

    removeRandomBubble() {
        if (!this.gridManager) return;
        
        const filledPositions = this.gridManager.getFilledPositions();
        if (filledPositions.length > 0) {
            const randomPos = filledPositions[Math.floor(Math.random() * filledPositions.length)];
            this.gridManager.removeBubble(randomPos.row, randomPos.col);
            this.updateStats();
        }
    }

    checkMatches() {
        if (!this.gridManager) return;
        
        // 这里可以实现匹配检测逻辑
        console.log('检测颜色匹配...');
        
        // 创建一个简单的匹配效果
        const filledPositions = this.gridManager.getFilledPositions();
        filledPositions.forEach(pos => {
            const bubble = this.gridManager.getBubbleAt(pos.row, pos.col);
            if (bubble) {
                // 创建闪烁效果
                this.createBlinkEffect(bubble);
            }
        });
    }

    createBlinkEffect(bubble) {
        let blinkCount = 0;
        const maxBlinks = 6;
        
        const blinkInterval = this.addInterval(() => {
            bubble.alpha = bubble.alpha === 1 ? 0.5 : 1;
            blinkCount++;
            
            if (blinkCount >= maxBlinks) {
                bubble.alpha = 1;
            }
        }, 150);
    }

    clearGrid() {
        if (this.gridManager) {
            this.gridManager.clearAll();
            this.updateStats();
        }
    }

    fillRandomBubbles() {
        if (!this.gridManager) return;
        
        const colors = [0xFF6B6B, 0x4ECDC4, 0x45B7D1, 0x96CEB4, 0xFECA57, 0xFF9FF3];
        
        for (let row = 0; row < Math.min(5, this.gridManager.rows); row++) {
            for (let col = 0; col < this.gridManager.cols; col++) {
                if (Math.random() < 0.7) { // 70% 概率放置泡泡
                    const randomColor = colors[Math.floor(Math.random() * colors.length)];
                    this.gridManager.addBubble(row, col, randomColor);
                }
            }
        }
        
        this.updateStats();
    }

    resetDemo() {
        if (this.gridManager) {
            this.gridManager.clearAll();
            this.addDemoBubbles();
        }
    }

    testCollision() {
        console.log('执行碰撞检测测试...');
        
        // 创建一个测试发射物
        const testProjectile = new PIXI.Graphics();
        testProjectile.beginFill(0xFFFF00);
        testProjectile.drawCircle(0, 0, 15);
        testProjectile.endFill();
        testProjectile.x = 0;
        testProjectile.y = 300;
        
        this.step4Container.addChild(testProjectile);
        
        // 动画移动到网格区域
        let moveY = 0;
        const animate = () => {
            testProjectile.y -= 3;
            moveY += 3;
            
            if (moveY < 400) {
                requestAnimationFrame(animate);
            } else {
                this.step4Container.removeChild(testProjectile);
                testProjectile.destroy();
            }
        };
        
        animate();
    }

    // 模块停用时的清理
    onDeactivate() {
        // 清理物理系统中的所有发射物
        if (window.physicsManager && this.shootingBalls) {
            this.shootingBalls.forEach(projectileInfo => {
                try {
                    window.physicsManager.removeProjectile(projectileInfo.id);
                } catch (error) {
                    console.warn('清理发射物时出错:', error);
                }
            });
            this.shootingBalls = [];
        }
        
        // 清理物理系统回调函数
        if (window.physicsManager) {
            window.physicsManager.setCallback('onProjectileCollision', null);
            window.physicsManager.setCallback('onProjectileRemove', null);
            window.physicsManager.setCallback('onProjectileDestroy', null);
        }
        
        console.log('Step4 物理系统状态已清理');
    }

    getInfo() {
        return {
            name: 'Step4TestModule',
            description: '碰撞检测系统测试',
            version: '1.0.0'
        };
    }
}

// 暴露到全局
window.Step4TestModule = Step4TestModule;
