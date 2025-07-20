// PixiResourceManager: 全局资源管理服务，供各节点引入使用
// 用法：import { PixiResourceManager } from '../logic/pixiResourceManager';

import { Assets, Texture } from 'pixi.js';
import { Logger } from '../../pixiNodeLogger';

export class PixiResourceManager {
  static _instance: PixiResourceManager;
  static getInstance(): PixiResourceManager {
    if (!PixiResourceManager._instance) {
      PixiResourceManager._instance = new PixiResourceManager();
    }
    return PixiResourceManager._instance;
  }

  private _resources: Map<string, any> = new Map();

  /**
   * 注册资源（仅记录，不加载）
   */
  registerResource({ id, type, url, alias, metadata }: { id: string, type: string, url: string, alias?: string, metadata?: any }) {
    if (!id || !type || !url) return;
    if (this._resources.has(id)) return;
    this._resources.set(id, { id, type, url, alias, metadata, state: 'pending' });
  }

  /**
   * 加载资源
   * 支持多种资源类型，包括texture、audio和其他
   */
  async loadResource(id: string): Promise<any> {
    const res = this._resources.get(id);
    if (!res) throw new Error('Resource not registered: ' + id);
    if (res.state === 'loaded' && res.instance) return res.instance;
    
    // Already loading, wait for it to complete
    if (res.state === 'loading' && res.loadPromise) {
      return res.loadPromise;
    }
    
    // 记录更详细的资源信息
    if (res.type === 'texture') {
      Logger.debug('PixiResourceManager', `Loading texture resource: ${id}, URL (first 30 chars): "${res.url.substring(0, 30)}..."`);
    }
    
    res.state = 'loading';
    
    // Create a promise for loading
    res.loadPromise = new Promise(async (resolve, reject) => {
      try {
        Logger.debug('PixiResourceManager', `Loading resource ${id} (type: ${res.type})`);
        
        // Different handling based on resource type
        if (res.type === 'texture') {
          // Fix potentially malformed URLs - specifically for data URLs
          let url = res.url;
          
          // 详细打印 URL 进行调试
          Logger.debug('PixiResourceManager', `Original URL type: ${typeof url}, URL (first 30 chars): "${url?.substring?.(0, 30) || 'undefined/null'}..."`);
          
          // 使用正则表达式修复可能缺失 'data:' 前缀的 data URL
          if (typeof url === 'string' && url.match(/^:?image\/(png|jpeg|jpg|gif|webp);base64,/i)) {
            Logger.warn('PixiResourceManager', `Fixing malformed data URL for ${id}`);
            url = 'data' + url;
            res.url = url; // 更新存储的 URL
            Logger.debug('PixiResourceManager', `Fixed URL (first 30 chars): "${url.substring(0, 30)}..."`);
          }
          
          // 针对完全错误格式的 URL 进行额外检查，使用正则表达式
          if (typeof url === 'string' && !url.match(/^(data:|https?:|file:|blob:)/i)) {
            Logger.warn('PixiResourceManager', `URL format suspicious, may cause loading issues: ${id}`);
          }
          
          // 使用手动预加载图像方法，避开PixiJS纹理加载中的事件问题
          try {
            // 先手动加载图像，确保数据可用
            Logger.debug('PixiResourceManager', `Manual image preload for ${id}`);
            await new Promise<void>((resolveImg, rejectImg) => {
              const img = new Image();
              
              img.onload = () => {
                Logger.debug('PixiResourceManager', `Image preloaded successfully: ${img.width}x${img.height}`);
                resolveImg();
              };
              
              img.onerror = (err) => {
                Logger.error('PixiResourceManager', 'Image preload failed', err);
                rejectImg(new Error('Image loading failed'));
              };
              
              // 只有当不是data URL时才设置crossOrigin
              if (typeof url === 'string' && !url.startsWith('data:')) {
                img.crossOrigin = 'anonymous';
              }
              
              img.src = url;
              
              // 处理已缓存的情况
              if (img.complete) {
                Logger.debug('PixiResourceManager', 'Image already loaded (cached)');
                resolveImg();
              }
            });
            
            // 图像已加载好，现在创建纹理
            Logger.debug('PixiResourceManager', `Creating texture after image preload for ${id}`);
            res.instance = Texture.from(url);
            
            // 图像已确认加载成功，纹理应该有效
            if (!res.instance) {
              throw new Error("Failed to create texture");
            }
            
            // 强制将纹理标记为有效 - 因为我们已经确认图像加载成功
            if (res.instance.baseTexture) {
              res.instance.baseTexture.valid = true;
            }
            
            Logger.info('PixiResourceManager', `Successfully created texture directly: ${id}`);
          } catch (directLoadErr) {
            // 如果直接创建失败，回退到 Assets 系统
            Logger.warn('PixiResourceManager', `Direct texture creation failed for ${id}, trying Assets system:`, directLoadErr);
            
            try {
              // Register with PixiJS Assets system
              Assets.addBundle('editor', { 
                assets: { 
                  [res.alias || id]: { src: url, type: 'image' } 
                } 
              });
              
              res.instance = await Assets.load(res.alias || id);
            } catch (assetsLoadErr) {
              // If Assets.load fails too, use a more aggressive direct approach
              Logger.warn('PixiResourceManager', `Assets.load also failed for ${id}, trying one more direct approach`, assetsLoadErr);
              
              // 首先使用fetch获取blob
              const blob = await (await fetch(url)).blob();
              
              // 创建一个临时的objectURL用于加载
              const objectURL = URL.createObjectURL(blob);
              
              try {
                // 手动预加载图像
                await new Promise<void>((resolveImg, rejectImg) => {
                  const img = new Image();
                  img.onload = () => {
                    Logger.debug('PixiResourceManager', `Blob image loaded: ${img.width}x${img.height}`);
                    resolveImg();
                  };
                  img.onerror = (_err) => {
                    rejectImg(new Error('Blob image loading failed'));
                  };
                  img.src = objectURL;
                });
                
                // 现在创建纹理
                res.instance = Texture.from(objectURL);
                
                // 验证纹理是否有效（不再依赖事件）
                if (!res.instance.valid) {
                  Logger.warn('PixiResourceManager', `Texture from blob not immediately valid for ${id}`);
                }
              } finally {
                // 清理objectURL
                URL.revokeObjectURL(objectURL);
              }
            }
          }
        } 
        else if (res.type === 'audio') {
          // For audio, we just store the URL for later direct usage
          res.instance = res.url;
        } 
        else {
          // Default handling for other types
          Assets.addBundle('editor', { 
            assets: { 
              [res.alias || id]: { src: res.url, type: res.type } 
            } 
          });
          res.instance = await Assets.load(res.alias || id);
        }
        
        // Validate the loaded resource
        if (!res.instance) {
          throw new Error(`Failed to load resource: ${id} (empty result)`);
        }
        
        res.state = 'loaded';
        res.loadTime = Date.now();
        Logger.info('PixiResourceManager', `Successfully loaded resource: ${id} (type: ${res.type})`);
        
        resolve(res.instance);
      } catch (e) {
        res.state = 'error';
        res.error = e;
        Logger.error('PixiResourceManager', `Failed to load resource: ${id}`, e);
        reject(e);
      } finally {
        // Clear the promise reference
        delete res.loadPromise;
      }
    });
    
    return res.loadPromise;
  }

