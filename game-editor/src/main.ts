
import { setupPixiNodeLogger, LogLevels, LogLevelNames } from './pixiNodeLogger';

// 0. 在 sidebar 顶部插入按钮组（不遮挡canvas）
function createTopbarButtonGroup(graph: any, LiteGraph: any) {
  const topbar = document.getElementById('topbar');
  if (!topbar) return;
  if (document.getElementById('topbar-btn-group')) return;
  
  // 初始化日志系统
  setupPixiNodeLogger(LiteGraph);
  
  const btnGroup = document.createElement('div');
  btnGroup.id = 'topbar-btn-group';
  btnGroup.className = 'topbar-btn-group';
  // 标题
  const title = document.createElement('span');
  title.textContent = 'Game\nEditor';
  btnGroup.appendChild(title);
  // 保存按钮
  const saveBtn = document.createElement('button');
  saveBtn.textContent = 'save';
  saveBtn.className = 'topbar-btn';
  saveBtn.onclick = () => {
    const graphData = graph.serialize();
    localStorage.setItem('game-editor-graph', JSON.stringify(graphData));
    saveBtn.textContent = 'saved';
    setTimeout(() => (saveBtn.textContent = 'save'), 1000);
  };
  btnGroup.appendChild(saveBtn);
  // 清除按钮
  const clearBtn = document.createElement('button');
  clearBtn.textContent = 'clear';
  clearBtn.className = 'topbar-btn';
  clearBtn.onclick = () => {
    localStorage.removeItem('game-editor-graph');
    graph.clear();
    clearBtn.textContent = 'cleared';
    setTimeout(() => (clearBtn.textContent = 'clear'), 1000);
  };
  btnGroup.appendChild(clearBtn);
  // 运行/停止按钮
  const runBtn = document.createElement('button');
  runBtn.id = 'run-graph-btn';
  runBtn.textContent = 'play';
  runBtn.className = 'topbar-btn';
  let running = false;
  runBtn.onclick = () => {
    if (!running) {
      const graphData = graph.serialize();
      localStorage.setItem('game-editor-graph', JSON.stringify(graphData));
      graph.runStep();
      runBtn.textContent = 'stop';
      running = true;
    } else {
      window.location.reload();
    }
  };
  btnGroup.appendChild(runBtn);

  // 添加日志级别选择控件
  const logLevelContainer = document.createElement('div');
  logLevelContainer.className = 'log-level-container';
  logLevelContainer.style.display = 'inline-block';
  logLevelContainer.style.marginLeft = '10px';
  
  const logLevelLabel = document.createElement('span');
  logLevelLabel.textContent = '日志:';
  logLevelLabel.className = 'log-level-label';
  logLevelLabel.style.fontSize = '12px';
  logLevelLabel.style.marginRight = '5px';
  logLevelContainer.appendChild(logLevelLabel);
  
  const logLevelSelect = document.createElement('select');
  logLevelSelect.className = 'log-level-select';
  logLevelSelect.style.fontSize = '12px';
  logLevelSelect.style.padding = '2px';
  
  // 添加选项
  Object.entries(LogLevels).forEach(([levelName, levelValue]) => {
    if (typeof levelValue === 'number') {
      const option = document.createElement('option');
      option.value = levelValue.toString();
      option.textContent = LogLevelNames[levelValue];
      logLevelSelect.appendChild(option);
    }
  });
  
  // 设置默认值
  setTimeout(() => {
    if (LiteGraph.PixiNodes && LiteGraph.PixiNodes.Logger) {
      logLevelSelect.value = LiteGraph.PixiNodes.Logger.getLevel().toString();
    }
  }, 100);
  
  // 添加事件监听
  logLevelSelect.onchange = () => {
    const newLevel = parseInt(logLevelSelect.value);
    if (LiteGraph.setPixiNodeLogLevel) {
      LiteGraph.setPixiNodeLogLevel(newLevel);
    }
  };
  
  logLevelContainer.appendChild(logLevelSelect);
  btnGroup.appendChild(logLevelContainer);
  
  // 居中
  topbar.appendChild(btnGroup);
}

import { LGraph, LGraphCanvas, LiteGraph } from 'litegraph.js';
import 'litegraph.js/css/litegraph.css';
import './style.css';


// 注册自定义节点
import { registerCustomNodes } from './nodes';
registerCustomNodes();


// 2. 创建 LiteGraph 编辑器
const graph = new LGraph();
const canvasElement = document.getElementById('graphCanvas') as HTMLCanvasElement;
const canvas = new LGraphCanvas(canvasElement, graph);

// 创建全局顶栏按钮组（此时 graph 已初始化）
createTopbarButtonGroup(graph, LiteGraph);


// 3. 侧边栏节点列表填充与点击添加

// 创建可折叠分组的辅助函数
function createCollapsibleSection(title: string, listElement: HTMLUListElement) {
  const section = document.createElement('div');
  section.className = 'collapsible-section';

  const header = document.createElement('div');
  header.className = 'collapsible-header';
  header.textContent = title + ' >';
  header.style.cursor = 'pointer';

  // 默认收缩
  listElement.style.display = 'none';

  header.onclick = () => {
    const isCollapsed = listElement.style.display === 'none';
    listElement.style.display = isCollapsed ? 'block' : 'none';
    header.textContent = title + (isCollapsed ? ' v' : ' >');
  };

  section.appendChild(header);
  section.appendChild(listElement);
  return section;
}

