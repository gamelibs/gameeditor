/**
 * 基于 iframe 的游戏预览管理器
 * 通过 iframe 加载 build/index.html 来实现"所见即所得"的预览效果
 */

export class IFrameGamePreviewManager {
  private static instance: IFrameGamePreviewManager;
  private iframe: HTMLIFrameElement | null = null;
  private container: HTMLElement | null = null;
  private isInitialized = false;
  private currentGraphData: any = null;

  private constructor() {}

  /**
   * 获取单例实例
   */
  static getInstance(): IFrameGamePreviewManager {
    if (!IFrameGamePreviewManager.instance) {
      IFrameGamePreviewManager.instance = new IFrameGamePreviewManager();
    }
    return IFrameGamePreviewManager.instance;
  }

  /**
   * 初始化iframe游戏预览
   */
  async initialize(containerId: string = 'game-preview-panel'): Promise<void> {
    if (this.isInitialized) {
      console.log('🎮 iframe游戏预览已初始化');
      return;
    }

    try {
      console.log('🔍 开始查找游戏预览容器...');
      
      // 获取容器元素 - 优先使用.game-preview-content
      let containerElement = document.querySelector('.game-preview-content') as HTMLElement;
      console.log('🎯 .game-preview-content 查找结果:', containerElement);
      
      // 如果没找到，尝试通过ID查找
      if (!containerElement) {
        containerElement = document.getElementById(containerId) as HTMLElement;
        console.log(`🎯 #${containerId} 查找结果:`, containerElement);
      }
      
      // 如果传入的是canvas ID，尝试找到其父容器
      if (containerElement?.tagName === 'CANVAS') {
        containerElement = containerElement.parentElement as HTMLElement;
        console.log('🎯 找到canvas父容器:', containerElement);
      }
      
      // 最后的备用查找
      if (!containerElement) {
        containerElement = document.querySelector('#game-preview-panel') as HTMLElement;
        console.log('🎯 #game-preview-panel 备用查找结果:', containerElement);
      }

      if (!containerElement) {
        throw new Error(`找不到游戏预览容器: ${containerId}`);
      }

      console.log('✅ 找到游戏预览容器:', containerElement.id, containerElement.className);
      this.container = containerElement;

      // 创建iframe元素
      console.log('🔧 开始创建iframe元素...');
      this.iframe = document.createElement('iframe');
      this.iframe.src = './build/index.html'; // 指向纯游戏运行页面
      this.iframe.style.width = '100%';
      this.iframe.style.height = '100%';
      this.iframe.style.border = 'none';
      this.iframe.style.borderRadius = '8px';
      this.iframe.style.backgroundColor = '#1a1a1a';
      this.iframe.title = '游戏预览';
      console.log('📄 iframe配置完成, src:', this.iframe.src);
      
      // 清除容器中现有的canvas元素（如果有的话）
      const existingCanvas = this.container.querySelector('canvas');
      if (existingCanvas) {
        existingCanvas.remove();
        console.log('🧹 移除现有的canvas元素');
      }

      // 清除容器中现有的iframe元素（如果有的话）
      const existingIframe = this.container.querySelector('iframe');
      if (existingIframe) {
        existingIframe.remove();
        console.log('🧹 移除现有的iframe元素');
      }

      // 添加iframe到容器
      console.log('📦 添加iframe到容器...', this.container);
      this.container.appendChild(this.iframe);
      console.log('✅ iframe已添加到容器');

      // 等待iframe加载完成
      await this.waitForIframeLoad();

      this.isInitialized = true;
      console.log('✅ iframe游戏预览初始化成功');

    } catch (error) {
      console.error('❌ iframe游戏预览初始化失败:', error);
      throw error;
    }
  }

  /**
   * 等待iframe加载完成
   */
  private waitForIframeLoad(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.iframe) {
        reject(new Error('iframe未创建'));
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error('iframe加载超时'));
      }, 10000); // 10秒超时

      this.iframe.onload = () => {
        clearTimeout(timeout);
        console.log('🔗 iframe加载完成');
        resolve();
      };

      this.iframe.onerror = () => {
        clearTimeout(timeout);
        reject(new Error('iframe加载失败'));
      };
    });
  }

  /**
   * 更新游戏预览内容
   * @param graphData 节点图数据
   */
  updatePreview(graphData: any): void {
    if (!this.isInitialized || !this.iframe) {
      console.warn('⚠️ iframe游戏预览未初始化，无法更新');
      return;
    }

    try {
      this.currentGraphData = graphData;
      
      // 通过postMessage向iframe发送节点图数据
      const message = {
        type: 'update-game-graph',
        data: graphData,
        timestamp: Date.now()
      };

      this.iframe.contentWindow?.postMessage(message, '*');
      console.log('📤 向游戏iframe发送更新数据');

    } catch (error) {
      console.error('❌ 更新游戏预览失败:', error);
    }
  }

  /**
   * 刷新游戏预览
   */
  refreshPreview(): void {
    if (!this.isInitialized || !this.iframe) {
      console.warn('⚠️ iframe游戏预览未初始化，无法刷新');
      return;
    }

    try {
      // 重新加载iframe
      this.iframe.src = this.iframe.src;
      console.log('🔄 刷新游戏预览iframe');

      // 等待加载完成后重新发送数据
      this.iframe.onload = () => {
        if (this.currentGraphData) {
          setTimeout(() => {
            this.updatePreview(this.currentGraphData);
          }, 500); // 延迟500ms确保iframe完全加载
        }
      };

    } catch (error) {
      console.error('❌ 刷新游戏预览失败:', error);
    }
  }

  /**
   * 进入全屏模式
   */
  enterFullscreen(): void {
    if (!this.iframe) {
      console.warn('⚠️ iframe未初始化，无法全屏');
      return;
    }

    try {
      if (this.iframe.requestFullscreen) {
        this.iframe.requestFullscreen();
      }
      console.log('📺 进入全屏模式');
    } catch (error) {
      console.error('❌ 进入全屏模式失败:', error);
    }
  }

  /**
   * 获取iframe元素
   */
  getIframe(): HTMLIFrameElement | null {
    return this.iframe;
  }

  /**
   * 检查iframe是否可用
   */
  isAvailable(): boolean {
    return this.isInitialized && !!this.iframe;
  }

  /**
   * 销毁iframe游戏预览
   */
  destroy(): void {
    if (this.iframe && this.container) {
      this.container.removeChild(this.iframe);
    }
    
    this.iframe = null;
    this.container = null;
    this.currentGraphData = null;
    this.isInitialized = false;
    
    console.log('🗑️ iframe游戏预览已销毁');
  }

  /**
   * 获取预览状态信息
   */
  getPreviewInfo(): any {
    return {
      isInitialized: this.isInitialized,
      hasIframe: !!this.iframe,
      hasContainer: !!this.container,
      iframeSrc: this.iframe?.src || null,
      hasGraphData: !!this.currentGraphData
    };
  }
}
