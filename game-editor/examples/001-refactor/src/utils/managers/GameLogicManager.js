/**
 * 游戏逻辑管理器 - 负责游戏规则、消除逻辑、悬空检测等
 * 从RootManager中拆分出的游戏逻辑相关功能
 */
class GameLogicManager {
    constructor(gameConfig = null) {
        this.config = gameConfig || window.gameConfig || {};
        
        // 游戏状态
        this.eliminationInProgress = false;
        this.floatingDetectionEnabled = true;
        
        console.log('GameLogicManager: 已初始化');
    }

    /**
     * 检查并标记匹配的蛋组
     * @param {object} gridManager - 网格管理器
     * @param {number} row - 行
     * @param {number} col - 列
     * @param {number} minMatchCount - 最小匹配数量
     * @returns {object} 匹配结果
     */
    checkAndMarkMatches(gridManager, row, col, minMatchCount = 3) {
        if (!gridManager || !gridManager.grid) {
            return { found: false, groups: [], totalCount: 0 };
        }

        // 检查边界
        if (row < 0 || row >= gridManager.config.rows || 
            col < 0 || col >= gridManager.config.cols) {
            return { found: false, groups: [], totalCount: 0 };
        }

        const targetEgg = gridManager.grid[row] && gridManager.grid[row][col];
        if (!targetEgg) {
            return { found: false, groups: [], totalCount: 0 };
        }

        const visited = new Set();
        const matchingGroup = [];
        
        // 深度优先搜索相同颜色的蛋
        const dfs = (currentRow, currentCol) => {
            const key = `${currentRow},${currentCol}`;
            if (visited.has(key)) return;
            
            // 检查边界
            if (currentRow < 0 || currentRow >= gridManager.config.rows || 
                currentCol < 0 || currentCol >= gridManager.config.cols) return;
            
            const currentEgg = gridManager.grid[currentRow] && gridManager.grid[currentRow][currentCol];
            if (!currentEgg || !currentEgg.eggGameColor || currentEgg.eggGameColor !== targetEgg.eggGameColor) return;
            
            visited.add(key);
            matchingGroup.push({ row: currentRow, col: currentCol, egg: currentEgg });
            
            // 检查邻居
            const neighbors = gridManager.getNeighbors ? 
                gridManager.getNeighbors(currentRow, currentCol) : 
                this._getHexNeighbors(currentRow, currentCol, gridManager);
            
            neighbors.forEach(neighbor => {
                dfs(neighbor.row, neighbor.col);
            });
        };

        dfs(row, col);

        // 检查是否达到最小匹配数量
        const hasValidMatch = matchingGroup.length >= minMatchCount;
        
        if (hasValidMatch) {
            // 标记为待消除
            matchingGroup.forEach(item => {
                if (item.egg) {
                    item.egg.isMarkedForElimination = true;
                    this._applyEliminationVisualEffect(item.egg);
                }
            });
        }

        return {
            found: hasValidMatch,
            groups: hasValidMatch ? [matchingGroup] : [],
            totalCount: hasValidMatch ? matchingGroup.length : 0,
            color: targetEgg.eggGameColor
        };
    }

    /**
     * 递归处理悬空蛋
     * @param {object} gridManager - 网格管理器
     * @param {object} container - 容器
     * @param {object} options - 选项
     */
    processFloatingEggsRecursively(gridManager, container, options = {}) {
        if (!this.floatingDetectionEnabled) return;

        const config = {
            enableAnimation: true,
            animationSpeed: 8,
            gravity: 0.5,
            onEggRemoved: null,
            ...options
        };

        let hasFloatingEggs = true;
        let iterationCount = 0;
        const maxIterations = 10;

        const processIteration = () => {
            if (!hasFloatingEggs || iterationCount >= maxIterations) return;

            const floatingEggs = this.findFloatingEggs(gridManager);
            
            if (floatingEggs.length === 0) {
                hasFloatingEggs = false;
                return;
            }

            console.log(`悬空检测第${iterationCount + 1}轮: 发现${floatingEggs.length}个悬空蛋`);

            // 处理悬空蛋
            this.processDirectFalling(gridManager, container, floatingEggs, {
                ...config,
                onComplete: () => {
                    iterationCount++;
                    // 延迟下一轮检测，让动画完成
                    setTimeout(processIteration, 500);
                }
            });
        };

        processIteration();
    }

