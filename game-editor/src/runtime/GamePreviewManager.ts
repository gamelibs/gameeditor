/**
 * 游戏预览管理器
 * 负责管理游戏预览区域的PIXI应用实例和渲染循环
 */

import { Application, Container } from 'pixi.js';

export class GamePreviewManager {
  private static instance: GamePreviewManager;
  private app: Application | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private gameStage: Container | null = null;
  private isInitialized = false;
  private animationFrameId: number | null = null;

  // 游戏配置
  private gameConfig = {
    width: 750,
    height: 1334,
    backgroundColor: '#1a1a1a',
    resizeToFit: true
  };

  private constructor() {}

  /**
   * 获取单例实例
   */
  static getInstance(): GamePreviewManager {
    if (!GamePreviewManager.instance) {
      GamePreviewManager.instance = new GamePreviewManager();
    }
    return GamePreviewManager.instance;
  }

  /**
   * 初始化游戏预览
   */
  async initialize(canvasId: string = 'gamePreviewCanvas'): Promise<void> {
    if (this.isInitialized) {
      console.log('🎮 游戏预览已初始化');
      return;
    }

    try {
      // 获取canvas元素
      this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
      if (!this.canvas) {
        throw new Error(`找不到canvas元素: ${canvasId}`);
      }

      // 等待DOM完全加载再获取容器大小
      await new Promise(resolve => setTimeout(resolve, 100));

      // 动态获取容器大小
      const containerElement = this.canvas.parentElement;
      if (containerElement) {
        const containerRect = containerElement.getBoundingClientRect();
        // 获取容器的实际可用空间，考虑padding
        const containerStyle = window.getComputedStyle(containerElement);
        const paddingLeft = parseFloat(containerStyle.paddingLeft) || 0;
        const paddingRight = parseFloat(containerStyle.paddingRight) || 0;
        const paddingTop = parseFloat(containerStyle.paddingTop) || 0;
        const paddingBottom = parseFloat(containerStyle.paddingBottom) || 0;
        
        const availableWidth = Math.max(containerRect.width - paddingLeft - paddingRight - 40, 300); // 额外减去40px边距
        const availableHeight = Math.max(containerRect.height - paddingTop - paddingBottom - 40, 400); // 额外减去40px边距
        
        // 优先使用默认的750x1334，但在容器太小时调整
        this.gameConfig.width = availableWidth < 750 ? availableWidth : 750;
        this.gameConfig.height = availableHeight < 1334 ? availableHeight : 1334;
        
        console.log(`📐 初始化游戏尺寸: ${this.gameConfig.width}x${this.gameConfig.height} (可用空间: ${availableWidth}x${availableHeight})`);
      } else {
        console.log(`📐 使用默认游戏尺寸: ${this.gameConfig.width}x${this.gameConfig.height}`);
      }

      // 创建PIXI应用 (PIXI v8 兼容)
      this.app = new Application();
      
      // 初始化应用
      await this.app.init({
        canvas: this.canvas,
        width: this.gameConfig.width,
        height: this.gameConfig.height,
        background: this.gameConfig.backgroundColor,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
        antialias: true
      });

      // 创建游戏根舞台
      this.gameStage = new Container();
      this.gameStage.name = 'GameRootStage';
      this.app.stage.addChild(this.gameStage);

      // 设置响应式
      if (this.gameConfig.resizeToFit) {
        this.setupResponsiveResize();
      }

      // 启动渲染循环
      this.startRenderLoop();

      this.isInitialized = true;
      console.log('✅ 游戏预览初始化成功');

    } catch (error) {
      console.error('❌ 游戏预览初始化失败:', error);
      throw error;
    }
  }

  /**
   * 获取PIXI应用实例
   */
  getApp(): Application | null {
    return this.app;
  }

  /**
   * 获取游戏根舞台
   */
  getGameStage(): Container | null {
    return this.gameStage;
  }

