import { NodeColors, NodeSizes } from '../../nodesConfig';
import { Logger } from '../../pixiNodeLogger';
import { PixiResourceManager } from '../logic/pixiResourceManager';

/**
 * ImageLoader Node
 * Responsible for loading image resources and registering them with the ResourceManager
 * Provides loading state and progress information
 */
export function registerImageLoaderNode(LiteGraph: any) {
  function ImageLoaderNode(this: any) {
    this.title = 'Image Loader';
    this.size = NodeSizes.medium;
    this.boxcolor = NodeColors.resource;
    this.color = NodeColors.resource;
    
    // Internal state tracking
    this._resourceId = null;
    this._loadingState = 'idle'; // idle, loading, loaded, error
    this._loadingProgress = 0;
    this._lastEventTime = 0;
    this._resourceInfo = null;
    
    // Properties
    this.properties = {
      imageUrl: '',
      resourceName: '',
      autoLoad: true,
      sendEvents: true,
      eventThrottle: 100, // minimum time between events (ms)
    };
    
    // Outputs
    this.addOutput('resource', 'resource');
    this.addOutput('status', 'string');
    this.addOutput('progress', 'number');
    this.addOutput('onLoaded', LiteGraph.EVENT);
    this.addOutput('onError', LiteGraph.EVENT);
    
    // Widgets for file selection
    this.addWidget('button', 'Select Image', null, () => {
      this._selectFile();
    });
    
    // Widgets for URL input
    this.addWidget('text', 'Image URL', this.properties.imageUrl, (v: string) => {
      this.properties.imageUrl = v;
      if (this.properties.autoLoad && v) {
        this._startLoading();
      }
    });
    
    this.addWidget('text', 'Resource Name', this.properties.resourceName, (v: string) => {
      this.properties.resourceName = v;
    });
    
    // Toggle for auto loading
    this.addWidget('toggle', 'Auto Load', this.properties.autoLoad, (v: boolean) => {
      this.properties.autoLoad = v;
      if (v && this.properties.imageUrl) {
        this._startLoading();
      }
    });
    
    // Button to manually trigger loading
    this.addWidget('button', 'Load Now', null, () => {
      if (this.properties.imageUrl) {
        this._startLoading();
      } else {
        Logger.warn('ImageLoaderNode', 'No image URL specified');
      }
    });
    
    // Status display
    this.addWidget('text', 'Status', 'Ready');
    
    // Progress bar
    this.widgets_values = this.widgets_values || [];
    this.addWidget('number', 'Progress', 0, null, { min: 0, max: 100, precision: 0 });
  }
  
  /**
   * Select file from local filesystem
   */
  ImageLoaderNode.prototype._selectFile = function() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);
    
    fileInput.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      
      if (file) {
        // Update status widget
        this._updateStatusWidget(`Selected: ${file.name}`);
        
        // Create resource name from file name if not specified
        if (!this.properties.resourceName || this.properties.resourceName === '') {
          this.properties.resourceName = file.name.split('.')[0];
          // Update the resource name widget
          if (this.widgets && this.widgets[2]) {
            this.widgets[2].value = this.properties.resourceName;
          }
        }
        
        const reader = new FileReader();
        reader.onprogress = (evt) => {
          if (evt.lengthComputable) {
            const progress = Math.round((evt.loaded / evt.total) * 100);
            this._updateProgressWidget(progress);
            this._emitProgressEvent(progress);
          }
        };
        
        reader.onload = (evt) => {
          const dataUrl = evt.target?.result as string;
          this.properties.imageUrl = dataUrl;
          
          // Update the URL widget value
          if (this.widgets && this.widgets[1]) {
            // Truncate the dataURL for display
            const shortUrl = dataUrl.substring(0, 20) + '...' + dataUrl.substring(dataUrl.length - 10);
            this.widgets[1].value = shortUrl;
          }
          
          if (this.properties.autoLoad) {
            this._startLoading();
          }
          
          // Remove the input element
          document.body.removeChild(fileInput);
        };
        
        reader.onerror = () => {
          this._setErrorState('Failed to read file');
          document.body.removeChild(fileInput);
        };
        
        reader.readAsDataURL(file);
      } else {
        document.body.removeChild(fileInput);
      }
    };
    
    fileInput.click();
  };
  
  /**
   * Start loading the image resource
   */
  ImageLoaderNode.prototype._startLoading = function() {
    if (!this.properties.imageUrl) {
      this._setErrorState('No image URL specified');
      return;
    }
    
    // Reset state
    this._loadingState = 'loading';
    this._loadingProgress = 0;
    this._updateStatusWidget('Loading...');
    this._updateProgressWidget(0);
    
    // Generate resource ID and name
    const resourceName = this.properties.resourceName || `image_${Date.now()}`;
    const resourceId = `imageloader_${this.id}_${resourceName}_${Date.now()}`;
    
    // Log loading attempt
    Logger.info('ImageLoaderNode', `Loading image: ${resourceName}`);
    
    try {
      // Get resource manager instance
      const resourceManager = PixiResourceManager.getInstance();
      
      // Register resource
      resourceManager.registerResource({
        id: resourceId,
        type: 'texture',
        url: this.properties.imageUrl,
        alias: resourceName,
        metadata: { nodeId: this.id, nodeName: this.title }
      });
      
      // Store resource ID for later reference
      this._resourceId = resourceId;
      
      // Load resource with progress tracking
      const onProgress = (progress: number) => {
        this._loadingProgress = progress;
        this._updateProgressWidget(progress);
        this._emitProgressEvent(progress);
      };
      
      // Note: PixiResourceManager.loadResource doesn't support progress callback
      // We'll handle progress directly through the ResourceManager in future updates
      resourceManager.loadResource(resourceId)
        .then((resource) => {
          this._loadingState = 'loaded';
          this._updateStatusWidget(`Loaded: ${resourceName}`);
          this._updateProgressWidget(100);
          this._resourceInfo = {
            id: resourceId,
            alias: resourceName,
            resource: resource,
            url: this.properties.imageUrl
          };
          
          // Emit loaded event
          this.trigger('onLoaded', this._resourceInfo);
          
          // Refresh canvas to show updated status
          this.setDirtyCanvas(true, true);
        })
        .catch((err: Error) => {
          this._setErrorState(`Error: ${err.message || 'Unknown error'}`);
          
          // Emit error event
          this.trigger('onError', { error: err, message: err.message });
        });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this._setErrorState(`Error: ${errorMessage}`);
      this.trigger('onError', { error, message: errorMessage });
    }
  };
  
  /**
   * Set error state and update UI
   */
  ImageLoaderNode.prototype._setErrorState = function(message: string) {
    this._loadingState = 'error';
    this._updateStatusWidget(message);
    Logger.error('ImageLoaderNode', message);
  };
  
  /**
   * Update the status display widget
   */
  ImageLoaderNode.prototype._updateStatusWidget = function(status: string) {
    if (this.widgets && this.widgets[5] && this.widgets[5].name === 'Status') {
      this.widgets[5].value = status;
      this.setDirtyCanvas(true, false);
    }
  };
  
  /**
   * Update the progress bar widget
   */
  ImageLoaderNode.prototype._updateProgressWidget = function(progress: number) {
    if (this.widgets && this.widgets[6] && this.widgets[6].name === 'Progress') {
      this.widgets[6].value = progress;
      this.setDirtyCanvas(true, false);
    }
  };
  
  /**
   * Emit progress event (throttled)
   */
  ImageLoaderNode.prototype._emitProgressEvent = function(progress: number) {
    if (!this.properties.sendEvents) return;
    
    const now = Date.now();
    if (now - this._lastEventTime > this.properties.eventThrottle) {
      this._lastEventTime = now;
      this.setOutputData(1, this._loadingState); // status output
      this.setOutputData(2, progress / 100); // progress output (0-1)
    }
  };
  
  /**
   * Main execution method
   */
  ImageLoaderNode.prototype.onExecute = function() {
    // Output resource info
    if (this._resourceInfo && this._loadingState === 'loaded') {
      this.setOutputData(0, this._resourceInfo);
    }
    
    // Always output current status and progress
    this.setOutputData(1, this._loadingState);
    this.setOutputData(2, this._loadingProgress / 100);
  };
  
  /**
   * Handle connections change
   */
  ImageLoaderNode.prototype.onConnectionsChange = function(type: number, slotIndex: number, isConnected: boolean) {
    // Trigger loading when someone connects to our outputs
    if (type === LiteGraph.OUTPUT && isConnected && this.properties.autoLoad && this.properties.imageUrl) {
      this._startLoading();
    }
  };
  
  /**
   * Cleanup on removal
   */
  ImageLoaderNode.prototype.onRemoved = function() {
    // Clean up resource if needed
    if (this._resourceId) {
      try {
        const resourceManager = PixiResourceManager.getInstance();
        resourceManager.unloadResource(this._resourceId).catch((err: Error) => {
          Logger.warn('ImageLoaderNode', `Failed to unload resource ${this._resourceId}:`, err);
        });
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        Logger.error('ImageLoaderNode', 'Error unloading resource:', errorMessage);
      }
    }
  };

  // Register node type
  LiteGraph.registerNodeType('resource/imageloader', ImageLoaderNode);
}
