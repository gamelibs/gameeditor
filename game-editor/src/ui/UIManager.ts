import { EventBus } from '../core/EventBus';
import { EditorCore } from '../core/EditorCore';
import { ThreeTabCodeGenerator } from './ThreeTabCodeGenerator';
import { TopbarPanel } from './panels/TopbarPanel';
import { NodeEditorPanel } from './panels/NodeEditorPanel';
import { EditorToolbarPanel } from './panels/EditorToolbarPanel';
import { NodeLibraryPanel } from './panels/NodeLibraryPanel';

/**
 * 稳定的UI管理器 - 使用固定定位确保布局稳定性
 * 新元素的加入不会影响现有布局
 */
export class UIManager {
  private eventBus: EventBus;
  private panels = new Map<string, any>();
  private isInitialized = false;
  private codeGenerator: ThreeTabCodeGenerator | null = null;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      console.log('🎨 开始初始化稳定UI框架...');

      // 1. 验证基础DOM结构
      this.validateBaseStructure();

      // 2. 创建稳定的UI框架
      this.createStableUIFramework();

      // 3. 创建面板实例
      this.panels.set('topbar', new TopbarPanel(this.eventBus));
      this.panels.set('nodeEditor', new NodeEditorPanel(this.eventBus));
      this.panels.set('editorToolbar', new EditorToolbarPanel(this.eventBus));
      this.panels.set('nodeLibrary', new NodeLibraryPanel(this.eventBus));

      // 4. 初始化所有面板
      for (const [name, panel] of this.panels) {
        await panel.initialize();
        console.log(`✅ ${name} 面板初始化完成`);
      }

      // 5. 设置面板通信
      this.setupPanelCommunication();

      this.isInitialized = true;
      console.log('✅ 稳定UI框架初始化完成');
    } catch (error) {
      console.error('❌ UI框架初始化失败:', error);
      throw error;
    }
  }

  /**
   * 验证基础DOM结构
   */
  private validateBaseStructure() {
    const topbar = document.getElementById('topbar');
    const appContainer = document.getElementById('app-container');
    
    if (!topbar) {
      throw new Error('缺少 #topbar 元素');
    }
    
    if (!appContainer) {
      throw new Error('缺少 #app-container 元素');
    }
    
    console.log('✅ 基础DOM结构验证通过');
  }

  /**
   * 创建稳定的UI框架
   */
  private createStableUIFramework() {
    // UI框架现在由各个面板自己管理
    console.log('✅ UI框架准备完成');
  }



  /**
   * 连接编辑器核心
   */
  connectEditorCore(editorCore: EditorCore) {
    // 连接TopbarPanel到编辑器核心
    const topbarPanel = this.panels.get('topbar');
    if (topbarPanel && topbarPanel.connectEditorCore) {
      topbarPanel.connectEditorCore(editorCore);
      console.log('✅ 顶部工具栏连接完成');
    }

    // 连接NodeEditorPanel到编辑器核心
    const nodeEditorPanel = this.panels.get('nodeEditor');
    if (nodeEditorPanel && nodeEditorPanel.connectEditorCore) {
      nodeEditorPanel.connectEditorCore(editorCore);
      console.log('✅ 节点编辑器连接完成');
    }

    // 连接EditorToolbarPanel到编辑器核心
    const editorToolbarPanel = this.panels.get('editorToolbar');
    if (editorToolbarPanel && editorToolbarPanel.connectEditorCore) {
      editorToolbarPanel.connectEditorCore(editorCore);
      console.log('✅ 编辑器工具栏连接完成');
    }

    // 连接NodeLibraryPanel到编辑器核心
    const nodeLibraryPanel = this.panels.get('nodeLibrary');
    if (nodeLibraryPanel && nodeLibraryPanel.connectEditorCore) {
      nodeLibraryPanel.connectEditorCore(editorCore);
      console.log('✅ 节点库连接完成');
    }

    // 创建代码生成器
    this.codeGenerator = new ThreeTabCodeGenerator(editorCore.graph);
    
    console.log('✅ 编辑器核心连接完成');
  }



  private setupPanelCommunication() {
    // 设置面板间通信
    this.eventBus.on('graph:changed', () => {
      this.updateCodeDisplay();
    });

    this.eventBus.on('app:resize', () => {
      this.handleResize();
    });
  }

  private updateCodeDisplay() {
    // 更新代码显示逻辑
  }

  private handleResize() {
    // 处理窗口大小变化
  }
}
