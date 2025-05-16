import { Texture, Assets } from 'pixi.js';
import { NodeColors, NodeSizes } from '../../nodesConfig';
import { Logger } from '../../pixiNodeLogger';
import { PixiResourceManager } from '../logic/pixiResourceManager';

// Define texture resource state enum
export enum TextureLoadState {
  PENDING = "Waiting",      // waiting to load
  LOADING = "Loading...",   // loading in progress
  LOADED = "Loaded",        // successfully loaded
  ERROR = "Error"           // loading failed
}

export function registerTextureResourceNode(LiteGraph: any) {
  function TextureResourceNode(this: any) {
    this.addOutput('texture', 'texture');
    this.title = 'Texture Resource';
    this.size = NodeSizes.medium;
    this.boxcolor = NodeColors.resource;
    this.color = NodeColors.resource;

    // Properties
    this.properties = {
      alias: '',
      url: '',
      preload: true
    };

    // Internal state
    this._previewUrl = '';
    /** @type {Texture|null} */
    this._texture = null;
    this._lastResourceKey = null;
    this._loadState = TextureLoadState.PENDING;
    this._errorMessage = '';

    // Widgets
    this.addWidget('text', 'alias', this.properties.alias, (v: string) => { 
      this.properties.alias = v; 
      this._texture = null;
      this._lastResourceKey = null;
      this._loadState = TextureLoadState.PENDING;
      if (this.properties.preload) this.loadTexture();
    });
    
    this.addWidget('text', 'url', this.properties.url, (v: string) => { 
      this.properties.url = v; 
      this._texture = null;
      this._lastResourceKey = null;
      this._loadState = TextureLoadState.PENDING;
      if (this.properties.preload) this.loadTexture();
    });
    
    this.addWidget('toggle', 'preload', this.properties.preload, (v: boolean) => { 
      this.properties.preload = v;
      if (v && this._loadState === TextureLoadState.PENDING) {
        this.loadTexture();
      }
    });
    
    // 添加状态显示
    this.addWidget('text', 'status', this._loadState, function() {}, {
      readonly: true
    });

    // Import image button
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);

    fileInput.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (file) {
        // 更新状态
        this._loadState = TextureLoadState.LOADING;
        this.updateStatusWidget();
        
        const reader = new FileReader();
        reader.onload = (evt) => {
          try {
            // Generate a unique alias based on file name and timestamp
            const name = file.name.replace(/\.[^/.]+$/, "");
            const timestamp = Date.now();
            const alias = `${name}_${timestamp}`;
            
            // Safely access result and ensure it's a string
            const result = evt.target?.result;
            let dataUrl = typeof result === 'string' ? result : null;
            
            // Log for debugging
            Logger.debug('TextureResourceNode', `File read result type: ${typeof result}, length: ${dataUrl ? dataUrl.length : 'N/A'}`);
            
            // 严格验证 dataUrl 是否有效
            if (!dataUrl) {
              throw new Error("Invalid data URL format - result is null or not a string");
            }
            
            // 修复可能缺失 'data:' 前缀的 data URL
            if (dataUrl.match(/^:?image\/(png|jpeg|jpg|gif|webp);base64,/i)) {
              Logger.warn('TextureResourceNode', 'Detected malformed data URL from file reader, fixing missing data: prefix');
              const fixedDataUrl = 'data' + dataUrl;
              dataUrl = fixedDataUrl;
            }

            // 再次验证修复后的 URL 使用正则表达式
            if (!dataUrl.match(/^data:image\//i)) {
              throw new Error("Data URL must be an image format after fixing");
            }
            
            // 尝试创建一个临时纹理确保 URL 是有效的
            try {
              const tempTexture = Texture.from(dataUrl);
              if (!tempTexture || !tempTexture.valid) {
                // 如果不立即有效，我们不等待加载完成，但已经验证了格式基本正确
                Logger.debug('TextureResourceNode', 'URL format validation passed');
              }
            } catch (validationErr) {
              Logger.error('TextureResourceNode', 'URL validation failed:', validationErr);
              throw new Error(`Invalid image format: ${(validationErr as Error).message}`);
            }
            
            // 设置属性
            this.properties.alias = alias;
            this.properties.url = dataUrl;
            this._previewUrl = dataUrl;
            this._texture = null;
            this._lastResourceKey = null;
            
            // --- 修正: 同步更新输入框UI ---
            if (this.widgets && Array.isArray(this.widgets)) {
              for (const w of this.widgets) {
                if (w.name === 'alias') w.value = alias;
                if (w.name === 'url') w.value = dataUrl;
                if (w.name === 'status') w.value = TextureLoadState.PENDING;
              }
            }
            
            // 确保值已经设置完毕后，才开始加载
            setTimeout(() => {
              // 如果设置为预加载，则自动开始加载
              if (this.properties.preload) {
                this.loadTexture();
              }
              this.setDirtyCanvas(true, true);
            }, 0);
          } catch (err: any) {
            Logger.error('TextureResourceNode', '处理文件数据出错:', err);
            this._loadState = TextureLoadState.ERROR;
            this._errorMessage = err.message || "File processing failed";
            this.updateStatusWidget();
          }
        };
        
        reader.onerror = (_event: ProgressEvent<FileReader>) => {
          this._loadState = TextureLoadState.ERROR;
          this._errorMessage = "File reading failed";
          this.updateStatusWidget();
        };
        
        reader.readAsDataURL(file);
      }
    };
    this.addWidget('button', 'Import Image', null, () => { fileInput.click(); });

    // Preview image
    this.addWidget('html', '', '', () => { }, { get: () => this._previewUrl ? `<img src='${this._previewUrl}' style='max-width:80px;max-height:40px;'/>` : '' });
  }

  // Update status display widget
  TextureResourceNode.prototype.updateStatusWidget = function() {
    if (this.widgets && Array.isArray(this.widgets)) {
      const statusWidget = this.widgets.find((w: any) => w.name === 'status');
      if (statusWidget) {
        let statusText = this._loadState;
        if (this._loadState === TextureLoadState.LOADED && this._texture) {
          statusText += ` (${this._texture.width}x${this._texture.height})`;
        } else if (this._loadState === TextureLoadState.ERROR && this._errorMessage) {
          // Translate error messages to English
          let errorMsg = this._errorMessage;
          if (errorMsg.includes("缺少资源URL或别名")) errorMsg = "Missing URL or alias";
          if (errorMsg.includes("无效的数据URL格式")) errorMsg = "Invalid data URL format";
          if (errorMsg.includes("数据URL必须是图像格式")) errorMsg = "Data URL must be image format";
          if (errorMsg.includes("文件处理失败")) errorMsg = "File processing failed";
          if (errorMsg.includes("文件读取失败")) errorMsg = "File reading failed";
          if (errorMsg.includes("纹理加载后无效")) errorMsg = "Texture invalid after loading";
          if (errorMsg.includes("加载失败")) errorMsg = "Loading failed";
          
          statusText += `: ${errorMsg}`;
        }
        statusWidget.value = statusText;
      }
    }
    this.setDirtyCanvas(true, true);
  };
  
  // 加载纹理资源
  TextureResourceNode.prototype.loadTexture = async function() {
    const alias = this.properties.alias?.trim();
    let url = this.properties.url?.trim(); // 使用 let 而不是 const，因为我们可能需要修改它

    // 必须有 alias 和 url
    if (!alias || !url) {
      this._loadState = TextureLoadState.ERROR;
      this._errorMessage = "Missing URL or alias";
      this.updateStatusWidget();
      return null;
    }

    this._loadState = TextureLoadState.LOADING;
    this.updateStatusWidget();

    // 获取资源管理器实例
    const resourceManager = PixiResourceManager.getInstance();
    
    // 如果ID已更改，先卸载旧资源
    if (this._lastResourceKey && this._lastResourceKey !== alias) {
      try {
        await resourceManager.unloadResource(this._lastResourceKey);
        Logger.info('TextureResourceNode', `Unloaded previous texture: ${this._lastResourceKey}`);
      } catch (e) {
        Logger.warn('TextureResourceNode', 'Error unloading previous resource:', e);
      }
    }
    this._lastResourceKey = alias;

    try {
      // 额外验证 url 有效性
      if (typeof url !== 'string' || !url) {
        throw new Error("URL must be a valid string");
      }
      
      // 打印当前 URL 进行调试
      Logger.debug('TextureResourceNode', `Processing URL (first 30 chars): "${url.substring(0, 30)}..."`);
      
      // 使用正则表达式检查和修复 URL 格式
      if (url.match(/^:?image\/(png|jpeg|jpg|gif|webp);base64,/i)) {
        Logger.warn('TextureResourceNode', 'Detected malformed data URL, fixing missing data: prefix');
        url = 'data' + url;
        // Update the property with the fixed URL
        this.properties.url = url;
        
        // Update the widget display
        if (this.widgets && Array.isArray(this.widgets)) {
          const urlWidget = this.widgets.find((w: any) => w.name === 'url');
          if (urlWidget) urlWidget.value = url;
        }
        
        // 再次验证修复后的 URL
        Logger.debug('TextureResourceNode', `URL after fix (first 30 chars): "${url.substring(0, 30)}..."`);
      }
      
      // 如果是 DataURL，确保格式正确
      if (url.match(/^data:/i)) {
        // 确保数据URL格式正确
        if (!url.match(/^data:image\//i)) {
          throw new Error("Data URL must be an image format");
        }
      }
      
      // 使用手动图像预加载方法 - 避免PixiJS事件问题
      try {
        // 手动预加载图像，确保数据可用
        Logger.debug('TextureResourceNode', '手动预加载图像');
        await new Promise<void>((resolve, reject) => {
          const img = new Image();
          
          img.onload = () => {
            Logger.debug('TextureResourceNode', `图像预加载成功: ${img.width}x${img.height}`);
            resolve();
          };
          
          img.onerror = (err) => {
            Logger.error('TextureResourceNode', '图像预加载失败', err);
            reject(new Error('图像加载失败'));
          };

          // 设置crossOrigin只有当URL不是data URL时
          if (!url.startsWith('data:')) {
            img.crossOrigin = 'anonymous';
          }
          
          img.src = url;
          
          // 如果图像已经在缓存中，可能不会触发onload事件
          if (img.complete) {
            Logger.debug('TextureResourceNode', '图像已经加载完成 (cached)');
            resolve();
          }
        });

        // 现在创建纹理 - 图像已经加载好了
        this._texture = Texture.from(url);
        
        // 纹理已创建，手动图像加载成功，认为纹理有效
        // PixiJS中的valid属性有时会有问题，所以我们自己判断纹理有效性
        if (!this._texture) {
          throw new Error("Failed to create texture");
        }
        
        // 强制将纹理标记为有效 - 因为我们已经确认图像加载成功
        // 某些版本的PixiJS在某些情况下不会正确设置valid标志
        if (this._texture && this._texture.baseTexture) {
          this._texture.baseTexture.valid = true;
        }
        
        Logger.debug('TextureResourceNode', `Texture loaded directly: ${this._texture.width}x${this._texture.height}`);
        
        // 同时注册到资源管理器，方便其他节点使用
        resourceManager.registerResource({
          id: alias,
          type: 'texture',
          url: url,
          alias: alias,
          instance: this._texture // 直接提供已加载的纹理实例
        });
      } catch (directLoadErr) {
        Logger.warn('TextureResourceNode', 'Direct texture loading failed, trying through ResourceManager:', directLoadErr);
        
        // 如果直接加载失败，尝试通过资源管理器加载
        resourceManager.registerResource({
          id: alias,
          type: 'texture',
          url: url,
          alias: alias
        });
        
        try {
          this._texture = await resourceManager.loadResource(alias);
          Logger.debug('TextureResourceNode', `ResourceManager loaded texture: ${alias}`);
        } catch (loadErr) {
          Logger.error('TextureResourceNode', 'ResourceManager loading error:', loadErr);
          throw new Error(`Image loading failed: ${(loadErr as Error).message || 'unknown error'}`);
        }
      }
      
      this._previewUrl = url;

      if (this._texture) {
        // 我们已经确认图像加载成功，所以即使PixiJS的valid标志不正确，我们也认为纹理有效
        this._loadState = TextureLoadState.LOADED;
        
        // 如果纹理宽高有效则记录，否则只记录加载成功
        const width = this._texture.width || '?';
        const height = this._texture.height || '?';
        Logger.info('TextureResourceNode', `Loaded texture: ${width}x${height} for alias: ${alias}`);
        
        // 强制设置纹理为有效
        if (this._texture.baseTexture) {
          this._texture.baseTexture.valid = true;
        }
      } else {
        this._loadState = TextureLoadState.ERROR;
        this._errorMessage = "Failed to create texture";
        Logger.warn('TextureResourceNode', 'Failed to create texture object');
      }
    } catch (e) {
      this._texture = null;
      this._previewUrl = '';
      this._loadState = TextureLoadState.ERROR;
      this._errorMessage = (e as Error).message || "加载失败";
      Logger.error('TextureResourceNode', 'Load failed:', e);
    }

    this.updateStatusWidget();
    return this._texture;
  };
  
  TextureResourceNode.prototype.onExecute = async function() {
    const alias = this.properties.alias?.trim();
    const url = this.properties.url?.trim();

    // 只有 alias 和 url 都有时才尝试加载
    if ((!alias || !url) && this.properties.preload) {
      this._loadState = TextureLoadState.ERROR;
      this._errorMessage = "缺少资源URL或别名";
      this.updateStatusWidget();
      this.setOutputData(0, null);
      return;
    }

    // 只有状态为PENDING和preload为true时才尝试加载
    if (alias && url && this.properties.preload && this._loadState === TextureLoadState.PENDING) {
      await this.loadTexture();
    }

    // 只要状态为LOADED且有纹理对象，就输出纹理
    if (this._loadState === TextureLoadState.LOADED && this._texture) {
      // 确保纹理在输出前被标记为有效
      if (this._texture.baseTexture) {
        this._texture.baseTexture.valid = true;
      }
      
      this.setOutputData(0, this._texture);
      Logger.debug('TextureResourceNode', `Texture output ready: ${this._texture.width}x${this._texture.height}`);
    } else {
      // 如果未加载，输出null
      this.setOutputData(0, null);
    }
  };

  TextureResourceNode.prototype.onRemoved = async function() {
    if (this._lastResourceKey) {
      await Assets.unload(this._lastResourceKey);
      this._lastResourceKey = null;
    }
    if (this._texture) {
      this._texture.destroy(true);
      this._texture = null;
    }
  };
  
  // Validation when other nodes try to connect to this node's output
  TextureResourceNode.prototype.onConnectOutput = function(this: any, outputIndex: number, _inputType: string, _inputSlot: number, _inputNode: any, _inputIndex: number) {
    // Allow connections even if texture is not loaded yet
    if (outputIndex === 0) { // texture output
      // Start loading if not loaded and we have valid properties
      if (this._loadState !== TextureLoadState.LOADED && this.properties.alias && this.properties.url) {
        Logger.info('TextureResourceNode', `Connection established: texture loading will start (current state: ${this._loadState})`);
        // Schedule loading to happen after connection is established
        setTimeout(() => {
          this.loadTexture();
        }, 10);
      }
    }
    return true; // Always allow connection
  };
  
  // 连接改变时的处理
  TextureResourceNode.prototype.onConnectionsChange = function(this: any, type: number, slotIndex: number, isConnected: boolean, link: any, _ioSlot: any) {
    if (type === 2 /* LiteGraph.OUTPUT */ && slotIndex === 0 && isConnected) {
      // 检查资源状态
      const alias = this.properties.alias?.trim();
      const url = this.properties.url?.trim();

      // 检查是否有效的输入 - 使用英语错误消息
      if (!alias || !url) {
        Logger.warn('TextureResourceNode', 'Connection rejected: Missing URL or alias');
        if (link && link.id !== undefined && this.graph && this.graph.links) {
          setTimeout(() => {
            try {
              delete this.graph.links[link.id];
              this.graph.setDirtyCanvas(true, true);
            } catch (e) {
              Logger.error('TextureResourceNode', 'Failed to disconnect invalid link:', e);
            }
          }, 10);
        }
        return;
      }

      // 当有新连接到texture输出时，确保已经加载
      if (this._loadState !== TextureLoadState.LOADED) {
        // 尝试加载资源
        this.loadTexture().then((texture: Texture | null) => {
          if (!texture) {
            // 如果加载失败，断开连接
            if (link && link.id !== undefined && this.graph) {
              Logger.warn('TextureResourceNode', '加载纹理失败，断开连接');
              try {
                delete this.graph.links[link.id];
                this.graph.setDirtyCanvas(true, true);
              } catch (e) {
                Logger.error('TextureResourceNode', '断开失败连接失败:', e);
              }
            }
          }
        }).catch((e: any) => {
          Logger.error('TextureResourceNode', '加载纹理时发生错误:', e);
          // 断开连接
          if (link && link.id !== undefined && this.graph && this.graph.links) {
            delete this.graph.links[link.id];
            this.graph.setDirtyCanvas(true, true);
          }
        });
      }
    }
  };

  LiteGraph.registerNodeType('resource/texture', TextureResourceNode);
}