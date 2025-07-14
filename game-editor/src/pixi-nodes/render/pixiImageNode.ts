import { Sprite, Texture } from 'pixi.js';
import { NodeColors, NodeSizes } from '../../nodesConfig';
import { Logger } from '../../pixiNodeLogger';
import { BaseDisplayNode } from '../base/BaseDisplayNode';

/**
 * Simplified PixiImageNode
 * Responsible solely for displaying images and handling display properties
 * Inherits from BaseDisplayNode for common display properties
 */
export function registerPixiImageNode(LiteGraph: any) {
  Logger.debug('PixiImageNode', 'Registering PixiImageNode');
  
  class PixiImageNode extends BaseDisplayNode {
    // Internal properties
    _sprite: Sprite | null = null;
    _lastTextureId: string | null = null;
    _initialized: boolean = false;
    
    // LiteGraph properties
    declare inputs: any[];
    declare widgets_values: any[];
    declare graph: any;
    declare setDirtyCanvas: (a: boolean, b: boolean) => void;

    constructor() {
      super();
      
      Logger.debug('PixiImageNode', 'Initializing Image node');
      
      this.title = 'Image';
      this.size = NodeSizes.medium;
      this.boxcolor = NodeColors.render;
      this.color = NodeColors.render;
      
      // Extend properties with image-specific ones
      this.properties = {
        ...this.properties, // Include BaseDisplayNode properties
        visible: true,
        width: 100, 
        height: 100,
        maintainAspectRatio: true,
        tint: '#ffffff'
      };
      
      this._initialized = true;
      
      // Clear existing inputs (from BaseDisplayNode) and add our specific ones
      this.inputs = [];
      this.addInput('texture', 'texture');
      
      // Output port for sprite
      this.addOutput('sprite', 'pixi_display_object');
      
      // Size control widgets (specific to Image node)
      this.addWidget('number', 'width', this.properties.width, (v: number) => {
        this.properties.width = v;
        if (this.properties.maintainAspectRatio && this._sprite && this._sprite.texture) {
          const ratio = this._sprite.texture.height / this._sprite.texture.width;
          this.properties.height = v * ratio;
          if (this.widgets) {
            const heightWidget = this.widgets.find(w => w.name === 'height');
            if (heightWidget) heightWidget.value = this.properties.height;
          }
        }
        this.onDisplayPropertyChanged();
      });
      
      this.addWidget('number', 'height', this.properties.height, (v: number) => {
        this.properties.height = v;
        if (this.properties.maintainAspectRatio && this._sprite && this._sprite.texture) {
          const ratio = this._sprite.texture.width / this._sprite.texture.height;
          this.properties.width = v * ratio;
          if (this.widgets) {
            const widthWidget = this.widgets.find(w => w.name === 'width');
            if (widthWidget) widthWidget.value = this.properties.width;
          }
        }
        this.onDisplayPropertyChanged();
      });
      
      // Toggle for maintaining aspect ratio
      this.addWidget('toggle', 'Aspect Ratio', this.properties.maintainAspectRatio, (v: boolean) => {
        this.properties.maintainAspectRatio = v;
      });
      
      // Toggle for visibility
      this.addWidget('toggle', 'visible', this.properties.visible, (v: boolean) => {
        this.properties.visible = v;
        this.onDisplayPropertyChanged();
      });
      
      // Tint color - specific to Image
      this.addWidget('color', 'tint', this.properties.tint, (v: string) => { 
        this.properties.tint = v; 
        this.onDisplayPropertyChanged();
      });
      
      // Status text
      this.addWidget('text', 'Status', 'Waiting for texture...', () => {});
      
      // 简化的图像预览实现
      this.widgets_values = this.widgets_values || [];
      this.widgets.push({
        name: "preview",
        type: "image",
        value: "",
        options: { width: 100, height: 60 },
        _img: null, // 存储图像对象
        _textureId: "", // 跟踪当前纹理ID
        _imageURL: "", // 存储图像URL
        
        draw: function(ctx: CanvasRenderingContext2D, node: any, widget_width: number, y: number) {
          console.log('PixiImageNode preview widget draw called');
          
          // 没有精灵时显示占位符
          if (!node._sprite) {
            ctx.fillStyle = "#333";
            ctx.fillRect(0, y, widget_width, 60);
            ctx.fillStyle = "#aaa";
            ctx.textAlign = "center";
            ctx.fillText("No image", widget_width/2, y + 30);
            return y + 60;
          }
          
          // 尝试直接绘制纹理
          if (node._sprite.texture) {
            let textureURL = "";
            
            // 方法1：尝试从纹理资源获取URL
            try {
              const resource = node._sprite.texture.baseTexture?.resource;
              if (resource) {
                if (resource.url) {
                  textureURL = resource.url;
                } else if (resource.source) {
                  if (resource.source.src) {
                    textureURL = resource.source.src;
                  } else if (resource.source instanceof HTMLCanvasElement) {
                    try {
                      textureURL = resource.source.toDataURL();
                    } catch (e) {
                      console.warn("Cannot convert canvas to dataURL", e);
                    }
                  }
                }
              }
              
              // 如果无法获取URL，尝试直接使用sprite的texture
              if (!textureURL && node._lastTextureId) {
                textureURL = node._lastTextureId;
              }
              
              console.log('PixiImageNode preview texture URL:', textureURL);
            } catch (e) {
              console.error("Error getting texture URL:", e);
            }              // 如果有了URL但与之前的不同，创建新图像
            if (textureURL && this._imageURL !== textureURL) {
              // 确保URL格式有效（有些URL可能是相对路径或数据URI）
              if (!textureURL.startsWith('http') && !textureURL.startsWith('data:') && !textureURL.startsWith('/')) {
                // 将相对路径转换为绝对路径
                textureURL = new URL(textureURL, window.location.href).href;
              }
              
              this._imageURL = textureURL;
              
              if (!this._img) {
                this._img = new Image();
                
                // 使用箭头函数以保持正确的this上下文
                this._img.onload = () => {
                  console.log('Image loaded successfully:', this._img.width, 'x', this._img.height);
                  node.setDirtyCanvas(true, true);
                };
                
                this._img.onerror = (e) => {
                  console.error('Image load error:', e);
                  // 错误发生时，尝试不同的URL格式
                  if (this._imageURL.startsWith('/')) {
                    console.log('Trying alternative URL format');
                    const altURL = window.location.origin + this._imageURL;
                    if (altURL !== this._img.src) {
                      this._img.src = altURL;
                    }
                  }
                };
              }
              
              // 避免循环重复加载同一URL
              if (this._img.src !== textureURL) {
                // 直接设置图像源
                console.log('Setting image src to:', textureURL);
                this._img.src = textureURL;
                
                // 立即标记画布为脏
                node.setDirtyCanvas(true, true);
              }
            }
            
            // 如果图像已加载，绘制它
            if (this._img && this._img.complete && this._img.naturalWidth > 0) {
              console.log('Drawing loaded image:', this._img.naturalWidth, 'x', this._img.naturalHeight);
              
              // 计算适当的尺寸保持宽高比
              const aspect = this._img.naturalWidth / this._img.naturalHeight;
              let w = Math.min(widget_width, 100);
              let h = w / aspect;
              
              if (h > 60) {
                h = 60;
                w = h * aspect;
              }
              
              // 居中绘制图像
              const x = (widget_width - w) * 0.5;
              ctx.drawImage(this._img, x, y, w, h);
              return y + h + 5;
            } else {
              // 绘制加载中占位符
              ctx.fillStyle = "#333";
              ctx.fillRect(0, y, widget_width, 60);
              ctx.fillStyle = "#aaa";
              ctx.textAlign = "center";
              ctx.fillText("Loading image...", widget_width/2, y + 30);
              
              // 延迟后强制更新画布以检查图像是否加载
              if (this._img && this._img.src) {
                setTimeout(() => node.setDirtyCanvas(true, true), 200);
              }
              
              return y + 60;
            }
          } else {
            // 没有纹理，显示占位符
            ctx.fillStyle = "#333";
            ctx.fillRect(0, y, widget_width, 60);
            ctx.fillStyle = "#aaa";
            ctx.textAlign = "center";
            ctx.fillText("No texture", widget_width/2, y + 30);
            return y + 60;
          }
        }
      });
    }
  
    /**
     * Override onDisplayPropertyChanged from BaseDisplayNode
     * Update sprite properties when display properties change
     */
    onDisplayPropertyChanged() {
      if (!this._sprite) {
        console.log('PixiImageNode: No sprite to update properties');
        Logger.warn('PixiImageNode', 'Attempted to update properties for null sprite');
        return;
      }
      
      console.log('PixiImageNode: Applying display properties to sprite');
      Logger.info('PixiImageNode', 'Applying display properties to sprite');
      
      try {
        // 检查精灵是否有效
        if (!this._sprite.texture) {
          console.log('PixiImageNode: Sprite has no texture');
          Logger.warn('PixiImageNode', 'Sprite has no texture');
        }
        
        // Apply base display properties (x, y, scale, rotation, alpha, anchor)
        // 避免调用可能导致循环调用的方法
        if (typeof this.properties.x === 'number') this._sprite.x = this.properties.x;
        if (typeof this.properties.y === 'number') this._sprite.y = this.properties.y;
        if (typeof this.properties.alpha === 'number') this._sprite.alpha = this.properties.alpha;
        if (typeof this.properties.rotation === 'number') this._sprite.rotation = this.properties.rotation;
        
        // 处理缩放
        if (typeof this.properties.scale === 'number') {
          this._sprite.scale.x = this.properties.scale;
          this._sprite.scale.y = this.properties.scale;
        }
        
        // 处理锚点
        if (typeof this.properties.anchor === 'number') {
          this._sprite.anchor.set(this.properties.anchor);
        }
        
        // 明确输出精灵的位置和变换信息
        console.log(`PixiImageNode: Sprite position: (${this._sprite.x}, ${this._sprite.y}), ` +
                    `scale: ${this._sprite.scale.x}, rotation: ${this._sprite.rotation}`);
        
        // Apply Image-specific properties
        this._sprite.visible = this.properties.visible;
        console.log(`PixiImageNode: Set sprite visibility: ${this.properties.visible}`);
        
        // Handle width and height 
        if (this.properties.width !== undefined && this.properties.height !== undefined) {
          // Set explicit dimensions if provided
          this._sprite.width = this.properties.width;
          this._sprite.height = this.properties.height;
          console.log(`PixiImageNode: Set sprite dimensions: ${this.properties.width}x${this.properties.height}`);
        }
        
        // Apply tint (specific to Image)
        if (this.properties.tint) {
          try {
            if (typeof this.properties.tint === 'string' && this.properties.tint.startsWith('#')) {
              const colorValue = parseInt(this.properties.tint.replace('#', ''), 16);
              this._sprite.tint = colorValue;
              console.log(`PixiImageNode: Set tint: ${this.properties.tint} (${colorValue})`);
            }
          } catch (err) {
            console.error('PixiImageNode: Error applying tint:', err);
            Logger.error('PixiImageNode', 'Error applying tint:', err);
          }
        }
        
        // 更新状态显示，但不要触发新的图形执行
        const statusWidget = this.widgets.find(w => w.name === 'Status');
        if (statusWidget && this._sprite.texture) {
          statusWidget.value = `Sprite ready: ${this._sprite.width.toFixed(0)}x${this._sprite.height.toFixed(0)}`;
        }
        
        // Mark canvas as dirty
        this.setDirtyCanvas(true, true);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error('PixiImageNode Error in onDisplayPropertyChanged:', errorMessage);
        Logger.error('PixiImageNode', `Error in onDisplayPropertyChanged: ${errorMessage}`);
      }
    }
  
    /**
     * Handle a new texture being set
     */
    _handleNewTexture(texture: Texture) {
      if (!texture) {
        console.log('PixiImageNode: Attempted to handle null texture');
        Logger.warn('PixiImageNode', 'Attempted to handle null texture');
        return;
      }
      
      try {
        console.log(`PixiImageNode: Handling texture ${texture.width}x${texture.height}`);
        Logger.info('PixiImageNode', `Handling texture: valid=${texture.valid}, dimensions=${texture.width}x${texture.height}`);
        
        // 确保纹理标记为有效
        if (texture.baseTexture) {
          try {
            texture.baseTexture.valid = true;
          } catch (e) {
            console.warn("Cannot set texture.baseTexture.valid:", e);
          }
        }
        
        // Store texture ID to track changes
        if (texture.baseTexture && texture.baseTexture.resource) {
          const resource = texture.baseTexture.resource;
          this._lastTextureId = resource.url || (resource.source && resource.source.src) || '';
          console.log('PixiImageNode: Texture ID:', this._lastTextureId);
          Logger.info('PixiImageNode', `Setting texture ID: ${this._lastTextureId}`);
        }
        
        // Create or update sprite
        if (!this._sprite) {
          // 使用明确的方式创建精灵
          this._sprite = new Sprite();
          this._sprite.texture = texture;
          console.log('PixiImageNode: Created new sprite', this._sprite);
          Logger.info('PixiImageNode', 'Created new sprite with texture');
        } else {
          this._sprite.texture = texture;
          console.log('PixiImageNode: Updated sprite texture', this._sprite);
          Logger.info('PixiImageNode', 'Updated sprite with new texture');
        }
        
        // 明确设置精灵的初始属性，不调用可能引起递归的方法
        this._sprite.visible = this.properties.visible;
        this._sprite.width = this.properties.width;
        this._sprite.height = this.properties.height;
        
        if (typeof this.properties.x === 'number') this._sprite.x = this.properties.x;
        if (typeof this.properties.y === 'number') this._sprite.y = this.properties.y;
        if (typeof this.properties.alpha === 'number') this._sprite.alpha = this.properties.alpha;
        if (typeof this.properties.rotation === 'number') this._sprite.rotation = this.properties.rotation;
        
        if (typeof this.properties.scale === 'number') {
          this._sprite.scale.x = this.properties.scale;
          this._sprite.scale.y = this.properties.scale;
        }
        
        if (typeof this.properties.anchor === 'number') {
          this._sprite.anchor.set(this.properties.anchor);
        }
        
        // 确保精灵已经添加到舞台或父容器
        console.log('PixiImageNode: Sprite configured with size:', 
                    this._sprite.width, 'x', this._sprite.height);
        
        // If texture has dimensions, update the size properties
        if (texture.width && texture.height) {
          console.log(`PixiImageNode: Texture dimensions: ${texture.width}x${texture.height}`);
          Logger.info('PixiImageNode', `Texture dimensions: ${texture.width}x${texture.height}`);
          
          // Update size while maintaining aspect ratio if enabled
          if (this.properties.maintainAspectRatio) {
            // Base size on either width or height depending on which is smaller
            const widthBasedHeight = this.properties.width * (texture.height / texture.width);
            const heightBasedWidth = this.properties.height * (texture.width / texture.height);
            
            if (widthBasedHeight <= this.properties.height) {
              this.properties.height = widthBasedHeight;
            } else {
              this.properties.width = heightBasedWidth;
            }
            
            console.log(`PixiImageNode: Adjusted size to: ${this.properties.width}x${this.properties.height}`);
            Logger.info('PixiImageNode', `Adjusted size to: ${this.properties.width}x${this.properties.height}`);
            
            // Update the widget values for width and height
            if (this.widgets) {
              const widthWidget = this.widgets.find(w => w.name === 'width');
              const heightWidget = this.widgets.find(w => w.name === 'height');
              if (widthWidget) widthWidget.value = this.properties.width;
              if (heightWidget) heightWidget.value = this.properties.height;
              
              // 手动应用尺寸，而不调用onDisplayPropertyChanged
              this._sprite.width = this.properties.width;
              this._sprite.height = this.properties.height;
            }
          }
        }
        
        // 应用颜色调整
        if (this.properties.tint && typeof this.properties.tint === 'string' && 
            this.properties.tint.startsWith('#')) {
          try {
            const colorValue = parseInt(this.properties.tint.replace('#', ''), 16);
            this._sprite.tint = colorValue;
          } catch(e) {
            console.warn('Error applying tint:', e);
          }
        }
        
        // Update status
        const statusWidget = this.widgets.find(w => w.name === 'Status');
        if (statusWidget) {
          statusWidget.value = `Texture loaded (${texture.width}x${texture.height})`;
        }
        
        // 手动更新预览组件
        const previewWidget = this.widgets.find(w => w.name === 'preview');
        if (previewWidget) {
          // 尝试从纹理中提取URL
          let imageUrl = '';
          try {
            if (texture.baseTexture && texture.baseTexture.resource) {
              const resource = texture.baseTexture.resource;
              if (resource.url) {
                imageUrl = resource.url;
              } else if (resource.source) {
                if (resource.source instanceof HTMLImageElement) {
                  imageUrl = resource.source.src;
                } else if (resource.source instanceof HTMLCanvasElement) {
                  try {
                    imageUrl = resource.source.toDataURL();
                  } catch (e) {
                    console.warn('Failed to get canvas data URL:', e);
                  }
                }
              }
            }
            
            if (imageUrl) {
              console.log('PixiImageNode: Updating preview widget with URL:', imageUrl);
              previewWidget._imageURL = imageUrl;
              
              // 如果已经有图像对象，更新它
              if (previewWidget._img) {
                previewWidget._img.src = imageUrl;
              } else {
                previewWidget._img = new Image();
                previewWidget._img.onload = () => {
                  console.log('PixiImageNode: Preview image loaded in _handleNewTexture');
                  this.setDirtyCanvas(true, true);
                };
                previewWidget._img.src = imageUrl;
              }
            } else {
              console.log('PixiImageNode: Could not extract image URL from texture');
            }
          } catch (e) {
            console.warn('PixiImageNode: Error updating preview in _handleNewTexture:', e);
          }
        }
        
        // Force canvas update but don't trigger a graph run which could cause recursion
        this.setDirtyCanvas(true, true);
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error('PixiImageNode Error:', errorMessage);
        Logger.error('PixiImageNode', 'Error handling new texture:', errorMessage);
        
        const statusWidget = this.widgets.find(w => w.name === 'Status');
        if (statusWidget) {
          statusWidget.value = `Error: ${errorMessage}`;
        }
      }
    }
  
    /**
     * Main execution method - override BaseDisplayNode's onExecute
     */
    onExecute() {
      // 添加这行以确认 onExecute 被调用
      console.log('PixiImageNode onExecute called');
      
      // 避免调用父类方法，因为它可能会导致递归问题
      // 仅对必要的属性进行处理
      
      // Get input texture from the 'texture' input (which is now at index 0 after we cleared the inputs array)
      const texture = this.getInputData(0);
      
      // 使用 console.log 强制显示输入信息
      console.log('PixiImageNode input:', texture);
      
      // Log received input for debugging
      Logger.info('PixiImageNode', `onExecute received input: ${texture ? 'Texture object' : 'null'}`);
      
      if (texture instanceof Texture) {
        console.log(`PixiImageNode received texture: ${texture.width}x${texture.height}`);
        Logger.info('PixiImageNode', `Got valid texture instance, dimensions: ${texture.width}x${texture.height}`);
        
        // Ensure the texture is marked as valid
        if (texture.baseTexture) {
          // Handle the texture validation differently since 'valid' property may not exist
          try {
            texture.baseTexture.valid = true;
          } catch (e) {
            console.warn("Cannot set texture.baseTexture.valid:", e);
          }
        }
        
        // 优先获取资源标识符，用于显示实际的图片预览
        let textureId = null;
        let sourceUrl = null;
        
        if (texture.baseTexture && texture.baseTexture.resource) {
          const resource = texture.baseTexture.resource;
          
          // 尝试多种方式获取纹理URL
          if (resource.url) {
            sourceUrl = resource.url;
          } else if (resource.source) {
            if (resource.source instanceof HTMLImageElement && resource.source.src) {
              sourceUrl = resource.source.src;
            } else if (resource.source instanceof HTMLCanvasElement) {
              try {
                sourceUrl = resource.source.toDataURL();
              } catch(e) {
                console.warn("Cannot get dataURL from canvas:", e);
              }
            }
          }
          
          textureId = sourceUrl || '';
          console.log('PixiImageNode: Texture Source URL:', sourceUrl);
          Logger.info('PixiImageNode', `Texture resource ID: ${textureId}`);
        }
        
        // 强制使用Sprite的实际尺寸而非纹理尺寸
        console.log(`PixiImageNode: Using texture dimension: ${texture.width}x${texture.height}`);
        
        // 无条件地创建或更新精灵，以确保能够正确显示
        Logger.info('PixiImageNode', 'Creating/updating sprite with texture');
        this._handleNewTexture(texture);
        
        // 确保直接更新预览组件的图像URL和ID
        if (sourceUrl) {
          try {
            const previewWidget = this.widgets.find(w => w.name === 'preview');
            if (previewWidget) {
              console.log('PixiImageNode: Setting preview image data directly, URL:', sourceUrl);
              
              // 更新预览组件的跟踪变量
              previewWidget._imageURL = sourceUrl;
              previewWidget._textureId = textureId;
              
              // 如果已经有图像对象，直接设置源
              if (previewWidget._img) {
                console.log('PixiImageNode: Setting existing preview image src to:', sourceUrl);
                previewWidget._img.src = sourceUrl;
              } else {
                // 否则创建新的图像对象
                previewWidget._img = new Image();
                previewWidget._img.onload = () => {
                  console.log('PixiImageNode: Preview image loaded:', previewWidget._img.width, 'x', previewWidget._img.height);
                  this.setDirtyCanvas(true, true);
                };
                previewWidget._img.onerror = (e) => {
                  console.error('PixiImageNode: Preview image load error:', e);
                };
                previewWidget._img.src = sourceUrl;
              }
              
              // 强制重绘预览
              this.setDirtyCanvas(true, true);
            }
          } catch (e) {
            console.warn('Could not update preview directly:', e);
          }
        }
        
      } else if (texture) {
        // 如果收到的输入不是纹理但也不是空值
        console.log('PixiImageNode received non-Texture input:', typeof texture);
        Logger.warn('PixiImageNode', `Received non-Texture input: ${typeof texture}`);
      } else if (this.inputs[0] && this.inputs[0].link) {
        // Connected but no valid texture data yet
        Logger.info('PixiImageNode', 'Connected but no valid texture yet');
        console.log('PixiImageNode: Connected but no valid texture yet');
        
        const statusWidget = this.widgets.find(w => w.name === 'Status');
        if (statusWidget) {
          statusWidget.value = 'Waiting for texture...';
          this.setDirtyCanvas(true, false);
        }
      }
      
      // Output the sprite if we have one - always try to output even if it hasn't changed
      if (this._sprite) {
        console.log('PixiImageNode outputting sprite:', 
                    `width=${this._sprite.width}, height=${this._sprite.height}, ` +
                    `texture=${this._sprite.texture ? 'present' : 'missing'}`);
        
        Logger.info('PixiImageNode', `Outputting sprite with texture ${this._sprite.texture ? 'attached' : 'missing'}`);
        this.setOutputData(0, this._sprite);
        
        // 更新状态显示
        const statusWidget = this.widgets.find(w => w.name === 'Status');
        if (statusWidget && this._sprite.texture) {
          statusWidget.value = `Sprite ready (${this._sprite.width.toFixed(0)}x${this._sprite.height.toFixed(0)})`;
        }
      } else {
        console.log('PixiImageNode: No sprite to output');
        Logger.info('PixiImageNode', 'No sprite to output');
        
        // 如果没有精灵，尝试重置状态
        const statusWidget = this.widgets.find(w => w.name === 'Status');
        if (statusWidget) {
          statusWidget.value = 'No sprite created yet';
        }
      }
    }
  
    /**
     * Handle connections change
     * This method signature needs to match the parent class method
     */
    // @ts-ignore - We need to override the parent method with different parameters
    onConnectionsChange(type: number, slotIndex: number, isConnected: boolean) {
      console.log(`PixiImageNode: Connection change: type=${type}, slot=${slotIndex}, connected=${isConnected}`);
      Logger.info('PixiImageNode', `Connection change: type=${type}, slot=${slotIndex}, connected=${isConnected}`);
      
      if (type === LiteGraph.INPUT && slotIndex === 0) {
        const statusWidget = this.widgets.find(w => w.name === 'Status');
        
        if (!isConnected) {
          // Input disconnected, update status
          console.log('PixiImageNode: Texture input disconnected');
          if (statusWidget) {
            statusWidget.value = "No texture input";
            this.setDirtyCanvas(true, false);
          }
          
          // 输入断开连接时，尝试立即重新运行以更新状态
          setTimeout(() => {
            if (this.graph) {
              console.log('PixiImageNode: Requesting graph update after disconnect');
              this.graph.runStep();
            }
          }, 100);
        } else {
          // New connection established
          console.log('PixiImageNode: New texture input connection');
          if (statusWidget) {
            statusWidget.value = "Waiting for texture...";
            this.setDirtyCanvas(true, false);
            
            // Force graph execution to check for new data immediately
            setTimeout(() => {
              if (this.graph) {
                console.log('PixiImageNode: Requesting graph update after new connection');
                this.graph.runStep();
              }
            }, 100);
          }
        }
      } else if (type === LiteGraph.OUTPUT && slotIndex === 0) {
        // Something connected to our sprite output
        console.log(`PixiImageNode: Sprite output ${isConnected ? 'connected' : 'disconnected'}`);
        
        // 如果有输出连接并且我们有精灵，立即推送数据
        if (isConnected && this._sprite) {
          // Force execution to send our sprite to the new connection
          setTimeout(() => {
            if (this.graph) {
              console.log('PixiImageNode: Sending sprite to newly connected output');
              this.setOutputData(0, this._sprite);
              this.graph.runStep();
            }
          }, 100);
        }
      }
    }
  
    /**
     * Cleanup on removal
     */
    onRemoved() {
      Logger.debug('PixiImageNode', 'Node removed, cleaning up resources');
      
      if (this._sprite) {
        // Clean up the sprite but don't destroy the texture
        // since other nodes might still be using it
        this._sprite.destroy({ children: true, texture: false });
        this._sprite = null;
      }
      
      this._lastTextureId = null;
    }
    
    /**
     * Helper method to validate a texture and update the preview
     * This is called whenever we need to force a preview update
     */
    _validateTextureAndUpdatePreview() {
      console.log('PixiImageNode: Validating texture and updating preview');
      
      if (!this._sprite || !this._sprite.texture) {
        console.log('PixiImageNode: No sprite or texture to validate');
        return;
      }
      
      // Ensure texture is valid
      if (this._sprite.texture.baseTexture) {
        // Try to handle the texture validation differently since 'valid' property might not exist
        try {
          if ('valid' in this._sprite.texture.baseTexture) {
            (this._sprite.texture.baseTexture as any).valid = true;
          }
          
          // Try alternate approach for some versions of PixiJS
          if (this._sprite.texture.valid !== undefined) {
            this._sprite.texture.valid = true;
          }
        } catch (e) {
          console.warn('PixiImageNode: Could not set texture validity:', e);
        }
        
        // Log texture details
        const resource = this._sprite.texture.baseTexture.resource;
        if (resource) {
          const source = resource.source;
          console.log('PixiImageNode texture source:', 
                      source ? (typeof source === 'object' ? source.constructor.name : typeof source) : 'undefined');
          
          if (source instanceof HTMLImageElement) {
            console.log('PixiImageNode texture image:', 
                        source.width + 'x' + source.height, 
                        'loaded:', source.complete, 
                        'src:', source.src);
          }
        }
      }
      
      // Force preview update by marking canvas as dirty
      this.setDirtyCanvas(true, true);
      
      // Update status widget
      const statusWidget = this.widgets.find(w => w.name === 'Status');
      if (statusWidget && this._sprite.texture) {
        statusWidget.value = `Sprite ready (${this._sprite.width.toFixed(0)}x${this._sprite.height.toFixed(0)})`;
      }
    }
  }

  // Register node
  Logger.debug('PixiImageNode', 'Registering node type: render/image');
  LiteGraph.registerNodeType('render/image', PixiImageNode);
  Logger.debug('PixiImageNode', 'Node registration completed');
}
