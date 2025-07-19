import { LGraph, LGraphNode } from 'litegraph.js';
import { ThreeTabCodeGenerator } from './ThreeTabCodeGenerator';

/**
 * 三面板UI管理器
 * 管理节点编辑器、游戏预览和代码预览三个面板
 */
export class ThreePanelUI {
  private graph: LGraph;
  private codeGenerator: ThreeTabCodeGenerator;
  
  // 面板元素
  private nodePanel!: HTMLElement;
  private gamePanel!: HTMLElement;
  private codePanel!: HTMLElement;
  
  // 分割条元素
  private splitter1!: HTMLElement;
  private splitter2!: HTMLElement;
  
  // 分割条拖拽状态
  private isDragging = false;
  private currentSplitter: HTMLElement | null = null;
  private startX = 0;
  private startWidths: number[] = [];
  
  // 图形变化监听
  private lastNodeCount = 0;

  constructor(graph: LGraph) {
    this.graph = graph;
    this.codeGenerator = new ThreeTabCodeGenerator(graph);
    this.initializeElements();
    this.setupEventListeners();
    this.setupPanelResizing();
    this.startRealtimeUpdates();
  }

  private initializeElements() {
    // 获取面板元素
    this.nodePanel = document.getElementById('node-editor-panel')!;
    this.gamePanel = document.getElementById('game-preview-panel')!;
    this.codePanel = document.getElementById('code-preview-panel')!;
    
    // 获取分割条元素
    this.splitter1 = document.getElementById('splitter1')!;
    this.splitter2 = document.getElementById('splitter2')!;
    
    // 游戏预览现在使用iframe，不需要canvas
    // this.gamePreviewCanvas = document.getElementById('gamePreviewCanvas') as HTMLCanvasElement;
    
    console.log('✅ ThreePanelUI 元素初始化完成');
    
    // 在游戏预览区域添加信息显示
    this.addGameInfoDisplay();
  }

  private addGameInfoDisplay() {
    const gameContent = this.gamePanel.querySelector('.game-preview-content');
    if (!gameContent) return;

    // 创建游戏信息显示区域
    const gameInfo = document.createElement('div');
    gameInfo.className = 'game-info';
    gameInfo.innerHTML = `
      <div class="design-size">设计尺寸: 750 × 1334</div>
      <div class="scale-info" id="scaleInfo">缩放比例: 1:1</div>
      <div class="device-info">适配设备: iPhone 6/7/8 Plus</div>
    `;
    
    gameContent.appendChild(gameInfo);
  }

  private setupEventListeners() {
    // 面板控制按钮事件
    this.setupPanelButtons();
    
    // 代码标签页切换
    this.setupCodeTabs();
    
    // 浮动侧边栏事件
    this.setupFloatingSidebar();
    
    // 窗口大小变化
    window.addEventListener('resize', () => {
      this.resizeGameCanvas();
    });
    
    // 图形变化监听 - 使用正确的事件方法
    if ('onNodeAdded' in this.graph) {
      (this.graph as any).onNodeAdded = (node: LGraphNode) => {
        this.onGraphChanged('nodeAdded', node);
      };
    }
    
    if ('onNodeRemoved' in this.graph) {
      (this.graph as any).onNodeRemoved = (node: LGraphNode) => {
        this.onGraphChanged('nodeRemoved', node);
      };
    }
    
    if ('onConnectionChange' in this.graph) {
      (this.graph as any).onConnectionChange = () => {
        this.onGraphChanged('connectionChanged');
      };
    }
    
    // 设置实时图形变化监听
    this.setupRealTimeGraphMonitoring();
  }

