import { Graphics } from 'pixi.js';
import { NodeColors, NodeSizes } from '../../nodesConfig';
import { BaseDisplayNode } from '../base/BaseDisplayNode';

export function registerPixiCircleNode(LiteGraph: any) {
  class PixiCircleNode extends BaseDisplayNode {
    _graphics: Graphics | null = null;

    constructor() {
      super();
      
      this.title = 'Pixi Circle';
      this.size = NodeSizes.medium;
      this.boxcolor = NodeColors.render;
      this.color = NodeColors.render;
      this.properties = {
        ...this.properties,
        radius: 50
      };
      this.addWidget('number', 'radius', this.properties.radius, (v: number) => { this.properties.radius = v; this.onDisplayPropertyChanged(); });
      this.addOutput('graphics', 'pixi_display_object');
    }

    onExecute() {
      // 首先调用父类的onExecute以处理颜色输入
      super.onExecute();
      
      if (!this._graphics) {
        this._graphics = new Graphics();
        this._graphics.visible = true;
      }
      this.drawCircle();
      this.setOutputData(0, this._graphics);
    }

    onDisplayPropertyChanged() {
      if (this._graphics) {
        this.drawCircle();
      }
    }

    private drawCircle() {
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
      this._graphics.drawCircle(0, 0, this.properties.radius);
      this._graphics.endFill();
    }
  }

  LiteGraph.registerNodeType('render/circle', PixiCircleNode);
}
