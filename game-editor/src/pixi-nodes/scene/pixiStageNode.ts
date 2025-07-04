import { Application } from 'pixi.js';
import { Logger } from '../../pixiNodeLogger';

export function registerPixiStageNode(LiteGraph: any) {
  function PixiStageNode(this: any) {
    this.addInput('Children', 'pixi_display_object,array');
    this.properties = { width: 640, height: 480, background: '#222' }; // 预览窗口默认尺寸
    this._app = null;
    this._canvasDiv = null; // 节点内canvas容器
    this.title = 'Pixi Stage (实时)';
    this.size = [180, 60]; // 节点使用默认尺寸
    this.boxcolor = "#050"; // 设置节点框的颜色为绿色，表示运行中
    // 只保留悬浮窗口方案，不再强制占位
  }

  PixiStageNode.prototype._initStage = function() {
    // 只创建一次canvas和Pixi Application
    if (this._app) {
      return;
    }
    // 节点内canvas容器
    if (!this._canvasDiv) {
      this._canvasDiv = document.createElement('div');
      // 固定在右下角
      this._canvasDiv.style.position = 'fixed';
      this._canvasDiv.style.right = '32px';
      this._canvasDiv.style.bottom = '32px';
      this._canvasDiv.style.width = this.properties.width + 'px';
      this._canvasDiv.style.height = this.properties.height + 'px';
      this._canvasDiv.style.background = '#111';
      this._canvasDiv.style.border = '2px solid #888';
      this._canvasDiv.style.boxShadow = '0 2px 12px #0008';
      this._canvasDiv.style.overflow = 'hidden';
      this._canvasDiv.style.pointerEvents = 'auto';
      this._canvasDiv.style.zIndex = '999';
      // 关闭按钮
      const closeBtn = document.createElement('button');
      closeBtn.textContent = '×';
      closeBtn.title = '关闭';
      closeBtn.style.position = 'absolute';
      closeBtn.style.top = '2px';
      closeBtn.style.right = '4px';
      closeBtn.style.zIndex = '30';
      closeBtn.style.background = '#222';
      closeBtn.style.color = '#fff';
      closeBtn.style.border = 'none';
      closeBtn.style.fontSize = '18px';
      closeBtn.style.cursor = 'pointer';
      closeBtn.style.width = '28px';
      closeBtn.style.height = '28px';
      closeBtn.style.borderRadius = '4px';
      closeBtn.onmouseenter = () => closeBtn.style.background = '#444';
      closeBtn.onmouseleave = () => closeBtn.style.background = '#222';
      closeBtn.onclick = (e) => {
        e.stopPropagation();
        if (this._canvasDiv && this._canvasDiv.parentElement) {
          this._canvasDiv.parentElement.removeChild(this._canvasDiv);
        }
        if (this._app) {
          this._app.destroy(true);
          this._app = null;
        }
      };
      this._canvasDiv.appendChild(closeBtn);
      // 插入到 #main-content
      const mainContent = document.getElementById('main-content');
      if (mainContent && !mainContent.contains(this._canvasDiv)) {
        mainContent.appendChild(this._canvasDiv);
      }
    }
    // Pixi v8: Application需await init
    this._app = new Application();
    this._app.init({
      width: this.properties.width,
      height: this.properties.height,
      background: this.properties.background,
      autoStart: true,
      resizeTo: this._canvasDiv
    }).then(() => {
      if (this._canvasDiv && !this._canvasDiv.contains(this._app.canvas)) {
        this._app.canvas.style.width = '100%';
        this._app.canvas.style.height = '100%';
        this._canvasDiv.appendChild(this._app.canvas);
        const w = Math.round(this._canvasDiv.clientWidth);
        const h = Math.round(this._canvasDiv.clientHeight);
        if (this._app && this._app.renderer && typeof this._app.renderer.resize === 'function') {
          this._app.renderer.resize(w, h);
        }
        // 已移除默认红色矩形，实际渲染交给 onExecute 的 children
      }
    }).catch((err: any) => {
      Logger.error('PixiStageNode', 'Pixi Application init error:', err);
    });
  };

  PixiStageNode.prototype.onExecute = function() {
    // console.log('[PixiStageNode] onExecute called, this.id =', this.id);
    // 实时渲染：每帧都处理 Children
    // 保证canvas和容器始终存在
    if (!this._app) {
      Logger.warn('PixiStageNode', '_app not found, calling _initStage');
      this._initStage(this);
    }
    // 保证canvasDiv已挂载到右下角，并同步宽高
    if (this._canvasDiv) {
      // 固定为预览窗口尺寸
      this._canvasDiv.style.width = this.properties.width + 'px';
      this._canvasDiv.style.height = this.properties.height + 'px';
      // resize renderer
      if (this._app && this._app.renderer && typeof this._app.renderer.resize === 'function') {
        this._app.renderer.resize(this.properties.width, this.properties.height);
      }
    } else {
      Logger.warn('PixiStageNode', '_canvasDiv missing in onExecute');
    }
    // 渲染children
    const children = this.getInputData(0);
    
                
    if (this._app && this._app.stage) {
      // 清除舞台现有内容
      this._app.stage.removeChildren();
      if (Array.isArray(children)) {
        for (const child of children) {
          if (child) {
            if (typeof child.visible !== 'undefined') child.visible = true;
            if (typeof child.renderable !== 'undefined') child.renderable = true;
            if (isNaN(child.x)) child.x = 0;
            if (isNaN(child.y)) child.y = 0;
            if (child.width === 0 || child.height === 0) {
              Logger.warn('PixiStageNode', 'Child has zero width/height:', child.width, 'x', child.height);
            }
            // 纹理监听（可选，通常无需日志）
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
            try {
              this._app.stage.addChild(child);
            } catch (error) {
              Logger.error('PixiStageNode', 'Error adding child to stage:', error);
            }
          }
        }
      } else if (children) {
        if (typeof children.visible !== 'undefined') children.visible = true;
        if (typeof children.renderable !== 'undefined') children.renderable = true;
        if (isNaN(children.x)) children.x = 0;
        if (isNaN(children.y)) children.y = 0;
        if (children.texture && !children.texture.valid) {
          if (typeof children.texture.removeAllListeners === 'function') {
            children.texture.removeAllListeners('update');
          }
          if (typeof children.texture.once === 'function') {
            children.texture.once('update', () => {
              if (this._app && this._app.renderer) {
                this._app.renderer.render(this._app.stage);
              }
            });
          }
        }
        try {
          this._app.stage.addChild(children);
        } catch (error) {
          Logger.error('PixiStageNode', 'Error adding single child to stage:', error);
        }
      } else {
        // 修改为debug级别，避免频繁输出无意义警告
        Logger.debug('PixiStageNode', 'No children to add to stage');
      }
    } else {
      Logger.warn('PixiStageNode', '_app or _app.stage missing in onExecute');
    }
    // 不再输出 app
  };
  // 实时刷新: 用 ticker/requestAnimationFrame 保证每帧都执行 onExecute
  PixiStageNode.prototype.onAdded = function() {
    if (!this._rafId) {
      console.log('[PixiStageNode] Starting render loop');
      // 设置输入连接点为绿色，表示正在运行
      if (this.inputs && this.inputs[0]) {
        this.inputs[0].color = "#0f0";
      }
      const loop = () => {
        if (this.graph) {
          // 强制设置 graph 为运行状态
          this.graph.status = 1; // RUNNING
          this.graph.running = true;
          this.onExecute();
        }
        this._rafId = requestAnimationFrame(loop);
      };
      this._rafId = requestAnimationFrame(loop);
      
      // 确保节点连接时触发更新
      if (this.graph) {
        this.graph.start();
      }
    }
  };
  PixiStageNode.prototype.onRemoved = function() {
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
    if (this._canvasDiv && this._canvasDiv.parentElement) {
      this._canvasDiv.parentElement.removeChild(this._canvasDiv);
    }
    if (this._app) {
      this._app.destroy(true);
      this._app = null;
    }
  };

  LiteGraph.registerNodeType('scene/pixiStage', PixiStageNode);
}
