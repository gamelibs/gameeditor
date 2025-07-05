import { LGraph } from 'litegraph.js';

/**
 * 多文件代码生成器
 * 根据节点图生成完整的游戏项目代码
 */
export class MultiFileCodeGenerator {
  private graph: LGraph;

  constructor(graph: LGraph) {
    this.graph = graph;
  }

  /**
   * 生成游戏逻辑代码 (main.js)
   */
  generateGameLogic(): string {
    const nodes = (this.graph as any)._nodes || [];
    const nodeCount = nodes.length;
    const timestamp = new Date().toISOString();
    
    return `/**
 * 🎮 Hello World 游戏 - 游戏逻辑
 * 自动生成时间: ${timestamp}
 * 节点数量: ${nodeCount}
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
      nodeCount: ${nodeCount}
    };
    
    console.log('🎮 初始化Hello World游戏');
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
   * 设置游戏画布
   */
  setupCanvas() {
    return new Promise((resolve) => {
      this.canvas = document.getElementById('gameCanvas');
      if (!this.canvas) {
        // 如果没有找到画布，创建一个
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'gameCanvas';
        this.canvas.width = 750;
        this.canvas.height = 1334;
        document.body.appendChild(this.canvas);
      }
      
      this.ctx = this.canvas.getContext('2d');
      
      // 设置画布样式
      this.canvas.style.display = 'block';
      this.canvas.style.margin = '0 auto';
      this.canvas.style.border = '2px solid #4ECDC4';
      this.canvas.style.borderRadius = '8px';
      this.canvas.style.maxWidth = '100%';
      this.canvas.style.height = 'auto';
      
      resolve(true);
    });
  }

  /**
   * 基于节点图设置游戏元素
   */
  setupNodes() {
    console.log('📊 设置节点系统...');
    
${this.generateNodeSetupCode()}
    
    console.log(\`✅ 已设置 \${this.gameState.nodeCount} 个节点\`);
  }

  /**
   * 设置事件监听器
   */
  setupEventListeners() {
    // 鼠标事件
    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      this.handleClick(x, y);
    });

    // 键盘事件
    document.addEventListener('keydown', (e) => {
      this.handleKeyPress(e.key);
    });

    // 窗口大小变化
    window.addEventListener('resize', () => {
      this.handleResize();
    });
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
    this.ctx.fillText('Hello World!', width / 2, height * 0.3);
    
    // 绘制副标题
    this.ctx.fillStyle = '#95a5a6';
    this.ctx.font = '32px Arial';
    this.ctx.fillText('节点驱动的H5游戏', width / 2, height * 0.4);
    
    // 绘制游戏信息
    this.renderGameInfo();
    
    // 绘制节点状态
    this.renderNodeStatus();
    
    // 绘制装饰元素
    this.renderDecorations();
  }

  /**
   * 渲染游戏信息
   */
  renderGameInfo() {
    const { width, height } = this.canvas;
    
    this.ctx.fillStyle = '#ecf0f1';
    this.ctx.font = '24px Arial';
    this.ctx.textAlign = 'center';
    
    const infoY = height * 0.55;
    const lineHeight = 35;
    
    this.ctx.fillText(\`得分: \${this.gameState.score}\`, width / 2, infoY);
    this.ctx.fillText(\`关卡: \${this.gameState.level}\`, width / 2, infoY + lineHeight);
    this.ctx.fillText(\`节点数: \${this.gameState.nodeCount}\`, width / 2, infoY + lineHeight * 2);
  }

  /**
   * 渲染节点状态
   */
  renderNodeStatus() {
    const { width, height } = this.canvas;
    
    if (this.gameState.nodeCount === 0) {
      this.ctx.fillStyle = '#e74c3c';
      this.ctx.font = '20px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('请添加游戏节点开始开发', width / 2, height * 0.75);
      return;
    }
    
    // 绘制节点状态指示器
    const nodeRadius = 8;
    const startX = width / 2 - (this.gameState.nodeCount * 20) / 2;
    const y = height * 0.8;
    
    for (let i = 0; i < this.gameState.nodeCount; i++) {
      const x = startX + i * 20;
      
      // 节点圆圈
      this.ctx.fillStyle = '#4ECDC4';
      this.ctx.beginPath();
      this.ctx.arc(x, y, nodeRadius, 0, Math.PI * 2);
      this.ctx.fill();
      
      // 连接线
      if (i < this.gameState.nodeCount - 1) {
        this.ctx.strokeStyle = '#95a5a6';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(x + nodeRadius, y);
        this.ctx.lineTo(x + 20 - nodeRadius, y);
        this.ctx.stroke();
      }
    }
  }

  /**
   * 渲染装饰元素
   */
  renderDecorations() {
    const { width, height } = this.canvas;
    
    // 绘制边框
    this.ctx.strokeStyle = '#4ECDC4';
    this.ctx.lineWidth = 4;
    this.ctx.setLineDash([20, 10]);
    this.ctx.strokeRect(10, 10, width - 20, height - 20);
    this.ctx.setLineDash([]);
    
    // 绘制底部提示
    this.ctx.fillStyle = '#7f8c8d';
    this.ctx.font = '16px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('点击屏幕与游戏交互', width / 2, height - 30);
  }

  /**
   * 处理点击事件
   */
  handleClick(x, y) {
    console.log(\`🖱️ 点击位置: (\${x}, \${y})\`);
    
    // 增加得分
    this.gameState.score += 10;
    
    // 简单的点击特效
    this.createClickEffect(x, y);
  }

  /**
   * 创建点击特效
   */
  createClickEffect(x, y) {
    // 这里可以添加粒子效果或动画
    console.log(\`✨ 点击特效: (\${x}, \${y})\`);
  }

  /**
   * 处理键盘事件
   */
  handleKeyPress(key) {
    console.log(\`⌨️ 按键: \${key}\`);
    
    switch (key) {
      case ' ':
        this.gameState.score += 5;
        break;
      case 'r':
        this.resetGame();
        break;
    }
  }

  /**
   * 处理窗口大小变化
   */
  handleResize() {
    console.log('📐 窗口大小变化');
    // 这里可以添加响应式处理逻辑
  }

  /**
   * 重置游戏
   */
  resetGame() {
    console.log('🔄 重置游戏');
    this.gameState.score = 0;
    this.gameState.level = 1;
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
   * 生成HTML入口文件
   */
  generateIndexHtml(): string {
    const timestamp = new Date().toISOString();
    
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hello World Game - 节点驱动的H5游戏</title>
  
  <!-- 游戏元数据 -->
  <meta name="description" content="基于节点系统开发的Hello World H5游戏">
  <meta name="keywords" content="H5游戏,节点编程,游戏开发">
  <meta name="author" content="Game Editor">
  <meta name="generator" content="Game Editor v2.0">
  <meta name="created" content="${timestamp}">
  
  <!-- 移动端优化 -->
  <meta name="format-detection" content="telephone=no">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="Hello World Game">
  
  <!-- 图标和启动画面 -->
  <link rel="icon" type="image/png" href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==">
  
  <style>
    /* 🎨 游戏样式 */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Arial', sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #fff;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 10px;
    }
    
    .game-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 100%;
      max-width: 400px;
    }
    
    .game-header {
      text-align: center;
      margin-bottom: 20px;
    }
    
    .game-title {
      font-size: 2.5rem;
      font-weight: bold;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
      background: linear-gradient(45deg, #4ECDC4, #44A08D);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 10px;
    }
    
    .game-subtitle {
      font-size: 1.2rem;
      opacity: 0.8;
      margin-bottom: 5px;
    }
    
    .game-info {
      font-size: 0.9rem;
      opacity: 0.6;
    }
    
    #gameCanvas {
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      border-radius: 12px;
      max-width: 100%;
      height: auto;
      background: #1a1a1a;
    }
    
    .game-controls {
      margin-top: 20px;
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      justify-content: center;
    }
    
    .control-btn {
      padding: 10px 20px;
      background: rgba(255,255,255,0.1);
      border: 2px solid rgba(255,255,255,0.2);
      border-radius: 25px;
      color: white;
      cursor: pointer;
      transition: all 0.3s ease;
      font-size: 14px;
      backdrop-filter: blur(10px);
    }
    
    .control-btn:hover {
      background: rgba(255,255,255,0.2);
      border-color: #4ECDC4;
      transform: translateY(-2px);
    }
    
    .loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
    }
    
    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 4px solid rgba(255,255,255,0.3);
      border-top: 4px solid #4ECDC4;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .error {
      background: rgba(231, 76, 60, 0.1);
      border: 2px solid #e74c3c;
      border-radius: 8px;
      padding: 20px;
      margin: 20px;
      text-align: center;
    }
    
    /* 移动端适配 */
    @media (max-width: 768px) {
      .game-title {
        font-size: 2rem;
      }
      
      .game-subtitle {
        font-size: 1rem;
      }
      
      .control-btn {
        padding: 8px 16px;
        font-size: 12px;
      }
    }
    
    /* PWA支持 */
    @media (display-mode: standalone) {
      body {
        padding-top: env(safe-area-inset-top);
        padding-bottom: env(safe-area-inset-bottom);
      }
    }
  </style>
</head>
<body>
  <!-- 🎮 游戏容器 -->
  <div class="game-container">
    <!-- 游戏头部 -->
    <div class="game-header">
      <h1 class="game-title">Hello World</h1>
      <p class="game-subtitle">节点驱动的H5游戏</p>
      <p class="game-info">设计尺寸: 750×1334 | 移动端优化</p>
    </div>
    
    <!-- 加载状态 -->
    <div id="loadingIndicator" class="loading">
      <div class="loading-spinner"></div>
      <p>正在加载游戏...</p>
    </div>
    
    <!-- 游戏画布 -->
    <canvas id="gameCanvas" width="750" height="1334" style="display: none;"></canvas>
    
    <!-- 游戏控制 -->
    <div class="game-controls" style="display: none;" id="gameControls">
      <button class="control-btn" onclick="game?.resetGame()">🔄 重置</button>
      <button class="control-btn" onclick="toggleFullscreen()">🔍 全屏</button>
      <button class="control-btn" onclick="showInfo()">ℹ️ 信息</button>
    </div>
    
    <!-- 错误显示 -->
    <div id="errorDisplay" class="error" style="display: none;">
      <h3>🚫 游戏加载失败</h3>
      <p id="errorMessage">未知错误</p>
      <button class="control-btn" onclick="location.reload()">🔄 重新加载</button>
    </div>
  </div>
  
  <!-- 🚀 游戏引擎加载 -->
  <script src="runtime.js" defer></script>
  <script src="main.js" defer></script>
  
  <script>
    // 🎮 游戏启动脚本
    window.addEventListener('load', () => {
      console.log('🎮 游戏页面加载完成');
      
      // 延迟隐藏加载指示器
      setTimeout(() => {
        const loading = document.getElementById('loadingIndicator');
        const canvas = document.getElementById('gameCanvas');
        const controls = document.getElementById('gameControls');
        
        if (loading) loading.style.display = 'none';
        if (canvas) canvas.style.display = 'block';
        if (controls) controls.style.display = 'flex';
      }, 1000);
    });
    
    // 全屏功能
    function toggleFullscreen() {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
          console.log('无法进入全屏模式:', err);
        });
      } else {
        document.exitFullscreen();
      }
    }
    
    // 显示游戏信息
    function showInfo() {
      alert(\`🎮 Hello World Game
      
📱 设计尺寸: 750×1334
🎯 目标平台: 移动端H5
⚡ 技术栈: Canvas + JavaScript
🔧 开发工具: Game Editor v2.0
📅 生成时间: ${timestamp}

🎯 操作说明:
• 点击屏幕: 增加分数
• 空格键: 获得额外分数  
• R键: 重置游戏\`);
    }
    
    // 错误处理
    window.addEventListener('error', (e) => {
      console.error('游戏运行错误:', e);
      const errorDisplay = document.getElementById('errorDisplay');
      const errorMessage = document.getElementById('errorMessage');
      
      if (errorDisplay && errorMessage) {
        errorMessage.textContent = e.message || '未知错误';
        errorDisplay.style.display = 'block';
      }
    });
    
    // 性能监控
    if ('performance' in window) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const perfData = performance.getEntriesByType('navigation')[0];
          console.log('📊 页面性能:', {
            loadTime: Math.round(perfData.loadEventEnd - perfData.fetchStart),
            domReady: Math.round(perfData.domContentLoadedEventEnd - perfData.fetchStart)
          });
        }, 0);
      });
    }
  </script>
</body>
</html>`;
  }

