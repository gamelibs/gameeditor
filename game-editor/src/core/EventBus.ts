/**
 * 事件总线系统
 * 用于解耦组件间的通信，实现发布-订阅模式
 */

export type EventCallback = (...args: any[]) => void;

export interface EventBusEvents {
  // 节点相关事件
  'node:added': (node: any) => void;
  'node:removed': (node: any) => void;
  'node:changed': (node: any) => void;
  'node:connected': (sourceNode: any, targetNode: any) => void;
  'node:disconnected': (sourceNode: any, targetNode: any) => void;
  
  // 图表相关事件
  'graph:changed': () => void;
  'graph:clear': () => void;
  'graph:loaded': (graphData: any) => void;
  'graph:saved': (graphData: any) => void;
  
  // 预览相关事件
  'preview:update': () => void;
  'preview:resize': (width: number, height: number) => void;
  'preview:refresh': () => void;
  
  // 代码相关事件
  'code:generate': () => void;
  'code:updated': (codeType: string, code: string) => void;
  
  // 导出相关事件
  'export:start': () => void;
  'export:complete': (files: Map<string, string>) => void;
  'export:error': (error: Error) => void;
  
  // 系统相关事件
  'system:ready': () => void;
  'system:error': (error: Error) => void;
}

export class EventBus {
  private static instance: EventBus;
  private listeners: Map<string, EventCallback[]> = new Map();
  
  private constructor() {}
  
  /**
   * 获取单例实例
   */
  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }
  
  /**
   * 订阅事件
   */
  on<K extends keyof EventBusEvents>(
    event: K, 
    callback: EventBusEvents[K]
  ): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    
    const callbacks = this.listeners.get(event)!;
    callbacks.push(callback as EventCallback);
    
    // 返回取消订阅函数
    return () => {
      const index = callbacks.indexOf(callback as EventCallback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    };
  }
  
  /**
   * 取消订阅事件
   */
  off<K extends keyof EventBusEvents>(
    event: K, 
    callback: EventBusEvents[K]
  ): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback as EventCallback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }
  
  /**
   * 发送事件
   */
  emit<K extends keyof EventBusEvents>(
    event: K, 
    ...args: Parameters<EventBusEvents[K]>
  ): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      // 创建副本避免在回调中修改原数组导致的问题
      const callbacksCopy = [...callbacks];
      callbacksCopy.forEach(callback => {
        try {
          callback(...args);
        } catch (error) {
          console.error(`事件回调执行出错 [${event}]:`, error);
        }
      });
    }
  }
  
  /**
   * 订阅一次性事件
   */
  once<K extends keyof EventBusEvents>(
    event: K, 
    callback: EventBusEvents[K]
  ): void {
    const onceCallback = (...args: any[]) => {
      this.off(event, onceCallback as any);
      (callback as EventCallback)(...args);
    };
    
    this.on(event, onceCallback as any);
  }
  
  /**
   * 清除所有监听器
   */
  clear(): void {
    this.listeners.clear();
  }
  
  /**
   * 获取调试信息
   */
  getDebugInfo(): Record<string, number> {
    const info: Record<string, number> = {};
    this.listeners.forEach((callbacks, event) => {
      info[event] = callbacks.length;
    });
    return info;
  }
}

// 导出全局实例
export const eventBus = EventBus.getInstance();
