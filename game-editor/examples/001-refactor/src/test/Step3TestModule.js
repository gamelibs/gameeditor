/**
 * Step3 测试模块 - 碰撞检测与颜色匹配
 */
class Step3TestModule extends BaseTestModule {
    constructor(container, config = {}) {
        super(container, config);
        
        // Step3 专用状态
        this.step3Container = null;
        this.shooter = null;
        this.projectiles = [];
        this.shotCount = 0;
        
        // 状态显示文本
        this.shooterStatusText = null;
        this.shooterCoordinateText = null;
        this.shooterStatsText = null;
    }

    async init() {
        // 创建模块容器
        this.moduleContainer = new PIXI.Container();
        
        // 创建 Step3 演示
        this.createStep3Demo();
        
        this.isLoaded = true;
        console.log('Step3 测试模块初始化完成');
    }

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
        
        // 将容器添加到模块容器中
        this.moduleContainer.addChild(this.step3Container.container);
        this.addResource(this.step3Container);
        
        // 创建发射器测试
        this.createShooterTest();
    }

    createShooterTest() {
        // 设置物理系统边界（相对于step3Container）- 根据容器大小设置边界
        // 容器大小为 500x600，所以边界为 -250到250，-300到300
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
            containerSize: { width: 500, height: 600 }, // 传递容器大小，让发射器自动计算距离
            customProjectile: customEggProjectile,  // 使用自定义鸡蛋形状
            projectile: {
                color: 0x00FF00,  // 绿色发射物
                radius: 18
            },
            physics: {
                usePhysics: true,     // 使用物理系统
                params: {
                    gravity: 0.1,      // 减少重力，从0.2降到0.1
                    friction: 0.995,   // 减少摩擦力，从0.98提高到0.995
                    bounceX: 0.9,      // 提高弹性，从0.8提高到0.9
                    bounceY: 0.8,      // 提高弹性，从0.6提高到0.8
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
                this.step3Container.addChild(projectile);
                
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
        this.addResource(this.shooter);
        
        // 将发射器添加到容器中
        this.step3Container.addChild(this.shooter.container);
        
        // 设置交互区域为整个容器的背景层
        this.shooter.setInteractiveArea(this.step3Container.backgroundLayer);
        
        // 设置物理系统回调
        this.setupPhysicsCallbacks();
        
        // 创建状态显示
        this.createShooterStatus();
        
        // 创建控制按钮
        this.createShooterControls();
        
        // 初始化统计
        this.shotCount = 0;
        this.projectiles = [];
    }

    setupPhysicsCallbacks() {
        // 边界碰撞回调
        window.physicsManager.setCallback('onBoundaryCollision', (projectileData, boundaries) => {
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
        this.step3Container.addChild(this.shooterStatusText);
        this.addResource(this.shooterStatusText);

        // 坐标显示文本
        this.shooterCoordinateText = new PIXI.Text('目标坐标: X:0, Y:0', {
            fontFamily: 'Arial',
            fontSize: 12,
            fill: 0x4ECDC4
        });
        this.shooterCoordinateText.anchor.set(0.5);
        this.shooterCoordinateText.x = 0;
        this.shooterCoordinateText.y = -230;
        this.step3Container.addChild(this.shooterCoordinateText);
        this.addResource(this.shooterCoordinateText);

        // 统计显示文本
        this.shooterStatsText = new PIXI.Text('发射次数: 0', {
            fontFamily: 'Arial',
            fontSize: 12,
            fill: 0xF39C12
        });
        this.shooterStatsText.anchor.set(0.5);
        this.shooterStatsText.x = 0;
        this.shooterStatsText.y = -210;
        this.step3Container.addChild(this.shooterStatsText);
        this.addResource(this.shooterStatsText);

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
        this.step3Container.addChild(instructionText);
        this.addResource(instructionText);
    }

    createShooterControls() {
        // 控制按钮容器
        const controlsContainer = new PIXI.Container();
        controlsContainer.y = 260;
        this.step3Container.addChild(controlsContainer);
        this.addResource(controlsContainer);

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
        this.addResource(featuresText);
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
        this.step3Container.addChild(disappearEffect);

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
                this.step3Container.removeChild(disappearEffect);
                disappearEffect.destroy();
            }
        };
        animate();

        // 移除发射物
        this.step3Container.removeChild(projectile);
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
                this.step3Container.removeChild(projectile);
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
                power: 1,
                maxDistance: 800,
                customProjectile: newCustomEggProjectile,
                projectile: {
                    color: randomColor,
                    radius: 18
                },
                physics: {
                    usePhysics: true,
                    params: {
                        gravity: 0.2,
                        friction: 0.98,
                        bounceX: 0.8,
                        bounceY: 0.6,
                        enableBounce: true
                    }
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
                onShoot: (projectile, velocity, power, physicsConfig) => {
                    this.step3Container.addChild(projectile);
                    
                    if (physicsConfig.usePhysics) {
                        const projectileId = window.physicsManager.addProjectile({
                            projectile: projectile,
                            velocity: velocity,
                            power: power,
                            physics: physicsConfig.params
                        });
                        
                        if (!this.projectiles) this.projectiles = [];
                        this.projectiles.push({ id: projectileId, object: projectile });
                    } else {
                        this.animateProjectile(projectile, velocity);
                    }
                    
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
            this.step3Container.addChild(this.shooter.container);
            this.shooter.setInteractiveArea(this.step3Container.backgroundLayer);
            this.addResource(this.shooter);
        }
        
        if (this.shooterStatusText) {
            this.shooterStatusText.text = '状态: 颜色已更换 - 准备发射';
        }
    }

    // 模块停用时的清理
    onDeactivate() {
        // 清理物理系统中的所有发射物
        if (window.physicsManager && this.projectiles) {
            this.projectiles.forEach(projectileInfo => {
                try {
                    window.physicsManager.removeProjectile(projectileInfo.id);
                } catch (error) {
                    console.warn('清理发射物时出错:', error);
                }
            });
            this.projectiles = [];
        }
        
        // 清理物理系统回调函数
        if (window.physicsManager) {
            window.physicsManager.setCallback('onBoundaryCollision', null);
            window.physicsManager.setCallback('onProjectileStop', null);
            window.physicsManager.setCallback('onProjectileDestroy', null);
        }
        
        console.log('Step3 物理系统状态已清理');
    }

    getInfo() {
        return {
            name: 'Step3TestModule',
            description: '碰撞检测与颜色匹配测试',
            version: '1.0.0'
        };
    }
}

// 暴露到全局
window.Step3TestModule = Step3TestModule;
