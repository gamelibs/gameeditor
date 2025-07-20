/**
 * 事件总线系统
 * 用于解耦组件间的通信，实现发布-订阅模式
 */

export type EventCallback = (...args: any[]) => void;

export class EventBus {
  private listeners: Map<string, EventCallback[]> = new Map();

  on(event: string, callback: EventCallback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: EventCallback) {
    const arr = this.listeners.get(event);
    if (arr) {
      const idx = arr.indexOf(callback);
      if (idx !== -1) arr.splice(idx, 1);
    }
  }

  emit(event: string, ...args: any[]) {
    const arr = this.listeners.get(event);
    if (arr) {
      arr.forEach(cb => cb(...args));
    }
  }
}