  /**
   * 生成运行时引擎代码
   */
  generateRuntime(): string {
    return `/**
 * ⚡ 游戏运行时引擎 (runtime.js)
 * 提供游戏开发的基础功能和工具类
 */

/**
 * 🎮 游戏引擎核心类
 */
class GameEngine {
  constructor() {
    this.version = '2.0.0';
    this.modules = new Map();
    this.events = new Map();
    
    console.log(\`⚡ 游戏引擎初始化 v\${this.version}\`);
    this.initializeModules();
  }

  /**
   * 初始化引擎模块
   */
  initializeModules() {
    // 注册核心模块
    this.registerModule('input', new InputManager());
    this.registerModule('audio', new AudioManager());
    this.registerModule('storage', new StorageManager());
    this.registerModule('utils', new GameUtils());
    
    console.log('✅ 引擎模块初始化完成');
  }

  /**
   * 注册模块
   */
  registerModule(name, module) {
    this.modules.set(name, module);
    console.log(\`📦 模块注册: \${name}\`);
  }

  /**
   * 获取模块
   */
  getModule(name) {
    return this.modules.get(name);
  }

  /**
   * 事件系统
   */
  on(event, callback) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event).push(callback);
  }

  emit(event, data) {
    if (this.events.has(event)) {
      this.events.get(event).forEach(callback => callback(data));
    }
  }
}

/**
 * 🖱️ 输入管理器
 */
class InputManager {
  constructor() {
    this.keys = new Set();
    this.mouse = { x: 0, y: 0, pressed: false };
    this.touches = new Map();
    
    this.setupEventListeners();
    console.log('🖱️ 输入管理器初始化');
  }

  setupEventListeners() {
    // 键盘事件
    document.addEventListener('keydown', (e) => {
      this.keys.add(e.key.toLowerCase());
    });

    document.addEventListener('keyup', (e) => {
      this.keys.delete(e.key.toLowerCase());
    });

    // 鼠标事件
    document.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });

    document.addEventListener('mousedown', () => {
      this.mouse.pressed = true;
    });

    document.addEventListener('mouseup', () => {
      this.mouse.pressed = false;
    });

    // 触摸事件
    document.addEventListener('touchstart', (e) => {
      e.preventDefault();
      Array.from(e.touches).forEach(touch => {
        this.touches.set(touch.identifier, {
          x: touch.clientX,
          y: touch.clientY
        });
      });
    });

    document.addEventListener('touchmove', (e) => {
      e.preventDefault();
      Array.from(e.touches).forEach(touch => {
        this.touches.set(touch.identifier, {
          x: touch.clientX,
          y: touch.clientY
        });
      });
    });

    document.addEventListener('touchend', (e) => {
      e.preventDefault();
      Array.from(e.changedTouches).forEach(touch => {
        this.touches.delete(touch.identifier);
      });
    });
  }

  /**
   * 检查按键是否按下
   */
  isKeyPressed(key) {
    return this.keys.has(key.toLowerCase());
  }

  /**
   * 获取鼠标位置
   */
  getMousePosition() {
    return { ...this.mouse };
  }

  /**
   * 获取触摸位置
   */
  getTouches() {
    return Array.from(this.touches.values());
  }
}

/**
 * 🔊 音频管理器
 */
class AudioManager {
  constructor() {
    this.sounds = new Map();
    this.musicVolume = 1.0;
    this.sfxVolume = 1.0;
    this.muted = false;
    
    console.log('🔊 音频管理器初始化');
  }

  /**
   * 加载音频文件
   */
  async loadSound(name, url) {
    try {
      const audio = new Audio(url);
      audio.preload = 'auto';
      
      return new Promise((resolve, reject) => {
        audio.addEventListener('canplaythrough', () => {
          this.sounds.set(name, audio);
          console.log(\`🎵 音频加载成功: \${name}\`);
          resolve(audio);
        });
        
        audio.addEventListener('error', reject);
      });
    } catch (error) {
      console.warn(\`⚠️ 音频加载失败: \${name}\`, error);
    }
  }

  /**
   * 播放音效
   */
  playSound(name, volume = 1.0) {
    if (this.muted) return;
    
    const sound = this.sounds.get(name);
    if (sound) {
      sound.volume = volume * this.sfxVolume;
      sound.currentTime = 0;
      sound.play().catch(e => console.warn('音频播放失败:', e));
    }
  }

  /**
   * 播放背景音乐
   */
  playMusic(name, loop = true) {
    if (this.muted) return;
    
    const music = this.sounds.get(name);
    if (music) {
      music.volume = this.musicVolume;
      music.loop = loop;
      music.play().catch(e => console.warn('音乐播放失败:', e));
    }
  }

  /**
   * 设置静音
   */
  setMuted(muted) {
    this.muted = muted;
    console.log(\`🔇 静音模式: \${muted ? '开启' : '关闭'}\`);
  }
}

/**
 * 💾 存储管理器
 */
class StorageManager {
  constructor() {
    this.prefix = 'game_';
    console.log('💾 存储管理器初始化');
  }

  /**
   * 保存数据
   */
  save(key, data) {
    try {
      const serialized = JSON.stringify(data);
      localStorage.setItem(this.prefix + key, serialized);
      console.log(\`💾 数据保存: \${key}\`);
      return true;
    } catch (error) {
      console.error('数据保存失败:', error);
      return false;
    }
  }

  /**
   * 加载数据
   */
  load(key, defaultValue = null) {
    try {
      const data = localStorage.getItem(this.prefix + key);
      if (data !== null) {
        return JSON.parse(data);
      }
      return defaultValue;
    } catch (error) {
      console.error('数据加载失败:', error);
      return defaultValue;
    }
  }

  /**
   * 删除数据
   */
  remove(key) {
    localStorage.removeItem(this.prefix + key);
    console.log(\`🗑️ 数据删除: \${key}\`);
  }

  /**
   * 清空所有游戏数据
   */
  clear() {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(this.prefix)) {
        localStorage.removeItem(key);
      }
    });
    console.log('🗑️ 所有游戏数据已清空');
  }
}

/**
 * 🛠️ 游戏工具类
 */
class GameUtils {
  constructor() {
    console.log('🛠️ 游戏工具初始化');
  }

  /**
   * 生成随机数
   */
  random(min, max) {
    return Math.random() * (max - min) + min;
  }

  /**
   * 生成随机整数
   */
  randomInt(min, max) {
    return Math.floor(this.random(min, max + 1));
  }

  /**
   * 角度转弧度
   */
  degToRad(degrees) {
    return degrees * Math.PI / 180;
  }

  /**
   * 弧度转角度
   */
  radToDeg(radians) {
    return radians * 180 / Math.PI;
  }

  /**
   * 线性插值
   */
  lerp(start, end, factor) {
    return start + (end - start) * factor;
  }

  /**
   * 限制数值范围
   */
  clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  /**
   * 计算两点距离
   */
  distance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * 格式化时间
   */
  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return \`\${mins}:\${secs.toString().padStart(2, '0')}\`;
  }

  /**
   * 延迟执行
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 深度克隆对象
   */
  deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }
}

/**
 * 🎨 2D向量类
 */
class Vector2 {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  /**
   * 向量加法
   */
  add(vector) {
    return new Vector2(this.x + vector.x, this.y + vector.y);
  }

  /**
   * 向量减法
   */
  subtract(vector) {
    return new Vector2(this.x - vector.x, this.y - vector.y);
  }

  /**
   * 向量乘法
   */
  multiply(scalar) {
    return new Vector2(this.x * scalar, this.y * scalar);
  }

  /**
   * 向量长度
   */
  magnitude() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  /**
   * 单位向量
   */
  normalize() {
    const mag = this.magnitude();
    return mag > 0 ? this.multiply(1 / mag) : new Vector2(0, 0);
  }

  /**
   * 点积
   */
  dot(vector) {
    return this.x * vector.x + this.y * vector.y;
  }
}

// 🚀 初始化游戏引擎
const gameEngine = new GameEngine();

// 暴露到全局作用域
window.GameEngine = GameEngine;
window.Vector2 = Vector2;
window.gameEngine = gameEngine;

console.log('✅ 游戏运行时引擎加载完成');`;
  }

