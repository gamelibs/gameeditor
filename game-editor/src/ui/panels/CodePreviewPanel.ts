import { BasePanel } from './BasePanel';
import { EventBus } from '../../core/EventBus';
import { ThreeTabCodeGenerator } from '../ThreeTabCodeGenerator';

/**
 * 代码预览面板 - 管理代码生成和显示
 */
export class CodePreviewPanel extends BasePanel {
  private codeGenerator: ThreeTabCodeGenerator | null = null;
  private currentTab = 'game-logic';

  constructor(eventBus: EventBus) {
    super(eventBus, 'code-preview-panel');
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    this.setupCodeTabs();
    this.setupControlButtons();
    this.setupEventListeners();
    
    this.isInitialized = true;
  }

  setCodeGenerator(generator: ThreeTabCodeGenerator) {
    this.codeGenerator = generator;
    this.updateCode();
  }

  private setupCodeTabs() {
    const tabs = this.element.querySelectorAll('.code-tab');
    const tabPanes = this.element.querySelectorAll('.tab-pane');
    
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetTab = tab.getAttribute('data-tab');
        if (!targetTab) return;

        // 移除所有活动状态
        tabs.forEach(t => t.classList.remove('active'));
        tabPanes.forEach(pane => pane.classList.remove('active'));
        
        // 激活当前标签
        tab.classList.add('active');
        const targetElement = document.getElementById(`${targetTab}-tab`);
        if (targetElement) {
          targetElement.classList.add('active');
          this.currentTab = targetTab;
          this.updateCodeDisplay(targetTab);
        }
      });
    });
  }

  private setupControlButtons() {
    // 新窗口打开代码
    document.getElementById('openCodeInNewWindowBtn')?.addEventListener('click', () => {
      this.openInNewWindow();
    });

    // 复制代码
    document.getElementById('copyCodeBtn')?.addEventListener('click', () => {
      this.copyCode();
    });

    // 下载代码
    document.getElementById('downloadCodeBtn')?.addEventListener('click', () => {
      this.downloadCode();
    });
  }

  protected setupEventListeners() {
    this.eventBus.on('graph:changed', () => {
      this.updateCode();
    });
  }

  updateCode() {
    if (!this.codeGenerator) return;
    
    try {
      this.updateCodeDisplay(this.currentTab);
      console.log('✅ 代码更新完成');
    } catch (error) {
      console.error('❌ 代码更新失败:', error);
    }
  }

  private updateCodeDisplay(tabType: string) {
    if (!this.codeGenerator) return;

    let code = '';
    let elementId = '';
    
    switch (tabType) {
      case 'game-logic':
        code = this.codeGenerator.generateGameLogic();
        elementId = 'gameLogicDisplay';
        break;
      case 'runtime':
        code = this.codeGenerator.generateRuntimeEngine();
        elementId = 'runtimeDisplay';
        break;
      case 'index-html':
        this.loadRealIndexHtml();
        return;
      case 'debug-console':
        code = this.codeGenerator.generateDebugConsole();
        elementId = 'debugConsoleDisplay';
        break;
      default:
        return;
    }
    
    const codeDisplay = document.getElementById(elementId);
    if (codeDisplay) {
      codeDisplay.textContent = code;
    }
  }

  private async loadRealIndexHtml() {
    const codeDisplay = document.getElementById('indexHtmlDisplay');
    if (!codeDisplay || !this.codeGenerator) return;
    
    codeDisplay.innerHTML = `<div style="padding: 20px; color: #666; text-align: center;">
      📄 正在读取 build/index.html 内容...
    </div>`;
    
    try {
      const realContent = await this.codeGenerator.loadRealIndexHtml();
      codeDisplay.textContent = realContent;
    } catch (error) {
      codeDisplay.innerHTML = `<div style="padding: 20px; color: #e74c3c; text-align: center;">
        ❌ 无法读取 build/index.html<br><br>
        错误信息: ${error instanceof Error ? error.message : '未知错误'}
      </div>`;
    }
  }

  private copyCode() {
    const activeTab = this.element.querySelector('.tab-pane.active');
    const codeDisplay = activeTab?.querySelector('pre');
    
    if (codeDisplay?.textContent) {
      navigator.clipboard.writeText(codeDisplay.textContent).then(() => {
        this.showMessage('代码已复制到剪贴板', 'success');
      });
    }
  }

  private downloadCode() {
    if (!this.codeGenerator) return;

    const gameLogic = this.codeGenerator.generateGameLogic();
    const indexHtml = this.codeGenerator.generateIndexHtml();
    const runtime = this.codeGenerator.generateRuntimeEngine();
    
    const allFiles = `
=== main.js ===
${gameLogic}

=== index.html ===
${indexHtml}

=== runtime.js ===
${runtime}
`;
    
    const blob = new Blob([allFiles], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'game-files.txt';
    a.click();
    
    URL.revokeObjectURL(url);
    this.showMessage('代码文件已下载', 'success');
  }

  private openInNewWindow() {
    const codeUrl = '/code-preview.html';
    const newWindow = window.open(codeUrl, '_blank', 'width=1200,height=800');
    if (newWindow) {
      newWindow.focus();
      this.hide();
      this.eventBus.emit('panel:openedInNewWindow', { panel: 'code' });
    }
  }

  private showMessage(message: string, type: 'success' | 'error' | 'info' = 'info') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    messageDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 10px 15px;
      border-radius: 5px;
      color: white;
      z-index: 10000;
      font-size: 14px;
      background: ${type === 'success' ? '#4ECDC4' : type === 'error' ? '#e74c3c' : '#3498db'};
    `;
    
    document.body.appendChild(messageDiv);
    setTimeout(() => messageDiv.remove(), 3000);
  }
}