
import { Application } from 'pixi.js';
import { NodeColors, NodeSizes } from '../../nodesConfig';

export function registerPixiAppNode(LiteGraph: any) {
  function PixiAppNode(this: any) {
    this.addInput('Children', 'pixi_display_object,array'); // 支持多个子节点
    this.addOutput('app', 'pixi_app');
    this.properties = { width: 640, height: 480, background: '#222' };
    this._app = null;
    this.title = 'Pixi Application';
    this.size = NodeSizes.medium;
    // 场景类节点统一深色
    this.boxcolor = NodeColors.scene;
    this.color = NodeColors.scene;
  }
  PixiAppNode.prototype.onExecute = async function() {
    // 1. 初始化 Pixi Application
    if (!this._app) {
      // 只添加一次canvas到页面，并支持缩放和拖动
      let container = document.getElementById('pixi-canvas-container') as HTMLDivElement | null;
      if (!container) {
        container = document.createElement('div');
        container.id = 'pixi-canvas-container';
        container.style.margin = '10px';
        container.style.position = 'absolute';
        container.style.left = '40px';
        container.style.top = '80px';
        container.style.border = '2px solid #888';
        container.style.background = '#111';
        container.style.zIndex = '20';
        container.style.resize = 'both';
        container.style.overflow = 'auto';
        container.style.minWidth = '100px';
        container.style.minHeight = '100px';
        container.style.maxWidth = '90vw';
        container.style.maxHeight = '80vh';
        container.style.boxShadow = '0 2px 12px #0008';
        // 设置初始尺寸为节点属性
        container.style.width = (this.properties.width || 640) + 'px';
        container.style.height = (this.properties.height || 480) + 'px';

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
          container?.remove();
          if (this._app) {
            // 彻底销毁 Pixi Application，释放所有资源和事件
            this._app.destroy(true);
            this._app = null;
          }
        };
        container.appendChild(closeBtn);

        document.getElementById('main-content')?.appendChild(container);

        // 拖动功能
        let isDragging = false;
        let dragOffsetX = 0;
        let dragOffsetY = 0;
        container.onmousedown = (e: MouseEvent) => {
          if (e.target === container) {
            isDragging = true;
            dragOffsetX = e.clientX - container.offsetLeft;
            dragOffsetY = e.clientY - container.offsetTop;
            document.body.style.userSelect = 'none';
          }
        };
        document.addEventListener('mousemove', (e) => {
          if (!container) return;
          if (isDragging) {
            container.style.left = (e.clientX - dragOffsetX) + 'px';
            container.style.top = (e.clientY - dragOffsetY) + 'px';
          }
        });
        document.addEventListener('mouseup', () => {
          isDragging = false;
          document.body.style.userSelect = '';
        });

        // 缩放功能（通过容器resize，canvas自适应）
        let lastW = this.properties.width;
        let lastH = this.properties.height;
        const observer = new ResizeObserver(() => {
          if (!container) return;
          // 只在尺寸变化时resize，避免反复触发和闪烁
          const w = Math.round(container.clientWidth);
          const h = Math.round(container.clientHeight);
          if ((w !== lastW || h !== lastH) && this._app && this._app.renderer && typeof this._app.renderer.resize === 'function') {
            this._app.renderer.resize(w, h);
            lastW = w;
            lastH = h;
          }
        });
        observer.observe(container);
      }
      // Pixi v8: Application需await init
      this._app = new Application();
      await this._app.init({
        width: this.properties.width,
        height: this.properties.height,
        background: this.properties.background,
        autoStart: true,
        resizeTo: container || window
      });
      // v8: 挂载canvas，确保canvas尺寸与容器一致
      if (container && !container.contains(this._app.canvas)) {
        this._app.canvas.style.width = '100%';
        this._app.canvas.style.height = '100%';
        container.appendChild(this._app.canvas);
        // 立即resize一次，防止初始尺寸不符
        const w = Math.round(container.clientWidth);
        const h = Math.round(container.clientHeight);
        if (this._app && this._app.renderer && typeof this._app.renderer.resize === 'function') {
          this._app.renderer.resize(w, h);
        }
      }
    }
    // 2. 处理输入的 Children（DisplayObject数组）
    const children = this.getInputData(0);
    if (this._app) {
      // 清空 stage
      this._app.stage.removeChildren();
      // 批量添加所有子对象
      if (Array.isArray(children)) {
        for (const child of children) {
          if (child && child.constructor && child.constructor.name && child.constructor.name.startsWith('Graphics')) {
            this._app.stage.addChild(child);
          } else if (child && child.render) {
            // 兼容其他 DisplayObject
            this._app.stage.addChild(child);
          }
        }
      } else if (children) {
        // 兼容单个对象
        this._app.stage.addChild(children);
      }
    }
    this.setOutputData(0, this._app);
  };
  LiteGraph.registerNodeType('scene/main', PixiAppNode);
}
