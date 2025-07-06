import { BaseNode } from '../base/BaseNode';
import { GamePreviewManager } from '../../runtime/GamePreviewManager';

/**
 * PixiStageNode - 游戏根舞台节点
 * 
 * 这是游戏的核心舞台节点，负责：
 * 1. 管理整个游戏的根容器
 * 2. 连接到游戏预览区域，而不是创建独立窗口
 * 3. 处理场景切换和适配
 * 4. 作为所有UI层和游戏对象的根容器
 */
export class PixiStageNode extends BaseNode {
  private gamePreview: GamePreviewManager;

  constructor() {
    super();
    
    this.title = 'Pixi Stage (游戏舞台)';
    this.boxcolor = "#050"; // 绿色表示这是系统级的核心节点
    
    // 获取游戏预览管理器实例
    this.gamePreview = GamePreviewManager.getInstance();
    
    // 基本属性
    this.properties = {
      ...this.properties,
      width: 750,
      height: 1334,
      background: '#1a1a1a',
      autoResize: true,
      uniqueId: `pixi_stage_${Math.floor(Math.random() * 10000000)}`
    };
    
    // 添加输入端口 - 接收所有UI层和游戏对象
    this.addInput('UI Layers', 'pixi_display_object');
    this.addInput('Game Objects', 'pixi_display_object');
    
    // 添加输出端口 - 输出游戏应用实例
    this.addOutput('Game App', 'pixi_app');
    
    // 属性控制
    this.addWidget('number', 'Width', this.properties.width, (v: number) => {
      this.properties.width = v;
      this._updateGameConfig();
    });
    
    this.addWidget('number', 'Height', this.properties.height, (v: number) => {
      this.properties.height = v;
      this._updateGameConfig();
    });
    
    this.addWidget('text', 'Background', this.properties.background, (v: string) => {
      this.properties.background = v;
      this._updateGameConfig();
    });
    
    this.addWidget('toggle', 'Auto Resize', this.properties.autoResize, (v: boolean) => {
      this.properties.autoResize = v;
      this._updateGameConfig();
    });

    // 初始化游戏预览
    this._initializeGamePreview();
  }

  /**
   * 初始化游戏预览
   */
  private async _initializeGamePreview() {
    try {
      // 初始化游戏预览管理器
      await this.gamePreview.initialize('gamePreviewCanvas');
      console.log('✅ PixiStageNode: 游戏预览初始化成功');
    } catch (error) {
      console.error('❌ PixiStageNode: 游戏预览初始化失败', error);
    }
  }

  /**
   * 更新游戏配置
   */
  private _updateGameConfig() {
    const config = {
      width: this.properties.width,
      height: this.properties.height,
      backgroundColor: this.properties.background,
      resizeToFit: this.properties.autoResize
    };
    
    // 应用配置到游戏预览管理器
    if (this.gamePreview && this.gamePreview.updateConfig) {
      this.gamePreview.updateConfig(config);
    }
    
    console.log('🔧 PixiStageNode: 游戏配置已更新', config);
  }

  /**
   * 节点执行逻辑 - 作为游戏的根容器
   */
  onExecute() {
    try {
      // 获取游戏应用实例
      const app = this.gamePreview.getApp();
      if (!app) {
        console.warn('⚠️ PixiStageNode: 游戏应用未初始化');
        return;
      }

      // 处理UI层输入
      const uiLayers = this.getInputData(0);
      if (uiLayers) {
        if (Array.isArray(uiLayers)) {
          uiLayers.forEach(layer => {
            if (layer) this.gamePreview.addToStage(layer);
          });
        } else {
          this.gamePreview.addToStage(uiLayers);
        }
      }

      // 处理游戏对象输入
      const gameObjects = this.getInputData(1);
      if (gameObjects) {
        if (Array.isArray(gameObjects)) {
          gameObjects.forEach(obj => {
            if (obj) this.gamePreview.addToStage(obj);
          });
        } else {
          this.gamePreview.addToStage(gameObjects);
        }
      }

      // 输出游戏应用实例
      this.setOutputData(0, app);
      
    } catch (error) {
      console.error('❌ PixiStageNode: 执行出错', error);
    }
  }

  /**
   * 节点添加时的初始化
   */
  onAdded() {
    console.log('🎮 PixiStageNode: 游戏舞台节点已添加');
    
    // 确保游戏预览管理器已初始化
    this._initializeGamePreview();
  }

  /**
   * 节点移除时的清理
   */
  onRemoved() {
    // 注意：不要销毁整个游戏预览管理器，
    // 因为可能有其他节点也在使用它
    console.log('🗑️ PixiStageNode: 节点已移除');
  }

  // === 代码生成相关方法 ===

  /**
   * 获取JS导入声明
   */
  getImports(): string[] {
    return [
      "import { Application, Container } from 'pixi.js';"
    ];
  }

  /**
   * 获取变量名前缀
   */
  getVariablePrefix(): string {
    return 'gameStage';
  }

  /**
   * 生成代码模板
   */
  getCodeTemplate(): string {
    return `
// 游戏舞台初始化
const {{varName}} = (() => {
  // 创建PIXI应用实例
  const app = new PIXI.Application();
  
  // 初始化应用
  app.init({
    width: {{width}},
    height: {{height}},
    background: '{{background}}',
    antialias: true,
    autoDensity: true,
    resolution: window.devicePixelRatio || 1
  }).then(() => {
    console.log('🎮 游戏应用初始化完成');
    
    // 添加到页面
    const gameContainer = document.getElementById('game-container') || document.body;
    gameContainer.appendChild(app.canvas);
    
    // 设置画布样式
    app.canvas.style.display = 'block';
    app.canvas.style.margin = '0 auto';
    
    {{#if autoResize}}
    // 响应式调整
    const resizeGame = () => {
      const parent = app.canvas.parentElement;
      if (parent) {
        const { clientWidth, clientHeight } = parent;
        app.renderer.resize(Math.min(clientWidth, {{width}}), Math.min(clientHeight, {{height}}));
      }
    };
    
    window.addEventListener('resize', resizeGame);
    resizeGame();
    {{/if}}
    
    // 启动渲染循环
    app.start();
  });
  
  return {
    app,
    stage: app.stage,
    addChild: (child) => app.stage.addChild(child),
    removeChild: (child) => app.stage.removeChild(child),
    clear: () => app.stage.removeChildren()
  };
})();

// 游戏舞台实例
const {{varName}}_stage = {{varName}}.stage;
`;
  }

  /**
   * 处理节点属性
   */
  processProperties(_context: any): Record<string, any> {
    return {
      width: this.properties.width || 750,
      height: this.properties.height || 1334,
      background: this.properties.background || '#1a1a1a',
      autoResize: this.properties.autoResize || true,
      uniqueId: this.properties.uniqueId || `game_stage_${Date.now()}`
    };
  }

  /**
   * 处理节点输入
   */
  processInputs(context: any): Record<string, string> {
    const inputs: Record<string, string> = {};
    
    // 获取连接的输入变量名
    if (context.getInputVarName) {
      inputs.uiLayers = context.getInputVarName(this, 0);
      inputs.gameObjects = context.getInputVarName(this, 1);
    }
    
    return inputs;
  }
}

/**
 * 注册PixiStageNode
 */
export function registerPixiStageNode(LiteGraph: any) {
  LiteGraph.registerNodeType("pixi/scene/pixiStage", PixiStageNode);
}
