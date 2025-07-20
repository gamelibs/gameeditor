import { BasePanel } from './BasePanel';
import { EventBus } from '../../core/EventBus';
import { EditorCore } from '../../core/EditorCore';

/**
 * 顶部工具栏面板 - 管理顶部按钮组
 * 基于远程main.ts中的createTopbarButtonGroup函数重构
 */
export class TopbarPanel extends BasePanel {
  private editorCore: EditorCore | null = null;
  private isRunning = false;

  constructor(eventBus: EventBus) {
    super(eventBus, 'topbar');
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // 1. 注入topbar专属样式
    this.injectStyles();

    // 2. 创建topbar内容
    this.createTopbarButtonGroup();

    // 3. 设置事件监听
    this.setupEventListeners();

    this.isInitialized = true;
  }

  /**
   * 注入topbar专属样式
   */
  private injectStyles() {
    // 检查是否已经注入过样式
    if (document.getElementById('topbar-styles')) return;

    const style = document.createElement('style');
    style.id = 'topbar-styles';
    style.textContent = `
      /* TopbarPanel 专属样式 - 最高优先级保护 */
      #topbar {
        min-height: 50px !important;
        background: var(--panel-bg) !important;
        border-bottom: 1px solid var(--border-color) !important;
        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;
        padding: 0 15px !important;
        position: relative !important;
        z-index: 1000 !important;
        visibility: visible !important;
        opacity: 1 !important;
        width: 100% !important;
        box-sizing: border-box !important;
      }

      .topbar-title {
        color: var(--text-color);
        font-weight: bold;
        font-size: 16px;
        line-height: 1.2;
        white-space: nowrap;
      }

      .topbar-btn-group {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }

      .topbar-btn {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid var(--border-color);
        color: var(--text-color);
        padding: 8px 12px;
        cursor: pointer;
        border-radius: 4px;
        font-size: 13px;
        font-weight: 500;
        transition: all 0.2s ease;
        white-space: nowrap;
      }

      .topbar-btn:hover {
        background: rgba(255, 255, 255, 0.2);
        transform: translateY(-1px);
      }

      .topbar-btn:active {
        transform: translateY(0);
      }

      .topbar-select {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid var(--border-color);
        color: var(--text-color);
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 13px;
        cursor: pointer;
      }

      .hamburger-menu {
        display: none;
        flex-direction: column;
        cursor: pointer;
        padding: 5px;
        gap: 3px;
      }

      .hamburger-line {
        width: 20px;
        height: 2px;
        background: var(--text-color);
        transition: all 0.3s ease;
      }



      /* 移动端响应式 */
      @media (max-width: 768px) {
        #topbar {
          flex-wrap: wrap;
          min-height: 50px;
          height: auto;
        }

        .hamburger-menu {
          display: flex;
        }

        .topbar-btn-group {
          width: 100%;
          max-height: 0;
          overflow: hidden;
          opacity: 0;
          transition: all 0.3s ease;
          flex-direction: column;
          align-items: stretch;
          gap: 5px;
          order: 3;
        }

        .topbar-btn-group.expanded {
          max-height: 300px;
          opacity: 1;
          padding: 10px 0;
        }

        .topbar-btn {
          width: 100%;
          text-align: center;
          margin: 0;
        }

        .topbar-title {
          font-size: 14px;
          order: 1;
        }

        .hamburger-menu {
          order: 2;
        }
      }

      @media (max-width: 480px) {
        #topbar {
          padding: 0 10px;
        }

        .topbar-title {
          font-size: 12px;
        }

        .topbar-btn {
          padding: 6px 10px;
          font-size: 12px;
        }
      }
    `;

    document.head.appendChild(style);
  }

  /**
   * 连接编辑器核心
   */
  connectEditorCore(editorCore: EditorCore) {
    this.editorCore = editorCore;
  }

  /**
   * 创建响应式顶部按钮组
   */
  private createTopbarButtonGroup() {
    // 检查是否已存在
    if (document.getElementById('topbar-btn-group')) return;

    // 创建标题
    const title = document.createElement('div');
    title.textContent = 'Game Editor';
    title.className = 'topbar-title';
    this.element.appendChild(title);

    // 创建汉堡菜单按钮（移动端显示）
    const hamburger = document.createElement('div');
    hamburger.className = 'hamburger-menu';
    hamburger.onclick = () => this.toggleMobileMenu();

    for (let i = 0; i < 3; i++) {
      const line = document.createElement('div');
      line.className = 'hamburger-line';
      hamburger.appendChild(line);
    }
    this.element.appendChild(hamburger);

    // 创建按钮组
    const btnGroup = document.createElement('div');
    btnGroup.id = 'topbar-btn-group';
    btnGroup.className = 'topbar-btn-group';

    // 添加所有按钮
    this.createSaveButton(btnGroup);
    this.createClearButton(btnGroup);
    this.createRunButton(btnGroup);
    this.createExampleButton(btnGroup);
    this.createExportButton(btnGroup);

    // 添加到topbar
    this.element.appendChild(btnGroup);

    // 确保移动端初始状态是隐藏的
    this.checkMobileState();
  }