  /**
   * 设置游戏配置
   */
  setGameConfig(config: Partial<typeof this.gameConfig>): void {
    this.gameConfig = { ...this.gameConfig, ...config };
    
    if (this.app && this.isInitialized) {
      // 更新应用配置
      this.app.renderer.background.color = this.gameConfig.backgroundColor;
      if (config.width || config.height) {
        this.app.renderer.resize(this.gameConfig.width, this.gameConfig.height);
      }
    }
  }

  /**
   * 更新游戏配置（setGameConfig的别名）
   */
  updateConfig(config: Partial<typeof this.gameConfig>): void {
    this.setGameConfig(config);
  }

  /**
   * 添加显示对象到游戏舞台
   */
  addToStage(displayObject: Container, zIndex?: number): void {
    if (!this.gameStage) {
      console.warn('⚠️ 游戏舞台未初始化');
      return;
    }

    this.gameStage.addChild(displayObject);
    
    if (typeof zIndex === 'number') {
      displayObject.zIndex = zIndex;
      this.gameStage.sortChildren();
    }

    console.log(`➕ 添加对象到游戏舞台: ${displayObject.name || 'Unnamed'}`);
  }

  /**
   * 从游戏舞台移除显示对象
   */
  removeFromStage(displayObject: Container): void {
    if (!this.gameStage) {
      console.warn('⚠️ 游戏舞台未初始化');
      return;
    }

    this.gameStage.removeChild(displayObject);
    console.log(`➖ 从游戏舞台移除对象: ${displayObject.name || 'Unnamed'}`);
  }

  /**
   * 清空游戏舞台
   */
  clearStage(): void {
    if (!this.gameStage) {
      console.warn('⚠️ 游戏舞台未初始化');
      return;
    }

    this.gameStage.removeChildren();
    console.log('🧹 清空游戏舞台');
  }

  /**
   * 设置响应式调整
   */
  private setupResponsiveResize(): void {
    console.log('🔧 设置响应式调整...');
    
    const resize = () => {
      if (!this.app || !this.canvas) {
        console.warn('⚠️ resize: app 或 canvas 未初始化');
        return;
      }

      const container = this.canvas.parentElement;
      if (!container) {
        console.warn('⚠️ resize: 找不到父容器');
        return;
      }

      // 获取容器的实际可用空间，考虑padding和边距
      const containerStyle = window.getComputedStyle(container);
      const paddingLeft = parseFloat(containerStyle.paddingLeft) || 0;
      const paddingRight = parseFloat(containerStyle.paddingRight) || 0;
      const paddingTop = parseFloat(containerStyle.paddingTop) || 0;
      const paddingBottom = parseFloat(containerStyle.paddingBottom) || 0;
      
      const containerWidth = container.clientWidth - paddingLeft - paddingRight - 20; // 额外减去20px安全边距
      const containerHeight = container.clientHeight - paddingTop - paddingBottom - 20; // 额外减去20px安全边距
      
      console.log(`📏 容器尺寸: ${container.clientWidth}x${container.clientHeight}, 可用: ${containerWidth}x${containerHeight}`);
      console.log(`📏 Padding: L=${paddingLeft}, R=${paddingRight}, T=${paddingTop}, B=${paddingBottom}`);
      
      // 保持原始750x1334的比例，但适应容器大小
      if (containerWidth > 0 && containerHeight > 0) {
        // 计算缩放比例，保持宽高比
        const designWidth = 750;
        const designHeight = 1334;
        const scaleX = containerWidth / designWidth;
        const scaleY = containerHeight / designHeight;
        const scale = Math.min(scaleX, scaleY, 1); // 不放大，只缩小
        
        const finalWidth = Math.floor(designWidth * scale);
        const finalHeight = Math.floor(designHeight * scale);
        
        console.log(`🎯 计算缩放: scaleX=${scaleX.toFixed(2)}, scaleY=${scaleY.toFixed(2)}, 最终scale=${scale.toFixed(2)}`);
        console.log(`🎯 最终尺寸: ${finalWidth}x${finalHeight}`);
        
        // 更新PIXI应用尺寸
        this.app.renderer.resize(finalWidth, finalHeight);
        
        // 更新canvas样式，确保不超出容器
        this.canvas.style.width = `${finalWidth}px`;
        this.canvas.style.height = `${finalHeight}px`;
        this.canvas.style.margin = '10px auto'; // 上下外边距10px，左右居中
        this.canvas.style.display = 'block';
        this.canvas.style.maxWidth = '100%'; // 确保不超出容器宽度
        this.canvas.style.maxHeight = '100%'; // 确保不超出容器高度
        this.canvas.style.boxSizing = 'border-box'; // 包含边框在内的盒模型
        
        // 更新游戏配置
        this.gameConfig.width = finalWidth;
        this.gameConfig.height = finalHeight;
        
        console.log(`📐 游戏尺寸调整为: ${finalWidth}x${finalHeight} (容器: ${containerWidth}x${containerHeight}, 缩放: ${scale.toFixed(2)})`);
      } else {
        console.warn('⚠️ resize: 容器尺寸无效');
      }
    };

    // 使用ResizeObserver更精确地监听容器变化
    const parentElement = this.canvas?.parentElement;
    if (parentElement) {
      console.log('🔍 设置 ResizeObserver...');
      const resizeObserver = new ResizeObserver(() => {
        console.log('🔄 ResizeObserver 触发');
        resize();
      });
      
      resizeObserver.observe(parentElement);
      console.log('✅ ResizeObserver 已设置');
    } else {
      console.warn('⚠️ 找不到父元素，无法设置 ResizeObserver');
    }

    // 同时监听窗口变化作为备用
    window.addEventListener('resize', () => {
      console.log('🪟 窗口大小变化');
      resize();
    });
    
    console.log('📐 即将执行初始调整...');
    // 立即调整一次
    setTimeout(() => {
      console.log('⏰ 执行延迟的初始调整');
      resize();
    }, 100); // 延迟一下确保DOM完全加载
  }

