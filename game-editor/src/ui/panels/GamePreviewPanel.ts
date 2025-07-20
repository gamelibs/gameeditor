import { BasePanel } from './BasePanel';
import { EventBus } from '../../core/EventBus';

/**
 * 游戏预览面板 - 管理游戏预览和控制
 */
export class GamePreviewPanel extends BasePanel {
  private iframe: HTMLIFrameElement | null = null;
  private scaleInfo: HTMLElement | null = null;

  constructor(eventBus: EventBus) {
    super(eventBus, 'game-preview-panel');
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    this.setupGamePreview();
    this.setupControlButtons();
    this.setupScaleInfo();
    this.setupEventListeners();
    
    this.isInitialized = true;
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