  private setupRealTimeGraphMonitoring() {
    // 监听图形的实时变化
    const checkGraphChanges = () => {
      const currentNodes = (this.graph as any)._nodes || [];
      const currentNodeCount = currentNodes.length;
      
      // 检查节点数量变化
      if (this.lastNodeCount !== currentNodeCount) {
        console.log(`📊 实时检测到节点数量变化: ${this.lastNodeCount} → ${currentNodeCount}`);
        this.lastNodeCount = currentNodeCount;
        this.onGraphChanged('nodeCountChanged');
      }
    };

    // 每500毫秒检查一次图形变化，确保实时同步
    setInterval(checkGraphChanges, 500);
    
    // 初始化节点计数
    this.lastNodeCount = ((this.graph as any)._nodes || []).length;
    
    // 立即更新一次代码显示
    setTimeout(() => {
      this.updateGeneratedCode();
    }, 100);
  }

  private setupFloatingSidebar() {
    const sidebarContent = document.getElementById('sidebarContent');
    const closeSidebar = document.getElementById('closeSidebar');
    const openNodesBtn = document.getElementById('openNodesBtn');

    if (sidebarContent) {
      // 关闭按钮点击
      closeSidebar?.addEventListener('click', () => {
        sidebarContent.classList.remove('open');
      });

      // 节点库按钮点击
      openNodesBtn?.addEventListener('click', () => {
        sidebarContent.classList.add('open');
      });

      // 点击外部区域关闭
      document.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const isInSidebar = target.closest('.floating-sidebar');
        const isOpenButton = target.closest('#openNodesBtn');
        
        if (!isInSidebar && !isOpenButton && sidebarContent.classList.contains('open')) {
          sidebarContent.classList.remove('open');
        }
      });
    }
  }

  private setupPanelButtons() {
    // 节点编辑器控制按钮
    document.getElementById('runGameBtn')?.addEventListener('click', () => {
      this.runGame();
    });
    
    document.getElementById('pauseGameBtn')?.addEventListener('click', () => {
      this.pauseGame();
    });
    
    document.getElementById('resetGameBtn')?.addEventListener('click', () => {
      this.resetGame();
    });
    
    // 游戏预览控制按钮
    document.getElementById('openInNewWindowBtn')?.addEventListener('click', () => {
      this.openGameInNewWindow();
    });
    
    document.getElementById('fullscreenBtn')?.addEventListener('click', () => {
      this.toggleFullscreen();
    });
    
    document.getElementById('refreshPreviewBtn')?.addEventListener('click', () => {
      this.refreshGamePreview();
    });
    
    // 代码预览控制按钮
    document.getElementById('openCodeInNewWindowBtn')?.addEventListener('click', () => {
      this.openCodeInNewWindow();
    });
    
    document.getElementById('copyCodeBtn')?.addEventListener('click', () => {
      this.copyGeneratedCode();
    });
    
    document.getElementById('downloadCodeBtn')?.addEventListener('click', () => {
      this.downloadGeneratedCode();
    });
    
    // 顶部恢复按钮
    document.getElementById('restoreGamePreviewBtn')?.addEventListener('click', () => {
      this.restoreGamePreview();
    });
    
    document.getElementById('restoreCodePreviewBtn')?.addEventListener('click', () => {
      this.restoreCodePreview();
    });
    
    document.getElementById('restoreAllPanelsBtn')?.addEventListener('click', () => {
      this.restoreAllPanels();
    });
  }

  private setupCodeTabs() {
    const tabs = document.querySelectorAll('.code-tab');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetTab = tab.getAttribute('data-tab');
        
        // 移除所有活动状态
        tabs.forEach(t => t.classList.remove('active'));
        tabPanes.forEach(pane => pane.classList.remove('active'));
        
        // 激活当前标签
        tab.classList.add('active');
        
        // 激活对应的标签页内容
        const targetElement = document.getElementById(`${targetTab}-tab`);
        
        if (targetElement) {
          targetElement.classList.add('active');
          
          // 根据标签类型更新对应的代码显示
          if (targetTab) {
            this.updateCodeDisplay(targetTab);
          }
        }
      });
    });
  }

  private setupPanelResizing() {
    // 分割条1的拖拽
    this.splitter1.addEventListener('mousedown', (e) => {
      this.startDrag(e, this.splitter1);
    });
    
    // 分割条2的拖拽
    this.splitter2.addEventListener('mousedown', (e) => {
      this.startDrag(e, this.splitter2);
    });
    
    // 全局鼠标事件
    document.addEventListener('mousemove', (e) => {
      this.onDrag(e);
    });
    
    document.addEventListener('mouseup', () => {
      this.endDrag();
    });
  }

  private startDrag(e: MouseEvent, splitter: HTMLElement) {
    this.isDragging = true;
    this.currentSplitter = splitter;
    this.startX = e.clientX;
    
    // 记录当前面板宽度
    const nodeWidth = this.nodePanel.getBoundingClientRect().width;
    const gameWidth = this.gamePanel.getBoundingClientRect().width;
    const codeWidth = this.codePanel.getBoundingClientRect().width;
    
    this.startWidths = [nodeWidth, gameWidth, codeWidth];
    
    // 添加拖拽样式
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    
    e.preventDefault();
  }

  private onDrag(e: MouseEvent) {
    if (!this.isDragging || !this.currentSplitter) return;
    
    const deltaX = e.clientX - this.startX;
    const mainContent = document.getElementById('main-content')!;
    const totalWidth = mainContent.getBoundingClientRect().width - 8; // 减去分割条宽度
    
    if (this.currentSplitter === this.splitter1) {
      // 调整节点编辑器和游戏预览的宽度
      const newNodeWidth = Math.max(300, this.startWidths[0] + deltaX);
      const newGameWidth = Math.max(250, this.startWidths[1] - deltaX);
      
      const nodePercent = (newNodeWidth / totalWidth) * 100;
      const gamePercent = (newGameWidth / totalWidth) * 100;
      const codePercent = (this.startWidths[2] / totalWidth) * 100;
      
      this.nodePanel.style.flex = `0 0 ${nodePercent}%`;
      this.gamePanel.style.flex = `0 0 ${gamePercent}%`;
      this.codePanel.style.flex = `0 0 ${codePercent}%`;
      
    } else if (this.currentSplitter === this.splitter2) {
      // 调整游戏预览和代码预览的宽度
      const newGameWidth = Math.max(250, this.startWidths[1] + deltaX);
      const newCodeWidth = Math.max(300, this.startWidths[2] - deltaX);
      
      const nodePercent = (this.startWidths[0] / totalWidth) * 100;
      const gamePercent = (newGameWidth / totalWidth) * 100;
      const codePercent = (newCodeWidth / totalWidth) * 100;
      
      this.nodePanel.style.flex = `0 0 ${nodePercent}%`;
      this.gamePanel.style.flex = `0 0 ${gamePercent}%`;
      this.codePanel.style.flex = `0 0 ${codePercent}%`;
    }
    
    // 更新游戏画布大小
    this.resizeGameCanvas();
  }

  private endDrag() {
    this.isDragging = false;
    this.currentSplitter = null;
    
    // 移除拖拽样式
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }

  private resizeGameCanvas() {
    const container = this.gamePanel.querySelector('.game-preview-content') as HTMLElement;
    if (!container) return;
    
    const iframe = document.getElementById('gamePreviewFrame') as HTMLIFrameElement;
    if (!iframe) return;
    
    const rect = container.getBoundingClientRect();
    const maxWidth = rect.width - 20; // 留出边距
    const maxHeight = rect.height - 80; // 为游戏信息留出空间
    
    // 移动端游戏常用设计尺寸
    const designWidth = 750;  // 设计宽度
    const designHeight = 1334; // 设计高度 (iPhone 6/7/8 Plus)
    const aspectRatio = designHeight / designWidth; // 约1.78 (接近16:9)
    
    // 根据容器大小计算最适合的显示尺寸
    let iframeWidth = Math.min(maxWidth, 375); // 限制最大宽度为375px，便于预览
    let iframeHeight = iframeWidth * aspectRatio;
    
    // 如果高度超出容器，则按高度调整
    if (iframeHeight > maxHeight) {
      iframeHeight = maxHeight;
      iframeWidth = iframeHeight / aspectRatio;
    }
    
    // 更新iframe尺寸
    iframe.style.width = `${iframeWidth}px`;
    iframe.style.height = `${iframeHeight}px`;
    
    // 更新缩放信息
    this.updateScaleInfo();
  }

  private onGraphChanged(eventType: string, node?: LGraphNode) {
    console.log(`📊 图形变化: ${eventType}`, node?.title || '');
    
    // 更新调试信息
    this.updateDebugInfo(eventType, node);
    
    // 重新生成代码
    this.updateGeneratedCode();
    
    // 更新游戏预览
    this.updateGamePreview();
  }

  private updateDebugInfo(eventType: string, node?: LGraphNode) {
    const debugElement = document.getElementById('nodeExecutionStatus');
    if (!debugElement) return;
    
    const timestamp = new Date().toLocaleTimeString();
    const nodeInfo = node ? `节点: ${node.title} (${node.type})` : '图形结构';
    
    const debugEntry = document.createElement('div');
    debugEntry.className = 'debug-entry';
    debugEntry.innerHTML = `
      <span class="debug-time">[${timestamp}]</span>
      <span class="debug-event">${eventType}</span>
      <span class="debug-node">${nodeInfo}</span>
    `;
    
    debugElement.insertBefore(debugEntry, debugElement.firstChild);
    
    // 限制调试条目数量
    const entries = debugElement.children;
    if (entries.length > 50) {
      debugElement.removeChild(entries[entries.length - 1]);
    }
  }

  private updateGeneratedCode() {
    // 更新所有代码显示
    this.updateCodeDisplay('game-logic');
    this.updateCodeDisplay('runtime');
    this.updateCodeDisplay('index-html');
  }

  private updateCodeDisplay(tabType: string) {
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
        // 异步加载真实的build/index.html内容
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
      // 对于带语法高亮的代码，使用innerHTML；否则使用textContent
      if (code.includes('<span class=')) {
        codeDisplay.innerHTML = code;
      } else {
        codeDisplay.textContent = code;
      }
    }
  }

  /**
   * 异步加载真实的build/index.html内容并显示
   */
  private async loadRealIndexHtml() {
    const elementId = 'indexHtmlDisplay';
    const codeDisplay = document.getElementById(elementId);
    
    if (!codeDisplay) return;
    
    // 先显示加载状态
    codeDisplay.innerHTML = `<div style="padding: 20px; color: #666; text-align: center;">
      📄 正在读取 build/index.html 内容...
    </div>`;
    
    try {
      // 使用代码生成器的异步方法
      const realContent = await this.codeGenerator.loadRealIndexHtml();
      codeDisplay.textContent = realContent;
      console.log('✅ 成功加载 build/index.html 内容到代码预览');
    } catch (error) {
      console.error('❌ 加载 build/index.html 失败:', error);
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      codeDisplay.innerHTML = `<div style="padding: 20px; color: #e74c3c; text-align: center;">
        ❌ 无法读取 build/index.html<br><br>
        错误信息: ${errorMessage}
      </div>`;
    }
  }

  private updateGamePreview() {
    // 更新iframe预览
    const iframe = document.getElementById('gamePreviewFrame') as HTMLIFrameElement;
    const loadingIndicator = document.getElementById('gameLoadingIndicator');
    
    if (iframe && loadingIndicator) {
      // 显示加载状态
      loadingIndicator.style.display = 'flex';
      iframe.style.opacity = '0.3';
      
      // 刷新iframe
      iframe.src = iframe.src;
      
      // 监听iframe加载完成
      iframe.onload = () => {
        loadingIndicator.style.display = 'none';
        iframe.style.opacity = '1';
        this.updateScaleInfo();
      };
    }
  }

  private renderGamePreview() {
    // 现在使用iframe预览，这个方法保留用于兼容性
    this.updateGamePreview();
  }

  private startRealtimeUpdates() {
    // 每秒更新一次实时信息
    setInterval(() => {
      this.updateRealtimeInfo();
    }, 1000);
  }

  private updateRealtimeInfo() {
    // 更新控制台输出
    const consoleOutput = document.getElementById('consoleOutput');
    if (consoleOutput) {
      const timestamp = new Date().toLocaleTimeString();
      const nodeCount = (this.graph as any)._nodes ? (this.graph as any)._nodes.length : 0;
      const connectionCount = this.graph.links ? Object.keys(this.graph.links).length : 0;
      
      consoleOutput.textContent += `[${timestamp}] 系统状态: ${nodeCount} 个节点, ${connectionCount} 个连接\n`;
      
      // 自动滚动到底部
      consoleOutput.scrollTop = consoleOutput.scrollHeight;
    }
  }

  // 面板控制方法
  private runGame() {
    console.log('🎮 运行游戏');
    this.updateGamePreview();
  }

  private pauseGame() {
    console.log('⏸️ 暂停游戏');
  }

  private resetGame() {
    console.log('🔄 重置游戏');
    this.renderGamePreview();
  }

  private toggleFullscreen() {
    const gameContent = this.gamePanel.querySelector('.game-preview-content') as HTMLElement;
    if (gameContent) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        gameContent.requestFullscreen();
      }
    }
  }

  private openGameInNewWindow() {
    console.log('🪟 在新窗口打开游戏');
    const gameUrl = '/build/index.html';
    const newWindow = window.open(gameUrl, '_blank', 'width=750,height=1334,scrollbars=no,resizable=yes');
    if (newWindow) {
      newWindow.focus();
      // 隐藏游戏预览面板，让节点编辑器占据更多空间
      this.hideGamePreview();
    } else {
      this.showMessage('无法打开新窗口，请检查浏览器弹窗设置', 'error');
    }
  }

  private openCodeInNewWindow() {
    console.log('🪟 在新窗口打开代码预览');
    const codeUrl = '/code-preview.html';
    const newWindow = window.open(codeUrl, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
    if (newWindow) {
      newWindow.focus();
      // 隐藏代码预览面板，让节点编辑器占据更多空间
      this.hideCodePreview();
    } else {
      this.showMessage('无法打开新窗口，请检查浏览器弹窗设置', 'error');
    }
  }

  private hideGamePreview() {
    const gamePanel = document.getElementById('game-preview-panel');
    const splitter1 = document.getElementById('splitter1');
    
    if (gamePanel && splitter1) {
      gamePanel.classList.add('hidden');
      splitter1.classList.add('hidden');
      
      // 让节点编辑器占据更多空间
      const nodePanel = document.getElementById('node-editor-panel');
      if (nodePanel) {
        nodePanel.classList.add('fullscreen');
      }
      
      // 显示顶部恢复按钮
      this.showTopControls();
      
      console.log('🎯 游戏预览面板已隐藏');
    }
  }

  private hideCodePreview() {
    const codePanel = document.getElementById('code-preview-panel');
    const splitter2 = document.getElementById('splitter2');
    
    if (codePanel && splitter2) {
      codePanel.classList.add('hidden');
      splitter2.classList.add('hidden');
      
      // 让节点编辑器占据更多空间
      const nodePanel = document.getElementById('node-editor-panel');
      if (nodePanel) {
        nodePanel.classList.add('fullscreen');
      }
      
      // 显示顶部恢复按钮
      this.showTopControls();
      
      console.log('📄 代码预览面板已隐藏');
    }
  }

  private showTopControls() {
    const topControls = document.getElementById('top-panel-controls');
    if (topControls) {
      topControls.style.display = 'block';
    }
  }

  private hideTopControls() {
    const topControls = document.getElementById('top-panel-controls');
    if (topControls) {
      topControls.style.display = 'none';
    }
  }

  private restoreGamePreview() {
    const gamePanel = document.getElementById('game-preview-panel');
    const splitter1 = document.getElementById('splitter1');
    
    if (gamePanel && splitter1) {
      gamePanel.classList.remove('hidden');
      splitter1.classList.remove('hidden');
      
      // 恢复节点编辑器尺寸
      const nodePanel = document.getElementById('node-editor-panel');
      if (nodePanel) {
        nodePanel.classList.remove('fullscreen');
      }
      
      // 检查是否还有其他隐藏的面板
      this.checkTopControlsVisibility();
      
      console.log('🎯 游戏预览面板已恢复');
    }
  }

  private restoreCodePreview() {
    const codePanel = document.getElementById('code-preview-panel');
    const splitter2 = document.getElementById('splitter2');
    
    if (codePanel && splitter2) {
      codePanel.classList.remove('hidden');
      splitter2.classList.remove('hidden');
      
      // 恢复节点编辑器尺寸
      const nodePanel = document.getElementById('node-editor-panel');
      if (nodePanel) {
        nodePanel.classList.remove('fullscreen');
      }
      
      // 检查是否还有其他隐藏的面板
      this.checkTopControlsVisibility();
      
      console.log('📄 代码预览面板已恢复');
    }
  }

  private restoreAllPanels() {
    this.restoreGamePreview();
    this.restoreCodePreview();
    this.hideTopControls();
    console.log('🔄 所有面板已恢复');
  }

  private checkTopControlsVisibility() {
    const gamePanel = document.getElementById('game-preview-panel');
    const codePanel = document.getElementById('code-preview-panel');
    
    const gameHidden = gamePanel?.classList.contains('hidden');
    const codeHidden = codePanel?.classList.contains('hidden');
    
    if (gameHidden || codeHidden) {
      this.showTopControls();
    } else {
      this.hideTopControls();
    }
  }

  private updateScaleInfo() {
    const iframe = document.getElementById('gamePreviewFrame') as HTMLIFrameElement;
    const scaleRatioElement = document.getElementById('scaleRatio');
    
    if (iframe && scaleRatioElement) {
      const container = this.gamePanel.querySelector('.game-preview-content') as HTMLElement;
      if (container) {
        const containerRect = container.getBoundingClientRect();
        const designWidth = 750;
        const designHeight = 1334;
        const currentWidth = 375; // iframe当前宽度
        const currentHeight = 667; // iframe当前高度
        
        const scaleX = currentWidth / designWidth;
        const scaleY = currentHeight / designHeight;
        const scale = Math.min(scaleX, scaleY);
        
        scaleRatioElement.textContent = scale.toFixed(2);
      }
    }
  }

  private refreshGamePreview() {
    console.log('🔄 刷新游戏预览');
    this.updateGamePreview();
  }

  private copyGeneratedCode() {
    const codeDisplay = document.getElementById('generatedCodeDisplay');
    if (codeDisplay) {
      navigator.clipboard.writeText(codeDisplay.textContent || '').then(() => {
        console.log('📋 代码已复制到剪贴板');
        this.showMessage('代码已复制到剪贴板', 'success');
      });
    }
  }

  private downloadGeneratedCode() {
    // 创建包含所有文件的ZIP下载
    const gameLogic = this.codeGenerator.generateGameLogic();
    const indexHtml = this.codeGenerator.generateIndexHtml();
    const runtime = this.codeGenerator.generateRuntimeEngine();
    
    // 创建一个包含所有文件内容的文本
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
    a.download = 'hello-world-game-files.txt';
    a.click();
    
    URL.revokeObjectURL(url);
    console.log('💾 游戏文件已下载');
    this.showMessage('游戏文件已下载', 'success');
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
    
    setTimeout(() => {
      messageDiv.remove();
    }, 3000);
  }
}
