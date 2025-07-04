/**
 * 场景管理器 - 负责场景容器创建和管理
 * 从RootManager中拆分出的场景相关功能
 */
class SceneManager {
    constructor(gameConfig = null) {
        this.config = gameConfig || window.gameConfig || {};
        
        // 场景容器缓存
        this.sceneContainers = new Map();
        
        console.log('SceneManager: 已初始化');
    }

    /**
     * 创建场景容器
     * @param {object} options - 配置选项
     * @returns {object} 场景容器对象
     */
    createSceneContainer(options = {}) {
        // 默认配置 - 不设置任何内部偏移，完全由外部控制
        const config = {
            x: 0,  // 完全由外部传入
            y: 0,  // 完全由外部传入
            width: 400,
            height: 300,
            title: '',
            titleStyle: {
                fontFamily: 'Arial',
                fontSize: 16,
                fill: 0xFF0000,  // 默认红色
                fontWeight: 'bold',
                align: 'center'
            },
            background: {
                color: 0x2C3E50,
                alpha: 0.1,
                borderColor: 0xFFFFFF,  // 白色边框
                borderWidth: 2,
                borderRadius: 0  // 直角，不要圆角
            },
            ...options
        };

        // 创建主容器
        const mainContainer = new PIXI.Container();
        mainContainer.x = config.x;
        mainContainer.y = config.y;

        // 第三层：背景层（底层）
        const backgroundLayer = new PIXI.Graphics();
        
        // 绘制背景
        if (config.background.color !== null) {
            backgroundLayer.beginFill(config.background.color, config.background.alpha);
            if (config.background.borderRadius > 0) {
                // 圆角矩形
                backgroundLayer.drawRoundedRect(
                    -config.width / 2, 
                    -config.height / 2, 
                    config.width, 
                    config.height,
                    config.background.borderRadius
                );
            } else {
                // 直角矩形
                backgroundLayer.drawRect(
                    -config.width / 2, 
                    -config.height / 2, 
                    config.width, 
                    config.height
                );
            }
            backgroundLayer.endFill();
        }
        
        // 绘制边框 - 白色直角边框
        backgroundLayer.lineStyle(
            config.background.borderWidth, 
            config.background.borderColor, 
            0.8
        );
        if (config.background.borderRadius > 0) {
            backgroundLayer.drawRoundedRect(
                -config.width / 2, 
                -config.height / 2, 
                config.width, 
                config.height,
                config.background.borderRadius
            );
        } else {
            backgroundLayer.drawRect(
                -config.width / 2, 
                -config.height / 2, 
                config.width, 
                config.height
            );
        }

        // 第二层：对象添加层（中层）
        const addLayer = new PIXI.Container();

        // 第一层：文字说明层（顶层）
        const textLayer = new PIXI.Container();
        
        // 创建标题文字 - 位置在 (0,0)
        let titleText = null;
        if (config.title) {
            titleText = new PIXI.Text(config.title, config.titleStyle);
            titleText.anchor.set(0.5);
            titleText.x = 0;  // 在容器的 (0,0) 位置
            titleText.y = 0;  // 在容器的 (0,0) 位置
            textLayer.addChild(titleText);
        }

        // 按层级顺序添加到主容器
        mainContainer.addChild(backgroundLayer); // 背景层在最底
        mainContainer.addChild(addLayer);        // 对象层在中间
        mainContainer.addChild(textLayer);       // 文字层在最顶

        // 创建场景对象
        const sceneResult = {
            container: mainContainer,     // 主容器
            backgroundLayer,             // 背景层
            addLayer,                   // 对象添加层 - 主要使用这个层添加子对象
            textLayer,                  // 文字层
            titleText,                  // 标题文字对象
            config,                     // 配置信息
            
            // 便捷方法：向对象层添加子元素
            addChild: (child) => {
                addLayer.addChild(child);
            },
            
            // 便捷方法：从对象层移除子元素
            removeChild: (child) => {
                addLayer.removeChild(child);
            },
            
            // 便捷方法：销毁场景
            destroy: () => {
                mainContainer.destroy({ children: true });
            }
        };

        // 缓存场景容器
        const sceneId = `scene_${Date.now()}_${Math.random()}`;
        this.sceneContainers.set(sceneId, sceneResult);
        sceneResult.id = sceneId;

        return sceneResult;
    }

