/**
 * 测试模块管理器
 * 负责加载、管理和切换各个测试模块
 */
class TestModuleManager {
    constructor() {
        this.modules = new Map();
        this.currentModule = null;
        this.container = null;
        
        // 注册所有可用的测试模块
        this.registerModules();
    }

    /**
     * 注册所有可用的测试模块
     */
    registerModules() {
        this.modules.set('step1', {
            name: 'Step1TestModule',
            class: Step1TestModule,
            title: 'Step 1: 泡泡网格初始化',
            description: '测试创建物体元素和网格布局'
        });

        this.modules.set('step2', {
            name: 'Step2TestModule',
            class: Step2TestModule,
            title: 'Step 2: 发射小球机制',
            description: '测试射手、瞄准线和发射系统'
        });

        this.modules.set('step3', {
            name: 'Step3TestModule',
            class: Step3TestModule,
            title: 'Step 3: 碰撞检测与颜色匹配',
            description: '测试发射器和物理系统'
        });

        this.modules.set('step4', {
            name: 'Step4TestModule',
            class: Step4TestModule,
            title: 'Step 4: 进阶物理交互',
            description: '测试复杂物理交互和碰撞响应'
        });

        this.modules.set('step5', {
            name: 'Step5TestModule',
            class: Step5TestModule,
            title: 'Step 5: 游戏逻辑',
            description: '测试完整的发射和对齐系统'
        });

        this.modules.set('step6', {
            name: 'Step6TestModule',
            class: Step6TestModule,
            title: 'Step 6: 完整泡泡龙游戏',
            description: '测试消除机制、掉落检测和完整游戏流程'
        });

        this.modules.set('step7', {
            name: 'Step7TestModule',
            class: Step7TestModule,
            title: 'Step 7: 消除和掉落系统',
            description: '测试完整的消除、掉落动画和爆炸效果'
        });

        this.modules.set('step8', {
            name: 'Step8TestModule',
            class: Step8TestModule,
            title: 'Step 8: 高级游戏功能',
            description: '测试高级游戏功能和扩展特性'
        });

        console.log(`TestModuleManager: 已注册 ${this.modules.size} 个测试模块`);
    }

    /**
     * 设置容器
     */
    setContainer(container) {
        this.container = container;
    }

    /**
     * 加载指定的测试模块
     */
    async loadModule(moduleIdOrStepNumber) {
        // 支持传入模块ID（如"step1"）或步骤编号（如1）
        let moduleId;
        if (typeof moduleIdOrStepNumber === 'string') {
            moduleId = moduleIdOrStepNumber;
        } else {
            moduleId = `step${moduleIdOrStepNumber}`;
        }
        
        const moduleInfo = this.modules.get(moduleId);
        
        if (!moduleInfo) {
            console.error(`TestModuleManager: 未找到模块 ${moduleId}`);
            return false;
        }

        try {
            // 清理当前模块
            await this.unloadCurrentModule();
            
            // 创建新模块实例
            console.log(`TestModuleManager: 加载模块 ${moduleInfo.title}`);
            const ModuleClass = moduleInfo.class;
            
            // 从模块ID中提取步骤编号
            const stepNumber = parseInt(moduleId.replace('step', ''));
            
            this.currentModule = new ModuleClass(this.container, {
                moduleId: moduleId,
                stepNumber: stepNumber
            });
            
            // 初始化模块
            await this.currentModule.init();
            
            // 添加到容器
            if (this.container && this.currentModule.moduleContainer) {
                this.container.addChild(this.currentModule.moduleContainer);
            }
            
            console.log(`TestModuleManager: 模块 ${moduleInfo.title} 加载完成`);
            return true;
            
        } catch (error) {
            console.error(`TestModuleManager: 加载模块 ${moduleId} 失败:`, error);
            return false;
        }
    }

    /**
     * 卸载当前模块
     */
    async unloadCurrentModule() {
        if (this.currentModule) {
            console.log('TestModuleManager: 卸载当前模块');
            
            // 从容器中移除
            if (this.container && this.currentModule.moduleContainer) {
                this.container.removeChild(this.currentModule.moduleContainer);
            }
            
            // 销毁模块
            if (this.currentModule.destroy) {
                this.currentModule.destroy();
            }
            
            this.currentModule = null;
        }
    }

    /**
     * 获取模块信息
     */
    getModuleInfo(moduleIdOrStepNumber) {
        // 支持传入模块ID（如"step1"）或步骤编号（如1）
        let moduleId;
        if (typeof moduleIdOrStepNumber === 'string') {
            moduleId = moduleIdOrStepNumber;
        } else {
            moduleId = `step${moduleIdOrStepNumber}`;
        }
        return this.modules.get(moduleId);
    }

    /**
     * 获取所有模块信息
     */
    getAllModules() {
        return Array.from(this.modules.values());
    }

    /**
     * 销毁管理器
     */
    destroy() {
        this.unloadCurrentModule();
        this.modules.clear();
        this.container = null;
    }
}

// 暴露到全局
window.TestModuleManager = TestModuleManager;