  /**
   * 启动渲染循环
   */
  private startRenderLoop(): void {
    if (!this.app) return;

    const tick = () => {
      if (this.app && this.isInitialized) {
        // 这里可以添加游戏逻辑更新
        this.updateGameLogic();
        
        this.animationFrameId = requestAnimationFrame(tick);
      }
    };

    this.animationFrameId = requestAnimationFrame(tick);
    console.log('🔄 游戏渲染循环启动');
  }

  /**
   * 停止渲染循环
   */
  private stopRenderLoop(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
      console.log('⏹️ 游戏渲染循环停止');
    }
  }

  /**
   * 游戏逻辑更新（每帧调用）
   */
  private updateGameLogic(): void {
    // 这里可以添加每帧需要更新的游戏逻辑
    // 例如：动画、物理、状态更新等
  }

  /**
   * 销毁游戏预览
   */
  destroy(): void {
    this.stopRenderLoop();
    
    if (this.app) {
      this.app.destroy(true, { children: true, texture: false });
      this.app = null;
    }
    
    this.gameStage = null;
    this.canvas = null;
    this.isInitialized = false;
    
    console.log('🗑️ 游戏预览已销毁');
  }

  /**
   * 获取游戏状态信息
   */
  getGameInfo(): any {
    return {
      isInitialized: this.isInitialized,
      hasApp: !!this.app,
      hasStage: !!this.gameStage,
      stageChildren: this.gameStage?.children.length || 0,
      config: this.gameConfig
    };
  }

  /**
   * 截图功能
   */
  takeScreenshot(): string | null {
    if (!this.app) {
      console.warn('⚠️ 无法截图，游戏预览未初始化');
      return null;
    }

    try {
      // 截图功能（简化版本）
      const canvas = this.app.view as HTMLCanvasElement;
      const base64 = canvas.toDataURL();
      console.log('📸 游戏截图生成成功');
      return base64;
    } catch (error) {
      console.error('❌ 截图失败:', error);
      return null;
    }
  }
}
