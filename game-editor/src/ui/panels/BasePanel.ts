import { EventBus } from '../../core/EventBus';

/**
 * 基础面板类 - 所有面板的基类
 */
export abstract class BasePanel {
  protected eventBus: EventBus;
  protected element: HTMLElement;
  protected isVisible = true;
  protected isInitialized = false;

  constructor(eventBus: EventBus, elementId: string) {
    this.eventBus = eventBus;
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`找不到面板元素: ${elementId}`);
    }
    this.element = element;
  }

  abstract initialize(): Promise<void>;

  show() {
    this.element.classList.remove('hidden');
    this.isVisible = true;
    this.eventBus.emit('panel:show', { panelId: this.constructor.name });
  }

  hide() {
    this.element.classList.add('hidden');
    this.isVisible = false;
    this.eventBus.emit('panel:hide', { panelId: this.constructor.name });
  }

  destroy() {
    // 子类可以重写此方法进行清理
  }

  protected setupEventListeners() {
    // 子类实现具体的事件监听
  }
}