  /**
   * 获取资源实例
   * 支持各种资源类型的检索，包括特殊处理音频和纹理资源
   */
  getResource(id: string) {
    const res = this._resources.get(id);
    if (!res) {
      return null;
    }
    
    // Log resource state for debugging
    Logger.debug('PixiResourceManager', `Getting resource: ${id} (type: ${res.type}, state: ${res.state})`);
    
    // 如果资源存在且已加载，返回实例
    if (res.state === 'loaded' && res.instance) {
      return res.instance;
    }
    
    // 特殊处理不同类型的资源
    switch (res.type) {
      case 'audio':
        // 对于音频资源，即使没有加载也可以直接返回URL
        // 因为音频资源可以通过URL直接播放，不需要PixiJS Assets完整加载
        if (res.url) {
          Logger.debug('PixiResourceManager', `Returning audio URL for ${id}`);
          return res.url;
        }
        break;
        
      case 'texture':
        // 对于纹理，如果正在加载中，返回null
        if (res.state === 'loading') {
          Logger.debug('PixiResourceManager', `Texture ${id} is still loading`);
          return null;
        }
        
        // 如果纹理加载失败但有URL，可以尝试临时创建一个纹理（不推荐，但提供兜底方案）
        if (res.state === 'error' && res.url) {
          Logger.warn('PixiResourceManager', `Texture ${id} failed to load, attempting fallback`);
          try {
            return Texture.from(res.url);
          } catch (e) {
            Logger.error('PixiResourceManager', `Fallback for texture ${id} failed:`, e);
          }
        }
        break;
        
      default:
        // 对于其他类型，遵循正常的加载状态处理
        if (res.state === 'error') {
          Logger.warn('PixiResourceManager', `Resource ${id} is in error state`);
        } else if (res.state === 'loading') {
          Logger.debug('PixiResourceManager', `Resource ${id} is still loading`);
        } else if (res.state === 'pending') {
          Logger.debug('PixiResourceManager', `Resource ${id} is pending load`);
        }
    }
    
    return null;
  }

