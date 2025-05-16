/**
 * Display Collector Node
 * 
 * 这个节点用于收集多个显示对象，并将它们组织到一个容器中输出。
 * 适用于需要将多个独立的显示对象作为一个整体连接到其他节点的情况。
 */

import { Container } from 'pixi.js';
import { BaseNode } from '../base/BaseNode';

export class DisplayCollectorNode extends BaseNode {
  // 容器用于收集显示对象
  private _container: Container = new Container();
  
  // 跟踪已添加的显示对象
  private _collectedObjects: Set<any> = new Set();
  
  constructor() {
    super();
    
    this.title = 'Display Collector';
    this.boxcolor = "#16a085"; // 青绿色
    
    // 基本属性
    this.properties = {
      ...this.properties,
      uniqueId: `display_collector_${Math.floor(Math.random() * 10000000)}`,
      maxInputs: 10, // 默认最多支持10个输入
      currentInputs: 1, // 当前显示的输入数量
      debug: true // 默认启用调试模式
    };
    
    // 添加第一个输入端口
    this.addInput('Display 1', 'pixi_display_object');
    
    // 添加控制小部件
    this.addWidget('number', 'Input Count', this.properties.currentInputs, (v: number) => {
      // 限制输入端口数量为1-10个
      const count = Math.max(1, Math.min(this.properties.maxInputs, Math.floor(v)));
      this.updateInputPorts(count);
      this.properties.currentInputs = count;
    });
    
    // 添加"添加输入端口"按钮
    this.addWidget('button', '+', null, () => {
      if (this.properties.currentInputs < this.properties.maxInputs) {
        this.updateInputPorts(this.properties.currentInputs + 1);
        this.properties.currentInputs += 1;
      }
    });
    
    // 添加调试模式控制
    this.addWidget('toggle', 'Debug Mode', this.properties.debug, (v: boolean) => {
      this.properties.debug = v;
    });
    
    // 添加输出端口
    this.addOutput('Collected', 'pixi_display_object');
    
    // 初始化
    this._container.name = 'CollectorContainer';
  }
  
  /**
   * 更新输入端口数量
   */
  updateInputPorts(count: number) {
    // 获取输入端口（类型转换，因为BaseNode中没有inputs属性定义）
    const inputs = (this as any).inputs || [];
    
    // 当前输入端口数量
    const currentCount = inputs.length;
    
    // 如果需要添加端口
    if (count > currentCount) {
      for (let i = currentCount; i < count; i++) {
        this.addInput(`Display ${i + 1}`, 'pixi_display_object');
      }
    }
    // 如果需要移除端口（从LiteGraph上下文中不易实现，但我们可以隐藏多余的端口）
    else if (count < currentCount) {
      // 在LiteGraph中，我们通常无法直接删除输入端口
      // 最好的方法是隐藏它们或忽略其输入
      console.log(`Can't remove input ports in LiteGraph. Ignoring inputs ${count + 1} to ${currentCount}`);
    }
    
    // 更新小部件显示
    const widgets = this.widgets || [];
    for (let i = 0; i < widgets.length; i++) {
      if (widgets[i].name === 'Input Count') {
        widgets[i].value = count;
      }
    }
  }
  
  /**
   * 节点执行逻辑
   */
  onExecute() {
    // 清空容器，准备重新收集显示对象
    this._container.removeChildren();
    this._collectedObjects.clear();
    
    // 使用类型断言访问LiteGraph运行时添加的输入端口
    const inputs = (this as any).inputs || [];
    const activeInputCount = Math.min(inputs.length, this.properties.currentInputs);
    
    // 处理每个输入端口
    for (let i = 0; i < activeInputCount; i++) {
      const displayObj = this.getInputData(i);
      if (!displayObj) continue;
      
      // 添加到容器
      if (Array.isArray(displayObj)) {
        displayObj.forEach(obj => {
          if (obj && !this._collectedObjects.has(obj)) {
            this._container.addChild(obj);
            this._collectedObjects.add(obj);
          }
        });
      } else {
        if (!this._collectedObjects.has(displayObj)) {
          this._container.addChild(displayObj);
          this._collectedObjects.add(displayObj);
        }
      }
    }
    
    // 输出收集的容器
    this.setOutputData(0, this._container);
    
    // 调试信息
    if (this.properties.debug) {
      console.log(`DisplayCollectorNode (${this.properties.uniqueId}) executed. Collected ${this._collectedObjects.size} objects.`);
    }
  }
  
  /**
   * 清理资源
   */
  onRemoved() {
    this._container.destroy({ children: true });
  }
}

/**
 * 注册 DisplayCollectorNode
 */
export function registerDisplayCollectorNode(LiteGraph: any) {
  LiteGraph.registerNodeType("pixi/containers/DisplayCollector", DisplayCollectorNode);
}
