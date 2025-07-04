/**
 * 渲染管理器 - 负责所有图形绘制和视觉效果
 * 从RootManager中拆分出的渲染相关功能
 */
class RenderManager {
    constructor(gameConfig = null) {
        this.config = gameConfig || window.gameConfig || {};
        
        // 初始化颜色配置
        this.gameEggColors = this.config.colors?.gameEggs || [
            0xFF0000, 0xFFFF00, 0xFF69B4, 0x0066FF, 0x00FF00, 0x9933FF
        ];
        
        this.bubbleColors = this.config.colors?.decorative || [
            0xFF6B6B, 0x4ECDC4, 0x45B7D1, 0x96CEB4, 0xFECA57, 
            0xFF9FF3, 0x54A0FF, 0x5F27CD, 0x00D2D3, 0xFF6348
        ];
        
        console.log('RenderManager: 已初始化');
    }

    /**
     * 获取随机游戏蛋颜色
     */
    getRandomGameEggColor() {
        return this.gameEggColors[Math.floor(Math.random() * this.gameEggColors.length)];
    }

    /**
     * 获取指定索引的游戏蛋颜色
     */
    getGameEggColor(index) {
        if (index >= 0 && index < this.gameEggColors.length) {
            return this.gameEggColors[index];
        }
        return this.gameEggColors[0];
    }

    /**
     * 获取所有游戏蛋颜色
     */
    getGameEggColors() {
        return [...this.gameEggColors];
    }

    /**
     * 获取随机装饰性泡泡颜色
     */
    getRandomBubbleColor() {
        return this.bubbleColors[Math.floor(Math.random() * this.bubbleColors.length)];
    }

    /**
     * 创建泡泡
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {number} color - 颜色
     * @param {number} radius - 半径
     * @param {boolean} interactive - 是否可交互
     * @param {boolean} hasHoverEffect - 是否有悬停效果
     * @returns {PIXI.Container} 泡泡容器
     */
    createBubble(x = 0, y = 0, color = null, radius = 20, interactive = false, hasHoverEffect = false) {
        // 如果没有指定颜色，随机选择一个
        let finalColor = color;
        if (finalColor === null) {
            finalColor = this.getRandomBubbleColor();
        }
        
        // 计算蛋形尺寸
        const eggWidth = radius * 1.6;  // 蛋形宽度稍小于直径
        const eggHeight = radius * 2;   // 蛋形高度等于直径
        
        // 使用createEggShape方法创建蛋形泡泡
        const eggContainer = this.createEggShape(x, y, eggWidth, eggHeight, finalColor, true);
        
        // 添加兼容性属性
        eggContainer.radius = radius;
        eggContainer.bubbleColor = finalColor;
        
        // 添加交互性
        if (interactive) {
            eggContainer.interactive = true;
            eggContainer.buttonMode = true;
            
            if (hasHoverEffect) {
                eggContainer.on('pointerover', () => {
                    eggContainer.scale.set(1.1);
                    eggContainer.alpha = 0.8;
                });
                
                eggContainer.on('pointerout', () => {
                    eggContainer.scale.set(1.0);
                    eggContainer.alpha = 1.0;
                });
            }
        }
        
        return eggContainer;
    }

    /**
     * 创建Step1专用泡泡
     */
    createStep1Bubble(x = 0, y = 0, color = null, radius = 20) {
        return this.createBubble(x, y, color, radius, false, false);
    }

    /**
     * 创建发射用泡泡
     */
    createShootingBubble(x = 0, y = 0, color = null, radius = 18) {
        return this.createBubble(x, y, color, radius, false, false);
    }

    /**
     * 创建可交互泡泡
     */
    createInteractiveBubble(x = 0, y = 0, color = null, radius = 20) {
        return this.createBubble(x, y, color, radius, true, true);
    }

    /**
     * 绘制虚线
     * @param {PIXI.Graphics} graphics - 图形对象
     * @param {number} startX - 起始X
     * @param {number} startY - 起始Y
     * @param {number} endX - 结束X
     * @param {number} endY - 结束Y
     * @param {number} color - 颜色
     * @param {number} width - 线宽
     * @param {number} dashLength - 虚线长度
     * @param {number} gapLength - 间隔长度
     */
    drawDashedLine(graphics, startX, startY, endX, endY, color = 0xFFFFFF, width = 2, dashLength = 10, gapLength = 5) {
        const totalLength = Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2);
        const angle = Math.atan2(endY - startY, endX - startX);
        
