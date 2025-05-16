// /**
//  * System Container Implementations
//  * Includes implementations for system-specific containers:
//  * - DebugContainer: For debug information
//  * - TransitionContainer: For screen transitions
//  */

// import { BaseContainerNode } from '../base/BaseContainerNode';
// import { ContainerType, LayerPriority } from '../base/ContainerTypes';
// import { Graphics, Text, TextStyle } from 'pixi.js';

// /**
//  * Base System Container with shared functionality
//  */
// export class BaseSystemContainerNode extends BaseContainerNode {
//   constructor(type: ContainerType, name: string, priority: number) {
//     super();
    
//     this.containerType = type;
//     this.title = name;
    
//     // Add common properties
//     this.properties = {
//       ...this.properties,
//       layerPriority: priority,
//       alwaysOnTop: true
//     };
    
//     // Set color based on type
//     switch(type) {
//       case ContainerType.DEBUG:
//         this.boxcolor = "#c0392b"; // Red
//         break;
//       case ContainerType.TRANSITION:
//         this.boxcolor = "#8e44ad"; // Purple
//         break;
//       default:
//         this.boxcolor = "#e74c3c"; // Light red
//     }
    
//     // Add widgets
//     this.addWidget('toggle', 'always on top', this.properties.alwaysOnTop, (v: boolean) => {
//       this.properties.alwaysOnTop = v;
//       this.updateZIndex();
//     });
//   }
  
//   /**
//    * Update z-index to keep this layer on top
//    */
//   updateZIndex() {
//     if (this.properties.alwaysOnTop) {
//       this._container.zIndex = 1000; // Very high z-index
//     } else {
//       this._container.zIndex = this.properties.layerPriority;
//     }
    
//     // Request parent to sort children
//     if (this._container.parent && (this._container.parent as any).sortChildren) {
//       (this._container.parent as any).sortChildren();
//     }
//   }
  
//   /**
//    * Called when the container is activated
//    */
//   protected onActivate() {
//     super.onActivate();
//     this.updateZIndex();
//   }
// }

// /**
//  * Debug Container
//  * Used for showing debug information, FPS counters, etc.
//  */
// export class DebugContainerNode extends BaseSystemContainerNode {
//   private _fpsText: Text | null = null;
//   private _memoryText: Text | null = null;
//   private _entityCountText: Text | null = null;
//   private _lastTime: number = performance.now();
//   private _frameCount: number = 0;
//   private _fps: number = 0;
  
//   constructor() {
//     super(ContainerType.DEBUG, 'Debug Layer', LayerPriority.DEBUG);
//     this.addTag('debug-layer');
    
//     // Add debug-specific properties
//     this.properties = {
//       ...this.properties,
//       showFPS: true,
//       showMemory: true,
//       showEntityCount: true,
//       textColor: 0xFFFF00
//     };
    
//     // Add debug-specific widgets
//     this.addWidget('toggle', 'show FPS', this.properties.showFPS, (v: boolean) => {
//       this.properties.showFPS = v;
//       this.updateDebugVisibility();
//     });
    
//     this.addWidget('toggle', 'show memory', this.properties.showMemory, (v: boolean) => {
//       this.properties.showMemory = v;
//       this.updateDebugVisibility();
//     });
    
//     this.addWidget('toggle', 'show entity count', this.properties.showEntityCount, (v: boolean) => {
//       this.properties.showEntityCount = v;
//       this.updateDebugVisibility();
//     });
    
//     this.addWidget('color', 'text color', this.properties.textColor, (v: number) => {
//       this.properties.textColor = v;
//       this.updateTextStyle();
//     });
//   }
  
//   /**
//    * Initialize debug visuals
//    */
//   protected onInitialize() {
//     super.onInitialize();
//     this.createDebugText();
//   }
  
//   /**
//    * Create debug text elements
//    */
//   createDebugText() {
//     const style = new TextStyle({
//       fontFamily: 'Courier New',
//       fontSize: 14,
//       fill: this.properties.textColor,
//       align: 'left'
//     });
    
//     // FPS counter
//     this._fpsText = new Text('FPS: 0', style);
//     this._fpsText.x = 10;
//     this._fpsText.y = 10;
//     this._container.addChild(this._fpsText);
    
//     // Memory usage
//     this._memoryText = new Text('MEM: 0 MB', style);
//     this._memoryText.x = 10;
//     this._memoryText.y = 30;
//     this._container.addChild(this._memoryText);
    
//     // Entity counter
//     this._entityCountText = new Text('Entities: 0', style);
//     this._entityCountText.x = 10;
//     this._entityCountText.y = 50;
//     this._container.addChild(this._entityCountText);
    
