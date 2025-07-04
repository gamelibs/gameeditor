/**
 * 游戏运行时引擎
 * 独立于LiteGraph的游戏运行环境
 */
import { Application, Text, Graphics, Container } from 'pixi.js';

export interface GameConfig {
  title: string;
  width: number;
  height: number;
  nodes: any[];
  links: any[];
  version: string;
}

export class GameRuntime {
  private app: Application;
  private config: GameConfig;
  private nodeInstances: Map<number, any> = new Map();
  private container: HTMLElement;

  constructor(config: GameConfig, container: HTMLElement) {
    this.config = config;
    this.container = container;
    this.app = new Application();
  }

  async init(): Promise<void> {
    // 计算合适的游戏尺寸
    const gameAspectRatio = this.config.width / this.config.height;
    const screenAspectRatio = window.innerWidth / window.innerHeight;
    
    let displayWidth, displayHeight;
    
    if (screenAspectRatio > gameAspectRatio) {
      // 屏幕更宽，以高度为准
      displayHeight = Math.min(window.innerHeight * 0.9, this.config.height);
      displayWidth = displayHeight * gameAspectRatio;
    } else {
      // 屏幕更高，以宽度为准
      displayWidth = Math.min(window.innerWidth * 0.9, this.config.width);
      displayHeight = displayWidth / gameAspectRatio;
    }

    // 初始化PIXI应用
    await this.app.init({
      width: this.config.width,
      height: this.config.height,
      background: '#222222',
      autoStart: true,
      antialias: true,
      resolution: window.devicePixelRatio || 1
    });

    // 设置canvas样式实现自适应
    this.app.canvas.style.width = displayWidth + 'px';
    this.app.canvas.style.height = displayHeight + 'px';
    this.app.canvas.style.display = 'block';
    
    // 将canvas添加到容器
    this.container.appendChild(this.app.canvas);

    // 构建游戏场景
    await this.buildScene();
    
    // 启动游戏循环
    this.startGameLoop();
    
    // 添加窗口大小变化监听
    this.setupResize();
  }

  private async buildScene(): Promise<void> {
    // 清空舞台
    this.app.stage.removeChildren();

    // 根据节点配置重建场景
    for (const nodeConfig of this.config.nodes) {
      await this.createNodeInstance(nodeConfig);
    }

    // 处理节点连接
    this.processNodeConnections();
  }

  private async createNodeInstance(nodeConfig: any): Promise<void> {
    const { id, type, properties } = nodeConfig;

    switch (type) {
      case 'render/text':
        const textNode = this.createTextNode(properties);
        this.nodeInstances.set(id, textNode);
        break;
      
      case 'render/button':
        const buttonNode = this.createButtonNode({...properties, nodeId: id});
        this.nodeInstances.set(id, buttonNode);
        break;
      
      case 'render/clickCounter':
        const counterNode = this.createClickCounterNode({...properties, nodeId: id});
        this.nodeInstances.set(id, counterNode);
        break;
      
      case 'pixi/containers/DisplayCollector':
        const collectorNode = this.createDisplayCollectorNode({...properties, nodeId: id});
        this.nodeInstances.set(id, collectorNode);
        break;
      
      case 'scene/pixiStage':
        // Stage节点作为主舞台，不需要实例化
        break;
      
      default:
        console.warn(`Unknown node type: ${type}`);
    }
  }

  private createTextNode(properties: any): Text {
    // 创建Text对象
    const text = new Text();
    
    // 设置文字内容和样式
    text.text = properties.text || 'Hello World';
    text.style = {
      fontSize: properties.fontSize || 48,
      fontFamily: properties.fontFamily || 'Arial',
      fill: properties.textColor || '#FFFFFF'
    };

    // 设置位置和其他属性
    text.x = properties.x || 0;
    text.y = properties.y || 0;
    text.scale.set(properties.scale || 1);
    text.rotation = properties.rotation || 0;
    text.alpha = properties.alpha !== undefined ? properties.alpha : 1;
    
    // 设置锚点
    const anchor = properties.anchor !== undefined ? properties.anchor : 0.5;
    text.anchor.set(anchor);

    console.log('Created text node:', {
      text: text.text,
      x: text.x,
      y: text.y,
      visible: text.visible,
      alpha: text.alpha
    });

    return text;
  }

