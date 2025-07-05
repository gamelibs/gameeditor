/**
 * 游戏项目文件生成器
 */
import type { GameConfig } from '../runtime/GameRuntime';

export interface GameFile {
  path: string;
  content: string;
}

export async function generateGameProject(config: GameConfig, projectName: string): Promise<GameFile[]> {
  const files: GameFile[] = [];

  // 1. 生成主HTML文件
  files.push({
    path: 'index.html',
    content: generateIndexHTML(config, projectName)
  });

  // 2. 生成游戏配置文件
  files.push({
    path: 'game-config.json',
    content: JSON.stringify(config, null, 2)
  });

  // 3. 下载并包含Pixi.js库文件
  try {
    const pixiResponse = await fetch('https://pixijs.download/release/pixi.min.js');
    if (pixiResponse.ok) {
      const pixiContent = await pixiResponse.text();
      files.push({
        path: 'js/pixi.min.js',
        content: pixiContent
      });
      console.log('✅ Pixi.js 库已下载并包含在导出包中');
    } else {
      console.warn('⚠️ 无法下载Pixi.js库，将使用CDN版本');
    }
  } catch (error) {
    console.warn('⚠️ 无法下载Pixi.js库，将使用CDN版本:', error);
  }

  // 4. 生成游戏运行时文件
  files.push({
    path: 'js/game-runtime.js',
    content: await generateGameRuntimeJS()
  });

  // 5. 生成主游戏文件
  files.push({
    path: 'js/game.js',
    content: generateGameJS()
  });

  // 6. 生成样式文件
  files.push({
    path: 'css/game.css',
    content: generateGameCSS()
  });

  // 7. 生成README文件
  files.push({
    path: 'README.md',
    content: generateReadme(projectName, config)
  });

  // 8. 生成部署说明
  files.push({
    path: 'DEPLOY.md',
    content: generateDeploymentGuide(projectName)
  });

  return files;
}

function generateIndexHTML(config: GameConfig, _projectName: string): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="mobile-web-app-capable" content="yes">
    <title>${config.title}</title>
    <link rel="stylesheet" href="css/game.css">
</head>
<body>
    <div id="loading-screen">
        <div class="loading-content">
            <div class="loading-logo">🎮</div>
            <h1>${config.title}</h1>
            <div class="loading-bar">
                <div class="loading-progress"></div>
            </div>
            <p class="loading-text">正在加载 Pixi.js...</p>
        </div>
    </div>
    
    <div id="game-container" style="display: none;"></div>
    
    <div id="error-screen" style="display: none;">
        <div class="error-content">
            <h2>⚠️ 出现错误</h2>
            <p id="error-message"></p>
            <button onclick="location.reload()">重新加载</button>
        </div>
    </div>

    <!-- Pixi.js 库 - 优先本地，回退到CDN -->
    <script>
        function loadPixiAndStart() {
            const updateProgress = (progress, text) => {
                const progressBar = document.querySelector('.loading-progress');
                const loadingText = document.querySelector('.loading-text');
                if (progressBar) progressBar.style.width = (progress * 100) + '%';
                if (loadingText) loadingText.textContent = text;
            };
            
            updateProgress(0.1, '正在加载 Pixi.js...');
            
            // 尝试加载本地Pixi.js
            const localScript = document.createElement('script');
            localScript.onerror = function() {
                console.warn('本地Pixi.js加载失败，使用CDN版本');
                updateProgress(0.2, '正在从CDN加载 Pixi.js...');
                
                // 回退到CDN
                const cdnScript = document.createElement('script');
                cdnScript.onerror = function() {
                    showError('Pixi.js 加载失败，请检查网络连接');
                };
                cdnScript.onload = function() {
                    updateProgress(0.5, '已加载 Pixi.js，正在启动游戏...');
                    loadGameScripts();
                };
                cdnScript.src = 'https://pixijs.download/release/pixi.min.js';
                document.head.appendChild(cdnScript);
            };
            
            localScript.onload = function() {
                updateProgress(0.5, '已加载 Pixi.js，正在启动游戏...');
                loadGameScripts();
            };
            
            localScript.src = 'js/pixi.min.js';
            document.head.appendChild(localScript);
        }
        
        function loadGameScripts() {
            const updateProgress = (progress, text) => {
                const progressBar = document.querySelector('.loading-progress');
                const loadingText = document.querySelector('.loading-text');
                if (progressBar) progressBar.style.width = (progress * 100) + '%';
                if (loadingText) loadingText.textContent = text;
            };
            
            updateProgress(0.6, '正在加载游戏引擎...');
            
            // 加载游戏运行时
            const runtimeScript = document.createElement('script');
            runtimeScript.onerror = function() {
                showError('游戏引擎加载失败');
            };
            runtimeScript.onload = function() {
                updateProgress(0.8, '正在加载游戏逻辑...');
                
                // 加载主游戏脚本
                const gameScript = document.createElement('script');
                gameScript.onerror = function() {
                    showError('游戏逻辑加载失败');
                };
                gameScript.onload = function() {
                    updateProgress(0.9, '准备启动游戏...');
                };
                gameScript.src = 'js/game.js';
                document.head.appendChild(gameScript);
            };
            runtimeScript.src = 'js/game-runtime.js';
            document.head.appendChild(runtimeScript);
        }
        
        function showError(message) {
            console.error('加载错误:', message);
            
            const loadingScreen = document.getElementById('loading-screen');
            if (loadingScreen) loadingScreen.style.display = 'none';
            
            const errorScreen = document.getElementById('error-screen');
            const errorMessage = document.getElementById('error-message');
            
            if (errorScreen && errorMessage) {
                errorMessage.textContent = message;
                errorScreen.style.display = 'flex';
            } else {
                alert('加载失败: ' + message);
            }
        }
        
        // 页面加载完成后开始加载
        window.addEventListener('load', loadPixiAndStart);
    </script>