//     // Set initial visibility
//     this.updateDebugVisibility();
//   }
  
//   /**
//    * Update text style
//    */
//   updateTextStyle() {
//     const style = {
//       fontFamily: 'Courier New',
//       fontSize: 14,
//       fill: this.properties.textColor,
//       align: 'left'
//     };
    
//     if (this._fpsText) {
//       this._fpsText.style = style;
//     }
    
//     if (this._memoryText) {
//       this._memoryText.style = style;
//     }
    
//     if (this._entityCountText) {
//       this._entityCountText.style = style;
//     }
//   }
  
//   /**
//    * Update visibility of debug elements
//    */
//   updateDebugVisibility() {
//     if (this._fpsText) {
//       this._fpsText.visible = this.properties.showFPS;
//     }
    
//     if (this._memoryText) {
//       this._memoryText.visible = this.properties.showMemory;
//     }
    
//     if (this._entityCountText) {
//       this._entityCountText.visible = this.properties.showEntityCount;
//     }
//   }
  
//   /**
//    * Update FPS counter
//    */
//   updateFPS() {
//     const now = performance.now();
//     this._frameCount++;
    
//     // Update every second
//     if (now - this._lastTime >= 1000) {
//       this._fps = Math.round((this._frameCount * 1000) / (now - this._lastTime));
//       this._lastTime = now;
//       this._frameCount = 0;
      
//       if (this._fpsText) {
//         this._fpsText.text = `FPS: ${this._fps}`;
//       }
//     }
//   }
  
//   /**
//    * Update memory usage display
//    */
//   updateMemoryInfo() {
//     if (!this._memoryText || !this.properties.showMemory) return;
    
//     // Only works in browsers that support performance.memory
//     if (window.performance && (performance as any).memory) {
//       const memory = (performance as any).memory;
//       const usedMB = Math.round(memory.usedJSHeapSize / (1024 * 1024));
//       const totalMB = Math.round(memory.totalJSHeapSize / (1024 * 1024));
//       this._memoryText.text = `MEM: ${usedMB}/${totalMB} MB`;
//     } else {
//       this._memoryText.text = 'MEM: N/A';
//     }
//   }
  
//   /**
//    * Update entity count
//    */
//   updateEntityCount() {
//     if (!this._entityCountText || !this.properties.showEntityCount) return;
    
//     // Find all entities in the scene
//     // This is just an example - you would need to adapt this to your actual entity tracking system
//     let count = 0;
//     const entityContainers = this.findChildrenByTag('entity-layer');
//     for (const container of entityContainers) {
//       count += container.children?.length || 0;
//     }
    
//     this._entityCountText.text = `Entities: ${count}`;
//   }
  
//   /**
//    * Execute node logic
//    */
//   onExecute() {
//     super.onExecute();
    
//     // Update debug information
//     if (this.properties.showFPS) {
//       this.updateFPS();
//     }
    
//     if (this.properties.showMemory) {
//       this.updateMemoryInfo();
//     }
    
//     if (this.properties.showEntityCount) {
//       this.updateEntityCount();
//     }
//   }
// }

// /**
//  * Transition Container
//  * Used for screen transitions like fades, wipes, etc.
//  */
// export class TransitionContainerNode extends BaseSystemContainerNode {
//   private _transitionGraphics: Graphics | null = null;
//   private _transitionInProgress: boolean = false;
//   private _onTransitionComplete: () => void = () => {};
  
//   constructor() {
//     super(ContainerType.TRANSITION, 'Transition Layer', LayerPriority.TRANSITION);
//     this.addTag('transition-layer');
    
//     // Add transition-specific properties
//     this.properties = {
//       ...this.properties,
//       transitionColor: 0x000000,
//       transitionDuration: 500,
//       transitionType: 'fade' // fade, wipe, etc.
//     };
    
//     // Add transition-specific widgets
//     this.addWidget('color', 'transition color', this.properties.transitionColor, (v: number) => {
//       this.properties.transitionColor = v;
//     });
    
//     this.addWidget('number', 'duration (ms)', this.properties.transitionDuration, (v: number) => {
//       this.properties.transitionDuration = Math.max(50, v);
//     });
    
//     this.addWidget('combo', 'type', this.properties.transitionType, (v: string) => {
//       this.properties.transitionType = v;
//     }, { values: ['fade', 'wipe_right', 'wipe_left', 'wipe_up', 'wipe_down', 'circle'] });
    
//     // Add input/output ports
//     this.addInput('trigger', 'boolean');
//     this.addInput('callback', 'function');
//     this.addOutput('complete', 'boolean');
//     this.addOutput('progress', 'number');
//   }
  
