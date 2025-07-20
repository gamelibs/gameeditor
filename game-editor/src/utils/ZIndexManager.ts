/**
 * Z-Index层级管理器
 * 
 * 统一管理所有组件的z-index，确保层级正确且不冲突
 * 
 * 层级规划：
 * - 基础层 (0-999): 基础UI组件
 * - 编辑器层 (1000-1999): 编辑器核心组件
 * - 浮动层 (2000-9999): 浮动面板和组件
 * - LiteGraph层 (10000-10999): LiteGraph相关组件
 * - 系统层 (11000+): 系统级弹窗和通知
 */
export class ZIndexManager {
  // 基础层级定义
  static readonly LAYERS = {
    // 基础层 (0-999)
    BASE: {
      BACKGROUND: 0,
      CONTENT: 100,
      UI_ELEMENTS: 200,
    },

    // 编辑器层 (1000-1999)
    EDITOR: {
      TOPBAR: 1000,
      TOOLBAR: 1100,
      CANVAS: 1200,
      SIDEBAR: 1300,
    },

    // 浮动层 (2000-9999)
    FLOATING: {
      PANELS: 2000,
      BUTTONS: 2100,
      TOOLTIPS: 2200,
      DROPDOWNS: 2300,
    },

    // LiteGraph层 (10000-10999)
    LITEGRAPH: {
      CONTEXT_MENU: 10001,
      SEARCH_BOX: 10002,
      NODE_PANELS: 10003,
      DIALOGS: 10004,
    },

    // 系统层 (11000+)
    SYSTEM: {
      NOTIFICATIONS: 11000,
      MODALS: 11100,
      ERROR_OVERLAY: 11200,
      DEBUG_OVERLAY: 11300,
    }
  };

  /**
   * 获取指定组件的z-index值
   */
  static getZIndex(component: string): number {
    const parts = component.split('.');
    let current: any = this.LAYERS;
    
    for (const part of parts) {
      if (current[part] !== undefined) {
        current = current[part];
      } else {
        console.warn(`ZIndexManager: 未找到组件 ${component}，使用默认值`);
        return 1000;
      }
    }
    
    return typeof current === 'number' ? current : 1000;
  }

  /**
   * 设置元素的z-index
   */
  static setZIndex(element: HTMLElement, component: string): void {
    const zIndex = this.getZIndex(component);
    element.style.zIndex = zIndex.toString();
  }

  /**
   * 创建带有正确z-index的样式规则
   */
  static createStyleRule(selector: string, component: string, additionalStyles: string = ''): string {
    const zIndex = this.getZIndex(component);
    return `
      ${selector} {
        z-index: ${zIndex} !important;
        ${additionalStyles}
      }
    `;
  }

  /**
   * 注入全局z-index保护样式
   */
  static injectGlobalStyles(): void {
    if (document.getElementById('z-index-manager-styles')) return;

    const style = document.createElement('style');
    style.id = 'z-index-manager-styles';
    style.textContent = `
      /* Z-Index管理器 - 全局层级保护 */
      
      /* 基础层 */
      body, html {
        z-index: ${this.LAYERS.BASE.BACKGROUND};
      }

      /* 编辑器层 */
      #topbar {
        z-index: ${this.LAYERS.EDITOR.TOPBAR} !important;
        position: relative !important;
      }

      #app-container {
        z-index: ${this.LAYERS.EDITOR.CANVAS} !important;
        position: relative !important;
      }

      /* 浮动层 */
      .floating-game-preview {
        z-index: ${this.LAYERS.FLOATING.PANELS} !important;
      }

      .floating-preview-button-container {
        z-index: ${this.LAYERS.FLOATING.BUTTONS} !important;
      }

      .node-library-panel {
        z-index: ${this.LAYERS.FLOATING.PANELS + 100} !important;
      }

      /* LiteGraph层 - 确保最高优先级 */
      .lgraphcontextmenu,
      .litecontextmenu,
      .litegraph-contextmenu {
        z-index: ${this.LAYERS.LITEGRAPH.CONTEXT_MENU} !important;
        position: fixed !important;
      }

      .litegraph-searchbox {
        z-index: ${this.LAYERS.LITEGRAPH.SEARCH_BOX} !important;
        position: fixed !important;
      }

      .litegraph-dialog {
        z-index: ${this.LAYERS.LITEGRAPH.DIALOGS} !important;
        position: fixed !important;
      }

      /* 系统层 */
      .error-overlay,
      .notification-overlay {
        z-index: ${this.LAYERS.SYSTEM.NOTIFICATIONS} !important;
        position: fixed !important;
      }

      .modal-overlay {
        z-index: ${this.LAYERS.SYSTEM.MODALS} !important;
        position: fixed !important;
      }

      /* 防止任何组件意外覆盖topbar */
      #topbar * {
        z-index: inherit !important;
      }

      /* 确保topbar内容始终可见 */
      .topbar-btn-group,
      .topbar-title,
      .hamburger-menu {
        z-index: ${this.LAYERS.EDITOR.TOPBAR + 1} !important;
        position: relative !important;
      }
    `;

    document.head.appendChild(style);
    console.log('✅ Z-Index管理器样式已注入');
  }

