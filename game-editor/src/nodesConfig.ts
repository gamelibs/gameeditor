/**
 * 节点配置与分类说明
 * 包含节点颜色、类型分类、端口类型等配置信息
 */

// ================= 节点分类说明 =================

/**
 * 1. 场景类节点（Scene）
 * - 代表游戏的逻辑空间、舞台或层级结构
 * - 端口类型: scene, layer, container
 * - 典型节点: 主场景节点、子场景/层节点、场景切换节点等
 * - 作用: 组织和管理所有显示对象、精灵、UI等
 * - 默认颜色: 深蓝色 #23527C
 */

/**
 * 2. 资源类节点（Resource）
 * - 代表图片、音频、动画、字体、数据等外部或内存资源
 * - 端口类型: texture, audio, json, atlas, font
 * - 典型节点: 图片加载、音频加载、资源管理、预加载等
 * - 作用: 为渲染和逻辑节点提供素材和数据
 * - 默认颜色: 深绿色 #357A38
 */

/**
 * 3. 渲染类节点（Render）
 * - 代表所有可见的 Pixi 对象（如 Sprite、Graphics、Text、Container）
 * - 端口类型: pixi_sprite, pixi_graphics, pixi_text, pixi_container, display_object
 * - 典型节点: Sprite、Rectangle、Circle、Text、Container、滤镜、遮罩等
 * - 作用: 负责实际的画面输出和视觉表现
 * - 默认颜色: 深橙色 #B36B09
 */

/**
 * 4. 事件类节点（Event）
 * - 代表用户输入、定时器、碰撞、消息等交互或时序事件
 * - 端口类型: event, signal, timer, mouse_event, keyboard_event
 * - 典型节点: 点击事件、定时器、碰撞检测、消息广播、输入监听等
 * - 作用: 驱动游戏逻辑、动画、状态切换等
 * - 默认颜色: 深紫色 #4B266A
 */

/**
 * 5. 逻辑/流程类节点（Flow/Logic）
 * - 代表游戏逻辑、状态控制、数据处理等
 * - 端口类型: flow, state, data
 * - 典型节点: 条件判断、循环、变量、函数等
 * - 作用: 控制游戏流程、处理数据和状态
 * - 默认颜色: 深红色 #7C2323
 */

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
