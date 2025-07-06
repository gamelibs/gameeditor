import { LGraph } from 'litegraph.js';

/**
 * 实时代码生成器
 * 根据节点图实时生成游戏代码
 */
export class MultiFileCodeGenerator {
  private graph: LGraph;

  constructor(graph: LGraph) {
    this.graph = graph;
  }

  /**
   * 生成游戏逻辑代码
   */
  generateGameLogic(): string {
    const nodes = (this.graph as any)._nodes || [];
    const nodeCount = nodes.length;
    const timestamp = new Date().toISOString();
    
    if (nodeCount === 0) {
      return this.generateEmptyGameCode(timestamp);
    }
    
    return this.generateNodeBasedGameCode(nodes, nodeCount, timestamp);
  }

  /**
   * 生成空白游戏代码（无节点时）
   */
  private generateEmptyGameCode(timestamp: string): string {
    return `/**
 * 🎮 空白游戏框架 - 等待节点
 * 生成时间: ${timestamp}
 * 状态: 没有检测到节点，请在编辑器中添加节点
 */

class EmptyGameFramework {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.isRunning = false;
    
    console.log('📋 空白游戏框架已创建，等待节点...');
  }

  /**
   * 初始化游戏
   */
  async init() {
    this.setupCanvas();
    this.startWaitingLoop();
    console.log('⏳ 游戏框架准备就绪，等待添加节点');
  }

  /**
   * 设置基础画布
   */
  setupCanvas() {
    const container = document.getElementById('game-container') || document.body;
    
    this.canvas = document.createElement('canvas');
    this.canvas.width = 750;
    this.canvas.height = 1334;
    this.canvas.style.maxWidth = '100%';
    this.canvas.style.maxHeight = '100%';
    this.canvas.style.border = '2px dashed #666';
    this.canvas.style.borderRadius = '8px';
    
    this.ctx = this.canvas.getContext('2d');
    container.appendChild(this.canvas);
  }

  /**
   * 等待状态循环
   */
  startWaitingLoop() {
    this.isRunning = true;
    
    const waitingLoop = () => {
      if (!this.isRunning) return;
      
      this.renderWaitingState();
      requestAnimationFrame(waitingLoop);
    };
    
    requestAnimationFrame(waitingLoop);
  }

  /**
   * 渲染等待状态
   */
  renderWaitingState() {
    if (!this.ctx) return;
    
    const { width, height } = this.canvas;
    
    // 清空画布
    this.ctx.fillStyle = '#1a1a1a';
    this.ctx.fillRect(0, 0, width, height);
    
    // 绘制等待提示
    this.ctx.fillStyle = '#666';
    this.ctx.font = 'bold 48px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('等待节点...', width / 2, height * 0.4);
    
    this.ctx.fillStyle = '#999';
    this.ctx.font = '24px Arial';
    this.ctx.fillText('请在左侧编辑器中添加节点', width / 2, height * 0.5);
    this.ctx.fillText('代码将实时更新', width / 2, height * 0.55);
    
    // 绘制虚线边框
    this.ctx.strokeStyle = '#666';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([10, 5]);
    this.ctx.strokeRect(20, 20, width - 40, height - 40);
    this.ctx.setLineDash([]);
  }

  /**
   * 停止游戏
   */
  stop() {
    this.isRunning = false;
  }
}

// 导出游戏类
window.EmptyGameFramework = EmptyGameFramework;

// 自动启动
document.addEventListener('DOMContentLoaded', () => {
  console.log('📋 启动空白游戏框架...');
  
  const framework = new EmptyGameFramework();
  framework.init();
  
  window.game = framework;
});`;
  }

