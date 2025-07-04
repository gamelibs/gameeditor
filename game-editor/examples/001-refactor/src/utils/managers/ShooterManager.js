/**
 * ShooterManager - 发射器管理器
 * 管理游戏中的发射器功能，包括瞄准、发射、力度控制等
 * 从RootManager中拆分出来的专门管理器
 */
window.ShooterManager = class ShooterManager {
    constructor(rootManager = null) {
        this.debug = false;
        this.rootManager = rootManager; // 引用RootManager以访问其方法
        console.log('[ShooterManager] 发射器管理器初始化完成');
    }

    /**
     * 设置RootManager引用
     * @param {RootManager} rootManager - RootManager实例
     */
    setRootManager(rootManager) {
        this.rootManager = rootManager;
        if (this.debug) {
            console.log('[ShooterManager] RootManager引用已设置');
        }
    }

    /**
     * 创建发射器
     * @param {Object} config - 发射器配置
     * @param {number} config.x - X坐标，默认0
     * @param {number} config.y - Y坐标，默认0 
     * @param {number} config.power - 发射力度(0-1)，0为不发射，1为容器边缘都可以到，默认1
     * @param {number} config.maxDistance - 最大发射距离，默认自动计算（基于容器大小）
     * @param {Object} config.containerSize - 容器大小信息 {width, height}，用于自动计算发射距离
     * @param {Object} config.projectile - 发射物配置
     * @param {number} config.projectile.color - 发射物颜色，默认白色
     * @param {number} config.projectile.radius - 发射物半径，默认15
     * @param {PIXI.DisplayObject} config.customProjectile - 自定义发射物对象
     * @param {Object} config.physics - 物理系统配置
     * @param {boolean} config.physics.usePhysics - 是否使用物理系统，默认true
     * @param {Object} config.physics.params - 物理参数覆盖
     * @param {Function} config.onAim - 瞄准时回调函数 (angle, targetX, targetY, power) => {}
     * @param {Function} config.onShoot - 发射时回调函数 (projectile, velocity, power, physicsConfig) => {}
     * @returns {Object} 发射器控制对象
     */
    createShooter(config = {}) {
        // 默认配置
        const defaultConfig = {
            x: 0,
            y: 0,
            power: 1,           // 默认最大力度
            maxDistance: null,   // 自动计算，基于容器大小
            containerSize: null, // 容器大小，用于自动计算发射距离
            projectile: {
                color: 0xFFFFFF, // 默认白色
                radius: 15
            },
            customProjectile: null,
            physics: {
                usePhysics: true,        // 默认使用物理系统
                params: {}               // 物理参数覆盖
            },
            onAim: null,
            onShoot: null
        };

        // 合并配置
        const finalConfig = {
            ...defaultConfig,
            ...config,
            projectile: {
                ...defaultConfig.projectile,
                ...(config.projectile || {})
            },
            physics: {
                ...defaultConfig.physics,
                ...(config.physics || {})
            }
        };

        // 自动计算发射距离：基于容器大小计算能够到达容器边缘的距离
        if (finalConfig.maxDistance === null && finalConfig.containerSize) {
            // 计算从容器中心到边缘的最大距离（对角线距离的一半）
            const { width, height } = finalConfig.containerSize;
            const maxRadius = Math.sqrt((width/2) * (width/2) + (height/2) * (height/2));
            // 增加更大的余量确保能到达容器任何位置（200%余量）
            finalConfig.maxDistance = maxRadius * 2.5;
            if (this.debug) {
                console.log(`自动计算发射距离: ${finalConfig.maxDistance.toFixed(0)} (容器: ${width}x${height})`);
            }
        } else if (finalConfig.maxDistance === null) {
            // 如果没有容器信息，使用更大的默认值
            finalConfig.maxDistance = 3000;
            if (this.debug) {
                console.log('使用默认发射距离: 3000');
            }
        }

        // 创建发射器容器
        const shooterContainer = new PIXI.Container();
        shooterContainer.x = finalConfig.x;
        shooterContainer.y = finalConfig.y;

        // 创建默认的上半圆形白色图形
        const shooterBase = new PIXI.Graphics();
        shooterBase.beginFill(0xFFFFFF, 0.8); // 白色，稍微透明
        shooterBase.lineStyle(2, 0xCCCCCC, 0.6); // 浅灰色边框
        
        // 绘制上半圆（从 π 到 0，即从左到右的上半圆）
        const radius = 25;
        shooterBase.arc(0, 0, radius, Math.PI, 0, false);
        shooterBase.lineTo(radius, 0);  // 连接到右端点
        shooterBase.lineTo(-radius, 0); // 连接到左端点
        shooterBase.closePath();
        shooterBase.endFill();
        
        shooterContainer.addChild(shooterBase);

        // 创建当前发射物预览容器
        let currentProjectileDisplay = null;

        // 创建瞄准线
        const aimLine = new PIXI.Graphics();
        shooterContainer.addChild(aimLine);

        // 发射器状态
        let isAiming = false;
        let currentAimAngle = -Math.PI / 2; // 默认向上
        let currentPower = finalConfig.power; // 当前力度
        let interactiveArea = null;

        // 瞄准线更新方法
        const updateAimLine = (localX, localY) => {
            aimLine.clear();

            // 固定瞄准线长度
            const fixedLength = 100;

            // 如果没有在瞄准，显示默认的垂直瞄准线
            if (!isAiming) {
                // 绘制默认垂直瞄准线，使用当前力度影响颜色透明度
                const alpha = Math.max(0.3, currentPower); // 力度越低透明度越低，最低0.3
                this.drawDashedLine(aimLine, 0, 0, 0, -fixedLength, 0xFFFF00, 2, 8, 4);
                
                // 绘制默认箭头，颜色强度根据力度调整
                const arrowColor = currentPower > 0.5 ? 0xFF6B6B : 0xFFAAAA; // 力度高时红色，低时浅红
                this.drawArrow(aimLine, 0, -fixedLength, -Math.PI / 2, arrowColor, 15, 2);
                return;
            }

            // 计算相对于发射器起点的目标位置
            const deltaX = localX - shooterContainer.x;
            const deltaY = localY - shooterContainer.y;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

            if (distance < 30) return;

            // 计算角度
            currentAimAngle = Math.atan2(deltaY, deltaX);

            // 限制瞄准角度（只能向上半圆瞄准）
            const minAngle = -Math.PI;
            const maxAngle = 0;
            currentAimAngle = Math.max(minAngle, Math.min(maxAngle, currentAimAngle));

            // 使用固定长度计算终点（相对于发射器起点）
            const endX = Math.cos(currentAimAngle) * fixedLength;
            const endY = Math.sin(currentAimAngle) * fixedLength;

            // 根据力度调整瞄准线的视觉效果
            const lineWidth = 2 + currentPower * 2; // 力度越大线条越粗
            const arrowColor = currentPower > 0.5 ? 0xFF6B6B : 0xFFAAAA; // 力度高时红色，低时浅红

            // 绘制虚线瞄准线
            this.drawDashedLine(aimLine, 0, 0, endX, endY, 0xFFFF00, lineWidth);

            // 绘制箭头
            this.drawArrow(aimLine, endX, endY, currentAimAngle, arrowColor);

            // 调用瞄准回调，包含力度信息
            if (finalConfig.onAim) {
                // 传递绝对坐标和力度
                const absoluteX = shooterContainer.x + localX;
                const absoluteY = shooterContainer.y + localY;
                finalConfig.onAim(currentAimAngle, absoluteX, absoluteY, currentPower);
            }
        };

        // 发射方法
        const shoot = () => {
            if (!isAiming || currentPower <= 0) return null; // 力度为0时不发射

            // 创建发射的弹丸，需要依赖RootManager的方法
            let projectile;
            if (finalConfig.customProjectile) {
                // 复制自定义发射物
                if (finalConfig.customProjectile.clone) {
                    projectile = finalConfig.customProjectile.clone();
                } else {
                    // 手动复制自定义发射物（例如鸡蛋形状）
                    if (finalConfig.customProjectile.eggColor !== undefined) {
                        // 这是一个鸡蛋形状，创建新的鸡蛋
                        if (this.rootManager) {
                            projectile = this.rootManager.createEggShape(
                                shooterContainer.x, 
                                shooterContainer.y, 
                                finalConfig.customProjectile.eggWidth, 
                                finalConfig.customProjectile.eggHeight, 
                                finalConfig.customProjectile.eggColor, 
                                finalConfig.customProjectile.hasHighlight, 
                                0
                            );
                        } else {
                            // 回退创建简单的圆形
                            projectile = new PIXI.Graphics();
                            projectile.beginFill(finalConfig.customProjectile.eggColor || 0xFFFFFF);
                            projectile.drawCircle(0, 0, finalConfig.projectile.radius);
                            projectile.endFill();
                            projectile.x = shooterContainer.x;
                            projectile.y = shooterContainer.y;
                        }
                        // 保持原有的属性
                        projectile.radius = finalConfig.customProjectile.radius;
                        projectile.eggGameColor = finalConfig.customProjectile.eggGameColor;
                        projectile.bubbleColor = finalConfig.customProjectile.bubbleColor;
                    } else {
                        // 回退到创建泡泡
                        if (this.rootManager) {
                            projectile = this.rootManager.createBubble(shooterContainer.x, shooterContainer.y, finalConfig.projectile.color, finalConfig.projectile.radius);
                        } else {
                            // 回退创建简单的圆形
                            projectile = new PIXI.Graphics();
                            projectile.beginFill(finalConfig.projectile.color);
                            projectile.drawCircle(0, 0, finalConfig.projectile.radius);
                            projectile.endFill();
                            projectile.x = shooterContainer.x;
                            projectile.y = shooterContainer.y;
                        }
                    }
                }
            } else {
                if (this.rootManager) {
                    projectile = this.rootManager.createBubble(shooterContainer.x, shooterContainer.y, finalConfig.projectile.color, finalConfig.projectile.radius);
                } else {
                    // 回退创建简单的圆形
                    projectile = new PIXI.Graphics();
                    projectile.beginFill(finalConfig.projectile.color);
                    projectile.drawCircle(0, 0, finalConfig.projectile.radius);
                    projectile.endFill();
                    projectile.x = shooterContainer.x;
                    projectile.y = shooterContainer.y;
                }
            }
            
            projectile.scale.set(1.0); // 与网格蛋大小一致

            // 根据力度和最大距离计算发射速度
            // 增强速度计算以确保能够到达最大距离
            // 使用更高的速度系数来确保蛋能到达顶部
            const baseSpeed = finalConfig.maxDistance / 20; // 将速度系数从40改为20，速度加倍
            const powerMultiplier = 0.8 + (currentPower * 1.2); // 提高最小速度到80%，最大速度提高
            let actualSpeed = baseSpeed * powerMultiplier; 
            
            // 对垂直发射给予额外的速度加成，以克服重力影响
            const isNearVertical = Math.abs(currentAimAngle + Math.PI/2) < 0.3; // 检查是否接近垂直向上（±17度范围内）
            if (isNearVertical) {
                actualSpeed *= 2.4; // 垂直发射时速度增加140%（从1.8改为2.4）
            }
            
            const velocity = {
                x: Math.cos(currentAimAngle) * actualSpeed,
                y: Math.sin(currentAimAngle) * actualSpeed
            };

            // 创建发射特效，特效强度根据力度调整
            this.createShootingEffect(shooterContainer, 0, 0, currentPower);

            // 准备物理配置数据
            const physicsConfig = {
                usePhysics: finalConfig.physics.usePhysics,
                params: finalConfig.physics.params
            };

            // 调用发射回调，包含力度和物理配置信息
            if (finalConfig.onShoot) {
                finalConfig.onShoot(projectile, velocity, currentPower, physicsConfig);
            }

            return { projectile, velocity, power: currentPower };
        };

        // 设置交互区域方法
        const setInteractiveArea = (area) => {
            if (interactiveArea) {
                // 移除之前的事件监听
                interactiveArea.off('pointermove');
                interactiveArea.off('pointerdown');
                interactiveArea.off('pointerup');
                interactiveArea.off('pointerupoutside');
            }

            interactiveArea = area;
            if (!area) return;

            // 设置交互
            area.interactive = true;

            // 鼠标移动 - 更新瞄准线
            area.on('pointermove', (event) => {
                if (isAiming) {
                    // 获取相对于交互区域的本地坐标
                    const localPos = event.data.getLocalPosition(area);
                    updateAimLine(localPos.x, localPos.y);
                }
            });

            // 鼠标按下 - 开始瞄准
            area.on('pointerdown', (event) => {
                isAiming = true;
                const localPos = event.data.getLocalPosition(area);
                updateAimLine(localPos.x, localPos.y);
            });

            // 鼠标抬起 - 发射
            area.on('pointerup', () => {
                if (isAiming) {
                    shoot();
                    isAiming = false;
                    // 保持当前瞄准线角度，不恢复到默认位置
                    // 使用当前角度和力度重绘瞄准线
                    const fixedLength = 100;
                    const endX = Math.cos(currentAimAngle) * fixedLength;
                    const endY = Math.sin(currentAimAngle) * fixedLength;
                    
                    aimLine.clear();
                    const lineWidth = 2 + currentPower * 2;
                    const arrowColor = currentPower > 0.5 ? 0xFF6B6B : 0xFFAAAA;
                    this.drawDashedLine(aimLine, 0, 0, endX, endY, 0xFFFF00, lineWidth, 8, 4);
                    this.drawArrow(aimLine, endX, endY, currentAimAngle, arrowColor, 15, 2);
                }
            });

            // 鼠标离开 - 取消瞄准
            area.on('pointerupoutside', () => {
                isAiming = false;
                // 保持当前瞄准线角度，不恢复到默认位置
                // 使用当前角度和力度重绘瞄准线
                const fixedLength = 100;
                const endX = Math.cos(currentAimAngle) * fixedLength;
                const endY = Math.sin(currentAimAngle) * fixedLength;
                
                aimLine.clear();
                const lineWidth = 2 + currentPower * 2;
                const arrowColor = currentPower > 0.5 ? 0xFF6B6B : 0xFFAAAA;
                this.drawDashedLine(aimLine, 0, 0, endX, endY, 0xFFFF00, lineWidth, 8, 4);
                this.drawArrow(aimLine, endX, endY, currentAimAngle, arrowColor, 15, 2);
            });
        };

        // 初始化默认瞄准线显示
        updateAimLine(0, 0);

        // 返回发射器控制对象
        return {
            container: shooterContainer,
            
            // 设置位置
            setPosition: (x, y) => {
                shooterContainer.x = x;
                shooterContainer.y = y;
            },
            
            // 设置交互区域
            setInteractiveArea: setInteractiveArea,
            
            // 更新自定义发射物
            updateCustomProjectile: (newProjectile) => {
                finalConfig.customProjectile = newProjectile;
                
                // 更新发射器上的预览显示
                if (currentProjectileDisplay) {
                    shooterContainer.removeChild(currentProjectileDisplay);
                    currentProjectileDisplay.destroy();
                }
                
                if (newProjectile) {
                    // 创建新的预览显示（缩小版本）
                    if (newProjectile.eggGameColor !== undefined) {
                        // 创建蛋形状预览
                        if (this.rootManager) {
                            currentProjectileDisplay = this.rootManager.createEggShape(
                                0, -5, // 位置稍微向上，显示在发射器上方
                                18, 22, // 较小的尺寸用于预览
                                newProjectile.eggGameColor,
                                true,
                                0
                            );
                        } else {
                            // 回退创建简单圆形
                            currentProjectileDisplay = new PIXI.Graphics();
                            currentProjectileDisplay.beginFill(newProjectile.eggGameColor || 0xFFFFFF);
                            currentProjectileDisplay.drawCircle(0, -5, 9);
                            currentProjectileDisplay.endFill();
                        }
                    } else {
                        // 创建泡泡预览
                        if (this.rootManager) {
                            currentProjectileDisplay = this.rootManager.createBubble(0, -5, newProjectile.bubbleColor || 0xFFFFFF, 9);
                        } else {
                            // 回退创建简单圆形
                            currentProjectileDisplay = new PIXI.Graphics();
                            currentProjectileDisplay.beginFill(newProjectile.bubbleColor || 0xFFFFFF);
                            currentProjectileDisplay.drawCircle(0, -5, 9);
                            currentProjectileDisplay.endFill();
                        }
                    }
                    
                    currentProjectileDisplay.scale.set(0.8); // 进一步缩小作为预览
                    shooterContainer.addChild(currentProjectileDisplay);
                }
                
                if (this.debug) {
                    console.log('发射器自定义发射物已更新，新颜色:', newProjectile.eggGameColor?.toString(16));
                }
            },
            
            // 手动触发瞄准
            aim: (targetX, targetY) => {
                isAiming = true;
                updateAimLine(targetX, targetY);
            },
            
            // 手动发射
            shoot: () => {
                return shoot();
            },
            
            // 停止瞄准
            stopAiming: () => {
                isAiming = false;
                // 保持当前瞄准线角度，不恢复到默认位置
                const fixedLength = 100;
                const endX = Math.cos(currentAimAngle) * fixedLength;
                const endY = Math.sin(currentAimAngle) * fixedLength;
                
                aimLine.clear();
                const lineWidth = 2 + currentPower * 2;
                const arrowColor = currentPower > 0.5 ? 0xFF6B6B : 0xFFAAAA;
                this.drawDashedLine(aimLine, 0, 0, endX, endY, 0xFFFF00, lineWidth, 8, 4);
                this.drawArrow(aimLine, endX, endY, currentAimAngle, arrowColor, 15, 2);
            },
            
            // 设置发射力度
            setPower: (power) => {
                currentPower = Math.max(0, Math.min(1, power)); // 确保在0-1范围内
                // 立即更新瞄准线显示
                if (!isAiming) {
                    updateAimLine(0, 0);
                }
            },
            
            // 获取当前力度
            getPower: () => {
                return currentPower;
            },
            
            // 获取状态
            getState: () => ({
                isAiming,
                currentAngle: currentAimAngle,
                currentPower: currentPower,
                position: { x: shooterContainer.x, y: shooterContainer.y }
            }),
            
            // 销毁
            destroy: () => {
                if (interactiveArea) {
                    interactiveArea.off('pointermove');
                    interactiveArea.off('pointerdown'); 
                    interactiveArea.off('pointerup');
                    interactiveArea.off('pointerupoutside');
                }
                
                if (currentProjectileDisplay) {
                    currentProjectileDisplay.destroy();
                    currentProjectileDisplay = null;
                }
                
                shooterContainer.destroy({ children: true });
            },
            
            // 更新发射回调方法
            updateOnShootCallback: (newCallback) => {
                finalConfig.onShoot = newCallback;
            }
        };
    }

    /**
     * 创建发射特效的辅助方法
     * @param {PIXI.Container} container - 容器
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {number} power - 发射力度(0-1)，影响特效强度
     */
    createShootingEffect(container, x, y, power = 1) {
        const sparkCount = Math.max(3, Math.floor(6 * power)); // 力度影响火花数量
        for (let i = 0; i < sparkCount; i++) {
            const spark = new PIXI.Graphics();
            spark.beginFill(0xFFFF00, 0.8);
            const sparkSize = (Math.random() * 3 + 2) * power; // 力度影响火花大小
            spark.drawCircle(0, 0, sparkSize);
            spark.endFill();
            
            const spreadRange = 15 * power; // 力度影响散布范围
            spark.x = x + Math.random() * spreadRange - spreadRange / 2;
            spark.y = y + Math.random() * spreadRange - spreadRange / 2;
            container.addChild(spark);
            
            // 火花动画
            const startTime = Date.now();
            const direction = Math.random() * Math.PI * 2;
            const speed = (Math.random() * 2 + 1) * power; // 力度影响移动速度
            
            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = elapsed / 400;
                
                if (progress < 1) {
                    spark.x += Math.cos(direction) * speed;
                    spark.y += Math.sin(direction) * speed;
                    spark.alpha = (1 - progress) * power; // 力度影响透明度
                    spark.scale.set((1 + progress * 0.5) * power);
                    requestAnimationFrame(animate);
                } else {
                    container.removeChild(spark);
                    spark.destroy();
                }
            };
            animate();
        }
    }

    /**
     * 绘制虚线
     * @param {PIXI.Graphics} graphics - 图形对象
     * @param {number} x1 - 起点X
     * @param {number} y1 - 起点Y
     * @param {number} x2 - 终点X
     * @param {number} y2 - 终点Y
     * @param {number} color - 颜色
     * @param {number} lineWidth - 线宽
     * @param {number} dashLength - 实线长度
     * @param {number} gapLength - 间隔长度
     */
    drawDashedLine(graphics, x1, y1, x2, y2, color = 0xFFFF00, lineWidth = 2, dashLength = 8, gapLength = 4) {
        graphics.lineStyle(lineWidth, color);
        
        const dx = x2 - x1;
        const dy = y2 - y1;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance === 0) return;
        
        const unitX = dx / distance;
        const unitY = dy / distance;
        
        let currentDistance = 0;
        let isDash = true;
        
        graphics.moveTo(x1, y1);
        
        while (currentDistance < distance) {
            const segmentLength = isDash ? dashLength : gapLength;
            const remainingDistance = distance - currentDistance;
            const actualLength = Math.min(segmentLength, remainingDistance);
            
            const endX = x1 + (currentDistance + actualLength) * unitX;
            const endY = y1 + (currentDistance + actualLength) * unitY;
            
            if (isDash) {
                graphics.lineTo(endX, endY);
            } else {
                graphics.moveTo(endX, endY);
            }
            
            currentDistance += actualLength;
            isDash = !isDash;
        }
    }

    /**
     * 绘制箭头
     * @param {PIXI.Graphics} graphics - 图形对象
     * @param {number} x - 箭头尖端X坐标
     * @param {number} y - 箭头尖端Y坐标
     * @param {number} angle - 箭头角度（弧度）
     * @param {number} color - 颜色
     * @param {number} size - 箭头大小
     * @param {number} lineWidth - 线宽
     */
    drawArrow(graphics, x, y, angle, color = 0xFF6B6B, size = 15, lineWidth = 2) {
        graphics.lineStyle(lineWidth, color);
        graphics.beginFill(color, 0.8);
        
        // 计算箭头的三个点
        const arrowLength = size;
        const arrowWidth = size * 0.6;
        
        // 箭头尖端（已知）
        const tipX = x;
        const tipY = y;
        
        // 左翼点
        const leftAngle = angle + Math.PI - Math.PI / 6;
        const leftX = tipX + Math.cos(leftAngle) * arrowLength;
        const leftY = tipY + Math.sin(leftAngle) * arrowLength;
        
        // 右翼点
        const rightAngle = angle + Math.PI + Math.PI / 6;
        const rightX = tipX + Math.cos(rightAngle) * arrowLength;
        const rightY = tipY + Math.sin(rightAngle) * arrowLength;
        
        // 绘制箭头
        graphics.moveTo(tipX, tipY);
        graphics.lineTo(leftX, leftY);
        graphics.moveTo(tipX, tipY);
        graphics.lineTo(rightX, rightY);
        
        // 填充箭头三角形
        graphics.moveTo(tipX, tipY);
        graphics.lineTo(leftX, leftY);
        graphics.lineTo(rightX, rightY);
        graphics.lineTo(tipX, tipY);
        graphics.endFill();
    }

    /**
     * 设置调试模式
     * @param {boolean} enabled - 是否启用调试
     */
    setDebug(enabled) {
        this.debug = enabled;
        console.log(`[ShooterManager] 调试模式${enabled ? '开启' : '关闭'}`);
    }
};

// 暂时不自动实例化，等待RootManager初始化时传递引用
console.log('[ShooterManager] 发射器管理器类已定义，等待RootManager初始化');
