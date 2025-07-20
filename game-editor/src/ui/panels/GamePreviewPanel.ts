import { BasePanel } from './BasePanel';
import { EventBus } from '../../core/EventBus';
import { EditorCore } from '../../core/EditorCore';

/**
 * 游戏预览面板 - 右侧浮动预览窗口
 * 设计原则：
 * 1. 完全独立的定位，不影响现有布局
 * 2. 使用最高z-index层级，确保在最上层
 * 3. 可拖拽、可调整大小、可最小化
 * 4. 响应式适配，移动端自动调整
 */
export class GamePreviewPanel extends BasePanel {
  private editorCore: EditorCore | null = null;
  private previewIframe: HTMLIFrameElement | null = null;
  private floatingPanel: HTMLElement | null = null;
  private isDragging = false;
  private isResizing = false;
  private dragOffset = { x: 0, y: 0 };
  private isMinimized = false;
  private lastPosition = { x: 0, y: 0, width: 400, height: 600 };

  constructor(eventBus: EventBus) {
    // 使用现有的面板元素作为基础，但创建独立的浮动面板
    super(eventBus, 'game-preview-panel');
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // 1. 注入样式
    this.injectFloatingStyles();

    // 2. 创建浮动预览面板
    this.createFloatingPreviewPanel();

    // 3. 设置事件监听
    this.setupFloatingEventListeners();

    this.isInitialized = true;
    console.log('✅ 浮动游戏预览面板初始化完成');
  }

  private setupGamePreview() {
    this.iframe = document.getElementById('gamePreviewFrame') as HTMLIFrameElement;
    
    if (this.iframe) {
      this.iframe.onload = () => {
        this.updateScaleInfo();
        this.eventBus.emit('game:loaded');
      };
    }

    // 添加游戏信息显示
    this.addGameInfoDisplay();
  }

  private addGameInfoDisplay() {
    const gameContent = this.element.querySelector('.game-preview-content');
    if (!gameContent || gameContent.querySelector('.game-info')) return;

    const gameInfo = document.createElement('div');
    gameInfo.className = 'game-info';
    gameInfo.innerHTML = `
      <div class="design-size">设计尺寸: 750 × 1334</div>
      <div class="scale-info" id="scaleInfo">缩放比例: 1:1</div>
      <div class="device-info">适配设备: iPhone 6/7/8 Plus</div>
    `;
    
    gameContent.appendChild(gameInfo);
    this.scaleInfo = document.getElementById('scaleInfo');
  }

  private setupControlButtons() {
    // 新窗口打开
    document.getElementById('openInNewWindowBtn')?.addEventListener('click', () => {
      this.openInNewWindow();
    });

    // 全屏
    document.getElementById('fullscreenBtn')?.addEventListener('click', () => {
      this.toggleFullscreen();
    });

    // 刷新预览
    document.getElementById('refreshPreviewBtn')?.addEventListener('click', () => {
      this.refreshPreview();
    });
  }

  private setupScaleInfo() {
    // 窗口大小变化时更新缩放信息
    window.addEventListener('resize', () => {
      this.updateScaleInfo();
    });

    // 初始化缩放信息
    setTimeout(() => {
      this.updateScaleInfo();
    }, 100);
  }

  protected setupEventListeners() {
    this.eventBus.on('game:run', () => {
      this.refreshPreview();
    });

    this.eventBus.on('game:reset', () => {
      this.refreshPreview();
    });

    this.eventBus.on('graph:changed', () => {
      this.refreshPreview();
    });
  }

  refreshPreview() {
    if (this.iframe) {
      this.iframe.src = this.iframe.src;
    }
  }

  private updateScaleInfo() {
    if (!this.iframe || !this.scaleInfo) return;

    const container = this.element.querySelector('.game-preview-content') as HTMLElement;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const designWidth = 750;
    const designHeight = 1334;
    
    const gameInfoHeight = 80;
    const margin = 20;
    const availableWidth = containerRect.width - margin * 2;
    const availableHeight = containerRect.height - gameInfoHeight - margin * 2;
    
    const scaleX = availableWidth / designWidth;
    const scaleY = availableHeight / designHeight;
    const scale = Math.min(scaleX, scaleY, 1);
    
    const scalePercent = Math.round(scale * 100);
    this.scaleInfo.textContent = `${scalePercent}%`;
    
    const actualWidth = Math.floor(designWidth * scale);
    const actualHeight = Math.floor(designHeight * scale);
    
    this.iframe.style.width = `${actualWidth}px`;
    this.iframe.style.height = `${actualHeight}px`;
  }

  private openInNewWindow() {
    const gameUrl = '/build/index.html';
    const newWindow = window.open(gameUrl, '_blank', 'width=750,height=1334');
    if (newWindow) {
      newWindow.focus();
      this.hide();
      this.eventBus.emit('panel:openedInNewWindow', { panel: 'game' });
    }
  }

  private toggleFullscreen() {
    const gameContent = this.element.querySelector('.game-preview-content') as HTMLElement;
    if (gameContent) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        gameContent.requestFullscreen();
      }
    }
  }
}