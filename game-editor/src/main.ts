import { setupPixiNodeLogger, LogLevels, LogLevelNames } from './pixiNodeLogger';
import { generateGameProject } from './export/GameProjectGenerator';
import { downloadGameProject, showSuccessMessage } from './utils/downloadUtils';

// 案例管理相关函数
async function loadAvailableExamples() {
  try {
    const baseUrl = 'examples/basic/';
    
    // 由于浏览器限制无法直接扫描目录，尝试常见的案例目录名
    const potentialExamples = [
      'hello-world',
      'button-click',
      'button-only',
      'button-click-simple',
      'auto-resize-test',
      'basic-shapes',
      'ui-demo',
      'resource-test'
    ];
    
    // 并行检查每个潜在的案例目录
    const loadPromises = potentialExamples.map(async (exampleId: string) => {
      try {
        // 首先检查 description.json 是否存在
        const descResponse = await fetch(`${baseUrl}${exampleId}/description.json`);
        if (!descResponse.ok) {
          return null; // 没有 description.json，跳过
        }
        
        // 检查 graph.json 是否存在
        const graphResponse = await fetch(`${baseUrl}${exampleId}/graph.json`);
        if (!graphResponse.ok) {
          console.warn(`案例 ${exampleId} 缺少 graph.json，跳过`);
          return null;
        }
        
        // 加载案例描述信息
        const exampleInfo = await descResponse.json();
        return {
          id: exampleId,
          name: exampleInfo.name || exampleId,
          category: exampleInfo.category || '基础示例',
          description: exampleInfo.description || '无描述',
          path: `${baseUrl}${exampleId}/graph.json`
        };
      } catch (error) {
        // 静默忽略不存在的目录
        return null;
      }
    });
    
    // 等待所有检查完成，过滤掉不存在的案例
    const results = await Promise.all(loadPromises);
    const validExamples = results.filter(example => example !== null);
    
    console.log(`✅ 自动发现并加载 ${validExamples.length} 个有效案例:`, validExamples.map(ex => ex.id));
    return validExamples;
  } catch (error) {
    console.error('❌ 扫描案例失败:', error);
    return [];
  }
}

