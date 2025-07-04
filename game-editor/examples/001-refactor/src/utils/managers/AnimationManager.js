/**
 * 动画管理器
 * 负责游戏中所有动画效果的创建和管理
 */
class AnimationManager {
    constructor(config = null) {
        // 使用全局配置或传入的配置
        this.config = config || window.gameConfig;
        
        // 动画实例管理
        this.activeAnimations = new Map();
        this.animationId = 0;
        
        // 性能统计
        this.stats = {
            totalAnimations: 0,
            activeCount: 0,
            completedCount: 0
        };
        
        if (!this.config) {
            console.warn('AnimationManager: 未找到配置，使用默认动画设置');
            this._initDefaultConfig();
        }
    }

    /**
     * 初始化默认配置
     * @private
     */
    _initDefaultConfig() {
        this.config = {
            animation: {
                fallingSpeed: { min: 4, max: 12 },
                gravity: 0.3,
                explosion: {
                    particleCount: 8,
                    radius: 50,
                    duration: 1000
                },
                elimination: {
                    pulseDuration: 500,
                    minAlpha: 0.3,
                    maxAlpha: 1.0
                }
            }
        };
    }

    /**
     * 创建掉落动画
     * @param {Array} eggs - 要掉落的蛋数组 [{row, col, egg}, ...]
     * @param {Function} onComplete - 完成回调
     * @param {Function} onEggLanded - 单个蛋着陆回调
     * @returns {string} 动画ID
     */
    createFallingAnimation(eggs, onComplete = null, onEggLanded = null) {
        if (!eggs || eggs.length === 0) {
            if (onComplete) onComplete([]);
            return null;
        }

        const animationId = this._generateAnimationId();
        const animationData = {
            id: animationId,
            type: 'falling',
            eggs: eggs,
            startTime: Date.now(),
            onComplete,
            onEggLanded,
            isActive: true
        };

        console.log(`AnimationManager: 开始掉落动画 ${animationId}，蛋数量: ${eggs.length}`);

        // 为每个蛋设置初始掉落参数
        eggs.forEach((eggData, index) => {
            const { egg } = eggData;
            if (!egg) return;

            // 标记为掉落状态
            egg.isFalling = true;
            
            // 设置掉落速度
            const speedConfig = this.config.animation.fallingSpeed;
            const baseSpeed = speedConfig.min + Math.random() * (speedConfig.max - speedConfig.min);
            const delay = index * 50; // 每个蛋延迟50ms开始掉落
            
            egg.fallingVelocityX = (Math.random() - 0.5) * 2; // 轻微的水平随机
            egg.fallingVelocityY = baseSpeed;
            egg.fallingStartTime = Date.now() + delay;
            egg.fallingGravity = this.config.animation.gravity;
        });

        this.activeAnimations.set(animationId, animationData);
        this.stats.totalAnimations++;
        this.stats.activeCount++;

        // 启动动画循环
        this._startAnimationLoop(animationId);

        return animationId;
    }

    /**
     * 创建爆炸效果
     * @param {PIXI.Container} container - 父容器
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {Object} options - 爆炸选项
     * @returns {string} 动画ID
     */
    createExplosionEffect(container, x, y, options = {}) {
        const config = {
            particleCount: options.particleCount || this.config.animation.explosion.particleCount,
            radius: options.radius || this.config.animation.explosion.radius,
            duration: options.duration || this.config.animation.explosion.duration,
            colors: options.colors || [0xFF6B6B, 0xFFE66D, 0x4ECDC4, 0xFF8A80],
            ...options
        };

        const animationId = this._generateAnimationId();
        const particles = [];

        // 创建粒子
        for (let i = 0; i < config.particleCount; i++) {
            const angle = (Math.PI * 2 * i) / config.particleCount + Math.random() * 0.5;
            const speed = Math.random() * 8 + 4;
            const color = config.colors[Math.floor(Math.random() * config.colors.length)];

            const particle = new PIXI.Graphics();
            particle.beginFill(color);
            particle.drawCircle(0, 0, Math.random() * 3 + 2);
            particle.endFill();
            
            particle.x = x;
            particle.y = y;
            particle.velocityX = Math.cos(angle) * speed;
            particle.velocityY = Math.sin(angle) * speed;
            particle.gravity = 0.3;
            particle.life = 1.0;
            particle.decay = 1.0 / config.duration * 16.67; // 60fps

            container.addChild(particle);
            particles.push(particle);
        }

        const animationData = {
            id: animationId,
            type: 'explosion',
            particles,
            container,
            startTime: Date.now(),
            duration: config.duration,
            isActive: true
        };

        this.activeAnimations.set(animationId, animationData);
        this.stats.totalAnimations++;
        this.stats.activeCount++;

        // 启动爆炸动画循环
        this._startExplosionLoop(animationId);

        return animationId;
    }

