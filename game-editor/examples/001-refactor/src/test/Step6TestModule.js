/**
 * Step6 测试模块 - 完整泡泡龙游戏（包含消除和掉落）
 */
class Step6TestModule extends BaseTestModule {
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
        
        // 使用RootManager创建完整的泡泡龙游戏场景
        this.gameScene = window.rootManager.createBubbleGameScene({
            scene: {
                title: 'Step6: 完整泡泡龙游戏',
                titleStyle: {
                    fontFamily: 'Arial',
                    fontSize: 18,
                    fill: 0x00FF00, // 绿色标题
                    fontWeight: 'bold'
                }
            },
            grid: {
                showGrid: false, // 不显示网格辅助线，更像正式游戏
                gridAlpha: 0.2
            },
            initialEggs: {
                rows: 4, // 生成更多行的初始蛋，增加挑战
                randomColors: true
            }
        });

        // 将游戏场景添加到模块容器
        this.moduleContainer.addChild(this.gameScene.sceneContainer.container);
        
        // 添加清除标记按钮
        this.addClearMarkersButton();
        
        // 扩展游戏状态以支持消除和掉落
        this.setupAdvancedGameLogic();
        
        this.isLoaded = true;
        console.log('Step6 测试模块初始化完成 - 完整泡泡龙游戏');
    }

    setupAdvancedGameLogic() {
        // 这里可以添加消除检测、掉落检测等高级游戏逻辑
        console.log('Step6: 准备添加消除和掉落逻辑...');
        
        // 获取原来的碰撞检测器的方法
        const originalCollisionDetector = this.gameScene.gameState.collisionDetector;
        const originalStopProjectilePhysics = originalCollisionDetector.stopProjectilePhysics;
        const originalAttachToGrid = originalCollisionDetector.attachToGrid;
        
        // 创建增强的碰撞检测器，包装原有功能
        const enhancedCollisionDetector = window.rootManager.createCollisionDetector({
            gridManager: this.gameScene.gridManager,
            checkRadius: 36,
            onCollision: (projectile, collisionInfo) => {
                console.log(`Step6 增强碰撞检测: 发射物与网格(${collisionInfo.row}, ${collisionInfo.col})碰撞`);
                
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
                        console.log(`Step6: 发射物已从活跃列表移除，剩余: ${this.gameScene.gameState.activeProjectiles.length}`);
                    }
                    
                    // 检测消除（等待蛋附加到网格后再检测）
                    setTimeout(() => {
                        console.log('Step6: 开始检测消除匹配...');
                        this.checkForMatches(projectile);
                    }, 400); // 增加延迟确保附加完成
                    
                    // 准备下一个发射物
                    this.gameScene.gameState.prepareNextProjectile();
                }
            }
        });
        
        // 直接替换碰撞检测器，现在碰撞检测循环会使用新的检测器
        this.gameScene.gameState.collisionDetector = enhancedCollisionDetector;
        
        console.log('Step6: 碰撞检测已增强，添加了消除检测功能');
    }

    /**
     * 检测消除匹配（使用RootManager的连通性检测）
     * @param {Object} newEgg 新添加的蛋
     */
    checkForMatches(newEgg) {
        console.log('Step6: checkForMatches 被调用，蛋对象:', newEgg);
        
        if (!newEgg.eggGameColor) {
            console.log('Step6: 蛋没有颜色信息，跳过检测');
            return;
        }
        
        console.log('Step6: 检测消除匹配，蛋颜色:', newEgg.eggGameColor.toString(16));
        
        // 找到新蛋在网格中的位置
        const gridPosition = this.findEggPositionInGrid(newEgg);
        if (!gridPosition) {
            console.log('Step6: 无法找到蛋在网格中的位置');
            return;
        }
        
        console.log(`Step6: 蛋在网格位置 (${gridPosition.row}, ${gridPosition.col})`);
        
        // 使用RootManager的连通性检测
        const matchResult = window.rootManager.checkAndMarkMatches(
            this.gameScene.gridManager, 
            gridPosition.row, 
            gridPosition.col, 
            3 // 至少3个才能消除
        );
        
        console.log('Step6: 匹配检测结果:', matchResult);
        
        if (matchResult.matched) {
            console.log(`Step6: 发现${matchResult.count}个连接的颜色${matchResult.color.toString(16)}蛋，已标记准备消除！`);
            
            // 这里可以添加消除逻辑，暂时只是显示标记
            setTimeout(() => {
                console.log('Step6: 开始消除动画...');
                // 后续可以在这里实现真正的消除逻辑
            }, 1500);
        } else {
            console.log(`Step6: 只有${matchResult.count}个连接的同色蛋，不足以消除`);
        }
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
     * 查找连接的同色蛋数量（已废弃，使用RootManager的方法）
     * @param {Object} egg 起始蛋
     * @returns {number} 连接的同色蛋数量
     */
    findConnectedEggs(egg) {
        // 这个方法已经被RootManager的方法替代
        console.warn('findConnectedEggs方法已废弃，请使用RootManager.findConnectedEggs');
        return 1;
    }

    /**
     * 添加清除标记按钮
     */
    addClearMarkersButton() {
        // 创建按钮容器
        const buttonContainer = new PIXI.Container();
        buttonContainer.x = -250; // 放置在左边
        buttonContainer.y = 280;  // 底部
        
        // 创建按钮背景
        const buttonBg = new PIXI.Graphics();
        buttonBg.beginFill(0x4A90E2, 0.8);
        buttonBg.lineStyle(2, 0xFFFFFF, 0.8);
        buttonBg.drawRoundedRect(-60, -15, 120, 30, 5);
        buttonBg.endFill();
        
        // 创建按钮文字
        const buttonText = new PIXI.Text('清除标记', {
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
        
        buttonContainer.on('pointerdown', () => {
            console.log('Step6: 手动清除所有消除标记');
            window.rootManager.clearAllEliminationMarkers(this.gameScene.gridManager);
        });
        
        // 添加悬停效果
        buttonContainer.on('pointerover', () => {
            buttonBg.clear();
            buttonBg.beginFill(0x357ABD, 0.9);
            buttonBg.lineStyle(2, 0xFFFFFF, 1);
            buttonBg.drawRoundedRect(-60, -15, 120, 30, 5);
            buttonBg.endFill();
        });
        
        buttonContainer.on('pointerout', () => {
            buttonBg.clear();
            buttonBg.beginFill(0x4A90E2, 0.8);
            buttonBg.lineStyle(2, 0xFFFFFF, 0.8);
            buttonBg.drawRoundedRect(-60, -15, 120, 30, 5);
            buttonBg.endFill();
        });
        
        this.moduleContainer.addChild(buttonContainer);
        this.clearMarkersButton = buttonContainer;
    }

    destroy() {
        // 清除所有消除标记
        if (this.gameScene && this.gameScene.gridManager) {
            window.rootManager.clearAllEliminationMarkers(this.gameScene.gridManager);
        }
        
        // 销毁清除按钮
        if (this.clearMarkersButton) {
            this.clearMarkersButton.destroy();
            this.clearMarkersButton = null;
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
            this.gameScene.gridManager.destroy();
        }
        
        super.destroy();
    }
}

// 暴露到全局
window.Step6TestModule = Step6TestModule;
