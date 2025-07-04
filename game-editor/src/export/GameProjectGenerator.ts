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

  // 3. 生成游戏运行时文件
  files.push({
    path: 'js/game-runtime.js',
    content: await generateGameRuntimeJS()
  });

  // 4. 生成主游戏文件
  files.push({
    path: 'js/game.js',
    content: generateGameJS()
  });

  // 5. 生成样式文件
  files.push({
    path: 'css/game.css',
    content: generateGameCSS()
  });

  // 6. 生成README文件
  files.push({
    path: 'README.md',
    content: generateReadme(projectName, config)
  });

  return files;
}

function generateIndexHTML(config: GameConfig, _projectName: string): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${config.title}</title>
    <link rel="stylesheet" href="css/game.css">
    <script src="https://pixijs.download/release/pixi.min.js"></script>
</head>
<body>
    <div id="loading-screen">
        <div class="loading-content">
            <h1>${config.title}</h1>
            <div class="loading-bar">
                <div class="loading-progress"></div>
            </div>
            <p>加载中...</p>
        </div>
    </div>
    
    <div id="game-container" style="display: none;"></div>

    <script src="js/game-runtime.js"></script>
    <script src="js/game.js"></script>
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

async function startGame() {
    try {
        // 加载游戏配置
        const response = await fetch('game-config.json');
        const gameConfig = await response.json();
        
        // 隐藏加载画面
        document.getElementById('loading-screen').style.display = 'none';
        document.getElementById('game-container').style.display = 'block';
        
        // 初始化游戏
        const container = document.getElementById('game-container');
        gameRuntime = new GameRuntime(gameConfig, container);
        await gameRuntime.init();
        
        console.log('游戏启动成功!');
        
    } catch (error) {
        console.error('游戏启动失败:', error);
        alert('游戏启动失败: ' + error.message);
    }
}

// 页面加载完成后启动游戏
window.addEventListener('load', () => {
    // 模拟加载时间
    setTimeout(startGame, 1000);
});

// 页面卸载时清理资源
window.addEventListener('beforeunload', () => {
    if (gameRuntime) {
        gameRuntime.destroy();
    }
});`;
}

function generateGameCSS(): string {
  return `/**
 * 游戏样式文件
 */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Arial', sans-serif;
    background: #000;
    color: #fff;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
}

#loading-screen {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.loading-content {
    text-align: center;
    max-width: 400px;
    padding: 20px;
}

.loading-content h1 {
    font-size: 2.5em;
    margin-bottom: 30px;
    color: #fff;
    text-shadow: 0 2px 4px rgba(0,0,0,0.5);
}

.loading-bar {
    width: 100%;
    height: 8px;
    background: rgba(255,255,255,0.3);
    border-radius: 4px;
    overflow: hidden;
    margin: 20px 0;
}

.loading-progress {
    height: 100%;
    background: linear-gradient(90deg, #4ECDC4, #44A08D);
    border-radius: 4px;
    animation: loading 2s ease-in-out infinite;
}

@keyframes loading {
    0% { width: 0%; }
    50% { width: 70%; }
    100% { width: 100%; }
}

.loading-content p {
    font-size: 1.2em;
    opacity: 0.9;
}

#game-container {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100vw;
    height: 100vh;
    background: #222;
}

#game-container canvas {
    max-width: 100vw;
    max-height: 100vh;
    width: auto;
    height: auto;
    object-fit: contain;
    border: 1px solid #444;
    box-shadow: 0 4px 20px rgba(0,0,0,0.5);
}

/* 移动端适配 */
@media (max-width: 768px) {
    .loading-content h1 {
        font-size: 2em;
    }
    
    #game-container canvas {
        border: none;
        max-width: 100vw;
        max-height: 100vh;
    }
}

/* 确保游戏画布始终居中且保持宽高比 */
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
