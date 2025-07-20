import { EventBus } from '../../core/EventBus';
import { EditorCore } from '../../core/EditorCore';

/**
 * 节点编辑器面板 - 最简化版本，不干扰LiteGraph默认行为
 */
export class NodeEditorPanel {
  private eventBus: EventBus;
  private element: HTMLElement;
  private editorCore: EditorCore | null = null;
  private isInitialized = false;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
    this.element = document.getElementById('app-container')!;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // 只创建最基本的canvas，不添加任何包装或样式
    this.createSimpleCanvas();

    this.isInitialized = true;
  }

  /**
   * 创建最简单的canvas - 不干扰LiteGraph
   */
  private createSimpleCanvas() {
    // 清空容器
    this.element.innerHTML = '';

    // 直接创建canvas，使用最基本的样式
    const canvas = document.createElement('canvas');
    canvas.id = 'graphCanvas';
    canvas.tabIndex = -1;

    // 只设置必要的样式，不使用任何可能干扰LiteGraph的CSS
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    canvas.style.background = '#1e1e1e';

    // 直接添加到容器，不使用任何包装div
    this.element.appendChild(canvas);

    console.log('✅ 简化canvas创建完成');
  }

  /**
   * 连接编辑器核心
   */
  connectEditorCore(editorCore: EditorCore) {
    this.editorCore = editorCore;

    // 初始化编辑器canvas
    editorCore.initializeCanvas();

    console.log('✅ 节点编辑器核心连接完成');
  }
}