import { Graphics } from 'pixi.js';
import { NodeColors, NodeSizes } from '../../nodesConfig';
import { BaseDisplayNode } from '../base/BaseDisplayNode';

export function registerPixiTriangleNode(LiteGraph: any) {
  class PixiTriangleNode extends BaseDisplayNode {
    _graphics: Graphics | null = null;

    constructor() {
      super();
      
      this.title = 'Pixi Triangle';
      this.size = NodeSizes.medium;
      this.boxcolor = NodeColors.render;
      this.color = NodeColors.render;
      
      // 三角形的属性
      this.properties = {
        ...this.properties,
        size: 100,         // 三角形大小（从中心到顶点的距离）
        rotation: 0,       // 旋转角度（弧度）
        equilateral: true  // 是否是等边三角形
      };
      
      // 添加控制小部件
      this.addWidget('number', 'size', this.properties.size, (v: number) => { 
        this.properties.size = v; 
        this.onDisplayPropertyChanged(); 
      });
      
      this.addWidget('number', 'rotation', this.properties.rotation, (v: number) => { 
        this.properties.rotation = v; 
        this.onDisplayPropertyChanged(); 
      });
      
      this.addWidget('toggle', 'equilateral', this.properties.equilateral, (v: boolean) => { 
        this.properties.equilateral = v; 
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
      this.drawTriangle();
      this.setOutputData(0, this._graphics);
    }

    onDisplayPropertyChanged() {
      if (this._graphics) {
        this.drawTriangle();
      }
    }

    private drawTriangle() {
      if (!this._graphics) return;
      this._graphics.clear();
      this.applyDisplayProperties(this._graphics);
      
      // 颜色处理：支持十六进制颜色（来自ColorPickerNode）
      let colorHex = this.properties.color || '#ffffff';
      if (!/^#[0-9A-F]{6}$/i.test(colorHex)) {
        colorHex = '#ffffff'; // 默认白色
      }
      const colorInt = parseInt(colorHex.replace('#', ''), 16);
      
      const size = this.properties.size;
      const rotation = this.properties.rotation;
      
      this._graphics.beginFill(colorInt);
      
      if (this.properties.equilateral) {
        // 绘制等边三角形
        // 计算三个顶点的位置
        const x1 = 0;
        const y1 = -size;
        const x2 = size * Math.cos(Math.PI / 6);
        const y2 = size * Math.sin(Math.PI / 6);
        const x3 = -size * Math.cos(Math.PI / 6);
        const y3 = size * Math.sin(Math.PI / 6);
        
        // 应用旋转
        const cos = Math.cos(rotation);
        const sin = Math.sin(rotation);
        
        const rotatedX1 = x1 * cos - y1 * sin;
        const rotatedY1 = x1 * sin + y1 * cos;
        const rotatedX2 = x2 * cos - y2 * sin;
        const rotatedY2 = x2 * sin + y2 * cos;
        const rotatedX3 = x3 * cos - y3 * sin;
        const rotatedY3 = x3 * sin + y3 * cos;
        
        // 绘制三角形
        this._graphics.moveTo(rotatedX1, rotatedY1);
        this._graphics.lineTo(rotatedX2, rotatedY2);
        this._graphics.lineTo(rotatedX3, rotatedY3);
        this._graphics.lineTo(rotatedX1, rotatedY1);
      } else {
        // 绘制不规则三角形（简单向下的三角形）
        this._graphics.moveTo(0, -size);
        this._graphics.lineTo(size, size);
        this._graphics.lineTo(-size, size);
        this._graphics.lineTo(0, -size);
      }
      
      this._graphics.endFill();
    }
  }

  LiteGraph.registerNodeType('render/triangle', PixiTriangleNode);
}
