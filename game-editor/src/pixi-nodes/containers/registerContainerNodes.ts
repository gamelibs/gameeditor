// /**
//  * Container Nodes Registration
//  * This file registers all container nodes with the LiteGraph system
//  */

// import { 
//   RootContainerNode,
//   LayerContainerNode,
//   UILayerNode,
//   GameLayerNode, 
//   SystemLayerNode,
//   LoadingContainerNode,
//   MainMenuContainerNode,
//   GameUIContainerNode,
//   PopupContainerNode,
//   BackgroundContainerNode,
//   EntityContainerNode,
//   EffectContainerNode,
//   DebugContainerNode,
//   TransitionContainerNode
// } from './index';

// /**
//  * Register all container nodes with LiteGraph
//  * @param LiteGraph LiteGraph library instance
//  */
// export function registerContainerNodes(LiteGraph: any) {
//   // Register Root Container Node
//   function PixiRootContainerNode(this: any) {
//     const node = new RootContainerNode();
//     this.title = node.title;
//     this.color = node.boxcolor;
//     this.node = node;
    
//     // Copy inputs and outputs from the node
//     if (node.inputs) {
//       for (let i = 0; i < node.inputs.length; i++) {
//         const input = node.inputs[i];
//         this.addInput(input.name, input.type);
//       }
//     }
    
//     if (node.outputs) {
//       for (let i = 0; i < node.outputs.length; i++) {
//         const output = node.outputs[i];
//         this.addOutput(output.name, output.type);
//       }
//     }
    
//     // Copy properties
//     this.properties = { ...node.properties };
    
//     // Copy widgets
//     if (node.widgets) {
//       for (const widget of node.widgets) {
//         // Add the widget to this node with the proper callback
//         this.addWidget(
//           widget.type,
//           widget.name,
//           widget.value,
//           (v: any) => {
//             widget.callback(v);
//             return v;
//           },
//           widget.options
//         );
//       }
//     }
//   }
  
//   PixiRootContainerNode.prototype.onExecute = function() {
//     // Execute the underlying node
//     if (this.node) {
//       this.node.onExecute();
      
//       // Transfer all outputs
//       if (this.node.outputs) {
//         for (let i = 0; i < this.node.outputs.length; i++) {
//           const value = this.node.getOutputData(i);
//           this.setOutputData(i, value);
//         }
//       }
//     }
//   };
  
//   // Register similar wrapper functions for other container types
//   // (Layer containers, UI containers, etc.)
//   function registerContainerNodeType(nodeClass: any, type: string) {
//     LiteGraph.registerNodeType(`containers/${type}`, createContainerNodeWrapper(nodeClass));
//   }
  
//   function createContainerNodeWrapper(ContainerClass: any) {
//     return function(this: any) {
//       const node = new ContainerClass();
//       this.title = node.title;
//       this.color = node.boxcolor;
//       this.node = node;
      
//       // Copy inputs and outputs
//       if (node.inputs) {
//         for (let i = 0; i < node.inputs.length; i++) {
//           const input = node.inputs[i];
//           this.addInput(input.name, input.type);
//         }
//       }
      
//       if (node.outputs) {
//         for (let i = 0; i < node.outputs.length; i++) {
//           const output = node.outputs[i];
//           this.addOutput(output.name, output.type);
//         }
//       }
      
//       // Copy properties
//       this.properties = { ...node.properties };
      
//       // Copy widgets
//       if (node.widgets) {
//         for (const widget of node.widgets) {
//           this.addWidget(
//             widget.type,
//             widget.name,
//             widget.value,
//             (v: any) => {
//               widget.callback(v);
//               return v;
//             },
//             widget.options
//           );
//         }
//       }
      
//       // Handle execution
//       this.onExecute = function() {
//         // Process inputs
//         if (this.node.inputs) {
//           for (let i = 0; i < this.node.inputs.length; i++) {
//             const value = this.getInputData(i);
//             if (value !== undefined) {
//               this.node.setInputData(i, value);
//             }
//           }
//         }
        
//         // Execute the underlying node
//         this.node.onExecute();
        
//         // Transfer outputs
//         if (this.node.outputs) {
//           for (let i = 0; i < this.node.outputs.length; i++) {
//             const value = this.node.getOutputData(i);
//             this.setOutputData(i, value);
//           }
//         }
//       };
//     };
//   }
  
//   // Register the root container
//   LiteGraph.registerNodeType('containers/root', PixiRootContainerNode);
  
//   // Register layer containers
//   registerContainerNodeType(UILayerNode, 'ui_layer');
//   registerContainerNodeType(GameLayerNode, 'game_layer');
//   registerContainerNodeType(SystemLayerNode, 'system_layer');
  
//   // Register UI containers
//   registerContainerNodeType(LoadingContainerNode, 'ui_loading');
//   registerContainerNodeType(MainMenuContainerNode, 'ui_main_menu');
//   registerContainerNodeType(GameUIContainerNode, 'ui_game');
//   registerContainerNodeType(PopupContainerNode, 'ui_popup');
  
//   // Register Game containers
//   registerContainerNodeType(BackgroundContainerNode, 'game_background');
//   registerContainerNodeType(EntityContainerNode, 'game_entity');
//   registerContainerNodeType(EffectContainerNode, 'game_effect');
  
//   // Register System containers
//   registerContainerNodeType(DebugContainerNode, 'system_debug');
//   registerContainerNodeType(TransitionContainerNode, 'system_transition');
// }
