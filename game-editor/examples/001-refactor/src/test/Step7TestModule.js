/**
 * Step7 测试模块 - 完整消除和掉落系统
 */
class Step7TestModule extends BaseTestModule {
    constructor(container, config = {}) {
        super(container, config);
        
        // 游戏场景组件
        this.gameScene = null;
    }

    async init() {
        // 创建模块容器
        this.moduleContainer = new PIXI.Container();
        this.moduleContainer.x = GAME_CONFIG.WIDTH / 2;
        this.moduleContainer.y = GAME_CONFIG.HEIGHT / 2;
        
        // 添加处理状态标志，防止重复处理
        this.isProcessing = false;
        this.processedEggs = new Set(); // 记录已处理的蛋
        
        // 使用RootManager创建完整的泡泡龙游戏场景
        this.gameScene = window.rootManager.createBubbleGameScene({
            scene: {
                title: 'Step7: 消除和掉落系统',
                titleStyle: {
                    fontFamily: 'Arial',
                    fontSize: 18,
                    fill: 0x9B59B6, // 紫色标题
                    fontWeight: 'bold'
                }
            },
            grid: {
                showGrid: true, // 显示网格辅助线，便于调试
                gridAlpha: 0.3
            },
            initialEggs: {
                rows: 5, // 生成更多行，增加掉落测试机会
                randomColors: true
            }
        });

        // 将游戏场景添加到模块容器
        this.moduleContainer.addChild(this.gameScene.sceneContainer.container);
        
        // 添加控制按钮
        this.addControlButtons();
        
        // 设置完整的消除和掉落系统
        this.setupEliminationAndFallingSystem();
        
        this.isLoaded = true;
        console.log('Step7 测试模块初始化完成 - 完整消除和掉落系统');
    }

    setupEliminationAndFallingSystem() {
        console.log('Step7: 设置完整的消除和掉落系统...');
        
        // 获取原来的碰撞检测器的方法
        const originalCollisionDetector = this.gameScene.gameState.collisionDetector;
        const originalStopProjectilePhysics = originalCollisionDetector.stopProjectilePhysics;
        const originalAttachToGrid = originalCollisionDetector.attachToGrid;
        
        // 创建增强的碰撞检测器，包含完整的消除和掉落逻辑
        const eliminationCollisionDetector = window.rootManager.createCollisionDetector({
            gridManager: this.gameScene.gridManager,
            checkRadius: 36,
            onCollision: (projectile, collisionInfo) => {
                console.log(`Step7 消除系统: 发射物与网格(${collisionInfo.row}, ${collisionInfo.col})碰撞`);
                
                // 执行原始的碰撞处理逻辑
                const projectileRecord = this.gameScene.gameState.activeProjectiles.find(p => p.object === projectile);
                if (projectileRecord) {
                    // 停止物理行为
                    originalStopProjectilePhysics(projectile, projectileRecord.id);
                    
                    // 将发射物附加到网格
                    originalAttachToGrid(projectile, collisionInfo);
                    
                    // 从活跃发射物列表中移除
                    const index = this.gameScene.gameState.activeProjectiles.indexOf(projectileRecord);
                    if (index > -1) {
                        this.gameScene.gameState.activeProjectiles.splice(index, 1);
                        console.log(`Step7: 发射物已从活跃列表移除，剩余: ${this.gameScene.gameState.activeProjectiles.length}`);
                    }
                    
                    // 等待蛋附加到网格后开始完整的消除和掉落处理
                    setTimeout(() => {
                        this.processCompleteElimination(projectile);
                    }, 500);
                    
                    // 准备下一个发射物
                    this.gameScene.gameState.prepareNextProjectile();
                }
            }
        });
        
        // 替换碰撞检测器
        this.gameScene.gameState.collisionDetector = eliminationCollisionDetector;
        
        console.log('Step7: 消除和掉落系统已设置完成');
    }

    /**
     * 处理完整的消除流程（Step7：直接掉落版本）
     * @param {Object} newEgg 新添加的蛋
     */
    processCompleteElimination(newEgg) {
        // 防止重复处理
        if (this.isProcessing) {
            console.log('Step7: 已在处理中，跳过重复处理');
            return;
        }
        
        // 检查蛋是否已被处理过
        if (this.processedEggs.has(newEgg)) {
            console.log('Step7: 蛋已被处理过，跳过重复处理');
            return;
        }
        
        console.log('Step7: 开始直接掉落处理...');
        
        // 设置处理状态
        this.isProcessing = true;
        this.processedEggs.add(newEgg);
        
        // 找到新蛋在网格中的位置
        const gridPosition = this.findEggPositionInGrid(newEgg);
        if (!gridPosition) {
            console.log('Step7: 无法找到蛋在网格中的位置');
            this.isProcessing = false;
            return;
        }
        
        console.log(`Step7: 处理位置 (${gridPosition.row}, ${gridPosition.col}) 的直接掉落`);
        
        // 使用RootManager的直接掉落处理（不标记，直接掉落）
        window.rootManager.processDirectFalling(
            this.gameScene.gridManager,
            gridPosition.row,
            gridPosition.col,
            this.gameScene.sceneContainer.addLayer, // 用于爆炸效果
            (result) => {
                console.log('Step7: 直接掉落处理完成', result);
                
                // 更新统计信息
                this.updateStats(result);
                
                // 检查是否还有可能的连锁反应
                this.checkForChainReactions();
                
                // 重置处理状态
                this.isProcessing = false;
            }
        );
    }

