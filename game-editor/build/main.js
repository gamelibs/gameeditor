// main.js - 游戏主入口

let currentGraphData = null;

// 监听来自父窗口(编辑器)的消息
window.addEventListener('message', (event) => {
    if (event.data?.type === 'update-game-graph') {
        console.log('[main.js] 收到节点数据:', event.data.data);
        currentGraphData = event.data.data;
        prepareGameData(currentGraphData);
    }
});

// 预留：节点数据准备接口
function prepareGameData(nodeData) {
    // 这里只做数据保存和打印，不执行
    window._pendingNodeData = nodeData;
    console.log('[main.js] 已准备好节点数据:', nodeData);
    // 后续可由 logic.js/gamecore.js 调用
}

// 其它初始化逻辑（如引擎初始化、canvas挂载等）可按需添加 