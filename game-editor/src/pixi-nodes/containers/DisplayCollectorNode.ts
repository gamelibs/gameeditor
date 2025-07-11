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
    this._container.label = 'CollectorContainer';
    
    // 设置固定的合理高度，适应基础功能
    // 包含4个控件 + 1个输入端口 + 1个输出端口，预设180px高度
    this.size = [200, 180];
    
    // 不再使用自动调整，使用固定的预设高度
    // this.scheduleAutoResize(60, 20, 100, 15);
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

    // 不再使用自动调整，DisplayCollector使用固定高度
    // 如果需要更多输入端口，用户可以手动调整节点大小
    // this.scheduleAutoResize(60, 20, 100, 15);
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
    let hasValidObjects = false;
    for (let i = 0; i < activeInputCount; i++) {
      const displayObj = this.getInputData(i);
      
      if (!displayObj) continue;
      
      try {
        // 添加到容器
        if (Array.isArray(displayObj)) {
          displayObj.forEach(obj => {
            if (obj && typeof obj === 'object' && !this._collectedObjects.has(obj)) {
              // 确保对象有效再添加
              if (obj.renderable !== undefined || obj.texture || obj.text !== undefined) {
                this._container.addChild(obj);
                this._collectedObjects.add(obj);
                hasValidObjects = true;
              }
            }
          });
        } else if (displayObj && typeof displayObj === 'object') {
          if (!this._collectedObjects.has(displayObj)) {
            // 确保对象是有效的显示对象
            if (displayObj.renderable !== undefined || displayObj.texture || displayObj.text !== undefined) {
              this._container.addChild(displayObj);
              this._collectedObjects.add(displayObj);
              hasValidObjects = true;
            }
          }
        }
      } catch (error: any) {
        console.error(`DisplayCollectorNode: Error adding object: ${error.message || 'Unknown error'}`);
      }
    }
    
    // 创建一个数组作为输出，而不是容器本身
    const collectedArray = Array.from(this._collectedObjects);
    
    // 输出收集的对象数组，而不是容器
    this.setOutputData(0, collectedArray.length > 0 ? collectedArray : null);
    
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
 * 
 * 该节点具有自动高度调整功能，会根据输入端口的数量动态调整节点高度。
 * 当添加或更改输入端口数量时，节点会自动计算并设置适当的高度。
 */
export function registerDisplayCollectorNode(LiteGraph: any) {
  LiteGraph.registerNodeType("containers/DisplayCollector", DisplayCollectorNode);
  
  console.log("DisplayCollectorNode 已注册，支持自动高度调整");
}
