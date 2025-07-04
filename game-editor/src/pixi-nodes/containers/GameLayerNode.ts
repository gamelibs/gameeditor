/**
 * Game Layer Node
 * 
 * 这个节点管理三个游戏相关的子容器：
 * - EntityContainer：实体层，处理游戏中的所有实体对象（玩家、敌人、NPC等），最高层级（zIndex: 30）
 * - EffectContainer：特效层，处理特效和粒子系统，中层级（zIndex: 20）
 * - BackgroundContainer：背景层，处理背景图像和环境，低层级（zIndex: 10）
 * 
 * 这个节点的输出可以直接连接到 RootContainer 的 Game Layer Input
 */

import { Container } from 'pixi.js';
import { BaseNode } from '../base/BaseNode';

export class GameLayerNode extends BaseNode {
  // 游戏层主容器
  protected _container: Container = new Container();
  
  // 子容器
  private _entityContainer: Container = new Container();
  private _effectContainer: Container = new Container();
  private _backgroundContainer: Container = new Container();
  
  // 跟踪处理的输入对象
  private _lastEntityInputs: Set<any> = new Set();
  private _lastEffectInputs: Set<any> = new Set();
  private _lastBackgroundInputs: Set<any> = new Set();
  
  constructor() {
    super();
    
    this.title = 'Game Layer';
    this.boxcolor = "#27ae60"; // 绿色，表示游戏层
    
    // 基本属性
    this.properties = {
      ...this.properties,
      uniqueId: `game_layer_${Math.floor(Math.random() * 10000000)}`,
      debug: false // 默认关闭调试模式
    };
    
    // 添加三层的输入端口
    this.addInput('Entity Input', 'pixi_display_object');
    this.addInput('Effect Input', 'pixi_display_object');
    this.addInput('Background Input', 'pixi_display_object');
    
    // 调试模式控制
    this.addWidget('toggle', 'Debug Mode', this.properties.debug, (v: boolean) => {
      this.properties.debug = v;
    });
    
    // 清除按钮
    this.addWidget('button', 'Clear Entities', null, () => {
      this.clearEntities();
    });
    this.addWidget('button', 'Clear Effects', null, () => {
      this.clearEffects();
    });
    this.addWidget('button', 'Clear Background', null, () => {
      this.clearBackground();
    });
    
    // 添加输出端口（连接到 RootContainer）
    this.addOutput('Game Layer', 'pixi_display_object');
    // 初始化容器结构
    this.initialize();
  }
  
  /**
   * 初始化容器层级结构
   */
  initialize() {
    // 设置容器名称
    this._entityContainer.label = 'EntityContainer';
    this._effectContainer.label = 'EffectContainer';
    this._backgroundContainer.label = 'BackgroundContainer';
    this._container.label = 'GameLayerMainContainer';
    
    // 设置zIndex，值越大层级越高
    this._entityContainer.zIndex = 30;     // 最上层：游戏实体
    this._effectContainer.zIndex = 20;     // 中层：特效
    this._backgroundContainer.zIndex = 10; // 底层：背景
    
    // 将所有子容器添加到主容器
    this._container.addChild(this._backgroundContainer);
    this._container.addChild(this._effectContainer);
    this._container.addChild(this._entityContainer);
    
    // 根据zIndex排序
    this._container.sortChildren();
  }
  
  /**
   * 节点执行逻辑
   */
  onExecute() {
    // 处理所有层的输入
    this._processEntityInput();
    this._processEffectInput();
    this._processBackgroundInput();
    
    // 确保容器和所有子容器可见
    this._container.visible = true;
    this._container.alpha = 1;
    this._entityContainer.visible = true;
    this._entityContainer.alpha = 1;
    this._effectContainer.visible = true;
    this._effectContainer.alpha = 1;
    this._backgroundContainer.visible = true;
    this._backgroundContainer.alpha = 1;
    
    if (this.properties.debug) {
      this._logDebugInfo();
    }
    
    this.setOutputData(0, this._container);
  }
  
  /**
   * 处理实体层输入
   */
  private _processEntityInput() {
    const inputObj = this.getInputData(0);
    this._entityContainer.removeChildren();
    this._lastEntityInputs.clear();
    
    if (!inputObj) return;
    
    if (Array.isArray(inputObj)) {
      if (this.properties.debug) {
        console.log(`GameLayerNode: 添加数组对象到实体层 (${inputObj.length}个对象)`);
      }
      
      inputObj.forEach((obj) => {
        if (obj) {
          this._entityContainer.addChild(obj);
          this._lastEntityInputs.add(obj);
        }
      });
    } 
    else if (inputObj instanceof Container && inputObj.children && inputObj.children.length > 0) {
      // 如果输入是一个容器，提取它的子元素
      const children = [...inputObj.children]; // 创建子元素数组的拷贝，避免修改问题
      
      if (this.properties.debug) {
        console.log(`GameLayerNode: 从容器提取 ${children.length} 个子元素到实体层`);
      }
      
      children.forEach((child) => {
        // 如果子对象已经有父对象，先从原父对象中移除
        if (child && child.parent) {
          child.parent.removeChild(child);
        }
        
        this._entityContainer.addChild(child);
        this._lastEntityInputs.add(child);
      });
    } 
    else {
      // 添加单个对象
      if (this.properties.debug) {
        console.log(`GameLayerNode: 添加单个对象到实体层`);
      }
      
      // 如果对象已经有父对象，先从原父对象中移除
      if (inputObj.parent) {
        inputObj.parent.removeChild(inputObj);
      }
      
      this._entityContainer.addChild(inputObj);
      this._lastEntityInputs.add(inputObj);
    }
  }
  