    /**
     * 创建消除标记动画（脉冲效果）
     * @param {PIXI.DisplayObject} egg - 蛋对象
     * @param {Object} options - 动画选项
     * @returns {string} 动画ID
     */
    createEliminationMarker(egg, options = {}) {
        const config = {
            duration: options.duration || this.config.animation.elimination.pulseDuration,
            minAlpha: options.minAlpha || this.config.animation.elimination.minAlpha,
            maxAlpha: options.maxAlpha || this.config.animation.elimination.maxAlpha,
            color: options.color || 0xFF0000,
            ...options
        };

        // 如果已经有标记，先移除
        if (egg.eliminationMarker) {
            this.removeEliminationMarker(egg);
        }

        const animationId = this._generateAnimationId();
        
        // 创建红圈标记
        const marker = new PIXI.Graphics();
        marker.lineStyle(3, config.color, config.maxAlpha);
        marker.drawCircle(0, 0, egg.width / 2 + 5);
        marker.x = egg.x;
        marker.y = egg.y;
        
        if (egg.parent) {
            egg.parent.addChild(marker);
        }

        egg.eliminationMarker = marker;
        egg.isMarkedForElimination = true;

        const animationData = {
            id: animationId,
            type: 'elimination_marker',
            egg,
            marker,
            startTime: Date.now(),
            duration: config.duration,
            minAlpha: config.minAlpha,
            maxAlpha: config.maxAlpha,
            isActive: true
        };

        this.activeAnimations.set(animationId, animationData);
        this.stats.totalAnimations++;
        this.stats.activeCount++;

        // 启动脉冲动画
        this._startPulseLoop(animationId);

        return animationId;
    }

    /**
     * 移除消除标记
     * @param {PIXI.DisplayObject} egg - 蛋对象
     */
    removeEliminationMarker(egg) {
        if (egg.eliminationMarker) {
            // 停止相关动画
            for (const [id, animationData] of this.activeAnimations) {
                if (animationData.type === 'elimination_marker' && animationData.egg === egg) {
                    this._stopAnimation(id);
                    break;
                }
            }

            if (egg.eliminationMarker.destroy) {
                egg.eliminationMarker.destroy();
            }
            egg.eliminationMarker = null;
            egg.isMarkedForElimination = false;
        }
    }

    /**
     * 创建简单的火花效果
     * @param {PIXI.Container} container - 父容器
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {number} power - 火花强度
     * @returns {string} 动画ID
     */
    createSparkEffect(container, x, y, power = 1) {
        const sparkCount = Math.floor(8 * power);
        const animationId = this._generateAnimationId();
        const sparks = [];

        for (let i = 0; i < sparkCount; i++) {
            const spark = new PIXI.Graphics();
            spark.beginFill(0xFFFFFF);
            spark.drawCircle(0, 0, Math.random() * 2 + 1);
            spark.endFill();

            const direction = Math.random() * Math.PI * 2;
            const speed = (Math.random() * 2 + 1) * power;

            spark.x = x;
            spark.y = y;
            spark.velocityX = Math.cos(direction) * speed;
            spark.velocityY = Math.sin(direction) * speed;
            spark.life = 1.0;
            spark.decay = 0.05;

            container.addChild(spark);
            sparks.push(spark);
        }

        const animationData = {
            id: animationId,
            type: 'spark',
            sparks,
            container,
            startTime: Date.now(),
            isActive: true
        };

        this.activeAnimations.set(animationId, animationData);
        this.stats.totalAnimations++;
        this.stats.activeCount++;

        this._startSparkLoop(animationId);

        return animationId;
    }

    /**
     * 停止指定动画
     * @param {string} animationId - 动画ID
     */
    stopAnimation(animationId) {
        this._stopAnimation(animationId);
    }

    /**
     * 停止所有动画
     */
    stopAllAnimations() {
        const ids = Array.from(this.activeAnimations.keys());
        ids.forEach(id => this._stopAnimation(id));
    }

    /**
     * 清理所有动画资源
     */
    cleanup() {
        this.stopAllAnimations();
        this.activeAnimations.clear();
        this.stats = {
            totalAnimations: 0,
            activeCount: 0,
            completedCount: 0
        };
    }

