// main.js - 游戏主入口 (热更新版本)

let currentGraphData = null;
let gameInitialized = false;
let gameObjects = new Map(); // 存储游戏对象

// 监听来自父窗口(编辑器)的消息
window.addEventListener('message', (event) => {
    if (event.data?.type === 'update-game-graph') {
        console.log('🎮 [main.js] 收到节点数据:', event.data.data);
        currentGraphData = event.data.data;

        // 热更新游戏
        if (gameInitialized) {
            hotUpdateGame(currentGraphData);
        } else {
            initializeGame(currentGraphData);
        }
    }
});

// 初始化游戏
async function initializeGame(nodeData) {
    try {
        console.log('🚀 [main.js] 开始初始化游戏...');

        // 等待GameCore加载
        if (typeof GameCore === 'undefined') {
            console.log('⏳ 等待GameCore加载...');
            await waitForGameCore();
        }

        // 初始化PIXI应用
        await GameCore.init(750, 1334);

        // 处理节点数据并创建游戏对象
        await processNodeData(nodeData);

        gameInitialized = true;
        console.log('✅ [main.js] 游戏初始化完成');

    } catch (error) {
        console.error('❌ [main.js] 游戏初始化失败:', error);
    }
}

// 热更新游戏
async function hotUpdateGame(nodeData) {
    try {
        console.log('🔄 [main.js] 开始热更新游戏...');

        // 清除现有游戏对象
        clearGameObjects();

        // 重新处理节点数据
        await processNodeData(nodeData);

        console.log('✅ [main.js] 热更新完成');

    } catch (error) {
        console.error('❌ [main.js] 热更新失败:', error);
    }
}

// 处理节点数据，创建游戏对象
async function processNodeData(nodeData) {
    if (!nodeData || !nodeData.children) {
        console.log('📝 [main.js] 没有子节点数据');
        return;
    }

    console.log('🔧 [main.js] 处理节点数据:', nodeData.children);

    // 获取游戏层
    const gameLayer = GameCore.getLayer('game');
    if (!gameLayer) {
        console.error('❌ 找不到游戏层');
        return;
    }

    // 处理每个子节点
    for (const child of nodeData.children) {
        await createGameObject(child, gameLayer);
    }
}

// 创建游戏对象
async function createGameObject(nodeData, parentContainer) {
    try {
        console.log('🎯 [main.js] 创建游戏对象:', nodeData);

        if (nodeData.nodeType === 'text') {
            // 创建文本对象
            const textObj = new PIXI.Text(nodeData.text || 'Hello World', {
                fontSize: nodeData.style?.fontSize || 48,
                fill: nodeData.style?.fill || '#FFFFFF',
                fontFamily: nodeData.style?.fontFamily || 'Arial'
            });

            // 设置位置和属性
            textObj.x = nodeData.x || 375;
            textObj.y = nodeData.y || 667;
            textObj.scale.set(nodeData.scale || 1);
            textObj.rotation = (nodeData.rotation || 0) * Math.PI / 180;
            textObj.alpha = nodeData.alpha || 1;
            textObj.anchor.set(nodeData.anchor || 0.5);

            // 添加到容器
            parentContainer.addChild(textObj);

            // 存储对象引用
            const objectId = `text_${Date.now()}_${Math.random()}`;
            gameObjects.set(objectId, textObj);

            console.log('✅ [main.js] 文本对象创建成功:', textObj);

        } else {
            console.log('⚠️ [main.js] 未知节点类型:', nodeData.nodeType);
        }

    } catch (error) {
        console.error('❌ [main.js] 创建游戏对象失败:', error);
    }
}

// 清除游戏对象
function clearGameObjects() {
    console.log('🧹 [main.js] 清除现有游戏对象...');

    // 清除游戏层
    const gameLayer = GameCore.getLayer('game');
    if (gameLayer) {
        gameLayer.removeChildren();
    }

    // 清除对象引用
    gameObjects.clear();
}

// 等待GameCore加载
function waitForGameCore() {
    return new Promise((resolve) => {
        const checkGameCore = () => {
            if (typeof GameCore !== 'undefined') {
                resolve();
            } else {
                setTimeout(checkGameCore, 100);
            }
        };
        checkGameCore();
    });
}

// 暴露调试接口
window.gameDebug = {
    getCurrentData: () => currentGraphData,
    getGameObjects: () => gameObjects,
    reinitialize: () => {
        if (currentGraphData) {
            gameInitialized = false;
            initializeGame(currentGraphData);
        }
    }
};

console.log('🎮 [main.js] 热更新系统已加载');