  /**
   * 生成基于节点的游戏代码
   */
  private generateNodeBasedGameCode(nodes: any[], nodeCount: number, timestamp: string): string {
    const nodeTypes = this.getNodeTypes(nodes);
    const nodeSetupCode = this.generateNodeSetupCode(nodes);
    const nodeUpdateCode = this.generateNodeUpdateCode(nodes);
    const nodeRenderCode = this.generateNodeRenderCode(nodes);
    
    return `/**
 * 🎮 节点驱动的游戏 - 自动生成
 * 生成时间: ${timestamp}
 * 节点数量: ${nodeCount}
 * 节点类型: ${nodeTypes.join(', ')}
 */

class NodeDrivenGame {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.isRunning = false;
    this.gameObjects = new Map();
    
    // 游戏状态
    this.gameState = {
      nodeCount: ${nodeCount},
      nodeTypes: ${JSON.stringify(nodeTypes)},
      score: 0,
      level: 1
    };
    
    console.log('🎮 初始化节点驱动游戏');
    console.log('📊 检测到的节点:', this.gameState.nodeTypes);
  }

  /**
   * 初始化游戏
   */
  async init() {
    try {
      await this.setupCanvas();
      this.setupNodes();
      this.setupEventListeners();
      this.startGameLoop();
      console.log('✅ 游戏初始化完成');
    } catch (error) {
      console.error('❌ 游戏初始化失败:', error);
    }
  }

  /**
   * 设置画布
   */
  async setupCanvas() {
    const container = document.getElementById('game-container') || document.body;
    
    this.canvas = document.createElement('canvas');
    this.canvas.width = 750;
    this.canvas.height = 1334;
    this.canvas.style.maxWidth = '100%';
    this.canvas.style.maxHeight = '100%';
    this.canvas.style.border = '2px solid #4ECDC4';
    this.canvas.style.borderRadius = '8px';
    
    this.ctx = this.canvas.getContext('2d');
    container.appendChild(this.canvas);
    
    console.log('🖼️ 画布设置完成: 750x1334');
  }

  /**
   * 设置节点
   */
  setupNodes() {
    console.log('📊 设置节点系统...');
    
${nodeSetupCode}
    
    console.log('✅ 已设置', this.gameState.nodeCount, '个节点');
  }

  /**
   * 设置事件监听器
   */
  setupEventListeners() {
    if (this.canvas) {
      this.canvas.addEventListener('click', (e) => {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        this.handleClick(x, y);
      });
    }

    document.addEventListener('keydown', (e) => {
      this.handleKeyPress(e.key);
    });

    console.log('🎮 事件监听器设置完成');
  }

  /**
   * 开始游戏循环
   */
  startGameLoop() {
    this.isRunning = true;
    console.log('🚀 游戏循环开始');
    
    const gameLoop = (timestamp) => {
      if (!this.isRunning) return;
      
      this.update(timestamp);
      this.render();
      
      requestAnimationFrame(gameLoop);
    };
    
    requestAnimationFrame(gameLoop);
  }

  /**
   * 游戏逻辑更新
   */
  update(timestamp) {
${nodeUpdateCode}
  }

  /**
   * 游戏渲染
   */
  render() {
    if (!this.ctx) return;
    
    const { width, height } = this.canvas;
    
    // 清空画布
    this.ctx.fillStyle = '#1a1a1a';
    this.ctx.fillRect(0, 0, width, height);
    
    // 绘制背景渐变
    const gradient = this.ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#2c3e50');
    gradient.addColorStop(1, '#1a1a1a');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, width, height);
    
${nodeRenderCode}
    
    // 绘制UI信息
    this.renderUI();
  }

  /**
   * 渲染UI信息
   */
  renderUI() {
    const { width, height } = this.canvas;
    
    this.ctx.fillStyle = '#4ECDC4';
    this.ctx.font = 'bold 48px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('节点游戏', width / 2, height * 0.3);
    
    this.ctx.fillStyle = '#ecf0f1';
    this.ctx.font = '24px Arial';
    this.ctx.fillText('节点数量: ' + this.gameState.nodeCount, width / 2, height * 0.45);
    this.ctx.fillText('得分: ' + this.gameState.score, width / 2, height * 0.5);
    
    // 绘制节点类型
    this.ctx.fillStyle = '#95a5a6';
    this.ctx.font = '18px Arial';
    const typesText = '节点类型: ' + this.gameState.nodeTypes.join(', ');
    this.ctx.fillText(typesText, width / 2, height * 0.55);
    
    // 绘制边框
    this.ctx.strokeStyle = '#4ECDC4';
    this.ctx.lineWidth = 4;
    this.ctx.strokeRect(10, 10, width - 20, height - 20);
  }

  /**
   * 处理点击事件
   */
  handleClick(x, y) {
    console.log('🖱️ 点击位置:', x, y);
    this.gameState.score += 10;
  }

  /**
   * 处理键盘事件
   */
  handleKeyPress(key) {
    console.log('⌨️ 按键:', key);
    if (key === ' ') {
      this.gameState.score += 5;
    } else if (key === 'r') {
      this.gameState.score = 0;
    }
  }

  /**
   * 停止游戏
   */
  stop() {
    this.isRunning = false;
    console.log('⏹️ 游戏停止');
  }
}

// 导出游戏类
window.NodeDrivenGame = NodeDrivenGame;

// 自动启动游戏
document.addEventListener('DOMContentLoaded', () => {
  console.log('🎮 开始加载节点驱动游戏...');
  
  const game = new NodeDrivenGame();
  game.init().then(() => {
    console.log('✅ 节点驱动游戏启动成功！');
  }).catch((error) => {
    console.error('❌ 游戏启动失败:', error);
  });
  
  window.game = game;
});`;
  }

