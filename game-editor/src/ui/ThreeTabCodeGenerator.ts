import { LGraph } from 'litegraph.js';

/**
 * 三标签页代码生成器
 * 为三个不同的标签页生成专门的内容
 */
export class ThreeTabCodeGenerator {
  private graph: LGraph;

  constructor(graph: LGraph) {
    this.graph = graph;
  }

  /**
   * 生成游戏逻辑代码（第一个标签）
   * 根据节点图生成的游戏逻辑，无节点时为空白
   */
  generateGameLogic(): string {
    const nodes = (this.graph as any)._nodes || [];
    
    if (nodes.length === 0) {
      return `// 🎮 游戏逻辑代码
// 当前没有节点，请在编辑器中添加节点来生成游戏逻辑

/*
提示：
- 从左侧节点库拖拽节点到编辑器
- 连接节点来构建游戏逻辑
- 代码将根据您的节点图实时生成
*/`;
    }

    return this.generateNodeBasedGameLogic(nodes);
  }

  /**
   * 生成运行时引擎代码（第二个标签）
   * 展示gamecore.js游戏核心引擎代码
   */
  generateRuntime(): string {
    return this.generateRuntimeEngine();
  }

  /**
   * 生成运行时引擎代码（第二个标签）
   * 展示gamecore.js游戏核心引擎代码
   */
  generateRuntimeEngine(): string {
    return `/**
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
        console.log(\`📦 系统已注册: \${name}\`);
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

/**
 * 游戏逻辑调度器 - GameLogic
 * 参考LayaAir的Scene管理，负责游戏逻辑调度和生命周期管理
 * 职责：分层类注册、场景管理、游戏流程控制
 */
class GameLogic {
    constructor() {
        this.isRunning = false;
        this.gameState = {
            score: 0,
            level: 1,
            isPaused: false
        };
        this.registeredComponents = new Map();
        this.activeScene = null;
        this.updateQueue = [];
    }

    /**
     * 初始化游戏逻辑
     * 这里负责分层类注册和游戏对象管理
     */
    async init(graphData = null) {
        try {
            console.log('🎯 初始化GameLogic...');

            // 1. 确保GameCore已初始化
            if (!GameCore.isReady()) {
                throw new Error('GameCore未初始化，请先调用GameCore.init()');
            }

            // 2. 注册分层组件类
            this.registerLayerComponents();

            // 3. 创建默认场景
            this.createDefaultScene();

            // 4. 根据节点图数据初始化游戏对象
            if (graphData) {
                this.initFromGraphData(graphData);
            }

            // 5. 启动游戏循环
            this.startGameLoop();

            console.log('✅ GameLogic初始化完成');
            return this;

        } catch (error) {
            console.error('❌ GameLogic初始化失败:', error);
            throw error;
        }
    }

    /**
     * 注册分层组件类
     * 类似LayaAir的组件注册机制
     */
    registerLayerComponents() {
        console.log('📋 注册分层组件类...');

        // 背景组件
        this.registerComponent('BackgroundComponent', {
            layer: 'background',
            create: (config) => {
                const bg = new PIXI.Graphics();
                bg.rect(0, 0, 750, 1334);
                bg.fill(config.color || 0x1a1a1a);
                return bg;
            }
        });

        // 精灵组件
        this.registerComponent('SpriteComponent', {
            layer: 'game',
            create: (config) => {
                const sprite = new PIXI.Sprite();
                if (config.texture) {
                    sprite.texture = PIXI.Texture.from(config.texture);
                }
                sprite.x = config.x || 0;
                sprite.y = config.y || 0;
                return sprite;
            }
        });

        // 文本组件
        this.registerComponent('TextComponent', {
            layer: 'ui',
            create: (config) => {
                const text = new PIXI.Text({
                    text: config.text || 'Hello World',
                    style: {
                        fontSize: config.fontSize || 24,
                        fill: config.color || 0xffffff,
                        fontFamily: config.fontFamily || 'Arial'
                    }
                });
                text.x = config.x || 0;
                text.y = config.y || 0;
                return text;
            }
        });

        // 按钮组件
        this.registerComponent('ButtonComponent', {
            layer: 'ui',
            create: (config) => {
                const button = new PIXI.Container();
                
                // 按钮背景
                const bg = new PIXI.Graphics();
                bg.roundRect(0, 0, config.width || 120, config.height || 40, 8);
                bg.fill(config.bgColor || 0x4ECDC4);
                
                // 按钮文字
                const text = new PIXI.Text({
                    text: config.text || 'Button',
                    style: { fontSize: 16, fill: 0xffffff }
                });
                text.x = (bg.width - text.width) / 2;
                text.y = (bg.height - text.height) / 2;
                
                button.addChild(bg, text);
                button.x = config.x || 0;
                button.y = config.y || 0;
                button.interactive = true;
                button.buttonMode = true;
                
                return button;
            }
        });

        console.log('✅ 分层组件类注册完成');
    }

    /**
     * 注册组件类型
     */
    registerComponent(name, componentDef) {
        this.registeredComponents.set(name, componentDef);
        console.log(\`🔧 组件已注册: \${name}\`);
    }

    /**
     * 创建组件实例
     */
    createComponent(componentName, config = {}) {
        const componentDef = this.registeredComponents.get(componentName);
        if (!componentDef) {
            console.warn(\`⚠️ 未找到组件: \${componentName}\`);
            return null;
        }

        const instance = componentDef.create(config);
        
        // 添加到对应层
        if (componentDef.layer) {
            const layer = GameCore.getLayer(componentDef.layer);
            if (layer) {
                layer.addChild(instance);
            }
        }

        return instance;
    }

    /**
     * 创建默认场景
     */
    createDefaultScene() {
        console.log('� 创建默认场景...');

        // 创建背景
        this.createComponent('BackgroundComponent', {
            color: 0x1a1a1a
        });

        // 创建欢迎文本
        this.createComponent('TextComponent', {
            text: 'Hello Game World!',
            x: 375,
            y: 300,
            fontSize: 32,
            color: 0x4ECDC4
        });

        // 创建信息文本
        this.createComponent('TextComponent', {
            text: '使用节点编辑器创建你的游戏',
            x: 375,
            y: 400,
            fontSize: 18,
            color: 0xcccccc
        });

        console.log('✅ 默认场景创建完成');
    }

    /**
     * 根据节点图数据初始化
     */
    initFromGraphData(graphData) {
        console.log('📊 根据节点图初始化游戏对象...');
        
        if (!graphData || !graphData.nodes) {
            return;
        }

        // 清空游戏层
        GameCore.clearLayer('game');
        GameCore.clearLayer('ui');

        // 根据节点创建游戏对象
        graphData.nodes.forEach((node, index) => {
            this.processNode(node, index);
        });

        console.log(\`✅ 处理了 \${graphData.nodes.length} 个节点\`);
    }

    /**
     * 处理单个节点
     */
    processNode(node, index) {
        // 根据节点类型创建对应的游戏对象
        switch (node.type) {
            case 'sprite':
                this.createComponent('SpriteComponent', {
                    x: (node.pos?.[0] || 0) / 2,
                    y: (node.pos?.[1] || 0) / 2,
                    texture: node.properties?.texture
                });
                break;
                
            case 'text':
                this.createComponent('TextComponent', {
                    text: node.properties?.text || node.title || \`节点\${index + 1}\`,
                    x: (node.pos?.[0] || 0) / 2,
                    y: (node.pos?.[1] || 0) / 2,
                    fontSize: node.properties?.fontSize || 20
                });
                break;
                
            default:
                // 默认创建一个文本对象表示节点
                this.createComponent('TextComponent', {
                    text: node.title || \`Node\${index + 1}\`,
                    x: 100 + (index % 3) * 200,
                    y: 500 + Math.floor(index / 3) * 100,
                    fontSize: 16,
                    color: 0x4ECDC4
                });
        }
    }

    /**
     * 启动游戏循环
     */
    startGameLoop() {
        console.log('� 启动游戏循环...');
        
        const app = GameCore.getApp();
        app.ticker.add((time) => {
            this.update(time.deltaTime);
        });

        this.isRunning = true;
    }

    /**
     * 游戏更新逻辑
     */
    update(deltaTime) {
        if (!this.isRunning || this.gameState.isPaused) {
            return;
        }

        // 更新注册的更新队列
        this.updateQueue.forEach(updateFn => {
            updateFn(deltaTime);
        });
    }

    /**
     * 暂停/恢复游戏
     */
    pause() {
        this.gameState.isPaused = true;
    }

    resume() {
        this.gameState.isPaused = false;
    }

    /**
     * 获取游戏状态
     */
    getGameState() {
        return { ...this.gameState };
    }
}

// 导出到全局
window.GameCore = GameCore;
window.GameLogic = GameLogic;

// 全局初始化函数
window.initGameLogic = async function(app, graphData) {
    const gameLogic = new GameLogic();
    await gameLogic.init(graphData);
    return gameLogic;
};

console.log('📦 游戏核心引擎模块加载完成');`;
  }

