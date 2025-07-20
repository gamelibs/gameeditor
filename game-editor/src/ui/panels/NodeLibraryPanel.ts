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
  private expandedCategories = new Set<string>(['basic', 'render']); // 默认展开的分类
  private expandedSubcategories = new Set<string>(); // 默认展开的二级分类

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

    // 4. 确保初始状态正确
    setTimeout(() => {
      this.ensureClosedState();
    }, 100);

    this.isInitialized = true;

    // 添加全局调试方法
    (window as any).debugNodeLibrary = () => {
      console.log('🔍 节点库状态:', this.getStatus());
      return this.getStatus();
    };
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
        margin-bottom: 0;
        padding: 8px 10px;
        background: rgba(78, 205, 196, 0.1);
        border: 1px solid #555;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: space-between;
        user-select: none;
      }

      .category-title:hover {
        background: rgba(78, 205, 196, 0.2);
        border-color: #4ECDC4;
      }

      .category-title.collapsed {
        border-radius: 4px 4px 0 0;
      }

      .category-expand-icon {
        font-size: 12px;
        transition: transform 0.2s ease;
      }

      .category-title.collapsed .category-expand-icon {
        transform: rotate(-90deg);
      }

      .node-list {
        display: flex;
        flex-direction: column;
        gap: 2px;
        max-height: 1000px;
        overflow: hidden;
        transition: max-height 0.3s ease;
        border: 1px solid #555;
        border-top: none;
        border-radius: 0 0 4px 4px;
        background: rgba(0, 0, 0, 0.2);
      }

      .node-list.collapsed {
        max-height: 0;
        border: none;
      }

      .node-item {
        background: rgba(255, 255, 255, 0.05);
        border: none;
        border-bottom: 1px solid #444;
        padding: 8px 15px;
        cursor: pointer;
        transition: all 0.2s ease;
        color: #ffffff;
        margin: 0;
      }

      .node-item:hover {
        background: rgba(78, 205, 196, 0.2);
        border-bottom-color: #4ECDC4;
        transform: translateX(2px);
      }

      .node-item:last-child {
        border-bottom: none;
      }

      /* 二级分类样式 */
      .subcategory {
        margin-left: 10px;
        margin-top: 5px;
      }

      .subcategory-title {
        color: #999;
        font-size: 12px;
        font-weight: 500;
        padding: 6px 10px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 3px;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: space-between;
        user-select: none;
        margin-bottom: 3px;
      }

      .subcategory-title:hover {
        background: rgba(255, 255, 255, 0.1);
        color: #4ECDC4;
      }

      .subcategory-expand-icon {
        font-size: 10px;
        transition: transform 0.2s ease;
      }

      .subcategory-title.collapsed .subcategory-expand-icon {
        transform: rotate(-90deg);
      }

      .subcategory-nodes {
        max-height: 500px;
        overflow: hidden;
        transition: max-height 0.3s ease;
        background: rgba(0, 0, 0, 0.1);
        border-radius: 3px;
        margin-bottom: 5px;
      }

      .subcategory-nodes.collapsed {
        max-height: 0;
      }

      .subcategory-nodes .node-item {
        padding-left: 20px;
        font-size: 12px;
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
          width: calc(100vw - 20px);
          height: calc(100vh - 140px);
          right: auto; /* 移除right属性，避免冲突 */
        }

        .node-library-panel.open {
          left: 10px;
          right: 10px;
        }
      }

      /* 确保默认状态是关闭的 */
      @media (max-width: 768px) {
        .node-library-panel:not(.open) {
          left: -100% !important;
          right: auto !important;
          transform: translateX(0) !important;
        }
      }
    `;
    
    document.head.appendChild(style);
  }

  /**
   * 创建节点库面板
   */
  private createNodeLibraryPanel() {
    // 创建面板容器 - 确保默认是关闭状态
    const panel = document.createElement('div');
    panel.className = 'node-library-panel'; // 注意：不添加 'open' 类，确保默认关闭
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

    // 确保初始状态是关闭的
    this.ensureClosedState();

    // 填充节点列表
    this.populateNodeList();
  }

  /**
   * 填充节点列表
   */
  private populateNodeList() {
    const body = document.getElementById('node-library-body');
    if (!body) return;

    try {
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

      console.log('📚 开始渲染节点分类:', Object.keys(categories));

      // 渲染分类和节点
      Object.entries(categories).forEach(([categoryName, nodes]) => {
      const categoryDiv = document.createElement('div');
      categoryDiv.className = 'node-category';

      // 创建一级分类标题
      const categoryTitle = document.createElement('div');
      categoryTitle.className = 'category-title';

      const categoryTitleText = document.createElement('span');
      categoryTitleText.textContent = this.getCategoryDisplayName(categoryName);

      const expandIcon = document.createElement('span');
      expandIcon.className = 'category-expand-icon';
      expandIcon.textContent = '▼';

      categoryTitle.appendChild(categoryTitleText);
      categoryTitle.appendChild(expandIcon);

      // 创建节点列表容器
      const nodeList = document.createElement('div');
      nodeList.className = 'node-list';

      // 设置默认展开状态
      const isExpanded = this.expandedCategories.has(categoryName);
      if (!isExpanded) {
        nodeList.classList.add('collapsed');
        categoryTitle.classList.add('collapsed');
      }

      // 暂时简化：直接显示所有节点，不使用二级分类
      nodes.forEach((nodeInfo: any) => {
        const nodeItem = this.createNodeItem(nodeInfo);
        nodeList.appendChild(nodeItem);
      });

      // 添加点击事件切换展开/收起
      categoryTitle.onclick = () => {
        const isCollapsed = nodeList.classList.contains('collapsed');
        if (isCollapsed) {
          nodeList.classList.remove('collapsed');
          categoryTitle.classList.remove('collapsed');
          this.expandedCategories.add(categoryName);
        } else {
          nodeList.classList.add('collapsed');
          categoryTitle.classList.add('collapsed');
          this.expandedCategories.delete(categoryName);
        }
      };

        categoryDiv.appendChild(categoryTitle);
        categoryDiv.appendChild(nodeList);
        body.appendChild(categoryDiv);
      });

    } catch (error) {
      console.error('❌ 渲染节点分类错误:', error);
      body.innerHTML = `
        <div style="text-align: center; padding: 20px; color: #ff6b6b;">
          <p>❌ 节点库渲染失败</p>
          <p>请查看控制台获取详细信息</p>
        </div>
      `;
    }
  }

  /**
   * 获取已注册的节点类型
   */
  private getRegisteredNodeTypes() {
    const nodeTypes: Array<{type: string, title: string, desc?: string}> = [];

    // 遍历LiteGraph中已注册的节点类型
    for (const nodeType in LiteGraph.registered_node_types) {
      const nodeClass = LiteGraph.registered_node_types[nodeType] as any;
      nodeTypes.push({
        type: nodeType,
        title: nodeClass.title || nodeType.split('/').pop() || nodeType,
        desc: nodeClass.desc || ''
      });
    }

    return nodeTypes;
  }

  /**
   * 获取分类显示名称
   */
  private getCategoryDisplayName(categoryName: string): string {
    const categoryMap: {[key: string]: string} = {
      'basic': '🔧 基础节点',
      'render': '🎨 渲染节点',
      'container': '📦 容器节点',
      'resource': '📁 资源节点',
      'scene': '🎬 场景节点',
      'event': '⚡ 事件节点',
      'tool': '🛠️ 工具节点',
      'math': '🔢 数学节点',
      'logic': '🧠 逻辑节点',
      'input': '🎮 输入节点',
      'output': '📺 输出节点'
    };

    return categoryMap[categoryName] || `📋 ${categoryName}`;
  }

  /**
   * 按二级分类组织节点
   */
  private organizeNodesBySubcategory(nodes: Array<{type: string, title: string, desc?: string}>) {
    const subcategories: {[key: string]: Array<{type: string, title: string, desc?: string}>} = {};

    try {
      nodes.forEach(nodeInfo => {
        const parts = nodeInfo.type.split('/');
        const subcategory = parts[1] || '通用';

        if (!subcategories[subcategory]) {
          subcategories[subcategory] = [];
        }

        // 添加调试信息
        if (!Array.isArray(subcategories[subcategory])) {
          console.error('❌ subcategories[subcategory] 不是数组:', subcategory, subcategories[subcategory]);
          subcategories[subcategory] = [];
        }

        subcategories[subcategory].push(nodeInfo);
      });
    } catch (error) {
      console.error('❌ organizeNodesBySubcategory 错误:', error);
      return { '通用': nodes };
    }

    return subcategories;
  }

  /**
   * 创建二级分类
   */
  private createSubcategory(subCategoryName: string, nodes: Array<{type: string, title: string, desc?: string}>): HTMLElement {
    const subcategoryDiv = document.createElement('div');
    subcategoryDiv.className = 'subcategory';

    // 创建二级分类标题
    const subcategoryTitle = document.createElement('div');
    subcategoryTitle.className = 'subcategory-title';

    const titleText = document.createElement('span');
    titleText.textContent = subCategoryName;

    const expandIcon = document.createElement('span');
    expandIcon.className = 'subcategory-expand-icon';
    expandIcon.textContent = '▼';

    subcategoryTitle.appendChild(titleText);
    subcategoryTitle.appendChild(expandIcon);

    // 创建节点容器
    const nodesContainer = document.createElement('div');
    nodesContainer.className = 'subcategory-nodes';

    // 设置默认展开状态（二级分类默认收起）
    const subcategoryKey = `${subCategoryName}`;
    const isExpanded = this.expandedSubcategories.has(subcategoryKey);
    if (!isExpanded) {
      nodesContainer.classList.add('collapsed');
      subcategoryTitle.classList.add('collapsed');
    }

    // 添加节点
    nodes.forEach(nodeInfo => {
      const nodeItem = this.createNodeItem(nodeInfo);
      nodesContainer.appendChild(nodeItem);
    });

    // 添加点击事件
    subcategoryTitle.onclick = () => {
      const isCollapsed = nodesContainer.classList.contains('collapsed');
      if (isCollapsed) {
        nodesContainer.classList.remove('collapsed');
        subcategoryTitle.classList.remove('collapsed');
        this.expandedSubcategories.add(subcategoryKey);
      } else {
        nodesContainer.classList.add('collapsed');
        subcategoryTitle.classList.add('collapsed');
        this.expandedSubcategories.delete(subcategoryKey);
      }
    };

    subcategoryDiv.appendChild(subcategoryTitle);
    subcategoryDiv.appendChild(nodesContainer);

    return subcategoryDiv;
  }

  /**
   * 创建节点项
   */
  private createNodeItem(nodeInfo: {type: string, title: string, desc?: string}): HTMLElement {
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

    return nodeItem;
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
    // 监听节点库显示事件 - 改为切换逻辑
    this.eventBus.on('node-library:show', () => {
      this.toggle();
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

    // 监听窗口大小变化，确保移动端状态正确
    window.addEventListener('resize', () => {
      if (this.panelElement && !this.panelElement.classList.contains('open')) {
        // 如果面板是关闭状态，确保在移动端位置正确
        if (window.innerWidth <= 768) {
          this.panelElement.style.left = '-100%';
        } else {
          this.panelElement.style.left = '-320px';
        }
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

      // 清除内联样式，让CSS类生效
      this.panelElement.style.left = '';
      this.panelElement.style.right = '';

      // 刷新节点列表
      this.populateNodeList();
      console.log('📚 节点库已显示');
    }
  }

  /**
   * 隐藏节点库
   */
  hide() {
    if (this.panelElement) {
      this.panelElement.classList.remove('open');

      // 强制设置样式，确保完全隐藏
      if (window.innerWidth <= 768) {
        // 移动端
        this.panelElement.style.left = '-100%';
        this.panelElement.style.right = 'auto';
      } else {
        // 桌面端
        this.panelElement.style.left = '-320px';
        this.panelElement.style.right = 'auto';
      }

      console.log('📚 节点库已隐藏');
    }
  }

  /**
   * 切换节点库显示状态
   */
  toggle() {
    if (this.panelElement) {
      const isOpen = this.panelElement.classList.contains('open');
      if (isOpen) {
        this.hide();
      } else {
        this.show();
      }
    }
  }

  /**
   * 重置节点库状态 - 确保独立性
   */
  reset() {
    // 重置展开状态
    this.expandedCategories.clear();
    this.expandedCategories.add('basic');
    this.expandedCategories.add('render');
    this.expandedSubcategories.clear();

    // 重新填充节点列表
    this.populateNodeList();

    console.log('🔄 节点库状态已重置');
  }

  /**
   * 刷新节点库 - 重新获取最新的节点类型
   */
  refresh() {
    console.log('🔄 刷新节点库');
    this.populateNodeList();
  }

  /**
   * 确保节点库处于关闭状态
   */
  private ensureClosedState() {
    if (this.panelElement) {
      // 强制移除 open 类，确保关闭状态
      this.panelElement.classList.remove('open');

      // 强制设置样式，确保完全隐藏
      if (window.innerWidth <= 768) {
        // 移动端
        this.panelElement.style.left = '-100%';
        this.panelElement.style.right = 'auto';
        this.panelElement.style.transform = 'translateX(0)';
      } else {
        // 桌面端
        this.panelElement.style.left = '-320px';
        this.panelElement.style.right = 'auto';
      }

      console.log('🔒 节点库已确保关闭状态 (屏幕宽度:', window.innerWidth + ')');
    }
  }

  /**
   * 获取节点库状态 - 用于调试
   */
  getStatus() {
    const computedStyle = this.panelElement ? window.getComputedStyle(this.panelElement) : null;
    return {
      isInitialized: this.isInitialized,
      isVisible: this.panelElement?.classList.contains('open') || false,
      hasOpenClass: this.panelElement?.classList.contains('open'),
      computedLeft: computedStyle?.left,
      inlineLeft: this.panelElement?.style.left,
      screenWidth: window.innerWidth,
      expandedCategories: Array.from(this.expandedCategories),
      expandedSubcategories: Array.from(this.expandedSubcategories),
      registeredNodeCount: Object.keys(LiteGraph.registered_node_types || {}).length
    };
  }
}