  /**
   * 获取节点类型
   */
  private getNodeTypes(nodes: any[]): string[] {
    const types = new Set<string>();
    nodes.forEach(node => {
      if (node && node.type) {
        types.add(node.type);
      }
    });
    return Array.from(types);
  }

  /**
   * 生成节点设置代码
   */
  private generateNodeSetupCode(nodes: any[]): string {
    if (nodes.length === 0) {
      return '    // 🔍 当前没有节点';
    }

    return nodes.map((node: any, index: number) => {
      const nodeType = node.type || 'UnknownNode';
      const nodeTitle = node.title || `Node${index + 1}`;
      const safeName = this.sanitizeNodeName(nodeTitle);
      
      return `    // 🔧 节点 ${index + 1}: ${nodeTitle} (${nodeType})
    console.log('设置节点:', '${nodeTitle}');
    this.setup${safeName}();`;
    }).join('\n');
  }

  /**
   * 生成节点更新代码
   */
  private generateNodeUpdateCode(nodes: any[]): string {
    if (nodes.length === 0) {
      return '    // 🔄 基础更新逻辑\n    // 等待节点添加...';
    }

    return nodes.map((node: any, index: number) => {
      const nodeTitle = node.title || `Node${index + 1}`;
      const safeName = this.sanitizeNodeName(nodeTitle);
      
      return `    // 🔄 更新节点: ${nodeTitle}
    this.update${safeName}(timestamp);`;
    }).join('\n');
  }

  /**
   * 生成节点渲染代码
   */
  private generateNodeRenderCode(nodes: any[]): string {
    if (nodes.length === 0) {
      return '    // 🎨 等待节点渲染...';
    }

    return nodes.map((node: any, index: number) => {
      const nodeTitle = node.title || `Node${index + 1}`;
      const safeName = this.sanitizeNodeName(nodeTitle);
      
      return `    // 🎨 渲染节点: ${nodeTitle}
    this.render${safeName}();`;
    }).join('\n');
  }

  /**
   * 清理节点名称
   */
  private sanitizeNodeName(name: string): string {
    return name.replace(/[^a-zA-Z0-9]/g, '').replace(/^./, str => str.toUpperCase()) || 'Node';
  }

  /**
   * 生成HTML文件
   */
  generateIndexHtml(): string {
    const timestamp = new Date().toISOString();
    const nodes = (this.graph as any)._nodes || [];
    const nodeCount = nodes.length;
    
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>节点驱动游戏 - 自动生成</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            color: #fff;
        }
        