  /**
   * 生成index.html（第三个标签）
   * 直接读取build/index.html的真实内容，确保"所见即所得"
   */
  generateIndexHtml(): string {
    // 返回占位符，实际内容通过异步加载
    return `<!-- 正在加载 build/index.html... -->
<div style="padding: 20px; color: #666; text-align: center;">
  📄 正在读取 build/index.html 内容...
</div>`;
  }

  /**
   * 异步加载真实的build/index.html内容
   */
  async loadRealIndexHtml(): Promise<string> {
    try {
      const response = await fetch('/build/index.html');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const content = await response.text();
      return content;
    } catch (error) {
      console.error('❌ 读取 build/index.html 失败:', error);
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      return `<!-- 读取 build/index.html 失败 -->
<div style="padding: 20px; color: #e74c3c; text-align: center;">
  ❌ 无法读取 build/index.html
  <br><br>
  错误信息: ${errorMessage}
  <br><br>
  请确保服务器正在运行且 build/index.html 文件存在
</div>`;
    }
  }

  /**
   * 生成基于节点的游戏逻辑代码
   */
  private generateNodeBasedGameLogic(nodes: any[]): string {
    const timestamp = new Date().toISOString();
    const nodeTypes = this.getNodeTypes(nodes);
    
    return `/**
 * 🎮 游戏逻辑代码 - 基于节点图生成
 * 生成时间: ${timestamp}
 * 节点数量: ${nodes.length}
 * 节点类型: ${nodeTypes.join(', ')}
 */

class NodeBasedGameLogic {
  constructor(app) {
    this.app = app;
    this.stage = app.stage;
    this.gameObjects = new Map();
    this.gameState = {
      score: 0,
      level: 1,
      isRunning: false,
      nodeCount: ${nodes.length}
    };
    
    console.log('🎯 初始化基于节点的游戏逻辑');
    this.initializeNodes();
  }

  /**
   * 初始化所有节点
   */
  initializeNodes() {
${this.generateNodeInitCode(nodes)}
  }

  /**
   * 游戏逻辑更新
   */
  update(deltaTime) {
    if (!this.gameState.isRunning) return;
    
${this.generateNodeUpdateCode(nodes)}
  }

  /**
   * 启动游戏
   */
  start() {
    this.gameState.isRunning = true;
    console.log('🚀 游戏逻辑开始运行');
    
    // 设置更新循环
    this.app.ticker.add((delta) => {
      this.update(delta);
    });
  }

  /**
   * 停止游戏
   */
  stop() {
    this.gameState.isRunning = false;
    console.log('⏹️ 游戏逻辑停止');
  }

  /**
   * 获取游戏状态
   */
  getGameState() {
    return { ...this.gameState };
  }

${this.generateNodeMethods(nodes)}
}

// 导出游戏逻辑类
window.NodeBasedGameLogic = NodeBasedGameLogic;`;
  }

