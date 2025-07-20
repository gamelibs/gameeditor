import { EventBus } from '../../core/EventBus';
import { EditorCore } from '../../core/EditorCore';

/**
 * 浮动游戏预览组件 - 完全独立的右侧浮动预览窗口
 * 
 * 设计原则：
 * 1. 完全独立的定位，不影响现有布局
 * 2. 使用最高z-index层级，确保在最上层
 * 3. 可拖拽、可调整大小、可最小化
 * 4. 响应式适配，移动端自动调整
 * 5. 与现有组件完全隔离，确保架构稳定性
 */
export class FloatingGamePreview {
  private eventBus: EventBus;
  private editorCore: EditorCore | null = null;
  private floatingPanel: HTMLElement | null = null;
  private previewIframe: HTMLIFrameElement | null = null;
  private isVisible = false;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
  }

  /**
   * 初始化浮动预览组件
   */
  async initialize(): Promise<void> {
    console.log('🎮 初始化浮动游戏预览组件...');

    // 1. 注入样式
    this.injectStyles();

    // 2. 创建浮动面板
    this.createFloatingPanel();

    // 3. 设置事件监听
    this.setupEventListeners();

    console.log('✅ 浮动游戏预览组件初始化完成');
  }

  /**
   * 注入样式 - 使用最高优先级确保不被覆盖
   */
  private injectStyles() {
    if (document.getElementById('floating-game-preview-styles')) return;

    const style = document.createElement('style');
    style.id = 'floating-game-preview-styles';
    style.textContent = `
      /* 浮动游戏预览面板 - 最高优先级样式 */
      .floating-game-preview {
        position: fixed !important;
        top: 80px;
        right: 0px;
        width: 400px;
        height: calc(100vh - 160px);
        background: rgba(45, 45, 45, 0.98) !important;
        border: 2px solid #4ECDC4 !important;
        border-radius: 12px !important;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6) !important;
        backdrop-filter: blur(20px) !important;
        z-index: 2000 !important; /* 浮动面板层级 */
        display: none; /* 默认隐藏 */
        flex-direction: column;
        overflow: hidden;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        user-select: none;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      }

      .floating-game-preview.visible {
        display: flex !important;
      }

      .floating-game-preview.visible {
        display: flex !important;
      }



      /* 简化的标题栏 - 只显示标题，无控制按钮 */
      .floating-preview-header {
        background: linear-gradient(135deg, #4ECDC4, #44A08D) !important;
        color: white !important;
        padding: 12px 16px;
        display: flex;
        justify-content: center;
        align-items: center;
        font-weight: 600;
        font-size: 14px;
        border-radius: 0;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        cursor: default;
      }

      .floating-preview-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 600;
      }

      /* 内容区域 */
      .floating-preview-content {
        flex: 1;
        padding: 16px;
        background: #2d2d2d;
        display: flex;
        flex-direction: column;
        gap: 12px;
        overflow: hidden;
      }



      /* 预览iframe */
      .floating-preview-iframe {
        flex: 1;
        border: 1px solid #555 !important;
        border-radius: 8px;
        background: #1a1a1a;
        min-height: 300px;
        width: 100%;
      }

      /* 状态信息 */
      .floating-preview-status {
        background: rgba(78, 205, 196, 0.1);
        border: 1px solid rgba(78, 205, 196, 0.3);
        border-radius: 6px;
        padding: 8px 12px;
        font-size: 12px;
        color: #4ECDC4;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      /* 移除调整大小手柄 - 固定尺寸 */

      /* 响应式适配 */
      @media (max-width: 768px) {
        .floating-game-preview {
          top: 60px !important;
          right: 5px !important;
          left: 5px !important;
          width: auto !important;
          height: calc(100vh - 160px) !important; /* 为底部按钮留出空间 */
          max-height: calc(100vh - 160px) !important;
          bottom: 100px !important; /* 确保不遮挡底部按钮 */
        }
      }

      /* 更小屏幕的适配 */
      @media (max-width: 480px) {
        .floating-game-preview {
          top: 50px !important;
          right: 5px !important;
          left: 5px !important;
          height: calc(100vh - 140px) !important;
          max-height: calc(100vh - 140px) !important;
          bottom: 85px !important;
        }

        .floating-game-preview.minimized {
          width: 180px !important;
          right: 5px !important;
          top: 50px !important;
        }
      }

      /* 防止与其他组件冲突的保护样式 */
      .floating-game-preview * {
        box-sizing: border-box;
      }

      .floating-game-preview input,
      .floating-game-preview button,
      .floating-game-preview select {
        font-family: inherit;
      }
    `;

    document.head.appendChild(style);
  }

  /**
   * 创建浮动面板
   */
  private createFloatingPanel() {
    // 创建主容器
    const panel = document.createElement('div');
    panel.className = 'floating-game-preview';
    panel.id = 'floating-game-preview';

    // 创建标题栏
    const header = this.createHeader();
    panel.appendChild(header);

    // 创建内容区域
    const content = this.createContent();
    panel.appendChild(content);

    // 添加到页面
    document.body.appendChild(panel);
    this.floatingPanel = panel;

    console.log('✅ 浮动预览面板创建完成');
  }

  /**
   * 创建简化的标题栏
   */
  private createHeader(): HTMLElement {
    const header = document.createElement('div');
    header.className = 'floating-preview-header';

    // 只显示标题
    const title = document.createElement('div');
    title.className = 'floating-preview-title';
    title.innerHTML = '🎮 游戏预览';

    header.appendChild(title);

    return header;
  }

  /**
   * 创建内容区域
   */
  private createContent(): HTMLElement {
    const content = document.createElement('div');
    content.className = 'floating-preview-content';

    // 状态信息
    const status = document.createElement('div');
    status.className = 'floating-preview-status';
    status.innerHTML = `
      <span>📱 预览状态: 准备就绪</span>
      <span>🔄 自动刷新</span>
    `;

    // 预览iframe
    const iframe = document.createElement('iframe');
    iframe.className = 'floating-preview-iframe';
    iframe.src = 'about:blank';
    iframe.title = '游戏预览';
    this.previewIframe = iframe;

    content.appendChild(status);
    content.appendChild(iframe);

    return content;
  }

  /**
   * 设置事件监听
   */
  private setupEventListeners() {
    if (!this.floatingPanel) return;

    // 监听编辑器事件
    this.eventBus.on('graph:run', () => {
      this.refreshPreview();
    });

    this.eventBus.on('graph:changed', () => {
      // 延迟刷新，避免频繁更新
      this.debounceRefresh();
    });

    // 监听切换事件
    this.eventBus.on('floating-preview:toggle', () => {
      this.toggle();
    });
  }



  /**
   * 显示预览面板
   */
  show() {
    if (this.floatingPanel) {
      this.floatingPanel.classList.add('visible');
      this.isVisible = true;
      this.eventBus.emit('floating-preview:show');
      console.log('🎮 浮动游戏预览已显示');
    }
  }

  /**
   * 隐藏预览面板
   */
  hide() {
    if (this.floatingPanel) {
      this.floatingPanel.classList.remove('visible');
      this.isVisible = false;
      this.eventBus.emit('floating-preview:hide');
      console.log('🎮 浮动游戏预览已隐藏');
    }
  }



  /**
   * 刷新预览
   */
  refreshPreview() {
    if (this.previewIframe && this.isVisible) {
      // 这里可以设置实际的游戏预览URL
      const previewUrl = this.generatePreviewUrl();
      this.previewIframe.src = previewUrl;

      // 更新状态
      const status = this.floatingPanel?.querySelector('.floating-preview-status');
      if (status) {
        status.innerHTML = `
          <span>📱 预览状态: 已刷新</span>
          <span>🔄 ${new Date().toLocaleTimeString()}</span>
        `;
      }
    }
  }

  /**
   * 防抖刷新
   */
  private debounceRefresh = this.debounce(() => {
    this.refreshPreview();
  }, 1000);

  /**
   * 防抖函数
   */
  private debounce(func: Function, wait: number) {
    let timeout: NodeJS.Timeout;
    return function executedFunction(...args: any[]) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * 生成预览URL
   */
  private generatePreviewUrl(): string {
    // 这里应该根据当前的图表状态生成预览URL
    // 暂时返回一个示例URL
    return '/build/index.html';
  }

  /**
   * 连接编辑器核心
   */
  connectEditorCore(editorCore: EditorCore) {
    this.editorCore = editorCore;
    console.log('✅ 浮动预览面板已连接编辑器核心');
  }

  /**
   * 切换显示/隐藏
   */
  toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * 获取可见状态
   */
  isShowing(): boolean {
    return this.isVisible;
  }

  /**
   * 销毁组件
   */
  destroy() {
    if (this.floatingPanel) {
      this.floatingPanel.remove();
      this.floatingPanel = null;
    }

    // 移除样式
    const style = document.getElementById('floating-game-preview-styles');
    if (style) {
      style.remove();
    }

    console.log('🎮 浮动游戏预览组件已销毁');
  }
}
