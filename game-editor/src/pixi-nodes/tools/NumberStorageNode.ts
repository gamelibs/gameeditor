import { NodeColors } from '../../nodesConfig';
import { BaseNode } from '../base/BaseNode';

/**
 * NumberStorage Node - 数值存储节点
 * 功能：存储和管理一个数值状态，作为所有数值计算的基础存储单元
 */
export function registerNumberStorageNode(LiteGraph: any) {
  class NumberStorageNode extends BaseNode {
    _currentValue: number = 0;
    _lastSetValue: number | null = null;
    _lastOutputValue: number | null = null;

    constructor() {
      super();
      
      this.title = 'Number Storage';
      this.size = [180, 220];
      this.boxcolor = NodeColors.tool;
      this.color = NodeColors.tool;
      
      // 属性定义
      this.properties = {
        initialValue: 0,
        minValue: -Infinity,
        maxValue: Infinity
      };
    }
    
    // 在节点完全初始化后设置当前值
    onAdded() {
      // 初始化当前值（此时properties已经被正确设置）
      this._currentValue = this.properties.initialValue;
      
      // 输入端口
      this.addInput('set', 'number');      // 设置新数值
      this.addInput('reset', 'trigger');   // 重置到初始值
      
      // 输出端口
      this.addOutput('value', 'number');   // 当前数值
      this.addOutput('changed', 'event');  // 数值变化事件
      
      // 属性控件
      this.addWidget('number', 'initialValue', this.properties.initialValue, (v: number) => {
        this.properties.initialValue = v;
        this._currentValue = v;
      });
      this.addWidget('number', 'minValue', this.properties.minValue, (v: number) => {
        this.properties.minValue = v;
        this._validateValue();
      });
      this.addWidget('number', 'maxValue', this.properties.maxValue, (v: number) => {
        this.properties.maxValue = v;
        this._validateValue();
      });
    }
    
    onStart() {
      // 确保在开始时就输出初始值
      this.setOutputData(0, this._currentValue);
    }
    
    onExecute() {
      let valueChanged = false;
      
      // 处理设置新值
      const setValue = this.getInputData(0);
      if (setValue !== undefined && setValue !== this._lastSetValue) {
        console.log(`[NumberStorage] RECEIVING: ${setValue} (was: ${this._currentValue})`);
        this._lastSetValue = setValue;
        const newValue = this._clampValue(setValue);
        if (newValue !== this._currentValue) {
          this._currentValue = newValue;
          valueChanged = true;
        }
      }
      
      // 处理重置指令
      const resetTrigger = this.getInputData(1);
      if (resetTrigger) {
        const resetValue = this._clampValue(this.properties.initialValue);
        if (resetValue !== this._currentValue) {
          this._currentValue = resetValue;
          valueChanged = true;
        }
      }
      
      // 只在值变化时输出
      if (valueChanged || this._currentValue !== this._lastOutputValue) {
        console.log(`[NumberStorage] OUTPUT: ${this._currentValue}`);
        this._lastOutputValue = this._currentValue;
        this.setOutputData(0, this._currentValue);
        
        if (valueChanged) {
          this.setOutputData(1, {
            type: 'number_changed',
            value: this._currentValue,
            timestamp: Date.now()
          });
        }
      }
    }
    
    private _clampValue(value: number): number {
      return Math.max(this.properties.minValue, Math.min(this.properties.maxValue, value));
    }
    
    private _validateValue() {
      this._currentValue = this._clampValue(this._currentValue);
    }
    
    // 获取当前值的方法（用于调试）
    getCurrentValue(): number {
      return this._currentValue;
    }
    
    // 可视化显示当前值
    onDrawForeground(ctx: CanvasRenderingContext2D) {
      if (this.flags.collapsed) return;
      
      ctx.save();
      ctx.fillStyle = '#FFD700';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`Value: ${this._currentValue}`, this.size[0] * 0.5, this.size[1] - 10);
      ctx.restore();
    }
  }
  
  LiteGraph.registerNodeType('tools/numberStorage', NumberStorageNode);
}
