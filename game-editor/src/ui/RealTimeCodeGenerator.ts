import { LGraph } from 'litegraph.js';

/**
 * 实时代码生成器
 * 根据节点图实时生成完整的游戏项目代码
 */
export class RealTimeCodeGenerator {
  private graph: LGraph;

  constructor(graph: LGraph) {
    this.graph = graph;
  }

  /**
   * 分析节点类型
   */
  private analyzeNodeTypes(nodes: any[]): string[] {
    const types = new Set<string>();
    nodes.forEach((node: any) => {
      if (node.type) {
        types.add(node.type);
      }
    });
    return Array.from(types);
  }

  /**
   * 生成游戏逻辑代码 (main.js)
   */
  generateGameLogic(): string {
    const nodes = (this.graph as any)._nodes || [];
    const nodeCount = nodes.length;
    const timestamp = new Date().toISOString();
    const nodeTypes = this.analyzeNodeTypes(nodes);
    
    if (nodeCount === 0) {
      return `/**
 * 🎮 Hello World 游戏 - 游戏逻辑
 * 生成时间: ${timestamp}
 * 状态: 等待添加节点...
 */

// 🔍 当前图形中没有节点
// 请在左侧节点编辑器中添加节点，代码将实时更新

console.log('⚠️ 图形中暂无节点，请添加节点开始构建游戏');

// Hello World 基础示例
class HelloWorldGame {
  constructor() {
    console.log('🎮 Hello World 游戏模板已创建');
    this.message = 'Hello World!';
    this.ready = false;
  }
  
  init() {
    console.log('📋 准备添加游戏节点...');
    this.ready = true;
  }
  
  render() {
    if (this.ready) {
      console.log('🎨 渲染:', this.message);
    }
  }
}

// 初始化游戏
const game = new HelloWorldGame();
game.init();
game.render();`;
    }

    // 检查是否有Pixi Stage节点
    const hasPixiStage = nodes.some((node: any) => node.type === 'pixi/scene/pixiStage');
    
    if (hasPixiStage) {
      return this.generatePixiBasedGameCode(nodes, nodeCount, timestamp, nodeTypes);
    }

    return this.generateBasicGameCode(nodes, nodeCount, timestamp, nodeTypes);
  }

  /**
   * 生成基于Pixi的游戏代码
   */
  private generatePixiBasedGameCode(nodes: any[], nodeCount: number, timestamp: string, nodeTypes: string[]): string {
    const pixiStageNode = nodes.find(node => node.type === 'pixi/scene/pixiStage');
    
    return `/**
 * 🎮 基于节点的Pixi游戏 - 游戏逻辑
 * 自动生成时间: ${timestamp}
 * 节点数量: ${nodeCount}
 * 节点类型: ${nodeTypes.join(', ')}
 * 设计尺寸: ${pixiStageNode?.properties?.width || 750} × ${pixiStageNode?.properties?.height || 1334}
 */

class NodeBasedGameLogic {
  constructor(app) {
    this.app = app;
    this.stage = app.stage;
    this.gameObjects = new Map();
    this.gameState = {
      score: 0,
      level: 1,
      isRunning: false,
      nodeCount: ${nodeCount}
    };
    
    console.log('🎯 初始化基于节点的游戏逻辑');
    this.initializeNodes();
  }

  /**
   * 初始化所有节点
   */
  initializeNodes() {
${this.generatePixiNodeInitCode(nodes)}
  }

  /**
   * 游戏逻辑更新
   */
  update(deltaTime) {
    if (!this.gameState.isRunning) return;
    
${this.generatePixiNodeUpdateCode(nodes)}
  }

  /**
   * 启动游戏
   */
  start() {
    this.gameState.isRunning = true;
    console.log('🚀 游戏逻辑开始运行');
    
    // 设置更新循环
    this.app.ticker.add((delta) => {
      this.update(delta);
    });
  }

  /**
   * 停止游戏
   */
  stop() {
    this.gameState.isRunning = false;
    console.log('⏹️ 游戏逻辑停止');
  }

  /**
   * 获取游戏状态
   */
  getGameState() {
    return { ...this.gameState };
  }

${this.generatePixiNodeMethods(nodes)}
}

// 导出游戏逻辑类
window.NodeBasedGameLogic = NodeBasedGameLogic;`;
  }

