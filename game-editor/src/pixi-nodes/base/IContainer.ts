import { Container } from 'pixi.js';
import { ContainerLifecycleState } from './ContainerTypes';
import type { ContainerLifecycleStateValues } from './ContainerTypes';

/**
 * 容器节点接口
 * 定义了所有容器节点应该具备的基本功能
 */
export interface IContainer {
  // 标识
  uniqueId: string;
  containerType: string;
  tags: string[];
  
  // 状态
  lifecycleState: ContainerLifecycleStateValues;
  visible: boolean;
  active: boolean;
  
  // 生命周期方法
  initialize(): void;
  activate(): void;
  deactivate(): void;
  destroy(): void;
  
  // 子节点管理
  addChild(child: any): any;
  removeChild(child: any): any;
  findChildById(id: string): Container | null;
  findChildrenByTag(tag: string): Container[];
  
  // 容器访问
  getContainer(): Container;
}

/**
 * 场景容器接口
 * 扩展基本容器接口，添加场景特有的功能
 */
export interface ISceneContainer extends IContainer {
  // 场景特有属性
  sceneName: string;
  
  // 场景相关方法
  transitionIn(duration?: number): Promise<void>;
  transitionOut(duration?: number): Promise<void>;
  
  // 场景状态
  saveState(): any;
  loadState(state: any): void;
}

/**
 * 层级容器接口
 * 专为管理渲染层级的容器设计
 */
export interface ILayerContainer extends IContainer {
  // 层级属性
  layerPriority: number;
  
  // 层级排序方法
  sortChildren(): void;
  
  // 层级交互控制
  disableInteraction(): void;
  enableInteraction(): void;
}
