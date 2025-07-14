// edite/edite.ts
// 原子编辑器主逻辑
import { LiteGraph, LGraph, LGraphCanvas } from 'litegraph.js';
import 'litegraph.js/css/litegraph.css';

// 初始化LiteGraph图和画布
const canvasElem = document.getElementById("editor-canvas") as HTMLCanvasElement;
if (!canvasElem) {
    alert("未找到 #editor-canvas，LiteGraph 编辑器无法初始化！");
    throw new Error("未找到 #editor-canvas");
}

const settingsModal = document.getElementById("settings-modal") as HTMLDivElement;
const closeSettings = document.getElementById("close-settings") as HTMLButtonElement;
const bgColorPicker = document.getElementById("bg-color-picker") as HTMLInputElement;
const canvas = document.getElementById("editor-canvas") as HTMLCanvasElement;
const createBtn = document.getElementById("create-node-btn") as HTMLButtonElement;
const nodeLabel = document.getElementById("node-label") as HTMLInputElement;
const inputType = document.getElementById("input-type") as HTMLSelectElement;
const outputType = document.getElementById("output-type") as HTMLSelectElement;

let bgColor = "#222222";
let nodes: any[] = [];
let nodeId = 1;

const settingsBtn = document.getElementById("settings-btn") as HTMLButtonElement;
settingsBtn.onclick = () => {
    settingsModal.style.display = "flex";
};
closeSettings.onclick = () => {
    settingsModal.style.display = "none";
};
bgColorPicker.oninput = (e) => {
    bgColor = (e.target as HTMLInputElement).value;
    drawGrid();
};

function updateNodeList() {
    const navContainer = document.getElementById("node-nav-container");
    if (!navContainer) {
        console.error("导航栏容器未找到");
        return;
    }
    navContainer.innerHTML = "";
    const registered = LiteGraph.registered_node_types;
    if (!registered) {
        navContainer.innerHTML = '<span style=\"color:#888\">无可用节点</span>';
        return;
    }

    // 分类配色，可自定义扩展
    const categoryColors: Record<string, string> = {
        "渲染": "#4ECDC4",
        "容器": "#FFD166",
        "资源": "#FF6B6B",
        "事件": "#1A535C",
        "逻辑": "#F7FFF7",
        "场景": "#B2B2B2",
        "工具": "#FF9F1C",
        "Pixi节点": "#8ecae6" // Pixi 节点专属配色
    };

    // 1. 分类收集
    const groups: Record<string, Array<{ type: string; ctor: any }>> = {};
    for (const nodeTypePath in registered) {
        if (!Object.prototype.hasOwnProperty.call(registered, nodeTypePath)) continue;
        const nodeConstructor = registered[nodeTypePath];
        let category = nodeTypePath.split("/")[0];
        // 优先判断 pixi-nodes 目录，归为 Pixi节点
        if (nodeTypePath.startsWith("pixi-nodes/")) {
            category = "Pixi节点";
        } else if (nodeTypePath.startsWith("pixi/")) {
            // 兼容部分注册为 pixi/xxx 的节点
            category = "Pixi节点";
        }
        if (!groups[category]) groups[category] = [];
        groups[category].push({ type: nodeTypePath, ctor: nodeConstructor });
    }

    // 2. 渲染导航栏
    for (const category in groups) {
        // 一级分类按钮
        const navItem = document.createElement("div");
        navItem.className = "node-nav-item";
        navItem.style.background = `linear-gradient(90deg,${categoryColors[category]||'#4ECDC4'} 40%,#232526 100%)`;
        navItem.style.color = '#fff';
        navItem.textContent = category;
        navItem.title = `【${category}】节点分类，点击或悬停展开`;

        // 二级节点下拉菜单
        const dropdown = document.createElement("div");
        dropdown.className = "node-dropdown";
        dropdown.style.borderTop = `2px solid ${categoryColors[category]||'#4ECDC4'}`;

        groups[category].forEach((node) => {
            const item = document.createElement("div");
            item.className = "node-dropdown-item";
            // 节点中文注释映射，可根据实际节点类型补充
            const nodeComments: Record<string, string> = {
                "render/pixiRectNode": "矩形渲染节点",
                "render/pixiImageNode": "图片渲染节点",
                "containers/GameContainerNodes": "游戏容器节点",
                "resource/textureNode": "纹理资源节点",
                "event/pixiEventNode": "事件触发节点",
                // ...可继续补充
            };
            // Pixi节点友好显示短名
            let nodeLabel = node.type;
            if (category === "Pixi节点") {
                const parts = node.type.split("/");
                nodeLabel = parts[parts.length - 1];
            }
            const comment = nodeComments[node.type] || "";
            item.innerHTML = `<span>${nodeLabel}</span> <span style='color:#888;font-size:13px;margin-left:8px;'>${comment}</span>`;
            item.style.color = categoryColors[category]||'#FFD166';
            item.title = `点击添加【${node.type}】节点` + (comment ? `（${comment}）` : "");
            item.onclick = () => {
                // 这里可扩展为添加节点到画布
                console.log(`Selected node: ${node.type}`);
            };
            dropdown.appendChild(item);
        });

        navItem.appendChild(dropdown);
        navContainer.appendChild(navItem);
    }
    // 交互说明
    navContainer.insertAdjacentHTML('beforeend', '<div style="margin-left:24px;color:#888;font-size:13px;align-self:center;">提示：鼠标悬停分类可展开节点，点击节点可添加到编辑区</div>');
}

createBtn.onclick = () => {
    const label = nodeLabel.value.trim() || `Node${nodeId}`;
    const input = inputType.value;
    const output = outputType.value;
    const node = {
        id: nodeId++,
        label,
        x: 100 + Math.random() * 200,
        y: 100 + Math.random() * 200,
        input,
        output,
    };
    nodes.push(node);
    drawGrid();
    drawNodes();
    updateNodeList();
};

function drawGrid() {
    const ctx = canvas.getContext("2d")!;
    const w = (canvas.width = window.innerWidth);
    const h = (canvas.height = window.innerHeight - 48 - 48); // toolbar+creator-bar
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, w, h);
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x < w; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
    }
    for (let y = 0; y < h; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
    }
    ctx.restore();
}

function drawNodes() {
    const ctx = canvas.getContext("2d")!;
    nodes.forEach((node) => {
        ctx.save();
        ctx.fillStyle = "#333";
        ctx.strokeStyle = "#4ECDC4";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(node.x, node.y, 120, 48, 8);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#eee";
        ctx.font = "16px Arial";
        ctx.fillText(node.label, node.x + 12, node.y + 28);
        // 输入输出端口
        if (node.input !== "none") {
            ctx.beginPath();
            ctx.arc(node.x - 8, node.y + 24, 7, 0, Math.PI * 2);
            ctx.fillStyle = "#888";
            ctx.fill();
        }
        if (node.output !== "none") {
            ctx.beginPath();
            ctx.arc(node.x + 120 + 8, node.y + 24, 7, 0, Math.PI * 2);
            ctx.fillStyle = "#4ECDC4";
            ctx.fill();
        }
        ctx.restore();
    });
}

window.addEventListener("resize", () => {
    drawGrid();
    drawNodes();
});

drawGrid();
drawNodes();

drawNodes();
// 页面加载后自动刷新节点列表，确保异步注册后能显示
window.addEventListener("DOMContentLoaded", () => {
    updateNodeList();
});