  /**
   * 验证当前页面的z-index层级
   */
  static validateZIndexLayers(): void {
    const elements = [
      { selector: '#topbar', expectedLayer: 'EDITOR.TOPBAR' },
      { selector: '.floating-game-preview', expectedLayer: 'FLOATING.PANELS' },
      { selector: '.lgraphcontextmenu', expectedLayer: 'LITEGRAPH.CONTEXT_MENU' },
    ];

    elements.forEach(({ selector, expectedLayer }) => {
      const element = document.querySelector(selector) as HTMLElement;
      if (element) {
        const computedZIndex = window.getComputedStyle(element).zIndex;
        const expectedZIndex = this.getZIndex(expectedLayer);
        
        if (computedZIndex !== expectedZIndex.toString()) {
          console.warn(`Z-Index验证失败: ${selector} 期望 ${expectedZIndex}, 实际 ${computedZIndex}`);
        } else {
          console.log(`✅ Z-Index验证通过: ${selector} = ${computedZIndex}`);
        }
      }
    });
  }

  /**
   * 修复topbar被覆盖的问题
   */
  static fixTopbarVisibility(): void {
    const topbar = document.getElementById('topbar');
    if (!topbar) return;

    // 强制设置topbar的样式
    topbar.style.zIndex = this.LAYERS.EDITOR.TOPBAR.toString();
    topbar.style.position = 'relative';
    topbar.style.visibility = 'visible';
    topbar.style.opacity = '1';
    topbar.style.display = 'flex';

    // 确保topbar内的所有元素也可见
    const children = topbar.querySelectorAll('*');
    children.forEach((child: Element) => {
      const element = child as HTMLElement;
      element.style.visibility = 'visible';
      element.style.opacity = '1';
    });

    console.log('🔧 Topbar可见性已修复');
  }

  /**
   * 监控topbar状态变化
   */
  static monitorTopbarChanges(): void {
    const topbar = document.getElementById('topbar');
    if (!topbar) return;

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes') {
          const target = mutation.target as HTMLElement;
          const computedStyle = window.getComputedStyle(target);

          // 检查是否被意外隐藏
          if (computedStyle.display === 'none' ||
              computedStyle.visibility === 'hidden' ||
              computedStyle.opacity === '0') {
            console.warn('🔧 Topbar可见性异常，自动修复中...');
            this.fixTopbarVisibility();
          }
        }
      });
    });

    observer.observe(topbar, {
      attributes: true,
      attributeFilter: ['style', 'class'],
      subtree: false // 减少监控范围
    });

    console.log('🔍 Topbar状态监控已启动 (轻量模式)');
  }

  /**
   * 初始化Z-Index管理器
   */
  static initialize(): void {
    // 注入全局样式
    this.injectGlobalStyles();
    
    // 修复topbar可见性
    setTimeout(() => {
      this.fixTopbarVisibility();
      this.validateZIndexLayers();
      this.monitorTopbarChanges();
    }, 100);

    console.log('✅ Z-Index管理器初始化完成');
  }
}
