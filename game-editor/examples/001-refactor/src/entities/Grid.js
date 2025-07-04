// 网格系统
class Grid extends PIXI.Container {
    constructor(game) {
        super();
        
        this.game = game;
        this.gridConfig = game.getGridConfig();
        this.bubbles = [];
        this.width = this.gridConfig.WIDTH;
        this.baseHeight = this.gridConfig.BASE_HEIGHT;
        this.cellWidth = this.gridConfig.CELL_WIDTH;
        this.cellHeight = this.gridConfig.CELL_HEIGHT;
        
        this.init();
    }
    
    init() {
        // 初始化二维数组
        for (let row = 0; row < this.baseHeight + 5; row++) {
            this.bubbles[row] = [];
            for (let col = 0; col < this.width; col++) {
                this.bubbles[row][col] = null;
            }
        }
        
        // 生成初始泡泡
        this.generateInitialBubbles();
    }
    
    generateInitialBubbles() {
        const colors = Object.keys(GAME_CONFIG.BUBBLE_COLORS);
        
        // 生成前几行泡泡
        for (let row = 0; row < 8; row++) {
            const colCount = this.getRowWidth(row);
            for (let col = 0; col < colCount; col++) {
                if (Math.random() < 0.8) { // 80%概率生成泡泡
                    const colorIndex = Math.floor(Math.random() * colors.length);
                    const color = GAME_CONFIG.BUBBLE_COLORS[colorIndex];
                    
                    this.addBubble(col, row, color);
                }
            }
        }
    }
    
    getRowWidth(row) {
        // 六边形网格中，奇数行比偶数行少一个格子
        return row % 2 === 0 ? this.width : this.width - 1;
    }
    
    addBubble(col, row, color) {
        if (!this.isValidPosition(col, row) || this.bubbles[row][col]) {
            return null;
        }
        
        // 使用RootManager的公共蛋形方法
        const bubble = window.rootManager.createEggShape(0, 0, 32, 40, color, true);
        
        // 添加Bubble类的属性以保持兼容性
        bubble.bubbleColor = color;
        bubble.gridCol = col;
        bubble.gridRow = row;
        bubble.isMoving = false;
        bubble.velocity = { x: 0, y: 0 };
        bubble.radius = this.cellWidth / 2;
        
        // 设置网格位置
        const pos = MathUtils.hexToPixel(
            col, 
            row, 
            this.cellWidth,
            this.cellHeight
        );
        bubble.x = pos.x;
        bubble.y = pos.y;
        
        // 添加到网格和显示列表
        this.bubbles[row][col] = bubble;
        this.addChild(bubble);
        
        return bubble;
    }
    
    // 注意：createBubbleTexture方法已被移除，现在使用RootManager.createEggShape统一创建蛋形
    
    removeBubble(col, row) {
        if (!this.isValidPosition(col, row)) {
            return null;
        }
        
        const bubble = this.bubbles[row][col];
        if (bubble) {
            this.removeChild(bubble);
            this.bubbles[row][col] = null;
            bubble.destroy();
        }
        
        return bubble;
    }
    
    getBubble(col, row) {
        if (!this.isValidPosition(col, row)) {
            return null;
        }
        return this.bubbles[row][col];
    }
    
    isValidPosition(col, row) {
        if (row < 0 || row >= this.bubbles.length) {
            return false;
        }
        
        const maxCol = this.getRowWidth(row);
        return col >= 0 && col < maxCol;
    }
    
    // 寻找最近的空位置
    findNearestEmptyPosition(targetCol, targetRow) {
        // 首先检查目标位置
        if (this.isValidPosition(targetCol, targetRow) && !this.getBubble(targetCol, targetRow)) {
            return { col: targetCol, row: targetRow };
        }
        
        // 向下寻找最近的空位
        for (let row = targetRow; row < this.bubbles.length; row++) {
            const maxCol = this.getRowWidth(row);
            
            // 检查同一列
            if (targetCol < maxCol && !this.getBubble(targetCol, row)) {
                return { col: targetCol, row: row };
            }
            
            // 检查相邻列
            for (let colOffset = 1; colOffset < maxCol; colOffset++) {
                const leftCol = targetCol - colOffset;
                const rightCol = targetCol + colOffset;
                
                if (leftCol >= 0 && !this.getBubble(leftCol, row)) {
                    return { col: leftCol, row: row };
                }
                
                if (rightCol < maxCol && !this.getBubble(rightCol, row)) {
                    return { col: rightCol, row: row };
                }
            }
        }
        
        return null;
    }
    
    // 查找匹配的泡泡
    findMatches(startCol, startRow, color, visited = new Set()) {
        const key = `${startCol},${startRow}`;
        
        if (visited.has(key) || !this.isValidPosition(startCol, startRow)) {
            return [];
        }
        
        const bubble = this.getBubble(startCol, startRow);
        if (!bubble || bubble.bubbleColor !== color) {
            return [];
        }
        
        visited.add(key);
        const matches = [{ col: startCol, row: startRow, bubble: bubble }];
        
        // 检查六边形相邻位置
        const neighbors = MathUtils.getHexNeighbors(startCol, startRow);
        
        for (const neighbor of neighbors) {
            const neighborMatches = this.findMatches(neighbor.col, neighbor.row, color, visited);
            matches.push(...neighborMatches);
        }
        
        return matches;
    }
    