  /**
   * 生成PIXI游戏代码（有节点时）
   * 暂时未使用，保留用于未来扩展
   */
  // private generatePixiGameCode(): string {
  //   return `
  //               // 创建游戏逻辑实例
  //               const gameLogic = new NodeBasedGameLogic(app);
  //
  //               // 创建基础UI
  //               const uiContainer = new PIXI.Container();
  //               app.stage.addChild(uiContainer);
  //
  //               // 添加基础文本
  //               const titleText = new PIXI.Text('节点游戏', {
  //                   fontFamily: 'Arial',
  //                   fontSize: 36,
  //                   fill: 0xffffff,
  //                   align: 'center'
  //               });
  //               titleText.x = app.screen.width / 2 - titleText.width / 2;
  //               titleText.y = 50;
  //               uiContainer.addChild(titleText);
  //
  //               // 启动游戏逻辑
  //               gameLogic.start();
  //
  //               // 保存到全局
  //               window.gameLogic = gameLogic;
  //               window.pixiApp = app;`;
  // }

  /**
   * 生成空游戏代码（无节点时）
   * 暂时未使用，保留用于未来扩展
   */
  // private generateEmptyGameCode(): string {
  //   return `
  //               // 创建空白游戏状态
  //               const emptyText = new PIXI.Text('等待添加节点...', {
  //                   fontFamily: 'Arial',
  //                   fontSize: 24,
  //                   fill: 0xcccccc,
  //                   align: 'center'
  //               });
  //               emptyText.x = app.screen.width / 2 - emptyText.width / 2;
  //               emptyText.y = app.screen.height / 2 - emptyText.height / 2;
  //               app.stage.addChild(emptyText);
  //
  //               const hintText = new PIXI.Text('请在编辑器中添加节点来生成游戏', {
  //                   fontFamily: 'Arial',
  //                   fontSize: 16,
  //                   fill: 0x999999,
  //                   align: 'center'
  //               });
  //               hintText.x = app.screen.width / 2 - hintText.width / 2;
  //               hintText.y = emptyText.y + 50;
  //               app.stage.addChild(hintText);
  //
  //               // 保存到全局
  //               window.pixiApp = app;`;
  // }

