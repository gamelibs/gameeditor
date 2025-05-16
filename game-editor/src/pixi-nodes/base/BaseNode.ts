import { LiteGraph } from 'litegraph.js';

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
}
