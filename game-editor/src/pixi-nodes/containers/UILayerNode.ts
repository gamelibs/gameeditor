/**
 * UI Layer Node
 * 
 * 这个节点管理三个子容器：
 * - PopupContainer：弹窗层，最高层级（zIndex: 30）
 * - MainUIContainer：主界面层，中层级（zIndex: 20）- 当前注释掉，仅用于测试
 * - HUDContainer：游戏HUD层，低层级（zIndex: 10）- 当前注释掉，仅用于测试
 * 
 * 这个节点的输出可以直接连接到 RootContainer 的 UI Layer Input
 */

import { Container } from 'pixi.js';
import { BaseNode } from '../base/BaseNode';

export class UILayerNode extends BaseNode {
  // UI层主容器
  protected _container: Container = new Container();
  
  // 子容器
  private _popupContainer: Container = new Container();
  private _mainUIContainer: Container = new Container();
  private _hudContainer: Container = new Container();
  
  // Store last processed input objects for comparison
  private _lastPopupInputs: Set<any> = new Set();
  private _lastMainUIInputs: Set<any> = new Set();
  private _lastHUDInputs: Set<any> = new Set();
  
  constructor() {
    super();
    
    this.title = 'UI Layer';
    this.boxcolor = "#9b59b6"; // 紫色，表示UI层
    
    // 基本属性
    this.properties = {
      ...this.properties,
      uniqueId: `ui_layer_${Math.floor(Math.random() * 10000000)}`,
      debug: false // 默认关闭调试模式
    };
    
    // 添加三层的输入端口
    this.addInput('Popup Input', 'pixi_display_object');
    this.addInput('MainUI Input', 'pixi_display_object');
    this.addInput('HUD Input', 'pixi_display_object');
    
    // 调试模式控制
    this.addWidget('toggle', 'Debug Mode', this.properties.debug, (v: boolean) => {
      this.properties.debug = v;
    });
    
    // 清除按钮
    this.addWidget('button', 'Clear Popup', null, () => {
      this.clearPopup();
    });
    this.addWidget('button', 'Clear MainUI', null, () => {
      this.clearMainUI();
    });
    this.addWidget('button', 'Clear HUD', null, () => {
      this.clearHUD();
    });
    
    // 添加输出端口（连接到 RootContainer）
    this.addOutput('UI Layer', 'pixi_display_object');
    // 初始化容器结构
    this.initialize();
  }
  
  /**
   * 初始化容器层级结构
   */
  initialize() {
    // 设置容器名称
    this._popupContainer.label = 'PopupContainer';
    this._mainUIContainer.label = 'MainUIContainer';
    this._hudContainer.label = 'HUDContainer';
    this._container.label = 'UILayerMainContainer';
    
    // 设置zIndex，值越大层级越高
    this._popupContainer.zIndex = 30;  // 最上层
    this._mainUIContainer.zIndex = 20; // 中层
    this._hudContainer.zIndex = 10;    // 底层
    
    // 将所有子容器添加到主容器
    this._container.addChild(this._hudContainer);
    this._container.addChild(this._mainUIContainer);
    this._container.addChild(this._popupContainer);
    
    // 根据zIndex排序
    this._container.sortChildren();
  }
  
  /**
   * 节点执行逻辑
   */
  onExecute() {
    // 处理所有层的输入
    this._processPopupInput();
    this._processMainUIInput();
    this._processHUDInput();
    
    // 确保容器和所有子容器可见
    this._container.visible = true;
    this._container.alpha = 1;
    this._popupContainer.visible = true;
    this._popupContainer.alpha = 1;
    this._mainUIContainer.visible = true;
    this._mainUIContainer.alpha = 1;
    this._hudContainer.visible = true;
    this._hudContainer.alpha = 1;
    
    if (this.properties.debug) {
      this._logDebugInfo();
    }
    
    this.setOutputData(0, this._container);
  }
  
  /**
   * 处理Popup层输入
   */
  private _processPopupInput() {
    const inputObj = this.getInputData(0);
    this._popupContainer.removeChildren();
    this._lastPopupInputs.clear();
    if (!inputObj) return;
    if (Array.isArray(inputObj)) {
      inputObj.forEach((obj) => {
        if (obj) {
          this._popupContainer.addChild(obj);
          this._lastPopupInputs.add(obj);
        }
      });
    } else if (inputObj instanceof Container && inputObj.children && inputObj.children.length > 0) {
      const children = [...inputObj.children];
      children.forEach((child) => {
        if (child && child.parent) {
          child.parent.removeChild(child);
        }
        this._popupContainer.addChild(child);
        this._lastPopupInputs.add(child);
      });
    } else {
      if (inputObj.parent) {
        inputObj.parent.removeChild(inputObj);
      }
      this._popupContainer.addChild(inputObj);
      this._lastPopupInputs.add(inputObj);
    }
  }
  
