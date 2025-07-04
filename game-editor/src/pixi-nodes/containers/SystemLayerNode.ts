/**
 * System Layer Node
 * 
 * 这个节点管理三个系统相关的子容器：
 * - TransitionContainer：过渡层，处理场景转换和转场效果，最高层级（zIndex: 30）
 * - OverlayContainer：叠加层，处理全局提示和系统通知，中层级（zIndex: 20）
 * - DebugContainer：调试层，处理调试信息和性能指标，低层级（zIndex: 10）
 * 
 * 这个节点的输出可以直接连接到 RootContainer 的 System Layer Input
 */

import { Container } from 'pixi.js';
import { BaseNode } from '../base/BaseNode';

export class SystemLayerNode extends BaseNode {
  // 系统层主容器
  protected _container: Container = new Container();
  
  // 子容器
  private _transitionContainer: Container = new Container();
  private _overlayContainer: Container = new Container();
  private _debugContainer: Container = new Container();
  
  // 跟踪处理的输入对象
  private _lastTransitionInputs: Set<any> = new Set();
  private _lastOverlayInputs: Set<any> = new Set();
  private _lastDebugInputs: Set<any> = new Set();
  
  constructor() {
    super();
    
    this.title = 'System Layer';
    this.boxcolor = "#e74c3c"; // 红色，表示系统层
    
    // 基本属性
    this.properties = {
      ...this.properties,
      uniqueId: `system_layer_${Math.floor(Math.random() * 10000000)}`,
      debug: false, // 默认关闭调试模式
      showDebugLayer: true // 默认显示调试层
    };
    
    // 添加三层的输入端口
    this.addInput('Transition Input', 'pixi_display_object');
    this.addInput('Overlay Input', 'pixi_display_object');
    this.addInput('Debug Input', 'pixi_display_object');
    
    // 调试模式控制
    this.addWidget('toggle', 'Debug Mode', this.properties.debug, (v: boolean) => {
      this.properties.debug = v;
    });
    
    // 控制调试层显示
    this.addWidget('toggle', 'Show Debug Layer', this.properties.showDebugLayer, (v: boolean) => {
      this.properties.showDebugLayer = v;
      this._debugContainer.visible = v;
    });
    
    // 清除按钮
    this.addWidget('button', 'Clear Transitions', null, () => {
      this.clearTransitions();
    });
    this.addWidget('button', 'Clear Overlays', null, () => {
      this.clearOverlays();
    });
    this.addWidget('button', 'Clear Debug', null, () => {
      this.clearDebug();
    });
    
    // 添加输出端口（连接到 RootContainer）
    this.addOutput('System Layer', 'pixi_display_object');
    // 初始化容器结构
    this.initialize();
  }
  
  /**
   * 初始化容器层级结构
   */
  initialize() {
    // 设置容器名称
    this._transitionContainer.label = 'TransitionContainer';
    this._overlayContainer.label = 'OverlayContainer';
    this._debugContainer.label = 'DebugContainer';
    this._container.label = 'SystemLayerMainContainer';
    
    // 设置zIndex，值越大层级越高
    this._transitionContainer.zIndex = 30;  // 最上层：过渡效果
    this._overlayContainer.zIndex = 20;     // 中层：系统叠加层
    this._debugContainer.zIndex = 10;       // 底层：调试信息
    
    // 将所有子容器添加到主容器
    this._container.addChild(this._debugContainer);
    this._container.addChild(this._overlayContainer);
    this._container.addChild(this._transitionContainer);
    
    // 根据zIndex排序
    this._container.sortChildren();
    
    // 应用初始设置
    this._debugContainer.visible = this.properties.showDebugLayer;
  }
  
  /**
   * 节点执行逻辑
   */
  onExecute() {
    // 处理所有层的输入
    this._processTransitionInput();
    this._processOverlayInput();
    this._processDebugInput();
    
    // 确保容器和所有子容器可见
    this._container.visible = true;
    this._container.alpha = 1;
    this._transitionContainer.visible = true;
    this._transitionContainer.alpha = 1;
    this._overlayContainer.visible = true;
    this._overlayContainer.alpha = 1;
    // 调试层的可见性由属性控制
    this._debugContainer.visible = this.properties.showDebugLayer;
    this._debugContainer.alpha = 1;
    
    if (this.properties.debug) {
      this._logDebugInfo();
    }
    
    this.setOutputData(0, this._container);
  }
  
  /**
   * 处理过渡层输入
   */
  private _processTransitionInput() {
    const inputObj = this.getInputData(0);
    this._transitionContainer.removeChildren();
    this._lastTransitionInputs.clear();
    
    if (!inputObj) return;
    
    if (Array.isArray(inputObj)) {
      if (this.properties.debug) {
        console.log(`SystemLayerNode: 添加数组对象到过渡层 (${inputObj.length}个对象)`);
      }
      
      inputObj.forEach((obj) => {
        if (obj) {
          this._transitionContainer.addChild(obj);
          this._lastTransitionInputs.add(obj);
        }
      });
    } 
    else if (inputObj instanceof Container && inputObj.children && inputObj.children.length > 0) {
      // 如果输入是一个容器，提取它的子元素
      const children = [...inputObj.children]; // 创建子元素数组的拷贝，避免修改问题
      
      if (this.properties.debug) {
        console.log(`SystemLayerNode: 从容器提取 ${children.length} 个子元素到过渡层`);
      }
      
      children.forEach((child) => {
        // 如果子对象已经有父对象，先从原父对象中移除
        if (child && child.parent) {
          child.parent.removeChild(child);
        }
        
        this._transitionContainer.addChild(child);
        this._lastTransitionInputs.add(child);
      });
    } 
    else {
      // 添加单个对象
      if (this.properties.debug) {
        console.log(`SystemLayerNode: 添加单个对象到过渡层`);
      }
      
      // 如果对象已经有父对象，先从原父对象中移除
      if (inputObj.parent) {
        inputObj.parent.removeChild(inputObj);
      }
      
      this._transitionContainer.addChild(inputObj);
      this._lastTransitionInputs.add(inputObj);
    }
  }
  
