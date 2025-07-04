/**
 * CollisionManager - 碰撞检测管理器
 * 管理游戏中的各种碰撞检测功能
 * 从RootManager中拆分出来的专门管理器
 */
window.CollisionManager = class CollisionManager {
    constructor() {
        this.debug = false;
        console.log('[CollisionManager] 碰撞检测管理器初始化完成');
    }

    /**
     * 创建碰撞检测器
     * @param {Object} config 配置对象
     * @param {GridManager} config.gridManager - 网格管理器实例
     * @param {number} config.checkRadius - 碰撞检测半径，默认36
     * @param {Function} config.onCollision - 碰撞回调函数 (projectile, gridRow, gridCol, gridEgg) => {}
     * @returns {Object} 碰撞检测器对象
     */
    createCollisionDetector(config = {}) {
        const defaultConfig = {
            gridManager: null,          
            checkRadius: 36,            
            onCollision: null           
        };
        
        const finalConfig = { ...defaultConfig, ...config };
        
        return {
            /**
             * 检测发射物与网格的碰撞
             * @param {Object} projectile - 发射物对象
             * @returns {Object|null} 碰撞信息 {row, col, egg} 或 null
             */
            checkCollision: (projectile) => {
                if (!finalConfig.gridManager || !projectile) return null;
                
                const projectileX = projectile.x;
                const projectileY = projectile.y;
                const projectileRadius = projectile.radius || 18;
                const eggRadius = finalConfig.gridManager.config.eggRadius || 18;
                
                // 1. 检查是否碰到顶部边界
                const topBoundary = finalConfig.gridManager.config.startY - eggRadius;
                if (projectileY - projectileRadius <= topBoundary) {
                    console.log('发射物碰到顶部边界');
                    return {
                        row: 0,
                        col: Math.round((projectileX - finalConfig.gridManager.config.startX) / (eggRadius * 2)),
                        egg: null,
                        isBoundaryCollision: true
                    };
                }
                
                // 2. 检测与网格中蛋的碰撞 - 使用更严格的条件
                // 只有当发射物与蛋真正相互重叠时才算碰撞
                const minDistance = (projectileRadius + eggRadius) * 0.9; // 稍微减小以避免过早触发
                
                for (let row = 0; row < finalConfig.gridManager.config.rows; row++) {
                    for (let col = 0; col < finalConfig.gridManager.config.cols; col++) {
                        const gridEgg = finalConfig.gridManager.grid[row][col];
                        if (!gridEgg) continue;
                        
                        // 计算中心距离
                        const distance = Math.sqrt(
                            Math.pow(projectileX - gridEgg.x, 2) + 
                            Math.pow(projectileY - gridEgg.y, 2)
                        );
                        
                        // 只有当两个蛋几乎重叠时才算碰撞
                        if (distance <= minDistance) {
                            console.log(`发射物与网格蛋碰撞: (${row}, ${col}), 距离: ${distance.toFixed(1)}, 最小距离: ${minDistance.toFixed(1)}`);
                            
                            const collisionInfo = { row, col, egg: gridEgg, distance };
                            
                            // 调用碰撞回调
                            if (finalConfig.onCollision) {
                                finalConfig.onCollision(projectile, collisionInfo);
                            }
                            
                            return collisionInfo;
                        }
                    }
                }
                
                return null;
            },
            
            /**
             * 检测点与网格的碰撞
             * @param {number} x - X坐标
             * @param {number} y - Y坐标
             * @param {number} radius - 检测半径
             * @returns {Object|null} 碰撞信息 {row, col, egg} 或 null
             */
            checkPointCollision: (x, y, radius = null) => {
                if (!finalConfig.gridManager) return null;
                
                const checkRadius = radius || finalConfig.checkRadius;
                
                for (let row = 0; row < finalConfig.gridManager.config.rows; row++) {
                    for (let col = 0; col < finalConfig.gridManager.config.cols; col++) {
                        const gridEgg = finalConfig.gridManager.grid[row][col];
                        if (!gridEgg) continue;
                        
                        const distance = Math.sqrt(
                            Math.pow(x - gridEgg.x, 2) + 
                            Math.pow(y - gridEgg.y, 2)
                        );
                        
                        if (distance <= checkRadius) {
                            return { row, col, egg: gridEgg };
                        }
                    }
                }
                
                return null;
            },
            
            /**
             * 检测物理边界碰撞
             * @param {Object} projectile - 发射物对象
             * @param {Object} bounds - 边界对象 {left, right, top, bottom}
             * @returns {Object|null} 碰撞信息 {side: 'left'|'right'|'top'|'bottom'} 或 null
             */
            checkBoundaryCollision: (projectile, bounds) => {
                if (!projectile || !bounds) return null;
                
                const radius = projectile.radius || 18;
                
                // 检查左右边界
                if (projectile.x - radius <= bounds.left) {
                    return { side: 'left' };
                }
                if (projectile.x + radius >= bounds.right) {
                    return { side: 'right' };
                }
                
                // 检查顶部边界
                if (projectile.y - radius <= bounds.top) {
                    return { side: 'top' };
                }
                
                // 检查底部边界
                if (projectile.y + radius >= bounds.bottom) {
                    return { side: 'bottom' };
                }
                
                return null;
            },
            
            /**
             * 停止发射物的物理行为
             * @param {Object} projectile - 要停止的发射物
             * @param {number} projectileId - 物理系统中的发射物ID
             */
            stopProjectilePhysics: (projectile, projectileId = null) => {
                // 从物理系统中移除
                if (projectileId !== null && window.physicsManager) {
                    window.physicsManager.removeProjectile(projectileId);
                }
                
                // 停止任何动画
                if (projectile && projectile.parent) {
                    console.log(`发射物停止在位置: (${projectile.x.toFixed(1)}, ${projectile.y.toFixed(1)})`);
                }
            },
            
            /**
             * 将发射物附加到网格的最近位置（泡泡龙逻辑）
             * @param {Object} projectile - 发射物
             * @param {Object} collisionInfo - 碰撞信息，包含碰撞的网格位置
             */
            attachToGrid: (projectile, collisionInfo = null) => {
                if (!finalConfig.gridManager) return;

                let targetPosition = null;

                if (collisionInfo && window.rootManager) {
                    // 泡泡龙逻辑：在碰撞的蛋周围寻找空位
                    targetPosition = window.rootManager.findEmptyPositionAroundCollision(
                        finalConfig.gridManager,
                        collisionInfo.row,
                        collisionInfo.col,
                        projectile.x,
                        projectile.y
                    );
                } else if (window.rootManager) {
                    // 回退逻辑：使用发射物当前位置寻找最近空位
                    targetPosition = window.rootManager.findNearestEmptyGridPosition(
                        finalConfig.gridManager,
                        projectile.x,
                        projectile.y
                    );
                }

                if (targetPosition) {
                    // 将发射物移动到网格位置
                    const gridPos = finalConfig.gridManager.calculateGridPosition(targetPosition.row, targetPosition.col);
                    
                    // 使用动画平滑移动到目标位置
                    if (window.TWEEN) {
                        const moveTween = new TWEEN.Tween(projectile.position)
                            .to({ x: gridPos.x, y: gridPos.y }, 100)
                            .easing(TWEEN.Easing.Quadratic.Out)
                            .onComplete(() => {
                                // 将蛋添加到网格数据中
                                finalConfig.gridManager.addEgg(targetPosition.row, targetPosition.col, projectile);
                                
                                // 记录蛋在网格中的位置
                                projectile.gridRow = targetPosition.row;
                                projectile.gridCol = targetPosition.col;
                                
                                console.log(`蛋已附加到网格: (${targetPosition.row}, ${targetPosition.col})`);
                            })
                            .start();
                    } else {
                        // 没有TWEEN，直接设置位置
                        projectile.x = gridPos.x;
                        projectile.y = gridPos.y;
                        finalConfig.gridManager.addEgg(targetPosition.row, targetPosition.col, projectile);
                        projectile.gridRow = targetPosition.row;
                        projectile.gridCol = targetPosition.col;
                        console.log(`蛋已附加到网格: (${targetPosition.row}, ${targetPosition.col})`);
                    }
                } else {
                    console.warn("无法找到合适的空网格位置来附加蛋。");
                    // 如果没有找到位置，可以选择销毁发射物
                    if (projectile.parent) {
                        projectile.parent.removeChild(projectile);
                    }
                    projectile.destroy();
                }
            },

            /**
             * 更新碰撞回调
             * @param {Function} newCallback - 新的碰撞回调函数
             */
            updateCollisionCallback: (newCallback) => {
                finalConfig.onCollision = newCallback;
            },
            
            /**
             * 更新网格管理器引用
             * @param {GridManager} gridManager - 新的网格管理器
             */
            updateGridManager: (gridManager) => {
                finalConfig.gridManager = gridManager;
            },
            
            /**
             * 更新检测半径
             * @param {number} radius - 新的检测半径
             */
            updateCheckRadius: (radius) => {
                finalConfig.checkRadius = radius;
            },
            
            /**
             * 获取配置信息
             * @returns {Object} 当前配置
             */
            getConfig: () => {
                return { ...finalConfig };
            },
            
            /**
             * 销毁碰撞检测器
             */
            destroy: () => {
                // 清理所有引用和定时器
                finalConfig.gridManager = null;
                finalConfig.onCollision = null;
                console.log('[CollisionManager] 碰撞检测器已销毁');
            }
        };
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
     * 检测圆形与圆形的碰撞
     * @param {Object} circle1 - 第一个圆形 {x, y, radius}
     * @param {Object} circle2 - 第二个圆形 {x, y, radius}
     * @returns {boolean} 是否碰撞
     */
    checkCircleCollision(circle1, circle2) {
        const dx = circle1.x - circle2.x;
        const dy = circle1.y - circle2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDistance = circle1.radius + circle2.radius;
        
        return distance <= minDistance;
    }

    /**
     * 检测矩形与矩形的碰撞
     * @param {Object} rect1 - 第一个矩形 {x, y, width, height}
     * @param {Object} rect2 - 第二个矩形 {x, y, width, height}
     * @returns {boolean} 是否碰撞
     */
    checkRectCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    /**
     * 设置调试模式
     * @param {boolean} enabled - 是否启用调试
     */
    setDebug(enabled) {
        this.debug = enabled;
        console.log(`[CollisionManager] 调试模式${enabled ? '开启' : '关闭'}`);
    }
};

console.log('[CollisionManager] 碰撞检测管理器类已定义');
