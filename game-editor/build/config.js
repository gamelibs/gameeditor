/**
 * 游戏配置文件
 * 统一管理游戏的各种设置和参数
 */

window.GameConfig = {
  // 游戏基本信息
  gameInfo: {
    name: 'Game Editor Demo',
    version: '1.0.0',
    author: 'Game Editor Team',
    description: '基于节点编辑器的H5游戏演示'
  },

  // 游戏尺寸配置
  display: {
    designWidth: 750,
    designHeight: 1334,
    aspectRatio: 1334 / 750, // 约1.78
    scaleMode: 'fit', // fit, fill, stretch
    backgroundColor: '#000000'
  },

  // 游戏性能配置
  performance: {
    targetFPS: 60,
    enableVSync: true,
    enableAntiAliasing: true,
    maxParticles: 1000,
    enableDebugMode: false
  },

  // 音频配置
  audio: {
    masterVolume: 0.7,
    musicVolume: 0.5,
    sfxVolume: 0.8,
    enableAudio: true,
    audioFormat: 'mp3' // mp3, ogg, wav
  },

  // 输入配置
  input: {
    enableTouch: true,
    enableKeyboard: true,
    enableMouse: true,
    touchSensitivity: 1.0,
    enableVibration: true
  },

  // 物理配置
  physics: {
    gravity: { x: 0, y: 9.8 },
    enablePhysics: true,
    physicsScale: 100,
    collisionPrecision: 'high' // low, medium, high
  },

  // 资源加载配置
  assets: {
    preloadAll: false,
    loadTimeout: 10000, // 10秒
    retryAttempts: 3,
    enableCache: true,
    cacheExpiry: 3600000 // 1小时
  },

  // 调试配置
  debug: {
    showFPS: false,
    showBounds: false,
    showCollisions: false,
    enableConsole: true,
    logLevel: 'info' // error, warn, info, debug
  },

  // 游戏逻辑配置
  gameplay: {
    maxLives: 3,
    startingScore: 0,
    difficulty: 'normal', // easy, normal, hard
    autoSave: true,
    saveInterval: 30000 // 30秒
  },

  // 网络配置
  network: {
    enableMultiplayer: false,
    serverUrl: 'ws://localhost:8080',
    reconnectAttempts: 5,
    pingInterval: 1000
  },

  // 本地化配置
  localization: {
    defaultLanguage: 'zh-CN',
    supportedLanguages: ['zh-CN', 'en-US'],
    enableAutoDetect: true
  },

  // 主题配置
  theme: {
    primaryColor: '#4ECDC4',
    secondaryColor: '#44A08D',
    backgroundColor: '#000000',
    textColor: '#FFFFFF',
    accentColor: '#FF6B6B'
  },

  // 获取配置值的方法
  get: function(path) {
    const keys = path.split('.');
    let value = this;
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        console.warn(`配置路径不存在: ${path}`);
        return null;
      }
    }
    
    return value;
  },

  // 设置配置值的方法
  set: function(path, value) {
    const keys = path.split('.');
    let current = this;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current) || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }
    
    current[keys[keys.length - 1]] = value;
    console.log(`配置已更新: ${path} = ${value}`);
  },

  // 重置配置到默认值
  reset: function() {
    console.log('重置游戏配置到默认值');
    // 这里可以重新加载默认配置
  },

  // 保存配置到本地存储
  save: function() {
    try {
      const configData = JSON.stringify(this, null, 2);
      localStorage.setItem('gameConfig', configData);
      console.log('游戏配置已保存到本地存储');
    } catch (error) {
      console.error('保存配置失败:', error);
    }
  },

  // 从本地存储加载配置
  load: function() {
    try {
      const configData = localStorage.getItem('gameConfig');
      if (configData) {
        const savedConfig = JSON.parse(configData);
        Object.assign(this, savedConfig);
        console.log('游戏配置已从本地存储加载');
      }
    } catch (error) {
      console.error('加载配置失败:', error);
    }
  },

  // 初始化配置
  init: function() {
    // 从本地存储加载配置
    this.load();
    
    // 应用配置到游戏
    this.apply();
    
    console.log('游戏配置初始化完成');
  },

  // 应用配置到游戏
  apply: function() {
    // 应用显示配置
    if (this.display.backgroundColor) {
      document.body.style.backgroundColor = this.display.backgroundColor;
    }
    
    // 应用主题配置
    if (this.theme.primaryColor) {
      document.documentElement.style.setProperty('--primary-color', this.theme.primaryColor);
    }
    
    // 应用调试配置
    if (this.debug.showFPS) {
      this.showFPS();
    }
    
    console.log('游戏配置已应用');
  },

  // 显示FPS
  showFPS: function() {
    const fpsDisplay = document.createElement('div');
    fpsDisplay.id = 'fps-display';
    fpsDisplay.style.cssText = `
      position: fixed;
      top: 10px;
      left: 10px;
      background: rgba(0, 0, 0, 0.8);
      color: #4ECDC4;
      padding: 5px 10px;
      border-radius: 3px;
      font-family: monospace;
      font-size: 12px;
      z-index: 1000;
    `;
    document.body.appendChild(fpsDisplay);
    
    let frameCount = 0;
    let lastTime = performance.now();
    
    function updateFPS() {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        fpsDisplay.textContent = `FPS: ${fps}`;
        frameCount = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(updateFPS);
    }
    
    updateFPS();
  }
};

// 自动初始化配置
if (typeof window !== 'undefined') {
  window.GameConfig.init();
} 