    /**
     * 在网格中查找蛋的位置
     * @param {Object} egg 蛋对象
     * @returns {Object|null} {row, col} 或 null
     */
    findEggPositionInGrid(egg) {
        // 优先使用蛋对象上记录的位置信息
        if (egg.gridRow !== undefined && egg.gridCol !== undefined) {
            return {row: egg.gridRow, col: egg.gridCol};
        }
        
        // 回退方案：遍历网格查找
        if (!this.gameScene.gridManager || !this.gameScene.gridManager.grid) return null;
        
        for (let row = 0; row < this.gameScene.gridManager.rows; row++) {
            for (let col = 0; col < this.gameScene.gridManager.cols; col++) {
                const gridEgg = this.gameScene.gridManager.grid[row][col];
                if (gridEgg === egg) {
                    // 记录位置信息以便下次快速查找
                    egg.gridRow = row;
                    egg.gridCol = col;
                    return {row, col};
                }
            }
        }
        
        return null;
    }

    /**
     * 检查连锁反应
     */
    checkForChainReactions() {
        // 这里可以实现连锁反应检测
        // 暂时只是记录日志
        console.log('Step7: 检查连锁反应...');
    }

    /**
     * 更新统计信息
     * @param {Object} result 掉落结果
     */
    updateStats(result) {
        if (!this.stats) {
            this.stats = {
                fallen: 0,
                chains: 0
            };
        }
        
        this.stats.fallen += result.fallen ? result.fallen.length : 0;
        
        console.log(`Step7 统计: 已掉落${this.stats.fallen}个`);
        
        // 更新统计显示
        this.updateStatsDisplay();
    }

    /**
     * 添加控制按钮
     */
    addControlButtons() {
        // 清除标记按钮 - 右上角第一个
        const clearButton = this.createButton('清除标记', 250, -250, 0x4A90E2, () => {
            console.log('Step7: 手动清除所有消除标记');
            window.rootManager.clearAllEliminationMarkers(this.gameScene.gridManager);
        });
        
        // 重置游戏按钮 - 右上角第二个
        const resetButton = this.createButton('重置游戏', 250, -200, 0xE74C3C, () => {
            console.log('Step7: 重置游戏');
            this.resetGame();
        });
        
        // 手动检测悬空蛋按钮 - 右上角第三个
        const floatingButton = this.createButton('检测悬空', 250, -150, 0x9B59B6, () => {
            console.log('Step7: 手动检测悬空蛋');
            this.manualCheckFloating();
        });
        
        // 显示位置标记按钮 - 右上角第四个
        const markersButton = this.createButton('显示位置', 250, -100, 0x00CED1, () => {
            console.log('Step7: 切换网格显示');
            this.toggleGridDisplay();
        });
        
        this.moduleContainer.addChild(clearButton);
        this.moduleContainer.addChild(resetButton);
        this.moduleContainer.addChild(floatingButton);
        this.moduleContainer.addChild(markersButton);
        
        this.clearButton = clearButton;
        this.resetButton = resetButton;
        this.floatingButton = floatingButton;
        this.markersButton = markersButton;
    }

    /**
     * 创建按钮的辅助方法
     */
    createButton(text, x, y, color, onClick) {
        const buttonContainer = new PIXI.Container();
        buttonContainer.x = x;
        buttonContainer.y = y;
        
        // 创建按钮背景
        const buttonBg = new PIXI.Graphics();
        buttonBg.beginFill(color, 0.8);
        buttonBg.lineStyle(2, 0xFFFFFF, 0.8);
        buttonBg.drawRoundedRect(-60, -15, 120, 30, 5);
        buttonBg.endFill();
        
        // 创建按钮文字
        const buttonText = new PIXI.Text(text, {
            fontFamily: 'Arial',
            fontSize: 12,
            fill: 0xFFFFFF,
            align: 'center'
        });
        buttonText.anchor.set(0.5);
        
        // 组装按钮
        buttonContainer.addChild(buttonBg);
        buttonContainer.addChild(buttonText);
        
        // 添加交互
        buttonContainer.interactive = true;
        buttonContainer.buttonMode = true;
        buttonContainer.on('pointerdown', onClick);
        
        // 添加悬停效果
        buttonContainer.on('pointerover', () => {
            buttonBg.alpha = 1;
        });
        
        buttonContainer.on('pointerout', () => {
            buttonBg.alpha = 0.8;
        });
        
        return buttonContainer;
    }

