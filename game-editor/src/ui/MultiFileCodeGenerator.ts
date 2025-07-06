/**
 * 多文件代码生成器
 * 负责将节点图转换为完整的游戏项目文件
 * 包含语法高亮和结构化展示
 */

import { NodeCodeGenerator } from '../utils/NodeCodeGenerator';

export class MultiFileCodeGenerator {
  private nodeGenerator: NodeCodeGenerator;
  private graph: any;

  constructor(graph: any) {
    this.graph = graph;
    this.nodeGenerator = new NodeCodeGenerator();
  }

  /**
   * 生成游戏逻辑代码（基于节点的主要游戏内容）
   */
  generateGameLogic(): string {
    try {
      if (!this.graph || this.graph._nodes.length === 0) {
        return this.getEmptyGameLogicTemplate();
      }

      const code = this.nodeGenerator.generateCode(this.graph);
      return this.addSyntaxHighlighting(code, 'javascript');
    } catch (error) {
      console.error('生成游戏逻辑代码失败:', error);
      return this.getErrorTemplate('游戏逻辑生成失败');
    }
  }

  /**
   * 生成运行时引擎代码（game.init.js）
   */
  generateRuntimeEngine(): string {
    return this.addSyntaxHighlighting(this.getRuntimeEngineTemplate(), 'javascript');
  }

  /**
   * 生成index.html页面
   */
  generateIndexHtml(): string {
    return this.addSyntaxHighlighting(this.getIndexHtmlTemplate(), 'html');
  }

  /**
   * 生成调试控制台信息
   */
  generateDebugConsole(): string {
    const nodeCount = this.graph ? this.graph._nodes.length : 0;
    const debugInfo = {
      nodeCount,
      timestamp: new Date().toLocaleString(),
      status: nodeCount > 0 ? '正常' : '空图表',
      categories: this.getNodeCategories()
    };

    return `// 调试信息
节点数量: ${debugInfo.nodeCount}
生成时间: ${debugInfo.timestamp}
状态: ${debugInfo.status}

节点分类:
${debugInfo.categories.map(cat => `- ${cat.name}: ${cat.count}个节点`).join('\n')}

// 数据流追踪
${this.getDataFlowTrace()}`;
  }

  /**
   * 添加语法高亮标记
   */
  private addSyntaxHighlighting(code: string, language: string): string {
    // 简单的语法高亮实现
    // 实际项目中可以使用 highlight.js 或 prism.js
    
    if (language === 'javascript') {
      return this.highlightJavaScript(code);
    } else if (language === 'html') {
      return this.highlightHtml(code);
    }
    
    return code;
  }

