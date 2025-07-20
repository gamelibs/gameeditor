import { EventBus } from '../../core/EventBus';
import { EditorCore } from '../../core/EditorCore';
import { LiteGraph } from 'litegraph.js';

/**
 * 节点库面板 - 浮动的节点选择面板
 * 独立组件，不影响LiteGraph编辑器功能
 */
export class NodeLibraryPanel {
  private eventBus: EventBus;
  private editorCore: EditorCore | null = null;
  private isInitialized = false;
  private panelElement: HTMLElement | null = null;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // 1. 注入样式
    this.injectStyles();
    
    // 2. 创建节点库面板
    this.createNodeLibraryPanel();
    
    // 3. 设置事件监听
    this.setupEventListeners();
    
    this.isInitialized = true;
  }

  /**
   * 注入样式
   */
  private injectStyles() {
    if (document.getElementById('node-library-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'node-library-styles';
    style.textContent = `
      /* 节点库面板 - 独立样式，不影响LiteGraph */
      .node-library-panel {
        position: fixed;
        top: 80px;
        left: -320px;
        width: 300px;
        height: calc(100vh - 100px);
        background: rgba(45, 45, 45, 0.98);
        border: 1px solid #444;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(15px);
        z-index: 800;
        transition: left 0.3s ease;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .node-library-panel.open {
        left: 10px;
      }

      .node-library-header {
        padding: 15px;
        border-bottom: 1px solid #555;
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: rgba(0, 0, 0, 0.3);
      }

      .node-library-title {
        color: #4ECDC4;
        font-size: 16px;
        font-weight: 600;
        margin: 0;
      }

      .node-library-close {
        background: none;
        border: none;
        color: #999;
        font-size: 18px;
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        transition: all 0.2s ease;
      }

      .node-library-close:hover {
        color: #4ECDC4;
        background: rgba(255, 255, 255, 0.1);
      }

      .node-library-body {
        flex: 1;
        overflow-y: auto;
        padding: 10px;
      }

      .node-category {
        margin-bottom: 15px;
      }

      .category-title {
        color: #4ECDC4;
        font-size: 14px;
        font-weight: 600;
        margin-bottom: 8px;
        padding: 5px 0;
        border-bottom: 1px solid #555;
      }

      .node-list {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .node-item {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid #555;
        border-radius: 4px;
        padding: 8px 10px;
        cursor: pointer;
        transition: all 0.2s ease;
        color: #ffffff;
      }

      .node-item:hover {
        background: rgba(78, 205, 196, 0.2);
        border-color: #4ECDC4;
        transform: translateX(2px);
      }

      .node-item-title {
        font-size: 13px;
        font-weight: 500;
        margin-bottom: 2px;
      }

      .node-item-desc {
        font-size: 11px;
        color: #999;
        line-height: 1.3;
      }

      /* 节点分类颜色标识 */
      .node-item.render-node {
        border-left: 3px solid #B36B09;
      }

      .node-item.container-node {
        border-left: 3px solid #23527C;
      }

      .node-item.resource-node {
        border-left: 3px solid #357A38;
      }

      .node-item.scene-node {
        border-left: 3px solid #23527C;
      }

      .node-item.event-node {
        border-left: 3px solid #4B266A;
      }

      .node-item.tool-node {
        border-left: 3px solid #7C2323;
      }

      /* 响应式设计 */
      @media (max-width: 768px) {
        .node-library-panel {
          top: 120px;
          left: -100%;
          right: 10px;
          width: auto;
          height: calc(100vh - 140px);
        }

        .node-library-panel.open {
          left: 10px;
        }
      }
    `;
    
    document.head.appendChild(style);
  }

  /**
   * 创建节点库面板
   */
  private createNodeLibraryPanel() {
    // 创建面板容器
    const panel = document.createElement('div');
    panel.className = 'node-library-panel';
    panel.id = 'node-library-panel';

    // 创建头部
    const header = document.createElement('div');
    header.className = 'node-library-header';
    
    const title = document.createElement('h3');
    title.className = 'node-library-title';
    title.textContent = '📚 节点库';
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'node-library-close';
    closeBtn.innerHTML = '×';
    closeBtn.onclick = () => this.hide();
    
    header.appendChild(title);
    header.appendChild(closeBtn);

    // 创建主体
    const body = document.createElement('div');
    body.className = 'node-library-body';
    body.id = 'node-library-body';

    panel.appendChild(header);
    panel.appendChild(body);

    // 添加到页面
    document.body.appendChild(panel);
    
    this.panelElement = panel;
    
    // 填充节点列表
    this.populateNodeList();
  }

  /**
   * 填充节点列表
   */
  private populateNodeList() {
    const body = document.getElementById('node-library-body');
    if (!body) return;

    // 获取所有已注册的节点类型
    const nodeTypes = this.getRegisteredNodeTypes();
    
    if (nodeTypes.length === 0) {
      body.innerHTML = `
        <div style="text-align: center; padding: 20px; color: #999;">
          <p>💡 提示：在画布上右键可以添加节点</p>
          <p>🎮 LiteGraph编辑器已启用</p>
          <p>📚 节点将在注册后显示在这里</p>
        </div>
      `;
      return;
    }
    
    // 按分类组织节点
    const categories = this.organizeNodesByCategory(nodeTypes);
    
    // 清空现有内容
    body.innerHTML = '';
    
    // 渲染分类和节点
    Object.entries(categories).forEach(([categoryName, nodes]) => {
      const categoryDiv = document.createElement('div');
      categoryDiv.className = 'node-category';
      
      const categoryTitle = document.createElement('div');
      categoryTitle.className = 'category-title';
      categoryTitle.textContent = categoryName;
      
      const nodeList = document.createElement('div');
      nodeList.className = 'node-list';
      
      nodes.forEach(nodeInfo => {
        const nodeItem = document.createElement('div');
        nodeItem.className = `node-item ${this.getNodeCategoryClass(nodeInfo.type)}`;
        
        const nodeTitle = document.createElement('div');
        nodeTitle.className = 'node-item-title';
        nodeTitle.textContent = nodeInfo.title;
        
        nodeItem.appendChild(nodeTitle);
        
        if (nodeInfo.desc) {
          const nodeDesc = document.createElement('div');
          nodeDesc.className = 'node-item-desc';
          nodeDesc.textContent = nodeInfo.desc;
          nodeItem.appendChild(nodeDesc);
        }
        
        // 点击添加节点
        nodeItem.onclick = () => this.addNodeToGraph(nodeInfo.type);
        
        nodeList.appendChild(nodeItem);
      });
      
      categoryDiv.appendChild(categoryTitle);
      categoryDiv.appendChild(nodeList);
      body.appendChild(categoryDiv);
    });
  }

  /**
   * 获取已注册的节点类型
   */
  private getRegisteredNodeTypes() {
    const nodeTypes: Array<{type: string, title: string, desc?: string}> = [];
    
    // 遍历LiteGraph中已注册的节点类型
    for (const nodeType in LiteGraph.registered_node_types) {
      const nodeClass = LiteGraph.registered_node_types[nodeType];
      nodeTypes.push({
        type: nodeType,
        title: nodeClass.title || nodeType.split('/').pop() || nodeType,
        desc: nodeClass.desc || ''
      });
    }
    
    return nodeTypes;
  }

  /**
   * 按分类组织节点
   */
  private organizeNodesByCategory(nodeTypes: Array<{type: string, title: string, desc?: string}>) {
    const categories: {[key: string]: Array<{type: string, title: string, desc?: string}>} = {};
    
    nodeTypes.forEach(nodeInfo => {
      const parts = nodeInfo.type.split('/');
      const category = parts[0] || '其他';
      
      if (!categories[category]) {
        categories[category] = [];
      }
      
      categories[category].push(nodeInfo);
    });
    
    return categories;
  }

  /**
   * 获取节点分类样式类名
   */
  private getNodeCategoryClass(nodeType: string): string {
    const category = nodeType.split('/')[0];
    const categoryMap: {[key: string]: string} = {
      'render': 'render-node',
      'container': 'container-node', 
      'resource': 'resource-node',
      'scene': 'scene-node',
      'event': 'event-node',
      'tool': 'tool-node'
    };
    
    return categoryMap[category] || 'tool-node';
  }

  /**
   * 添加节点到图中
   */
  private addNodeToGraph(nodeType: string) {
    if (!this.editorCore || !this.editorCore.canvas) return;
    
    // 在画布中心添加节点
    const canvasRect = this.editorCore.canvasElement?.getBoundingClientRect();
    const centerX = canvasRect ? canvasRect.width / 2 : 400;
    const centerY = canvasRect ? canvasRect.height / 2 : 300;
    
    const node = LiteGraph.createNode(nodeType);
    if (node) {
      node.pos = [centerX, centerY];
      this.editorCore.graph.add(node);
      
      // 关闭节点库
      this.hide();
      
      console.log(`✅ 添加节点: ${nodeType}`);
    }
  }

  /**
   * 设置事件监听
   */
  private setupEventListeners() {
    // 监听节点库显示事件
    this.eventBus.on('node-library:show', () => {
      this.show();
    });

    // 点击外部关闭
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const isInPanel = target.closest('.node-library-panel');
      const isToolbarBtn = target.closest('.toolbar-btn');
      
      if (!isInPanel && !isToolbarBtn && this.panelElement?.classList.contains('open')) {
        this.hide();
      }
    });
  }

  /**
   * 连接编辑器核心
   */
  connectEditorCore(editorCore: EditorCore) {
    this.editorCore = editorCore;
    // 重新填充节点列表，因为现在有了编辑器核心
    this.populateNodeList();
  }

  /**
   * 显示节点库
   */
  show() {
    if (this.panelElement) {
      this.panelElement.classList.add('open');
      // 刷新节点列表
      this.populateNodeList();
    }
  }

  /**
   * 隐藏节点库
   */
  hide() {
    if (this.panelElement) {
      this.panelElement.classList.remove('open');
    }
  }
}
