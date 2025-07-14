// edite/editeLiteGraph.ts
// 专门处理 LiteGraph 节点注册与节点列表渲染
import { LiteGraph, LGraph, LGraphCanvas } from 'litegraph.js';
import 'litegraph.js/css/litegraph.css';

export function setupLiteGraph(canvasId: string) {
  const canvasElem = document.getElementById(canvasId) as HTMLCanvasElement;
  if (!canvasElem) {
    alert(`未找到 #${canvasId}，LiteGraph 编辑器无法初始化！`);
    throw new Error(`未找到 #${canvasId}`);
  }
  const graph = new LGraph();
  const lgraphCanvas = new LGraphCanvas(canvasElem, graph);
  return { graph, lgraphCanvas };
}

export function renderNodeList(listId: string) {
  const nodeList = document.getElementById(listId)!;
  nodeList.innerHTML = '';
  const registered = LiteGraph.registered_node_types;
  if (!registered) {
    nodeList.innerHTML = '<span style="color:#888">无可用节点</span>';
    return;
  }
  // 分类收集
  const groups: Record<string, Array<{ type: string; ctor: any }>> = {};
  for (const nodeTypePath in registered) {
    if (!Object.prototype.hasOwnProperty.call(registered, nodeTypePath)) continue;
    const nodeConstructor = registered[nodeTypePath];
    const group = nodeTypePath.split('/')[0] || '其它';
    if (!groups[group]) groups[group] = [];
    groups[group].push({ type: nodeTypePath, ctor: nodeConstructor });
  }
  // 渲染分组
  Object.keys(groups)
    .sort()
    .forEach((group) => {
      const section = document.createElement('div');
      section.className = 'node-group-section';
      const groupTitle = document.createElement('div');
      groupTitle.textContent = group;
      groupTitle.className = 'node-group-title';
      groupTitle.style.cssText = 'color:#4ecdc4;font-weight:bold;margin:8px 0 4px 0;font-size:15px;';
      section.appendChild(groupTitle);
      groups[group].forEach(({ type, ctor }) => {
        const item = document.createElement('div');
        item.className = 'node-list-item';
        item.style.cssText = 'padding:7px 10px;margin-bottom:2px;border-radius:4px;cursor:pointer;transition:background 0.2s;';
        const title = ctor.prototype && ctor.prototype.title ? ctor.prototype.title : type.split('/').pop();
        const desc = ctor.prototype && ctor.prototype.desc ? ctor.prototype.desc : '';
        const titleDiv = document.createElement('div');
        titleDiv.textContent = title;
        titleDiv.style.fontWeight = 'bold';
        titleDiv.style.color = '#fff';
        item.appendChild(titleDiv);
        if (desc) {
          const descDiv = document.createElement('div');
          descDiv.textContent = desc;
          descDiv.style.cssText = 'font-size:12px;color:#7ad;opacity:0.7;margin-top:2px;';
          item.appendChild(descDiv);
        }
        item.title = type;
        item.onmouseover = () => { item.style.background = '#222e'; };
        item.onmouseout = () => { item.style.background = ''; };
        item.onclick = () => {
          alert('点击节点: ' + type);
        };
        section.appendChild(item);
      });
      nodeList.appendChild(section);
    });
}

export function renderTopNavNodeList(navContainerId: string) {
  const navContainer = document.getElementById(navContainerId)!;
  navContainer.innerHTML = '';
  const registered = LiteGraph.registered_node_types;
  if (!registered) {
    navContainer.innerHTML = '<span style="color:#888">无可用节点</span>';
    return;
  }

  const groups: Record<string, Array<{ type: string; ctor: any }>> = {};
  for (const nodeTypePath in registered) {
    if (!Object.prototype.hasOwnProperty.call(registered, nodeTypePath)) continue;
    const nodeConstructor = registered[nodeTypePath];
    const group = nodeTypePath.split('/')[0] || '其它';
    if (!groups[group]) groups[group] = [];
    groups[group].push({ type: nodeTypePath, ctor: nodeConstructor });
  }

  const nav = document.createElement('div');
  nav.className = 'node-nav';

  Object.keys(groups)
    .sort()
    .forEach((group) => {
      const navItem = document.createElement('div');
      navItem.className = 'node-nav-item';
      navItem.textContent = group;

      const dropdown = document.createElement('div');
      dropdown.className = 'node-dropdown';

      groups[group].forEach(({ type, ctor }) => {
        const dropdownItem = document.createElement('div');
        dropdownItem.className = 'node-dropdown-item';
        dropdownItem.textContent = ctor.prototype && ctor.prototype.title ? ctor.prototype.title : type.split('/').pop();
        dropdownItem.title = ctor.prototype && ctor.prototype.desc ? ctor.prototype.desc : '';
        dropdownItem.onclick = () => {
          alert('点击节点: ' + type);
        };
        dropdown.appendChild(dropdownItem);
      });

      navItem.appendChild(dropdown);
      nav.appendChild(navItem);
    });

  navContainer.appendChild(nav);
}
