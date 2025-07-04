import { Text } from 'pixi.js';
import { NodeColors } from '../../nodesConfig';
import { BaseDisplayNode } from '../base/BaseDisplayNode';

export function registerClickCounterNode(LiteGraph: any) {
  class ClickCounterNode extends BaseDisplayNode {
    _text: Text | null = null;
    _clickCount: number = 0;

    constructor() {
      super();

      this.title = 'Click Counter';
      this.size = [180, 320]; // 设置更大的高度以容纳所有控件
      this.boxcolor = NodeColors.render;
      this.color = NodeColors.render;
      
      // 计数器特有属性
      this.properties = {
        ...this.properties,
        prefix: 'Clicks: ',
        fontSize: 32,
        fontFamily: 'Arial',
        textColor: '#FFD700'
      };
      
      // 添加事件输入
      this.addInput('click', 'event');
      
      // 添加属性控件
      this.addWidget('text', 'prefix', this.properties.prefix, (v: string) => { 
        this.properties.prefix = v; 
        this.updateDisplay(); 
      });
      this.addWidget('number', 'fontSize', this.properties.fontSize, (v: number) => { 
        this.properties.fontSize = v; 
        this.updateDisplay(); 
      });
      this.addWidget('text', 'fontFamily', this.properties.fontFamily, (v: string) => { 
        this.properties.fontFamily = v; 
        this.updateDisplay(); 
      });
      this.addWidget('text', 'textColor', this.properties.textColor, (v: string) => { 
        this.properties.textColor = v; 
        this.updateDisplay(); 
      });
      
      this.addOutput('counter', 'pixi_display_object');
    }

    onExecute() {
      // 调用父类处理基础显示属性
      super.onExecute();
      
      // 检查是否有点击事件输入
      const clickEvent = this.getInputData(1); // 第二个输入（第一个是color）
      if (clickEvent) {
        this._clickCount++;
        this.updateDisplay();
      }
      
      if (!this._text) {
        this._text = new Text();
        this.updateDisplay();
      }
      
      this.setOutputData(0, this._text);
    }

    private updateDisplay() {
      if (!this._text) return;
      
      // 更新文字内容和样式
      this._text.text = this.properties.prefix + this._clickCount;
      this._text.style = {
        fontSize: this.properties.fontSize,
        fontFamily: this.properties.fontFamily,
        fill: this.properties.textColor
      };
      
      // 应用基础显示属性（位置、透明度等）
      this.applyDisplayProperties(this._text);
      
      // 居中对齐
      this._text.anchor.set(0.5);
    }

    onDisplayPropertyChanged() {
      this.updateDisplay();
    }
  }

  LiteGraph.registerNodeType('render/clickCounter', ClickCounterNode);
}
