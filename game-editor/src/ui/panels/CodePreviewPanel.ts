import { EventBus } from '../../core/EventBus';

/**
 * 代码预览面板 - 管理代码生成和显示
 */
export class CodePreviewPanel {
  private eventBus: EventBus;
  private panel: HTMLElement | null = null;
  private isVisible: boolean = false;
  private currentTab: string = 'index';
  private gameData: any = null;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
    this.init();
  }

  /**
   * 初始化代码预览面板
   */
  private init() {
    this.createPanel();
    this.setupEventListeners();
    console.log('📝 代码预览面板初始化完成');
  }

  /**
   * 创建面板
   */
  private createPanel() {
    // 创建面板容器
    const panel = document.createElement('div');
    panel.id = 'code-preview-panel';
    panel.className = 'code-preview-panel';
    
    // 面板HTML结构
    panel.innerHTML = `
      <div class="code-preview-header">
        <div class="code-preview-title">
          <span class="code-preview-icon">📝</span>
          <span>代码预览</span>
        </div>
        <div class="code-preview-tabs">
          <button class="code-preview-tab active" data-tab="index">index.html</button>
          <button class="code-preview-tab" data-tab="gamecore">gamecore.js</button>
          <button class="code-preview-tab" data-tab="logic">logic.js</button>
          <button class="code-preview-tab" data-tab="console">调试控制台</button>
        </div>
        <button class="code-preview-close">×</button>
      </div>
      <div class="code-preview-content">
        <div class="code-preview-pane active" data-pane="index">
          <pre><code class="language-html" id="code-index"><!-- 游戏页面代码将在这里显示 --></code></pre>
        </div>
        <div class="code-preview-pane" data-pane="gamecore">
          <pre><code class="language-javascript" id="code-gamecore">// 游戏核心引擎代码将在这里显示</code></pre>
        </div>
        <div class="code-preview-pane" data-pane="logic">
          <pre><code class="language-javascript" id="code-logic">// 游戏逻辑代码将在这里显示</code></pre>
        </div>
        <div class="code-preview-pane" data-pane="console">
          <div class="debug-console" id="debug-console">
            <div class="console-output">
              <div class="console-line">📝 代码预览面板已启动</div>
              <div class="console-line">🎮 等待游戏数据...</div>
            </div>
            <div class="console-input">
              <input type="text" placeholder="输入调试命令..." />
              <button>执行</button>
            </div>
          </div>
        </div>
      </div>
    `;

    // 添加样式
    this.addStyles();
    
    // 添加到页面
    document.body.appendChild(panel);
    this.panel = panel;

    // 设置事件监听
    this.setupPanelEvents();
  }

  /**
   * 添加样式
   */
  private addStyles() {
    if (document.getElementById('code-preview-styles')) return;

    const style = document.createElement('style');
    style.id = 'code-preview-styles';
    style.textContent = `
      .code-preview-panel {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 80vw;
        height: 70vh;
        background: #1e1e1e;
        border: 1px solid #333;
        border-radius: 8px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
        z-index: 3000;
        display: none;
        flex-direction: column;
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      }

      .code-preview-panel.visible {
        display: flex;
      }

      .code-preview-header {
        display: flex;
        align-items: center;
        padding: 12px 16px;
        background: #2d2d2d;
        border-bottom: 1px solid #333;
        border-radius: 8px 8px 0 0;
      }

      .code-preview-title {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #fff;
        font-weight: 600;
        font-size: 14px;
      }

      .code-preview-tabs {
        display: flex;
        gap: 4px;
        margin-left: auto;
        margin-right: 16px;
      }

      .code-preview-tab {
        padding: 6px 12px;
        background: #3c3c3c;
        border: none;
        border-radius: 4px;
        color: #ccc;
        font-size: 12px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .code-preview-tab:hover {
        background: #4c4c4c;
        color: #fff;
      }

      .code-preview-tab.active {
        background: #007acc;
        color: #fff;
      }

      .code-preview-close {
        background: #ff5f56;
        border: none;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        color: #fff;
        cursor: pointer;
        font-size: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .code-preview-content {
        flex: 1;
        position: relative;
        overflow: hidden;
      }

      .code-preview-pane {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: none;
        overflow: auto;
      }

      .code-preview-pane.active {
        display: block;
      }

      .code-preview-pane pre {
        margin: 0;
        padding: 16px;
        background: #1e1e1e;
        color: #d4d4d4;
        font-size: 13px;
        line-height: 1.5;
        height: 100%;
        overflow: auto;
      }

      .debug-console {
        height: 100%;
        display: flex;
        flex-direction: column;
        background: #0c0c0c;
      }

      .console-output {
        flex: 1;
        padding: 16px;
        overflow-y: auto;
        font-size: 13px;
        line-height: 1.4;
      }

      .console-line {
        color: #00ff00;
        margin-bottom: 4px;
        font-family: 'Monaco', 'Menlo', monospace;
      }

      .console-input {
        display: flex;
        padding: 8px 16px;
        border-top: 1px solid #333;
        gap: 8px;
      }

      .console-input input {
        flex: 1;
        background: #2d2d2d;
        border: 1px solid #555;
        border-radius: 4px;
        padding: 6px 8px;
        color: #fff;
        font-size: 12px;
      }

      .console-input button {
        background: #007acc;
        border: none;
        border-radius: 4px;
        padding: 6px 12px;
        color: #fff;
        font-size: 12px;
        cursor: pointer;
      }
    `;

    document.head.appendChild(style);
  }

  /**
   * 设置面板内部事件
   */
  private setupPanelEvents() {
    if (!this.panel) return;

    // Tab切换
    const tabs = this.panel.querySelectorAll('.code-preview-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const tabName = target.dataset.tab;
        if (tabName) {
          this.switchTab(tabName);
        }
      });
    });

    // 关闭按钮
    const closeBtn = this.panel.querySelector('.code-preview-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.hide();
      });
    }
  }

  /**
   * 设置事件监听
   */
  private setupEventListeners() {
    // 监听代码预览切换事件
    this.eventBus.on('code-preview:toggle', () => {
      this.toggle();
    });

    // 监听PixiAppNode数据变化
    document.addEventListener('pixi-app-node-changed', (e: any) => {
      console.log('📝 CodePreviewPanel 接收到事件:', e.detail);
      this.updateGameData(e.detail);
    });
  }

  /**
   * 切换Tab
   */
  private switchTab(tabName: string) {
    if (!this.panel) return;

    // 更新tab状态
    const tabs = this.panel.querySelectorAll('.code-preview-tab');
    const panes = this.panel.querySelectorAll('.code-preview-pane');

    tabs.forEach(tab => {
      if (tab.getAttribute('data-tab') === tabName) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });

    panes.forEach(pane => {
      if (pane.getAttribute('data-pane') === tabName) {
        pane.classList.add('active');
      } else {
        pane.classList.remove('active');
      }
    });

    this.currentTab = tabName;
    this.generateCode();
  }

  /**
   * 切换显示状态
   */
  toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * 显示面板
   */
  show() {
    if (this.panel) {
      this.panel.classList.add('visible');
      this.isVisible = true;
      this.generateCode();
      console.log('📝 代码预览面板已显示');
    }
  }

  /**
   * 隐藏面板
   */
  hide() {
    if (this.panel) {
      this.panel.classList.remove('visible');
      this.isVisible = false;
      console.log('📝 代码预览面板已隐藏');
    }
  }

  /**
   * 更新游戏数据
   */
  updateGameData(data: any) {
    this.gameData = data;
    if (this.isVisible) {
      this.generateCode();
    }
    console.log('📝 游戏数据已更新', data);
  }

  /**
   * 加载并显示代码
   */
  private generateCode() {
    console.log('📝 加载代码文件，当前tab:', this.currentTab);

    switch (this.currentTab) {
      case 'index':
        this.loadIndexHtml();
        break;
      case 'gamecore':
        this.loadGameCore();
        break;
      case 'logic':
        this.loadLogic();
        break;
    }
  }

  /**
   * 加载index.html文件
   */
  private async loadIndexHtml() {
    try {
      console.log('📝 加载 build/index.html');
      const response = await fetch('./build/index.html');
      if (response.ok) {
        const code = await response.text();
        this.updateCodeDisplay('code-index', code);
        console.log('✅ index.html 加载成功');
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('❌ 加载 index.html 失败:', error);
      this.updateCodeDisplay('code-index', `<!-- 加载失败: ${error} -->\n<!-- 请确保 build/index.html 文件存在 -->`);
    }
  }

  /**
   * 加载gamecore.js文件
   */
  private async loadGameCore() {
    try {
      console.log('📝 加载 build/gamecore.js');
      const response = await fetch('./build/gamecore.js');
      if (response.ok) {
        const code = await response.text();
        this.updateCodeDisplay('code-gamecore', code);
        console.log('✅ gamecore.js 加载成功');
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('❌ 加载 gamecore.js 失败:', error);
      this.updateCodeDisplay('code-gamecore', `// 加载失败: ${error}\n// 请确保 build/gamecore.js 文件存在`);
    }
  }

  /**
   * 加载logic.js文件
   */
  private async loadLogic() {
    try {
      console.log('📝 加载 build/logic.js');
      const response = await fetch('./build/logic.js');
      if (response.ok) {
        const code = await response.text();
        this.updateCodeDisplay('code-logic', code);
        console.log('✅ logic.js 加载成功');
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('❌ 加载 logic.js 失败:', error);
      this.updateCodeDisplay('code-logic', `// 加载失败: ${error}\n// 请确保 build/logic.js 文件存在`);
    }
  }







  /**
   * 更新代码显示
   */
  private updateCodeDisplay(elementId: string, code: string) {
    const element = document.getElementById(elementId);
    if (element) {
      element.textContent = code;
    }
  }
}