  /**
   * JavaScript语法高亮
   */
  private highlightJavaScript(code: string): string {
    // 简单的关键词高亮
    return code
      // 关键词
      .replace(/\b(class|function|const|let|var|if|else|for|while|return|import|export|new|this)\b/g, 
               '<span class="keyword">$1</span>')
      // 字符串
      .replace(/(["'`])((?:\\.|(?!\1)[^\\])*?)\1/g, 
               '<span class="string">$1$2$1</span>')
      // 注释
      .replace(/(\/\/.*$)/gm, 
               '<span class="comment">$1</span>')
      .replace(/(\/\*[\s\S]*?\*\/)/g, 
               '<span class="comment">$1</span>')
      // 数字
      .replace(/\b(\d+\.?\d*)\b/g, 
               '<span class="number">$1</span>')
      // 函数名
      .replace(/\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g, 
               '<span class="function">$1</span>(');
  }

  /**
   * HTML语法高亮
   */
  private highlightHtml(code: string): string {
    return code
      // HTML标签
      .replace(/(&lt;\/?)([a-zA-Z][a-zA-Z0-9]*)(.*?)(&gt;)/g, 
               '$1<span class="tag">$2</span>$3$4')
      // 属性名
      .replace(/\b([a-zA-Z-]+)=/g, 
               '<span class="attribute">$1</span>=')
      // 属性值
      .replace(/=(".*?")/g, 
               '=<span class="string">$1</span>')
      // 注释
      .replace(/(&lt;!--[\s\S]*?--&gt;)/g, 
               '<span class="comment">$1</span>');
  }

  /**
   * 获取空游戏逻辑模板
   */
  private getEmptyGameLogicTemplate(): string {
    return `/**
 * 游戏逻辑代码 - 基于节点生成
 * 生成时间: ${new Date().toLocaleString()}
 * 节点数量: 0
 * 节点类型: 空图表
 */

/**
 * 初始化游戏逻辑
 * @param {PIXI.Application} app - PIXI应用实例
 * @returns {Object} 游戏上下文对象
 */
function initGameLogic(app) {
  // 创建舞台引用
  const stage = app.stage;
  
  // 游戏对象映射表
  const gameObjects = new Map();
  
  // 游戏状态
  const gameState = {
    score: 0,
    level: 1,
    isRunning: false,
    nodeCount: 0
  };
  
  console.log('🎮 初始化基于节点的游戏逻辑 (空图表)');
  console.log('⚠️ 暂无节点，请在编辑器中添加节点来生成游戏内容');
  
  // 返回游戏上下文
  return {
    app,
    stage,
    gameObjects,
    gameState,
    
    // 游戏更新方法（每帧调用）
    update: function(deltaTime) {
      // 暂无节点，无更新逻辑
    },
    
    // 清理方法
    destroy: function() {
      gameObjects.clear();
      console.log('🧹 游戏逻辑已清理');
    }
  };
}

// 导出初始化函数
window.initGameLogic = initGameLogic;`;
  }

  /**
   * 获取运行时引擎模板
   */
  private getRuntimeEngineTemplate(): string {
    return `/**
 * 游戏运行时引擎 - game.init.js
 * 负责游戏的初始化、生命周期管理和基础框架功能
 */

class GameEngine {
    constructor() {
        this.app = null;
        this.gameContext = null;
        this.isInitialized = false;
        this.resources = new Map();
        this.scenes = new Map();
        this.lastTime = 0;
    }
    
    /**
     * 初始化游戏引擎
     */
    async init(containerId = 'gameContainer') {
        try {
            console.log('🎮 初始化游戏引擎...');
            
            // 创建PIXI应用
            this.app = new PIXI.Application();
            await this.app.init({
                width: 750,
                height: 1334,
                backgroundColor: '#1a1a1a',
                antialias: true,
                autoDensity: true,
                resolution: window.devicePixelRatio || 1
            });
            
            // 添加到容器
            const container = document.getElementById(containerId);
            if (container) {
                container.appendChild(this.app.canvas);
            }
            
            // 设置响应式
            this.setupResponsive();
            
            // 初始化游戏逻辑（调用节点生成的函数）
            if (typeof window.initGameLogic === 'function') {
                this.gameContext = window.initGameLogic(this.app);
                console.log('✅ 游戏逻辑初始化完成');
            } else {
                console.warn('⚠️ 游戏逻辑函数未找到，请确保已加载游戏逻辑代码');
            }
            
            // 启动游戏循环
            this.startGameLoop();
            
            this.isInitialized = true;
            console.log('✅ 游戏引擎初始化完成');
            
        } catch (error) {
            console.error('❌ 游戏引擎初始化失败:', error);
        }
    }
    
    /**
     * 设置响应式布局
     */
    setupResponsive() {
        const resize = () => {
            if (!this.app) return;
            
            const container = this.app.canvas.parentElement;
            if (!container) return;
            
            const containerWidth = container.clientWidth;
            const containerHeight = container.clientHeight;
            
            // 保持宽高比缩放
            const designWidth = 750;
            const designHeight = 1334;
            const scale = Math.min(
                containerWidth / designWidth,
                containerHeight / designHeight
            );
            
            const finalWidth = Math.floor(designWidth * scale);
            const finalHeight = Math.floor(designHeight * scale);
            
            this.app.renderer.resize(finalWidth, finalHeight);
            this.app.canvas.style.width = finalWidth + 'px';
            this.app.canvas.style.height = finalHeight + 'px';
            this.app.canvas.style.margin = 'auto';
            this.app.canvas.style.display = 'block';
        };
        
        window.addEventListener('resize', resize);
        resize();
    }
    
    /**
     * 启动游戏循环
     */
    startGameLoop() {
        this.app.ticker.add((ticker) => {
            this.update(ticker.deltaTime);
        });
        
        console.log('🔄 游戏循环已启动');
    }
    
    /**
     * 游戏更新逻辑（每帧调用）
     */
    update(deltaTime) {
        // 调用游戏逻辑的更新方法
        if (this.gameContext && typeof this.gameContext.update === 'function') {
            this.gameContext.update(deltaTime);
        }
        
        // 计算FPS（可选）
        const currentTime = performance.now();
        if (this.lastTime > 0) {
            const fps = Math.round(1000 / (currentTime - this.lastTime));
            // 可以在这里更新FPS显示
        }
        this.lastTime = currentTime;
    }
    
    /**
     * 暂停游戏
     */
    pause() {
        if (this.app) {
            this.app.ticker.stop();
            console.log('⏸️ 游戏已暂停');
        }
    }
    
    /**
     * 恢复游戏
     */
    resume() {
        if (this.app) {
            this.app.ticker.start();
            console.log('▶️ 游戏已恢复');
        }
    }
    
    /**
     * 销毁游戏
     */
    destroy() {
        // 清理游戏逻辑
        if (this.gameContext && typeof this.gameContext.destroy === 'function') {
            this.gameContext.destroy();
        }
        
        // 销毁PIXI应用
        if (this.app) {
            this.app.destroy(true, { children: true, texture: false });
            this.app = null;
        }
        
        this.gameContext = null;
        this.isInitialized = false;
        console.log('🗑️ 游戏引擎已销毁');
    }
    
    /**
     * 获取游戏状态
     */
    getGameInfo() {
        return {
            isInitialized: this.isInitialized,
            hasApp: !!this.app,
            hasGameContext: !!this.gameContext,
            fps: this.app ? Math.round(this.app.ticker.FPS) : 0,
            gameState: this.gameContext?.gameState || null
        };
    }
}

// 全局游戏引擎实例
let gameEngine = null;

/**
 * 初始化游戏
 * @param {string} containerId - 游戏容器ID
 * @returns {Promise<GameEngine>} 游戏引擎实例
 */
window.initGame = async function(containerId) {
    if (gameEngine) {
        gameEngine.destroy();
    }
    
    gameEngine = new GameEngine();
    await gameEngine.init(containerId);
    return gameEngine;
};

// 导出游戏引擎类（如果需要的话）
window.GameEngine = GameEngine;`;
  }

  /**
   * 获取index.html模板
   */
  private getIndexHtmlTemplate(): string {
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>基于节点的H5游戏</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background: #000;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            font-family: Arial, sans-serif;
        }
        
        #gameContainer {
            position: relative;
            max-width: 100vw;
            max-height: 100vh;
            background: #1a1a1a;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0,0,0,0.5);
        }
        
        #loadingScreen {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: #1a1a1a;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            color: #fff;
            z-index: 1000;
        }
        
