import { LiteGraph } from 'litegraph.js';
import { registerColorPickerNode } from './pixi-nodes/tools/ColorPickerNode';
import { registerPixiStageNode } from './pixi-nodes/scene/pixiStageNode';
import { registerPixiAppNode } from './pixi-nodes/scene/pixiAppNode';
import { registerPixiRectNode } from './pixi-nodes/render/pixiRectNode';
import { registerPixiCircleNode } from './pixi-nodes/render/pixiCircleNode';
import { registerPixiLineNode } from './pixi-nodes/render/pixiLineNode';
import { registerPixiImageNode } from './pixi-nodes/render/pixiImageNode';
import { registerPixiTriangleNode } from './pixi-nodes/render/pixiTriangleNode';

import { registerTextureResourceNode } from './pixi-nodes/resource/textureResourceNode';
import { registerAudioResourceNode } from './pixi-nodes/resource/audioResourceNode';
import { registerResourceGroupNode } from './pixi-nodes/resource/resourceGroupNode';
import { registerPixiButtonNode } from './pixi-nodes/render/pixiButtonNode';
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

  registerPixiRectNode(LiteGraph);
  registerPixiCircleNode(LiteGraph);
  registerPixiLineNode(LiteGraph);
  registerPixiImageNode(LiteGraph);
  registerTextureResourceNode(LiteGraph);
  registerResourceGroupNode(LiteGraph);
  registerAudioResourceNode(LiteGraph);
  registerPixiButtonNode(LiteGraph);
  registerPixiEventNode(LiteGraph);
  registerColorPickerNode(LiteGraph);
  registerRootContainerNode(LiteGraph);
  registerUILayerNode(LiteGraph);
  registerGameLayerNode(LiteGraph);
  registerSystemLayerNode(LiteGraph);
  registerDisplayCollectorNode(LiteGraph);
  registerPixiTriangleNode(LiteGraph);
  
  // 其它节点实现后，依次在此注册
}

