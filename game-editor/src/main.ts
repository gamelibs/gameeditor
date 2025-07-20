import { EditorCore } from './core/EditorCore';
import { EventBus } from './core/EventBus';
import { UIManager } from './ui/UIManager';
import { ZIndexManager } from './utils/ZIndexManager';
import 'litegraph.js/css/litegraph.css';

/**
 * 主应用程序入口
 * 负责基础样式设置、核心模块初始化和整合
 * 具体的UI功能由UIManager管理
 */

// 应用基础样式设置
function setupBaseStyles() {
  // 设置基础CSS变量和样式
  document.documentElement.style.setProperty('--editor-bg', '#1a1a1a');
  document.documentElement.style.setProperty('--panel-bg', '#2d2d2d');
  document.documentElement.style.setProperty('--border-color', '#444');
  document.documentElement.style.setProperty('--text-color', '#ffffff');

  // 确保body样式
  document.body.style.margin = '0';
  document.body.style.padding = '0';
  document.body.style.fontFamily = 'Arial, sans-serif';
  document.body.style.backgroundColor = 'var(--editor-bg)';
  document.body.style.color = 'var(--text-color)';
  document.body.style.overflow = 'hidden';

  // 添加稳定的布局框架样式
  const style = document.createElement('style');
  style.textContent = `
    /* 最基本的样式 - 不干扰LiteGraph */
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: #1a1a1a;
      display: flex;
      flex-direction: column;
    }

    #topbar {
      flex-shrink: 0;
    }

    #app-container {
      flex: 1;
      width: 100%;
      background: #1a1a1a;
    }


  `;
  document.head.appendChild(style);
}

// 检查必要的DOM元素
function validateDOMElements() {
  const requiredElements = ['topbar', 'app-container'];
  const missingElements = [];

  for (const elementId of requiredElements) {
    if (!document.getElementById(elementId)) {
      missingElements.push(elementId);
    }
  }

  if (missingElements.length > 0) {
    throw new Error(`缺少必要的DOM元素: ${missingElements.join(', ')}`);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    console.log('🚀 开始初始化游戏编辑器...');

    // 1. 初始化Z-Index管理器
    ZIndexManager.initialize();
    console.log('✅ Z-Index管理器初始化完成');

    // 2. 设置基础样式
    setupBaseStyles();
    console.log('✅ 基础样式设置完成');

    // 3. 验证DOM结构
    validateDOMElements();
    console.log('✅ DOM结构验证完成');

    // 4. 初始化全局事件总线
    const eventBus = new EventBus();
    console.log('✅ 事件总线初始化完成');

    // 5. 初始化UI管理器（创建编辑器容器）
    const uiManager = new UIManager(eventBus);
    await uiManager.initialize();
    console.log('✅ UI管理器初始化完成');

    // 6. 初始化LiteGraph编辑器核心
    const editorCore = new EditorCore(eventBus);
    console.log('✅ LiteGraph编辑器核心初始化完成');

    // 7. 连接编辑器核心与UI管理器
    uiManager.connectEditorCore(editorCore);
    console.log('✅ 编辑器核心与UI连接完成');

    // 8. 启动应用程序
    await startApplication(eventBus, editorCore, uiManager);

    console.log('🎉 游戏编辑器启动完成！');

    // 添加topbar监控器
    setupTopbarMonitor();

    // 最终验证z-index层级
    setTimeout(() => {
      ZIndexManager.validateZIndexLayers();
      ZIndexManager.fixTopbarVisibility();
    }, 1000);

    // 暴露到全局供调试使用
    (window as any).editor = {
      eventBus,
      editorCore,
      uiManager,
      ZIndexManager
    };

  } catch (error) {
    console.error('❌ 编辑器初始化失败:', error);

    // 显示用户友好的错误信息
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #ff4444;
      color: white;
      padding: 20px;
      border-radius: 8px;
      font-family: Arial, sans-serif;
      z-index: 10000;
      max-width: 400px;
      text-align: center;
    `;
    errorDiv.innerHTML = `
      <h3>编辑器初始化失败</h3>
      <p>${errorMessage}</p>
      <button onclick="location.reload()" style="
        background: white;
        color: #ff4444;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        margin-top: 10px;
      ">刷新页面重试</button>
    `;
    document.body.appendChild(errorDiv);
  }
});

/**
 * 设置topbar监控器 - 检测topbar被意外修改
 */
function setupTopbarMonitor() {
  const topbar = document.getElementById('topbar');
  if (!topbar) {
    console.error('❌ Topbar元素不存在，无法设置监控器');
    return;
  }

  // 使用MutationObserver监控topbar的变化
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes') {
        const target = mutation.target as HTMLElement;
        const computedStyle = window.getComputedStyle(target);

        // 检查关键样式属性
        if (computedStyle.display === 'none' ||
            computedStyle.visibility === 'hidden' ||
            computedStyle.opacity === '0') {
          console.error('🚨 Topbar被隐藏!', {
            attributeName: mutation.attributeName,
            oldValue: mutation.oldValue,
            newValue: target.getAttribute(mutation.attributeName || ''),
            display: computedStyle.display,
            visibility: computedStyle.visibility,
            opacity: computedStyle.opacity,
            stackTrace: new Error().stack
          });
        }
      }

      if (mutation.type === 'childList' && mutation.removedNodes.length > 0) {
        console.warn('🚨 Topbar子元素被移除!', {
          removedNodes: Array.from(mutation.removedNodes).map(n => n.nodeName),
          stackTrace: new Error().stack
        });
      }
    });
  });

  // 监控属性和子元素变化
  observer.observe(topbar, {
    attributes: true,
    attributeOldValue: true,
    childList: true,
    subtree: true
  });

  console.log('🔍 Topbar监控器已启动');
}

/**
 * 启动应用程序
 * 设置全局事件监听和应用程序生命周期管理
 */
async function startApplication(eventBus: EventBus, editorCore: EditorCore | null, uiManager: UIManager) {
  // 启动实时更新
  setInterval(() => {
    eventBus.emit('realtime:update');
  }, 1000);

  // 设置全局错误处理
  window.addEventListener('error', (event) => {
    console.error('全局错误:', event.error);
    eventBus.emit('app:error', { error: event.error, message: event.message });
  });

  // 设置窗口大小变化监听
  window.addEventListener('resize', () => {
    eventBus.emit('app:resize');
  });

  // 应用程序准备就绪
  eventBus.emit('app:ready', { editorCore, uiManager });
}