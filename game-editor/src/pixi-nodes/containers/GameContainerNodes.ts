// /**
//  * Game Container Implementations
//  * Includes implementations for game-specific containers:
//  * - BackgroundContainer: For background elements
//  * - EntityContainer: For game entities
//  * - EffectContainer: For visual effects
//  */

// import { BaseContainerNode } from '../base/BaseContainerNode';
// import { ContainerType, LayerPriority } from '../base/ContainerTypes';

// /**
//  * Base Game Container with shared functionality
//  */
// export class BaseGameContainerNode extends BaseContainerNode {
//   constructor(type: ContainerType, name: string, priority: number) {
//     super();
    
//     this.containerType = type;
//     this.title = name;
    
//     // Add common properties
//     this.properties = {
//       ...this.properties,
//       layerPriority: priority,
//       cullOutOfBounds: false,
//       debugBounds: false
//     };
    
//     // Set color based on type
//     switch(type) {
//       case ContainerType.BACKGROUND:
//         this.boxcolor = "#16a085"; // Turquoise
//         break;
//       case ContainerType.ENTITY:
//         this.boxcolor = "#27ae60"; // Emerald
//         break;
//       case ContainerType.EFFECT:
//         this.boxcolor = "#2ecc71"; // Green
//         break;
//       default:
//         this.boxcolor = "#1abc9c"; // Light green
//     }
    
//     // Add widgets
//     this.addWidget('toggle', 'cull out of bounds', this.properties.cullOutOfBounds, (v: boolean) => {
//       this.properties.cullOutOfBounds = v;
//     });
    
//     this.addWidget('toggle', 'debug bounds', this.properties.debugBounds, (v: boolean) => {
//       this.properties.debugBounds = v;
//       this.updateDebugVisuals();
//     });
//   }
  
//   /**
//    * Update debug visuals (bounding boxes, etc)
//    */
//   updateDebugVisuals() {
//     // Clear existing debug visuals
//     const debugItems = this.findChildrenByTag('debug');
//     for (const item of debugItems) {
//       this.removeChild(item);
//     }
    
//     // Add new debug visuals if enabled
//     if (this.properties.debugBounds) {
//       // Would implement debug visualization here
//       // This could draw bounding boxes around all children
//     }
//   }
  
//   /**
//    * Cull children that are out of bounds
//    */
//   cullChildren() {
//     if (!this.properties.cullOutOfBounds) return;
    
//     // Typically would check each child against the visible bounds
//     // and set visible = false for those outside
//     // Implementation would depend on how we define the visible area
//   }
  
//   /**
//    * Override onExecute to handle culling and debug visuals
//    */
//   onExecute() {
//     super.onExecute();
    
//     if (this.properties.cullOutOfBounds) {
//       this.cullChildren();
//     }
    
//     // Output the container
//     this.setOutputData(0, this._container);
//   }
// }

// /**
//  * Background Container
//  * Used for background elements like parallax layers, sky, etc.
//  */
// export class BackgroundContainerNode extends BaseGameContainerNode {
//   constructor() {
//     super(ContainerType.BACKGROUND, 'Background Layer', LayerPriority.BACKGROUND);
//     this.addTag('background-layer');
    
//     // Add background-specific properties
//     this.properties = {
//       ...this.properties,
//       parallax: false,
//       parallaxFactor: 0.5
//     };
    
//     // Add background-specific widgets
//     this.addWidget('toggle', 'parallax', this.properties.parallax, (v: boolean) => {
//       this.properties.parallax = v;
//     });
    
//     this.addWidget('number', 'parallax factor', this.properties.parallaxFactor, (v: number) => {
//       this.properties.parallaxFactor = v;
//     });
//   }
  
//   /**
//    * Update parallax scrolling based on camera position
//    */
//   updateParallax(cameraX: number, cameraY: number) {
//     if (!this.properties.parallax) return;
    
//     // Apply parallax effect
//     this._container.x = -cameraX * this.properties.parallaxFactor;
//     this._container.y = -cameraY * this.properties.parallaxFactor;
//   }
// }

// /**
//  * Entity Container
//  * Used for game entities like characters, objects, etc.
//  */
// export class EntityContainerNode extends BaseGameContainerNode {
//   constructor() {
//     super(ContainerType.ENTITY, 'Entity Layer', LayerPriority.ENTITY);
//     this.addTag('entity-layer');
    
//     // Add entity-specific properties
//     this.properties = {
//       ...this.properties,
//       spatialHash: false,
//       collisionEnabled: true
//     };
    
//     // Add entity-specific widgets
//     this.addWidget('toggle', 'spatial hash', this.properties.spatialHash, (v: boolean) => {
//       this.properties.spatialHash = v;
//     });
    
//     this.addWidget('toggle', 'collision', this.properties.collisionEnabled, (v: boolean) => {
//       this.properties.collisionEnabled = v;
//     });
//   }
// }

// /**
//  * Effect Container
//  * Used for visual effects like particles, animations, etc.
//  */
// export class EffectContainerNode extends BaseGameContainerNode {
//   constructor() {
//     super(ContainerType.EFFECT, 'Effect Layer', LayerPriority.EFFECT);
//     this.addTag('effect-layer');
    
//     // Add effect-specific properties
//     this.properties = {
//       ...this.properties,
//       autoCleanup: true,
//       maxEffects: 100
//     };
    
//     // Add effect-specific widgets
//     this.addWidget('toggle', 'auto cleanup', this.properties.autoCleanup, (v: boolean) => {
//       this.properties.autoCleanup = v;
//     });
    
//     this.addWidget('number', 'max effects', this.properties.maxEffects, (v: number) => {
//       this.properties.maxEffects = Math.max(1, v);
//     });
//   }
  
//   /**
//    * Cleanup completed effects
//    */
//   cleanupEffects() {
//     if (!this.properties.autoCleanup) return;
    
//     // Logic for removing completed effects would go here
//     // For example, checking a 'completed' flag on effect objects
//   }
  
//   /**
//    * Override onExecute to handle effect cleanup
//    */
//   onExecute() {
//     super.onExecute();
    
//     if (this.properties.autoCleanup) {
//       this.cleanupEffects();
//     }
//   }
// }
