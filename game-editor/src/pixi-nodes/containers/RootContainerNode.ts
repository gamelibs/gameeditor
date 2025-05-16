/**
 * Implementation of the Root Container Node, which serves as the root container for all other containers
 * This is NOT responsible for rendering - it's just the top-level container in the game logic hierarchy
 * For rendering, the content of this container should be passed to pixiStageNode
 */

import { Container } from 'pixi.js';
import { BaseNode } from '../base/BaseNode';

export class RootContainerNode extends BaseNode {
  // 根容器
  protected _container: Container = new Container();
  
  // Layer containers
  private _uiLayer: Container = new Container();
  private _gameLayer: Container = new Container();
  private _systemLayer: Container = new Container();
  
  constructor() {
    super();
    
    this.title = 'Root Container';
    this.boxcolor = "#2c3e50"; // Dark blue
    
    // 根容器的基本属性 
    this.properties = {
      ...this.properties,
      uniqueId: `root_container_${Math.floor(Math.random() * 10000000)}`,
      backgroundColor: 0x000000,
      resolution: 1,
      // Stage 同步的尺寸（只读属性，不由用户调整）
      width: 800,
      height: 600,
      // 清除缓冲选项
      autoClearDisconnected: true,
      // 调试模式
      debug: true
    };
    
    // 为了清晰，添加宽高显示（但只读，不可编辑）
    this.addWidget('text', 'width', this.properties.width, ()=>{}); // 使用 text 类型使其只读
    this.addWidget('text', 'height', this.properties.height, ()=>{}); // 使用 text 类型使其只读
    
    // 只添加背景色和分辨率控制
    this.addWidget('color', 'background', this.properties.backgroundColor, (v: number) => {
      this.properties.backgroundColor = v;
    });
    
    this.addWidget('number', 'resolution', this.properties.resolution, (v: number) => {
      this.properties.resolution = v;
    });
    
    // 添加自动清除断开连接的控制
    this.addWidget('toggle', 'Auto Clear', this.properties.autoClearDisconnected, (v: boolean) => {
      this.properties.autoClearDisconnected = v;
    });
    
    // 添加调试模式控制
    this.addWidget('toggle', 'Debug Mode', this.properties.debug, (v: boolean) => {
      this.properties.debug = v;
    });
    
    // 添加清除所有层的按钮
    this.addWidget('button', 'Clear All', null, () => {
      this.clearAllLayers();
    });
    
    // 添加三个图层的输入端口
    this.addInput('UI Layer Input', 'pixi_display_object');
    this.addInput('Game Layer Input', 'pixi_display_object');
    this.addInput('System Layer Input', 'pixi_display_object');
    
    // 只有一个输出端口
    this.addOutput('rootContainer', 'pixi_display_object');
    
    // 初始化根容器
    this.initialize();
  }
  
  /**
   * 初始化根容器及其子层级
   */
  initialize() {
    // 清空层容器
    this._uiLayer.removeChildren();
    this._gameLayer.removeChildren();
    this._systemLayer.removeChildren();
    
    // 设置层容器名称
    this._systemLayer.name = 'SystemLayer';
    this._gameLayer.name = 'GameLayer';
    this._uiLayer.name = 'UILayer';
    
    // 设置层级顺序（zIndex 值越大越上层）
    this._systemLayer.zIndex = 0;  // 背景层
    this._gameLayer.zIndex = 10;   // 中间层
    this._uiLayer.zIndex = 20;     // 顶层
    
    // 将层容器添加到根容器
    this._container.addChild(this._systemLayer);
    this._container.addChild(this._gameLayer);
    this._container.addChild(this._uiLayer);
    
    // 根据 zIndex 排序子容器
    this._container.sortChildren();
  }
  