</body>
</html>`;
}

async function generateGameRuntimeJS(): Promise<string> {
  return `/**
 * 游戏运行时引擎 - 浏览器版本
 */
class GameRuntime {
    constructor(config, container) {
        this.config = config;
        this.container = container;
        this.app = null;
        this.nodeInstances = new Map();
    }

    async init() {
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
        this.app = new PIXI.Application();
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

    async buildScene() {
        // 清空舞台
        this.app.stage.removeChildren();

        // 根据节点配置重建场景
        for (const nodeConfig of this.config.nodes) {
            await this.createNodeInstance(nodeConfig);
        }

        // 处理节点连接
        this.processNodeConnections();
    }

    async createNodeInstance(nodeConfig) {
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
                console.warn(\`Unknown node type: \${type}\`);
        }
    }

    createTextNode(properties) {
        // 创建Text对象
        const text = new PIXI.Text();
        
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

    createButtonNode(properties) {
        const container = new PIXI.Container();
        
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
        const bg = new PIXI.Graphics()
            .roundRect(0, 0, adaptiveWidth, adaptiveHeight, 8)
            .fill(0x444444)
            .stroke({ color: 0x666666, width: 2 });
        
        // 创建按钮文字 - 自适应字体大小
        const text = new PIXI.Text();
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
        container.nodeId = properties.nodeId;
        container.adaptiveWidth = adaptiveWidth;
        container.adaptiveHeight = adaptiveHeight;
        
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

    createClickCounterNode(properties) {
        const text = new PIXI.Text();
        
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
        text.clickCount = 0;
        text.prefix = prefix;
        text.nodeId = properties.nodeId;

        console.log('Created click counter node:', {
            text: text.text,
            x: text.x,
            y: text.y,
            prefix: prefix,
            fontSize: adaptiveFontSize
        });

        return text;
    }

    createDisplayCollectorNode(properties) {
        const container = new PIXI.Container();
        
        // 设置容器属性
        container.x = properties.x || 0;
        container.y = properties.y || 0;
        container.scale.set(properties.scale || 1);
        container.rotation = properties.rotation || 0;
        container.alpha = properties.alpha !== undefined ? properties.alpha : 1;
        
        // 存储节点ID和属性
        container.nodeId = properties.nodeId;
        container.isDisplayCollector = true;
        container.collectedObjects = new Set();
        container.maxInputs = properties.maxInputs || 10;
        container.currentInputs = properties.currentInputs || 1;
        
        container.label = \`DisplayCollector_\${properties.nodeId}\`;
        
        console.log('Created display collector node:', {
            x: container.x,
            y: container.y,
            nodeId: properties.nodeId,
            maxInputs: properties.maxInputs,
            currentInputs: properties.currentInputs
        });

        return container;
    }

    processNodeConnections() {
        console.log('Processing node connections...');
        console.log('Links:', this.config.links);
        console.log('Node instances:', Array.from(this.nodeInstances.keys()));
        
        // 第一步：处理 Display Collector 节点的输入连接
        this.processDisplayCollectorConnections();
        
        // 第二步：处理显示对象连接（添加到舞台）
        for (const link of this.config.links) {
            const [, outputNodeId, outputSlot, inputNodeId, inputSlot] = link;
            
            console.log(\`Processing link: output node \${outputNodeId}[\${outputSlot}] -> input node \${inputNodeId}[\${inputSlot}]\`);
            
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

    processDisplayCollectorConnections() {
        // 查找所有 Display Collector 节点
        const collectorNodes = new Map();
        
        for (const [nodeId, nodeInstance] of this.nodeInstances) {
            if (nodeInstance.isDisplayCollector) {
                collectorNodes.set(nodeId, nodeInstance);
            }
        }
        
        // 处理每个 Display Collector 的输入连接
        for (const [collectorId, collectorInstance] of collectorNodes) {
            const inputConnections = this.config.links.filter((link) => {
                const [, , , inputNodeId] = link;
                return inputNodeId === collectorId;
            });
            
            console.log(\`Display Collector \${collectorId} has \${inputConnections.length} input connections\`);
            
            // 清空容器，重新收集
            collectorInstance.removeChildren();
            collectorInstance.collectedObjects.clear();
            
            // 处理每个输入连接
            for (const link of inputConnections) {
                const [, outputNodeId, , , inputSlot] = link;
                const sourceNode = this.nodeInstances.get(outputNodeId);
                
                if (sourceNode && inputSlot < collectorInstance.currentInputs) {
                    console.log(\`Collecting display object from node \${outputNodeId} to collector \${collectorId}\`);
                    
                    // 添加到收集器容器
                    if (!collectorInstance.children.includes(sourceNode)) {
                        collectorInstance.addChild(sourceNode);
                        collectorInstance.collectedObjects.add(sourceNode);
                    }
                }
            }
            
            console.log(\`Display Collector \${collectorId} now contains \${collectorInstance.children.length} objects\`);
        }
    }

    setupEventConnections() {
        // 分析事件连接关系
        const eventConnections = new Map();
        
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
                eventConnections.get(outputNodeId).push(inputNodeId);
                
                console.log(\`Found event connection: button \${outputNodeId} -> counter \${inputNodeId}\`);
            }
        }
        
        // 为按钮设置点击事件处理
        eventConnections.forEach((targetNodeIds, buttonNodeId) => {
            const buttonInstance = this.nodeInstances.get(buttonNodeId);
            if (buttonInstance && buttonInstance.eventMode) {
                // 添加点击事件监听
                buttonInstance.on('pointerdown', () => {
                    console.log(\`Button \${buttonNodeId} clicked!\`);
                    
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
                
                console.log(\`Setup click handler for button \${buttonNodeId} targeting counters: \${targetNodeIds}\`);
            }
        });
    }

    triggerClickCounter(counterNodeId) {
        const counterInstance = this.nodeInstances.get(counterNodeId);
        if (counterInstance && typeof counterInstance.clickCount === 'number') {
            // 增加点击计数
            counterInstance.clickCount++;
            
            // 更新显示文本
            const prefix = counterInstance.prefix || 'Clicks: ';
            counterInstance.text = prefix + counterInstance.clickCount;
            
            console.log(\`Counter \${counterNodeId} updated to: \${counterInstance.text}\`);
        }
    }

    startGameLoop() {
        // 启动渲染循环
        this.app.ticker.add(() => {
            this.update();
        });
    }

    update() {
        // 每帧更新逻辑
    }
    
    setupResize() {
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

    destroy() {
        if (this.app) {
            this.app.destroy(true);
        }
        this.nodeInstances.clear();
    }
}

// 导出到全局
window.GameRuntime = GameRuntime;`;
}

function generateGameJS(): string {
  return `/**
 * 主游戏文件
 */
let gameRuntime = null;

function showError(message) {
    console.error('游戏错误:', message);
    
    // 隐藏加载画面
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) loadingScreen.style.display = 'none';
    
    // 显示错误画面
    const errorScreen = document.getElementById('error-screen');
    const errorMessage = document.getElementById('error-message');
    
    if (errorScreen && errorMessage) {
        errorMessage.textContent = message;
        errorScreen.style.display = 'flex';
    } else {
        // 回退方案
        alert('游戏启动失败: ' + message);
    }
}

function updateLoadingProgress(progress, text) {
    const progressBar = document.querySelector('.loading-progress');
    const loadingText = document.querySelector('.loading-text');
    
    if (progressBar) {
        progressBar.style.width = (progress * 100) + '%';
    }
    
    if (loadingText && text) {
        loadingText.textContent = text;
    }
}

async function startGame() {
    try {
        // 检查Pixi.js是否已加载
        if (typeof PIXI === 'undefined') {
            throw new Error('Pixi.js 未正确加载');
        }
        
        updateLoadingProgress(0.95, '加载游戏配置...');
        
        // 加载游戏配置
        const response = await fetch('game-config.json');
        if (!response.ok) {
            throw new Error(\`配置文件加载失败: HTTP \${response.status}\`);
        }
        
        const gameConfig = await response.json();
        console.log('✅ 游戏配置加载完成:', gameConfig);
        
        // 验证游戏配置
        if (!gameConfig.nodes || !Array.isArray(gameConfig.nodes)) {
            throw new Error('游戏配置无效：缺少节点数据');
        }
        
        if (!gameConfig.title) {
            gameConfig.title = '未命名游戏';
        }
        
        if (!gameConfig.width || !gameConfig.height) {
            gameConfig.width = 640;
            gameConfig.height = 480;
        }
        
        updateLoadingProgress(0.98, '初始化游戏引擎...');
        
        // 初始化游戏
        const container = document.getElementById('game-container');
        if (!container) {
            throw new Error('游戏容器未找到');
        }
        
        // 检查GameRuntime是否已定义
        if (typeof GameRuntime === 'undefined') {
            throw new Error('游戏引擎未正确加载');
        }
        
        gameRuntime = new GameRuntime(gameConfig, container);
        await gameRuntime.init();
        
        updateLoadingProgress(1.0, '启动完成！');
        
        // 延迟一下让用户看到100%进度
        setTimeout(() => {
            // 隐藏加载画面
            const loadingScreen = document.getElementById('loading-screen');
            if (loadingScreen) {
                loadingScreen.style.opacity = '0';
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                }, 500);
            }
            
            // 显示游戏容器
            container.style.display = 'block';
            
            console.log('🎮 游戏启动成功!');
        }, 300);
        
    } catch (error) {
        console.error('游戏启动失败:', error);
        showError(error.message || '未知错误');
    }
}

// 检查依赖并启动游戏
function checkDependenciesAndStart() {
    let attempts = 0;
    const maxAttempts = 100; // 10秒超时
    
    const checkAndStart = () => {
        attempts++;
        
        if (typeof PIXI !== 'undefined' && typeof GameRuntime !== 'undefined') {
            console.log('✅ 所有依赖已加载，启动游戏...');
            startGame();
        } else if (attempts >= maxAttempts) {
            showError('依赖加载超时，请重新加载页面');
        } else {
            setTimeout(checkAndStart, 100);
        }
    };
    
    checkAndStart();
}

// 当所有脚本加载完成后启动游戏
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkDependenciesAndStart);
} else {
    checkDependenciesAndStart();
}

// 页面卸载时清理资源
window.addEventListener('beforeunload', () => {
    if (gameRuntime) {
        console.log('🧹 清理游戏资源...');
        gameRuntime.destroy();
    }
});

// 监听在线/离线状态
window.addEventListener('online', () => {
    console.log('🌐 网络连接已恢复');
});

window.addEventListener('offline', () => {
    console.log('📴 网络连接已断开');
});`;
}

function generateGameCSS(): string {
  return `/**
 * 游戏样式文件 - 增强版
 */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

html, body {
    width: 100%;
    height: 100%;
    overflow: hidden;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    background: #000;
    color: #fff;
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
    -webkit-tap-highlight-color: transparent;
}

/* 加载画面 */
#loading-screen {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    transition: opacity 0.5s ease;
}

.loading-content {
    text-align: center;
    max-width: 90%;
    padding: 20px;
}

.loading-logo {
    font-size: 4rem;
    margin-bottom: 1rem;
    animation: bounce 2s ease-in-out infinite;
}

@keyframes bounce {
    0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
    40% { transform: translateY(-10px); }
    60% { transform: translateY(-5px); }
}

.loading-content h1 {
    font-size: 2.5rem;
    font-weight: bold;
    margin-bottom: 2rem;
    color: #fff;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
}

.loading-bar {
    width: 300px;
    max-width: 80vw;
    height: 8px;
    background: rgba(255,255,255,0.3);
    border-radius: 4px;
    margin: 0 auto 1rem;
    overflow: hidden;
}

.loading-progress {
    height: 100%;
    background: linear-gradient(90deg, #4ECDC4, #44A08D);
    border-radius: 4px;
    width: 0%;
    transition: width 0.3s ease;
    position: relative;
}

.loading-progress::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
    animation: shimmer 2s infinite;
}

@keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
}

.loading-text {
    font-size: 1.1rem;
    opacity: 0.9;
    margin-bottom: 1rem;
}

/* 游戏容器 */
#game-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    background: #222;
}

#game-container canvas {
    border: none;
    background: transparent;
    touch-action: manipulation;
    image-rendering: auto;
    max-width: 100vw;
    max-height: 100vh;
    box-shadow: 0 4px 20px rgba(0,0,0,0.5);
}

/* 错误画面 */
#error-screen {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.95);
    display: none;
    justify-content: center;
    align-items: center;
    z-index: 1001;
}

.error-content {
    text-align: center;
    background: linear-gradient(135deg, #ff6b6b, #ee5a24);
    color: white;
    padding: 2rem;
    border-radius: 16px;
    max-width: 90%;
    max-width: 450px;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7);
    animation: errorSlideIn 0.4s ease-out;
    border: 2px solid rgba(255, 255, 255, 0.2);
}

@keyframes errorSlideIn {
    from {
        opacity: 0;
        transform: translateY(-100px) scale(0.8);
    }
    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

.error-content h2 {
    color: #fff;
    margin-bottom: 1.5rem;
    font-size: 1.8rem;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.error-content p {
    margin-bottom: 2rem;
    line-height: 1.6;
    color: rgba(255, 255, 255, 0.9);
    font-size: 1.1rem;
    background: rgba(0, 0, 0, 0.2);
    padding: 1rem;
    border-radius: 8px;
    border-left: 4px solid rgba(255, 255, 255, 0.5);
}

.error-content button {
    background: rgba(255, 255, 255, 0.2);
    color: white;
    border: 2px solid rgba(255, 255, 255, 0.5);
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s ease;
    backdrop-filter: blur(10px);
}

.error-content button:hover {
    background: rgba(255, 255, 255, 0.3);
    border-color: rgba(255, 255, 255, 0.8);
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
}

.error-content button:active {
    transform: translateY(0);
}

/* 移动端优化 */
@media (max-width: 768px) {
    .loading-content h1 {
        font-size: 2rem;
    }
    
    .loading-bar {
        width: 250px;
    }
    
    .error-content {
        margin: 1rem;
        padding: 1.5rem;
    }
    
    #game-container canvas {
        border: none;
    }
}

@media (max-height: 600px) {
    .loading-content h1 {
        font-size: 1.8rem;
        margin-bottom: 1rem;
    }
    
    .loading-logo {
        font-size: 3rem;
        margin-bottom: 0.5rem;
    }
}

/* 响应式游戏画布 */
@media (orientation: landscape) {
    #game-container canvas {
        max-height: 100vh;
        width: auto;
    }
}

@media (orientation: portrait) {
    #game-container canvas {
        max-width: 100vw;
        height: auto;
    }
}

/* 高DPI屏幕优化 */
@media (-webkit-min-device-pixel-ratio: 2) {
    #game-container canvas {
        image-rendering: auto;
    }
}

/* 安全区域适配 (iPhone X等) */
@supports(padding: max(0px)) {
    #game-container {
        padding-left: env(safe-area-inset-left);
        padding-right: env(safe-area-inset-right);
        padding-top: env(safe-area-inset-top);
        padding-bottom: env(safe-area-inset-bottom);
    }
}

/* 性能优化 */
#game-container,
#loading-screen,
#error-screen {
    will-change: transform;
    transform: translateZ(0);
}

/* 减少动画（尊重用户偏好） */
@media (prefers-reduced-motion: reduce) {
    .loading-logo,
    .loading-progress::after,
    .error-content {
        animation: none;
    }
    
    #loading-screen,
    .error-content button {
        transition: none;
    }
}

/* 暗色模式支持 */
@media (prefers-color-scheme: dark) {
    .error-content {
        background: #2c3e50;
        color: #ecf0f1;
    }
    
    .error-content p {
        color: #bdc3c7;
    }
}`;
}

function generateReadme(projectName: string, config: GameConfig): string {
  return `# ${config.title}

这是一个由 Pixi.js 游戏编辑器生成的游戏项目。

## 项目信息

- **项目名称**: ${projectName}
- **游戏标题**: ${config.title}
- **游戏尺寸**: ${config.width} x ${config.height}
- **版本**: ${config.version}

## 如何运行

1. 在项目目录中启动一个本地服务器：
   \`\`\`bash
   # 使用 Python
   python -m http.server 8000
   
   # 或使用 Node.js
   npx serve .
   
   # 或使用 VS Code Live Server 扩展
   \`\`\`

2. 在浏览器中打开 \`http://localhost:8000\`

## 项目结构

\`\`\`
${projectName}/
├── index.html          # 主HTML文件
├── game-config.json    # 游戏配置文件
├── css/
│   └── game.css       # 游戏样式
├── js/
│   ├── game-runtime.js # 游戏运行时引擎
│   └── game.js        # 主游戏逻辑
└── README.md          # 说明文档
\`\`\`

## 技术栈

- **Pixi.js**: 2D渲染引擎
- **HTML5 Canvas**: 渲染画布
- **ES6 JavaScript**: 游戏逻辑

## 注意事项

- 游戏必须在HTTP(S)服务器环境下运行，不能直接双击HTML文件
- 支持现代浏览器（Chrome, Firefox, Safari, Edge）
- 移动端已进行基础适配

## 生成信息

- 生成时间: ${new Date().toLocaleString()}
- 生成器: Pixi.js 游戏编辑器
`;
}

function generateDeploymentGuide(projectName: string): string {
  return `# ${projectName} 部署指南

## 快速部署

### 方法1：本地服务器
\`\`\`bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000

# Node.js
npx serve .

# PHP
php -S localhost:8000
\`\`\`

然后在浏览器中访问 \`http://localhost:8000\`

### 方法2：在线部署

#### Vercel (推荐)
1. 安装 Vercel CLI: \`npm i -g vercel\`
2. 在项目目录运行: \`vercel\`
3. 按提示完成部署

#### Netlify
1. 访问 [Netlify Drop](https://app.netlify.com/drop)
2. 将项目文件夹拖拽到页面上
3. 等待部署完成

#### GitHub Pages
1. 将代码推送到 GitHub 仓库
2. 在仓库设置中启用 GitHub Pages
3. 选择分支为 \`main\` 或 \`gh-pages\`

## 注意事项

⚠️ **重要**：游戏必须通过HTTP(S)服务器运行，不能直接双击HTML文件打开！

- 支持所有现代浏览器
- 移动端已优化
- 建议使用HTTPS以获得最佳体验

## 故障排除

如果遇到问题：
1. 检查浏览器控制台是否有错误
2. 确保所有文件都在正确位置
3. 验证是否通过HTTP服务器访问
4. 检查网络连接（如果使用CDN资源）

生成时间: ${new Date().toLocaleString()}
`;
}
