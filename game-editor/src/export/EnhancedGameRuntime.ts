/**
 * 增强的游戏运行时模板
 */
export function generateEnhancedGameRuntime(): string {
  return `/**
 * 增强的游戏运行时引擎 v2.0
 */
class EnhancedGameRuntime {
    constructor(config, container) {
        this.config = config;
        this.container = container;
        this.app = null;
        this.nodeInstances = new Map();
        this.assetLoader = null;
        this.loadingProgress = 0;
        this.gameStarted = false;
        
        // 性能监控
        this.performanceMonitor = {
            fps: 0,
            frameCount: 0,
            lastTime: performance.now()
        };
    }

    async init() {
        try {
            // 1. 初始化资源加载器
            await this.initAssetLoader();
            
            // 2. 预加载所有资源
            await this.preloadAssets();
            
            // 3. 初始化Pixi应用
            await this.initPixiApp();
            
            // 4. 构建游戏场景
            await this.buildScene();
            
            // 5. 启动游戏
            this.startGame();
            
            console.log('🎮 游戏初始化完成');
            
        } catch (error) {
            console.error('❌ 游戏初始化失败:', error);
            this.showError('游戏初始化失败: ' + error.message);
        }
    }
    
    async initAssetLoader() {
        // 创建PIXI资源加载器
        this.assetLoader = new PIXI.Assets;
        
        // 监听加载进度
        this.assetLoader.on('progress', (progress) => {
            this.loadingProgress = progress;
            this.updateLoadingScreen(progress);
        });
    }
    
    async preloadAssets() {
        if (!this.config.assets || this.config.assets.length === 0) {
            return;
        }
        
        const loadPromises = this.config.assets.map(async (asset) => {
            try {
                if (asset.data) {
                    // 使用base64数据
                    return await PIXI.Assets.load(asset.data);
                } else {
                    // 从URL加载
                    return await PIXI.Assets.load(asset.url);
                }
            } catch (error) {
                console.warn(\`Failed to load asset \${asset.id}:\`, error);
                return null;
            }
        });
        
        await Promise.all(loadPromises);
    }
    
    async initPixiApp() {
        // 计算合适的游戏尺寸
        const { displayWidth, displayHeight } = this.calculateGameSize();
        
        // 初始化PIXI应用
        this.app = new PIXI.Application();
        await this.app.init({
            width: this.config.width,
            height: this.config.height,
            background: this.config.backgroundColor || '#222222',
            autoStart: false,
            antialias: true,
            resolution: window.devicePixelRatio || 1,
            powerPreference: 'high-performance'
        });

        // 设置canvas样式
        this.setupCanvas(displayWidth, displayHeight);
        
        // 添加到容器
        this.container.appendChild(this.app.canvas);
        
        // 设置交互
        this.app.stage.eventMode = 'static';
        
        // 添加性能监控
        this.setupPerformanceMonitor();
        
        // 响应式处理
        this.setupResponsive();
    }
    
    calculateGameSize() {
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
        
        return { displayWidth, displayHeight };
    }
    
    setupCanvas(width, height) {
        const canvas = this.app.canvas;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        canvas.style.display = 'block';
        canvas.style.margin = '0 auto';
        canvas.style.touchAction = 'manipulation';
    }
    
    setupPerformanceMonitor() {
        this.app.ticker.add(() => {
            this.performanceMonitor.frameCount++;
            const currentTime = performance.now();
            
            if (currentTime - this.performanceMonitor.lastTime >= 1000) {
                this.performanceMonitor.fps = this.performanceMonitor.frameCount;
                this.performanceMonitor.frameCount = 0;
                this.performanceMonitor.lastTime = currentTime;
                
                // 可选：显示FPS
                if (this.config.debug) {
                    console.log(\`FPS: \${this.performanceMonitor.fps}\`);
                }
            }
        });
    }
    
    setupResponsive() {
        const handleResize = () => {
            const { displayWidth, displayHeight } = this.calculateGameSize();
            this.setupCanvas(displayWidth, displayHeight);
        };
        
        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', () => {
            setTimeout(handleResize, 100);
        });
    }
    
    updateLoadingScreen(progress) {
        const progressBar = document.querySelector('.loading-progress');
        const progressText = document.querySelector('.loading-text');
        
        if (progressBar) {
            progressBar.style.width = (progress * 100) + '%';
        }
        
        if (progressText) {
            progressText.textContent = \`加载中... \${Math.round(progress * 100)}%\`;
        }
    }
    
    startGame() {
        // 隐藏加载画面
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 500);
        }
        
        // 启动渲染循环
        this.app.start();
        this.gameStarted = true;
        
        // 派发游戏开始事件
        this.dispatchEvent('gameStarted');
    }
    
    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = \`
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #ff4444;
            color: white;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            z-index: 10000;
        \`;
        errorDiv.innerHTML = \`
            <h3>游戏错误</h3>
            <p>\${message}</p>
            <button onclick="this.parentElement.remove()">确定</button>
        \`;
        document.body.appendChild(errorDiv);
    }
    
    dispatchEvent(eventName, data = {}) {
        const event = new CustomEvent(eventName, { detail: data });
        window.dispatchEvent(event);
    }
    
    destroy() {
        if (this.app) {
            this.app.destroy(true, { children: true, texture: true });
        }
        this.nodeInstances.clear();
        this.gameStarted = false;
    }
    
    // ... 其他方法保持不变
}

// 导出到全局
window.EnhancedGameRuntime = EnhancedGameRuntime;
window.GameRuntime = EnhancedGameRuntime; // 向后兼容
`;
}