  /**
   * 与 Stage 同步大小
   * 此方法可由 PixiStageNode 调用，保持根容器与舞台大小同步
   */
  syncWithStage(width: number, height: number) {
    if (!this._container) return;
    
    // 更新属性值和显示（只读 widgets）
    this.properties.width = width;
    this.properties.height = height;
    
    // 更新小部件显示
    const widgets = this.widgets || [];
    for (let i = 0; i < widgets.length; i++) {
      if (widgets[i].name === 'width') {
        widgets[i].value = width;
      } else if (widgets[i].name === 'height') {
        widgets[i].value = height;
      }
    }
    
    // 不需要直接设置容器的 width 和 height
    // 在 Pixi 中，容器的尺寸是由其内容决定的，不需要主动设置
    // 但可以通过 mask 或其他方式限制显示区域
    
    console.log(`RootContainer: 与舞台同步尺寸为 ${width}x${height}`);
  }
  
  /**
   * 主执行逻辑
   */
  onExecute() {
    // 跟踪连接状态，用于自动清除断开连接的显示对象
    const hasUIInput = this.isInputConnected(0);
    const hasGameInput = this.isInputConnected(1);
    const hasSystemInput = this.isInputConnected(2);
    
    if (this.properties.debug) {
      console.log(`RootContainer: Input connections - UI: ${hasUIInput}, Game: ${hasGameInput}, System: ${hasSystemInput}`);
    }
    
    // 处理 UI 层输入
    const uiInput = this.getInputData(0);
    if (uiInput) {
      if (this.properties.debug) {
        console.log(`RootContainer: Received UI Layer input of type ${this._getObjectType(uiInput)}`);
        
        if (uiInput instanceof Container) {
          console.log(`RootContainer: UI Container has ${uiInput.children.length} children`);
          uiInput.children.forEach((child, index) => {
            console.log(`RootContainer: - UI child ${index}: ${this._getObjectType(child)}, visible: ${child.visible}, alpha: ${child.alpha}`);
          });
        }
      }
      
      this._uiLayer.removeChildren();
      
      if (Array.isArray(uiInput)) {
        if (this.properties.debug) console.log(`RootContainer: Adding array of ${uiInput.length} objects to UI Layer`);
        uiInput.forEach(obj => this._uiLayer.addChild(obj));
      } else if (uiInput instanceof Container) {
        if (this.properties.debug) {
          console.log(`RootContainer: Adding container to UI Layer directly`);
          console.log(`RootContainer: Container name: ${uiInput.name}, children: ${uiInput.children.length}`);
        }
        this._uiLayer.addChild(uiInput);
      } else {
        if (this.properties.debug) console.log(`RootContainer: Adding single object to UI Layer`);
        this._uiLayer.addChild(uiInput);
      }
    } else if (this.properties.autoClearDisconnected && !hasUIInput) {
      // 如果开启了自动清除且没有连接，则清空该层
      this._uiLayer.removeChildren();
      if (this.properties.debug) console.log(`RootContainer: Cleared UI Layer (no input)`);
    }
    
    // 处理游戏层输入
    const gameInput = this.getInputData(1);
    if (gameInput) {
      if (this.properties.debug) console.log(`RootContainer: Received Game Layer input of type ${this._getObjectType(gameInput)}`);
      
      this._gameLayer.removeChildren();
      
      if (Array.isArray(gameInput)) {
        if (this.properties.debug) console.log(`RootContainer: Adding array of ${gameInput.length} objects to Game Layer`);
        gameInput.forEach(obj => this._gameLayer.addChild(obj));
      } else {
        if (this.properties.debug) console.log(`RootContainer: Adding object to Game Layer`);
        this._gameLayer.addChild(gameInput);
      }
    } else if (this.properties.autoClearDisconnected && !hasGameInput) {
      // 如果开启了自动清除且没有连接，则清空该层
      this._gameLayer.removeChildren();
      if (this.properties.debug) console.log(`RootContainer: Cleared Game Layer (no input)`);
    }
    
    // 处理系统层输入
    const systemInput = this.getInputData(2);
    if (systemInput) {
      if (this.properties.debug) console.log(`RootContainer: Received System Layer input of type ${this._getObjectType(systemInput)}`);
      
      this._systemLayer.removeChildren();
      
      if (Array.isArray(systemInput)) {
        if (this.properties.debug) console.log(`RootContainer: Adding array of ${systemInput.length} objects to System Layer`);
        systemInput.forEach(obj => this._systemLayer.addChild(obj));
      } else {
        if (this.properties.debug) console.log(`RootContainer: Adding object to System Layer`);
        this._systemLayer.addChild(systemInput);
      }
    } else if (this.properties.autoClearDisconnected && !hasSystemInput) {
      // 如果开启了自动清除且没有连接，则清空该层
      this._systemLayer.removeChildren();
      if (this.properties.debug) console.log(`RootContainer: Cleared System Layer (no input)`);
    }
    
    // Log total children counts
    if (this.properties.debug) {
      console.log(`RootContainer: Child counts - UI: ${this._uiLayer.children.length}, Game: ${this._gameLayer.children.length}, System: ${this._systemLayer.children.length}`);
    }
    
    // 输出根容器
    this.setOutputData(0, this._container);
    
    // 调试模式下，输出各层信息
    if (this.properties.debug) {
      console.log("RootContainer Debug Info:");
      console.log(`  UI Layer Children: ${this._uiLayer.children.length}`);
      console.log(`  Game Layer Children: ${this._gameLayer.children.length}`);
      console.log(`  System Layer Children: ${this._systemLayer.children.length}`);
    }
  }
  