    /**
     * 查找悬空的蛋
     * @param {object} gridManager - 网格管理器
     * @returns {Array} 悬空蛋列表
     */
    findFloatingEggs(gridManager) {
        if (!gridManager || typeof gridManager.findFloatingEggs === 'function') {
            return gridManager.findFloatingEggs();
        }

        // 回退实现
        const connected = new Set();
        const floatingEggs = [];

        // 标记所有与顶行连接的蛋
        const markConnected = (row, col) => {
            const key = `${row},${col}`;
            const egg = gridManager.grid[row] && gridManager.grid[row][col];
            if (connected.has(key) || !egg) return;

            connected.add(key);
            
            // 检查邻居
            const neighbors = gridManager.getNeighbors ? 
                gridManager.getNeighbors(row, col) : 
                this._getHexNeighbors(row, col, gridManager);
            
            neighbors.forEach(neighbor => {
                markConnected(neighbor.row, neighbor.col);
            });
        };

        // 从顶行开始标记
        for (let col = 0; col < (gridManager.cols || gridManager.config.cols); col++) {
            const topEgg = gridManager.grid[0] && gridManager.grid[0][col];
            if (topEgg) {
                markConnected(0, col);
            }
        }

        // 找出未连接的蛋
        for (let row = 0; row < (gridManager.rows || gridManager.config.rows); row++) {
            for (let col = 0; col < (gridManager.cols || gridManager.config.cols); col++) {
                const egg = gridManager.grid[row] && gridManager.grid[row][col];
                if (egg && !connected.has(`${row},${col}`)) {
                    floatingEggs.push({ row, col, egg });
                }
            }
        }

        return floatingEggs;
    }

    /**
     * 处理直接掉落
     * @param {object} gridManager - 网格管理器
     * @param {object} container - 容器
     * @param {Array} floatingEggs - 悬空蛋列表
     * @param {object} options - 选项
     */
    processDirectFalling(gridManager, container, floatingEggs, options = {}) {
        const config = {
            enableAnimation: true,
            animationSpeed: 8,
            gravity: 0.5,
            onEggRemoved: null,
            onComplete: null,
            ...options
        };

        if (!floatingEggs || floatingEggs.length === 0) {
            if (config.onComplete) config.onComplete();
            return;
        }

        let activeAnimations = floatingEggs.length;

        floatingEggs.forEach(({ row, col, egg }) => {
            if (!egg) {
                activeAnimations--;
                return;
            }

            // 从网格中移除
            gridManager.removeEgg(row, col);

            if (config.enableAnimation && container) {
                // 添加掉落动画
                this._animateEggFalling(egg, container, {
                    speed: config.animationSpeed,
                    gravity: config.gravity,
                    onComplete: () => {
                        activeAnimations--;
                        if (config.onEggRemoved) {
                            config.onEggRemoved(egg, row, col);
                        }
                        if (activeAnimations <= 0 && config.onComplete) {
                            config.onComplete();
                        }
                    }
                });
            } else {
                // 直接移除
                if (egg.parent) {
                    egg.parent.removeChild(egg);
                }
                egg.destroy();
                
                activeAnimations--;
                if (config.onEggRemoved) {
                    config.onEggRemoved(egg, row, col);
                }
                if (activeAnimations <= 0 && config.onComplete) {
                    config.onComplete();
                }
            }
        });
    }

    /**
     * 清除所有消除标记
     * @param {object} gridManager - 网格管理器
     */
    clearAllEliminationMarkers(gridManager) {
        if (!gridManager || !gridManager.grid) return;

        for (let row = 0; row < (gridManager.rows || gridManager.config.rows); row++) {
            for (let col = 0; col < (gridManager.cols || gridManager.config.cols); col++) {
                const egg = gridManager.grid[row] && gridManager.grid[row][col];
                if (egg) {
                    egg.isMarkedForElimination = false;
                    this._removeEliminationVisualEffect(egg);
                }
            }
        }

        console.log('所有消除标记已清除');
    }

    /**
     * 生成初始蛋布局
     * @param {object} gridManager - 网格管理器
     * @param {object} config - 配置
     */
    generateInitialEggs(gridManager, config) {
        const settings = {
            rows: 4,
            fillPercentage: 0.8,
            colors: [0xFF0000, 0xFFFF00, 0xFF69B4, 0x0066FF, 0x00FF00, 0x9933FF],
            ensureMatches: false,
            ...config
        };

        // 清空现有蛋
        gridManager.clear();

        // 生成蛋
        for (let row = 0; row < settings.rows; row++) {
            for (let col = 0; col < gridManager.cols; col++) {
                if (Math.random() < settings.fillPercentage) {
                    const colorIndex = Math.floor(Math.random() * settings.colors.length);
                    const eggColor = settings.colors[colorIndex];
                    
                    gridManager.createAndAddEgg(row, col, eggColor);
                }
            }
        }

        console.log(`初始蛋布局已生成: ${settings.rows}行, 填充率${Math.round(settings.fillPercentage * 100)}%`);
    }

    /**
     * 创建游戏状态对象
     * @param {object} config - 配置
     * @returns {object} 游戏状态
     */
    createBubbleGameState(config) {
        const gameState = {
            score: 0,
            level: 1,
            eggsRemaining: 0,
            projectilesFired: 0,
            eliminationCount: 0,
            nextProjectileColor: null,
            isGameRunning: true,
            ...config
        };

        // 生成下一个投射物颜色
        if (window.renderManager) {
            gameState.nextProjectileColor = window.renderManager.getRandomGameEggColor();
            
            // 创建下一个投射物的显示
            if (config.nextProjectileContainer) {
                const nextProjectile = window.renderManager.createEggShape(0, 0, 28.8, 36, gameState.nextProjectileColor, true, 0);
                config.nextProjectileContainer.addChild(nextProjectile);
                gameState.nextProjectileDisplay = nextProjectile;
            }
        }

        return gameState;
    }

