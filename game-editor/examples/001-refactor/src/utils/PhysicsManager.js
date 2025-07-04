// 物理管理器 - 专门管理发射物的物理运动
class PhysicsManager {
    constructor(options = {}) {
        // 默认物理配置
        this.config = {
            gravity: 0.2,           // 重力加速度
            friction: 0.98,         // 摩擦系数（速度衰减）
            bounceX: 0.8,          // X轴反弹系数
            bounceY: 0.6,          // Y轴反弹系数
            maxSpeed: 15,          // 最大速度限制
            minSpeed: 0.05,        // 最小速度（低于此值停止运动）- 降低阈值
            containerBounds: {     // 容器边界
                left: -200,
                right: 200,
                top: -300,
                bottom: 300
            },
            enableGravity: true,   // 是否启用重力
            enableFriction: true,  // 是否启用摩擦
            enableBounce: true,    // 是否启用边界反弹
            debug: false,          // 调试模式
            ...options
        };

        // 活跃的发射物列表
        this.activeProjectiles = [];
        
        // 物理更新循环状态
        this.isRunning = false;
        this.lastUpdateTime = 0;
        this.ticker = null;
        
        // 回调函数
        this.callbacks = {
            onBoundaryCollision: null,    // 边界碰撞回调
            onProjectileStop: null,       // 发射物停止回调
            onProjectileUpdate: null,     // 发射物更新回调
            onProjectileDestroy: null     // 发射物销毁回调
        };
    }

    /**
     * 启动物理系统
     */
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.lastUpdateTime = Date.now();
        
        // 使用requestAnimationFrame进行更新
        const update = () => {
            if (!this.isRunning) return;
            
            const currentTime = Date.now();
            const deltaTime = (currentTime - this.lastUpdateTime) / 16.67; // 标准化到60fps
            this.lastUpdateTime = currentTime;
            
            this.update(deltaTime);
            requestAnimationFrame(update);
        };
        
        requestAnimationFrame(update);
        
