import { Text, TextStyle } from 'pixi.js';
import { NodeColors } from '../../nodesConfig';
import { BaseDisplayNode } from '../base/BaseDisplayNode';

/**
 * TextDisplay Node - 纯文本显示节点
 * 功能：显示文本内容，可以接收外部数值作为文本内容
 */
export function registerTextDisplayNode(LiteGraph: any) {
  class TextDisplayNode extends BaseDisplayNode {
    _text: Text | null = null;

    constructor() {
      super();

      this.title = 'Text Display';
      this.size = [180, 300]; // 固定高度
      this.boxcolor = NodeColors.render;
      this.color = NodeColors.render;
      
      // 扩展属性
      this.properties = {
        ...this.properties,
        content: 'Hello World',
        prefix: '',
        suffix: '',
        fontSize: 24,
        fontFamily: 'Arial',
        textColor: '#FFFFFF'
      };
      
      // 添加数值输入端口（除了基类的color输入）
      this.addInput('value', 'number');   // 数值输入
      this.addInput('text', 'string');    // 文本输入
      
      // 添加属性控件
      this.addWidget('text', 'content', this.properties.content, (v: string) => { 
        this.properties.content = v; 
        this.updateDisplay(); 
      });
      this.addWidget('text', 'prefix', this.properties.prefix, (v: string) => { 
        this.properties.prefix = v; 
        this.updateDisplay(); 
      });
      this.addWidget('text', 'suffix', this.properties.suffix, (v: string) => { 
        this.properties.suffix = v; 
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
      
      this.addOutput('text', 'pixi_display_object');
    }

    onExecute() {
      // 调用父类处理基础显示属性（包括颜色输入）
      super.onExecute();
      
      // 获取外部输入
      const valueInput = this.getInputData(1); // 数值输入
      const textInput = this.getInputData(2);  // 文本输入
      
      // 确定显示内容
      let displayContent = this.properties.content || "Hello World";
      
      if (textInput !== undefined && textInput !== null) {
        displayContent = String(textInput);
      } else if (valueInput !== undefined && valueInput !== null) {
        displayContent = String(valueInput);
      }
      
      // 添加前缀和后缀
      const prefix = this.properties.prefix || "";
      const suffix = this.properties.suffix || "";
      const finalText = prefix + displayContent + suffix;
      
      // 创建或更新文本对象
      if (!this._text) {
        this._text = new Text();
      }
      
      // 更新文本内容
      if (this._text.text !== finalText) {
        this._text.text = finalText;
        this.updateStyle();
        this.applyDisplayProperties(this._text);
      }
      
      this.setOutputData(0, this._text);
    }

    private updateDisplay() {
      if (!this._text) return;
      
      this.updateStyle();
      this.applyDisplayProperties(this._text);
    }
    
    private updateStyle() {
      if (!this._text) return;
      
      // 使用 Pixi.js v8 兼容的样式设置方式
      try {
        const style = new TextStyle({
          fontSize: this.properties.fontSize || 24,
          fontFamily: this.properties.fontFamily || 'Arial',
          fill: this.properties.textColor || '#FFFFFF'
        });
        
        this._text.style = style;
        this._text.anchor.set(this.properties.anchor || 0.5);
        
      } catch (error) {
        console.error('TextDisplayNode: Error updating style:', error);
        
        // 降级处理：直接设置属性
        if (this._text.style) {
          this._text.style.fontSize = this.properties.fontSize || 24;
          this._text.style.fontFamily = this.properties.fontFamily || 'Arial';
          this._text.style.fill = this.properties.textColor || '#FFFFFF';
        }
        this._text.anchor.set(this.properties.anchor || 0.5);
      }
    }

    onDisplayPropertyChanged() {
      this.updateDisplay();
    }
  }

  LiteGraph.registerNodeType('render/textDisplay', TextDisplayNode);
}
