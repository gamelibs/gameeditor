import { LiteGraph } from 'litegraph.js';
import { registerColorPickerNode } from './pixi-nodes/tools/ColorPickerNode';
import { registerPixiStageNode } from './pixi-nodes/scene/pixiStageNode';
import { registerPixiAppNode } from './pixi-nodes/scene/pixiAppNode';

// 渲染节点
import { registerPixiRectNode } from './pixi-nodes/render/pixiRectNode';
import { registerPixiCircleNode } from './pixi-nodes/render/pixiCircleNode';
import { registerPixiLineNode } from './pixi-nodes/render/pixiLineNode';
import { registerPixiTriangleNode } from './pixi-nodes/render/pixiTriangleNode';
import { registerPixiButtonNode } from './pixi-nodes/render/pixiButtonNode';
import { registerTextNode } from './pixi-nodes/render/pixiTextNode';
import { registerPixiImageNode } from './pixi-nodes/render/pixiImageNode';
import { registerClickCounterNode } from './pixi-nodes/render/pixiClickCounterNode';

import { registerTextureResourceNode } from './pixi-nodes/resource/textureResourceNode';
import { registerAudioResourceNode } from './pixi-nodes/resource/audioResourceNode';
import { registerResourceGroupNode } from './pixi-nodes/resource/resourceGroupNode';
import { registerImageLoaderNode } from './pixi-nodes/resource/imageLoaderNode';
import { registerTextureNode } from './pixi-nodes/resource/textureNode';

import { registerPixiEventNode } from './pixi-nodes/event/pixiEventNode';
import { registerRootContainerNode } from './pixi-nodes/containers/RootContainerNode';
import { registerUILayerNode } from './pixi-nodes/containers/UILayerNode';
import { registerGameLayerNode } from './pixi-nodes/containers/GameLayerNode';
import { registerSystemLayerNode } from './pixi-nodes/containers/SystemLayerNode';
import { registerDisplayCollectorNode } from './pixi-nodes/containers/DisplayCollectorNode';


export function registerCustomNodes() {
  // 节点类型说明与颜色配置已迁移至 nodeColors.ts 统一管理
  
  // 场景节点
  registerPixiAppNode(LiteGraph);
  registerPixiStageNode(LiteGraph);

  // 渲染节点
  registerPixiRectNode(LiteGraph);
  registerPixiCircleNode(LiteGraph);
  registerPixiLineNode(LiteGraph);
  registerPixiTriangleNode(LiteGraph);
  registerPixiButtonNode(LiteGraph);
  registerTextNode(LiteGraph);
  registerPixiImageNode(LiteGraph);
  registerClickCounterNode(LiteGraph);

  // 资源节点
  registerTextureResourceNode(LiteGraph);
  registerResourceGroupNode(LiteGraph);
  registerAudioResourceNode(LiteGraph);
  registerImageLoaderNode(LiteGraph);
  registerTextureNode(LiteGraph);

  // 事件节点
  registerPixiEventNode(LiteGraph);
  
  // 工具节点
  registerColorPickerNode(LiteGraph);
  
  // 容器节点
  registerRootContainerNode(LiteGraph);
  registerUILayerNode(LiteGraph);
  registerGameLayerNode(LiteGraph);
  registerSystemLayerNode(LiteGraph);
  registerDisplayCollectorNode(LiteGraph);
  
  // 其它节点实现后，依次在此注册
}

