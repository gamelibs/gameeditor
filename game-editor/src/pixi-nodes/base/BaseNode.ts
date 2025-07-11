

export abstract class BaseNode {
  properties: Record<string, any> = {};
  widgets: any[] = [];
  _status: string = '';
  _error: string = '';

  // LiteGraph节点属性（仅类型声明）
  declare title: string;
  declare size: number[];
  declare boxcolor: string;
  declare color: string;
  declare flags: any;

  // LiteGraph节点方法（仅类型声明）
  declare addWidget: (type: string, name: string, value: any, callback: (value: any) => void) => any;
  declare addInput: (name: string, type: string) => void;
  declare addOutput: (name: string, type: string) => void;
  declare setOutputData: (slot: number, data: any) => void;
  declare getInputData: (slot: number) => any;

  constructor() {
    this.onInit();
  }

  // 生命周期钩子
  onInit() {}
  onExecute() {}
  onRemoved() {}
  onConnectInput() {}
  onConnectOutput() {}
  onConnectionsChange() {}

  // 状态管理
  setStatus(status: string) {
    this._status = status;
    this.updateStatusWidget();
  }

  setError(error: string) {
    this._error = error;
    this.updateStatusWidget();
  }

  updateStatusWidget() {
    const statusWidget = this.widgets.find(w => w.name === 'status');
    if (statusWidget) statusWidget.value = this._status + (this._error ? `: ${this._error}` : '');
  }

  // 序列化与反序列化
  serialize() {
    return {
      properties: this.properties,
      status: this._status,
      error: this._error
    };
  }

  deserialize(data: any) {
    this.properties = data.properties || {};
    this._status = data.status || '';
    this._error = data.error || '';
    this.updateStatusWidget();
  }

  /**
   * 根据输入和输出端口数量自动调整节点高度
   * @param baseHeight 基础高度，如果不提供则使用当前高度或默认高度60
   * @param portHeightFactor 每个端口增加的高度，默认为15
   * @param minHeight 最小高度，默认为60
   * @param widgetHeightFactor 每个小部件增加的高度，默认为10
   */
  adjustSizeBasedOnPorts(baseHeight?: number, portHeightFactor: number = 15, minHeight: number = 60, widgetHeightFactor: number = 10) {
    try {
      // 确保size是数组，支持多种初始状态
      if (!this.size) {
        this.size = [180, 60];
      } else if (typeof this.size === 'number') {
        this.size = [this.size, 60];
      } else if (!Array.isArray(this.size)) {
        this.size = [180, 60];
      } else if (this.size.length < 2) {
        this.size = [this.size[0] || 180, 60];
      }

      // 获取当前的宽度或使用默认值
      const width = this.size[0] || 180;
      
      // 获取基础高度或使用当前高度
      let height = baseHeight || this.size[1] || 60;
      
      // 计算端口数量（访问LiteGraph节点的属性）
      const inputCount = (this as any).inputs ? (this as any).inputs.length : 0;
      const outputCount = (this as any).outputs ? (this as any).outputs.length : 0;
      const widgetCount = this.widgets ? this.widgets.length : 0;
      
      // 只有当有端口或小部件时才进行调整
      if (inputCount > 0 || outputCount > 0 || widgetCount > 0) {
        // 根据端口和小部件数量计算额外高度
        const portsHeight = Math.max(inputCount, outputCount) * portHeightFactor;
        const widgetsHeight = widgetCount * widgetHeightFactor;
        
        // 计算新的总高度，但不低于最小高度
        height = Math.max(minHeight, height + portsHeight + widgetsHeight);
        
        // 更新节点大小
        this.size[1] = height;
        
        // 如果节点支持调整大小，还要更新其他相关属性
        if ((this as any).setSize && typeof (this as any).setSize === 'function') {
          (this as any).setSize(width, height);
        }
        
        console.log(`节点 ${(this as any).title || 'Unknown'} 高度自动调整为: ${height} (输入:${inputCount}, 输出:${outputCount}, 小部件:${widgetCount})`);
      }
    } catch (error) {
      console.error('调整节点大小时出错:', error);
      // 发生错误时使用安全的默认大小
      if (!Array.isArray(this.size)) {
        this.size = [180, 200]; // 给一个较大的默认高度
      }
    }
    
    return this.size;
  }

  /**
   * 延迟调整节点大小，确保在节点完全初始化后调用
   */
  scheduleAutoResize(baseHeight?: number, portHeightFactor: number = 15, minHeight: number = 60, widgetHeightFactor: number = 10) {
    // 使用 setTimeout 确保在下一个事件循环中执行，此时节点已完全初始化
    setTimeout(() => {
      this.adjustSizeBasedOnPorts(baseHeight, portHeightFactor, minHeight, widgetHeightFactor);
    }, 0);
  }
}