  /**
   * 处理叠加层输入
   */
  private _processOverlayInput() {
    const inputObj = this.getInputData(1);
    this._overlayContainer.removeChildren();
    this._lastOverlayInputs.clear();
    
    if (!inputObj) return;
    
    if (Array.isArray(inputObj)) {
      if (this.properties.debug) {
        console.log(`SystemLayerNode: 添加数组对象到叠加层 (${inputObj.length}个对象)`);
      }
      
      inputObj.forEach((obj) => {
        if (obj) {
          this._overlayContainer.addChild(obj);
          this._lastOverlayInputs.add(obj);
        }
      });
    } 
    else if (inputObj instanceof Container && inputObj.children && inputObj.children.length > 0) {
      // 如果输入是一个容器，提取它的子元素
      const children = [...inputObj.children]; // 创建子元素数组的拷贝，避免修改问题
      
      if (this.properties.debug) {
        console.log(`SystemLayerNode: 从容器提取 ${children.length} 个子元素到叠加层`);
      }
      
      children.forEach((child) => {
        // 如果子对象已经有父对象，先从原父对象中移除
        if (child && child.parent) {
          child.parent.removeChild(child);
        }
        
        this._overlayContainer.addChild(child);
        this._lastOverlayInputs.add(child);
      });
    } 
    else {
      // 添加单个对象
      if (this.properties.debug) {
        console.log(`SystemLayerNode: 添加单个对象到叠加层`);
      }
      
      // 如果对象已经有父对象，先从原父对象中移除
      if (inputObj.parent) {
        inputObj.parent.removeChild(inputObj);
      }
      
      this._overlayContainer.addChild(inputObj);
      this._lastOverlayInputs.add(inputObj);
    }
  }
  
  /**
   * 处理调试层输入
   */
  private _processDebugInput() {
    // 如果调试层被禁用，直接返回
    if (!this.properties.showDebugLayer) {
      this._debugContainer.removeChildren();
      this._lastDebugInputs.clear();
      return;
    }
    
    const inputObj = this.getInputData(2);
    this._debugContainer.removeChildren();
    this._lastDebugInputs.clear();
    
    if (!inputObj) return;
    
    if (Array.isArray(inputObj)) {
      if (this.properties.debug) {
        console.log(`SystemLayerNode: 添加数组对象到调试层 (${inputObj.length}个对象)`);
      }
      
      inputObj.forEach((obj) => {
        if (obj) {
          this._debugContainer.addChild(obj);
          this._lastDebugInputs.add(obj);
        }
      });
    } 
    else if (inputObj instanceof Container && inputObj.children && inputObj.children.length > 0) {
      // 如果输入是一个容器，提取它的子元素
      const children = [...inputObj.children]; // 创建子元素数组的拷贝，避免修改问题
      
      if (this.properties.debug) {
        console.log(`SystemLayerNode: 从容器提取 ${children.length} 个子元素到调试层`);
      }
      
      children.forEach((child) => {
        // 如果子对象已经有父对象，先从原父对象中移除
        if (child && child.parent) {
          child.parent.removeChild(child);
        }
        
        this._debugContainer.addChild(child);
        this._lastDebugInputs.add(child);
      });
    } 
    else {
      // 添加单个对象
      if (this.properties.debug) {
        console.log(`SystemLayerNode: 添加单个对象到调试层`);
      }
      
      // 如果对象已经有父对象，先从原父对象中移除
      if (inputObj.parent) {
        inputObj.parent.removeChild(inputObj);
      }
      
      this._debugContainer.addChild(inputObj);
      this._lastDebugInputs.add(inputObj);
    }
  }
  
  /**
   * 显示调试信息
   */
  private _logDebugInfo() {
    console.log(`SystemLayerNode (${this.properties.uniqueId}): Debug Info`);
    console.log(`- Transition Container: ${this._transitionContainer.children.length} 个子元素`);
    console.log(`- Overlay Container: ${this._overlayContainer.children.length} 个子元素`);
    console.log(`- Debug Container: ${this._debugContainer.children.length} 个子元素 (${this.properties.showDebugLayer ? '显示' : '隐藏'})`);
    console.log(`- 系统层总可见性: ${this._container.visible}, 总透明度: ${this._container.alpha}`);
  }
  
  /**
   * 清理资源
   */
  onRemoved() {
    this._transitionContainer.destroy({ children: true });
    this._overlayContainer.destroy({ children: true });
    this._debugContainer.destroy({ children: true });
    this._container.destroy({ children: true });
  }
  
  /**
   * 清除过渡容器内容
   */
  clearTransitions() {
    this._transitionContainer.removeChildren();
    this._lastTransitionInputs.clear();
  }
  
  /**
   * 清除叠加容器内容
   */
  clearOverlays() {
    this._overlayContainer.removeChildren();
    this._lastOverlayInputs.clear();
  }
  
  /**
   * 清除调试容器内容
   */
  clearDebug() {
    this._debugContainer.removeChildren();
    this._lastDebugInputs.clear();
  }
  
  /**
   * 切换调试层的显示状态
   */
  toggleDebugLayerVisibility(visible: boolean) {
    this.properties.showDebugLayer = visible;
    this._debugContainer.visible = visible;
  }
}

/**
 * Register SystemLayerNode
 */
export function registerSystemLayerNode(LiteGraph: any) {
  LiteGraph.registerNodeType("pixi/containers/SystemLayer", SystemLayerNode);
}
