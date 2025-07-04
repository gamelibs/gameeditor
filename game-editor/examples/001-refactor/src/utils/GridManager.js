/**
 * 网格管理器类
 * 用于管理游戏中的网格系统，包括网格位置计算、蛋的放置等
 */
class GridManager {
    constructor(config = {}) {
        // 默认配置
        this.config = {
            rows: config.rows || 6,
            cols: config.cols || 8,
            eggRadius: config.eggRadius || 18,
            startX: config.startX || -140,
            startY: config.startY || -200,
            showGrid: config.showGrid !== undefined ? config.showGrid : true,
            gridColor: config.gridColor || 0x888888,
            gridAlpha: config.gridAlpha || 0.4
        };
        
        // 网格状态 - 二维数组存储每个位置的蛋对象
        this.grid = [];
        for (let row = 0; row < this.config.rows; row++) {
            this.grid[row] = [];
            for (let col = 0; col < this.config.cols; col++) {
                this.grid[row][col] = null;
            }
        }
        
        // PIXI 容器
        this.container = null;
        this.backgroundLayer = null; // 网格线层
        this.eggLayer = null; // 蛋层
    }
    
    /**
     * 创建网格容器并添加到父容器中
     */
    createGridContainer(parentContainer) {
        this.container = new PIXI.Container();
        
        // 创建背景网格线层
        this.backgroundLayer = new PIXI.Container();
        this.container.addChild(this.backgroundLayer);
        
        // 创建蛋层
        this.eggLayer = new PIXI.Container();
        this.container.addChild(this.eggLayer);
        
        // 如果需要显示网格线，创建网格线
        if (this.config.showGrid) {
            this.createGridLines();
        }
        
        // 添加到父容器
        parentContainer.addChild(this.container);
    }
    
    /**
     * 创建网格线（六角形布局辅助线）
     */
    createGridLines() {
        const graphics = new PIXI.Graphics();
        graphics.alpha = this.config.gridAlpha;
        
        // 创建文本容器用于显示坐标
        const textContainer = new PIXI.Container();
        
        // 为每个网格位置绘制圆形辅助线和坐标编号
        for (let row = 0; row < this.config.rows; row++) {
            for (let col = 0; col < this.config.cols; col++) {
                const pos = this.calculateGridPosition(row, col);
                
                // 绘制圆形辅助线
                graphics.lineStyle(1, this.config.gridColor);
                graphics.drawCircle(pos.x, pos.y, this.config.eggRadius);
                
                // 添加位置编号文本
                const coordinateText = new PIXI.Text(`${row},${col}`, {
                    fontFamily: 'Arial',
                    fontSize: 8,
                    fill: 0xFFFFFF,
                    align: 'center'
                });
                coordinateText.anchor.set(0.5, 0.5);
                coordinateText.x = pos.x;
                coordinateText.y = pos.y;
                coordinateText.alpha = 0.7;
                textContainer.addChild(coordinateText);
            }
        }
        
        this.backgroundLayer.addChild(graphics);
        this.backgroundLayer.addChild(textContainer);
    }
    
    /**
     * 显示/隐藏网格线
     */
    showGridLines(visible) {
        if (this.backgroundLayer) {
            this.backgroundLayer.visible = visible;
        }
    }
    
    /**
     * 显示网格线
     */
    showGrid() {
        this.showGridLines(true);
    }
    
    /**
     * 隐藏网格线
     */
    hideGrid() {
        this.showGridLines(false);
    }
    
    /**
     * 计算网格位置的世界坐标（六角形布局）
     */
    calculateGridPosition(row, col) {
        const cellWidth = this.config.eggRadius * 2;
        const cellHeight = this.config.eggRadius * 1.75; // 六角形网格的垂直间距稍小
        
        // 偶数行偏移，创建六边形网格效果
        const offsetX = (row % 2) * (cellWidth / 2);
        
        const x = this.config.startX + col * cellWidth + offsetX + this.config.eggRadius;
        const y = this.config.startY + row * cellHeight + this.config.eggRadius;
        
        return { x, y };
    }
    
    /**
     * 检查指定网格坐标是否有效
     * @param {number} row - 行索引
     * @param {number} col - 列索引
     * @returns {boolean} 是否有效
     */
    isValid(row, col) {
        return row >= 0 && row < this.config.rows && col >= 0 && col < this.config.cols;
    }

