/**
 * 基础测试模块类
 * 所有测试模块都应继承此类
 */
class BaseTestModule {
    constructor(container, config = {}) {
        this.container = container; // 父容器
        this.config = config;
        this.isLoaded = false;
        this.isActive = false;
        
        // 模块的主容器
        this.moduleContainer = null;
        
        // 模块特有的资源数组
        this.resources = [];
        this.eventHandlers = [];
        this.intervals = [];
        this.timeouts = [];
    }

    /**
     * 初始化模块 - 子类必须实现
     */
    async init() {
        throw new Error('init() method must be implemented by subclass');
    }

    /**
     * 激活模块 - 子类可以重写
     */
    activate() {
        if (!this.isLoaded) {
            console.warn('Module not loaded, cannot activate');
            return;
        }
        
        this.isActive = true;
        
        if (this.moduleContainer && this.container) {
            this.container.addChild(this.moduleContainer);
        }
        
        this.onActivate();
    }

    /**
     * 停用模块 - 子类可以重写
     */
    deactivate() {
        this.isActive = false;
        
        if (this.moduleContainer && this.moduleContainer.parent) {
            this.moduleContainer.parent.removeChild(this.moduleContainer);
        }
        
        this.onDeactivate();
    }

    /**
     * 销毁模块
     */
    destroy() {
        this.deactivate();
        
        // 清理所有定时器
        this.intervals.forEach(interval => clearInterval(interval));
        this.timeouts.forEach(timeout => clearTimeout(timeout));
        
        // 移除所有事件监听器
        this.eventHandlers.forEach(handler => {
            try {
                // 检查目标对象是否仍然存在且有效
                if (handler.target && 
                    !handler.target.destroyed && 
                    typeof handler.target.removeListener === 'function') {
                    handler.target.removeListener(handler.event, handler.callback);
                } else if (handler.target && 
                          !handler.target.destroyed && 
                          typeof handler.target.off === 'function') {
                    handler.target.off(handler.event, handler.callback);
                }
            } catch (error) {
                console.warn('移除事件监听器时出错:', error);
            }
        });
        
        // 销毁主容器
        if (this.moduleContainer) {
            try {
                if (this.moduleContainer.parent) {
                    this.moduleContainer.parent.removeChild(this.moduleContainer);
                }
                this.moduleContainer.destroy({ children: true });
            } catch (error) {
                console.warn('销毁模块容器时出错:', error);
            }
            this.moduleContainer = null;
        }
        
        // 清理资源数组
        this.resources.forEach(resource => {
            try {
                if (resource && typeof resource.destroy === 'function') {
                    // 检查对象是否已经销毁
                    if (resource.destroyed !== true) {
                        resource.destroy({ children: true });
                    }
                }
            } catch (error) {
                console.warn('销毁资源时出错:', error);
            }
        });
        
        this.resources = [];
        this.eventHandlers = [];
        this.intervals = [];
        this.timeouts = [];
        
        this.isLoaded = false;
        this.isActive = false;
        
        this.onDestroy();
    }

    /**
     * 添加资源到管理列表
     */
    addResource(resource) {
        this.resources.push(resource);
        return resource;
    }

    /**
     * 添加事件监听器到管理列表
     */
    addEventHandler(target, event, callback) {
        const handler = { target, event, callback };
        this.eventHandlers.push(handler);
        
        // 支持PIXI的不同事件监听方法
        if (typeof target.on === 'function') {
            target.on(event, callback);
        } else if (typeof target.addEventListener === 'function') {
            target.addEventListener(event, callback);
        }
        
        return handler;
    }

    /**
     * 添加定时器到管理列表
     */
    addInterval(callback, interval) {
        const id = setInterval(callback, interval);
        this.intervals.push(id);
        return id;
    }

    /**
     * 添加延时器到管理列表
     */
    addTimeout(callback, timeout) {
        const id = setTimeout(callback, timeout);
        this.timeouts.push(id);
        return id;
    }

    /**
     * 创建控制按钮的辅助方法
     */
    createControlButton(text, x, y, callback, width = 70, height = 30) {
        const button = new PIXI.Container();
        button.x = x;
        button.y = y;
        
        // 按钮背景
        const bg = new PIXI.Graphics();
        bg.beginFill(0x3498DB);
        bg.drawRoundedRect(0, 0, width, height, 6);
        bg.endFill();
        
        // 按钮文本
        const buttonText = new PIXI.Text(text, {
            fontFamily: 'Arial',
            fontSize: 12,
            fill: 0xFFFFFF,
            fontWeight: 'bold'
        });
        buttonText.anchor.set(0.5);
        buttonText.x = width / 2;
        buttonText.y = height / 2;
        
        button.addChild(bg);
        button.addChild(buttonText);
        
        // 交互
        button.interactive = true;
        button.buttonMode = true;
        
        this.addEventHandler(button, 'pointerdown', callback);
        
        this.addEventHandler(button, 'pointerover', () => {
            bg.clear();
            bg.beginFill(0x2980B9);
            bg.drawRoundedRect(0, 0, width, height, 6);
            bg.endFill();
        });
        
        this.addEventHandler(button, 'pointerout', () => {
            bg.clear();
            bg.beginFill(0x3498DB);
            bg.drawRoundedRect(0, 0, width, height, 6);
            bg.endFill();
        });
        
        this.addResource(button);
        return button;
    }

    // 生命周期钩子 - 子类可以重写
    onActivate() {}
    onDeactivate() {}
    onDestroy() {}

    // 获取模块信息 - 子类应该重写
    getInfo() {
        return {
            name: 'BaseTestModule',
            description: '基础测试模块',
            version: '1.0.0'
        };
    }
}

// 暴露到全局
window.BaseTestModule = BaseTestModule;
