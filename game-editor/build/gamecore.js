/**
 * 游戏核心引擎 - GameCore
 * 参考LayaAir架构设计，负责引擎初始化和基础服务
 * 职责：PIXI初始化、系统注册、基础服务提供
 */

class GameCore {
    static app = null;
    static isInitialized = false;
    static registeredSystems = new Map();
    static layerManager = null;

    /**
     * 初始化游戏核心引擎
     * 类似 Laya.init()
     */
    static async init(width = 750, height = 1334) {
        if (this.isInitialized) {
            console.log('🎮 GameCore已初始化');
            return this.app;
        }

        try {
            console.log('🚀 开始初始化GameCore...');
            
            // 1. 检查PIXI依赖
            if (typeof PIXI === 'undefined') {
                throw new Error('PIXI.js未加载');
            }

            // 2. 创建PIXI应用实例
            this.app = new PIXI.Application();
            
            await this.app.init({
                width: width,
                height: height,
                background: '#1a1a1a',
                antialias: true,
                resolution: window.devicePixelRatio || 1,
                autoDensity: true
            });

            // 3. 设置canvas样式
            this.app.canvas.style.width = '100%';
            this.app.canvas.style.height = '100%';
            this.app.canvas.style.objectFit = 'contain';

            // 4. 初始化核心系统
            this.initCoreSystems();

            // 5. 初始化分层管理器
            this.initLayerManager();

            this.isInitialized = true;
            console.log('✅ GameCore初始化成功');
            
            return this.app;

        } catch (error) {
            console.error('❌ GameCore初始化失败:', error);
            throw error;
        }
    }

    /**
     * 初始化核心系统
     * 类似LayaAir的系统注册机制
     */
    static initCoreSystems() {
        console.log('🔧 初始化核心系统...');
        
        // 注册时间系统
        this.registerSystem('Timer', {
            update: (deltaTime) => {
                // 时间系统更新逻辑
            }
        });

        // 注册资源系统
        this.registerSystem('ResourceManager', {
            loadTexture: (url) => PIXI.Texture.from(url),
            loadSound: (url) => { /* 音频加载逻辑 */ }
        });

        // 注册输入系统
        this.registerSystem('InputManager', {
            onPointerDown: (event) => { /* 输入处理 */ }
        });

        console.log('✅ 核心系统初始化完成');
    }

    /**
     * 初始化分层管理器
     * 类似LayaAir的Scene/Layer概念
     */
    static initLayerManager() {
        console.log('🏗️ 初始化分层管理器...');
        
        this.layerManager = {
            layers: new Map(),
            
            // 创建标准游戏分层
            createStandardLayers() {
                const stage = GameCore.app.stage;
                
                // 背景层
                const backgroundLayer = new PIXI.Container();
                backgroundLayer.name = 'BackgroundLayer';
                backgroundLayer.zIndex = 0;
                stage.addChild(backgroundLayer);
                this.layers.set('background', backgroundLayer);

                // 游戏层
                const gameLayer = new PIXI.Container();
                gameLayer.name = 'GameLayer';
                gameLayer.zIndex = 100;
                stage.addChild(gameLayer);
                this.layers.set('game', gameLayer);

                // UI层
                const uiLayer = new PIXI.Container();
                uiLayer.name = 'UILayer';
                uiLayer.zIndex = 200;
                stage.addChild(uiLayer);
                this.layers.set('ui', uiLayer);

                // 弹窗层
                const popupLayer = new PIXI.Container();
                popupLayer.name = 'PopupLayer';
                popupLayer.zIndex = 300;
                stage.addChild(popupLayer);
                this.layers.set('popup', popupLayer);

                // 启用排序
                stage.sortableChildren = true;
                
                console.log('✅ 标准分层创建完成');
            },

            // 获取指定层
            getLayer(layerName) {
                return this.layers.get(layerName);
            },

            // 添加自定义层
            addLayer(layerName, zIndex = 0) {
                const layer = new PIXI.Container();
                layer.name = layerName;
                layer.zIndex = zIndex;
                GameCore.app.stage.addChild(layer);
                this.layers.set(layerName, layer);
                return layer;
            }
        };

        // 创建标准分层
        this.layerManager.createStandardLayers();
        
        console.log('✅ 分层管理器初始化完成');
    }

    /**
     * 注册系统服务
     */
    static registerSystem(name, system) {
        this.registeredSystems.set(name, system);
        console.log(`� 系统已注册: ${name}`);
    }

    /**
     * 获取系统服务
     */
    static getSystem(name) {
        return this.registeredSystems.get(name);
    }

    /**
     * 获取PIXI应用实例
     */
    static getApp() {
        return this.app;
    }

    /**
     * 获取分层管理器
     */
    static getLayerManager() {
        return this.layerManager;
    }

    /**
     * 获取指定层容器
     */
    static getLayer(layerName) {
        return this.layerManager?.getLayer(layerName);
    }

    /**
     * 检查是否已初始化
     */
    static isReady() {
        return this.isInitialized && this.app !== null;
    }

    /**
     * 调整游戏尺寸
     */
    static resize(width, height) {
        if (this.app) {
            this.app.renderer.resize(width, height);
        }
    }

    /**
     * 清空指定层或整个舞台
     */
    static clearLayer(layerName = null) {
        if (layerName) {
            const layer = this.getLayer(layerName);
            if (layer) {
                layer.removeChildren();
            }
        } else {
            // 清空所有层
            if (this.app && this.app.stage) {
                this.app.stage.removeChildren();
            }
        }
    }

    /**
     * 销毁游戏核心
     */
    static destroy() {
        if (this.app) {
            this.app.destroy(true);
            this.app = null;
        }
        this.registeredSystems.clear();
        this.layerManager = null;
        this.isInitialized = false;
        console.log('🗑️ GameCore已销毁');
    }
}

// 导出到全局
window.GameCore = GameCore;
