/**
 * 默认图表管理器
 * 负责管理节点图的默认配置和自动添加必要的节点
 */

import { PixiStageNode } from '../pixi-nodes/scene/pixiStageNode';
import { UILayerNode } from '../pixi-nodes/containers/UILayerNode';

export interface DefaultGraphConfig {
  // 是否自动添加PixiStage节点
  autoAddPixiStage: boolean;
  // 是否自动添加UI层节点
  autoAddUILayer: boolean;
  // 是否自动连接基础节点
  autoConnect: boolean;
  // 舞台配置
  stageConfig?: {
    width: number;
    height: number;
    background: string;
  };
}

export class DefaultGraphManager {
  private graph: any;
  private config: DefaultGraphConfig;
  private defaultNodes: Map<string, any> = new Map();

  constructor(graph: any, config: Partial<DefaultGraphConfig> = {}) {
    this.graph = graph;
    this.config = {
      autoAddPixiStage: true,
      autoAddUILayer: true,
      autoConnect: true,
      stageConfig: {
        width: 750,
        height: 1334,
        background: '#1a1a1a'
      },
      ...config
    };
  }

  /**
   * 初始化默认图表
   */
  async initializeDefaultGraph(): Promise<void> {
    console.log('开始初始化默认图表...');
    
    // 清空当前图表
    this.graph.clear();

    // 自动添加PixiStage节点
    if (this.config.autoAddPixiStage) {
      await this.addDefaultPixiStage();
    }

    // 自动添加UI层节点
    if (this.config.autoAddUILayer) {
      await this.addDefaultUILayer();
    }

    // 添加示例矩形节点
    await this.addExampleRectangle();

    // 自动连接节点
    if (this.config.autoConnect) {
      this.autoConnectNodes();
    }

    // 重新排列节点位置
    this.arrangeNodes();

    // 启动图表执行，让节点开始工作
    this.startGraph();

    console.log('默认图表初始化完成');
  }

  /**
   * 添加默认的PixiStage节点
   */
  private async addDefaultPixiStage(): Promise<any> {
    const stageNode = new PixiStageNode();
    
    // 设置节点属性
    if (this.config.stageConfig) {
      stageNode.properties.width = this.config.stageConfig.width;
      stageNode.properties.height = this.config.stageConfig.height;
      stageNode.properties.background = this.config.stageConfig.background;
    }

    // 添加到图表
    this.graph.add(stageNode);
    
    // 设置节点位置（LiteGraph节点位置）
    (stageNode as any).pos = [400, 200];
    
    // 存储引用
    this.defaultNodes.set('pixiStage', stageNode);
    
    console.log('已添加默认PixiStage节点');
    return stageNode;
  }

  /**
   * 添加默认的UI层节点
   */
  private async addDefaultUILayer(): Promise<any> {
    const uiLayerNode = new UILayerNode();
    
    // 添加到图表
    this.graph.add(uiLayerNode);
    
    // 设置节点位置（LiteGraph节点位置）
    (uiLayerNode as any).pos = [150, 200];
    
    // 存储引用
    this.defaultNodes.set('uiLayer', uiLayerNode);
    
    console.log('已添加默认UILayer节点');
    return uiLayerNode;
  }

  /**
   * 添加示例矩形节点
   */
  private async addExampleRectangle(): Promise<any> {
    // 需要使用LiteGraph创建节点，而不是直接实例化类
    const rectNode = this.graph.createNode('render/rect');
    
    if (rectNode) {
      // 设置示例属性
      rectNode.properties = {
        ...rectNode.properties,
        width: 150,
        height: 100,
        color: '#66CCFF',
        x: 100,
        y: 100
      };
      
      // 添加到图表
      this.graph.add(rectNode);
      
      // 设置节点位置（LiteGraph节点位置）
      rectNode.pos = [50, 50];
      
      // 存储引用
      this.defaultNodes.set('exampleRect', rectNode);
      
      console.log('已添加示例矩形节点');
      return rectNode;
    }
    
    console.warn('无法创建矩形节点，可能未注册');
    return null;
  }

  /**
   * 自动连接节点
   */
  private autoConnectNodes(): void {
    const rectNode = this.defaultNodes.get('exampleRect');
    const uiLayerNode = this.defaultNodes.get('uiLayer');
    const stageNode = this.defaultNodes.get('pixiStage');

    try {
      // 连接矩形到UI层的MainUI输入
      if (rectNode && uiLayerNode) {
        rectNode.connect(0, uiLayerNode, 1); // 矩形输出 -> UILayer MainUI输入
        console.log('已连接矩形到UI层');
      }

      // 连接UI层到Stage
      if (uiLayerNode && stageNode) {
        uiLayerNode.connect(0, stageNode, 0); // UILayer输出 -> Stage输入
        console.log('已连接UI层到Stage');
      }
    } catch (error) {
      console.error('自动连接节点时出错:', error);
    }
  }

  /**
   * 重新排列节点位置
   */
  private arrangeNodes(): void {
    const nodes = Array.from(this.defaultNodes.values());
    
    // 按照执行顺序排列节点
    let x = 50;
    const y = 200;
    const spacing = 250;

    nodes.forEach((node, index) => {
      if ((node as any).pos) {
        (node as any).pos[0] = x + (index * spacing);
        (node as any).pos[1] = y;
      }
    });

    console.log('节点位置已重新排列');
  }

  /**
   * 获取默认节点
   */
  getDefaultNode(key: string): any {
    return this.defaultNodes.get(key);
  }

  /**
   * 获取所有默认节点
   */
  getAllDefaultNodes(): Map<string, any> {
    return this.defaultNodes;
  }

  /**
   * 检查图表是否为空
   */
  isGraphEmpty(): boolean {
    return !this.graph._nodes || this.graph._nodes.length === 0;
  }

  /**
   * 重置为默认图表
   */
  async resetToDefault(): Promise<void> {
    await this.initializeDefaultGraph();
  }

  /**
   * 启动图表执行
   */
  startGraph(): void {
    if (this.graph) {
      this.graph.start();
      console.log('图表开始执行');
    }
  }

  /**
   * 停止图表执行
   */
  stopGraph(): void {
    if (this.graph) {
      this.graph.stop();
      console.log('图表停止执行');
    }
  }
}
