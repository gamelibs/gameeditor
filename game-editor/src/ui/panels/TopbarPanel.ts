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
        // 获取图表数据
        const graphData = this.editorCore.graph.serialize();
        localStorage.setItem('game-editor-graph', JSON.stringify(graphData));

        // 启动图表执行
        this.editorCore.graph.runStep();
        runBtn.textContent = 'stop';
        this.isRunning = true;

        // 触发代码生成和传输
        this.generateAndTransferCode(graphData);

        this.eventBus.emit('graph:run', { data: graphData });
      } else {
        window.location.reload();
      }
    };
    container.appendChild(runBtn);
  }

  /**
   * 生成代码并传输到build/main.js
   */
  private async generateAndTransferCode(graphData: any) {
    try {
      console.log('🚀 开始代码生成和传输...');

      // 1. 分析图表数据，提取PixiAppNode
      const pixiAppNodes = this.findPixiAppNodes(graphData);
      if (pixiAppNodes.length === 0) {
        console.warn('⚠️ 未找到PixiAppNode，无法生成代码');
        return;
      }

      // 2. 收集所有连接的节点数据
      const gameData = this.collectGameData(graphData, pixiAppNodes[0]);

      // 3. 生成代码
      const generatedCode = this.generateMainJs(gameData);

      // 4. 传输到build/main.js
      await this.transferCodeToBuild(generatedCode);

      console.log('✅ 代码生成和传输完成');

      // 5. 通知UI更新
      this.eventBus.emit('code:generated', { gameData, code: generatedCode });

    } catch (error) {
      console.error('❌ 代码生成失败:', error);
    }
  }

  /**
   * 查找PixiAppNode
   */
  private findPixiAppNodes(graphData: any): any[] {
    if (!graphData.nodes) return [];

    return graphData.nodes.filter((node: any) =>
      node.type === 'scene/PixiApp' || node.title?.includes('Pixi App')
    );
  }

  /**
   * 收集游戏数据
   */
  private collectGameData(graphData: any, pixiAppNode: any): any {
    const gameData = {
      config: {
        width: pixiAppNode.properties?.width || 750,
        height: pixiAppNode.properties?.height || 1334,
        background: pixiAppNode.properties?.background || '#1a1a1a',
        title: pixiAppNode.properties?.title || 'My Game'
      },
      children: [] as any[],
      timestamp: Date.now()
    };

    // 查找连接到PixiAppNode的子节点
    if (graphData.links) {
      const connectedLinks = graphData.links.filter((link: any) =>
        link.target_id === pixiAppNode.id && link.target_slot === 0
      );

      connectedLinks.forEach((link: any) => {
        const sourceNode = graphData.nodes.find((node: any) => node.id === link.origin_id);
        if (sourceNode) {
          gameData.children.push(this.serializeNode(sourceNode));
        }
      });
    }

    return gameData;
  }

  /**
   * 序列化节点数据
   */
  private serializeNode(node: any): any {
    const serialized: any = {
      type: node.type,
      title: node.title,
      properties: node.properties || {},
      x: node.pos?.[0] || 0,
      y: node.pos?.[1] || 0
    };

    // 根据节点类型添加特殊处理
    if (node.type === 'render/text') {
      serialized.nodeType = 'text';
      serialized.text = node.properties?.text || 'Hello World';
      serialized.style = {
        fontSize: node.properties?.fontSize || 48,
        fill: node.properties?.textColor || '#FFFFFF',
        fontFamily: node.properties?.fontFamily || 'Arial'
      };
    }

    return serialized;
  }

  /**
   * 生成main.js代码
   */
  private generateMainJs(gameData: any): string {
    return `// 自动生成的游戏代码 - main.js
// 生成时间: ${new Date().toLocaleString()}

// 游戏数据
const gameData = ${JSON.stringify(gameData, null, 2)};

// 主函数
async function main() {
    console.log('🎮 游戏启动中...', gameData);

    try {
        // 初始化游戏核心
        await window.gameCore.init();

        // 初始化游戏逻辑
        await window.gameLogic.init();

        console.log('✅ 游戏启动完成');
    } catch (error) {
        console.error('❌ 游戏启动失败:', error);
    }
}

// 页面加载完成后启动游戏
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', main);
} else {
    main();
}

// 导出游戏数据供其他模块使用
window.gameData = gameData;
`;
  }

  /**
   * 传输代码到build目录
   */
  private async transferCodeToBuild(code: string): Promise<void> {
    try {
      // 这里应该调用后端API来写入文件
      // 暂时使用localStorage模拟
      localStorage.setItem('generated-main-js', code);

      console.log('📝 代码已保存到localStorage (模拟build/main.js)');

      // TODO: 实现真实的文件写入
      // await fetch('/api/write-file', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     path: 'build/main.js',
      //     content: code
      //   })
      // });

    } catch (error) {
      console.error('❌ 代码传输失败:', error);
      throw error;
    }
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