    /**
     * 切换网格显示
     * @param {object} gridManager - 网格管理器
     * @returns {boolean} 是否显示网格
     */
    toggleGridDisplay(gridManager) {
        if (!gridManager || typeof gridManager.toggleGridDisplay !== 'function') {
            console.warn('GridManager 不支持 toggleGridDisplay 方法');
            return false;
        }
        
        return gridManager.toggleGridDisplay();
    }

    /**
     * 应用消除视觉效果
     * @private
     */
    _applyEliminationVisualEffect(egg) {
        if (!egg) return;

        // 添加闪烁效果
        egg.alpha = 0.6;
        
        // 可以添加更多视觉效果
        if (window.animationManager) {
            window.animationManager.startPulseAnimation(egg, {
                minAlpha: 0.3,
                maxAlpha: 1.0,
                duration: 500
            });
        }
    }

    /**
     * 移除消除视觉效果
     * @private
     */
    _removeEliminationVisualEffect(egg) {
        if (!egg) return;

        egg.alpha = 1.0;
        
        // 停止动画
        if (window.animationManager) {
            window.animationManager.stopPulseAnimation(egg);
        }
    }

    /**
     * 蛋掉落动画
     * @private
     */
    _animateEggFalling(egg, container, options = {}) {
        const config = {
            speed: 8,
            gravity: 0.5,
            onComplete: null,
            ...options
        };

        let velocityY = config.speed;
        const targetY = container.height + 100; // 掉落到容器底部之外

        const animate = () => {
            velocityY += config.gravity;
            egg.y += velocityY;
            
            // 添加旋转效果
            egg.rotation += 0.1;

            if (egg.y < targetY) {
                requestAnimationFrame(animate);
            } else {
                // 动画完成
                if (egg.parent) {
                    egg.parent.removeChild(egg);
                }
                egg.destroy();
                
                if (config.onComplete) {
                    config.onComplete();
                }
            }
        };

        animate();
    }

    /**
     * 设置悬空检测状态
     * @param {boolean} enabled - 是否启用
     */
    setFloatingDetectionEnabled(enabled) {
        this.floatingDetectionEnabled = enabled;
        console.log(`悬空检测已${enabled ? '启用' : '禁用'}`);
    }

    /**
     * 获取调试信息
     */
    getDebugInfo() {
        return {
            gameLogicManager: this.constructor.name,
            eliminationInProgress: this.eliminationInProgress,
            floatingDetectionEnabled: this.floatingDetectionEnabled,
            configValid: !!this.config
        };
    }

    /**
     * 查找连接的同颜色蛋
     * @param {object} gridManager - 网格管理器
     * @param {number} startRow - 起始行
     * @param {number} startCol - 起始列
     * @param {number} targetColor - 目标颜色
     * @returns {Array} 连接的蛋的位置数组 [{row, col, egg}, ...]
     */
    findConnectedEggs(gridManager, startRow, startCol, targetColor) {
        if (!gridManager || !gridManager.grid) {
            return [];
        }

        const visited = new Set();
        const connected = [];
        const queue = [{row: startRow, col: startCol}];

        while (queue.length > 0) {
            const {row, col} = queue.shift();
            const key = `${row},${col}`;

            // 跳过已访问的位置
            if (visited.has(key)) continue;
            visited.add(key);

            // 检查边界
            if (row < 0 || row >= gridManager.config.rows || 
                col < 0 || col >= gridManager.config.cols) continue;

            // 获取当前位置的蛋
            const egg = gridManager.grid[row] && gridManager.grid[row][col];
            if (!egg || !egg.eggGameColor) continue;

            // 检查颜色是否匹配
            if (egg.eggGameColor !== targetColor) continue;

            // 添加到连接列表
            connected.push({row, col, egg});

            // 添加邻居到队列
            const neighbors = gridManager.getNeighbors ? 
                gridManager.getNeighbors(row, col) : 
                this._getHexNeighbors(row, col, gridManager);
            
            neighbors.forEach(neighbor => {
                const neighborKey = `${neighbor.row},${neighbor.col}`;
                if (!visited.has(neighborKey)) {
                    queue.push(neighbor);
                }
            });
        }

        return connected;
    }

    /**
     * 获取六边形邻居位置（fallback方法）
     * @private
     */
    _getHexNeighbors(row, col, gridManager) {
        const isEvenRow = row % 2 === 0;
        const offsets = isEvenRow ? 
            [[-1, -1], [-1, 0], [0, -1], [0, 1], [1, -1], [1, 0]] :
            [[-1, 0], [-1, 1], [0, -1], [0, 1], [1, 0], [1, 1]];
        
        return offsets
            .map(([dr, dc]) => ({ row: row + dr, col: col + dc }))
            .filter(pos => pos.row >= 0 && pos.row < gridManager.config.rows && 
                          pos.col >= 0 && pos.col < gridManager.config.cols);
    }
}

// 暴露到全局
window.GameLogicManager = GameLogicManager;