  private createButtonNode(properties: any): Container {
    const container = new Container();
    
    // 自适应宽高计算
    const baseWidth = properties.w || 100;
    const baseHeight = properties.h || 60;
    const label = properties.label || 'Button';
    
    // 根据文字长度和屏幕尺寸计算自适应尺寸
    const textLength = label.length;
    const minWidth = Math.max(80, textLength * 12); // 基于文字长度的最小宽度
    const maxWidth = this.config.width * 0.3; // 最大宽度为游戏宽度的30%
    const adaptiveWidth = Math.min(maxWidth, Math.max(minWidth, baseWidth));
    
    const minHeight = 40;
    const maxHeight = this.config.height * 0.15; // 最大高度为游戏高度的15%
    const adaptiveHeight = Math.min(maxHeight, Math.max(minHeight, baseHeight));
    
    // 创建按钮背景
    const bg = new Graphics()
      .roundRect(0, 0, adaptiveWidth, adaptiveHeight, 8)
      .fill(0x444444)
      .stroke({ color: 0x666666, width: 2 });
    
    // 创建按钮文字 - 自适应字体大小
    const text = new Text();
    text.text = label;
    const baseFontSize = Math.min(adaptiveWidth * 0.25, adaptiveHeight * 0.4, 24);
    text.style = {
      fontSize: Math.max(12, baseFontSize), // 最小字体12px
      fontFamily: 'Arial',
      fill: '#FFFFFF'
    };
    text.anchor.set(0.5);
    text.x = adaptiveWidth / 2;
    text.y = adaptiveHeight / 2;
    
    container.addChild(bg, text);
    
    // 设置位置和其他属性
    container.x = properties.x || 0;
    container.y = properties.y || 0;
    container.scale.set(properties.scale || 1);
    container.rotation = properties.rotation || 0;
    container.alpha = properties.alpha !== undefined ? properties.alpha : 1;
    
    // 设置交互
    container.eventMode = 'static';
    container.cursor = 'pointer';
    
    // 存储节点ID和尺寸信息以便事件处理
    (container as any).nodeId = properties.nodeId;
    (container as any).adaptiveWidth = adaptiveWidth;
    (container as any).adaptiveHeight = adaptiveHeight;
    
    console.log('Created adaptive button node:', {
      label: text.text,
      x: container.x,
      y: container.y,
      originalWidth: baseWidth,
      originalHeight: baseHeight,
      adaptiveWidth: adaptiveWidth,
      adaptiveHeight: adaptiveHeight,
      fontSize: text.style.fontSize
    });

    return container;
  }

  private createClickCounterNode(properties: any): Text {
    const text = new Text();
    
    // 初始化计数器
    const prefix = properties.prefix || 'Clicks: ';
    text.text = prefix + '0';
    
    // 自适应字体大小计算
    const baseFontSize = properties.fontSize || 32;
    const adaptiveFontSize = Math.max(16, Math.min(baseFontSize, this.config.width * 0.05));
    
    text.style = {
      fontSize: adaptiveFontSize,
      fontFamily: properties.fontFamily || 'Arial',
      fill: properties.textColor || '#FFD700'
    };

    // 设置位置和其他属性
    text.x = properties.x || 0;
    text.y = properties.y || 0;
    text.scale.set(properties.scale || 1);
    text.rotation = properties.rotation || 0;
    text.alpha = properties.alpha !== undefined ? properties.alpha : 1;
    
    // 设置锚点
    const anchor = properties.anchor !== undefined ? properties.anchor : 0.5;
    text.anchor.set(anchor);
    
    // 存储计数器状态和属性
    (text as any).clickCount = 0;
    (text as any).prefix = prefix;
    (text as any).nodeId = properties.nodeId;

    console.log('Created click counter node:', {
      text: text.text,
      x: text.x,
      y: text.y,
      prefix: prefix,
      fontSize: adaptiveFontSize
    });

    return text;
  }