  /**
   * 处理特效层输入
   */
  private _processEffectInput() {
    const inputObj = this.getInputData(1);
    this._effectContainer.removeChildren();
    this._lastEffectInputs.clear();
    
    if (!inputObj) return;
    
    if (Array.isArray(inputObj)) {
      if (this.properties.debug) {
        console.log(`GameLayerNode: 添加数组对象到特效层 (${inputObj.length}个对象)`);
      }
      
      inputObj.forEach((obj) => {
        if (obj) {
          this._effectContainer.addChild(obj);
          this._lastEffectInputs.add(obj);
        }
      });
    } 
    else if (inputObj instanceof Container && inputObj.children && inputObj.children.length > 0) {
      // 如果输入是一个容器，提取它的子元素
      const children = [...inputObj.children]; // 创建子元素数组的拷贝，避免修改问题
      
      if (this.properties.debug) {
        console.log(`GameLayerNode: 从容器提取 ${children.length} 个子元素到特效层`);
      }
      
      children.forEach((child) => {
        // 如果子对象已经有父对象，先从原父对象中移除
        if (child && child.parent) {
          child.parent.removeChild(child);
        }
        
        this._effectContainer.addChild(child);
        this._lastEffectInputs.add(child);
      });
    } 
    else {
      // 添加单个对象
      if (this.properties.debug) {
        console.log(`GameLayerNode: 添加单个对象到特效层`);
      }
      
      // 如果对象已经有父对象，先从原父对象中移除
      if (inputObj.parent) {
        inputObj.parent.removeChild(inputObj);
      }
      
      this._effectContainer.addChild(inputObj);
      this._lastEffectInputs.add(inputObj);
    }
  }
  
  /**
   * 处理背景层输入
   */
  private _processBackgroundInput() {
    const inputObj = this.getInputData(2);
    this._backgroundContainer.removeChildren();
    this._lastBackgroundInputs.clear();
    
    if (!inputObj) return;
    
    if (Array.isArray(inputObj)) {
      if (this.properties.debug) {
        console.log(`GameLayerNode: 添加数组对象到背景层 (${inputObj.length}个对象)`);
      }
      
      inputObj.forEach((obj) => {
        if (obj) {
          this._backgroundContainer.addChild(obj);
          this._lastBackgroundInputs.add(obj);
        }
      });
    } 
    else if (inputObj instanceof Container && inputObj.children && inputObj.children.length > 0) {
      // 如果输入是一个容器，提取它的子元素
      const children = [...inputObj.children]; // 创建子元素数组的拷贝，避免修改问题
      
      if (this.properties.debug) {
        console.log(`GameLayerNode: 从容器提取 ${children.length} 个子元素到背景层`);
      }
      
      children.forEach((child) => {
        // 如果子对象已经有父对象，先从原父对象中移除
        if (child && child.parent) {
          child.parent.removeChild(child);
        }
        
        this._backgroundContainer.addChild(child);
        this._lastBackgroundInputs.add(child);
      });
    } 
    else {
      // 添加单个对象
      if (this.properties.debug) {
        console.log(`GameLayerNode: 添加单个对象到背景层`);
      }
      
      // 如果对象已经有父对象，先从原父对象中移除
      if (inputObj.parent) {
        inputObj.parent.removeChild(inputObj);
      }
      
      this._backgroundContainer.addChild(inputObj);
      this._lastBackgroundInputs.add(inputObj);
    }
  }
  
  /**
   * 显示调试信息
   */
  private _logDebugInfo() {
    console.log(`GameLayerNode (${this.properties.uniqueId}): Debug Info`);
    console.log(`- Entity Container: ${this._entityContainer.children.length} 个子元素`);
    console.log(`- Effect Container: ${this._effectContainer.children.length} 个子元素`);
    console.log(`- Background Container: ${this._backgroundContainer.children.length} 个子元素`);
    console.log(`- 游戏层总可见性: ${this._container.visible}, 总透明度: ${this._container.alpha}`);
  }
  
  /**
   * 清理资源
   */
  onRemoved() {
    this._entityContainer.destroy({ children: true });
    this._effectContainer.destroy({ children: true });
    this._backgroundContainer.destroy({ children: true });
    this._container.destroy({ children: true });
  }
  
  /**
   * 清除实体容器内容
   */
  clearEntities() {
    this._entityContainer.removeChildren();
    this._lastEntityInputs.clear();
  }
  
  /**
   * 清除特效容器内容
   */
  clearEffects() {
    this._effectContainer.removeChildren();
    this._lastEffectInputs.clear();
  }
  
  /**
   * 清除背景容器内容
   */
  clearBackground() {
    this._backgroundContainer.removeChildren();
    this._lastBackgroundInputs.clear();
  }
}

/**
 * Register GameLayerNode
 */
export function registerGameLayerNode(LiteGraph: any) {
  LiteGraph.registerNodeType("pixi/containers/GameLayer", GameLayerNode);
}