  /**
   * 生成Pixi节点初始化代码
   */
  private generatePixiNodeInitCode(nodes: any[]): string {
    if (nodes.length === 0) {
      return '    // 🔍 暂无节点，请在编辑器中添加节点';
    }

    const initCodeParts: string[] = [];
    
    for (const node of nodes) {
      if (node.type === 'pixi/scene/pixiStage') {
        const width = node.properties?.width || 750;
        const height = node.properties?.height || 1334;
        const background = node.properties?.background || '#1a1a1a';
        
        initCodeParts.push(`    // 初始化Pixi Stage节点
    console.log('🎮 初始化游戏舞台:', ${width}x${height});
    this.stage.width = ${width};
    this.stage.height = ${height};
    this.app.renderer.backgroundColor = ${background.includes('#') ? `'${background}'` : background};`);
      } else {
        initCodeParts.push(`    // 初始化节点: ${node.title || node.type}
    console.log('🔧 设置节点:', '${node.title || node.type}');
    this.init${this.sanitizeNodeName(node.title || node.type)}();`);
      }
    }

    return initCodeParts.join('\n');
  }

  /**
   * 生成Pixi节点更新代码
   */
  private generatePixiNodeUpdateCode(nodes: any[]): string {
    if (nodes.length === 0) {
      return '    // 🔍 暂无节点更新逻辑';
    }

    const updateCodeParts: string[] = [];
    
    for (const node of nodes) {
      if (node.type !== 'pixi/scene/pixiStage') {
        updateCodeParts.push(`    // 更新节点: ${node.title || node.type}
    this.update${this.sanitizeNodeName(node.title || node.type)}();`);
      }
    }

    return updateCodeParts.join('\n');
  }

  /**
   * 生成Pixi节点方法
   */
  private generatePixiNodeMethods(nodes: any[]): string {
    const methodParts: string[] = [];
    
    for (const node of nodes) {
      if (node.type !== 'pixi/scene/pixiStage') {
        const nodeName = this.sanitizeNodeName(node.title || node.type);
        methodParts.push(`  /**
   * 初始化${node.title || node.type}节点
   */
  init${nodeName}() {
    console.log('🔧 初始化${node.title || node.type}节点');
    // TODO: 实现${node.title || node.type}节点的初始化逻辑
  }

  /**
   * 更新${node.title || node.type}节点
   */
  update${nodeName}() {
    // TODO: 实现${node.title || node.type}节点的更新逻辑
  }`);
      }
    }

    return methodParts.join('\n\n');
  }