function populateNodeSidebar() {
  const nodeListElement = document.getElementById('node-list');
  if (!nodeListElement) return;
  nodeListElement.innerHTML = '';

  // Main categories
  const liteList = document.createElement('ul');
  liteList.style.display = 'block';
  const gameList = document.createElement('ul');
  gameList.style.display = 'block';

  // Create sub-categories for gamePixi
  const renderShapesList = document.createElement('ul');
  const renderUiList = document.createElement('ul');
  const containersList = document.createElement('ul');
  const resourcesList = document.createElement('ul');
  const scenesList = document.createElement('ul');
  const eventsList = document.createElement('ul');
  const toolsList = document.createElement('ul');
  // const othersList = document.createElement('ul');

  // Add class names for styling
  renderShapesList.className = 'node-category render-node';
  renderUiList.className = 'node-category render-node';
  containersList.className = 'node-category container-node';
  resourcesList.className = 'node-category resource-node';
  scenesList.className = 'node-category scene-node';
  eventsList.className = 'node-category event-node';
  toolsList.className = 'node-category tool-node';
  // othersList.className = 'node-category';

  // Create category titles
  const renderShapesTitle = document.createElement('li');
  renderShapesTitle.textContent = 'Shape Rendering';
  renderShapesTitle.className = 'category-title';
  gameList.appendChild(renderShapesTitle);
  gameList.appendChild(renderShapesList);

  const renderUiTitle = document.createElement('li');
  renderUiTitle.textContent = 'UI Rendering';
  renderUiTitle.className = 'category-title';
  gameList.appendChild(renderUiTitle);
  gameList.appendChild(renderUiList);

  const containersTitle = document.createElement('li');
  containersTitle.textContent = 'Containers';
  containersTitle.className = 'category-title';
  gameList.appendChild(containersTitle);
  gameList.appendChild(containersList);

  const resourcesTitle = document.createElement('li');
  resourcesTitle.textContent = 'Resources';
  resourcesTitle.className = 'category-title';
  gameList.appendChild(resourcesTitle);
  gameList.appendChild(resourcesList);

  const scenesTitle = document.createElement('li');
  scenesTitle.textContent = 'Scenes';
  scenesTitle.className = 'category-title';
  gameList.appendChild(scenesTitle);
  gameList.appendChild(scenesList);

  const eventsTitle = document.createElement('li');
  eventsTitle.textContent = 'Events';
  eventsTitle.className = 'category-title';
  gameList.appendChild(eventsTitle);
  gameList.appendChild(eventsList);

  const toolsTitle = document.createElement('li');
  toolsTitle.textContent = 'Tools';
  toolsTitle.className = 'category-title';
  gameList.appendChild(toolsTitle);
  gameList.appendChild(toolsList);

  // const othersTitle = document.createElement('li');
  // othersTitle.textContent = 'Others';
  // othersTitle.className = 'category-title';
  // gameList.appendChild(othersTitle);
  // gameList.appendChild(othersList);

  for (const nodeTypePath in LiteGraph.registered_node_types) {
    if (LiteGraph.registered_node_types.hasOwnProperty(nodeTypePath)) {
      const nodeConstructor = LiteGraph.registered_node_types[nodeTypePath];
      const li = document.createElement('li');
      
      // Get node title or path
      const parts = nodeTypePath.split('/');
      const shortName = parts[parts.length - 1];
      const title = nodeConstructor.prototype && nodeConstructor.prototype.title 
        ? nodeConstructor.prototype.title 
        : shortName;
      
      li.textContent = title;
      li.title = nodeTypePath;
      
      li.onclick = () => {
        const node = LiteGraph.createNode(nodeTypePath);
        if (node) {
          const rect = canvasElement.getBoundingClientRect();
          const center = canvas.convertOffsetToCanvas([rect.width / 2, rect.height / 2]);
          node.pos = [center[0] - (node.size?.[0] || 100) / 2, center[1] - (node.size?.[1] || 40) / 2];
          graph.add(node);
        }
      };
      
      // Sort nodes into categories
      if (nodeTypePath.startsWith('render/')) {
        // Shape rendering nodes vs UI rendering nodes
        if (nodeTypePath === 'render/rect' || 
            nodeTypePath === 'render/circle' || 
            nodeTypePath === 'render/line' || 
            nodeTypePath === 'render/triangle') {
          renderShapesList.appendChild(li);
        } else {
          renderUiList.appendChild(li);
        }
      } else if (nodeTypePath.startsWith('pixi/containers/')) {
        containersList.appendChild(li);
      } else if (nodeTypePath.startsWith('resource/') || nodeTypePath.includes('Resource')) {
        resourcesList.appendChild(li);
      } else if (nodeTypePath.startsWith('scene/')) {
        scenesList.appendChild(li);
      } else if (nodeTypePath.startsWith('event/')) {
        eventsList.appendChild(li);
      } else if (nodeTypePath.startsWith('tools/')) {
        toolsList.appendChild(li);
      } else if ((nodeTypePath.startsWith('pixi/') || 
                 nodeTypePath.startsWith('basic/') || 
                 nodeTypePath === 'basic') && 
                 nodeTypePath.indexOf('/') !== -1) {
        // Only put actual Pixi nodes in Others category
        // othersList.appendChild(li);
      } else {
        // Default LiteGraph nodes belong in the Basic category
        liteList.appendChild(li);
      }
    }
  }

  // Create collapsible sections
  nodeListElement.appendChild(createCollapsibleSection('Basic', liteList));
  nodeListElement.appendChild(createCollapsibleSection('GamePixi', gameList));
}
populateNodeSidebar();



// 页面加载时自动恢复节点数据
const savedGraph = localStorage.getItem('game-editor-graph');
if (savedGraph) {
  try {
    graph.configure(JSON.parse(savedGraph));
  } catch (e) {
    console.warn('恢复节点数据失败:', e);
  }
}

// 默认不自动运行，需点击运行按钮
window.addEventListener('resize', () => canvas.resize());
canvas.resize();