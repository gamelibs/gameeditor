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
          if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:audio/mp3')) {
            this._loadState = 'error';
            this._errorMessage = '只支持mp3格式';
            this.updateStatusWidget();
            return;
          }
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
    this.addWidget('button', '导入mp3', null, () => fileInput.click());
    this.addWidget('text', 'alias', this.properties.alias, (v) => { this.properties.alias = v; });
    this.addWidget('text', 'audioUrl', this.properties.audioUrl, (v) => { this.properties.audioUrl = v; });
    this.addWidget('toggle', 'preload', this.properties.preload, (v) => { this.properties.preload = v; });
    this.addWidget('text', 'status', this._loadState, () => {}, { readonly: true });
    // 试听按钮
    this.addWidget('button', '试听', null, () => this.playAudio());
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
    PixiResourceManager.getInstance().registerResource({
      id,
      type: 'audio',
      url: this.properties.audioUrl,
      alias: this.properties.alias
    });
    try {
      this._loadState = 'loading';
      this.updateStatusWidget();
      // 这里只注册，不实际用 PixiJS Assets 加载，直接用 HTML5 Audio 试听
      this._audioElement = new Audio(this.properties.audioUrl);
      this._audioElement.preload = 'auto';
      this._loadState = 'loaded';
      this.updateStatusWidget();
    } catch (e) {
      this._loadState = 'error';
      this._errorMessage = e.message || '加载失败';
      this.updateStatusWidget();
    }
  };

  AudioResourceNode.prototype.playAudio = function() {
    if (!this._audioElement) {
      if (this.properties.audioUrl) {
        this._audioElement = new Audio(this.properties.audioUrl);
      } else {
        this._errorMessage = '无音频可播放';
        this._loadState = 'error';
        this.updateStatusWidget();
        return;
      }
    }
    this._audioElement.currentTime = 0;
    this._audioElement.play();
  };

  AudioResourceNode.prototype.onExecute = function() {
    // 输出音频资源别名，供后续节点使用
    if (this.properties.alias && this._loadState === 'loaded') {
      this.setOutputData(0, this.properties.alias);
    } else {
      this.setOutputData(0, null);
    }
  };

  AudioResourceNode.prototype.onRemoved = function() {
    if (this._audioElement) {
      this._audioElement.pause();
      this._audioElement.src = '';
      this._audioElement = null;
    }
    if (this._audioId) {
      PixiResourceManager.getInstance().unloadResource(this._audioId);
    }
  };

  LiteGraph.registerNodeType('resource/audio', AudioResourceNode);
}
