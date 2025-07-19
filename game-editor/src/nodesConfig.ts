/**
 * 节点配置与分类说明
 * 包含节点颜色、类型分类、端口类型等配置信息
 */

// 节点分类配置
export interface NodeCategory {
  id: string;
  title: string;
  className: string;
  description?: string;
}

export interface NodeType {
  path: string;
  category: string;
  title?: string;
  description?: string;
  tags?: string[];
}

// 节点分类定义
export const NODE_CATEGORIES: NodeCategory[] = [
  {
    id: 'basic',
    title: '基础节点',
    className: 'basic-node',
    description: 'LiteGraph 基础功能节点'
  },
  {
    id: 'render-shapes',
    title: '形状渲染',
    className: 'render-node',
    description: '基础几何图形渲染'
  },
  {
    id: 'render-ui',
    title: 'UI渲染',
    className: 'render-node',
    description: '用户界面元素渲染'
  },
  {
    id: 'containers',
    title: '容器',
    className: 'container-node',
    description: '容器和层级管理'
  },
  {
    id: 'resources',
    title: '资源',
    className: 'resource-node',
    description: '资源加载和管理'
  },
  {
    id: 'scenes',
    title: '场景',
    className: 'scene-node',
    description: '场景和舞台管理'
  },
  {
    id: 'events',
    title: '事件',
    className: 'event-node',
    description: '事件处理和交互'
  },
  {
    id: 'tools',
    title: '工具',
    className: 'tool-node',
    description: '辅助工具节点'
  }
];

// 节点类型映射
export const NODE_TYPE_MAPPING: NodeType[] = [
  // 形状渲染节点
  { path: 'render/rect', category: 'render-shapes', title: '矩形' },
  { path: 'render/circle', category: 'render-shapes', title: '圆形' },
  { path: 'render/line', category: 'render-shapes', title: '线条' },
  { path: 'render/triangle', category: 'render-shapes', title: '三角形' },
  
  // UI渲染节点
  { path: 'render/image', category: 'render-ui', title: '图像' },
  { path: 'render/button', category: 'render-ui', title: '按钮' },
  { path: 'render/text', category: 'render-ui', title: '文本' },
  { path: 'render/clickCounter', category: 'render-ui', title: '点击计数器' },
  
  // 容器节点
  { path: 'pixi/containers/RootContainer', category: 'containers', title: '根容器' },
  { path: 'pixi/containers/UILayer', category: 'containers', title: 'UI层' },
  { path: 'pixi/containers/GameLayer', category: 'containers', title: '游戏层' },
  { path: 'pixi/containers/SystemLayer', category: 'containers', title: '系统层' },
  { path: 'containers/DisplayCollector', category: 'containers', title: '显示收集器' },
  
  // 资源节点
  { path: 'resource/texture', category: 'resources', title: '纹理资源' },
  { path: 'resource/audio', category: 'resources', title: '音频资源' },
  { path: 'resource/group', category: 'resources', title: '资源组' },
  { path: 'resource/imageloader', category: 'resources', title: '图像加载器' },
  
  // 场景节点
  { path: 'scene/PixiApp', category: 'scenes', title: 'Pixi应用' },
  { path: 'pixi/scene/pixiStage', category: 'scenes', title: 'Pixi舞台' },
  
  // 事件节点
  { path: 'event/handler', category: 'events', title: 'Pixi事件' },
  
  // 工具节点
  { path: 'tools/color_picker', category: 'tools', title: '颜色选择器' }
];

// 获取节点分类
export function getNodeCategory(nodeTypePath: string): string {
  const mapping = NODE_TYPE_MAPPING.find(item => item.path === nodeTypePath);
  if (mapping) {
    return mapping.category;
  }
  
  // 默认分类逻辑
  if (nodeTypePath.startsWith('render/')) {
    if (['rect', 'circle', 'line', 'triangle'].some(shape => nodeTypePath.includes(shape))) {
      return 'render-shapes';
    }
    return 'render-ui';
  } else if (nodeTypePath.startsWith('pixi/containers/')) {
    return 'containers';
  } else if (nodeTypePath.startsWith('resource/') || nodeTypePath.includes('Resource')) {
    return 'resources';
  } else if (nodeTypePath.startsWith('scene/')) {
    return 'scenes';
  } else if (nodeTypePath.startsWith('event/')) {
    return 'events';
  } else if (nodeTypePath.startsWith('tools/')) {
    return 'tools';
  }
  
  return 'basic';
}

// 获取节点标题
export function getNodeTitle(nodeTypePath: string): string {
  const mapping = NODE_TYPE_MAPPING.find(item => item.path === nodeTypePath);
  if (mapping && mapping.title) {
    return mapping.title;
  }
  
  // 从路径中提取标题
  const parts = nodeTypePath.split('/');
  const shortName = parts[parts.length - 1];
  return shortName.replace(/([A-Z])/g, ' $1').trim();
}

// ================= 节点颜色配置 =================
export const NodeColors = {
  scene: '#23527C',    // 深蓝色 - 场景类
  resource: '#357A38', // 深绿色 - 资源类
  render: '#B36B09',   // 深橙色 - 渲染类
  event: '#4B266A',    // 深紫色 - 事件类
  logic: '#7C2323',    // 深红色 - 逻辑类
};

// ================= 节点端口类型配置 =================
export const PortTypes = {
  // 场景类端口
  scene: 'scene',
  container: 'pixi_container',
  
  // 资源类端口
  texture: 'texture',
  audio: 'audio',
  json: 'json',
  
  // 渲染类端口
  sprite: 'pixi_sprite',
  graphics: 'pixi_graphics',
  text: 'pixi_text',
  displayObject: 'pixi_display_object',
  
  // 事件类端口
  event: 'event',
  timer: 'timer',
  keyboard: 'keyboard_event',
  mouse: 'mouse_event',
  
  // 逻辑类端口
  flow: 'flow',
  state: 'state',
  data: 'data',
};

// ================= 节点尺寸配置 =================
export const NodeSizes = {
  small: [120, 40],    // 小型节点默认尺寸
  medium: [180, 60],   // 中型节点默认尺寸
  large: [240, 80],    // 大型节点默认尺寸
};
