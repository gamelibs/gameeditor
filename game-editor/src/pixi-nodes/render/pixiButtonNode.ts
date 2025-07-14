// PixiButtonNode: 可接收音频资源别名，点击时播放音频，显示为灰色按钮
import { Graphics, Text, Container, Sprite, Texture } from 'pixi.js';
import { NodeColors } from '../../nodesConfig';
import { Logger } from '../../pixiNodeLogger';
import { PixiResourceManager } from '../logic/pixiResourceManager';

export function registerPixiButtonNode(LiteGraph: any) {
  function PixiButtonNode(this: any) {
    this.title = 'Button';
    this.size = [180, 320]; // 设置更大的高度以容纳所有控件
    this.boxcolor = NodeColors.render;
    this.color = NodeColors.render;
    this.resizable = false;

    // 添加节点初始化日志
    console.log('PixiButtonNode 初始化');
    Logger.info('PixiButtonNode', '创建新按钮节点');
    
    // Add debug info showing registered node types in Pixi
    if (LiteGraph && LiteGraph.registered_node_types) {
      const nodeTypes = Object.keys(LiteGraph.registered_node_types);
      const renderNodes = nodeTypes.filter(type => type.startsWith('render/'));
      Logger.info('PixiButtonNode', `Available render nodes: ${renderNodes.join(', ')}`);
      Logger.info('PixiButtonNode', `Button input ports will accept: pixi_display_object`);
    }

    // 属性
    this.properties = {
      x: 100,
      y: 100,
      w: 100,
      h: 60,
      label: 'Button',
      audioAlias: '',
      imageUrl: '',      // 图片URL
      autoPlayAudio: true, // 点击时自动播放音频
      clickScale: 0.95    // 点击缩放效果幅度
    };

    this._container = null;
    this._rect = null;
    this._text = null;
    this._bgSprite = null;
    this._lastAudioAlias = '';
    this._originalImageWidth = 0;
    this._originalImageHeight = 0;
    this._actionTriggered = false; // 事件触发状态

    // 输入端口
    this.addInput('audio', 'audio_resource'); 
    this.addInput('texture', 'pixi_display_object'); // Match the type with ImageNode's output
    
    // 设置选项
    this.addWidget('text', 'label', this.properties.label, (v: string) => { this.properties.label = v; this.updateButton(); });
    this.addWidget('number', 'x', this.properties.x, (v: number) => { this.properties.x = v; this.updateButton(); });
    this.addWidget('number', 'y', this.properties.y, (v: number) => { this.properties.y = v; this.updateButton(); });
    this.addWidget('number', 'w', this.properties.w, (v: number) => { this.properties.w = v; this.updateButton(); });
    this.addWidget('number', 'h', this.properties.h, (v: number) => { this.properties.h = v; this.updateButton(); });
    this.addWidget('toggle', 'autoPlayAudio', this.properties.autoPlayAudio, (v: boolean) => { this.properties.autoPlayAudio = v; });
    
    // 输出端口
    this.addOutput('button', 'pixi_display_object'); // 渲染对象输出
    this.addOutput('click', 'event'); // 点击事件输出
  }


  PixiButtonNode.prototype.onExecute = function() {
    // 诊断：仅在开发模式下每10秒检查一次连接状态
    const now = Date.now();
    const DIAGNOSTIC_INTERVAL = 10000; // 10秒
    const ENABLE_DIAGNOSTICS = false;  // 设置为true启用诊断日志

    if (ENABLE_DIAGNOSTICS && (!this._lastDiagnosticTime || now - this._lastDiagnosticTime > DIAGNOSTIC_INTERVAL)) {
      this._lastDiagnosticTime = now;
      
      // 检查连接状态
      if (this.outputs && this.outputs.length > 1) {
        const clickOutput = this.outputs[1]; // 索引1是click输出
        if (clickOutput) {
          const hasConnections = clickOutput.links && clickOutput.links.length > 0;
          console.log(`🔍 Button节点(${this.id})连接诊断:`, 
            hasConnections ? '✅ click输出已连接' : '❌ click输出未连接'
          );
        }
      }
    }
    
    // 获取音频别名输入
    const audioAlias = this.getInputData(0);
    if (audioAlias && audioAlias !== this._lastAudioAlias) {
      this.properties.audioAlias = audioAlias;
      this._lastAudioAlias = audioAlias;
    }

    // 获取图像资源输入 - 处理从ImageNode传来的对象
    const imageResource = this.getInputData(1);
    if (imageResource) {
      Logger.info('PixiButtonNode', `Received image input of type: ${imageResource.constructor ? imageResource.constructor.name : typeof imageResource}`);
      
      // Handle different types of image resources
      if (imageResource instanceof Sprite || 
          (imageResource && typeof imageResource === 'object' && 'texture' in imageResource)) {
        // Handle Sprite directly from ImageNode
        if (!this._bgSprite || this._bgSprite !== imageResource) {
          Logger.info('PixiButtonNode', `Received sprite from ImageNode`);
          if (this._bgSprite && this._bgSprite.parent === this._container) {
            this._container.removeChild(this._bgSprite);
          }
          
          // Clone the sprite properties but don't use the actual sprite
          // to avoid parent/child conflicts
          if (!this._bgSprite) {
            this._bgSprite = new Sprite(imageResource.texture);
          } else {
            this._bgSprite.texture = imageResource.texture;
          }
          
          this._container.addChildAt(this._bgSprite, 0);
          
          // Set dimensions based on the texture
          if (imageResource.texture) {
            this.properties.w = imageResource.texture.width || this.properties.w;
            this.properties.h = imageResource.texture.height || this.properties.h;
          }
          
          this._bgSprite.width = this.properties.w;
          this._bgSprite.height = this.properties.h;
          
          // Hide background rectangle
          if (this._rect) this._rect.visible = false;
          
          // Update text position
          if (this._text) {
            this._text.x = this.properties.w / 2;
            this._text.y = this.properties.h / 2;
          }
        }
      } else if (imageResource instanceof Texture) {
        // Handle direct texture input
        if (!this._bgSprite || this._bgSprite.texture !== imageResource) {
          Logger.info('PixiButtonNode', `Received texture object`);
          if (this._bgSprite && this._bgSprite.parent === this._container) {
            this._container.removeChild(this._bgSprite);
            this._bgSprite.destroy();
          }
          
          this._bgSprite = new Sprite(imageResource);
          this._container.addChildAt(this._bgSprite, 0);
          
          // Set dimensions
          this.properties.w = imageResource.width || this.properties.w;
          this.properties.h = imageResource.height || this.properties.h;
          this._bgSprite.width = this.properties.w;
          this._bgSprite.height = this.properties.h;
          
          // Hide background rectangle
          if (this._rect) this._rect.visible = false;
          
          // Update text position
          if (this._text) {
            this._text.x = this.properties.w / 2;
            this._text.y = this.properties.h / 2;
          }
        }
      } else if (imageResource.url && imageResource.url !== this.properties.imageUrl) {
        // Handle object with URL (backward compatibility)
        this.properties.imageUrl = imageResource.url;
        Logger.info('PixiButtonNode', `Received new image URL: ${imageResource.url}`);
      }
    }
    
    // 创建或更新按钮
    if (!this._container) {
      this._container = new Container();
      // Pixi v7+ 使用 eventMode 代替 interactive 和 buttonMode
      this._container.eventMode = 'static'; // 启用交互
      this._container.cursor = 'pointer';   // 设置鼠标指针样式
      this._container.x = this.properties.x;
      this._container.y = this.properties.y;
      // 背景rect
      this._rect = new Graphics();
      this._container.addChild(this._rect);
      // 背景图片
      this._bgSprite = null;
      // 文本
      this._text = new Text(this.properties.label, {fontSize: 20, fill: 0xffffff, align: 'center'});
      this._text.anchor.set(0.5);
      this._container.addChild(this._text);
      
      // 事件处理 - 使用多个事件确保捕获点击
      this._container.on('pointerdown', () => {
        Logger.info('PixiButtonNode', '🖱️ 按钮被按下 - Button pressed!');
        
        // 按下时的缩放效果
        const scale = this.properties.clickScale || 0.95;
        this._container.scale.set(scale);
      });

      this._container.on('pointerup', () => {
        // 恢复原始大小
        this._container.scale.set(1.0);
      });
      
      this._container.on('pointerupoutside', () => {
        // 确保指针在按钮外释放时也能恢复大小
        this._container.scale.set(1.0);
      });
      
      this._container.on('pointertap', () => {
        Logger.info('PixiButtonNode', '🖱️ 按钮被点击(pointertap) - Button tapped!');
        
        // 改变按钮颜色（视觉反馈）
        this.currentColorIndex = (this.currentColorIndex + 1) % this.colors.length;
        if (this._rect) {
          this._rect.clear();
          this._rect.beginFill(this.colors[this.currentColorIndex], 1);
          this._rect.drawRoundedRect(0, 0, this.properties.w, this.properties.h, 12);
          this._rect.endFill();
          
          // 如果没有背景图片，确保矩形可见
          if (!this._bgSprite || !this._bgSprite.visible) {
            this._rect.visible = true;
          }
        }
        
        // 根据设置自动播放音频
        if (this.properties.autoPlayAudio) {
          this.playAudio();
        }
        
        // 触发点击事件输出
        this._actionTriggered = true;
        Logger.info('PixiButtonNode', '📤 触发点击事件输出 - Event triggered');
        
        try {
          // 直接检查连接状态
          if (this.outputs && this.outputs.length > 1) {
            const output = this.outputs[1];
            if (output && output.links && output.links.length > 0) {
              console.log('🔗 该输出端口有连接:', output.links);
            } else {
              console.log('❌ 该输出端口没有连接!');
            }
          }
          
          const eventData = { 
            buttonId: this.id, 
            timestamp: Date.now(),
            position: { x: this.properties.x, y: this.properties.y },
            type: "click", // 添加明确的事件类型
            label: this.properties.label // 添加按钮标签，方便识别
          };
          
          // 使用两种方式触发事件，确保事件能被正确处理
          // 1. 通过trigger方法传递事件名称
          this.trigger("click", eventData);
          
          // 2. 直接使用triggerSlot，适用于LiteGraph的事件系统
          this.triggerSlot(1, eventData);
          
        } catch (err: any) {
          console.error('❌ 触发事件时出错:', err);
        }
      });
    }
    
    // 处理图像加载
    if (this.properties.imageUrl && (!this._bgSprite || this._bgSprite.texture.baseTexture?.resource?.url !== this.properties.imageUrl)) {
      const tempImg = new Image();
      tempImg.onload = () => {
        // 保存原始尺寸
        this._originalImageWidth = tempImg.width;
        this._originalImageHeight = tempImg.height;
        
        // 设置按钮大小为图片大小
        this.properties.w = tempImg.width;
        this.properties.h = tempImg.height;
        
        // 更新UI中显示的尺寸值
        const widgetsArray = this.widgets;
        for (let i = 0; i < widgetsArray.length; ++i) {
          if (widgetsArray[i].name === "w") {
            widgetsArray[i].value = this.properties.w;
          }
          else if (widgetsArray[i].name === "h") {
            widgetsArray[i].value = this.properties.h;
          }
        }
        
        // 使用辅助方法创建精灵
        this._createSpriteFromImage(tempImg);
        
        // 如果存在rect，删除它
        if (this._rect) {
          this._container.removeChild(this._rect);
          this._rect.destroy();
          this._rect = null;
        }
      };
      tempImg.onerror = () => {
        Logger.error('PixiButtonNode', 'Failed to load image');
      };
      tempImg.src = this.properties.imageUrl;
    }
    
    // 更新按钮外观
    this.updateButton();
    
    // 确保交互性设置正确
    if (this._container) {
      if (this._container.eventMode !== 'static') {
        this._container.eventMode = 'static';
        this._container.cursor = 'pointer';
        Logger.info('PixiButtonNode', '修复了交互性设置');
      }
    }
    
    // 设置输出
    this.setOutputData(0, this._container);
    
    // 重置事件触发状态
    this._actionTriggered = false;
  };

  // 为Button增加一些颜色属性
  PixiButtonNode.prototype.colors = [0x888888, 0x666666, 0xAA5555, 0x55AA55, 0x5555AA];
  PixiButtonNode.prototype.currentColorIndex = 0;
  
  // Helper method to unlock audio on browsers with autoplay restrictions
  PixiButtonNode.prototype._unlockAudio = function(audioElement: HTMLAudioElement) {
    try {
      // Create a silent audio buffer for unlocking audio playback
      const silentAudio = new Audio("data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA//tUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABBwBmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZm//sUZAAP8AAAaQAAAAgAAA0gAAABAAABpAAAACAAADSAAAAETEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV");
      silentAudio.loop = true;
      silentAudio.volume = 0;
      const silentPromise = silentAudio.play();
      
      if (silentPromise !== undefined) {
        silentPromise
          .then(() => {
            Logger.info('PixiButtonNode', 'Audio context unlocked');
            silentAudio.pause();
            silentAudio.remove();
            
            // Try playing the actual audio again
            if (audioElement) {
              audioElement.currentTime = 0;
              audioElement.play()
                .then(() => Logger.info('PixiButtonNode', 'Audio playback successful after unlock'))
                .catch(err => Logger.error('PixiButtonNode', `Audio still failed after unlock: ${err.message}`));
            }
          })
          .catch(err => {
            Logger.error('PixiButtonNode', `Failed to unlock audio: ${err.message}`);
          });
      }
    } catch (err) {
      Logger.error('PixiButtonNode', `Error in _unlockAudio: ${err}`);
    }
  };

  // 新增播放音频方法，方便重用
  PixiButtonNode.prototype.playAudio = function() {
    if (this.properties.audioAlias) {
      Logger.info('PixiButtonNode', `Attempting to play audio: ${this.properties.audioAlias}`);
      
      // 获取资源管理器中的资源
      const resourceManager = PixiResourceManager.getInstance();
      const res = resourceManager.getResource(this.properties.audioAlias);
      
      // 检查资源是否存在并打印详细信息用于调试
      if (res) {
        // 直接处理资源对象或URL
        let audioUrl = '';
        if (typeof res === 'string') {
          audioUrl = res;
        } else if (res.url) {
          audioUrl = res.url;
        }
        
        if (audioUrl) {
          try {
            Logger.info('PixiButtonNode', `Found audio resource URL: ${audioUrl.substring(0, 30)}...`);
            const audio = new Audio(audioUrl);
            
            // 添加错误处理
            audio.onerror = (err) => {
              Logger.error('PixiButtonNode', `Audio playback error: ${err}`);
            };
            
            // 添加结束事件以确保音频元素正确垃圾回收
            audio.onended = () => {
              Logger.info('PixiButtonNode', `Audio playback complete`);
              audio.onerror = null;
              audio.onended = null;
              audio.src = '';
              audio.remove();
            };
            
            // 直接设置autoplay属性确保会播放
            audio.autoplay = true;
            audio.currentTime = 0;
            const playPromise = audio.play();
            
            if (playPromise !== undefined) {
              playPromise
                .then(() => {
                  Logger.info('PixiButtonNode', `🔊 Audio played successfully: ${this.properties.audioAlias}`);
                })
                .catch(err => {
                  Logger.error('PixiButtonNode', `Failed to play audio: ${err.message}, attempting autoplay unlock...`);
                  // 尝试通过用户交互解锁音频
                  this._unlockAudio(audio);
                });
            }
          } catch (err: any) {
            Logger.error('PixiButtonNode', `Error creating audio element: ${err.message}`);
          }
        } else {
          Logger.warn('PixiButtonNode', `Audio resource found but no URL: ${this.properties.audioAlias}`);
        }
      } else {
        Logger.warn('PixiButtonNode', `Audio resource not found: ${this.properties.audioAlias}`);
      }
    } else {
      Logger.info('PixiButtonNode', '没有设置音频资源，跳过音频播放');
    }
  };
  
  // 处理接收到的动作
  PixiButtonNode.prototype.onAction = function(action: string) {
    if (action === "playAudio") {
      // 通过事件触发音频播放
      this.playAudio();
    } else if (action === "click") {
      // 模拟点击效果
      if (this._container) {
        this._container.scale.set(this.properties.clickScale || 0.95);
        setTimeout(() => {
          if (this._container) this._container.scale.set(1.0);
        }, 100);
      }
      this.playAudio();
    }
  };
  
  PixiButtonNode.prototype.updateButton = function() {
    if (!this._container || !this._rect || !this._text) return;
    // 更新位置和大小
    this._container.x = this.properties.x;
    this._container.y = this.properties.y;

    // 背景图片处理
    if (this.properties.imageUrl) {
      // 如果没有bgSprite或图片变了，重新创建
      let needNewSprite = !this._bgSprite;
      
      // 如果已经有精灵，检查URL是否改变
      if (this._bgSprite && this._bgSprite.texture) {
        try {
          const currentUrl = this._bgSprite.texture.baseTexture?.resource?.url;
          if (currentUrl !== this.properties.imageUrl) {
            needNewSprite = true;
          }
        } catch (err: any) {
          // 如果访问属性出错，就认为需要重新创建
          needNewSprite = true;
          Logger.warn('PixiButtonNode', `Error checking sprite texture: ${err.message}`);
        }
      }
      
      if (needNewSprite) {
        if (this._bgSprite) {
          this._container.removeChild(this._bgSprite);
          this._bgSprite.destroy();
          this._bgSprite = null;
        }
        // Use the already imported Sprite and Texture components
        try {
          Logger.info('PixiButtonNode', `Creating texture from: ${this.properties.imageUrl.substring(0, 50)}...`);
          
          // 先创建一个临时图像元素，确保图像可以加载
          const tempImg = new Image();
          tempImg.onload = () => {
            try {
              // 保存原始尺寸信息
              this._originalImageWidth = tempImg.width;
              this._originalImageHeight = tempImg.height;
              
              // 更新imageUrl组件中显示的值
              const shortUrl = `Image: ${tempImg.width}x${tempImg.height}`;
              const widgetsList = this.widgets;              
              for (let i = 0; i < widgetsList.length; ++i) {
                if (widgetsList[i].name === "imageUrl") {
                  widgetsList[i].value = shortUrl;
                  break;
                }
              }

              // 设置按钮大小为图片大小
              this.properties.w = tempImg.width;
              this.properties.h = tempImg.height;
              
              // 更新UI中显示的尺寸值
              for (let i = 0; i < widgetsList.length; ++i) {
                if (widgetsList[i].name === "w") {
                  widgetsList[i].value = this.properties.w;
                }
                else if (widgetsList[i].name === "h") {
                  widgetsList[i].value = this.properties.h;
                }
              }
              
              // 使用我们的辅助方法创建精灵
              const success = this._createSpriteFromImage(tempImg);
              
              // 如果存在rect，删除它
              if (success && this._rect) {
                this._container.removeChild(this._rect);
                this._rect.destroy();
                this._rect = null;
                Logger.info('PixiButtonNode', `Rect removed, sprite created successfully (${tempImg.width}x${tempImg.height})`);
              }
            } catch (innerErr: any) {
              Logger.error('PixiButtonNode', `Error creating sprite from loaded image: ${innerErr.message}`);
              // 确保背景矩形可见
              this._rect.visible = true;
            }
          };
          
          tempImg.onerror = () => {
            Logger.error('PixiButtonNode', `Failed to load image from URL`);
            this._rect.visible = true;
          };
          
          // 开始加载图像
          tempImg.src = this.properties.imageUrl;
          
        } catch (err: any) {
          Logger.error('PixiButtonNode', `Error setting up image loading: ${err.message}`);
          // 确保矩形可见作为后备方案
          this._rect.visible = true;
        }
      }
      
      // 如果精灵存在，更新其属性
      if (this._bgSprite) {
        this._bgSprite.width = this.properties.w;
        this._bgSprite.height = this.properties.h;
        this._bgSprite.visible = true;
        this._rect.visible = false;
      } else {
        // 如果精灵不存在，显示默认矩形
        this._rect.visible = true;
      }
    } else {
      // 没有图片，显示矩形
      if (this._bgSprite) {
        this._container.removeChild(this._bgSprite);
        this._bgSprite.destroy();
        this._bgSprite = null;
      }
      this._rect.visible = true;
      this._rect.clear();
      this._rect.beginFill(this.colors[this.currentColorIndex], 1);
      this._rect.drawRoundedRect(0, 0, this.properties.w, this.properties.h, 12);
      this._rect.endFill();
    }
    // 更新文本
    this._text.text = this.properties.label;
    this._text.x = this.properties.w / 2;
    this._text.y = this.properties.h / 2;
  };

  PixiButtonNode.prototype._createSpriteFromImage = function(image: HTMLImageElement) {
    // 确保容器已创建
    if (!this._container) {
      return;
    }

    try {
      // 如果已存在精灵，先移除它
      if (this._bgSprite) {
        this._container.removeChild(this._bgSprite);
        this._bgSprite.destroy();
        this._bgSprite = null;
      }
      
      // 从图像创建纹理和精灵
      const texture = Texture.from(image);
      this._bgSprite = new Sprite(texture);
      
      // 添加到容器
      this._container.addChildAt(this._bgSprite, 0);
      
      // 设置精灵尺寸
      this._bgSprite.width = this.properties.w;
      this._bgSprite.height = this.properties.h;
      
      // 显示精灵，隐藏背景矩形
      this._bgSprite.visible = true;
      if (this._rect) {
        this._rect.visible = false;
      }
      
      // 更新文本位置
      if (this._text) {
        this._text.x = this.properties.w / 2;
        this._text.y = this.properties.h / 2;
      }
      
      Logger.info('PixiButtonNode', `Successfully created sprite from image (${image.width}x${image.height})`);
      return true;
    } catch (err: any) {
      Logger.error('PixiButtonNode', `Error creating sprite from image: ${err.message}`);
      // 确保矩形可见作为备用
      if (this._rect) {
        this._rect.visible = true;
      }
      return false;
    }
  };

  PixiButtonNode.prototype.onRemoved = function() {
    if (this._container) {
      this._container.removeChildren();
      this._container.destroy({children: true});
      this._container = null;
      this._rect = null;
      this._text = null;
      if (this._bgSprite) {
        this._bgSprite.destroy();
        this._bgSprite = null;
      }
    }
  };

  LiteGraph.registerNodeType('render/button', PixiButtonNode);
}