        if (this.config.debug) {
            console.log('[PhysicsManager] 物理系统已启动');
        }
    }

    /**
     * 停止物理系统
     */
    stop() {
        this.isRunning = false;
        
        if (this.config.debug) {
            console.log('[PhysicsManager] 物理系统已停止');
        }
    }

    /**
     * 添加发射物到物理系统
     * @param {Object} config - 发射物配置
     * @param {PIXI.DisplayObject} config.projectile - 发射物对象
     * @param {Object} config.velocity - 初始速度 {x, y}
     * @param {number} config.power - 发射力度 (0-1)
     * @param {Object} config.physics - 物理参数覆盖
     * @returns {string} 发射物ID
     */
    addProjectile(config) {
        const {
            projectile,
            velocity,
            power = 1,
            physics = {}
        } = config;

        if (!projectile || !velocity) {
            console.warn('[PhysicsManager] 添加发射物失败：缺少必要参数');
            return null;
        }

        // 生成唯一ID
        const id = `projectile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // 合并物理配置
        const physicsConfig = {
            ...this.config,
            ...physics
        };

        // 创建发射物数据
        const projectileData = {
            id,
            projectile,
            velocity: { ...velocity },
            power,
            physics: physicsConfig,
            
            // 运动状态
            isActive: true,
            age: 0,                    // 存活时间
            distanceTraveled: 0,       // 已移动距离
            
            // 物理属性
            mass: 1,                   // 质量
            radius: projectile.radius || 18,  // 碰撞半径
            
            // 发射信息
            initialAngle: Math.atan2(velocity.y, velocity.x), // 记录初始发射角度
            initialSpeed: Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y), // 初始速度
            
            // 标记
            hasHitBoundary: false,     // 是否碰撞过边界
            bounceCount: 0,            // 反弹次数
            lastBounceTime: 0          // 最后一次反弹的时间
        };

        // 添加到活跃列表
        this.activeProjectiles.push(projectileData);

        // 启动物理系统（如果未启动）
        if (!this.isRunning) {
            this.start();
        }

        if (this.config.debug) {
            console.log(`[PhysicsManager] 添加发射物: ${id}`, projectileData);
        }

        return id;
    }

    /**
     * 移除发射物
     * @param {string} id - 发射物ID
     * @returns {boolean} 是否成功移除
     */
    removeProjectile(id) {
        const index = this.activeProjectiles.findIndex(p => p.id === id);
        if (index === -1) return false;

        const projectileData = this.activeProjectiles[index];
        
        // 触发销毁回调
        if (this.callbacks.onProjectileDestroy) {
            this.callbacks.onProjectileDestroy(projectileData);
        }

        // 从列表中移除
        this.activeProjectiles.splice(index, 1);

        if (this.config.debug) {
            console.log(`[PhysicsManager] 移除发射物: ${id}`);
        }

        return true;
    }

    /**
     * 获取发射物数据
     * @param {string} id - 发射物ID
     * @returns {Object|null} 发射物数据
     */
    getProjectile(id) {
        return this.activeProjectiles.find(p => p.id === id) || null;
    }

    /**
     * 清除所有发射物
     */
    clearAllProjectiles() {
        const count = this.activeProjectiles.length;
        
        // 逐个触发销毁回调
        this.activeProjectiles.forEach(projectileData => {
            if (this.callbacks.onProjectileDestroy) {
                this.callbacks.onProjectileDestroy(projectileData);
            }
        });

        this.activeProjectiles = [];

        if (this.config.debug) {
            console.log(`[PhysicsManager] 清除所有发射物: ${count}个`);
        }
    }

    /**
     * 物理更新主循环
     * @param {number} deltaTime - 时间间隔
     */
    update(deltaTime) {
        if (this.activeProjectiles.length === 0) {
            return;
        }

        // 更新所有活跃的发射物
        for (let i = this.activeProjectiles.length - 1; i >= 0; i--) {
            const projectileData = this.activeProjectiles[i];
            
            if (!projectileData.isActive) {
                this.activeProjectiles.splice(i, 1);
                continue;
            }

            this.updateProjectile(projectileData, deltaTime);
        }
    }

    /**
     * 更新单个发射物
     * @param {Object} projectileData - 发射物数据
     * @param {number} deltaTime - 时间间隔
     */
    updateProjectile(projectileData, deltaTime) {
        const { projectile, velocity, physics } = projectileData;

        // 记录更新前的位置
        const oldX = projectile.x;
        const oldY = projectile.y;

        // 应用重力 - 所有发射物都应该受重力影响
        if (physics.enableGravity) {
            velocity.y += physics.gravity * deltaTime;
        }

        // 应用摩擦
        if (physics.enableFriction) {
            velocity.x *= Math.pow(physics.friction, deltaTime);
            velocity.y *= Math.pow(physics.friction, deltaTime);
        }

        // 限制最大速度
        const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
        if (speed > physics.maxSpeed) {
            const scale = physics.maxSpeed / speed;
            velocity.x *= scale;
            velocity.y *= scale;
        }

        // 更新位置
        projectile.x += velocity.x * deltaTime;
        projectile.y += velocity.y * deltaTime;

        // 更新统计数据
        const distance = Math.sqrt(
            (projectile.x - oldX) ** 2 + (projectile.y - oldY) ** 2
        );
        projectileData.distanceTraveled += distance;
        projectileData.age += deltaTime;

        // 边界碰撞检测
        this.checkBoundaryCollision(projectileData);

        // 检查是否应该停止
        this.checkShouldStop(projectileData);

        // 触发更新回调
        if (this.callbacks.onProjectileUpdate) {
            this.callbacks.onProjectileUpdate(projectileData);
        }
    }

    /**
     * 边界碰撞检测
     * @param {Object} projectileData - 发射物数据
     */
    checkBoundaryCollision(projectileData) {
        const { projectile, velocity, physics } = projectileData;
        const bounds = physics.containerBounds;
        let collided = false;

        // 左右边界碰撞
        if (projectile.x - projectileData.radius <= bounds.left) {
            projectile.x = bounds.left + projectileData.radius;
            if (physics.enableBounce) {
                velocity.x = Math.abs(velocity.x) * physics.bounceX;
                projectileData.bounceCount++;
                projectileData.lastBounceTime = projectileData.age; // 记录反弹时间
            } else {
                velocity.x = 0;
            }
            collided = true;
        } else if (projectile.x + projectileData.radius >= bounds.right) {
            projectile.x = bounds.right - projectileData.radius;
            if (physics.enableBounce) {
                velocity.x = -Math.abs(velocity.x) * physics.bounceX;
                projectileData.bounceCount++;
                projectileData.lastBounceTime = projectileData.age; // 记录反弹时间
            } else {
                velocity.x = 0;
            }
            collided = true;
        }

        // 上下边界碰撞
        if (projectile.y - projectileData.radius <= bounds.top) {
            projectile.y = bounds.top + projectileData.radius;
            if (physics.enableBounce) {
                // 顶部反弹：确保有足够的向下速度
                const minBounceSpeed = 0.2; // 最小反弹速度
                let bounceSpeed = Math.abs(velocity.y) * physics.bounceY;
                bounceSpeed = Math.max(bounceSpeed, minBounceSpeed); // 确保反弹速度不会太小
                velocity.y = bounceSpeed; // 向下反弹
                projectileData.bounceCount++;
                projectileData.lastBounceTime = projectileData.age; // 记录反弹时间
            } else {
                velocity.y = 0;
            }
            collided = true;
        } else if (projectile.y + projectileData.radius >= bounds.bottom) {
            projectile.y = bounds.bottom - projectileData.radius;
            if (physics.enableBounce) {
                // 底边反弹逻辑优化：反弹次数越多，能量损失越大
                const energyLoss = Math.min(0.9, 1 - (projectileData.bounceCount * 0.1));
                velocity.y = -Math.abs(velocity.y) * physics.bounceY * energyLoss;
                projectileData.bounceCount++;
                projectileData.lastBounceTime = projectileData.age; // 记录反弹时间
            } else {
                velocity.y = 0;
            }
            collided = true;
        }

        // 触发边界碰撞回调
        if (collided) {
            projectileData.hasHitBoundary = true;
            
            if (this.callbacks.onBoundaryCollision) {
                this.callbacks.onBoundaryCollision(projectileData, {
                    left: projectile.x <= bounds.left + projectileData.radius,
                    right: projectile.x >= bounds.right - projectileData.radius,
                    top: projectile.y <= bounds.top + projectileData.radius,
                    bottom: projectile.y >= bounds.bottom - projectileData.radius
                });
            }
        }
    }

    /**
     * 检查发射物是否应该停止
     * @param {Object} projectileData - 发射物数据
     */
    checkShouldStop(projectileData) {
        const { velocity, physics, projectile } = projectileData;
        const bounds = physics.containerBounds;
        
        // 计算当前速度
        const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
        
        // 检查是否靠近底边且速度很低
        const nearBottom = projectile.y >= bounds.bottom - projectileData.radius - 10; // 距离底边10像素内
        const isSlowMoving = speed < physics.minSpeed * 2; // 速度很低
        
        // 如果靠近底边且移动缓慢，停止发射物
        if (nearBottom && isSlowMoving) {
            // 将发射物放置在底边
            projectile.y = bounds.bottom - projectileData.radius;
            this.stopProjectile(projectileData, 'settled_at_bottom');
            return;
        }
        
        // 检查是否刚刚反弹：如果刚反弹不久，不要立即停止
        const timeSinceLastBounce = projectileData.age - projectileData.lastBounceTime;
        const isRecentlyBounced = timeSinceLastBounce < 30; // 反弹后30帧内不检查停止
        
        // 如果刚刚反弹，给予更多宽容度
        if (isRecentlyBounced) {
            return; // 刚反弹的发射物暂时不检查停止条件
        }
        
        // 检查是否在垂直运动中（主要是Y方向的运动）
        const isVerticalMovement = Math.abs(velocity.y) > Math.abs(velocity.x) * 2; // Y速度是X速度的2倍以上
        const isMovingDown = velocity.y > 0; // 向下运动
        
        // 对于垂直向下运动，降低停止的速度阈值，让它能继续掉落
        let effectiveMinSpeed = physics.minSpeed;
        if (isVerticalMovement && isMovingDown && !nearBottom) {
            effectiveMinSpeed = physics.minSpeed * 0.2; // 降低到原来的20%
        }
        
        // 只有在不靠近底边且速度极低时才停止
        if (!nearBottom && speed < effectiveMinSpeed) {
            this.stopProjectile(projectileData, 'low_speed');
            return;
        }

        // 超出边界太远时销毁
        const margin = 100; // 边界外的容忍距离
        
        if (projectile.x < bounds.left - margin ||
            projectile.x > bounds.right + margin ||
            projectile.y < bounds.top - margin ||
            projectile.y > bounds.bottom + margin) {
            this.stopProjectile(projectileData, 'out_of_bounds');
            return;
        }
    }

    /**
     * 停止发射物
     * @param {Object} projectileData - 发射物数据
     * @param {string} reason - 停止原因
     */
    stopProjectile(projectileData, reason) {
        projectileData.isActive = false;
        projectileData.velocity.x = 0;
        projectileData.velocity.y = 0;

        // 触发停止回调
        if (this.callbacks.onProjectileStop) {
            this.callbacks.onProjectileStop(projectileData, reason);
        }

        if (this.config.debug) {
            console.log(`[PhysicsManager] 发射物停止: ${projectileData.id}, 原因: ${reason}`);
        }
    }

    /**
     * 设置回调函数
     * @param {string} eventName - 事件名称
     * @param {Function} callback - 回调函数
     */
    setCallback(eventName, callback) {
        if (this.callbacks.hasOwnProperty(eventName)) {
            this.callbacks[eventName] = callback;
        } else {
            console.warn(`[PhysicsManager] 未知的回调事件: ${eventName}`);
        }
    }

    /**
     * 更新物理配置
     * @param {Object} newConfig - 新的配置
     */
    updateConfig(newConfig) {
        this.config = {
            ...this.config,
            ...newConfig
        };

        if (this.config.debug) {
            console.log('[PhysicsManager] 配置已更新', this.config);
        }
    }

    /**
     * 获取物理系统状态
     * @returns {Object} 状态信息
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            activeProjectiles: this.activeProjectiles.length,
            config: { ...this.config },
            projectiles: this.activeProjectiles.map(p => ({
                id: p.id,
                position: { x: p.projectile.x, y: p.projectile.y },
                velocity: { ...p.velocity },
                age: p.age,
                distanceTraveled: p.distanceTraveled,
                bounceCount: p.bounceCount,
                isActive: p.isActive
            }))
        };
    }

    /**
     * 设置容器边界
     * @param {number} left - 左边界
     * @param {number} right - 右边界  
     * @param {number} top - 上边界
     * @param {number} bottom - 下边界
     */
    setBounds(left, right, top, bottom) {
        this.config.containerBounds = { left, right, top, bottom };
        
        if (this.config.debug) {
            console.log('[PhysicsManager] 边界已更新', this.config.containerBounds);
        }
    }

    /**
     * 获取指定位置的发射物
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {number} radius - 检测半径
     * @returns {Array} 符合条件的发射物数组
     */
    getProjectilesAt(x, y, radius = 20) {
        return this.activeProjectiles.filter(projectileData => {
            const dx = projectileData.projectile.x - x;
            const dy = projectileData.projectile.y - y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            return distance <= radius + projectileData.radius;
        });
    }

    /**
     * 销毁物理系统
     */
    destroy() {
        this.stop();
        this.clearAllProjectiles();
        
        // 清除回调
        Object.keys(this.callbacks).forEach(key => {
            this.callbacks[key] = null;
        });

        if (this.config.debug) {
            console.log('[PhysicsManager] 物理系统已销毁');
        }
    }
}

// 导出PhysicsManager类
window.PhysicsManager = PhysicsManager;