        .loading-spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #333;
            border-top: 4px solid #4ECDC4;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 20px;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        #gameInfo {
            position: absolute;
            top: 10px;
            left: 10px;
            color: #4ECDC4;
            font-size: 12px;
            background: rgba(0,0,0,0.7);
            padding: 5px 10px;
            border-radius: 4px;
            z-index: 100;
        }
    </style>
</head>
<body>
    <div id="gameContainer">
        <!-- 加载屏幕 -->
        <div id="loadingScreen">
            <div class="loading-spinner"></div>
            <div>加载游戏中...</div>
        </div>
        
        <!-- 游戏信息 -->
        <div id="gameInfo">
            基于节点的H5游戏 | 分辨率: 750x1334
        </div>
        
        <!-- 游戏canvas将在这里动态添加 -->
    </div>
    
    <!-- PIXI.js CDN -->
    <script src="https://cdn.jsdelivr.net/npm/pixi.js@8.0.0/dist/pixi.min.js"></script>
    
    <!-- 游戏运行时引擎 -->
    <script src="game.init.js"></script>
    
    <!-- 游戏逻辑代码 -->
    <script>
        // 游戏逻辑将在这里注入
        ${this.generateGameLogicInline()}
    </script>
    
    <script>
        // 启动游戏
        window.addEventListener('DOMContentLoaded', async () => {
            try {
                const engine = await initGame('gameContainer');
                
                // 隐藏加载屏幕
                setTimeout(() => {
                    const loadingScreen = document.getElementById('loadingScreen');
                    if (loadingScreen) {
                        loadingScreen.style.display = 'none';
                    }
                }, 1000);
                
            } catch (error) {
                console.error('游戏启动失败:', error);
                const loadingScreen = document.getElementById('loadingScreen');
                if (loadingScreen) {
                    loadingScreen.innerHTML = '<div style="color: #ff4444;">游戏加载失败</div>';
                }
            }
        });
    </script>
</body>
</html>`;
  }

  /**
   * 生成内联游戏逻辑（用于index.html）
   */
  private generateGameLogicInline(): string {
    return this.nodeGenerator.generateCode(this.graph);
  }

  /**
   * 获取错误模板
   */
  private getErrorTemplate(errorMsg: string): string {
    return `/**
 * 代码生成错误
 * 错误信息: ${errorMsg}
 * 时间: ${new Date().toLocaleString()}
 */

console.error('${errorMsg}');`;
  }

  /**
   * 获取节点分类统计
   */
  private getNodeCategories(): Array<{name: string, count: number}> {
    if (!this.graph || !this.graph._nodes) {
      return [];
    }

    const categories = new Map();
    
    for (const node of this.graph._nodes) {
      const type = node.type || 'unknown';
      const category = type.split('/')[0] || 'other';
      categories.set(category, (categories.get(category) || 0) + 1);
    }

    return Array.from(categories.entries()).map(([name, count]) => ({
      name,
      count
    }));
  }

  /**
   * 获取数据流追踪信息
   */
  private getDataFlowTrace(): string {
    if (!this.graph || !this.graph._nodes) {
      return '无数据流';
    }

    const connections = [];
    for (const node of this.graph._nodes) {
      if (node.outputs) {
        for (let i = 0; i < node.outputs.length; i++) {
          const output = node.outputs[i];
          if (output.links) {
            for (const linkId of output.links) {
              const link = this.graph.links[linkId];
              if (link) {
                const targetNode = this.graph.getNodeById(link.target_id);
                connections.push(`${node.title || node.type} -> ${targetNode.title || targetNode.type}`);
              }
            }
          }
        }
      }
    }

    return connections.length > 0 ? connections.join('\n') : '无连接';
  }
}