import { Sprite, Texture, Assets } from 'pixi.js';
import { NodeColors, NodeSizes } from '../../nodesConfig';
import { Logger } from '../../pixiNodeLogger';
import { PixiResourceManager } from '../logic/pixiResourceManager';

export function registerPixiImageNode(LiteGraph: any) {
  function PixiImageNode(this: any) {
    // Internal tracking properties
    this._lastResourceId = null; // To track resources loaded through ResourceManager
    
    // 创建隐藏的文件输入元素
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);

    fileInput.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (file) {
        // 更新状态文本，显示正在加载
        if (this.widgets && this.widgets[8] && this.widgets[8].type === "text") {
          this.widgets[8].value = `Loading ${file.name}...`;
        }
        
        const reader = new FileReader();
        reader.onload = (evt) => {
          this.properties.imageUrl = evt.target?.result as string;
          this.onPropertyChanged('imageUrl', this.properties.imageUrl);
          
          // 通知图表更新，我们在这里直接使用 setDirtyCanvas
          this.setDirtyCanvas(true, true);
          
          // 强制节点执行，加载图片
          if (this.onExecute) {
            this.onExecute();
          }
        };
        reader.readAsDataURL(file);
      }
    };
    this.addInput('texture', 'texture');  // 可以接收纹理输入
    this.addOutput('sprite', 'pixi_display_object');
    this._sprite = null;
    this.title = 'Image';
    this.size = NodeSizes.medium;
    this.boxcolor = NodeColors.render;
    this.color = NodeColors.render;

    // 属性初始化
    this.properties = {
      imageUrl: '',
      x: 0,
      y: 0,
      scale: 1,
      rotation: 0,
      alpha: 1,
      anchor: 0.5,
      tint: '#ffffff'
    };

    // 添加导入图片按钮
    this.addWidget('button', 'importImage', null, () => {
      fileInput.click();
    });
    
    // 添加属性控制部分
    this.addWidget('number', 'x', this.properties.x, (v: any) => { this.properties.x = v; });
    this.addWidget('number', 'y', this.properties.y, (v: any) => { this.properties.y = v; });
    this.addWidget('number', 'scale', this.properties.scale, (v: any) => { this.properties.scale = v; });
    this.addWidget('number', 'rotation', this.properties.rotation, (v: any) => { this.properties.rotation = v; });
    this.addWidget('number', 'alpha', this.properties.alpha, (v: any) => { this.properties.alpha = v; });
    this.addWidget('number', 'anchor', this.properties.anchor, (v: any) => { this.properties.anchor = v; });
    this.addWidget('color', 'tint', this.properties.tint, (v: any) => { this.properties.tint = v; });
    
    // 添加一个文本部分，显示当前图片状态 (现在移到属性下方)
    this.addWidget('text', 'Status', '');
    
    // 添加简化的图片预览 (移到最下方)
    this.widgets_values = this.widgets_values || []; // 确保 widgets_values 存在
    this.widgets.push({
      name: "preview",
      type: "image",
      value: "",
      options: { width: 100, height: 60 },
      draw: function(ctx, node, widget_width, y, widget_height) {
        if (!node.properties.imageUrl) return;
        // 获取或创建图像对象
        if (!this._img) {
          this._img = new Image();
          this._img.onload = function() {
            node.setDirtyCanvas(true, true);
          };
        }
        
        // 更新图像 URL
        if (this._img.src != node.properties.imageUrl) {
          this._img.src = node.properties.imageUrl;
          if (node.widgets && node.widgets[8]) { // 更新索引到第9个widget (索引8)，因为它现在是Status文本
            node.widgets[8].value = "Image loaded";
          }
        }
        
        // 如果图像已加载，则绘制
        if (this._img.complete && this._img.naturalWidth) {
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
        }
        
        return y + 10;
      }
    });
  }

  PixiImageNode.prototype.onPropertyChanged = function(name: string, value: any) {
    if (name === 'imageUrl' && value && value !== '') {
      // 更新状态文本
      if (this.widgets && this.widgets[8] && this.widgets[8].type === "text") {
        this.widgets[8].value = "Loading...";
      }
      
      // 立即更新节点外观，显示图片预览
      this.setDirtyCanvas(true, true);
    }
  };

  PixiImageNode.prototype.onExecute = function() {
    // 优先级：输入Texture > 输入alias字符串 > imageUrl
    let texture: Texture | null = null;
    const input = this.getInputData(0);
    
    // 更新状态显示
    if (this.widgets && this.widgets[8] && this.widgets[8].type === "text") {
      if (!input) {
        this.widgets[8].value = "无输入纹理";
      } else {
        this.widgets[8].value = "处理输入...";
      }
    }
    
    // 更详细地检查输入类型
    Logger.debug('PixiImageNode', 'Processing input:', typeof input, 
      input && input.constructor ? input.constructor.name : 'unknown',
      'Input data:', input);
    
    // 如果输入为空，直接返回
    if (input === null || input === undefined) {
      Logger.debug('PixiImageNode', 'Input is null or undefined');
      if (this.widgets && this.widgets[8]) {
        this.widgets[8].value = "无纹理输入";
      }
      return;
    }
    
    if (input instanceof Texture) {
      // 使用输入的纹理，但不再严格检查 valid 标志
      // 如果纹理有 baseTexture，我们认为它是可用的
      if (input.baseTexture) {
        // 强制将输入纹理标记为有效
        input.baseTexture.valid = true;
        
        // 使用输入的纹理
        texture = input;
        Logger.debug('PixiImageNode', 'Using input Texture directly:', 
          'dimensions:', texture.width, 'x', texture.height);
      } else {
        Logger.warn('PixiImageNode', 'Input texture has no baseTexture');
        if (this.widgets && this.widgets[8]) {
          this.widgets[8].value = "输入的纹理缺少基础纹理";
        }
        return;
      }
    } else if (typeof input === 'object' && input !== null && 'baseTexture' in input) {
      // 处理看起来像纹理但不是直接的 Texture 实例的情况
      try {
        texture = input as Texture;
        
        // 确保纹理的baseTexture存在，并将其强制标记为有效
        if (texture.baseTexture) {
          // 强制将纹理标记为有效
          texture.baseTexture.valid = true;
          
          Logger.debug('PixiImageNode', 'Using texture-like object:',
            'dimensions:', texture.width, 'x', texture.height);
        } else {
          Logger.warn('PixiImageNode', 'Texture-like object has no baseTexture');
          if (this.widgets && this.widgets[8]) {
            this.widgets[8].value = "纹理对象缺少基础纹理";
          }
          return;
        }
      } catch (e) {
        Logger.error('PixiImageNode', 'Error using texture-like object:', e);
        texture = null;
        if (this.widgets && this.widgets[8]) {
          this.widgets[8].value = "纹理对象错误";
        }
        return;
      }
    } else if (typeof input === 'string' && input) {
      // 支持 alias 字符串
      try {
        texture = Assets.get(input);
        Logger.debug('PixiImageNode', 'Getting texture by alias:', input, 
          'Result:', texture ? 'found' : 'not found');
        
        if (!texture) {
          Logger.warn('PixiImageNode', 'Assets.get returned null/undefined for alias:', input);
          if (this.widgets && this.widgets[8]) {
            this.widgets[8].value = `别名 "${input}" 未找到纹理`;
          }
          return;
        }
        
        // 确保纹理有 baseTexture，并将其强制标记为有效
        if (texture.baseTexture) {
          // 强制将纹理标记为有效
          texture.baseTexture.valid = true;
        } else {
          Logger.warn('PixiImageNode', 'Texture from alias has no baseTexture:', input);
          if (this.widgets && this.widgets[8]) {
            this.widgets[8].value = `别名 "${input}" 的纹理缺少基础纹理`;
          }
          return;
        }
      } catch (e) {
        Logger.error('PixiImageNode', 'Error getting texture by alias:', input, e);
        if (this.widgets && this.widgets[8]) {
          this.widgets[8].value = `获取别名纹理出错: ${e.message || e}`;
        }
        return;
      }
    }
    // 如果没有输入，尝试 imageUrl
    if (!texture && this.properties.imageUrl) {
      try {
        // 更新状态
        if (this.widgets && this.widgets[8]) {
          this.widgets[8].value = "Loading from URL...";
        }
        
        // 检查URL是否有效
        if (!this.properties.imageUrl || this.properties.imageUrl.trim() === '') {
          Logger.error('PixiImageNode', 'Image URL is empty or invalid');
          if (this.widgets && this.widgets[8]) {
            this.widgets[8].value = "Image URL is empty or invalid";
          }
        } 
        else {
          // 创建唯一的资源ID
          const resourceId = `image_${this.id}_${Date.now()}`;
          
          // 获取资源管理器实例
          const resourceManager = PixiResourceManager.getInstance();
          
          // 注册资源
          resourceManager.registerResource({
            id: resourceId,
            type: 'texture',
            url: this.properties.imageUrl,
            alias: resourceId,
            metadata: { nodeId: this.id }
          });
          
          Logger.info('PixiImageNode', `Registered image resource: ${resourceId}`);
          
          // 尝试通过资源管理器加载纹理
          try {
            if (this.widgets && this.widgets[8]) {
              this.widgets[8].value = "Loading via ResourceManager...";
            }
            
            // 异步加载资源
            resourceManager.loadResource(resourceId)
              .then((loadedTexture) => {
                if (loadedTexture && loadedTexture instanceof Texture) {
                  texture = loadedTexture;
                  
                  // 创建或更新精灵
                  this.updateSpriteWithTexture(texture);
                  
                  // 更新状态文本
                  if (this.widgets && this.widgets[8]) {
                    this.widgets[8].value = `Image loaded (${texture.width}x${texture.height})`;
                  }
                  
                  // 更新预览
                  if (this.widgets && this.widgets[9] && this.widgets[9]._img) {
                    this.widgets[9]._img.src = this.properties.imageUrl;
                  }
                  
                  // 存储资源ID，以便后续清理
                  this._lastResourceId = resourceId;
                  
                  // 通知图表更新
                  this.setDirtyCanvas(true, true);
                } else {
                  Logger.error('PixiImageNode', 'ResourceManager returned invalid texture');
                  if (this.widgets && this.widgets[8]) {
                    this.widgets[8].value = "Failed to load texture";
                  }
                }
              })
              .catch(err => {
                Logger.error('PixiImageNode', 'Error loading texture via ResourceManager:', err);
                if (this.widgets && this.widgets[8]) {
                  this.widgets[8].value = `Error: ${err.message || 'Unknown error'}`;
                }
              });
          } catch (err) {
            Logger.error('PixiImageNode', 'Error using ResourceManager:', err);
            if (this.widgets && this.widgets[8]) {
              this.widgets[8].value = `Error: ${err.message || 'Unknown error'}`;
            }
          }
        }
      } catch (error: any) {
        Logger.error('PixiImageNode', 'Failed to load texture:', error);
      }
    }

    // 创建或更新 sprite
    if (texture) {
      // 使用辅助方法更新精灵
      this.updateSpriteWithTexture(texture);
    } else {
      // 没有可用的纹理，更新状态文本
      
      // 更新状态文本，显示加载失败
      if (this.widgets && this.widgets[8] && this.widgets[8].type === "text") {
        this.widgets[8].value = "Failed to load texture";
      }
    }

    // 更新和输出 sprite
    if (this._sprite) {
      // 确保属性已经应用（这些已经在updateSpriteWithTexture中设置，但在某些情况下可能需要在这里再次设置）
      if (!texture && this._sprite.texture) {
        // 如果是从前面的执行中保存的精灵，确保属性是最新的
        this._sprite.x = this.properties.x;
        this._sprite.y = this.properties.y;
        this._sprite.scale.set(this.properties.scale);
        this._sprite.rotation = this.properties.rotation;
        this._sprite.alpha = this.properties.alpha;
        this._sprite.anchor.set(this.properties.anchor);
        
        // 处理颜色
        if (this.properties.tint) {
          try {
            if (typeof this.properties.tint === 'string' && this.properties.tint.startsWith('#')) {
              this._sprite.tint = parseInt(this.properties.tint.replace('#', ''), 16);
            } else {
              // 不应用错误格式的颜色
            }
          } catch (error) {
            Logger.error('PixiImageNode', 'Error setting tint:', error);
          }
        }
      }
      
      // 确保可见性
      this._sprite.visible = true;
      
      // 输出精灵
      this.setOutputData(0, this._sprite);
    } else {
      // 没有可用的精灵输出
      if (this.widgets && this.widgets[8] && this.widgets[8].type === "text") {
        this.widgets[8].value = "No sprite to output";
      }
    }
  };

  // 当节点被移除时清理资源
  // 添加一个辅助方法来更新精灵
  PixiImageNode.prototype.updateSpriteWithTexture = function(texture: Texture) {
    if (!texture) {
      return;
    }
    
    try {
      // 创建或更新 sprite
      if (!this._sprite) {
        this._sprite = new Sprite(texture);
      } else {
        this._sprite.texture = texture;
      }
      
      // 确保 sprite 有效并可见
      if (this._sprite) {
        this._sprite.visible = true;
        
        // 应用所有属性
        this._sprite.x = this.properties.x;
        this._sprite.y = this.properties.y;
        this._sprite.scale.set(this.properties.scale);
        this._sprite.rotation = this.properties.rotation;
        this._sprite.alpha = this.properties.alpha;
        this._sprite.anchor.set(this.properties.anchor);
        
        // 处理颜色
        if (this.properties.tint) {
          try {
            if (typeof this.properties.tint === 'string' && this.properties.tint.startsWith('#')) {
              this._sprite.tint = parseInt(this.properties.tint.replace('#', ''), 16);
            }
          } catch (err) {
            Logger.error('PixiImageNode', 'Error applying tint:', err);
          }
        }
        
        // 更新状态文本，显示成功加载
        if (this.widgets && this.widgets[8] && this.widgets[8].type === "text") {
          this.widgets[8].value = `Sprite ready (${texture.width || 'unknown'}x${texture.height || 'unknown'})`;
        }
        
        // 通知图表需要更新
        this.setDirtyCanvas(true, true);
      }
    } catch (error) {
      Logger.error('PixiImageNode', 'Error in updateSpriteWithTexture:', error);
    }
  };

  PixiImageNode.prototype.onRemoved = function() {
    // Clean up the sprite
    if (this._sprite) {
      this._sprite.destroy({children: true, texture: true, baseTexture: true});
      this._sprite = null;
    }
    
    // Clean up any resources loaded through ResourceManager
    if (this._lastResourceId) {
      try {
        const resourceManager = PixiResourceManager.getInstance();
        resourceManager.unloadResource(this._lastResourceId).catch(err => {
          Logger.warn('PixiImageNode', `Failed to unload resource ${this._lastResourceId}:`, err);
        });
        this._lastResourceId = null;
      } catch (err) {
        Logger.error('PixiImageNode', 'Error unloading resource:', err);
      }
    }
  };

  // 连接变化时的处理
  PixiImageNode.prototype.onConnectionsChange = function(this: any, type: number, slotIndex: number, isConnected: boolean, _link: any, _ioSlot: any) {
    if (type === 1 /* LiteGraph.INPUT */ && slotIndex === 0) {
      if (isConnected) {
        // 当连接建立时，检查并更新状态
        Logger.debug('PixiImageNode', 'Texture input connected');
        if (this.widgets && this.widgets[8]) {
          this.widgets[8].value = "等待纹理输入...";
        }
        // 设置图表为脏，确保执行onExecute
        this.setDirtyCanvas(true, true);
      } else {
        // 当连接断开时，清除texture相关状态
        Logger.debug('PixiImageNode', 'Texture input disconnected');
        if (this.widgets && this.widgets[8]) {
          this.widgets[8].value = "无纹理输入";
        }
        // 如果有imageUrl，尝试使用它
        if (this.properties.imageUrl) {
          this.onExecute(); // 重新执行以从imageUrl加载
        } else if (this._sprite) {
          // 如果没有imageUrl，清除sprite
          this._sprite.texture = null;
          this._sprite.visible = false;
          this.setOutputData(0, null);
        }
      }
    }
  };

  // 输入连接验证
  PixiImageNode.prototype.onConnectInput = function(this: any, inputIndex: number, _outputType: string, _outputSlot: number, outputNode: any, _outputIndex: number) {
    if (inputIndex === 0) { // texture输入
      // 检查是否是TextureResourceNode
      if (outputNode.type === 'resource/texture') {
        // 检查TextureResourceNode的加载状态
        if (outputNode._loadState && outputNode._loadState !== 'LOADED' && outputNode._loadState !== 'Loaded') {
          Logger.warn('PixiImageNode', `拒绝连接: 纹理资源未加载完成 (状态: ${outputNode._loadState})`);
          return false; // 拒绝连接
        }
        
        // 检查纹理是否存在
        if (!outputNode._texture) {
          Logger.warn('PixiImageNode', '拒绝连接: 纹理资源不存在');
          return false; // 拒绝连接
        }
        
        // 我们不再检查texture.valid属性，因为它可能不准确
        // 只要有纹理对象且状态为LOADED，就允许连接
      }
    }
    return true; // 允许连接
  };

  // 注册节点类型
  LiteGraph.registerNodeType('render/image', PixiImageNode);
}