    /**
     * 创建泡泡游戏场景
     * @param {object} config - 配置
     * @returns {object} 游戏场景对象
     */
    createBubbleGameScene(config = {}) {
        const finalConfig = {
            scene: {
                width: 800,
                height: 600,
                title: '蛋蛋射击游戏',
                titleStyle: {
                    fontFamily: 'Arial',
                    fontSize: 18,
                    fill: 0xFF0000,
                    fontWeight: 'bold'
                },
                background: {
                    color: 0x2C3E50,
                    alpha: 0.1,
                    borderColor: 0xFFFFFF,
                    borderWidth: 2,
                    borderRadius: 0
                }
            },
            grid: {
                rows: 6,
                cols: 8,
                eggRadius: 18,
                startX: -140,
                startY: -200,
                showGrid: true
            },
            shooter: {
                enabled: true,
                x: 0,
                y: 250,
                projectileColor: null // 随机颜色
            },
            physics: {
                enabled: true,
                bounds: {
                    minX: -300,
                    maxX: 300,
                    minY: -350,
                    maxY: 350
                }
            },
            gameLogic: {
                enableElimination: true,
                enableFloatingDetection: true,
                minMatchCount: 3
            },
            ...config
        };

        // 创建场景容器
        const sceneContainer = this.createSceneContainer(finalConfig.scene);

        // 创建网格管理器
        if (typeof window.GridManager !== 'function') {
            throw new Error('GridManager 类未加载或不可用');
        }
        
        const gridManager = new window.GridManager({
            rows: finalConfig.grid.rows,
            cols: finalConfig.grid.cols,
            eggRadius: finalConfig.grid.eggRadius,
            startX: finalConfig.grid.startX,
            startY: finalConfig.grid.startY,
            showGrid: finalConfig.grid.showGrid,
            gridColor: finalConfig.grid.gridColor,
            gridAlpha: finalConfig.grid.gridAlpha
        });

        // 创建网格容器并添加到场景
        gridManager.createGridContainer(sceneContainer.addLayer);

        // 设置网格显示状态
        if (finalConfig.grid.showGrid) {
            gridManager.showGrid();
        } else {
            gridManager.hideGrid();
        }

        // 创建发射器（如果启用）
        let shooter = null;
        if (finalConfig.shooter.enabled && window.shooterManager) {
            const shooterConfig = {
                x: finalConfig.shooter.x,
                y: finalConfig.shooter.y,
                projectileColor: finalConfig.shooter.projectileColor,
                container: sceneContainer.addLayer
            };
            
            shooter = window.shooterManager.createShooter(shooterConfig);
        }

        // 创建游戏状态
        const gameState = window.gameLogicManager ? 
            window.gameLogicManager.createBubbleGameState({
                nextProjectileContainer: sceneContainer.addLayer
            }) : null;

        // 设置物理边界
        if (finalConfig.physics.enabled && window.physicsManager) {
            const bounds = this.calculatePhysicsBounds(finalConfig);
            window.physicsManager.setBounds(
                bounds.minX, bounds.maxX, 
                bounds.minY, bounds.maxY
            );
        }

        // 创建碰撞检测器（如果需要）
        let collisionDetector = null;
        if (finalConfig.gameLogic.enableElimination && window.collisionManager) {
            collisionDetector = window.collisionManager.createCollisionDetector({
                gridManager: gridManager,
                minMatchCount: finalConfig.gameLogic.minMatchCount
            });
        }

        // 组装游戏场景对象
        const gameScene = {
            sceneContainer,
            gridManager,
            shooter,
            gameState,
            collisionDetector,
            config: finalConfig,
            
            // 便捷方法
            addToScene: (child) => sceneContainer.addLayer.addChild(child),
            removeFromScene: (child) => sceneContainer.addLayer.removeChild(child),
            
            // 销毁场景
            destroy: () => {
                if (gridManager) gridManager.destroy();
                if (shooter) shooter.destroy();
                if (collisionDetector) collisionDetector.destroy();
                sceneContainer.destroy();
            }
        };

        return gameScene;
    }

    /**
     * 计算物理边界
     * @param {object} sceneConfig - 场景配置
     * @returns {object} 物理边界
     */
    calculatePhysicsBounds(sceneConfig) {
        const scene = sceneConfig.scene || {};
        const physics = sceneConfig.physics || {};
        
        // 默认边界基于场景尺寸
        const defaultBounds = {
            minX: -(scene.width || 400) / 2,
            maxX: (scene.width || 400) / 2,
            minY: -(scene.height || 300) / 2,
            maxY: (scene.height || 300) / 2
        };

        // 合并自定义边界
        return {
            ...defaultBounds,
            ...physics.bounds
        };
    }

    /**
     * 获取场景容器
     * @param {string} sceneId - 场景ID
     * @returns {object|null} 场景容器
     */
    getSceneContainer(sceneId) {
        return this.sceneContainers.get(sceneId) || null;
    }

    /**
     * 销毁场景容器
     * @param {string} sceneId - 场景ID
     */
    destroySceneContainer(sceneId) {
        const scene = this.sceneContainers.get(sceneId);
        if (scene) {
            scene.destroy();
            this.sceneContainers.delete(sceneId);
        }
    }

    /**
     * 清理所有场景容器
     */
    clearAllScenes() {
        this.sceneContainers.forEach((scene, id) => {
            scene.destroy();
        });
        this.sceneContainers.clear();
        console.log('所有场景容器已清理');
    }

    /**
     * 获取调试信息
     */
    getDebugInfo() {
        return {
            sceneManager: this.constructor.name,
            sceneCount: this.sceneContainers.size,
            sceneIds: Array.from(this.sceneContainers.keys()),
            configValid: !!this.config
        };
    }
}

// 暴露到全局
window.SceneManager = SceneManager;
