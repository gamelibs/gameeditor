// PixiAudioNode: 支持mp3导入、试听、统一资源管理的音频节点
import { NodeColors, NodeSizes } from '../../nodesConfig';
import { Logger } from '../../pixiNodeLogger';
import { PixiResourceManager } from '../logic/pixiResourceManager';

export function registerAudioResourceNode(LiteGraph: any) {
  function AudioResourceNode(this: any) {
    this.title = 'Audio Resource (mp3)';
    this.size = NodeSizes.medium;
    this.boxcolor = NodeColors.resource;
    this.color = NodeColors.resource;
    this.resizable = false;

    // 属性
    this.properties = {
      audioUrl: '',
      alias: '',
      preload: true
    };

    this._audioId = null;
    this._audioInstance = null;
    this._audioElement = null;
    this._loadState = 'pending';
    this._errorMessage = '';

    // 导入音频按钮
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'audio/mp3';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);

    fileInput.onchange = (e) => {
      const target = e.target;
      const file = target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          const dataUrl = evt.target?.result;
          // 修正：MP3文件的DataURL可能是data:audio/mpeg或data:audio/mp3开头
          if (typeof dataUrl !== 'string' || 
              (!dataUrl.startsWith('data:audio/mp3') && 
               !dataUrl.startsWith('data:audio/mpeg'))) {
            this._loadState = 'error';
            this._errorMessage = '只支持mp3格式';
            this.updateStatusWidget();
            Logger.error('AudioResourceNode', '不支持的文件格式:', dataUrl?.substring(0, 30) + '...');
            return;
          }
          
          // 先清理旧的音频资源
          this.cleanupAudio();
          
          // 生成唯一ID
          const alias = file.name.replace(/\.[^/.]+$/, '') + '_' + Date.now();
          this.properties.audioUrl = dataUrl;
          this.properties.alias = alias;
          this._audioId = alias;
          this._loadState = 'pending';
          this._errorMessage = '';
          this.updateStatusWidget();
          this.registerAndLoadAudio();
        };
        reader.onerror = () => {
          this._loadState = 'error';
          this._errorMessage = '文件读取失败';
          this.updateStatusWidget();
        };
        reader.readAsDataURL(file);
      }
    };
    this.addWidget('button', 'Import mp3', null, () => fileInput.click());
    this.addWidget('text', 'alias', this.properties.alias, (v) => { this.properties.alias = v; });
    this.addWidget('text', 'audioUrl', this.properties.audioUrl, (v) => { this.properties.audioUrl = v; });
    this.addWidget('toggle', 'preload', this.properties.preload, (v) => { this.properties.preload = v; });
    this.addWidget('text', 'status', this._loadState, () => {}, { readonly: true });
    // 试听按钮
    this.addWidget('button', 'play', null, () => this.playAudio());
    this.addWidget('button', 'stop', null, () => this.stopAudio());
    // 试听区
    this.addWidget('html', '', '', () => {}, {
      get: () => this._audioElement ? `<audio src='${this._audioElement.src}' controls style='width:140px'></audio>` : ''
    });
    this.addOutput('audio', 'audio_resource');
  }

  AudioResourceNode.prototype.updateStatusWidget = function() {
    if (this.widgets && Array.isArray(this.widgets)) {
      const statusWidget = this.widgets.find(w => w.name === 'status');
      if (statusWidget) {
        let statusText = this._loadState;
        if (this._loadState === 'error' && this._errorMessage) {
          statusText += `: ${this._errorMessage}`;
        }
        statusWidget.value = statusText;
      }
    }
    this.setDirtyCanvas(true, true);
  };

  AudioResourceNode.prototype.registerAndLoadAudio = async function() {
    if (!this.properties.audioUrl || !this.properties.alias) return;
    
    const id = this.properties.alias;
    
    // 更详细的日志，帮助调试
    Logger.info('AudioResourceNode', `注册音频资源: id=${id}, url=${this.properties.audioUrl.substring(0, 30)}...`);
    
    // 创建资源对象，确保状态字段的初始值是 'loading'
    const resourceObj = {
      id,
      type: 'audio',
      url: this.properties.audioUrl,
      alias: this.properties.alias,
      state: 'loading'  // 确保状态字段存在并设置为 'loading'
    };
    
    // 注册资源
    PixiResourceManager.getInstance().registerResource(resourceObj);
    
    try {
      this._loadState = 'loading';
      this.updateStatusWidget();
      
      // 创建Audio对象并设置预加载
      this._audioElement = new Audio(this.properties.audioUrl);
      this._audioElement.preload = 'auto';
      
      // 添加加载事件监听器以确认文件是否真正加载成功
      this._audioElement.addEventListener('canplaythrough', () => {
        Logger.info('AudioResourceNode', `音频加载完成: ${this.properties.alias}`);
        
        // 更新资源管理器中的资源状态
        const res = PixiResourceManager.getInstance()._resources.get(id);
        if (res) {
          res.state = 'loaded';
          res.instance = { 
            url: this.properties.audioUrl,
            audioElement: this._audioElement,
            type: 'audio'
          };
        }
        
        this._loadState = 'loaded';
        this.updateStatusWidget();
      });
      
      this._audioElement.addEventListener('error', (e) => {
        Logger.error('AudioResourceNode', `音频加载失败: ${e.message || '未知错误'}`);
        
        // 更新资源管理器中的资源状态
        const res = PixiResourceManager.getInstance()._resources.get(id);
        if (res) {
          res.state = 'error';
          res.error = e.message || '未知错误';
        }
        
        this._loadState = 'error';
        this._errorMessage = '音频加载失败';
        this.updateStatusWidget();
      });
      
      // 手动触发加载
      this._audioElement.load();
      
      // 预先标记为已加载状态，但可能被错误事件覆盖
      this._loadState = 'loaded';
      
      // 确保资源管理器中的资源状态也标记为已加载
      const res = PixiResourceManager.getInstance()._resources.get(id);
      if (res) {
        res.state = 'loaded';
        res.instance = { 
          url: this.properties.audioUrl,
          audioElement: this._audioElement,
          type: 'audio'
        };
      }
      
      this.updateStatusWidget();
    } catch (e) {
      Logger.error('AudioResourceNode', `音频加载异常: ${e.message}`);
      this._loadState = 'error';
      this._errorMessage = e.message || '加载失败';
      
      // 更新资源管理器中的资源状态
      const res = PixiResourceManager.getInstance()._resources.get(id);
      if (res) {
        res.state = 'error';
        res.error = e.message || '加载失败';
      }
      
      this.updateStatusWidget();
    }
  };

  AudioResourceNode.prototype.playAudio = function() {
    if (!this._audioElement) {
      if (this.properties.audioUrl) {
        Logger.info('AudioResourceNode', '重新创建音频元素');
        this._audioElement = new Audio(this.properties.audioUrl);
      } else {
        this._errorMessage = '无音频可播放';
        this._loadState = 'error';
        this.updateStatusWidget();
        return;
      }
    }
    
    try {
      // 重置播放位置
      this._audioElement.currentTime = 0;
      
      // 尝试播放并处理Promise
      const playPromise = this._audioElement.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            Logger.info('AudioResourceNode', `🔊 音频播放成功: ${this.properties.alias || '未命名'}`);
          })
          .catch(err => {
            Logger.error('AudioResourceNode', `音频播放失败: ${err.message}`);
            
            // 尝试通过用户交互解锁音频
            this._unlockAudio();
          });
      }
    } catch (err) {
      Logger.error('AudioResourceNode', `音频播放出错: ${err.message}`);
    }
    
    Logger.debug('AudioResourceNode', `尝试播放音频: ${this.properties.alias || '未命名'}`);
  };
  
  // 解锁音频播放（处理浏览器自动播放策略限制）
  AudioResourceNode.prototype._unlockAudio = function() {
    Logger.info('AudioResourceNode', `尝试解锁音频播放...`);
    
    // 创建一个空的、短时的静音音频元素并尝试播放它
    const silentAudio = new Audio("data:audio/mp3;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFTb25vdGhlcXVlLm9yZwBURU5DAAAAHQAAA1N3aXRjaCBQbHVzIMKpIE5DSCBTb2Z0d2FyZQBUSVQyAAAABgAAAzIyMzUAVFNTRQAAAA8AAANMYXZmNTcuODMuMTAwAAAAAAAAAAAAAAD/80DEAAAAA0gAAAAATEFNRTMuMTAwVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQsRbAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQMSkAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV");
    
    // 设置循环播放，并设置音量为0（不发出声音）
    silentAudio.loop = true;
    silentAudio.volume = 0;
    
    // 尝试播放
    silentAudio.play().then(() => {
      Logger.info('AudioResourceNode', `静音音频已播放，尝试再次播放目标音频...`);
      
      // 停止静音音频
      silentAudio.pause();
      silentAudio.remove();
      
      // 尝试再次播放目标音频
      if (this._audioElement) {
        this._audioElement.currentTime = 0;
        this._audioElement.play()
          .then(() => {
            Logger.info('AudioResourceNode', `🔊 解锁后播放音频成功`);
          })
          .catch(err => {
            Logger.error('AudioResourceNode', `解锁后仍然无法播放: ${err.message}`);
          });
      }
    }).catch(err => {
      Logger.error('AudioResourceNode', `无法解锁音频: ${err.message}`);
    });
  };
  
  AudioResourceNode.prototype.stopAudio = function() {
    if (this._audioElement) {
      this._audioElement.pause();
      this._audioElement.currentTime = 0;
      Logger.debug('AudioResourceNode', `停止播放音频: ${this.properties.alias || '未命名'}`);
    }
  };

  AudioResourceNode.prototype.onExecute = function() {
    // 输出音频资源别名，供后续节点使用
    if (this.properties.alias && this._loadState === 'loaded') {
      this.setOutputData(0, this.properties.alias);
    } else {
      this.setOutputData(0, null);
    }
  };

  // 清理音频资源的辅助方法
  AudioResourceNode.prototype.cleanupAudio = function() {
    // 停止并释放音频元素
    if (this._audioElement) {
      this._audioElement.pause();
      this._audioElement.src = '';
      this._audioElement = null;
    }
    
    // 卸载资源管理器中的资源
    if (this._audioId) {
      Logger.info('AudioResourceNode', `卸载音频资源: ${this._audioId}`);
      PixiResourceManager.getInstance().unloadResource(this._audioId);
      this._audioId = null;
    }
  };
  
  AudioResourceNode.prototype.onRemoved = function() {
    Logger.info('AudioResourceNode', '节点被移除，清理资源');
    this.cleanupAudio();
  };
  
  // 确保节点移动时不会错误地移除资源
  AudioResourceNode.prototype.onConfigure = function(info) {
    // 如果节点已有资源ID但与新配置不匹配，先清理旧资源
    if (this._audioId && info && info.properties && 
        info.properties.alias && this._audioId !== info.properties.alias) {
      Logger.info('AudioResourceNode', `节点配置变更，清理旧资源: ${this._audioId}`);
      this.cleanupAudio();
    }
    
    // 如果这是一个已存在的节点重新加载（例如节点移动或图表重载），保持资源不变
    if (info && info.properties) {
      // 恢复属性
      this.properties = {...info.properties};
      
      // 如果有需要，重新加载音频
      if (this.properties.audioUrl && this.properties.alias) {
        this._audioId = this.properties.alias;
        
        // 检查资源是否已经在ResourceManager中
        if (!PixiResourceManager.getInstance().getResource(this._audioId)) {
          this._loadState = 'pending';
          this.registerAndLoadAudio();
        } else {
          this._loadState = 'loaded';
          this._audioElement = new Audio(this.properties.audioUrl);
          Logger.debug('AudioResourceNode', `恢复已存在的音频资源: ${this._audioId}`);
        }
      }
    }
  };

  LiteGraph.registerNodeType('resource/audio', AudioResourceNode);
}