  /**
   * 检查移动端状态并设置初始状态
   */
  private checkMobileState() {
    const btnGroup = document.getElementById('topbar-btn-group');
    if (btnGroup) {
      // 移除可能存在的expanded类，确保初始状态是隐藏的
      btnGroup.classList.remove('expanded');
    }

    // 监听窗口大小变化
    window.addEventListener('resize', () => {
      this.handleResize();
    });
  }

  /**
   * 处理窗口大小变化
   */
  private handleResize() {
    const btnGroup = document.getElementById('topbar-btn-group');
    if (btnGroup && window.innerWidth > 768) {
      // 桌面端时移除expanded类
      btnGroup.classList.remove('expanded');
    }
  }

  /**
   * 切换移动端菜单
   */
  private toggleMobileMenu() {
    const btnGroup = document.getElementById('topbar-btn-group');
    if (btnGroup) {
      const isExpanded = btnGroup.classList.contains('expanded');
      if (isExpanded) {
        btnGroup.classList.remove('expanded');
      } else {
        btnGroup.classList.add('expanded');
      }
    }
  }

  /**
   * 创建保存按钮
   */
  private createSaveButton(container: HTMLElement) {
    const saveBtn = document.createElement('button');
    saveBtn.textContent = 'save';
    saveBtn.className = 'topbar-btn';
    saveBtn.onclick = () => {
      if (!this.editorCore) return;
      
      const graphData = this.editorCore.graph.serialize();
      localStorage.setItem('game-editor-graph', JSON.stringify(graphData));
      saveBtn.textContent = 'saved';
      setTimeout(() => (saveBtn.textContent = 'save'), 1000);
      
      this.eventBus.emit('graph:saved', { data: graphData });
    };
    container.appendChild(saveBtn);
  }

  /**
   * 创建清除按钮
   */
  private createClearButton(container: HTMLElement) {
    const clearBtn = document.createElement('button');
    clearBtn.textContent = 'clear';
    clearBtn.className = 'topbar-btn';
    clearBtn.onclick = () => {
      if (!this.editorCore) return;
      
      localStorage.removeItem('game-editor-graph');
      this.editorCore.graph.clear();
      clearBtn.textContent = 'cleared';
      setTimeout(() => (clearBtn.textContent = 'clear'), 1000);
      
      this.eventBus.emit('graph:cleared');
    };
    container.appendChild(clearBtn);
  }

  /**
   * 创建运行/停止按钮
   */
  private createRunButton(container: HTMLElement) {
    const runBtn = document.createElement('button');
    runBtn.id = 'run-graph-btn';
    runBtn.textContent = 'play';
    runBtn.className = 'topbar-btn';
    
    runBtn.onclick = () => {
      if (!this.editorCore) return;
      
      if (!this.isRunning) {
        const graphData = this.editorCore.graph.serialize();
        localStorage.setItem('game-editor-graph', JSON.stringify(graphData));
        this.editorCore.graph.runStep();
        runBtn.textContent = 'stop';
        this.isRunning = true;
        
        this.eventBus.emit('graph:run', { data: graphData });
      } else {
        window.location.reload();
      }
    };
    container.appendChild(runBtn);
  }



  /**
   * 创建案例按钮
   */
  private createExampleButton(container: HTMLElement) {
    const exampleBtn = document.createElement('button');
    exampleBtn.textContent = '案例';
    exampleBtn.className = 'topbar-btn';
    exampleBtn.onclick = () => {
      this.eventBus.emit('ui:show-examples');
    };
    container.appendChild(exampleBtn);
  }

  /**
   * 创建导出按钮
   */
  private createExportButton(container: HTMLElement) {
    const exportBtn = document.createElement('button');
    exportBtn.textContent = '导出游戏';
    exportBtn.className = 'topbar-btn';
    exportBtn.onclick = () => {
      this.eventBus.emit('game:export');
    };
    container.appendChild(exportBtn);
  }

  protected setupEventListeners() {
    // 监听图表变化
    this.eventBus.on('graph:changed', () => {
      // 可以在这里更新按钮状态
    });
    
    // 监听运行状态变化
    this.eventBus.on('graph:stopped', () => {
      this.isRunning = false;
      const runBtn = document.getElementById('run-graph-btn');
      if (runBtn) {
        runBtn.textContent = 'play';
      }
    });
  }

  destroy() {
    const btnGroup = document.getElementById('topbar-btn-group');
    if (btnGroup) {
      btnGroup.remove();
    }
    super.destroy();
  }
}