    /**
     * 根据世界坐标反向计算出最接近的网格坐标（六角形布局）
     * @param {number} worldX - 世界X坐标
     * @param {number} worldY - 世界Y坐标
     * @returns {{row: number, col: number}} 最接近的网格坐标
     */
    calculateGridCoordinates(worldX, worldY) {
        const cellHeight = this.config.eggRadius * 1.75;
        const cellWidth = this.config.eggRadius * 2;

        // 1. 粗略估算行
        let roughRow = Math.round((worldY - this.config.startY - this.config.eggRadius) / cellHeight);
        roughRow = Math.max(0, Math.min(this.config.rows - 1, roughRow));

        // 2. 根据估算的行，精确计算列
        const offsetX = (roughRow % 2) * (cellWidth / 2);
        let roughCol = Math.round((worldX - this.config.startX - offsetX - this.config.eggRadius) / cellWidth);
        roughCol = Math.max(0, Math.min(this.config.cols - 1, roughCol));

        // 3. 在候选点及其邻居中找到最近的点（因为六边形网格的复杂性）
        let minDistanceSq = Infinity;
        let bestPos = { row: roughRow, col: roughCol };

        // 检查中心点和周围的邻居
        for (let r = roughRow - 1; r <= roughRow + 1; r++) {
            for (let c = roughCol - 1; c <= roughCol + 1; c++) {
                if (this.isValid(r, c)) {
                    const checkPos = this.calculateGridPosition(r, c);
                    const dx = worldX - checkPos.x;
                    const dy = worldY - checkPos.y;
                    const distSq = dx * dx + dy * dy;

                    if (distSq < minDistanceSq) {
                        minDistanceSq = distSq;
                        bestPos = { row: r, col: c };
                    }
                }
            }
        }

        return bestPos;
    }

    /**
     * 检查指定位置是否为空
     */
    isEmpty(row, col) {
        if (row < 0 || row >= this.config.rows || col < 0 || col >= this.config.cols) {
            return false; // 越界视为非空
        }
        return this.grid[row][col] === null;
    }
    
    /**
     * 在指定位置创建并添加一个新蛋
     * @param {number} row - 行索引
     * @param {number} col - 列索引
     * @param {number|null} color - 蛋的颜色，为null则随机使用游戏颜色
     * @returns {PIXI.Container|null} 创建的蛋对象或null
     */
    createAndAddEgg(row, col, color = null) {
        if (this.isEmpty(row, col)) {
            const pos = this.calculateGridPosition(row, col);
            
            // 使用游戏专用颜色，确保一致性
            const eggColor = color || window.rootManager.getRandomGameEggColor();
            
            // 使用 RootManager 创建蛋
            const egg = window.rootManager.createEggShape(
                pos.x, pos.y,
                this.config.eggRadius * 1.6, // 蛋宽
                this.config.eggRadius * 2,   // 蛋高
                eggColor,
                true // 有高光
            );
            
            // 存储蛋的颜色信息，用于后续碰撞检测和消除逻辑
            egg.eggGameColor = eggColor;
            egg.bubbleColor = eggColor; // 保持兼容性
            
            // 添加到蛋层
            this.eggLayer.addChild(egg);
            
            // 存储到网格状态中
            this.grid[row][col] = egg;
            
            return egg;
        }
        return null;
    }

    /**
     * 在指定网格位置添加一个已存在的蛋对象
     * @param {number} row - 行索引
     * @param {number} col - 列索引
     * @param {PIXI.DisplayObject} eggObject - 要添加的蛋对象
     * @returns {boolean} 是否成功添加
     */
    addEgg(row, col, eggObject) {
        if (this.isEmpty(row, col)) {
            this.grid[row][col] = eggObject;
            
            // 将蛋添加到蛋层（如果它还没有父级）
            if (!eggObject.parent) {
                this.eggLayer.addChild(eggObject);
            }
            
            // 确保蛋位置准确对齐到网格
            const gridPos = this.calculateGridPosition(row, col);
            eggObject.x = gridPos.x;
            eggObject.y = gridPos.y;
            
            console.log(`蛋已添加到网格位置 (${row}, ${col})`);
            return true;
        }
        console.warn(`尝试添加到非空位置 (${row}, ${col}) 失败。`);
        return false;
    }
    
    /**
     * 移除指定位置的蛋
     */
    removeEgg(row, col) {
        if (!this.isEmpty(row, col)) {
            const egg = this.grid[row][col];
            if (egg.parent) {
                egg.parent.removeChild(egg);
            }
            egg.destroy();
            this.grid[row][col] = null;
        }
    }
    
