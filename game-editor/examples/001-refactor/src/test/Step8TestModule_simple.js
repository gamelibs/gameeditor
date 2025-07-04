/**
 * Step8 测试模块 - 简单容器创建
 */
class Step8TestModule extends BaseTestModule {
    constructor(container, config = {}) {
        super(container, config);
        
        console.log('Step8TestModule 已创建');
    }

    /**
     * 初始化测试模块
     */
    async init() {
        console.log('Step8: 开始初始化...');
        
        // 创建模块容器
        this.moduleContainer = new PIXI.Container();
        this.moduleContainer.x = GAME_CONFIG.WIDTH / 2;
        this.moduleContainer.y = GAME_CONFIG.HEIGHT / 2;
        
        // 保存RootManager引用
        this.rootManager = window.rootManager;
        
        // 标记为已加载
        this.isLoaded = true;
        
        // 创建Step8公共容器
        this.createMainContainer();
        
        console.log('Step8: 初始化完成');
    }

    /**
     * 创建Step8主容器
     */
    createMainContainer() {
        // 使用RootManager创建公共场景容器
        const sceneResult = this.rootManager.createSceneContainer({
            width: 720,
            height: 640,
            title: 'Step8 高级功能测试',
            titleStyle: {
                fontSize: 20,
                fontFamily: 'Arial',
                fill: 0xFFFFFF,
                fontWeight: 'bold'
            },
            containerStyle: {
                backgroundColor: 0x1E1E1E,
                backgroundAlpha: 0.85,
                borderColor: 0x4A90E2,
                borderWidth: 3,
                borderRadius: 12
            }
        });

        // 获取容器
        this.step8Container = sceneResult.container;
        
        // 添加到模块容器
        this.moduleContainer.addChild(this.step8Container);
        this.addResource(this.step8Container);

        console.log('Step8: 主容器已创建 (720x640) - 使用公共场景容器');
    }

    /**
     * 销毁模块
     */
    destroy() {
        // 清理容器
        if (this.step8Container) {
            try {
                if (this.step8Container.parent) {
                    this.step8Container.parent.removeChild(this.step8Container);
                }
                this.step8Container.destroy({ children: true });
            } catch (error) {
                console.warn('销毁Step8容器时出错:', error);
            }
            this.step8Container = null;
        }
        
        // 调用父类销毁
        super.destroy();
    }

    /**
     * 更新循环
     */
    update(time, delta) {
        // 调用父类更新
        super.update(time, delta);
    }

    /**
     * 获取模块信息
     */
    getInfo() {
        return {
            name: 'Step8TestModule',
            description: 'Step8 简单容器测试',
            version: '1.0.0'
        };
    }
}

// 暴露到全局
window.Step8TestModule = Step8TestModule;
