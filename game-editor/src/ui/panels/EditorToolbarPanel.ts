import { EventBus } from '../../core/EventBus';
import { EditorCore } from '../../core/EditorCore';

/**
 * 编辑器工具栏面板 - 管理节点编辑器相关的工具按钮
 * 独立组件，不影响LiteGraph编辑器功能
 */
export class EditorToolbarPanel {
  private eventBus: EventBus;
  private element: HTMLElement;
  private editorCore: EditorCore | null = null;
  private isInitialized = false;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
    // 先不创建容器，在initialize时创建
    this.element = document.createElement('div');
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('🔧 开始初始化EditorToolbarPanel');

    // 1. 创建工具栏容器
    this.element = this.createToolbarContainer();

    // 2. 注入工具栏样式
    this.injectStyles();

    // 3. 创建工具栏按钮
    this.createToolbarButtons();

    // 4. 设置事件监听
    this.setupEventListeners();

    this.isInitialized = true;
    console.log('✅ EditorToolbarPanel初始化完成');
  }

  /**
   * 创建工具栏容器
   */
  private createToolbarContainer(): HTMLElement {
    const toolbar = document.createElement('div');
    toolbar.id = 'editor-toolbar';
    toolbar.className = 'editor-toolbar';

    // 直接添加到body，避免被app-container影响
    document.body.appendChild(toolbar);

    console.log('✅ 工具栏容器创建完成');
    return toolbar;
  }

  /**
   * 注入工具栏样式
   */
  private injectStyles() {
    if (document.getElementById('editor-toolbar-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'editor-toolbar-styles';
    style.textContent = `
      /* 编辑器工具栏 - 独立样式，不影响LiteGraph */
      .editor-toolbar {
        position: fixed;
        top: 60px;
        left: 10px;
        z-index: 1500;
        display: flex;
        gap: 8px;
        background: rgba(45, 45, 45, 0.95);
        border: 1px solid #444;
        border-radius: 6px;
        padding: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        backdrop-filter: blur(10px);
      }

      .toolbar-btn {
        display: flex;
        align-items: center;
        gap: 6px;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid #555;
        color: #ffffff;
        padding: 8px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 500;
        transition: all 0.2s ease;
        white-space: nowrap;
        text-decoration: none;
      }

      .toolbar-btn:hover {
        background: rgba(255, 255, 255, 0.2);
        border-color: #4ECDC4;
        transform: translateY(-1px);
      }

      .toolbar-btn:active {
        transform: translateY(0);
      }

      .toolbar-btn.primary {
        background: #4ECDC4;
        color: #000;
        border-color: #4ECDC4;
      }

      .toolbar-btn.primary:hover {
        background: #5fd4cc;
      }

      .toolbar-btn-icon {
        font-size: 14px;
      }

      /* 响应式设计 */
      @media (max-width: 768px) {
        .editor-toolbar {
          top: 60px;
          left: 5px;
          right: 5px;
          width: auto;
          flex-wrap: wrap;
          justify-content: flex-start;
        }

        .toolbar-btn {
          min-width: 70px;
          padding: 6px 8px;
          font-size: 11px;
        }
      }
    `;
    
    document.head.appendChild(style);
  }

  /**
   * 创建工具栏按钮
   */
  private createToolbarButtons() {
    console.log('🔧 开始创建工具栏按钮');
    console.log('工具栏元素:', this.element);

    // 清空现有内容
    this.element.innerHTML = '';

    // 节点库按钮
    const nodeLibBtn = this.createButton('📚', '节点库', 'toolbar-btn', () => {
      this.showNodeLibrary();
    });
    this.element.appendChild(nodeLibBtn);

    // 运行按钮
    const runBtn = this.createButton('▶️', '运行', 'toolbar-btn primary', () => {
      this.runGame();
    });
    this.element.appendChild(runBtn);

    // 暂停按钮
    const pauseBtn = this.createButton('⏸️', '暂停', 'toolbar-btn', () => {
      this.pauseGame();
    });
    this.element.appendChild(pauseBtn);

    // 重置按钮
    const resetBtn = this.createButton('🔄', '重置', 'toolbar-btn', () => {
      this.resetGame();
    });
    this.element.appendChild(resetBtn);

    // 导出按钮
    const exportBtn = this.createButton('📦', '导出', 'toolbar-btn', () => {
      this.exportGame();
    });
    this.element.appendChild(exportBtn);

    console.log('✅ 工具栏按钮创建完成，按钮数量:', this.element.children.length);
  }

  /**
   * 创建按钮元素
   */
  private createButton(icon: string, text: string, className: string, onClick: () => void): HTMLElement {
    const button = document.createElement('button');
    button.className = className;
    button.onclick = onClick;
    
    const iconSpan = document.createElement('span');
    iconSpan.className = 'toolbar-btn-icon';
    iconSpan.textContent = icon;
    
    const textSpan = document.createElement('span');
    textSpan.textContent = text;
    
    button.appendChild(iconSpan);
    button.appendChild(textSpan);
    
    return button;
  }

  /**
   * 设置事件监听
   */
  private setupEventListeners() {
    // 监听窗口大小变化，调整工具栏位置
    window.addEventListener('resize', () => {
      this.adjustToolbarPosition();
    });
  }

  /**
   * 调整工具栏位置
   */
  private adjustToolbarPosition() {
    // 在移动端时可以调整工具栏位置
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
      this.element.style.position = 'fixed';
    } else {
      this.element.style.position = 'absolute';
    }
  }

  /**
   * 连接编辑器核心
   */
  connectEditorCore(editorCore: EditorCore) {
    this.editorCore = editorCore;
    console.log('✅ 编辑器工具栏连接完成');
  }

  /**
   * 显示节点库
   */
  private showNodeLibrary() {
    this.eventBus.emit('node-library:show');
    console.log('📚 显示节点库');
  }

  /**
   * 运行游戏
   */
  private runGame() {
    this.eventBus.emit('game:run');
    console.log('▶️ 运行游戏');
  }

  /**
   * 暂停游戏
   */
  private pauseGame() {
    this.eventBus.emit('game:pause');
    console.log('⏸️ 暂停游戏');
  }

  /**
   * 重置游戏
   */
  private resetGame() {
    this.eventBus.emit('game:reset');
    console.log('🔄 重置游戏');
  }

  /**
   * 导出游戏
   */
  private exportGame() {
    this.eventBus.emit('game:export');
    console.log('📦 导出游戏');
  }
}