  private createDisplayCollectorNode(properties: any): Container {
    const container = new Container();
    
    // 设置容器属性
    container.x = properties.x || 0;
    container.y = properties.y || 0;
    container.scale.set(properties.scale || 1);
    container.rotation = properties.rotation || 0;
    container.alpha = properties.alpha !== undefined ? properties.alpha : 1;
    
    // 存储节点ID和属性
    (container as any).nodeId = properties.nodeId;
    (container as any).isDisplayCollector = true;
    (container as any).collectedObjects = new Set();
    (container as any).maxInputs = properties.maxInputs || 10;
    (container as any).currentInputs = properties.currentInputs || 1;
    
    container.label = `DisplayCollector_${properties.nodeId}`;
    
    console.log('Created display collector node:', {
      x: container.x,
      y: container.y,
      nodeId: properties.nodeId,
      maxInputs: properties.maxInputs,
      currentInputs: properties.currentInputs
    });

    return container;
  }

  private processNodeConnections(): void {
    console.log('Processing node connections...');
    console.log('Links:', this.config.links);
    console.log('Node instances:', Array.from(this.nodeInstances.keys()));
    
    // 第一步：处理 Display Collector 节点的输入连接
    this.processDisplayCollectorConnections();
    
    // 第二步：处理显示对象连接（添加到舞台）
    for (const link of this.config.links) {
      const [, outputNodeId, outputSlot, inputNodeId, inputSlot] = link;
      
      console.log(`Processing link: output node ${outputNodeId}[${outputSlot}] -> input node ${inputNodeId}[${inputSlot}]`);
      
      const outputNode = this.nodeInstances.get(outputNodeId);
      
      // 如果输入节点是stage，则将输出节点添加到舞台
      const inputNodeConfig = this.config.nodes.find(n => n.id === inputNodeId);
      if (inputNodeConfig && inputNodeConfig.type === 'scene/pixiStage' && outputNode) {
        console.log('Adding node to stage:', outputNode);
        this.app.stage.addChild(outputNode);
        
        // 强制设置可见性
        outputNode.visible = true;
        outputNode.renderable = true;
      }
    }
    
    // 第三步：处理事件连接并设置按钮点击处理
    this.setupEventConnections();
    
    console.log('Stage children count:', this.app.stage.children.length);
  }

  private processDisplayCollectorConnections(): void {
    // 查找所有 Display Collector 节点
    const collectorNodes = new Map<number, any>();
    
    for (const [nodeId, nodeInstance] of this.nodeInstances) {
      if ((nodeInstance as any).isDisplayCollector) {
        collectorNodes.set(nodeId, nodeInstance);
      }
    }
    
    // 处理每个 Display Collector 的输入连接
    for (const [collectorId, collectorInstance] of collectorNodes) {
      const inputConnections = this.config.links.filter((link: any[]) => {
        const [, , , inputNodeId] = link;
        return inputNodeId === collectorId;
      });
      
      console.log(`Display Collector ${collectorId} has ${inputConnections.length} input connections`);
      
      // 清空容器，重新收集
      collectorInstance.removeChildren();
      (collectorInstance as any).collectedObjects.clear();
      
      // 处理每个输入连接
      for (const link of inputConnections) {
        const [, outputNodeId, , , inputSlot] = link;
        const sourceNode = this.nodeInstances.get(outputNodeId);
        
        if (sourceNode && inputSlot < (collectorInstance as any).currentInputs) {
          console.log(`Collecting display object from node ${outputNodeId} to collector ${collectorId}`);
          
          // 添加到收集器容器
          if (!collectorInstance.children.includes(sourceNode)) {
            collectorInstance.addChild(sourceNode);
            (collectorInstance as any).collectedObjects.add(sourceNode);
          }
        }
      }
      
      console.log(`Display Collector ${collectorId} now contains ${collectorInstance.children.length} objects`);
    }
  }