  /**
   * 卸载资源
   * 根据不同的资源类型执行相应的清理操作
   */
  async unloadResource(id: string) {
    const res = this._resources.get(id);
    if (!res) return;
    
    Logger.debug('PixiResourceManager', `Unloading resource: ${id} (type: ${res.type})`);
    
    // If resource is currently loading, wait for it to finish
    if (res.state === 'loading' && res.loadPromise) {
      try {
        await res.loadPromise;
      } catch (e) {
        // Ignore loading errors, we're going to unload anyway
      }
    }
    
    try {
      // Different cleanup based on resource type
      if (res.type === 'texture') {
        try {
          // Try to unregister from Assets system
          await Assets.unload(res.alias || id);
        } catch (assetErr) {
          Logger.warn('PixiResourceManager', `Assets.unload failed for ${id}:`, assetErr);
          // Continue with cleanup even if Assets.unload fails
        }
        
        // Additional texture-specific cleanup
        if (res.instance && typeof res.instance.destroy === 'function') {
          res.instance.destroy(true);
        }
      } 
      else if (res.type === 'audio') {
        // For audio resources, we don't need special cleanup
      }
      else {
        // Default handling for other types
        try {
          await Assets.unload(res.alias || id);
        } catch (err) {
          Logger.warn('PixiResourceManager', `Failed to unload asset ${id}:`, err);
        }
      }
      
      // Reset resource state
      res.state = 'pending';
      res.instance = null;
      delete res.loadPromise;
      delete res.error;
      
      Logger.info('PixiResourceManager', `Resource unloaded: ${id}`);
    } catch (e) {
      Logger.warn('PixiResourceManager', `Failed to unload resource: ${id}`, e);
    }
  }

  /**
   * 导出资源清单（JSON）
   */
  exportManifest() {
    const manifest: any = {};
    this._resources.forEach((res, id) => {
      manifest[id] = {
        type: res.type,
        url: res.url,
        alias: res.alias,
        metadata: res.metadata
      };
    });
    return manifest;
  }

  /**
   * 获取所有资源ID
   */
  getAllResourceIds(): string[] {
    return Array.from(this._resources.keys());
  }
}