  /**
   * 根据节点生成设置代码
   */
  private generateNodeSetupCode(): string {
    const nodes = (this.graph as any)._nodes || [];
    if (nodes.length === 0) {
      return `    // 当前没有节点，这是一个基础的Hello World游戏
    // 添加节点到编辑器中来扩展游戏功能`;
    }

    const nodeSetupCode = nodes.map((node: any, index: number) => {
      const nodeType = node.type || 'UnknownNode';
      const nodeTitle = node.title || `Node${index + 1}`;
      
      return `    // 节点 ${index + 1}: ${nodeTitle} (${nodeType})
    this.setup${this.sanitizeNodeName(nodeTitle)}();`;
    }).join('\n');

    return `    // 基于节点图自动生成的设置代码
${nodeSetupCode}
    
    // 节点设置完成，游戏已准备就绪`;
  }

  /**
   * 根据节点生成更新代码
   */
  private generateUpdateCode(): string {
    const nodes = (this.graph as any)._nodes || [];
    if (nodes.length === 0) {
      return `    // 基础更新逻辑
    // 这里可以添加游戏的核心逻辑`;
    }

    const updateCode = nodes.map((node: any, index: number) => {
      const nodeTitle = node.title || `Node${index + 1}`;
      
      return `    // 更新节点: ${nodeTitle}
    this.update${this.sanitizeNodeName(nodeTitle)}(timestamp);`;
    }).join('\n');

    return `    // 基于节点图的更新逻辑
${updateCode}`;
  }

  /**
   * 清理节点名称，使其适合作为方法名
   */
  private sanitizeNodeName(name: string): string {
    return name
      .replace(/[^a-zA-Z0-9]/g, '')
      .replace(/^./, str => str.toUpperCase()) || 'Node';
  }
}
