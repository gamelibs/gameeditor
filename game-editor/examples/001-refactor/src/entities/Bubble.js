// 泡泡实体类
class Bubble extends PIXI.Sprite {
    constructor(color, texture) {
        super(texture);
        
        this.bubbleColor = color;
        this.gridCol = -1;
        this.gridRow = -1;
        this.isMoving = false;
        this.velocity = { x: 0, y: 0 };
        this.radius = GAME_CONFIG.GRID.DESKTOP.CELL_WIDTH / 2;
        
        // 设置锚点为中心
        this.anchor.set(0.5);
        
        // 添加蛋形动画效果
        this.interactive = true;
        this.setupAnimations();
    }
    
    setupAnimations() {
        // 悬停效果
        this.on('pointerover', () => {
            if (!this.isMoving) {
                this.scale.set(1.1);
            }
        });
        
        this.on('pointerout', () => {
            if (!this.isMoving) {
                this.scale.set(1.0);
            }
        });
    }
    
    // 设置网格位置
    setGridPosition(col, row) {
        this.gridCol = col;
        this.gridRow = row;
        
        const pos = MathUtils.hexToPixel(
            col, 
            row, 
            GAME_CONFIG.GRID.DESKTOP.CELL_WIDTH,
            GAME_CONFIG.GRID.DESKTOP.CELL_HEIGHT
        );
        
        this.x = pos.x;
        this.y = pos.y;
    }
    
    // 移动到指定位置
    moveTo(targetX, targetY, speed = GAME_CONFIG.PHYSICS.SHOOTING_SPEED) {
        this.isMoving = true;
        
        const distance = MathUtils.distance(this.x, this.y, targetX, targetY);
        const time = distance / speed;
        
        return new Promise((resolve) => {
            // 使用PIXI的动画系统
            const startX = this.x;
            const startY = this.y;
            let elapsed = 0;
            
            const animate = (delta) => {
                elapsed += delta * 0.016; // 假设60fps
                
                if (elapsed >= time) {
                    this.x = targetX;
                    this.y = targetY;
                    this.isMoving = false;
                    this.app?.ticker?.remove(animate);
                    resolve();
                } else {
                    const progress = elapsed / time;
                    this.x = MathUtils.lerp(startX, targetX, progress);
                    this.y = MathUtils.lerp(startY, targetY, progress);
                }
            };
            
            if (this.parent && this.parent.parent && this.parent.parent.app) {
                this.parent.parent.app.ticker.add(animate);
            } else {
                // 备用动画方法
                setTimeout(() => {
                    this.x = targetX;
                    this.y = targetY;
                    this.isMoving = false;
                    resolve();
                }, time * 1000);
            }
        });
    }
    
    // 弹跳效果
    bounce() {
        this.velocity.y *= -GAME_CONFIG.PHYSICS.BOUNCE_DAMPING;
        this.velocity.x *= GAME_CONFIG.PHYSICS.BOUNCE_DAMPING;
    }
    
    // 应用物理效果
    applyPhysics(deltaTime) {
        if (this.isMoving) {
            this.velocity.y += GAME_CONFIG.PHYSICS.GRAVITY * deltaTime;
            this.x += this.velocity.x * deltaTime;
            this.y += this.velocity.y * deltaTime;
        }
    }
    
    // 检查与其他泡泡的碰撞
    checkCollision(otherBubble) {
        return MathUtils.circlesIntersect(
            this.x, this.y, this.radius,
            otherBubble.x, otherBubble.y, otherBubble.radius
        );
    }
    
    // 泡泡爆炸效果
    pop() {
        return new Promise((resolve) => {
            // 缩放动画
            const scaleAnimation = () => {
                this.scale.x += 0.1;
                this.scale.y += 0.1;
                this.alpha -= 0.1;
                
                if (this.alpha <= 0) {
                    this.visible = false;
                    resolve();
                } else {
                    requestAnimationFrame(scaleAnimation);
                }
            };
            
            scaleAnimation();
        });
    }
    
    // 创建粒子效果
    createPopEffect() {
        const particles = [];
        const particleCount = 8;
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            const particle = new PIXI.Graphics();
            
            particle.beginFill(this.tint || 0xFFFFFF);
            particle.drawCircle(0, 0, 3);
            particle.endFill();
            
            particle.x = this.x;
            particle.y = this.y;
            
            const speed = MathUtils.randomFloat(2, 5);
            particle.velocity = {
                x: Math.cos(angle) * speed,
                y: Math.sin(angle) * speed
            };
            
            particles.push(particle);
            
            if (this.parent) {
                this.parent.addChild(particle);
            }
        }
        
        // 动画粒子
        const animateParticles = () => {
            particles.forEach(particle => {
                particle.x += particle.velocity.x;
                particle.y += particle.velocity.y;
                particle.velocity.y += 0.2; // 重力
                particle.alpha -= 0.02;
                
                if (particle.alpha <= 0 && particle.parent) {
                    particle.parent.removeChild(particle);
                }
            });
            
            if (particles.some(p => p.alpha > 0)) {
                requestAnimationFrame(animateParticles);
            }
        };
        
        animateParticles();
    }
    
    // 获取泡泡类型（用于匹配检测）
    getType() {
        return this.bubbleColor;
    }
    
    // 检查是否可以移动到指定网格位置
    canMoveTo(col, row, grid) {
        // 检查边界
        if (col < 0 || col >= grid.width || row < 0) {
            return false;
        }
        
        // 检查是否已被占用
        return !grid.getBubble(col, row);
    }
    
    // 销毁泡泡
    destroy() {
        if (this.parent) {
            this.parent.removeChild(this);
        }
        super.destroy();
    }
}
