import { Graphics } from 'pixi.js';
import { NodeColors, NodeSizes } from '../../nodesConfig';
import { BaseDisplayNode } from '../base/BaseDisplayNode';


export class PixiRectNode extends BaseDisplayNode {
  _graphics: Graphics | null = null;

  constructor() {
    super();

    this.title = 'Pixi Rectangle';
    this.size = NodeSizes.medium;
    this.boxcolor = NodeColors.render;
    this.color = NodeColors.render;
    
    // 扩展属性
    this.properties = {
      ...this.properties,
      width: 100,
      height: 100,
      uniqueId: `rect_${Math.floor(Math.random() * 10000000)}`
    };
    
    // 添加新属性的控件
    this.addWidget('number', 'width', this.properties.width, (v: number) => { 
      this.properties.width = v; 
      this.onDisplayPropertyChanged(); 
    });
    this.addWidget('number', 'height', this.properties.height, (v: number) => { 
      this.properties.height = v; 
      this.onDisplayPropertyChanged(); 
    });
    
    this.addOutput('graphics', 'pixi_display_object');
  }

  onExecute() {
    // 首先调用父类的onExecute以处理颜色输入
    super.onExecute();
    
    if (!this._graphics) {
      this._graphics = new Graphics();
      this._graphics.visible = true;
    }
    this.drawRect();
    this.setOutputData(0, this._graphics);
  }

  onDisplayPropertyChanged() {
    if (this._graphics) {
      this.drawRect();
    }
  }

  private drawRect() {
    if (!this._graphics) return;
    this._graphics.clear();
    this.applyDisplayProperties(this._graphics);
    
    // 颜色处理改进：支持十六进制颜色（来自ColorPickerNode）
    let colorHex = this.properties.color || '#ffffff';
    if (!/^#[0-9A-F]{6}$/i.test(colorHex)) {
      colorHex = '#ffffff'; // 默认白色
    }
    const colorInt = parseInt(colorHex.replace('#', ''), 16);
    
    this._graphics.beginFill(colorInt);
    this._graphics.drawRect(0, 0, this.properties.width, this.properties.height);
    this._graphics.endFill();
  }

  // === 代码生成相关方法 ===

  /**
   * 获取JS导入声明
   */
  getImports(): string[] {
    return [
      "import { Graphics } from 'pixi.js';"
    ];
  }

  /**
   * 获取变量名前缀
   */
  getVariablePrefix(): string {
    return 'rectangle';
  }

  /**
   * 生成代码模板
   */
  getCodeTemplate(): string {
    return `
// 创建矩形: {{title}}
const {{varName}} = new PIXI.Graphics();
{{varName}}.beginFill({{colorInt}});
{{varName}}.drawRect(0, 0, {{width}}, {{height}});
{{varName}}.endFill();

// 设置位置和其他属性
{{varName}}.x = {{x}};
{{varName}}.y = {{y}};
{{varName}}.alpha = {{alpha}};
{{varName}}.visible = {{visible}};
{{varName}}.rotation = {{rotation}};
{{varName}}.scale.set({{scaleX}}, {{scaleY}});

console.log('✅ 矩形创建完成:', '{{title}}');
`;
  }

  /**
   * 处理节点属性
   */
  processProperties(_context: any): Record<string, any> {
    // 处理颜色转换
    let colorHex = this.properties.color || '#ffffff';
    if (!/^#[0-9A-F]{6}$/i.test(colorHex)) {
      colorHex = '#ffffff';
    }
    const colorInt = parseInt(colorHex.replace('#', ''), 16);

    return {
      title: this.title || 'Rectangle',
      width: this.properties.width || 100,
      height: this.properties.height || 100,
      colorHex: colorHex,
      colorInt: `0x${colorInt.toString(16).padStart(6, '0')}`,
      x: this.properties.x || 0,
      y: this.properties.y || 0,
      alpha: this.properties.alpha || 1,
      visible: this.properties.visible !== false,
      rotation: this.properties.rotation || 0,
      scaleX: this.properties.scaleX || 1,
      scaleY: this.properties.scaleY || 1,
      uniqueId: this.properties.uniqueId || `rect_${Date.now()}`
    };
  }

  /**
   * 处理节点输入
   */
  processInputs(context: any): Record<string, string> {
    const inputs: Record<string, string> = {};
    
    // 获取连接的输入变量名
    if (context.getInputVarName) {
      // 如果有颜色输入连接
      if (this.getInputData && this.getInputData(0)) {
        inputs.color = context.getInputVarName(this, 0);
      }
    }
    
    return inputs;
  }
}

export function registerPixiRectNode(LiteGraph: any) {
  LiteGraph.registerNodeType('render/rect', PixiRectNode);
}