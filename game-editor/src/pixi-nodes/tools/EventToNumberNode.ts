import { NodeColors } from '../../nodesConfig';
import { BaseNode } from '../base/BaseNode';

/**
 * EventToNumber Node - 事件转数值节点
 * 功能：将事件转换为数值增量，用于事件驱动的数值变化
 */
export function registerEventToNumberNode(LiteGraph: any) {
  class EventToNumberNode extends BaseNode {
    _lastTriggerTime: number = 0;
    _outputValue: number = 0;

    constructor() {
      super();
      
      this.title = 'Event to Number';
      this.size = [180, 180];
      this.boxcolor = NodeColors.tool;
      this.color = NodeColors.tool;
      
      // 属性定义
      this.properties = {
        incrementValue: 1,
        resetOnTrigger: false,
        outputMode: 'increment' // 'increment', 'pulse', 'toggle'
      };
      
      // 输入端口
      this.addInput('trigger', 'event');     // 触发事件
      this.addInput('value', 'number');      // 自定义增量值（可选）
      
      // 输出端口
      this.addOutput('number', 'number');    // 输出数值
      this.addOutput('triggered', 'event');  // 触发成功事件
      
      // 属性控件
      this.addWidget('number', 'incrementValue', this.properties.incrementValue, (v: number) => {
        this.properties.incrementValue = v;
      });
      
      this.addWidget('toggle', 'resetOnTrigger', this.properties.resetOnTrigger, (v: boolean) => {
        this.properties.resetOnTrigger = v;
      });
      
      this.addWidget('text', 'outputMode', this.properties.outputMode, (v: string) => {
        this.properties.outputMode = v;
      });
    }
    
    onExecute() {
      // 检查触发事件
      const triggerEvent = this.getInputData(0);
      const customValue = this.getInputData(1);
      
      let outputNumber = 0;
      let shouldOutput = false;
      
      if (triggerEvent && this._shouldTrigger(triggerEvent)) {
        const incrementValue = customValue !== undefined ? customValue : this.properties.incrementValue;
        
        console.log(`[EventToNumber] triggered with value: ${incrementValue}, mode: ${this.properties.outputMode}`);
        
        switch (this.properties.outputMode) {
          case 'increment':
            this._outputValue += incrementValue;
            outputNumber = this._outputValue;
            shouldOutput = true;
            break;
          case 'pulse':
            this._outputValue = incrementValue; // pulse 模式记住输出值
            outputNumber = incrementValue;
            shouldOutput = true; // 脉冲模式只在触发时输出
            break;
          case 'toggle':
            this._outputValue = this._outputValue === 0 ? incrementValue : 0;
            outputNumber = this._outputValue;
            shouldOutput = true;
            break;
          default:
            outputNumber = incrementValue;
            shouldOutput = true;
        }
        
        if (this.properties.resetOnTrigger) {
          this._outputValue = 0;
        }
        
        console.log(`[EventToNumber] outputting: ${outputNumber}`);
        
        // 输出触发事件
        this.setOutputData(1, {
          type: 'number_triggered',
          value: outputNumber,
          timestamp: Date.now()
        });
      } else {
        // 没有触发时的输出
        switch (this.properties.outputMode) {
          case 'increment':
          case 'toggle':
            outputNumber = this._outputValue;
            shouldOutput = true;
            break;
          case 'pulse':
            // 脉冲模式在没有触发时输出上次的值
            outputNumber = this._outputValue;
            shouldOutput = true;
            break;
        }
      }
      
      // 只在需要时输出数值
      if (shouldOutput) {
        this.setOutputData(0, outputNumber);
      }
    }
    
    private _shouldTrigger(event: any): boolean {
      if (!event) return false;
      
      // 简单的重复触发检测
      const currentTime = Date.now();
      if (event.timestamp && event.timestamp === this._lastTriggerTime) {
        return false; // 同一个时间戳的事件不重复处理
      }
      
      this._lastTriggerTime = event.timestamp || currentTime;
      return true;
    }
    
    // 重置输出值
    reset() {
      this._outputValue = 0;
      this._lastTriggerTime = 0;
    }
    
    // 可视化显示当前输出
    onDrawForeground(ctx: CanvasRenderingContext2D) {
      if (this.flags.collapsed) return;
      
      ctx.save();
      ctx.fillStyle = '#FFD700';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`Out: ${this._outputValue}`, this.size[0] * 0.5, this.size[1] - 10);
      ctx.restore();
    }
  }
  
  LiteGraph.registerNodeType('tools/eventToNumber', EventToNumberNode);
}