        const unitLength = dashLength + gapLength;
        const segments = Math.floor(totalLength / unitLength);
        const remainder = totalLength % unitLength;
        
        graphics.lineStyle(width, color, 1);
        
        let currentX = startX;
        let currentY = startY;
        
        // 绘制完整的虚线段
        for (let i = 0; i < segments; i++) {
            graphics.moveTo(currentX, currentY);
            
            const dashEndX = currentX + Math.cos(angle) * dashLength;
            const dashEndY = currentY + Math.sin(angle) * dashLength;
            graphics.lineTo(dashEndX, dashEndY);
            
            currentX = currentX + Math.cos(angle) * unitLength;
            currentY = currentY + Math.sin(angle) * unitLength;
        }
        
        // 绘制剩余部分
        if (remainder > 0) {
            graphics.moveTo(currentX, currentY);
            const remainingDashLength = Math.min(remainder, dashLength);
            const finalX = currentX + Math.cos(angle) * remainingDashLength;
            const finalY = currentY + Math.sin(angle) * remainingDashLength;
            graphics.lineTo(finalX, finalY);
        }
    }

    /**
     * 绘制箭头
     * @param {PIXI.Graphics} graphics - 图形对象
     * @param {number} endX - 箭头尖端X
     * @param {number} endY - 箭头尖端Y
     * @param {number} angle - 角度
     * @param {number} color - 颜色
     * @param {number} length - 箭头长度
     * @param {number} width - 箭头宽度
     */
    drawArrow(graphics, endX, endY, angle, color = 0xFFFFFF, length = 20, width = 3) {
        graphics.lineStyle(width, color, 1);
        
        // 计算箭头两翼的坐标
        const arrowAngle1 = angle + Math.PI * 0.8;
        const arrowAngle2 = angle - Math.PI * 0.8;
        
        const arrowX1 = endX + Math.cos(arrowAngle1) * length;
        const arrowY1 = endY + Math.sin(arrowAngle1) * length;
        
        const arrowX2 = endX + Math.cos(arrowAngle2) * length;
        const arrowY2 = endY + Math.sin(arrowAngle2) * length;
        
        // 绘制箭头
        graphics.moveTo(endX, endY);
        graphics.lineTo(arrowX1, arrowY1);
        graphics.moveTo(endX, endY);
        graphics.lineTo(arrowX2, arrowY2);
    }

    /**
     * 创建蛋形形状
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {number} width - 宽度
     * @param {number} height - 高度
     * @param {number} color - 颜色
     * @param {boolean} hasHighlight - 是否有高光
     * @param {number} rotation - 旋转角度
     * @returns {PIXI.Container} 蛋形容器
     */
    createEggShape(x = 0, y = 0, width = 60, height = 80, color = 0xFFFFFF, hasHighlight = true, rotation = 0) {
        const container = new PIXI.Container();
        container.x = x;
        container.y = y;
        container.rotation = rotation;

        // 创建蛋形主体
        const eggGraphics = new PIXI.Graphics();
        
        // 使用贝塞尔曲线绘制蛋形
        const centerX = 0;
        const centerY = 0;
        const halfWidth = width / 2;
        const halfHeight = height / 2;
        
        eggGraphics.beginFill(color, 1);
        eggGraphics.lineStyle(1, 0x000000, 0.1);
        
        // 绘制蛋形路径
        eggGraphics.moveTo(centerX, centerY - halfHeight);
        
        // 上半部分 - 较尖
        eggGraphics.bezierCurveTo(
            centerX + halfWidth * 0.8, centerY - halfHeight * 0.8,
            centerX + halfWidth, centerY - halfHeight * 0.2,
            centerX + halfWidth, centerY
        );
        
        // 下半部分 - 较圆
        eggGraphics.bezierCurveTo(
            centerX + halfWidth, centerY + halfHeight * 0.4,
            centerX + halfWidth * 0.6, centerY + halfHeight,
            centerX, centerY + halfHeight
        );
        
        eggGraphics.bezierCurveTo(
            centerX - halfWidth * 0.6, centerY + halfHeight,
            centerX - halfWidth, centerY + halfHeight * 0.4,
            centerX - halfWidth, centerY
        );
        
        eggGraphics.bezierCurveTo(
            centerX - halfWidth, centerY - halfHeight * 0.2,
            centerX - halfWidth * 0.8, centerY - halfHeight * 0.8,
            centerX, centerY - halfHeight
        );
        
        eggGraphics.endFill();
        
        container.addChild(eggGraphics);

        // 添加高光效果
        if (hasHighlight) {
            const highlight = new PIXI.Graphics();
            const highlightColor = this._getLighterColor(color);
            
            highlight.beginFill(highlightColor, 0.6);
            highlight.drawEllipse(
                centerX - halfWidth * 0.3, 
                centerY - halfHeight * 0.3, 
                halfWidth * 0.3, 
                halfHeight * 0.2
            );
            highlight.endFill();
            
            container.addChild(highlight);
        }

        // 存储蛋形属性（与RootManager兼容）
        container.eggColor = color;
        container.eggWidth = width;
        container.eggHeight = height;
        container.hasHighlight = hasHighlight;
        container.radius = Math.min(width, height) / 2; // 兼容性属性
        container.bubbleColor = color; // 兼容性属性

        return container;
    }

    /**
     * 创建爆炸效果
     * @param {PIXI.Container} container - 父容器
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {object} options - 选项
     */
    createExplosionEffect(container, x, y, options = {}) {
        const config = {
            particleCount: 8,
            maxRadius: 50,
            duration: 1000,
            colors: [0xFFFF00, 0xFF6600, 0xFF0000, 0xFFFFFF],
            ...options
        };

        // 创建粒子
        for (let i = 0; i < config.particleCount; i++) {
            const particle = new PIXI.Graphics();
            const color = config.colors[Math.floor(Math.random() * config.colors.length)];
            const size = Math.random() * 4 + 2;
            
            particle.beginFill(color, 0.8);
            particle.drawCircle(0, 0, size);
            particle.endFill();
            
            particle.x = x;
            particle.y = y;
            
            container.addChild(particle);
            
            // 粒子动画
            const angle = (Math.PI * 2 * i) / config.particleCount;
            const speed = Math.random() * 3 + 2;
            const targetX = x + Math.cos(angle) * config.maxRadius;
            const targetY = y + Math.sin(angle) * config.maxRadius;
            
            let startTime = Date.now();
            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = elapsed / config.duration;
                
                if (progress < 1) {
                    particle.x = x + (targetX - x) * progress;
                    particle.y = y + (targetY - y) * progress;
                    particle.alpha = 1 - progress;
                    particle.scale.set(1 + progress * 2);
                    requestAnimationFrame(animate);
                } else {
                    container.removeChild(particle);
                    particle.destroy();
                }
            };
            animate();
        }
    }

    /**
     * 创建发射特效
     * @param {PIXI.Container} container - 父容器
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {number} power - 力度
     */
    createShootingEffect(container, x, y, power = 1) {
        // 创建发射特效圆环
        const effect = new PIXI.Graphics();
        const maxRadius = 30 * power;
        const minRadius = 10 * power;
        
        // 绘制能量圆环
        effect.lineStyle(3, 0xFFFFFF, 0.8);
        effect.drawCircle(x, y, minRadius);
        
        effect.lineStyle(2, 0x00FFFF, 0.6);
        effect.drawCircle(x, y, maxRadius * 0.7);
        
        container.addChild(effect);
        
        // 动画效果
        let scale = 0.5;
        let alpha = 1;
        
        const animate = () => {
            scale += 0.1;
            alpha -= 0.05;
            
            effect.scale.set(scale);
            effect.alpha = alpha;
            
            if (alpha > 0) {
                requestAnimationFrame(animate);
            } else {
                container.removeChild(effect);
                effect.destroy();
            }
        };
        
        animate();
    }

    /**
     * 获取更亮的颜色（用于高光）
     * @private
     */
    _getLighterColor(color) {
        const r = (color >> 16) & 0xFF;
        const g = (color >> 8) & 0xFF;
        const b = color & 0xFF;
        
        const lighterR = Math.min(255, Math.floor(r + (255 - r) * 0.4));
        const lighterG = Math.min(255, Math.floor(g + (255 - g) * 0.4));
        const lighterB = Math.min(255, Math.floor(b + (255 - b) * 0.4));
        
        return (lighterR << 16) | (lighterG << 8) | lighterB;
    }

    /**
     * 获取调试信息
     */
    getDebugInfo() {
        return {
            renderManager: this.constructor.name,
            gameEggColors: this.gameEggColors.length,
            bubbleColors: this.bubbleColors.length,
            configValid: !!this.config
        };
    }
}

// 暴露到全局
window.RenderManager = RenderManager;