    // 移除匹配的泡泡
    removeMatches(matches) {
        const removedBubbles = [];
        
        for (const match of matches) {
            const bubble = this.removeBubble(match.col, match.row);
            if (bubble) {
                removedBubbles.push(bubble);
                // 播放爆炸效果
                bubble.createPopEffect();
            }
        }
        
        return removedBubbles;
    }
    
    // 查找悬空的泡泡
    findFloatingBubbles() {
        const connected = new Set();
        const floating = [];
        
        // 标记所有与顶部连接的泡泡
        for (let col = 0; col < this.getRowWidth(0); col++) {
            if (this.getBubble(col, 0)) {
                this.markConnected(col, 0, connected);
            }
        }
        
        // 找出未连接的泡泡
        for (let row = 0; row < this.bubbles.length; row++) {
            for (let col = 0; col < this.getRowWidth(row); col++) {
                const bubble = this.getBubble(col, row);
                if (bubble && !connected.has(`${col},${row}`)) {
                    floating.push({ col, row, bubble });
                }
            }
        }
        
        return floating;
    }
    
    markConnected(col, row, connected) {
        const key = `${col},${row}`;
        
        if (connected.has(key) || !this.isValidPosition(col, row) || !this.getBubble(col, row)) {
            return;
        }
        
        connected.add(key);
        
        // 递归标记相邻的泡泡
        const neighbors = MathUtils.getHexNeighbors(col, row);
        for (const neighbor of neighbors) {
            this.markConnected(neighbor.col, neighbor.row, connected);
        }
    }
    
    // 移除悬空泡泡
    removeFloatingBubbles(floating) {
        const removedBubbles = [];
        
        for (const floater of floating) {
            const bubble = this.removeBubble(floater.col, floater.row);
            if (bubble) {
                removedBubbles.push(bubble);
                
                // 添加下落动画
                this.animateFallingBubble(bubble);
            }
        }
        
        return removedBubbles;
    }
    
    animateFallingBubble(bubble) {
        // 重新添加到容器进行下落动画
        this.addChild(bubble);
        
        const fallSpeed = 5;
        const rotationSpeed = 0.1;
        
        const animate = () => {
            bubble.y += fallSpeed;
            bubble.rotation += rotationSpeed;
            bubble.alpha -= 0.02;
            
            if (bubble.y > GAME_CONFIG.HEIGHT || bubble.alpha <= 0) {
                this.removeChild(bubble);
                bubble.destroy();
            } else {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }
    
    // 下移所有泡泡（增加新行）
    moveDown(rows = 1) {
        // 从下往上移动每个泡泡
        for (let row = this.bubbles.length - 1; row >= rows; row--) {
            for (let col = 0; col < this.getRowWidth(row); col++) {
                const bubble = this.getBubble(col, row - rows);
                if (bubble) {
                    this.bubbles[row][col] = bubble;
                    this.bubbles[row - rows][col] = null;
                    
                    bubble.setGridPosition(col, row);
                }
            }
        }
        
        // 清空顶部行
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < this.getRowWidth(row); col++) {
                this.bubbles[row][col] = null;
            }
        }
    }
    
    // 添加新行
    addNewRow() {
        this.moveDown(1);
        
        // 在顶部添加新泡泡
        const colors = Object.keys(GAME_CONFIG.BUBBLE_COLORS);
        const colCount = this.getRowWidth(0);
        
        for (let col = 0; col < colCount; col++) {
            if (Math.random() < 0.7) { // 70%概率生成泡泡
                const colorIndex = Math.floor(Math.random() * colors.length);
                const color = GAME_CONFIG.BUBBLE_COLORS[colorIndex];
                
                this.addBubble(col, 0, color);
            }
        }
    }
    
    // 检查游戏是否结束
    isGameOver() {
        // 检查是否有泡泡到达底部
        const bottomRow = GAME_CONFIG.GRID.DESKTOP.BASE_HEIGHT;
        
        for (let col = 0; col < this.getRowWidth(bottomRow); col++) {
            if (this.getBubble(col, bottomRow)) {
                return true;
            }
        }
        
        return false;
    }
    
    // 检查是否胜利
    isVictory() {
        // 检查是否还有泡泡
        for (let row = 0; row < this.bubbles.length; row++) {
            for (let col = 0; col < this.getRowWidth(row); col++) {
                if (this.getBubble(col, row)) {
                    return false;
                }
            }
        }
        
        return true;
    }
    
    // 清空网格
    clear() {
        for (let row = 0; row < this.bubbles.length; row++) {
            for (let col = 0; col < this.getRowWidth(row); col++) {
                this.removeBubble(col, row);
            }
        }
    }
}
