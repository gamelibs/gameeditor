import { Texture, Assets } from 'pixi.js';
// import { LoaderResource } from '@pixi/loaders';
import { NodeColors, NodeSizes } from '../../nodesConfig';
import { Logger } from '../../pixiNodeLogger';
import { PixiResourceManager } from '../logic/pixiResourceManager';

/**
 * TextureNode
 * Responsible for converting resources to Pixi Textures
 */
export function registerTextureNode(LiteGraph: any) {
  function TextureNode(this: any) {
    this.title = 'Texture';
    this.size = NodeSizes.medium;
    this.boxcolor = NodeColors.resource;
    this.color = NodeColors.resource;
    
    // Input ports
    this.addInput('resource', '*');
    
    // Output ports
    this.addOutput('texture', 'texture');
    
    // Properties
    this.properties = {
      resourceName: '',  // For manual resource name input
      lastStatus: 'Ready'
    };
    
    // Internal tracking
    this._texture = null;
    this._resourceInfo = null;
    this._loadState = 'idle'; // idle, loading, loaded, error
    
    // Resource name input widget
    this.addWidget('text', 'Resource Name', this.properties.resourceName, (v: string) => {
      this.properties.resourceName = v;
      // Try to load the resource if a name is provided
      if (v && v.trim() !== '') {
        this._loadByResourceName(v);
      }
    });
    
    // Button to manually trigger loading from resource name
    this.addWidget('button', 'Load Resource', null, () => {
      if (this.properties.resourceName && this.properties.resourceName.trim() !== '') {
        // First update status to show we're responding
        this._updateStatus(`Loading resource: ${this.properties.resourceName}...`);
        // Add slight delay to ensure UI updates before potentially heavy operation
        setTimeout(() => {
          this._loadByResourceName(this.properties.resourceName);
        }, 50);
      } else {
        this._updateStatus('No resource name specified');
      }
    });
    
    // Status display
    this.addWidget('text', 'Status', 'Ready');
  }
  
  /**
   * Attempt to load a texture by resource name
   */
  TextureNode.prototype._loadByResourceName = function(resourceName: string) {
    this._loadState = 'loading';
    this._updateStatus(`Looking for resource: ${resourceName}`);
    Logger.debug('TextureNode', `Attempting to load resource by name: ${resourceName}`);
    
    try {
      // Try to get the resource from ResourceManager
      const resourceManager = PixiResourceManager.getInstance();
      const resource = resourceManager.getResource(resourceName);
      
      if (resource) {
        Logger.debug('TextureNode', `Resource found in ResourceManager: ${resourceName}`);
        this._processResource({ resource, alias: resourceName });
      } else {
        Logger.debug('TextureNode', `Resource not found in ResourceManager, trying Assets: ${resourceName}`);
        // Try Assets.get as fallback
        try {
          const texture = Assets.get(resourceName);
          if (texture instanceof Texture) {
            this._updateStatus(`Found texture via Assets: ${resourceName}`);
            this._texture = texture;
            this._loadState = 'loaded';
            // Force node output update
            if (this.graph) {
              this.graph.runStep();
            }
          } else {
            Logger.debug('TextureNode', `Resource not found in Assets: ${resourceName}`);
            // Try to load it through Assets
            this._updateStatus(`Attempting to load: ${resourceName}`);
            Assets.load(resourceName)
              .then((texture: Texture) => {
                this._texture = texture;
                this._loadState = 'loaded';
                this._updateStatus(`Loaded texture: ${resourceName}`);
                // Force node output update
                if (this.graph) {
                  this.graph.runStep();
                }
              })
              .catch((err: Error) => {
                this._updateStatus(`Resource not found: ${resourceName}`);
                this._loadState = 'error';
                Logger.error('TextureNode', `Failed to load resource: ${err.message}`);
              });
          }
        } catch (assetErr) {
          this._updateStatus(`Resource not found: ${resourceName}`);
          this._loadState = 'error';
          Logger.error('TextureNode', `Asset lookup error: ${assetErr instanceof Error ? assetErr.message : 'Unknown error'}`);
        }
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      this._updateStatus(`Error: ${errorMessage}`);
      this._loadState = 'error';
      Logger.error('TextureNode', `Error loading resource by name: ${errorMessage}`);
    }
  };
  
  /**
   * Process a resource object from ImageLoader or other source
   */
  TextureNode.prototype._processResource = function(resourceInfo: any) {
    try {
      if (!resourceInfo) {
        this._updateStatus('No resource provided');
        return;
      }
      
      this._resourceInfo = resourceInfo;
      Logger.debug('TextureNode', `Processing resource: ${resourceInfo.alias || resourceInfo.id || 'unnamed'}`);
      
      // 记录资源的resourceName，便于断开连接后仍能加载
      if (resourceInfo.alias && resourceInfo.alias !== this.properties.resourceName) {
        this.properties.resourceName = resourceInfo.alias;
        // 更新控件显示
        if (this.widgets && this.widgets[0] && this.widgets[0].name === 'Resource Name') {
          this.widgets[0].value = resourceInfo.alias;
        }
        Logger.debug('TextureNode', `Updated resource name from input: ${resourceInfo.alias}`);
      }
      
      // Handle case where resource is already a texture
      if (resourceInfo.resource instanceof Texture) {
        this._texture = resourceInfo.resource;
        this._loadState = 'loaded';
        this._updateStatus(`Using texture: ${resourceInfo.alias || 'unnamed'}`);
        return;
      }
      
      // Handle case where resource is an URL
      if (resourceInfo.url || 
          (typeof resourceInfo.resource === 'string' && 
           (resourceInfo.resource.startsWith('http') || 
            resourceInfo.resource.startsWith('data:')))) {
        
        const url = resourceInfo.url || resourceInfo.resource;
        this._loadState = 'loading';
        this._updateStatus(`Loading texture from URL...`);
        
        // Create a new texture from URL using Assets instead of Texture.fromURL
        Assets.load(url)
          .then((texture: Texture) => {
            this._texture = texture;
            this._loadState = 'loaded';
            this._updateStatus(`Texture loaded: ${resourceInfo.alias || 'unnamed'}`);
            
            // Force node execution to output the texture
            if (this.graph) {
              this.graph.runStep();
            }
          })
          .catch((err: Error) => {
            this._loadState = 'error';
            this._updateStatus(`Error loading texture: ${err.message}`);
            Logger.error('TextureNode', `Error loading texture from URL: ${err.message}`);
          });
          
        return;
      }
      
      // Handle case where resource has a getTexture method
      if (resourceInfo.resource && typeof resourceInfo.resource.getTexture === 'function') {
        try {
          this._texture = resourceInfo.resource.getTexture();
          if (this._texture) {
            this._loadState = 'loaded';
            this._updateStatus(`Got texture from resource: ${resourceInfo.alias || 'unnamed'}`);
            return;
          }
        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : 'Unknown error';
          Logger.warn('TextureNode', `Error getting texture from resource: ${errorMessage}`);
        }
      }
      
      // If we reach here, we couldn't process the resource
      this._updateStatus(`Unsupported resource type: ${typeof resourceInfo.resource}`);
      this._loadState = 'error';
      
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      this._updateStatus(`Error processing resource: ${errorMessage}`);
      this._loadState = 'error';
      Logger.error('TextureNode', `Error processing resource: ${errorMessage}`);
    }
  };
  
  /**
   * Update status display
   */
  TextureNode.prototype._updateStatus = function(status: string) {
    this.properties.lastStatus = status;
    if (this.widgets && this.widgets[2] && this.widgets[2].name === 'Status') {
      this.widgets[2].value = status;
    }
    this.setDirtyCanvas(true, false);
    Logger.debug('TextureNode', status);
  };
  
  /**
   * Main execution method
   */
  TextureNode.prototype.onExecute = function() {
    // Get input resource
    const inputResource = this.getInputData(0);
    
    Logger.debug('TextureNode', `onExecute called, has input: ${inputResource ? 'yes' : 'no'}`);
    
    // Check for input changes more robustly
    const hasNewInput = inputResource && (
      !this._resourceInfo || 
      inputResource !== this._resourceInfo ||
      (inputResource.resource && this._resourceInfo?.resource !== inputResource.resource) ||
      (inputResource.id && this._resourceInfo?.id !== inputResource.id)
    );
    
    if (hasNewInput) {
      // We have a new input resource, process it
      Logger.debug('TextureNode', 'Received new resource input');
      this._processResource(inputResource);
    } else if (this.inputs[0].link && !inputResource) {
      // Connected but no data yet, show waiting status
      this._updateStatus('Waiting for resource input...');
    } else if (!this.inputs[0].link && this._resourceInfo) {
      // Input was disconnected, clear resource info
      this._resourceInfo = null;
      if (!this._texture && this._loadState !== 'loading') {
        this._updateStatus('Input disconnected');
      }
    }
    
    // Output texture if we have one
    if (this._texture && this._loadState === 'loaded') {
      // Ensure the texture is marked as valid
      if (this._texture.baseTexture) {
        this._texture.baseTexture.valid = true;
        Logger.debug('TextureNode', `Outputting valid texture: ${this._texture.width}x${this._texture.height}`);
      } else {
        Logger.warn('TextureNode', 'Texture has no baseTexture');
      }
      this.setOutputData(0, this._texture);
    } else {
      if (!this._texture) {
        Logger.debug('TextureNode', 'No texture to output');
      } else if (this._loadState !== 'loaded') {
        Logger.debug('TextureNode', `Texture not ready, state: ${this._loadState}`);
      }
    }
  };
  
  /**
   * Handle connections change
   */
  TextureNode.prototype.onConnectionsChange = function(type: number, slotIndex: number, isConnected: boolean) {
    if (type === LiteGraph.INPUT && slotIndex === 0) {
      if (!isConnected) {
        // Input disconnected, clear resource info and reset state
        this._resourceInfo = null;
        
        // If we have a resource name, try to load it
        if (this.properties.resourceName && this.properties.resourceName.trim() !== '') {
          this._loadByResourceName(this.properties.resourceName);
        } else {
          // Only update status if we're not loading something else
          if (this._loadState !== 'loading') {
            this._updateStatus('Input disconnected');
            // Reset texture if we don't have a name to load
            if (!this._texture || !this.properties.resourceName) {
              this._texture = null;
              this._loadState = 'idle';
            }
          }
        }
        
        // Force a refresh of the node
        this.setDirtyCanvas(true, true);
      } else {
        // New connection established
        this._updateStatus('Connected, waiting for resource...');
      }
    }
  };

  // Register the node
  LiteGraph.registerNodeType('resource/texture', TextureNode);
}