        .game-container {
            text-align: center;
            padding: 20px;
        }
        
        .game-info {
            margin-bottom: 20px;
            background: rgba(255, 255, 255, 0.1);
            padding: 15px;
            border-radius: 10px;
            backdrop-filter: blur(10px);
        }
        
        canvas {
            max-width: 90vw;
            max-height: 80vh;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }
        
        .controls {
            margin-top: 20px;
        }
        
        button {
            background: #4ECDC4;
            color: #000;
            border: none;
            padding: 10px 20px;
            margin: 5px;
            border-radius: 5px;
            cursor: pointer;
            font-weight: bold;
            transition: all 0.3s ease;
        }
        
        button:hover {
            background: #45b7b8;
            transform: translateY(-2px);
        }
    </style>
</head>
<body>
    <div class="game-container" id="game-container">
        <div class="game-info">
            <h1>🎮 节点驱动游戏</h1>
            <p>基于节点系统的H5游戏引擎</p>
            <p>生成时间: ${timestamp}</p>
            <p>节点数量: ${nodeCount}</p>
        </div>
        
        <div class="controls">
            <button onclick="window.game && window.game.handleKeyPress(' ')">空格键效果</button>
            <button onclick="window.game && window.game.handleKeyPress('r')">重置得分</button>
            <button onclick="console.log('游戏状态:', window.game?.gameState)">查看状态</button>
        </div>
    </div>
    
    <script src="main.js"></script>
</body>
</html>`;
  }

  /**
   * 生成运行时代码
   */
  generateRuntime(): string {
    return `/**
 * 🚀 节点游戏运行时引擎
 * 提供游戏运行时支持和工具函数
 */

class GameRuntime {
  constructor() {
    this.version = '1.0.0';
    this.startTime = Date.now();
    
    console.log('🚀 游戏运行时引擎启动');
    this.init();
  }

  /**
   * 初始化运行时环境
   */
  init() {
    this.setupErrorHandling();
    this.setupDebugTools();
    
    console.log('✅ 运行时环境初始化完成');
  }

  /**
   * 设置错误处理
   */
  setupErrorHandling() {
    window.addEventListener('error', (event) => {
      console.error('🚨 游戏错误:', event.error);
      this.showError(event.error.message);
    });

    window.addEventListener('unhandledrejection', (event) => {
      console.error('🚨 未处理的Promise错误:', event.reason);
      this.showError('Promise错误: ' + event.reason);
    });
  }

  /**
   * 显示错误信息
   */
  showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = \`
      position: fixed;
      top: 20px;
      right: 20px;
      background: #e74c3c;
      color: white;
      padding: 15px;
      border-radius: 5px;
      max-width: 300px;
      z-index: 1000;
      font-size: 14px;
    \`;
    errorDiv.textContent = '游戏错误: ' + message;
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
      errorDiv.remove();
    }, 5000);
  }

  /**
   * 设置调试工具
   */
  setupDebugTools() {
    window.debugGame = {
      getGameState: () => window.game?.gameState,
      getRuntime: () => this,
      logPerformance: () => {
        const uptime = Date.now() - this.startTime;
        console.log('⏱️ 运行时间:', Math.round(uptime / 1000) + '秒');
      }
    };
  }
}

/**
 * 工具函数
 */
const GameUtils = {
  // 数学工具
  clamp: (value, min, max) => Math.min(Math.max(value, min), max),
  lerp: (start, end, factor) => start + (end - start) * factor,
  randomRange: (min, max) => Math.random() * (max - min) + min,
  
  // 时间工具
  formatTime: (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    return \`\${minutes}:\${(seconds % 60).toString().padStart(2, '0')}\`;
  }
};

// 初始化运行时
const gameRuntime = new GameRuntime();

// 暴露到全局
window.GameRuntime = GameRuntime;
window.GameUtils = GameUtils;
window.gameRuntime = gameRuntime;

console.log('🎮 节点游戏运行时引擎已加载');`;
  }
}
