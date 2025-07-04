/**
 * EliminationManager - 消除管理器
 * 管理游戏中的蛋匹配、消除、掉落等逻辑
 * 从RootManager中拆分出来的专门管理器
 */
window.EliminationManager = class EliminationManager {
    constructor(rootManager = null) {
        this.debug = false;
        this.rootManager = rootManager;
        console.log('[EliminationManager] 消除管理器初始化完成');
    }

    /**
     * 设置RootManager引用
     * @param {RootManager} rootManager - RootManager实例
     */
    setRootManager(rootManager) {
        this.rootManager = rootManager;
        if (this.debug) {
            console.log('[EliminationManager] RootManager引用已设置');
        }
    }

    /**
     * 获取六边形邻居位置
     * @param {number} row - 行
     * @param {number} col - 列
     * @returns {Array} 邻居位置数组 [{row, col}, ...]
     */
    getHexNeighbors(row, col) {
        const neighbors = [];
        const isEvenRow = row % 2 === 0;
        
        // 六边形邻居的相对位置（取决于行是否为偶数）
        const directions = isEvenRow ? [
            [-1, -1], [-1, 0],  // 左上，右上
            [0, -1],  [0, 1],   // 左，右
            [1, -1],  [1, 0]    // 左下，右下
        ] : [
            [-1, 0],  [-1, 1],  // 左上，右上
            [0, -1],  [0, 1],   // 左，右
            [1, 0],   [1, 1]    // 左下，右下
        ];
        
        for (const [dr, dc] of directions) {
            const newRow = row + dr;
            const newCol = col + dc;
            neighbors.push({ row: newRow, col: newCol });
        }
        
        return neighbors;
    }

    /**
     * 使用BFS查找连接的同色蛋
     * @param {GridManager} gridManager 网格管理器
     * @param {number} startRow 起始行
     * @param {number} startCol 起始列
     * @param {number} targetColor 目标颜色
     * @returns {Array} 连接的蛋数组 [{row, col, egg}, ...]
     */
    findConnectedEggs(gridManager, startRow, startCol, targetColor) {
        if (this.debug) {
            console.log(`findConnectedEggs: 开始查找从 (${startRow}, ${startCol}) 连接的颜色 ${targetColor.toString(16)} 蛋`);
        }
        
        if (!gridManager || !gridManager.grid) {
            console.warn('findConnectedEggs: 网格管理器无效');
            return [];
        }
        
        const visited = new Set();
        const connected = [];
        const queue = [{row: startRow, col: startCol}];
        
        while (queue.length > 0) {
            const {row, col} = queue.shift();
            const key = `${row}-${col}`;
            
            // 检查是否已访问或越界
            if (visited.has(key) || 
                row < 0 || row >= gridManager.config.rows || 
                col < 0 || col >= gridManager.config.cols) {
                continue;
            }
            
            // 检查是否有蛋且颜色匹配
            const egg = gridManager.grid[row][col];
            if (!egg || !egg.eggGameColor || egg.eggGameColor !== targetColor) {
                continue;
            }
            
            // 标记为已访问
            visited.add(key);
            connected.push({row, col, egg});
            
            if (this.debug) {
                console.log(`findConnectedEggs: 找到匹配蛋 (${row}, ${col}), 总计: ${connected.length}`);
            }
            
            // 添加邻居到队列
            const neighbors = this.getHexNeighbors(row, col);
            for (const neighbor of neighbors) {
                const neighborKey = `${neighbor.row}-${neighbor.col}`;
                if (!visited.has(neighborKey)) {
                    queue.push(neighbor);
                }
            }
        }
        
        if (this.debug) {
            console.log(`findConnectedEggs: 最终找到 ${connected.length} 个连接的蛋`);
        }
        return connected;
    }

    /**
     * 检查并标记匹配的蛋
     * @param {GridManager} gridManager 网格管理器
     * @param {number} row 检查起始行
     * @param {number} col 检查起始列
     * @param {number} minMatches 最小匹配数量（默认3个）
     * @returns {Object} {matched: boolean, eggs: Array, count: number}
     */
    checkAndMarkMatches(gridManager, row, col, minMatches = 3) {
        if (this.debug) {
            console.log(`checkAndMarkMatches: 检查位置 (${row}, ${col}), 最小匹配数: ${minMatches}`);
        }
        
        if (!gridManager || !gridManager.grid) {
            console.log('checkAndMarkMatches: 网格管理器或网格为空');
            return {matched: false, eggs: [], count: 0};
        }
        
        const startEgg = gridManager.grid[row][col];
        if (!startEgg || !startEgg.eggGameColor) {
            console.log(`checkAndMarkMatches: 位置 (${row}, ${col}) 没有蛋或蛋没有颜色`);
            return {matched: false, eggs: [], count: 0};
        }
        
        if (this.debug) {
            console.log(`checkAndMarkMatches: 开始蛋颜色为 ${startEgg.eggGameColor.toString(16)}`);
        }
        
        // 查找连接的同色蛋
        const connectedEggs = this.findConnectedEggs(gridManager, row, col, startEgg.eggGameColor);
        
        if (this.debug) {
            console.log(`checkAndMarkMatches: 找到 ${connectedEggs.length} 个连接的蛋`);
        }
        
        const result = {
            matched: connectedEggs.length >= minMatches,
            eggs: connectedEggs,
            count: connectedEggs.length,
            color: startEgg.eggGameColor
        };
        
        // 如果达到消除条件，标记这些蛋
        if (result.matched) {
            this.markEggsForElimination(connectedEggs);
            console.log(`标记了${connectedEggs.length}个颜色为${startEgg.eggGameColor.toString(16)}的蛋准备消除`);
        } else {
            console.log(`连接数量 ${connectedEggs.length} 不足最小要求 ${minMatches}，不标记`);
        }
        
        return result;
    }

    /**
     * 标记蛋准备消除（添加视觉效果）
     * @param {Array} eggs 要标记的蛋数组 [{row, col, egg}, ...]
     */
    markEggsForElimination(eggs) {
        if (this.debug) {
            console.log(`markEggsForElimination: 准备标记 ${eggs.length} 个蛋`);
        }
        eggs.forEach(({row, col, egg}, index) => {
            if (this.debug) {
                console.log(`markEggsForElimination: 标记第 ${index + 1} 个蛋，位置 (${row}, ${col}), 可见: ${egg?.visible}`);
            }
            if (egg && egg.visible) {
                // 添加闪烁效果
                this.addEliminationMarker(egg);
            } else {
                console.log(`markEggsForElimination: 跳过蛋 (${row}, ${col})，原因: ${!egg ? '蛋不存在' : '蛋不可见'}`);
            }
        });
    }

    /**
     * 为蛋添加消除标记效果
     * @param {PIXI.Graphics} egg 蛋对象
     */
    addEliminationMarker(egg) {
        if (this.debug) {
            console.log('addEliminationMarker: 为蛋添加标记，蛋可见性:', egg.visible, '蛋半径:', egg.radius);
        }
        
        // 如果已经有标记，先移除
        if (egg.eliminationMarker) {
            egg.removeChild(egg.eliminationMarker);
            egg.eliminationMarker.destroy();
            if (this.debug) {
                console.log('addEliminationMarker: 移除了现有标记');
            }
        }
        
        // 创建标记圈
        const marker = new PIXI.Graphics();
        marker.lineStyle(3, 0xFF0000, 0.8); // 红色边框
        const circleRadius = (egg.radius || 18) + 5; // 比蛋稍大的圈
        marker.drawCircle(0, 0, circleRadius);
        
        if (this.debug) {
            console.log(`addEliminationMarker: 创建标记圈，半径: ${circleRadius}`);
        }
        
        // 添加到蛋对象
        egg.addChild(marker);
        egg.eliminationMarker = marker;
        egg.isMarkedForElimination = true;
        
        if (this.debug) {
            console.log('addEliminationMarker: 标记已添加到蛋对象');
        }
        
        // 添加闪烁动画
        let alpha = 1;
        let direction = -1;
        const blinkInterval = setInterval(() => {
            alpha += direction * 0.1;
            if (alpha <= 0.3) {
                alpha = 0.3;
                direction = 1;
            } else if (alpha >= 1) {
                alpha = 1;
                direction = -1;
            }
            
            if (marker.destroyed) {
                clearInterval(blinkInterval);
                return;
            }
            
            marker.alpha = alpha;
        }, 100);
        
        // 5秒后自动清除标记（如果还没有被消除）
        setTimeout(() => {
            if (!marker.destroyed && egg.eliminationMarker === marker) {
                this.removeEliminationMarker(egg);
            }
            clearInterval(blinkInterval);
        }, 5000);
    }

    /**
     * 移除蛋的消除标记
     * @param {PIXI.Graphics} egg 蛋对象
     */
    removeEliminationMarker(egg) {
        if (egg.eliminationMarker) {
            egg.removeChild(egg.eliminationMarker);
            egg.eliminationMarker.destroy();
            egg.eliminationMarker = null;
            egg.isMarkedForElimination = false;
        }
    }

    /**
     * 清除所有消除标记
     * @param {GridManager} gridManager 网格管理器
     */
    clearAllEliminationMarkers(gridManager) {
        if (!gridManager || !gridManager.grid) return;
        
        for (let row = 0; row < gridManager.config.rows; row++) {
            for (let col = 0; col < gridManager.config.cols; col++) {
                const egg = gridManager.grid[row][col];
                if (egg && egg.isMarkedForElimination) {
                    this.removeEliminationMarker(egg);
                }
            }
        }
    }

    /**
     * 消除标记的蛋（真正移除）
     * @param {Array} eggs 要消除的蛋数组 [{row, col, egg}, ...]
     * @param {GridManager} gridManager 网格管理器
     * @returns {Array} 被消除的蛋数组
     */
    eliminateMarkedEggs(eggs, gridManager) {
        const eliminatedEggs = [];
        
        eggs.forEach(({row, col, egg}) => {
            if (egg && egg.isMarkedForElimination) {
                // 从网格中移除
                gridManager.removeEgg(row, col);
                
                // 移除标记
                this.removeEliminationMarker(egg);
                
                // 从显示列表中移除
                if (egg.parent) {
                    egg.parent.removeChild(egg);
                }
                
                // 销毁蛋对象
                egg.destroy();
                
                eliminatedEggs.push({row, col, egg});
                console.log(`消除蛋: (${row}, ${col})`);
            }
        });
        
        console.log(`总共消除了 ${eliminatedEggs.length} 个蛋`);
        return eliminatedEggs;
    }

    /**
     * 检测掉落的蛋（失去支撑的蛋）
     * @param {GridManager} gridManager 网格管理器
     * @returns {Array} 需要掉落的蛋数组 [{row, col, egg}, ...]
     */
    detectFallingEggs(gridManager) {
        if (!gridManager || !gridManager.grid) return [];
        
        const visited = new Set();
        const connectedToTop = new Set();
        const fallingEggs = [];
        
        // 使用BFS从顶部行开始，标记所有连接到顶部的蛋
        const queue = [];
        
        // 将顶部行的所有蛋加入队列
        for (let col = 0; col < gridManager.config.cols; col++) {
            if (!gridManager.isEmpty(0, col)) {
                queue.push({row: 0, col});
                connectedToTop.add(`0-${col}`);
            }
        }
        
        // BFS遍历所有连接到顶部的蛋
        while (queue.length > 0) {
            const {row, col} = queue.shift();
            const key = `${row}-${col}`;
            
            if (visited.has(key)) continue;
            visited.add(key);
            
            // 检查所有邻居
            const neighbors = this.getHexNeighbors(row, col);
            for (const neighbor of neighbors) {
                const neighborKey = `${neighbor.row}-${neighbor.col}`;
                
                // 检查边界
                if (neighbor.row < 0 || neighbor.row >= gridManager.config.rows || 
                    neighbor.col < 0 || neighbor.col >= gridManager.config.cols) continue;
                
                // 如果邻居有蛋且未访问过
                if (!gridManager.isEmpty(neighbor.row, neighbor.col) && 
                    !visited.has(neighborKey)) {
                    queue.push(neighbor);
                    connectedToTop.add(neighborKey);
                }
            }
        }
        
        // 收集所有不连接到顶部的蛋
        for (let row = 1; row < gridManager.config.rows; row++) {
            for (let col = 0; col < gridManager.config.cols; col++) {
                const key = `${row}-${col}`;
                if (!gridManager.isEmpty(row, col) && !connectedToTop.has(key)) {
                    const egg = gridManager.grid[row][col];
                    fallingEggs.push({row, col, egg});
                }
            }
        }
        
        console.log(`检测到 ${fallingEggs.length} 个蛋需要掉落`);
        return fallingEggs;
    }

    /**
     * 执行蛋的掉落动画
     * @param {Array} fallingEggs 掉落的蛋数组
     * @param {GridManager} gridManager 网格管理器
     * @param {PIXI.Container} container 场景容器
     * @param {Function} onComplete 完成回调
     */
    animateFallingEggs(fallingEggs, gridManager, container, onComplete = null) {
        if (fallingEggs.length === 0) {
            if (onComplete) onComplete([]);
            return;
        }
        
        const fallingPromises = [];
        const bottomY = 350; // 底部位置
        
        fallingEggs.forEach(({row, col, egg}) => {
            // 暂时不从网格中移除蛋，等动画完成后再移除
            // 只是标记这个蛋正在掉落，避免重复处理
            if (egg) {
                egg.isFalling = true;
            }
            
            // 确保蛋对象有效且未被销毁
            if (!egg || egg.destroyed) {
                console.warn(`蛋 (${row}, ${col}) 已被销毁，跳过掉落动画`);
                return;
            }
            
            // 创建掉落动画的Promise
            const fallingPromise = new Promise((resolve) => {
                // 添加重力效果
                let velocityY = 0;
                const gravity = 0.8;
                let hasCollided = false;
                
                const fallAnimation = () => {
                    // 检查蛋是否仍然有效
                    if (!egg || egg.destroyed || !egg.parent) {
                        console.warn(`蛋 (${row}, ${col}) 在动画过程中被销毁或移除`);
                        resolve({row, col, egg: null});
                        return;
                    }
                    
                    // 再次检查蛋对象的属性是否可访问
                    try {
                        // 测试访问蛋的属性
                        const testY = egg.y;
                        const testX = egg.x;
                        
                        velocityY += gravity;
                        egg.y += velocityY;
                        
                        // 检查是否到达底部
                        if (egg.y >= bottomY && !hasCollided) {
                            hasCollided = true;
                            egg.y = bottomY;
                            
                            // 在爆炸前从网格中移除蛋
                            if (gridManager.grid[row] && gridManager.grid[row][col] === egg) {
                                gridManager.grid[row][col] = null;
                            }
                            
                            // 创建爆炸效果
                            this.createExplosionEffect(container, egg.x, egg.y);
                            
                            // 移除蛋
                            if (egg.parent) {
                                egg.parent.removeChild(egg);
                            }
                            egg.destroy();
                            
                            console.log(`蛋 (${row}, ${col}) 掉落并爆炸`);
                            resolve({row, col, egg});
                        } else if (!hasCollided) {
                            requestAnimationFrame(fallAnimation);
                        }
                    } catch (error) {
                        console.warn(`蛋 (${row}, ${col}) 访问属性时出错:`, error.message);
                        resolve({row, col, egg: null});
                        return;
                    }
                };
                
                requestAnimationFrame(fallAnimation);
            });
            
            fallingPromises.push(fallingPromise);
        });
        
        // 等待所有蛋掉落完成
        Promise.all(fallingPromises).then((results) => {
            // 过滤掉null结果
            const validResults = results.filter(result => result.egg !== null);
            console.log(`${validResults.length} 个蛋掉落完成`);
            
            // 清理所有剩余蛋的isFalling标记
            this.clearFallingFlags(gridManager);
            
            if (onComplete) onComplete(validResults);
        });
    }

    /**
     * 创建爆炸效果
     * @param {PIXI.Container} container 容器
     * @param {number} x X坐标
     * @param {number} y Y坐标
     * @param {Object} options 爆炸选项
     */
    createExplosionEffect(container, x, y, options = {}) {
        if (this.rootManager && this.rootManager.animationManager) {
            return this.rootManager.animationManager.createExplosionEffect(container, x, y, options);
        } else {
            // 回退到简单实现
            return this._createExplosionEffectFallback(container, x, y);
        }
    }

    /**
     * 爆炸效果回退实现
     * @private
     */
    _createExplosionEffectFallback(container, x, y) {
        const particleCount = 8;
        const colors = [0xFF6B6B, 0xFFE66D, 0xFF8E53, 0xA8E6CF, 0x88D8C0];
        
        for (let i = 0; i < particleCount; i++) {
            const particle = new PIXI.Graphics();
            const color = colors[Math.floor(Math.random() * colors.length)];
            const size = Math.random() * 8 + 4;
            
            particle.beginFill(color, 0.8);
            particle.drawCircle(0, 0, size);
            particle.endFill();
            
            particle.x = x;
            particle.y = y;
            
            container.addChild(particle);
            
            // 粒子动画
            const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5;
            const speed = Math.random() * 8 + 4;
            let velocityX = Math.cos(angle) * speed;
            let velocityY = Math.sin(angle) * speed;
            const gravity = 0.3;
            let life = 1.0;
            
            const animateParticle = () => {
                velocityY += gravity;
                particle.x += velocityX;
                particle.y += velocityY;
                
                life -= 0.03;
                particle.alpha = life;
                particle.scale.set(life);
                
                if (life > 0) {
                    requestAnimationFrame(animateParticle);
                } else {
                    container.removeChild(particle);
                    particle.destroy();
                }
            };
            
            requestAnimationFrame(animateParticle);
        }
        return `fallback_explosion_${Date.now()}`;
    }

    /**
     * 清理网格中所有蛋的掉落标记
     * @param {GridManager} gridManager 网格管理器
     */
    clearFallingFlags(gridManager) {
        if (!gridManager || !gridManager.grid) return;
        
        console.log('清理所有蛋的掉落标记...');
        let clearedCount = 0;
        
        for (let row = 0; row < gridManager.config.rows; row++) {
            for (let col = 0; col < gridManager.config.cols; col++) {
                const egg = gridManager.grid[row] && gridManager.grid[row][col];
                if (egg && egg.isFalling) {
                    egg.isFalling = false;
                    clearedCount++;
                    if (this.debug) {
                        console.log(`清理位置(${row}, ${col})的掉落标记`);
                    }
                }
            }
        }
        
        console.log(`总共清理了${clearedCount}个蛋的掉落标记`);
    }

    /**
     * 完整的消除和掉落处理
     * @param {GridManager} gridManager 网格管理器
     * @param {number} row 触发位置行
     * @param {number} col 触发位置列
     * @param {PIXI.Container} container 场景容器
     * @param {Function} onComplete 完成回调
     * @returns {Object} 处理结果
     */
    processEliminationAndFalling(gridManager, row, col, container, onComplete = null) {
        console.log(`开始处理消除和掉落，触发位置: (${row}, ${col})`);
        
        // 1. 检查匹配并标记
        const matchResult = this.checkAndMarkMatches(gridManager, row, col, 3);
        
        if (!matchResult.matched) {
            console.log('没有找到可消除的匹配');
            if (onComplete) onComplete({eliminated: [], fallen: []});
            return {eliminated: [], fallen: []};
        }
        
        // 2. 等待标记动画，然后消除
        setTimeout(() => {
            const eliminatedEggs = this.eliminateMarkedEggs(matchResult.eggs, gridManager);
            
            // 3. 检测掉落
            const fallingEggs = this.detectFallingEggs(gridManager);
            
            // 4. 执行掉落动画
            this.animateFallingEggs(fallingEggs, gridManager, container, (fallenResults) => {
                const result = {
                    eliminated: eliminatedEggs,
                    fallen: fallenResults
                };
                
                console.log(`消除和掉落处理完成: 消除${eliminatedEggs.length}个, 掉落${fallenResults.length}个`);
                
                if (onComplete) onComplete(result);
            });
            
        }, 1000); // 等待1秒让玩家看到标记
    }

    /**
     * 设置调试模式
     * @param {boolean} enabled - 是否启用调试
     */
    setDebug(enabled) {
        this.debug = enabled;
        console.log(`[EliminationManager] 调试模式${enabled ? '开启' : '关闭'}`);
    }
};

console.log('[EliminationManager] 消除管理器类已定义');
