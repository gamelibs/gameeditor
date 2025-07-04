// 轻量级泡泡物理系统 - 替代SAT.js
class BubblePhysics {
    /**
     * 圆形碰撞检测 - 针对泡泡游戏优化
     */
    static checkCircleCollision(x1, y1, r1, x2, y2, r2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance <= (r1 + r2);
    }
    
    /**
     * 快速距离检测 - 避免开平方根运算
     */
    static checkCircleCollisionFast(x1, y1, r1, x2, y2, r2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const distanceSquared = dx * dx + dy * dy;
        const radiusSum = r1 + r2;
        return distanceSquared <= (radiusSum * radiusSum);
    }
    
    /**
     * 边界碰撞检测
     */
    static checkBoundaryCollision(bubble, bounds) {
        const { x, y, radius } = bubble;
        
        return {
            left: x - radius <= bounds.left,
            right: x + radius >= bounds.right,
            top: y - radius <= bounds.top,
            bottom: y + radius >= bounds.bottom
        };
    }
    
    /**
     * 网格碰撞检测 - 针对泡泡游戏优化
     */
    static checkGridCollision(movingBubble, grid) {
        const gridX = movingBubble.x - grid.x;
        const gridY = movingBubble.y - grid.y;
        
        // 只检查附近的网格单元，而不是全部
        const cellCol = Math.floor(gridX / grid.cellWidth);
        const cellRow = Math.floor(gridY / grid.cellHeight);
        
        // 检查周围3x3的网格区域
        for (let row = cellRow - 1; row <= cellRow + 1; row++) {
            for (let col = cellCol - 1; col <= cellCol + 1; col++) {
                const staticBubble = grid.getBubble(col, row);
                if (staticBubble && staticBubble !== movingBubble) {
                    if (this.checkCircleCollisionFast(
                        gridX, gridY, movingBubble.radius,
                        staticBubble.x, staticBubble.y, staticBubble.radius
                    )) {
                        return { col, row, bubble: staticBubble };
                    }
                }
            }
        }
        
        return null;
    }
    
    /**
     * 简单的物理更新
     */
    static updatePosition(bubble, deltaTime) {
        if (!bubble.velocity) return;
        
        bubble.x += bubble.velocity.x * deltaTime;
        bubble.y += bubble.velocity.y * deltaTime;
        
        // 简单的摩擦力
        bubble.velocity.x *= 0.99;
        bubble.velocity.y *= 0.99;
        
        // 重力
        if (bubble.applyGravity) {
            bubble.velocity.y += 0.5 * deltaTime;
        }
    }
    
    /**
     * 边界反弹
     */
    static bounceOffWalls(bubble, bounds, damping = 0.8) {
        const collision = this.checkBoundaryCollision(bubble, bounds);
        
        if (collision.left || collision.right) {
            bubble.velocity.x *= -damping;
            bubble.x = collision.left ? 
                bounds.left + bubble.radius : 
                bounds.right - bubble.radius;
        }
        
        if (collision.top || collision.bottom) {
            bubble.velocity.y *= -damping;
            bubble.y = collision.top ? 
                bounds.top + bubble.radius : 
                bounds.bottom - bubble.radius;
        }
    }
}