async function loadExample(exampleId: string, graph: any) {
  try {
    const examples = await loadAvailableExamples();
    const example = examples.find(ex => ex.id === exampleId);
    
    if (!example) {
      alert('案例不存在: ' + exampleId);
      return;
    }
    
    console.log('Loading example:', example.name);
    
    // 获取案例的graph.json文件
    const response = await fetch((example as any).path);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const graphData = await response.json();
    
    // 清空当前图形
    graph.clear();
    
    // 加载新的图形数据
    graph.configure(graphData);
    
    // 显示加载成功信息
    const successMsg = document.createElement('div');
    successMsg.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #4ECDC4;
      color: white;
      padding: 10px 15px;
      border-radius: 6px;
      z-index: 2000;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    `;
    successMsg.textContent = `✅ 成功加载案例: ${example.name}`;
    
    document.body.appendChild(successMsg);
    
    setTimeout(() => {
      if (document.body.contains(successMsg)) {
        document.body.removeChild(successMsg);
      }
    }, 3000);
    
  } catch (error: any) {
    console.error('加载案例失败:', error);
    alert('加载案例失败: ' + (error?.message || '未知错误'));
  }
}

function showExamplesDialog(graph: any) {
  // 创建遮罩层
  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
  overlay.style.zIndex = '1000';
  overlay.style.display = 'flex';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';

  // 创建对话框
  const dialog = document.createElement('div');
  dialog.style.backgroundColor = '#fff';
  dialog.style.borderRadius = '8px';
  dialog.style.padding = '20px';
  dialog.style.maxWidth = '600px';
  dialog.style.maxHeight = '80vh';
  dialog.style.overflow = 'auto';
  dialog.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.3)';

  // 标题
  const title = document.createElement('h2');
  title.textContent = '选择案例';
  title.style.marginTop = '0';
  title.style.color = '#333';
  dialog.appendChild(title);

  // 案例列表容器
  const examplesContainer = document.createElement('div');
  examplesContainer.style.marginBottom = '20px';
  dialog.appendChild(examplesContainer);

  // 加载案例列表
  loadAvailableExamples().then(examples => {
    const categories = [...new Set(examples.map(ex => ex.category))];
    
    categories.forEach(category => {
      const categorySection = document.createElement('div');
      categorySection.style.marginBottom = '15px';
      
      const categoryTitle = document.createElement('h3');
      categoryTitle.textContent = category;
      categoryTitle.style.color = '#666';
      categoryTitle.style.fontSize = '16px';
      categoryTitle.style.marginBottom = '10px';
      categorySection.appendChild(categoryTitle);
      
      const categoryExamples = examples.filter(ex => ex.category === category);
      categoryExamples.forEach(example => {
        const exampleItem = document.createElement('div');
        exampleItem.style.border = '1px solid #ddd';
        exampleItem.style.borderRadius = '4px';
        exampleItem.style.padding = '10px';
        exampleItem.style.marginBottom = '8px';
        exampleItem.style.cursor = 'pointer';
        exampleItem.style.transition = 'background-color 0.2s';
        
        const exampleName = document.createElement('div');
        exampleName.textContent = example.name;
        exampleName.style.fontWeight = 'bold';
        exampleName.style.color = '#333';
        exampleItem.appendChild(exampleName);
        
        const exampleDesc = document.createElement('div');
        exampleDesc.textContent = example.description;
        exampleDesc.style.fontSize = '12px';
        exampleDesc.style.color = '#666';
        exampleDesc.style.marginTop = '4px';
        exampleItem.appendChild(exampleDesc);
        
        exampleItem.onmouseover = () => {
          exampleItem.style.backgroundColor = '#f5f5f5';
        };
        exampleItem.onmouseout = () => {
          exampleItem.style.backgroundColor = '';
        };
        
        exampleItem.onclick = () => {
          loadExample(example.id, graph);
          document.body.removeChild(overlay);
        };
        
        categorySection.appendChild(exampleItem);
      });
      
      examplesContainer.appendChild(categorySection);
    });
  });

  // 按钮区域
  const buttonArea = document.createElement('div');
  buttonArea.style.textAlign = 'right';
  buttonArea.style.borderTop = '1px solid #ddd';
  buttonArea.style.paddingTop = '15px';

  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = '取消';
  cancelBtn.style.padding = '8px 16px';
  cancelBtn.style.marginRight = '10px';
  cancelBtn.style.border = '1px solid #ddd';
  cancelBtn.style.borderRadius = '4px';
  cancelBtn.style.backgroundColor = '#fff';
  cancelBtn.style.cursor = 'pointer';
  cancelBtn.onclick = () => {
    document.body.removeChild(overlay);
  };

  buttonArea.appendChild(cancelBtn);
  dialog.appendChild(buttonArea);

  // 点击遮罩层关闭对话框
  overlay.onclick = (e) => {
    if (e.target === overlay) {
      document.body.removeChild(overlay);
    }
  };

  overlay.appendChild(dialog);
  document.body.appendChild(overlay);
}

// 导出游戏对话框
function showExportDialog(graph: any) {
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.7);
    z-index: 2000;
    display: flex;
    align-items: center;
    justify-content: center;
  `;

  const dialog = document.createElement('div');
  dialog.style.cssText = `
    background: #2a2a2a;
    border-radius: 8px;
    padding: 20px;
    min-width: 400px;
    max-width: 500px;
    color: white;
    border: 1px solid #555;
  `;

  dialog.innerHTML = `
    <h3 style="margin-top: 0; color: #4ECDC4;">导出游戏项目</h3>
    
    <div style="margin: 15px 0;">
      <label style="display: block; margin-bottom: 5px;">项目名称:</label>
      <input type="text" id="project-name" value="my-game" style="
        width: 100%;
        padding: 8px;
        background: #333;
        border: 1px solid #555;
        color: white;
        border-radius: 4px;
        box-sizing: border-box;
      ">
    </div>

    <div style="margin: 15px 0;">
      <label style="display: block; margin-bottom: 5px;">游戏标题:</label>
      <input type="text" id="game-title" value="My Awesome Game" style="
        width: 100%;
        padding: 8px;
        background: #333;
        border: 1px solid #555;
        color: white;
        border-radius: 4px;
        box-sizing: border-box;
      ">
    </div>

    <div style="margin: 15px 0;">
      <label style="display: block; margin-bottom: 5px;">游戏尺寸:</label>
      <select id="game-size" style="
        width: 100%;
        padding: 8px;
        background: #333;
        border: 1px solid #555;
        color: white;
        border-radius: 4px;
      ">
        <option value="640x480">640 x 480 (4:3)</option>
        <option value="800x600">800 x 600 (4:3)</option>
        <option value="1024x768">1024 x 768 (4:3)</option>
        <option value="960x540">960 x 540 (16:9)</option>
        <option value="1280x720">1280 x 720 (16:9)</option>
      </select>
    </div>

    <div style="margin: 20px 0; text-align: right;">
      <button id="cancel-export" style="
        padding: 8px 16px;
        margin-right: 10px;
        background: #666;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      ">取消</button>
      <button id="confirm-export" style="
        padding: 8px 16px;
        background: #4ECDC4;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      ">导出</button>
    </div>
  `;

  overlay.appendChild(dialog);
  document.body.appendChild(overlay);

  // 取消按钮
  dialog.querySelector('#cancel-export')!.addEventListener('click', () => {
    document.body.removeChild(overlay);
  });

  // 确认导出按钮
  dialog.querySelector('#confirm-export')!.addEventListener('click', () => {
    const projectName = (dialog.querySelector('#project-name') as HTMLInputElement).value;
    const gameTitle = (dialog.querySelector('#game-title') as HTMLInputElement).value;
    const gameSize = (dialog.querySelector('#game-size') as HTMLSelectElement).value;
    
    exportGame(graph, projectName, gameTitle, gameSize);
    document.body.removeChild(overlay);
  });

  // 点击遮罩关闭
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      document.body.removeChild(overlay);
    }
  });
}

