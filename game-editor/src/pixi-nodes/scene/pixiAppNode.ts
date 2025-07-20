
import { Logger } from '../../pixiNodeLogger';

export function registerPixiAppNode(LiteGraph: any) {
  function PixiAppNode(this: any) {
    this.addInput('Children', 'pixi_display_object,array');
    this.addOutput('GameData', 'game_data');

    this.properties = {
      width: 750,
      height: 1334,
      background: '#1a1a1a',
      title: 'My Game'
    };

    this.title = 'Pixi App (代码生成)';
    this.size = [200, 120];
    this.boxcolor = "#840"; // 橙色表示代码生成节点
    this.color = "#840";

    // 添加属性控制
    this.addWidget('number', 'Width', this.properties.width, (v: number) => {
      this.properties.width = v;
      this._triggerCodeGeneration();
    });

    this.addWidget('number', 'Height', this.properties.height, (v: number) => {
      this.properties.height = v;
      this._triggerCodeGeneration();
    });

    this.addWidget('text', 'Background', this.properties.background, (v: string) => {
      this.properties.background = v;
      this._triggerCodeGeneration();
    });

    this.addWidget('text', 'Title', this.properties.title, (v: string) => {
      this.properties.title = v;
      this._triggerCodeGeneration();
    });
  }
  PixiAppNode.prototype.onExecute = function() {
    // 收集输入的子对象数据
    const children = this.getInputData(0);

    // 生成游戏数据结构
    const gameData = {
      config: {
        width: this.properties.width,
        height: this.properties.height,
        background: this.properties.background,
        title: this.properties.title
      },
      children: this._processChildren(children),
      timestamp: Date.now()
    };

    // 输出游戏数据
    this.setOutputData(0, gameData);

    // 触发代码生成
    this._triggerCodeGeneration();
  };

  PixiAppNode.prototype._processChildren = function(children: any) {
    if (!children) return [];

    if (Array.isArray(children)) {
      return children.map(child => this._serializeChild(child)).filter(Boolean);
    } else {
      const serialized = this._serializeChild(children);
      return serialized ? [serialized] : [];
    }
  };

  PixiAppNode.prototype._serializeChild = function(child: any) {
    if (!child) return null;

    // 基础序列化 - 根据不同节点类型提取数据
    const serialized: any = {
      type: child.constructor?.name || 'Unknown',
      x: child.x || 0,
      y: child.y || 0,
      visible: child.visible !== false,
      alpha: child.alpha || 1
    };

    // 文本节点特殊处理
    if (child.text !== undefined) {
      serialized.nodeType = 'text';
      serialized.text = child.text;
      serialized.style = child.style ? {
        fontSize: child.style.fontSize,
        fill: child.style.fill,
        fontFamily: child.style.fontFamily
      } : {};
    }

    // 图形节点特殊处理
    if (child.constructor?.name === 'Graphics') {
      serialized.nodeType = 'graphics';
      // 这里可以扩展图形数据的序列化
    }

    return serialized;
  };

  PixiAppNode.prototype._triggerCodeGeneration = function() {
    // 通知UI系统进行代码生成
    if (this.graph && this.graph.onNodeChanged) {
      this.graph.onNodeChanged(this);
    }

    // 发送事件给UI系统
    const event = new CustomEvent('pixi-app-node-changed', {
      detail: {
        nodeId: this.id,
        properties: this.properties,
        gameData: this.getOutputData(0)
      }
    });
    document.dispatchEvent(event);
  };

  PixiAppNode.prototype.onAdded = function() {
    Logger.info('PixiAppNode', '代码生成节点已添加');

    // 清除PixiStageNode的预览
    this._clearStageNodePreview();

    // 切换到iframe预览模式
    this._switchToIframeMode();

    // 设置输入连接点颜色
    if (this.inputs && this.inputs[0]) {
      this.inputs[0].color = "#f80"; // 橙色表示代码生成
    }
  };

  PixiAppNode.prototype.onRemoved = function() {
    Logger.info('PixiAppNode', '代码生成节点已移除');

    // 发送移除事件
    const event = new CustomEvent('pixi-app-node-removed', {
      detail: { nodeId: this.id }
    });
    document.dispatchEvent(event);
  };

  PixiAppNode.prototype._clearStageNodePreview = function() {
    // 查找并清理PixiStageNode的预览
    const stageContainer = document.getElementById('pixi-stage-container');
    if (stageContainer) {
      stageContainer.innerHTML = '';
      stageContainer.style.display = 'none';
    }

    // 隐藏浮动预览面板中的直接渲染内容
    const floatingPreview = document.getElementById('floating-game-preview');
    if (floatingPreview) {
      const previewContent = floatingPreview.querySelector('.floating-preview-content');
      if (previewContent) {
        // 清空现有内容，准备iframe
        previewContent.innerHTML = '';
      }
    }
  };

  PixiAppNode.prototype._switchToIframeMode = function() {
    // 确保预览面板显示
    const floatingPreview = document.getElementById('floating-game-preview');
    if (floatingPreview) {
      floatingPreview.classList.add('visible');

      const previewContent = floatingPreview.querySelector('.floating-preview-content');
      if (previewContent) {
        // 创建iframe用于游戏预览
        const iframe = document.createElement('iframe');
        iframe.className = 'floating-preview-iframe';
        iframe.src = './build/index.html';
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';
        iframe.style.borderRadius = '8px';
        iframe.style.background = this.properties.background;

        previewContent.appendChild(iframe);

        Logger.info('PixiAppNode', '已切换到iframe预览模式');
      }
    }
  };

  LiteGraph.registerNodeType('scene/PixiApp', PixiAppNode);
}
