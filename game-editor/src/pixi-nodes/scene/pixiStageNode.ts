import { Application } from 'pixi.js';
import { Logger } from '../../pixiNodeLogger';

export function registerPixiStageNode(LiteGraph: any) {
  function PixiStageNode(this: any) {
    this.addInput('Children', 'pixi_display_object,array');
    this.properties = { width: 640, height: 480, background: '#222222' }; // 预览窗口默认尺寸
    this._app = null;
    this._previewContainer = null; // 预览容器
    this.title = 'PixiStageNode';
    this.size = [180, 60]; // 节点使用默认尺寸
    this.boxcolor = "#050"; // 设置节点框的颜色为绿色，表示运行中

    // 添加属性控制
    this.addWidget('number', 'Width', this.properties.width, (v: number) => {
      this.properties.width = v;
      this._updateCanvasSize();
    });

    this.addWidget('number', 'Height', this.properties.height, (v: number) => {
      this.properties.height = v;
      this._updateCanvasSize();
    });

    this.addWidget('text', 'Background', this.properties.background, (v: string) => {
      this.properties.background = v;
      this._updateBackground();
    });
  }

  PixiStageNode.prototype._initStage = function() {
    // 只创建一次Pixi Application
    if (this._app) {
      return;
    }

    // 查找浮动预览面板的iframe
    this._previewContainer = this._findPreviewContainer();
    if (!this._previewContainer) {
      Logger.warn('PixiStageNode', '未找到预览容器，将创建独立预览窗口');
      this._createStandalonePreview();
      return;
    }

    // 创建Pixi应用
    this._createPixiApp();
  };

  PixiStageNode.prototype._findPreviewContainer = function() {
    // 首先尝试查找浮动预览面板
    const floatingPreview = document.getElementById('floating-game-preview');
    if (floatingPreview) {
      // 确保预览面板是可见的
      if (!floatingPreview.classList.contains('visible')) {
        floatingPreview.classList.add('visible');
        Logger.info('PixiStageNode', '自动显示浮动预览面板');
      }

      // 查找预览内容区域，直接在其中创建canvas容器
      const previewContent = floatingPreview.querySelector('.floating-preview-content');
      if (previewContent) {
        // 移除iframe，直接使用div容器
        const existingIframe = previewContent.querySelector('.floating-preview-iframe');
        if (existingIframe) {
          existingIframe.remove();
        }

        // 创建或获取游戏容器
        let gameContainer = previewContent.querySelector('#pixi-stage-container') as HTMLElement;
        if (!gameContainer) {
          gameContainer = document.createElement('div');
          gameContainer.id = 'pixi-stage-container';
          gameContainer.style.flex = '1';
          gameContainer.style.width = '100%';
          gameContainer.style.height = '100%';
          gameContainer.style.background = this.properties.background;
          gameContainer.style.borderRadius = '8px';
          gameContainer.style.overflow = 'hidden';
          gameContainer.style.display = 'flex';
          gameContainer.style.alignItems = 'center';
          gameContainer.style.justifyContent = 'center';
          gameContainer.style.position = 'relative';
          gameContainer.style.minHeight = '200px'; // 确保有最小高度
          previewContent.appendChild(gameContainer);
        } else {
          // 更新背景色
          gameContainer.style.background = this.properties.background;
        }
        return gameContainer;
      }
    }
    return null;
  };

  PixiStageNode.prototype._createStandalonePreview = function() {
    // 创建独立的预览窗口（备用方案）
    if (!this._previewContainer) {
      this._previewContainer = document.createElement('div');
      this._previewContainer.style.position = 'fixed';
      this._previewContainer.style.top = '80px';
      this._previewContainer.style.right = '20px';
      this._previewContainer.style.width = this.properties.width + 'px';
      this._previewContainer.style.height = this.properties.height + 'px';
      this._previewContainer.style.background = this.properties.background;
      this._previewContainer.style.border = '2px solid #4ECDC4';
      this._previewContainer.style.borderRadius = '8px';
      this._previewContainer.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.6)';
      this._previewContainer.style.zIndex = '2001';
      this._previewContainer.style.overflow = 'hidden';

      // 添加标题
      const title = document.createElement('div');
      title.textContent = '🎮 Pixi Stage 预览';
      title.style.background = 'linear-gradient(135deg, #4ECDC4, #44A08D)';
      title.style.color = 'white';
      title.style.padding = '8px 12px';
      title.style.fontSize = '12px';
      title.style.fontWeight = 'bold';
      this._previewContainer.appendChild(title);

      // 游戏内容区域
      const gameArea = document.createElement('div');
      gameArea.id = 'pixi-stage-game-area';
      gameArea.style.width = '100%';
      gameArea.style.height = 'calc(100% - 32px)';
      gameArea.style.background = this.properties.background;
      this._previewContainer.appendChild(gameArea);

      document.body.appendChild(this._previewContainer);
      this._previewContainer = gameArea; // 使用游戏区域作为容器
    }

    this._createPixiApp();
  };

  PixiStageNode.prototype._createPixiApp = function() {
    // 创建Pixi应用
    this._app = new Application();
    this._app.init({
      width: this.properties.width,
      height: this.properties.height,
      background: this.properties.background,
      autoStart: true,
      antialias: true
    }).then(() => {
      if (this._previewContainer && !this._previewContainer.contains(this._app.canvas)) {
        // 计算适应预览窗口的尺寸，保持宽高比
        this._fitCanvasToContainer();
        this._previewContainer.appendChild(this._app.canvas);

        Logger.info('PixiStageNode', 'Pixi应用初始化成功', {
          gameSize: { width: this.properties.width, height: this.properties.height },
          containerSize: {
            width: this._previewContainer.clientWidth,
            height: this._previewContainer.clientHeight
          }
        });
      }
    }).catch((err: any) => {
      Logger.error('PixiStageNode', 'Pixi Application init error:', err);
    });
  };

  PixiStageNode.prototype._fitCanvasToContainer = function() {
    if (!this._app || !this._previewContainer) return;

    const canvas = this._app.canvas;
    const container = this._previewContainer;

    // 获取容器尺寸
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    // 游戏原始尺寸
    const gameWidth = this.properties.width;
    const gameHeight = this.properties.height;

    // 计算缩放比例，保持宽高比
    const scaleX = containerWidth / gameWidth;
    const scaleY = containerHeight / gameHeight;
    const scale = Math.min(scaleX, scaleY);

    // 计算实际显示尺寸
    const displayWidth = gameWidth * scale;
    const displayHeight = gameHeight * scale;

    // 设置canvas样式
    canvas.style.width = displayWidth + 'px';
    canvas.style.height = displayHeight + 'px';
    canvas.style.display = 'block';
    canvas.style.margin = '0 auto';
    canvas.style.maxWidth = '100%';
    canvas.style.maxHeight = '100%';
    canvas.style.objectFit = 'contain';

    Logger.info('PixiStageNode', 'Canvas适应容器', {
      container: { width: containerWidth, height: containerHeight },
      game: { width: gameWidth, height: gameHeight },
      scale: scale,
      display: { width: displayWidth, height: displayHeight }
    });
  };

  PixiStageNode.prototype._updateCanvasSize = function() {
    if (this._app && this._app.renderer) {
      // 更新渲染器的实际尺寸（游戏逻辑尺寸）
      this._app.renderer.resize(this.properties.width, this.properties.height);

      // 重新适应容器显示尺寸
      this._fitCanvasToContainer();
    }
  };

  PixiStageNode.prototype._updateBackground = function() {
    if (this._app && this._app.renderer) {
      this._app.renderer.background.color = this.properties.background;
    }
  };

  PixiStageNode.prototype.onExecute = function() {
    // 确保Pixi应用已初始化
    if (!this._app) {
      this._initStage();
      return; // 等待下一帧执行
    }

    // 确保应用已完全初始化
    if (!this._app.stage) {
      return;
    }

    // 获取输入的子对象
    const children = this.getInputData(0);

    // 清除舞台现有内容
    this._app.stage.removeChildren();

    // 添加子对象到舞台
    if (Array.isArray(children)) {
      for (const child of children) {
        if (child && this._isValidPixiObject(child)) {
          this._prepareChildForStage(child);
          try {
            this._app.stage.addChild(child);
          } catch (error) {
            Logger.error('PixiStageNode', 'Error adding child to stage:', error);
          }
        }
      }
    } else if (children && this._isValidPixiObject(children)) {
      this._prepareChildForStage(children);
      try {
        this._app.stage.addChild(children);
      } catch (error) {
        Logger.error('PixiStageNode', 'Error adding single child to stage:', error);
      }
    }

    // 输出应用实例供其他节点使用
    this.setOutputData(0, this._app);
  };

  PixiStageNode.prototype._isValidPixiObject = function(obj:any) {
    return obj && (
      typeof obj.x === 'number' ||
      typeof obj.addChild === 'function' ||
      obj.constructor.name.includes('Sprite') ||
      obj.constructor.name.includes('Container') ||
      obj.constructor.name.includes('Graphics')
    );
  };

  PixiStageNode.prototype._prepareChildForStage = function(child:any) {
    // 确保基本属性有效
    if (typeof child.visible !== 'undefined') child.visible = true;
    if (typeof child.renderable !== 'undefined') child.renderable = true;
    if (isNaN(child.x)) child.x = 0;
    if (isNaN(child.y)) child.y = 0;

    // 处理纹理加载
    if (child.texture && !child.texture.valid) {
      if (typeof child.texture.removeAllListeners === 'function') {
        child.texture.removeAllListeners('update');
      }
      if (typeof child.texture.once === 'function') {
        child.texture.once('update', () => {
          if (this._app && this._app.renderer) {
            this._app.renderer.render(this._app.stage);
          }
        });
      }
    }
  };
  // 节点添加到图表时的初始化
  PixiStageNode.prototype.onAdded = function() {
    Logger.info('PixiStageNode', '节点已添加到图表');

    // 设置输入连接点为绿色，表示正在运行
    if (this.inputs && this.inputs[0]) {
      this.inputs[0].color = "#0f0";
    }

    // 初始化舞台
    this._initStage();

    // 启动渲染循环
    if (!this._rafId) {
      const loop = () => {
        if (this.graph && this.graph.status === 1) { // 只在图表运行时执行
          this.onExecute();
        }
        this._rafId = requestAnimationFrame(loop);
      };
      this._rafId = requestAnimationFrame(loop);
    }

    // 监听窗口大小变化，重新适应canvas尺寸
    if (!this._resizeHandler) {
      this._resizeHandler = () => {
        if (this._app && this._previewContainer) {
          setTimeout(() => {
            this._fitCanvasToContainer();
          }, 100); // 延迟确保容器尺寸已更新
        }
      };
      window.addEventListener('resize', this._resizeHandler);
    }

    // 确保图表处于运行状态
    if (this.graph) {
      this.graph.start();
    }
  };

  PixiStageNode.prototype.onRemoved = function() {
    Logger.info('PixiStageNode', '节点已从图表移除');

    // 停止渲染循环
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }

    // 移除resize监听器
    if (this._resizeHandler) {
      window.removeEventListener('resize', this._resizeHandler);
      this._resizeHandler = null;
    }

    // 清理预览容器
    if (this._previewContainer && this._previewContainer.parentElement) {
      this._previewContainer.parentElement.removeChild(this._previewContainer);
      this._previewContainer = null;
    }

    // 销毁Pixi应用
    if (this._app) {
      this._app.destroy(true);
      this._app = null;
    }
  };

  // 添加输出端口
  PixiStageNode.prototype.onStart = function() {
    // 添加输出端口 - 输出Pixi应用实例
    if (!this.outputs || this.outputs.length === 0) {
      this.addOutput('App', 'pixi_app');
    }
  };

  LiteGraph.registerNodeType('scene/pixiStage', PixiStageNode);
}
