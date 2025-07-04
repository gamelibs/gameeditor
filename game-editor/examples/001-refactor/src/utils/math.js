// 数学工具函数
class MathUtils {
    // 计算两点间距离
    static distance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    // 计算角度（弧度）
    static angle(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1);
    }
    
    // 角度转弧度
    static toRadians(degrees) {
        return degrees * Math.PI / 180;
    }
    
    // 弧度转角度
    static toDegrees(radians) {
        return radians * 180 / Math.PI;
    }
    
    // 限制值在范围内
    static clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }
    
    // 线性插值
    static lerp(start, end, t) {
        return start + (end - start) * t;
    }
    
    // 检查点是否在圆内
    static pointInCircle(px, py, cx, cy, radius) {
        return this.distance(px, py, cx, cy) <= radius;
    }
    
    // 检查两个圆是否相交
    static circlesIntersect(x1, y1, r1, x2, y2, r2) {
        return this.distance(x1, y1, x2, y2) <= (r1 + r2);
    }
    
    // 随机整数
    static randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    
    // 随机浮点数
    static randomFloat(min, max) {
        return Math.random() * (max - min) + min;
    }
    
    // 六边形网格坐标转换
    static hexToPixel(col, row, cellWidth, cellHeight) {
        const x = col * cellWidth + (row % 2) * (cellWidth / 2);
        const y = row * cellHeight * 0.75;
        return { x, y };
    }
    
    // 像素坐标转六边形网格
    static pixelToHex(x, y, cellWidth, cellHeight) {
        const row = Math.floor(y / (cellHeight * 0.75));
        const col = Math.floor((x - (row % 2) * (cellWidth / 2)) / cellWidth);
        return { col, row };
    }
    
    // 获取六边形相邻格子
    static getHexNeighbors(col, row) {
        const isEvenRow = row % 2 === 0;
        const neighbors = [];
        
        if (isEvenRow) {
            // 偶数行
            neighbors.push(
                { col: col - 1, row: row - 1 },
                { col: col, row: row - 1 },
                { col: col - 1, row: row },
                { col: col + 1, row: row },
                { col: col - 1, row: row + 1 },
                { col: col, row: row + 1 }
            );
        } else {
            // 奇数行
            neighbors.push(
                { col: col, row: row - 1 },
                { col: col + 1, row: row - 1 },
                { col: col - 1, row: row },
                { col: col + 1, row: row },
                { col: col, row: row + 1 },
                { col: col + 1, row: row + 1 }
            );
        }
        
        return neighbors;
    }
}