  /**
   * 获取节点类型列表
   */
  private getNodeTypes(nodes: any[]): string[] {
    const types = new Set<string>();
    nodes.forEach(node => {
      if (node.type) {
        types.add(node.type);
      }
    });
    return Array.from(types);
  }

  /**
   * 生成节点初始化代码
   */
  private generateNodeInitCode(nodes: any[]): string {
    return nodes.map((node: any, index: number) => {
      const nodeTitle = node.title || `Node${index + 1}`;
      const nodeType = node.type || 'Unknown';
      const safeName = this.sanitizeNodeName(nodeTitle);
      
      return `    // 初始化节点: ${nodeTitle} (${nodeType})
    this.init${safeName}();`;
    }).join('\n');
  }

  /**
   * 生成节点更新代码
   */
  private generateNodeUpdateCode(nodes: any[]): string {
    return nodes.map((node: any, index: number) => {
      const nodeTitle = node.title || `Node${index + 1}`;
      const safeName = this.sanitizeNodeName(nodeTitle);
      
      return `    // 更新节点: ${nodeTitle}
    this.update${safeName}(deltaTime);`;
    }).join('\n');
  }

  /**
   * 生成节点方法
   */
  private generateNodeMethods(nodes: any[]): string {
    return nodes.map((node: any, index: number) => {
      const nodeTitle = node.title || `Node${index + 1}`;
      const nodeType = node.type || 'Unknown';
      const safeName = this.sanitizeNodeName(nodeTitle);
      
      return `
  /**
   * 初始化节点: ${nodeTitle}
   */
  init${safeName}() {
    console.log('🔧 初始化${nodeTitle} (${nodeType})');
    // TODO: 根据节点配置生成具体初始化逻辑
  }

  /**
   * 更新节点: ${nodeTitle}
   */
  update${safeName}(deltaTime) {
    // TODO: 根据节点连接生成具体更新逻辑
  }`;
    }).join('');
  }