//   /**
//    * Initialize transition graphics
//    */
//   protected onInitialize() {
//     super.onInitialize();
    
//     this._transitionGraphics = new Graphics();
//     this._container.addChild(this._transitionGraphics);
    
//     // Hide by default
//     this._container.visible = false;
//   }
  
//   /**
//    * Execute a screen transition
//    */
//   async executeTransition(): Promise<void> {
//     if (this._transitionInProgress) return;
//     this._transitionInProgress = true;
    
//     // Reset state
//     this.setOutputData(0, false); // complete signal
//     this.setOutputData(1, 0); // progress
    
//     // Show the container
//     this._container.visible = true;
    
//     // Get screen dimensions
//     let screenWidth = 800;
//     let screenHeight = 600;
    
//     // Try to get actual screen size from parent
//     if (this._container.parent) {
//       if ((this._container.parent as any).width) {
//         screenWidth = (this._container.parent as any).width;
//       }
//       if ((this._container.parent as any).height) {
//         screenHeight = (this._container.parent as any).height;
//       }
//     }
    
//     return new Promise<void>((resolve) => {
//       const startTime = performance.now();
//       const duration = this.properties.transitionDuration;
      
//       // Store the completion callback
//       this._onTransitionComplete = resolve;
      
//       // Animation loop
//       const animate = () => {
//         const elapsed = performance.now() - startTime;
//         const progress = Math.min(elapsed / duration, 1);
        
//         // Update progress output
//         this.setOutputData(1, progress);
        
//         // Update transition visual based on type
//         this.updateTransitionVisual(progress, screenWidth, screenHeight);
        
//         if (progress < 1) {
//           requestAnimationFrame(animate);
//         } else {
//           // Transition complete
//           this._transitionInProgress = false;
//           this.setOutputData(0, true); // Signal completion
          
//           // Hide after a small delay
//           setTimeout(() => {
//             if (this._container) {
//               this._container.visible = false;
//             }
//             this._onTransitionComplete();
//           }, 50);
//         }
//       };
      
//       // Start animation
//       animate();
//     });
//   }
  
//   /**
//    * Update the transition visual based on progress
//    */
//   updateTransitionVisual(progress: number, width: number, height: number) {
//     if (!this._transitionGraphics) return;
    
//     this._transitionGraphics.clear();
    
//     switch (this.properties.transitionType) {
//       case 'fade':
//         // Simple fade transition
//         this._transitionGraphics.beginFill(this.properties.transitionColor, progress);
//         this._transitionGraphics.drawRect(0, 0, width, height);
//         this._transitionGraphics.endFill();
//         break;
        
//       case 'wipe_right':
//         // Wipe from left to right
//         this._transitionGraphics.beginFill(this.properties.transitionColor);
//         this._transitionGraphics.drawRect(0, 0, width * progress, height);
//         this._transitionGraphics.endFill();
//         break;
        
//       case 'wipe_left':
//         // Wipe from right to left
//         this._transitionGraphics.beginFill(this.properties.transitionColor);
//         this._transitionGraphics.drawRect(width - (width * progress), 0, width * progress, height);
//         this._transitionGraphics.endFill();
//         break;
        
//       case 'wipe_up':
//         // Wipe from bottom to top
//         this._transitionGraphics.beginFill(this.properties.transitionColor);
//         this._transitionGraphics.drawRect(0, height - (height * progress), width, height * progress);
//         this._transitionGraphics.endFill();
//         break;
        
//       case 'wipe_down':
//         // Wipe from top to bottom
//         this._transitionGraphics.beginFill(this.properties.transitionColor);
//         this._transitionGraphics.drawRect(0, 0, width, height * progress);
//         this._transitionGraphics.endFill();
//         break;
        
//       case 'circle':
//         // Circle expanding from center
//         const radius = Math.sqrt(width * width + height * height) * progress;
//         this._transitionGraphics.beginFill(this.properties.transitionColor);
//         this._transitionGraphics.drawCircle(width / 2, height / 2, radius);
//         this._transitionGraphics.endFill();
//         break;
//     }
//   }
  
//   /**
//    * Execute node logic
//    */
//   onExecute() {
//     super.onExecute();
    
//     // Check for trigger input
//     const trigger = this.getInputData(0);
//     if (trigger && !this._transitionInProgress) {
//       // Get callback if provided
//       const callback = this.getInputData(1);
//       if (typeof callback === 'function') {
//         this.executeTransition().then(() => {
//           callback();
//         });
//       } else {
//         this.executeTransition();
//       }
//     }
//   }
// }
