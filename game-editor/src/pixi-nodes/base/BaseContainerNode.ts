import { Container } from 'pixi.js';
import { BaseDisplayNode } from './BaseDisplayNode';
import type { IContainer } from './IContainer';
import { ContainerLifecycleState } from './ContainerTypes';
import type { ContainerLifecycleStateValues } from './ContainerTypes';

/**
 * 容器基础类，所有特定用途的容器都应该继承这个类
 */
export class BaseContainerNode extends BaseDisplayNode implements IContainer {
  /** 容器的唯一标识符 */
  get uniqueId(): string {
    return this.properties.uniqueId;
  }
  
  /** 容器标签列表 */
  get tags(): string[] {
    return this.properties.tags || [];
  }
  
  /** 容器是否可见 */
  get visible(): boolean {
    return this.properties.visible;
  }
  
  set visible(value: boolean) {
    this.properties.visible = value;
    if (this._container) {
      this._container.visible = value;
    }
  }
  
  /** 容器是否激活 */
  get active(): boolean {
    return this.lifecycleState === ContainerLifecycleState.ACTIVE;
  }
  
  /** 容器类型标识，便于查询特定类型的容器 */
  containerType: string = 'base';
  
  /** 容器当前的生命周期状态 */
  lifecycleState: ContainerLifecycleStateValues = ContainerLifecycleState.UNINITIALIZED;
  
  /** 子节点缓存策略：是否在隐藏时保留而非销毁 */
  cacheChildren: boolean = true;
  
  /** 原生 PixiJS 容器 */
  protected _container: Container;

  constructor() {
    super();
    
    // 基础设置
    this.title = 'Base Container';
    this.boxcolor = "#486355"; // 默认容器颜色
    
    // 创建PixiJS容器
    this._container = new Container();

    // 添加输入输出端口
    this.addInput('visible', 'boolean');
    this.addInput('children', 'pixi_display_object');
    this.addOutput('container', 'pixi_display_object');
    
    // 基础属性
    this.properties = {
      ...this.properties,
      uniqueId: `container_${Math.floor(Math.random() * 10000000)}`,
      tags: [],
      visible: true,
      acceptsInput: true,
      cacheChildren: true
    };
    
    // 添加属性控制部件
    this.addWidget('toggle', 'visible', this.properties.visible, (v: boolean) => {
      this.properties.visible = v;
      if (this._container) {
        this._container.visible = v;
      }
    });
    
    this.addWidget('toggle', 'accepts input', this.properties.acceptsInput, (v: boolean) => {
      this.properties.acceptsInput = v;
    });
    
    this.addWidget('toggle', 'cache children', this.properties.cacheChildren, (v: boolean) => {
      this.properties.cacheChildren = v;
      this.cacheChildren = v;
    });
  }

  /**
   * 执行节点逻辑，处理输入更新容器状态
   */
  onExecute() {
    // 处理可见性输入
    const visibleInput = this.getInputData(0);
    if (visibleInput !== undefined) {
      this.properties.visible = visibleInput;
      this._container.visible = visibleInput;
    }
    
    // 处理子节点输入
    const childrenInput = this.getInputData(1);
    if (Array.isArray(childrenInput) && childrenInput.length > 0) {
      this.updateChildren(childrenInput);
    }
    
    // 输出容器
    this.setOutputData(0, this._container);
    
    // 如果还未初始化，调用初始化
    if (this.lifecycleState === ContainerLifecycleState.UNINITIALIZED) {
      this.initialize();
    }
  }

  /**
   * 更新容器的子节点
   */
  protected updateChildren(children: any[]) {
    // 这里可以根据需要实现子节点的批量添加和移除逻辑
    // 简单实现：清空所有子节点，然后添加新的子节点
    if (this.properties.acceptsInput) {
      this._container.removeChildren();
      for (const child of children) {
        if (child && child.parent !== this._container) {
          this._container.addChild(child);
        }
      }
    }
  }

  /**
   * 初始化容器，子类可以重写此方法添加自定义初始化逻辑
   */
  initialize() {
    this.lifecycleState = ContainerLifecycleState.INITIALIZED;
    this.onInitialize();
    
    // 如果容器设置为可见，则自动激活
    if (this._container.visible) {
      this.activate();
    }
  }

  /**
   * 激活容器，子类可以重写此方法添加自定义激活逻辑
   */
  activate() {
    if (this.lifecycleState === ContainerLifecycleState.DESTROYED) {
      console.warn('Cannot activate a destroyed container');
      return;
    }
    
    this.lifecycleState = ContainerLifecycleState.ACTIVE;
    this._container.visible = true;
    this.onActivate();
  }

  /**
   * 停用容器，子类可以重写此方法添加自定义停用逻辑
   */
  deactivate() {
    if (this.lifecycleState === ContainerLifecycleState.DESTROYED) {
      return;
    }
    
    this.lifecycleState = ContainerLifecycleState.INACTIVE;
    this._container.visible = false;
    this.onDeactivate();
  }

  /**
   * 销毁容器，子类可以重写此方法添加自定义销毁逻辑
   */
  destroy() {
    this.onDestroy();
    this.lifecycleState = ContainerLifecycleState.DESTROYED;
    
    // 清理子节点
    this._container.removeChildren();
    
    // 销毁容器本身
    this._container.destroy({
      children: true,
      texture: false
    });
  }
  
  /**
   * 根据ID查找子节点
   */
  findChildById(id: string): Container | null {
    for (const child of this._container.children) {
      if ((child as any).properties?.uniqueId === id) {
        return child as Container;
      }
    }
    return null;
  }

  /**
   * 根据标签查找子节点
   */
  findChildrenByTag(tag: string): Container[] {
    const results: Container[] = [];
    for (const child of this._container.children) {
      if ((child as any).properties?.tags?.includes(tag)) {
        results.push(child as Container);
      }
    }
    return results;
  }

  /**
   * 添加子节点
   */
  addChild(child: any) {
    if (child && child.parent !== this._container) {
      this._container.addChild(child);
    }
    return child;
  }

  /**
   * 移除子节点
   */
  removeChild(child: any) {
    if (child && child.parent === this._container) {
      this._container.removeChild(child);
    }
    return child;
  }

  // 生命周期钩子方法，子类可以重写这些方法
  
  /**
   * 初始化时调用的钩子
   */
  protected onInitialize() {
    // 子类可重写
  }
  
  /**
   * 激活时调用的钩子
   */
  protected onActivate() {
    // 子类可重写
  }
  
  /**
   * 停用时调用的钩子
   */
  protected onDeactivate() {
    // 子类可重写
  }
  
  /**
   * 销毁时调用的钩子
   */
  protected onDestroy() {
    // 子类可重写
  }
  
  /**
   * 获取容器原生对象
   */
  getContainer(): Container {
    return this._container;
  }
}