// 导出游戏功能
async function exportGame(graph: any, projectName: string, gameTitle: string, gameSize: string) {
  try {
    const [width, height] = gameSize.split('x').map(Number);
    
    // 获取节点图配置
    const graphData = graph.serialize();
    
    // 生成游戏配置
    const gameConfig = {
      title: gameTitle,
      width,
      height,
      nodes: graphData.nodes,
      links: graphData.links,
      version: "1.0.0"
    };

    // 创建游戏项目文件
    const gameFiles = await generateGameProject(gameConfig, projectName);
    
    // 创建ZIP文件并下载
    await downloadGameProject(gameFiles, projectName);
    
    // 显示成功消息
    showSuccessMessage(`✅ 游戏项目 "${projectName}" 导出成功！`);
    
  } catch (error: any) {
    console.error('导出游戏失败:', error);
    alert('导出游戏失败: ' + (error?.message || '未知错误'));
  }
}

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
  Object.entries(LogLevels).forEach(([, levelValue]) => {
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

  // 案例按钮
  const examplesBtn = document.createElement('button');
  examplesBtn.textContent = '案例';
  examplesBtn.className = 'topbar-btn';
  examplesBtn.title = '加载示例案例';
  examplesBtn.onclick = () => {
    showExamplesDialog(graph);
  };
  btnGroup.appendChild(examplesBtn);

  // 导出按钮
  const exportBtn = document.createElement('button');
  exportBtn.textContent = '导出游戏';
  exportBtn.className = 'topbar-btn';
  exportBtn.title = '导出游戏项目';
  exportBtn.onclick = () => {
    showExportDialog(graph);
  };
  btnGroup.appendChild(exportBtn);
  
  // 居中
  topbar.appendChild(btnGroup);
}

import { LGraph, LGraphCanvas, LiteGraph } from 'litegraph.js';
import 'litegraph.js/css/litegraph.css';
import './style.css';

// 导入三面板UI管理器
import { ThreePanelUI } from './ui/ThreePanelUI';

// 注册自定义节点
import { registerCustomNodes } from './nodes';
registerCustomNodes();

// 2. 创建 LiteGraph 编辑器
const graph = new LGraph();
const canvasElement = document.getElementById('graphCanvas') as HTMLCanvasElement;
const canvas = new LGraphCanvas(canvasElement, graph);

// 创建全局顶栏按钮组（此时 graph 已初始化）
createTopbarButtonGroup(graph, LiteGraph);

// 初始化三面板UI
const threePanelUI = new ThreePanelUI(graph);


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