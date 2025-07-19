import { LiteGraph } from 'litegraph.js';
import { registerColorPickerNode } from './pixi-nodes/tools/ColorPickerNode';
import { registerPixiStageNode } from './pixi-nodes/scene/pixiStageNode';
import { registerPixiAppNode } from './pixi-nodes/scene/pixiAppNode';


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
  registerPixiAppNode(LiteGraph);
  registerPixiStageNode(LiteGraph);


  registerTextureResourceNode(LiteGraph);
  registerResourceGroupNode(LiteGraph);
  registerAudioResourceNode(LiteGraph);

  registerPixiEventNode(LiteGraph);
  registerColorPickerNode(LiteGraph);
  registerRootContainerNode(LiteGraph);
  registerUILayerNode(LiteGraph);
  registerGameLayerNode(LiteGraph);
  registerSystemLayerNode(LiteGraph);
  registerDisplayCollectorNode(LiteGraph);

  registerImageLoaderNode(LiteGraph);
  registerTextureNode(LiteGraph);
  
  // 其它节点实现后，依次在此注册
}