    /**
     * 切换网格显示
     */
    toggleGridDisplay() {
        const isShowing = window.rootManager.toggleGridDisplay(this.gameScene.gridManager);
        console.log(`Step7: 网格显示状态: ${isShowing ? '显示' : '隐藏'}`);
    }

    /**
     * 更新统计显示
     */
    updateStatsDisplay() {
        if (!this.statsText) {
            this.statsText = new PIXI.Text('', {
                fontFamily: 'Arial',
                fontSize: 14,
                fill: 0xFFFFFF,
                align: 'left'
            });
            this.statsText.x = -290;
            this.statsText.y = -320;
            this.moduleContainer.addChild(this.statsText);
        }
        
        const stats = this.stats || {fallen: 0, chains: 0};
        this.statsText.text = `掉落爆炸: ${stats.fallen} | 连击: ${stats.chains}`;
    }

    /**
     * 重置游戏
     */
    resetGame() {
        // 重置处理状态
        this.isProcessing = false;
        this.processedEggs.clear();
        
        // 清除统计
        this.stats = {fallen: 0, chains: 0};
        this.updateStatsDisplay();
        
        // 清除所有标记
        window.rootManager.clearAllEliminationMarkers(this.gameScene.gridManager);
        
        // 重新生成初始蛋
        this.gameScene.gridManager.clearAllEggs();
        window.rootManager.generateInitialEggs(this.gameScene.gridManager, {
            rows: 5,
            randomColors: true
        });
        
        console.log('Step7: 游戏已重置');
    }

    /**
     * 手动检测和处理悬空蛋
     */
    manualCheckFloating() {
        console.log('Step7: 开始手动检测悬空蛋...');
        
        // 重置处理状态，允许手动检测
        this.isProcessing = false;
        
        window.rootManager.processFloatingEggsRecursively(
            this.gameScene.gridManager,
            this.gameScene.sceneContainer.addLayer,
            (results) => {
                console.log('Step7: 手动悬空检测完成', results);
                this.updateStats({fallen: results});
            }
        );
    }

    destroy() {
        // 重置处理状态
        this.isProcessing = false;
        if (this.processedEggs) {
            this.processedEggs.clear();
        }
        
        // 清除所有消除标记
        if (this.gameScene && this.gameScene.gridManager) {
            window.rootManager.clearAllEliminationMarkers(this.gameScene.gridManager);
        }
        
        // 销毁按钮
        if (this.clearButton) {
            this.clearButton.destroy();
            this.clearButton = null;
        }
        
        if (this.resetButton) {
            this.resetButton.destroy();
            this.resetButton = null;
        }
        
        if (this.floatingButton) {
            this.floatingButton.destroy();
            this.floatingButton = null;
        }
        
        if (this.markersButton) {
            this.markersButton.destroy();
            this.markersButton = null;
        }
        
        // 清理网格显示
        if (this.gameScene && this.gameScene.gridManager) {
            this.gameScene.gridManager.config.showGrid = false;
            this.gameScene.gridManager.showGridLines(false);
        }
        
        if (this.statsText) {
            this.statsText.destroy();
            this.statsText = null;
        }
        
        // 销毁游戏状态
        if (this.gameScene && this.gameScene.gameState) {
            // 清理gameState相关资源
            if (this.gameScene.gameState.nextProjectileDisplay) {
                if (this.gameScene.gameState.nextProjectileDisplay.parent) {
                    this.gameScene.gameState.nextProjectileDisplay.parent.removeChild(this.gameScene.gameState.nextProjectileDisplay);
                }
            }
            
            // 如果gameState有destroy方法则调用，否则简单清理
            if (typeof this.gameScene.gameState.destroy === 'function') {
                this.gameScene.gameState.destroy();
            } else {
                // 手动清理gameState
                this.gameScene.gameState = null;
            }
        }
        
        // 销毁发射器
        if (this.gameScene && this.gameScene.shooter) {
            if (typeof this.gameScene.shooter.destroy === 'function') {
                this.gameScene.shooter.destroy();
            } else {
                // 手动清理发射器
                if (this.gameScene.shooter.container && this.gameScene.shooter.container.parent) {
                    this.gameScene.shooter.container.parent.removeChild(this.gameScene.shooter.container);
                }
                this.gameScene.shooter = null;
            }
        }
        
        // 销毁网格管理器
        if (this.gameScene && this.gameScene.gridManager) {
            if (typeof this.gameScene.gridManager.destroy === 'function') {
                this.gameScene.gridManager.destroy();
            } else {
                // 手动清理网格管理器
                if (this.gameScene.gridManager.container && this.gameScene.gridManager.container.parent) {
                    this.gameScene.gridManager.container.parent.removeChild(this.gameScene.gridManager.container);
                }
                this.gameScene.gridManager = null;
            }
        }
        
        super.destroy();
    }
}

// 暴露到全局
window.Step7TestModule = Step7TestModule;