  /**
   * 处理MainUI层输入
   */
  private _processMainUIInput() {
    // 获取输入
    const inputObj = this.getInputData(1);
    
    // 清空之前的内容
    this._mainUIContainer.removeChildren();
    this._lastMainUIInputs.clear();
    
    if (!inputObj) return;
    
    // 处理不同类型的输入
    if (Array.isArray(inputObj)) {
      if (this.properties.debug) {
        console.log(`UILayerNode: 添加数组对象到MainUI (${inputObj.length}个对象)`);
      }
      
      inputObj.forEach((obj) => {
        if (obj) {
          this._mainUIContainer.addChild(obj);
          this._lastMainUIInputs.add(obj);
        }
      });
    } 
    else if (inputObj instanceof Container && inputObj.children && inputObj.children.length > 0) {
      // 如果输入是一个容器，提取它的子元素
      const children = [...inputObj.children]; // 创建子元素数组的拷贝，避免修改问题
      
      if (this.properties.debug) {
        console.log(`UILayerNode: 从容器提取 ${children.length} 个子元素到MainUI`);
      }
      
      children.forEach((child) => {
        // 如果子对象已经有父对象，先从原父对象中移除
        if (child && child.parent) {
          child.parent.removeChild(child);
        }
        
        this._mainUIContainer.addChild(child);
        this._lastMainUIInputs.add(child);
      });
    } 
    else {
      // 添加单个对象
      if (this.properties.debug) {
        console.log(`UILayerNode: 添加单个对象到MainUI`);
      }
      
      // 如果对象已经有父对象，先从原父对象中移除
      if (inputObj.parent) {
        inputObj.parent.removeChild(inputObj);
      }
      
      this._mainUIContainer.addChild(inputObj);
      this._lastMainUIInputs.add(inputObj);
    }
  }
  
  /**
   * 处理HUD层输入
   */
  private _processHUDInput() {
    // 获取输入
    const inputObj = this.getInputData(2);
    
    // 清空之前的内容
    this._hudContainer.removeChildren();
    this._lastHUDInputs.clear();
    
    if (!inputObj) return;
    
    // 处理不同类型的输入
    if (Array.isArray(inputObj)) {
      if (this.properties.debug) {
        console.log(`UILayerNode: 添加数组对象到HUD (${inputObj.length}个对象)`);
      }
      
      inputObj.forEach((obj) => {
        if (obj) {
          this._hudContainer.addChild(obj);
          this._lastHUDInputs.add(obj);
        }
      });
    } 
    else if (inputObj instanceof Container && inputObj.children && inputObj.children.length > 0) {
      // 如果输入是一个容器，提取它的子元素
      const children = [...inputObj.children]; // 创建子元素数组的拷贝，避免修改问题
      
      if (this.properties.debug) {
        console.log(`UILayerNode: 从容器提取 ${children.length} 个子元素到HUD`);
      }
      
      children.forEach((child) => {
        // 如果子对象已经有父对象，先从原父对象中移除
        if (child && child.parent) {
          child.parent.removeChild(child);
        }
        
        this._hudContainer.addChild(child);
        this._lastHUDInputs.add(child);
      });
    } 
    else {
      // 添加单个对象
      if (this.properties.debug) {
        console.log(`UILayerNode: 添加单个对象到HUD`);
      }
      
      // 如果对象已经有父对象，先从原父对象中移除
      if (inputObj.parent) {
        inputObj.parent.removeChild(inputObj);
      }
      
      this._hudContainer.addChild(inputObj);
      this._lastHUDInputs.add(inputObj);
    }
  }
  
  /**
   * 显示调试信息
   */
  private _logDebugInfo() {
    console.log(`UILayerNode (${this.properties.uniqueId}): Debug Info`);
    console.log(`- Popup Container: ${this._popupContainer.children.length} 个子元素`);
    console.log(`- MainUI Container: ${this._mainUIContainer.children.length} 个子元素`);
    console.log(`- HUD Container: ${this._hudContainer.children.length} 个子元素`);
    console.log(`- UI总可见性: ${this._container.visible}, 总透明度: ${this._container.alpha}`);
  }
  
  /**
   * 清理资源
   */
  onRemoved() {
    this._popupContainer.destroy({ children: true });
    this._mainUIContainer.destroy({ children: true });
    this._hudContainer.destroy({ children: true });
    this._container.destroy({ children: true });
  }
  
  /**
   * 清除Popup容器内容
   */
  clearPopup() {
    this._popupContainer.removeChildren();
    this._lastPopupInputs.clear();
  }
  
  /**
   * 清除MainUI容器内容
   */
  clearMainUI() {
    this._mainUIContainer.removeChildren();
    this._lastMainUIInputs.clear();
  }
  
  /**
   * 清除HUD容器内容
   */
  clearHUD() {
    this._hudContainer.removeChildren();
    this._lastHUDInputs.clear();
  }
}

/**
 * Register UILayerNode
 */
export function registerUILayerNode(LiteGraph: any) {
  LiteGraph.registerNodeType("pixi/containers/UILayer", UILayerNode);
}

