import { NodeColors } from '../../nodesConfig';
import { BaseNode } from '../base/BaseNode';

/**
 * NumberOperation Node - 数值运算节点
 * 功能：对两个数值进行运算，支持基本的数学运算
 */
export function registerNumberOperationNode(LiteGraph: any) {
  class NumberOperationNode extends BaseNode {
    _lastResult: number = 0;
    _lastInputA: number | undefined = undefined;
    _lastInputB: number | undefined = undefined;

    constructor() {
      super();
      
      this.title = 'Number Operation';
      this.size = [180, 160];
      this.boxcolor = NodeColors.tool;
      this.color = NodeColors.tool;
      
      // 属性定义
      this.properties = {
        operation: '+',
        valueA: 0,
        valueB: 0
      };
      
      // 输入端口
      this.addInput('A', 'number');        // 第一个操作数
      this.addInput('B', 'number');        // 第二个操作数
      this.addInput('op', 'string');       // 运算符（可选）
      
      // 输出端口
      this.addOutput('result', 'number');  // 运算结果
      
      // 属性控件
      this.addWidget('text', 'operation', this.properties.operation, (v: string) => {
        this.properties.operation = v;
      });
      
      this.addWidget('number', 'valueA', this.properties.valueA, (v: number) => {
        this.properties.valueA = v;
      });
      
      this.addWidget('number', 'valueB', this.properties.valueB, (v: number) => {
        this.properties.valueB = v;
      });
    }
    
    onExecute() {
      // 获取输入值，如果没有连接则使用属性值
      const inputA = this.getInputData(0);
      const inputB = this.getInputData(1);
      const inputOp = this.getInputData(2);
      
      const valueA = inputA !== undefined ? inputA : this.properties.valueA;
      const valueB = inputB !== undefined ? inputB : this.properties.valueB;
      const operation = inputOp || this.properties.operation;
      
      // 避免无限循环：只在输入实际发生变化时执行
      if (inputA !== this._lastInputA || inputB !== this._lastInputB) {
        console.log(`[NumberOperation] A=${valueA} (input: ${inputA}), B=${valueB} (input: ${inputB}), op=${operation}`);
        
        // 执行运算
        const result = this._performOperation(valueA, valueB, operation);
        console.log(`[NumberOperation] result: ${result}`);
        
        // 更新缓存值
        this._lastInputA = inputA;
        this._lastInputB = inputB;
        this._lastResult = result;
        
        // 输出结果
        this.setOutputData(0, result);
      }
    }
    
    private _performOperation(a: number, b: number, op: string): number {
      switch (op) {
        case '+':
          return a + b;
        case '-':
          return a - b;
        case '*':
          return a * b;
        case '/':
          return b !== 0 ? a / b : 0; // 避免除零
        case '%':
          return b !== 0 ? a % b : 0; // 避免除零
        case '^':
          return Math.pow(a, b);
        case 'min':
          return Math.min(a, b);
        case 'max':
          return Math.max(a, b);
        default:
          return 0;
      }
    }
    
    // 可视化显示当前结果
    onDrawForeground(ctx: CanvasRenderingContext2D) {
      if (this.flags.collapsed) return;
      
      ctx.save();
      ctx.fillStyle = '#FFD700';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`= ${this._lastResult}`, this.size[0] * 0.5, this.size[1] - 10);
      ctx.restore();
    }
  }
  
  LiteGraph.registerNodeType('tools/numberOperation', NumberOperationNode);
}
