import { LGraph, LGraphCanvas, LiteGraph } from 'litegraph.js';
import { registerCustomNodes } from '../nodes';
import { EventBus } from './EventBus';

export class EditorCore {
  public graph: LGraph;
  public canvas: LGraphCanvas | null = null;
  public eventBus: EventBus;
  public canvasElement: HTMLCanvasElement | null = null;
  private isInitialized = false;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
    this.graph = new LGraph();
    // 延迟初始化canvas，等待UI创建完成
  }

  /**
   * 初始化canvas（在UI创建完成后调用）
   */
  initializeCanvas() {
    if (this.isInitialized) return;

    this.canvasElement = document.getElementById('graphCanvas') as HTMLCanvasElement;
    if (!this.canvasElement) {
      throw new Error('找不到graphCanvas元素');
    }
    this.canvas = new LGraphCanvas(this.canvasElement, this.graph);
    this.initLiteGraph();
    this.restoreGraph();
    this.setupEvents();
    this.isInitialized = true;
  }

  private initLiteGraph() {
    if (!this.canvas || !this.canvasElement) return;

    registerCustomNodes();

    // 设置画布样式
    (this.canvas as any).background_color = "#1e1e1e";
    (this.canvas as any).gridcolor = "#333";
    (this.canvas as any).grid_alpha = 0.3;
    (this.canvas as any).show_info = true;
    (this.canvas as any).show_fps = false;
    (this.canvas as any).antialias = true;
    (this.canvas as any).highquality = true;

    // 启用右键菜单和节点创建功能
    (this.canvas as any).allow_searchbox = true;
    (this.canvas as any).allow_dragnodes = true;
    (this.canvas as any).allow_interaction = true;
    (this.canvas as any).allow_reconnect_links = true;

    // 确保右键菜单功能正常
    (this.canvas as any).context_menu = true;
    (this.canvas as any).allow_context_menu = true;

    // 设置画布焦点和大小
    this.canvas.resize();
    this.canvasElement.style.outline = 'none';
    this.canvasElement.tabIndex = 0;
    this.canvasElement.focus();

    // 确保canvas事件不被阻止
    this.canvasElement.style.pointerEvents = 'auto';

    // 启用LiteGraph的内置右键菜单
    this.setupContextMenu();

    console.log('✅ LiteGraph初始化完成，右键菜单已启用');
    console.log('📋 已注册的节点类型:', Object.keys(LiteGraph.registered_node_types || {}));
  }

  private restoreGraph() {
    const savedGraph = localStorage.getItem('game-editor-graph');
    if (savedGraph) {
      try {
        this.graph.configure(JSON.parse(savedGraph));
      } catch (e) {
        console.warn('恢复节点数据失败:', e);
      }
    }
  }

  private setupContextMenu() {
    if (!this.canvas || !this.canvasElement) return;

    const canvas = this.canvas as any;

    // 强制启用所有LiteGraph交互功能
    canvas.allow_searchbox = true;
    canvas.allow_dragnodes = true;
    canvas.allow_interaction = true;
    canvas.allow_reconnect_links = true;
    canvas.context_menu = true;

    // 测试右键菜单功能
    this.canvasElement.addEventListener('contextmenu', (e) => {
      console.log('右键事件触发，位置:', e.clientX, e.clientY);
      console.log('Canvas允许搜索框:', canvas.allow_searchbox);
      console.log('Canvas允许交互:', canvas.allow_interaction);

      // 不阻止默认行为，让LiteGraph处理
      // e.preventDefault(); // 注释掉这行，让LiteGraph处理
    });

    // 手动触发搜索框测试
    this.canvasElement.addEventListener('keydown', (e) => {
      if (e.key === ' ' && !e.ctrlKey && !e.altKey && !e.shiftKey) {
        console.log('空格键按下，尝试显示搜索框');
        if (canvas.showSearchBox) {
          canvas.showSearchBox(e);
        }
      }
    });

    console.log('✅ LiteGraph右键菜单配置完成');
    console.log('Canvas对象:', canvas);
    console.log('可用方法:', Object.getOwnPropertyNames(canvas.__proto__));
  }

  private setupEvents() {
    window.addEventListener('resize', () => {
      if (this.canvas) {
        this.canvas.resize();
      }
    });

    // 设置图形变化监听
    this.setupGraphEvents();

    // LiteGraph自动重绘，无需手动draw
  }

  private setupGraphEvents() {
    // 监听节点添加事件
    (this.graph as any).onNodeAdded = (node: any) => {
      console.log('✅ 节点已添加:', node.title || node.type);
      this.eventBus.emit('graph:nodeAdded', node);
    };

    // 监听节点移除事件
    (this.graph as any).onNodeRemoved = (node: any) => {
      console.log('🗑️ 节点已移除:', node.title || node.type);
      this.eventBus.emit('graph:nodeRemoved', node);
    };

    // 监听连接变化事件
    (this.graph as any).onConnectionChange = () => {
      console.log('🔗 连接已变化');
      this.eventBus.emit('graph:connectionChanged');
    };
  }

  // 其它核心方法可继续扩展...
}