  /**
   * 生成基础游戏代码（非Pixi）
   */
  private generateBasicGameCode(_nodes: any[], nodeCount: number, timestamp: string, nodeTypes: string[]): string {
    return `/**
 * 🎮 Hello World 游戏 - 游戏逻辑
 * 自动生成时间: ${timestamp}
 * 节点数量: ${nodeCount}
 * 节点类型: ${nodeTypes.join(', ') || '基础节点'}
 * 设计尺寸: 750 × 1334 (移动端)
 */

class HelloWorldGame {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.isRunning = false;
    this.gameState = {
      score: 0,
      level: 1,
      nodeCount: ${nodeCount},
      nodeTypes: ${JSON.stringify(nodeTypes)},
      message: 'Hello World!'
    };
    
    console.log('🎮 初始化Hello World游戏');
    console.log('📊 检测到节点:', this.gameState.nodeTypes);
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
  setupCanvas() {
    return new Promise((resolve) => {
      const container = document.getElementById('game-container') || document.body;
      
      this.canvas = document.createElement('canvas');
      this.canvas.width = 750;
      this.canvas.height = 1334;
      this.canvas.style.maxWidth = '100%';
      this.canvas.style.maxHeight = '100%';
      this.canvas.style.border = '2px solid #4ECDC4';
      
      this.ctx = this.canvas.getContext('2d');
      container.appendChild(this.canvas);
      
      console.log('🖼️ 画布设置完成: 750x1334');
      resolve(true);
    });
  }

  /**
   * 设置节点
   */
  setupNodes() {
${this.generateNodeSetupCode()}
    console.log(\`✅ 已设置 \${this.gameState.nodeCount} 个节点\`);
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
${this.generateUpdateCode()}
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
    
    // 绘制Hello World主标题
    this.ctx.fillStyle = '#4ECDC4';
    this.ctx.font = 'bold 64px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(this.gameState.message, width / 2, height * 0.3);
    
    // 绘制副标题
    this.ctx.fillStyle = '#95a5a6';
    this.ctx.font = '32px Arial';
    this.ctx.fillText('节点驱动的H5游戏', width / 2, height * 0.4);
    
    // 绘制节点信息
    this.ctx.fillStyle = '#ecf0f1';
    this.ctx.font = '24px Arial';
    this.ctx.fillText(\`节点数量: \${this.gameState.nodeCount}\`, width / 2, height * 0.5);
    this.ctx.fillText(\`节点类型: \${this.gameState.nodeTypes.join(', ')}\`, width / 2, height * 0.6);
    
    // 绘制装饰元素
    this.renderDecorations();
  }

  /**
   * 渲染装饰元素
   */
  renderDecorations() {
    const { width, height } = this.canvas;
    
    // 绘制边框
    this.ctx.strokeStyle = '#4ECDC4';
    this.ctx.lineWidth = 4;
    this.ctx.strokeRect(10, 10, width - 20, height - 20);
    
    // 绘制角落装饰
    this.ctx.fillStyle = '#4ECDC4';
    this.ctx.fillRect(10, 10, 50, 4);
    this.ctx.fillRect(10, 10, 4, 50);
    this.ctx.fillRect(width - 60, 10, 50, 4);
    this.ctx.fillRect(width - 14, 10, 4, 50);
  }

  /**
   * 处理点击事件
   */
  handleClick(x, y) {
    console.log(\`🖱️ 点击位置: (\${x}, \${y})\`);
    this.gameState.score += 10;
  }

  /**
   * 处理键盘事件
   */
  handleKeyPress(key) {
    console.log(\`⌨️ 按键: \${key}\`);
    if (key === ' ') {
      this.gameState.message = this.gameState.message === 'Hello World!' ? 'Hello Node!' : 'Hello World!';
    }
  }
}

// 导出游戏类
window.HelloWorldGame = HelloWorldGame;

// 自动启动游戏（当DOM加载完成时）
document.addEventListener('DOMContentLoaded', () => {
  console.log('🎮 开始加载Hello World游戏...');
  
  const game = new HelloWorldGame();
  game.init().then(() => {
    console.log('✅ Hello World游戏启动成功！');
  }).catch((error) => {
    console.error('❌ 游戏启动失败:', error);
  });
  
  // 将游戏实例暴露到全局，便于调试
  window.game = game;
});`;
  }

  /**
   * 生成节点设置代码
   */
  private generateNodeSetupCode(): string {
    const nodes = (this.graph as any)._nodes || [];
    
    if (nodes.length === 0) {
      return '    // 🔍 暂无节点，请在编辑器中添加节点';
    }

    const nodeSetupCode = nodes.map((node: any, index: number) => {
      const nodeType = node.type || 'unknown';
      const nodeTitle = node.title || `节点${index + 1}`;
      
      return `    // 节点 ${index + 1}: ${nodeTitle} (${nodeType})
    console.log('🔧 设置节点:', '${nodeTitle}');
    this.setup${this.sanitizeNodeName(nodeTitle)}();`;
    }).join('\n');

    return nodeSetupCode;
  }

  /**
   * 生成更新代码
   */
  private generateUpdateCode(): string {
    const nodes = (this.graph as any)._nodes || [];
    
    if (nodes.length === 0) {
      return '    // 🔍 暂无节点更新逻辑';
    }

    const updateCode = nodes.map((node: any, index: number) => {
      const nodeTitle = node.title || `节点${index + 1}`;
      
      return `    // 更新节点: ${nodeTitle}
    this.update${this.sanitizeNodeName(nodeTitle)}();`;
    }).join('\n');

    return updateCode;
  }

  /**
   * 清理节点名称，用于生成方法名
   */
  private sanitizeNodeName(name: string): string {
    return name
      .replace(/[^a-zA-Z0-9]/g, '')
      .replace(/^[0-9]/, '')
      .replace(/^[a-z]/, (match) => match.toUpperCase());
  }

