import { EventBus } from '../../core/EventBus';

/**
 * 浮动预览按钮组件 - 完全独立的右侧浮动按钮
 * 
 * 设计原则：
 * 1. 完全独立，不依赖任何现有组件
 * 2. 固定在编辑器右侧居中位置
 * 3. 竖直排列，节省空间
 * 4. 使用高z-index确保可见性
 * 5. 响应式设计，移动端自适应
 */
export class FloatingPreviewButton {
  private eventBus: EventBus;
  private buttonContainer: HTMLElement | null = null;
  private isPreviewVisible = false;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
  }

  /**
   * 初始化浮动按钮
   */
  async initialize(): Promise<void> {
    console.log('🎮 初始化浮动预览按钮...');

    // 1. 注入样式
    this.injectStyles();

    // 2. 创建按钮容器
    this.createButtonContainer();

    // 3. 设置事件监听
    this.setupEventListeners();

    // 4. 初始位置调整
    setTimeout(() => {
      this.adjustPosition();
    }, 100);

    console.log('✅ 浮动预览按钮初始化完成');
  }

  /**
   * 注入样式
   */
  private injectStyles() {
    if (document.getElementById('floating-preview-button-styles')) return;

    const style = document.createElement('style');
    style.id = 'floating-preview-button-styles';
    style.textContent = `
      /* 浮动预览按钮 - 统一放在右下角 */
      .floating-preview-button-container {
        position: fixed !important;
        right: 20px;
        bottom: 20px;
        z-index: 2100 !important; /* 浮动按钮层级 */
        display: flex;
        flex-direction: column;
        gap: 8px;
        user-select: none;
        pointer-events: auto;
      }

      .floating-preview-btn-group {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .floating-preview-btn {
        width: 48px !important;
        height: 48px !important;
        border-radius: 24px !important;
        background: linear-gradient(135deg, #4ECDC4, #44A08D) !important;
        border: 2px solid rgba(255, 255, 255, 0.2) !important;
        color: white !important;
        font-size: 20px !important;
        font-weight: bold !important;
        cursor: pointer !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        box-shadow: 0 4px 16px rgba(78, 205, 196, 0.4) !important;
        backdrop-filter: blur(10px) !important;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
        outline: none !important;
        position: relative !important;
        overflow: hidden !important;
      }

      .floating-preview-btn:hover {
        transform: scale(1.1) !important;
        box-shadow: 0 6px 24px rgba(78, 205, 196, 0.6) !important;
        background: linear-gradient(135deg, #5FDDD6, #4DB0A3) !important;
      }

      .floating-preview-btn:active {
        transform: scale(0.95) !important;
        box-shadow: 0 2px 8px rgba(78, 205, 196, 0.8) !important;
      }

      /* 代码预览按钮特殊样式 */
      .code-preview-btn {
        background: linear-gradient(135deg, #FF6B6B, #FF8E53) !important;
      }

      .code-preview-btn:hover {
        background: linear-gradient(135deg, #FF5252, #FF7043) !important;
        box-shadow: 0 4px 16px rgba(255, 107, 107, 0.4) !important;
      }

      .code-preview-btn:active {
        transform: scale(0.95) !important;
        box-shadow: 0 2px 8px rgba(255, 107, 107, 0.8) !important;
      }

      .floating-preview-btn.active {
        background: linear-gradient(135deg, #FF6B6B, #FF5252) !important;
        box-shadow: 0 4px 16px rgba(255, 107, 107, 0.4) !important;
      }

      .floating-preview-btn.active:hover {
        background: linear-gradient(135deg, #FF7B7B, #FF6262) !important;
        box-shadow: 0 6px 24px rgba(255, 107, 107, 0.6) !important;
      }

      /* 按钮文字 */
      .floating-preview-btn-text {
        font-size: 10px !important;
        font-weight: 600 !important;
        margin-top: 2px !important;
        text-align: center !important;
        line-height: 1 !important;
        opacity: 0.9 !important;
      }

      /* 工具提示 */
      .floating-preview-btn::before {
        content: attr(data-tooltip);
        position: absolute;
        right: 60px;
        top: 50%;
        transform: translateY(-50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: normal;
        white-space: nowrap;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.3s ease;
        z-index: 10001;
      }

      .floating-preview-btn:hover::before {
        opacity: 1;
      }

      /* 响应式适配 - 移动端调整 */
      @media (max-width: 768px) {
        .floating-preview-button-container {
          right: 15px !important;
          bottom: 15px !important;
        }

        .floating-preview-btn {
          width: 56px !important;
          height: 56px !important;
          border-radius: 28px !important;
          font-size: 18px !important;
        }

        .floating-preview-btn-text {
          font-size: 9px !important;
        }

        .floating-preview-btn::before {
          display: none; /* 移动端隐藏工具提示 */
        }
      }

      /* 更小屏幕的适配 */
      @media (max-width: 480px) {
        .floating-preview-button-container {
          right: 8px !important;
          bottom: 15px !important;
        }

        .floating-preview-btn {
          width: 52px !important;
          height: 52px !important;
          border-radius: 26px !important;
          font-size: 16px !important;
        }
      }

      /* 确保在所有移动设备上都能正确显示 */
      @media (max-height: 600px) {
        .floating-preview-button-container {
          bottom: 10px !important;
        }
      }

      /* 横屏模式适配 */
      @media (max-width: 768px) and (orientation: landscape) {
        .floating-preview-button-container {
          right: 15px !important;
          bottom: 10px !important;
        }

        .floating-preview-btn {
          width: 48px !important;
          height: 48px !important;
          border-radius: 24px !important;
        }
      }

      /* 防止与其他组件冲突 */
      .floating-preview-button-container * {
        box-sizing: border-box;
      }

      /* 动画效果 */
      @keyframes pulse {
        0% { box-shadow: 0 4px 16px rgba(78, 205, 196, 0.4); }
        50% { box-shadow: 0 4px 16px rgba(78, 205, 196, 0.8); }
        100% { box-shadow: 0 4px 16px rgba(78, 205, 196, 0.4); }
      }

      .floating-preview-btn.pulse {
        animation: pulse 2s infinite;
      }
    `;

    document.head.appendChild(style);
  }

  /**
   * 创建按钮容器
   */
  private createButtonContainer() {
    // 创建容器
    const container = document.createElement('div');
    container.className = 'floating-preview-button-container';
    container.id = 'floating-preview-button-container';

    // 创建预览按钮
    const previewBtn = this.createPreviewButton();
    container.appendChild(previewBtn);

    // 添加到页面
    document.body.appendChild(container);
    this.buttonContainer = container;

    console.log('✅ 浮动预览按钮容器创建完成');
  }

  /**
   * 创建预览按钮组
   */
  private createPreviewButton(): HTMLElement {
    const buttonGroup = document.createElement('div');
    buttonGroup.className = 'floating-preview-btn-group';

    // 游戏预览按钮
    const gamePreviewBtn = document.createElement('button');
    gamePreviewBtn.className = 'floating-preview-btn';
    gamePreviewBtn.id = 'floating-preview-btn';
    gamePreviewBtn.setAttribute('data-tooltip', '打开游戏预览');

    gamePreviewBtn.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center;">
        <div style="font-size: 20px;">🎮</div>
        <div class="floating-preview-btn-text">预览</div>
      </div>
    `;

    gamePreviewBtn.onclick = () => {
      this.togglePreview();
    };

    // 代码预览按钮
    const codePreviewBtn = document.createElement('button');
    codePreviewBtn.className = 'floating-preview-btn code-preview-btn';
    codePreviewBtn.id = 'floating-code-preview-btn';
    codePreviewBtn.setAttribute('data-tooltip', '查看生成代码');

    codePreviewBtn.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center;">
        <div style="font-size: 20px;">📝</div>
        <div class="floating-preview-btn-text">代码</div>
      </div>
    `;

    codePreviewBtn.onclick = () => {
      this.toggleCodePreview();
    };

    buttonGroup.appendChild(gamePreviewBtn);
    buttonGroup.appendChild(codePreviewBtn);

    return buttonGroup;
  }

  /**
   * 设置事件监听
   */
  private setupEventListeners() {
    // 监听预览面板状态变化
    this.eventBus.on('floating-preview:show', () => {
      this.updateButtonState(true);
    });

    this.eventBus.on('floating-preview:hide', () => {
      this.updateButtonState(false);
    });

    // 监听窗口大小变化
    window.addEventListener('resize', () => {
      this.adjustPosition();
    });
  }

  /**
   * 切换预览状态
   */
  private togglePreview() {
    this.eventBus.emit('floating-preview:toggle');

    // 添加点击反馈
    const button = document.getElementById('floating-preview-btn');
    if (button) {
      button.classList.add('pulse');
      setTimeout(() => {
        button.classList.remove('pulse');
      }, 1000);
    }
  }

  /**
   * 切换代码预览状态
   */
  private toggleCodePreview() {
    this.eventBus.emit('code-preview:toggle');

    // 添加点击反馈
    const button = document.getElementById('floating-code-preview-btn');
    if (button) {
      button.classList.add('pulse');
      setTimeout(() => {
        button.classList.remove('pulse');
      }, 1000);
    }
  }

  /**
   * 更新按钮状态
   */
  private updateButtonState(isVisible: boolean) {
    this.isPreviewVisible = isVisible;
    const button = document.getElementById('floating-preview-btn');
    
    if (button) {
      if (isVisible) {
        button.classList.add('active');
        button.setAttribute('data-tooltip', '关闭游戏预览');
        button.innerHTML = `
          <div style="display: flex; flex-direction: column; align-items: center;">
            <div style="font-size: 20px;">❌</div>
            <div class="floating-preview-btn-text">关闭</div>
          </div>
        `;
      } else {
        button.classList.remove('active');
        button.setAttribute('data-tooltip', '打开游戏预览');
        button.innerHTML = `
          <div style="display: flex; flex-direction: column; align-items: center;">
            <div style="font-size: 20px;">🎮</div>
            <div class="floating-preview-btn-text">预览</div>
          </div>
        `;
      }
    }
  }

  /**
   * 调整位置（响应式）
   */
  private adjustPosition() {
    if (!this.buttonContainer) return;

    // 检查是否为移动端
    const isMobile = window.innerWidth <= 768;

    if (isMobile) {
      // 移动端：右下角，稍微调整位置
      this.buttonContainer.style.right = '15px';
      this.buttonContainer.style.bottom = '15px';
    } else {
      // 桌面端：也在右下角，但位置稍有不同
      this.buttonContainer.style.right = '20px';
      this.buttonContainer.style.bottom = '20px';
    }
  }

  /**
   * 显示按钮
   */
  show() {
    if (this.buttonContainer) {
      this.buttonContainer.style.display = 'flex';
    }
  }

  /**
   * 隐藏按钮
   */
  hide() {
    if (this.buttonContainer) {
      this.buttonContainer.style.display = 'none';
    }
  }

  /**
   * 销毁组件
   */
  destroy() {
    if (this.buttonContainer) {
      this.buttonContainer.remove();
      this.buttonContainer = null;
    }
    
    // 移除样式
    const style = document.getElementById('floating-preview-button-styles');
    if (style) {
      style.remove();
    }
    
    console.log('🎮 浮动预览按钮组件已销毁');
  }
}
