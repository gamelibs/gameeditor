import { Text } from 'pixi.js';
import { NodeColors } from '../../nodesConfig';
import { BaseDisplayNode } from '../base/BaseDisplayNode';

export function registerTextNode(LiteGraph: any) {
  class TextNode extends BaseDisplayNode {
    _text: Text | null = null;

    constructor() {
      super();

      this.title = 'Text';
      this.size = [200, 280]; // 自定义较高的尺寸来容纳所有widgets
      this.boxcolor = NodeColors.render;
      this.color = NodeColors.render;
      
      // 文字特有属性
      this.properties = {
        ...this.properties,
        text: 'Hello World',
        fontSize: 48,
        fontFamily: 'Arial',
        textColor: '#FFFFFF'
      };
      
      // 添加文字属性控件
      this.addWidget('text', 'text', this.properties.text, (v: string) => { 
        this.properties.text = v; 
        this.onDisplayPropertyChanged(); 
      });
      this.addWidget('number', 'fontSize', this.properties.fontSize, (v: number) => { 
        this.properties.fontSize = v; 
        this.onDisplayPropertyChanged(); 
      });
      this.addWidget('text', 'fontFamily', this.properties.fontFamily, (v: string) => { 
        this.properties.fontFamily = v; 
        this.onDisplayPropertyChanged(); 
      });
      this.addWidget('text', 'textColor', this.properties.textColor, (v: string) => { 
        this.properties.textColor = v; 
        this.onDisplayPropertyChanged(); 
      });
      
      this.addOutput('text', 'pixi_display_object');
    }

    onExecute() {
      // 调用父类处理基础显示属性
      super.onExecute();
      
      if (!this._text) {
        this._text = new Text();
      }
      
      this.updateText();
      this.setOutputData(0, this._text);
    }

    onDisplayPropertyChanged() {
      if (this._text) {
        this.updateText();
      }
    }

    private updateText() {
      if (!this._text) return;
      
      // 更新文字内容和样式
      this._text.text = this.properties.text;
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
  }

  LiteGraph.registerNodeType('render/text', TextNode);
}