  /**
   * 生成HTML入口文件
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
    <title>Hello World 游戏 - 节点驱动</title>
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
            <h1>🎮 Hello World 游戏</h1>
            <p>节点驱动的H5游戏引擎</p>
            <p>生成时间: ${timestamp}</p>
            <p>节点数量: ${nodeCount}</p>
        </div>
        
        <div class="controls">
            <button onclick="game?.start?.()">开始游戏</button>
            <button onclick="game?.stop?.()">停止游戏</button>
            <button onclick="location.reload()">重新加载</button>
        </div>
    </div>
    
    <script src="logic.js"></script>
</body>
</html>`;
  }

  /**
   * 生成运行时引擎代码
   */
  generateRuntime(): string {
    const timestamp = new Date().toISOString();
    
    return `/**
 * 🚀 Hello World 游戏运行时引擎
 * 生成时间: ${timestamp}
 * 功能: 提供游戏运行时支持和工具函数
 */

/**
 * 游戏运行时管理器
 */
class GameRuntime {
  constructor() {
    this.version = '1.0.0';
    this.isDebugMode = true;
    this.startTime = Date.now();
    
    console.log('🚀 游戏运行时引擎启动');
  }

  /**
   * 初始化运行时环境
   */
  init() {
    this.setupErrorHandling();
    this.setupPerformanceMonitoring();
    this.setupDebugTools();
    
    console.log('✅ 运行时环境初始化完成');
  }

  /**
   * 设置错误处理
   */
  setupErrorHandling() {
    window.addEventListener('error', (event) => {
      console.error('🚨 游戏错误:', event.error);
      this.handleGameError(event.error);
    });

    window.addEventListener('unhandledrejection', (event) => {
      console.error('🚨 未处理的Promise错误:', event.reason);
      this.handleGameError(event.reason);
    });
  }

  /**
   * 设置性能监控
   */
  setupPerformanceMonitoring() {
    if (this.isDebugMode) {
      setInterval(() => {
        const memory = performance.memory;
        if (memory) {
          console.log('📊 内存使用:', {
            used: Math.round(memory.usedJSHeapSize / 1024 / 1024) + 'MB',
            total: Math.round(memory.totalJSHeapSize / 1024 / 1024) + 'MB'
          });
        }
      }, 10000);
    }
  }

  /**
   * 设置调试工具
   */
  setupDebugTools() {
    // 暴露调试函数到全局
    window.debugGame = {
      getGameState: () => window.game?.gameState,
      toggleDebug: () => {
        this.isDebugMode = !this.isDebugMode;
        console.log('🐛 调试模式:', this.isDebugMode ? '开启' : '关闭');
      },
      getRuntime: () => this,
      logPerformance: () => {
        const uptime = Date.now() - this.startTime;
        console.log('⏱️ 运行时间:', Math.round(uptime / 1000) + '秒');
      }
    };
  }

  /**
   * 处理游戏错误
   */
  handleGameError(error) {
    if (this.isDebugMode) {
      // 显示错误信息
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
      errorDiv.textContent = '游戏错误: ' + error.message;
      document.body.appendChild(errorDiv);
      
      setTimeout(() => {
        errorDiv.remove();
      }, 5000);
    }
  }

  /**
   * 工具函数集合
   */
  static utils = {
    // 数学工具
    clamp: (value, min, max) => Math.min(Math.max(value, min), max),
    lerp: (start, end, factor) => start + (end - start) * factor,
    randomRange: (min, max) => Math.random() * (max - min) + min,
    
    // 颜色工具
    hexToRgb: (hex) => {
      const result = /^#?([a-f\\d]{2})([a-f\\d]{2})([a-f\\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null;
    },
    
    // 时间工具
    formatTime: (ms) => {
      const seconds = Math.floor(ms / 1000);
      const minutes = Math.floor(seconds / 60);
      return \`\${minutes}:\${(seconds % 60).toString().padStart(2, '0')}\`;
    }
  };
}

// 初始化运行时
const gameRuntime = new GameRuntime();
gameRuntime.init();

// 暴露到全局
window.GameRuntime = GameRuntime;
window.gameRuntime = gameRuntime;

console.log('🎮 Hello World 游戏运行时引擎已加载');`;
  }
}