  private setupEventConnections(): void {
    // 分析事件连接关系
    const eventConnections: Map<number, number[]> = new Map();
    
    for (const link of this.config.links) {
      const [, outputNodeId, outputSlot, inputNodeId, inputSlot] = link;
      
      // 查找输出节点配置
      const outputNodeConfig = this.config.nodes.find(n => n.id === outputNodeId);
      const inputNodeConfig = this.config.nodes.find(n => n.id === inputNodeId);
      
      // 检查是否是事件连接（按钮的click输出连接到计数器的click输入）
      if (outputNodeConfig && inputNodeConfig && 
          outputNodeConfig.type === 'render/button' && 
          outputSlot === 1 && // click输出端口
          inputNodeConfig.type === 'render/clickCounter' &&
          inputSlot === 1) { // click输入端口
        
        if (!eventConnections.has(outputNodeId)) {
          eventConnections.set(outputNodeId, []);
        }
        eventConnections.get(outputNodeId)!.push(inputNodeId);
        
        console.log(`Found event connection: button ${outputNodeId} -> counter ${inputNodeId}`);
      }
    }
    
    // 为按钮设置点击事件处理
    for (const [buttonNodeId, targetNodeIds] of eventConnections) {
      const buttonInstance = this.nodeInstances.get(buttonNodeId);
      if (buttonInstance && buttonInstance.eventMode) {
        // 添加点击事件监听
        buttonInstance.on('pointerdown', () => {
          console.log(`Button ${buttonNodeId} clicked!`);
          
          // 触发所有连接的计数器
          for (const targetNodeId of targetNodeIds) {
            this.triggerClickCounter(targetNodeId);
          }
        });
        
        // 添加视觉反馈
        buttonInstance.on('pointerdown', () => {
          buttonInstance.scale.set(0.95);
        });
        
        buttonInstance.on('pointerup', () => {
          buttonInstance.scale.set(1.0);
        });
        
        buttonInstance.on('pointerupoutside', () => {
          buttonInstance.scale.set(1.0);
        });
        
        console.log(`Setup click handler for button ${buttonNodeId} targeting counters: ${targetNodeIds}`);
      }
    }
  }

  private triggerClickCounter(counterNodeId: number): void {
    const counterInstance = this.nodeInstances.get(counterNodeId);
    if (counterInstance && typeof (counterInstance as any).clickCount === 'number') {
      // 增加点击计数
      (counterInstance as any).clickCount++;
      
      // 更新显示文本
      const prefix = (counterInstance as any).prefix || 'Clicks: ';
      counterInstance.text = prefix + (counterInstance as any).clickCount;
      
      console.log(`Counter ${counterNodeId} updated to: ${counterInstance.text}`);
    }
  }

  private startGameLoop(): void {
    // 启动渲染循环
    this.app.ticker.add(() => {
      // 游戏逻辑更新
      this.update();
    });
  }

  private update(): void {
    // 每帧更新逻辑
    // 这里可以添加游戏状态更新、动画等
  }

  private setupResize(): void {
    const handleResize = () => {
      const gameAspectRatio = this.config.width / this.config.height;
      const screenAspectRatio = window.innerWidth / window.innerHeight;
      
      let displayWidth, displayHeight;
      
      if (screenAspectRatio > gameAspectRatio) {
        displayHeight = Math.min(window.innerHeight * 0.9, this.config.height);
        displayWidth = displayHeight * gameAspectRatio;
      } else {
        displayWidth = Math.min(window.innerWidth * 0.9, this.config.width);
        displayHeight = displayWidth / gameAspectRatio;
      }
      
      this.app.canvas.style.width = displayWidth + 'px';
      this.app.canvas.style.height = displayHeight + 'px';
    };
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
  }

  destroy(): void {
    if (this.app) {
      this.app.destroy(true);
    }
    this.nodeInstances.clear();
  }
}