    /**
     * 清空整个网格
     */
    clearGrid() {
        for (let row = 0; row < this.config.rows; row++) {
            for (let col = 0; col < this.config.cols; col++) {
                if (!this.isEmpty(row, col)) {
                    this.removeEgg(row, col);
                }
            }
        }
    }
    
    /**
     * 清空所有蛋（clearGrid的别名）
     */
    clearAllEggs() {
        this.clearGrid();
    }
    
    /**
     * 添加默认行（随机颜色的蛋）
     */
    addDefaultRow(row) {
        if (row >= 0 && row < this.config.rows) {
            for (let col = 0; col < this.config.cols; col++) {
                this.createAndAddEgg(row, col);
            }
        }
    }
    
    /**
     * 销毁网格管理器
     */
    destroy() {
        this.clearGrid();
        
        if (this.container) {
            this.container.destroy();
            this.container = null;
        }
        
        this.backgroundLayer = null;
        this.eggLayer = null;
        this.grid = null;
    }
    
    /**
     * 在指定网格位置添加蛋对象
     * @param {number} row - 行索引
     * @param {number} col - 列索引
     * @param {Object} eggObject - 蛋对象
     * @returns {boolean} 是否成功添加
     */
    addEggAtPosition(row, col, eggObject) {
        if (this.isEmpty(row, col)) {
            this.grid[row][col] = eggObject;
            
            // 将蛋添加到蛋层
            this.eggLayer.addChild(eggObject);
            
            // 确保蛋位置准确对齐到网格
            const gridPos = this.calculateGridPosition(row, col);
            eggObject.x = gridPos.x;
            eggObject.y = gridPos.y;
            
            console.log(`蛋已添加到网格位置 (${row}, ${col}) 坐标 (${gridPos.x}, ${gridPos.y})`);
            return true;
        }
        return false;
    }
    
    /**
     * 获取所有网格中的蛋对象（用于碰撞检测）
     * @returns {Array} 蛋对象数组，每个元素包含 {egg, row, col, position}
     */
    getAllEggs() {
        const eggs = [];
        for (let row = 0; row < this.config.rows; row++) {
            for (let col = 0; col < this.config.cols; col++) {
                if (!this.isEmpty(row, col)) {
                    const egg = this.grid[row][col];
                    const position = this.calculateGridPosition(row, col);
                    eggs.push({
                        egg: egg,
                        row: row,
                        col: col,
                        position: position
                    });
                }
            }
        }
        return eggs;
    }
    
    /**
     * 根据世界坐标找到最近的空网格位置
     * @param {number} worldX - 世界X坐标
     * @param {number} worldY - 世界Y坐标
     * @returns {Object|null} 最近的空位置 {row, col, position} 或 null
     */
    findNearestEmptyPosition(worldX, worldY) {
        let nearestEmpty = null;
        let minDistance = Infinity;
        
        // 遍历所有网格位置，找到最近的空位
        for (let row = 0; row < this.config.rows; row++) {
            for (let col = 0; col < this.config.cols; col++) {
                if (this.isEmpty(row, col)) {
                    const gridPos = this.calculateGridPosition(row, col);
                    const distance = Math.sqrt(
                        (worldX - gridPos.x) * (worldX - gridPos.x) + 
                        (worldY - gridPos.y) * (worldY - gridPos.y)
                    );
                    
                    if (distance < minDistance) {
                        minDistance = distance;
                        nearestEmpty = {
                            row: row,
                            col: col,
                            position: gridPos,
                            distance: distance
                        };
                    }
                }
            }
        }
        
        return nearestEmpty;
    }
    
    /**
     * 扩展网格（如果需要添加新行）
     * @param {number} additionalRows - 要添加的行数
     */
    expandGrid(additionalRows) {
        const oldRows = this.config.rows;
        this.config.rows += additionalRows;
        
        // 扩展网格数组
        for (let row = oldRows; row < this.config.rows; row++) {
            this.grid[row] = [];
            for (let col = 0; col < this.config.cols; col++) {
                this.grid[row][col] = null;
            }
        }
        
        console.log(`网格已扩展，从 ${oldRows} 行扩展到 ${this.config.rows} 行`);
    }
}

// 将GridManager导出到全局作用域
if (typeof window !== 'undefined') {
    window.GridManager = GridManager;
}