  /**
   * 清理节点名称
   */
  private sanitizeNodeName(name: string): string {
    return name.replace(/[^a-zA-Z0-9]/g, '').replace(/^./, str => str.toUpperCase()) || 'Node';
  }

  /**
   * 生成调试控制台内容（第四个标签）
   */
  generateDebugConsole(): string {
    const nodes = (this.graph as any)._nodes || [];
    const timestamp = new Date().toISOString();
    
    return `// 🔍 调试控制台 - 实时调试信息
// 更新时间: ${timestamp}

/*
=== 游戏状态监控 ===
*/

// 当前节点数量: ${nodes.length}
// 游戏引擎状态: ${nodes.length > 0 ? '运行中' : '等待节点'}
// 内存使用: 监控中...
// FPS: 实时监控中...

/*
=== 节点调试信息 ===
*/
${nodes.length > 0 ? this.generateNodeDebugInfo(nodes) : '// 暂无节点，请添加节点查看调试信息'}

/*
=== 控制台命令 ===
*/

// 在浏览器控制台中使用以下命令进行调试：

// 1. 查看游戏引擎状态
// window.gameEngine?.getEngineStatus()

// 2. 查看游戏逻辑状态  
// window.gameLogic?.getGameState()

// 3. 暂停/恢复游戏
// window.gameLogic?.stop()
// window.gameLogic?.start()

// 4. 查看PIXI应用信息
// window.pixiApp?.ticker

// 5. 查看所有游戏对象
// window.gameLogic?.gameObjects

/*
=== 性能监控 ===
*/

// 帧率监控
setInterval(() => {
  if (window.pixiApp) {
    console.log('FPS:', Math.round(window.pixiApp.ticker.FPS));
  }
}, 5000);

// 内存监控 (如果浏览器支持)
if (performance.memory) {
  setInterval(() => {
    const memory = performance.memory;
    console.log('内存使用:', {
      used: Math.round(memory.usedJSHeapSize / 1048576) + 'MB',
      total: Math.round(memory.totalJSHeapSize / 1048576) + 'MB',
      limit: Math.round(memory.jsHeapSizeLimit / 1048576) + 'MB'
    });
  }, 10000);
}

/*
=== 错误监控 ===
*/

window.addEventListener('error', (event) => {
  console.error('🚨 游戏错误:', {
    message: event.message,
    filename: event.filename,
    line: event.lineno,
    column: event.colno,
    error: event.error
  });
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('🚨 未处理的Promise错误:', event.reason);
});

console.log('🔍 调试控制台已加载，游戏监控已启动');`;
  }

  /**
   * 生成节点调试信息
   */
  private generateNodeDebugInfo(nodes: any[]): string {
    return nodes.map((node: any, index: number) => {
      const nodeTitle = node.title || `Node${index + 1}`;
      const nodeType = node.type || 'Unknown';
      const nodeId = node.id || index;
      
      return `
// 节点 ${index + 1}: ${nodeTitle}
// - ID: ${nodeId}
// - 类型: ${nodeType}
// - 位置: [${node.pos?.[0] || 0}, ${node.pos?.[1] || 0}]
// - 输入: ${node.inputs?.length || 0} 个
// - 输出: ${node.outputs?.length || 0} 个
// - 属性: ${node.properties ? JSON.stringify(node.properties) : '{}'}`;
    }).join('\n');
  }
}