    /**
     * 获取动画统计信息
     * @returns {Object} 统计信息
     */
    getStats() {
        return { ...this.stats };
    }

    // ===================
    // 私有方法
    // ===================

    /**
     * 生成动画ID
     * @private
     */
    _generateAnimationId() {
        return `anim_${++this.animationId}_${Date.now()}`;
    }

    /**
     * 停止动画（内部方法）
     * @private
     */
    _stopAnimation(animationId) {
        const animationData = this.activeAnimations.get(animationId);
        if (animationData) {
            animationData.isActive = false;
            this.activeAnimations.delete(animationId);
            this.stats.activeCount--;
            this.stats.completedCount++;
        }
    }

    /**
     * 启动掉落动画循环
     * @private
     */
    _startAnimationLoop(animationId) {
        const animationData = this.activeAnimations.get(animationId);
        if (!animationData || !animationData.isActive) return;

        const { eggs, onEggLanded, onComplete } = animationData;
        const currentTime = Date.now();
        let activeEggs = 0;
        const landedEggs = [];

        eggs.forEach(eggData => {
            const { egg } = eggData;
            if (!egg || !egg.isFalling) return;

            // 检查是否开始掉落
            if (currentTime < egg.fallingStartTime) {
                activeEggs++;
                return;
            }

            activeEggs++;

            // 更新位置
            egg.y += egg.fallingVelocityY;
            egg.x += egg.fallingVelocityX;
            egg.fallingVelocityY += egg.fallingGravity;

            // 检查是否到达底部
            if (egg.y > 350) { // 假设底部是y=350
                egg.isFalling = false;
                landedEggs.push(eggData);
                
                if (onEggLanded) {
                    onEggLanded(eggData);
                }
            }
        });

        // 如果还有活跃的蛋，继续动画
        if (activeEggs > landedEggs.length) {
            requestAnimationFrame(() => this._startAnimationLoop(animationId));
        } else {
            // 所有蛋都已着陆，完成动画
            this._stopAnimation(animationId);
            if (onComplete) {
                onComplete(landedEggs);
            }
        }
    }

    /**
     * 启动爆炸动画循环
     * @private
     */
    _startExplosionLoop(animationId) {
        const animationData = this.activeAnimations.get(animationId);
        if (!animationData || !animationData.isActive) return;

        const { particles, container } = animationData;
        let activeParticles = 0;

        particles.forEach(particle => {
            if (particle.life <= 0) return;

            activeParticles++;

            // 更新位置
            particle.x += particle.velocityX;
            particle.y += particle.velocityY;
            particle.velocityY += particle.gravity;

            // 更新生命值和透明度
            particle.life -= particle.decay;
            particle.alpha = Math.max(0, particle.life);

            if (particle.life <= 0) {
                container.removeChild(particle);
                if (particle.destroy) particle.destroy();
            }
        });

        if (activeParticles > 0) {
            requestAnimationFrame(() => this._startExplosionLoop(animationId));
        } else {
            this._stopAnimation(animationId);
        }
    }

    /**
     * 启动脉冲动画循环
     * @private
     */
    _startPulseLoop(animationId) {
        const animationData = this.activeAnimations.get(animationId);
        if (!animationData || !animationData.isActive) return;

        const { marker, minAlpha, maxAlpha, duration, startTime } = animationData;
        const elapsed = Date.now() - startTime;
        const progress = (elapsed % duration) / duration;
        
        // 计算脉冲透明度
        const alpha = minAlpha + (maxAlpha - minAlpha) * (Math.sin(progress * Math.PI * 2) * 0.5 + 0.5);
        marker.alpha = alpha;

        requestAnimationFrame(() => this._startPulseLoop(animationId));
    }

    /**
     * 启动火花动画循环
     * @private
     */
    _startSparkLoop(animationId) {
        const animationData = this.activeAnimations.get(animationId);
        if (!animationData || !animationData.isActive) return;

        const { sparks, container } = animationData;
        let activeSparks = 0;

        sparks.forEach(spark => {
            if (spark.life <= 0) return;

            activeSparks++;

            spark.x += spark.velocityX;
            spark.y += spark.velocityY;
            spark.life -= spark.decay;
            spark.alpha = spark.life;

            if (spark.life <= 0) {
                container.removeChild(spark);
                if (spark.destroy) spark.destroy();
            }
        });

        if (activeSparks > 0) {
            requestAnimationFrame(() => this._startSparkLoop(animationId));
        } else {
            this._stopAnimation(animationId);
        }
    }
}

// 暴露到全局
window.AnimationManager = AnimationManager;