  /**
   * 清除所有层的内容
   */
  clearAllLayers() {
    this._uiLayer.removeChildren();
    this._gameLayer.removeChildren();
    this._systemLayer.removeChildren();
    console.log("RootContainer: 已清除所有层的内容");
  }
  
  /**
   * 检查指定索引的输入端口是否有连接
   * @param inputIndex 输入端口索引
   * @returns 如果有连接则返回true，否则返回false
   */
  private isInputConnected(inputIndex: number): boolean {
    // 获取节点的输入对象（通过类型断言访问LiteGraph运行时属性）
    const inputs = (this as any).inputs;
    if (!inputs || !inputs[inputIndex]) return false;

    // 检查该输入是否有连接的边
    return inputs[inputIndex].link != null || 
           (inputs[inputIndex].links && inputs[inputIndex].links.length > 0);
  }
  
  /**
   * 获取各层容器（供外部访问）
   */
  getUILayer(): Container {
    return this._uiLayer;
  }
  
  getGameLayer(): Container {
    return this._gameLayer;
  }
  
  getSystemLayer(): Container {
    return this._systemLayer;
  }
  
  getContainer(): Container {
    return this._container;
  }
  
  /**
   * 控制各层显示/隐藏
   */
  setUILayerVisible(visible: boolean) {
    this._uiLayer.visible = visible;
  }
  
  setGameLayerVisible(visible: boolean) {
    this._gameLayer.visible = visible;
  }
  
  setSystemLayerVisible(visible: boolean) {
    this._systemLayer.visible = visible;
  }
  
  /**
   * 清理资源
   */
  onRemoved() {
    // 清理容器和子容器
    this._uiLayer.destroy({ children: true });
    this._gameLayer.destroy({ children: true });
    this._systemLayer.destroy({ children: true });
    this._container.destroy({ children: true });
  }
  
  /**
   * Get object type for debugging purposes
   * @param obj The object to check
   * @returns A string description of the object type
   */
  private _getObjectType(obj: any): string {
    if (!obj) return 'null';
    if (obj.constructor && obj.constructor.name) {
      return obj.constructor.name;
    }
    return typeof obj;
  }
}

/**
 * 注册 RootContainerNode
 */
export function registerRootContainerNode(LiteGraph: any) {
  LiteGraph.registerNodeType("pixi/containers/RootContainer", RootContainerNode);
}
