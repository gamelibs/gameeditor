/**
 * Step5 测试模块 - 使用公共泡泡龙游戏场景
 */
class Step5TestModule extends BaseTestModule {
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
                title: 'Step5: 顶部网格蛋测试',
                titleStyle: {
                    fontFamily: 'Arial',
                    fontSize: 18,
                    fill: 0xFF0000,
                    fontWeight: 'bold'
                }
            },
            grid: {
                showGrid: true, // 显示网格辅助线
                gridAlpha: 0.3
            },
            initialEggs: {
                rows: 2, // 只在顶部两行生成蛋
                randomColors: true
            }
        });

        // 将游戏场景添加到模块容器
        this.moduleContainer.addChild(this.gameScene.sceneContainer.container);
        
        this.isLoaded = true;
        console.log('Step5 测试模块初始化完成 - 使用公共游戏场景');
    }

    destroy() {
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
window.Step5TestModule = Step5TestModule;
