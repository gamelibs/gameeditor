// Debug script to test texture handling in PixiImageNode
// Run this in the browser console when using the editor

// Set log level to DEBUG to see all texture-related logs
LiteGraph.setPixiNodeLogLevel(4); // 4 = DEBUG

// Helper function to inspect a texture object
window.inspectTexture = function(texture) {
  if (!texture) {
    console.log('Texture is null or undefined');
    return;
  }
  
  console.log('Texture inspection:', {
    'instanceof Texture': texture instanceof PIXI.Texture,
    'valid': texture.valid,
    'width': texture.width,
    'height': texture.height,
    'baseTexture': texture.baseTexture ? {
      'valid': texture.baseTexture.valid,
      'width': texture.baseTexture.width,
      'height': texture.baseTexture.height,
      'resource': texture.baseTexture.resource ? 
        texture.baseTexture.resource.constructor.name : 'none'
    } : 'none',
    'constructor': texture.constructor ? texture.constructor.name : 'unknown',
    'methods': Object.getOwnPropertyNames(Object.getPrototypeOf(texture)),
    'events': texture.listenerCount ? 
      {
        'update': texture.listenerCount('update'),
        'loaded': texture.listenerCount('loaded')
      } : 'no eventEmitter methods'
  });
  
  // Attempt to extract source URL if possible
  try {
    if (texture.baseTexture && texture.baseTexture.resource) {
      const resource = texture.baseTexture.resource;
      if (resource.url) {
        console.log('Texture URL:', resource.url);
      } else if (resource.source && resource.source.src) {
        console.log('Texture source URL:', resource.source.src);
      }
    }
  } catch (e) {
    console.error('Error extracting texture source:', e);
  }
  
  return texture; // For chaining
};

// Helper to find nodes by type
window.findNodesByType = function(type) {
  const nodes = [];
  if (LiteGraph.LGraph && LiteGraph.LGraph.prototype && window.graph instanceof LiteGraph.LGraph) {
    for (const node of window.graph._nodes) {
      if (node.type === type) {
        nodes.push(node);
      }
    }
    console.log(`Found ${nodes.length} nodes of type ${type}:`, nodes);
    return nodes;
  } else {
    console.error('No active graph found');
    return [];
  }
};

// Easy inspection of texture resource nodes
window.inspectTextureResourceNodes = function() {
  const nodes = window.findNodesByType('resource/texture');
  nodes.forEach((node, i) => {
    console.group(`TextureResource Node #${i} (ID: ${node.id})`);
    console.log('Properties:', node.properties);
    console.log('_texture:', node._texture);
    if (node._texture) {
      window.inspectTexture(node._texture);
    }
    console.groupEnd();
  });
};

// Easy inspection of image nodes
window.inspectImageNodes = function() {
  const nodes = window.findNodesByType('render/image');
  nodes.forEach((node, i) => {
    console.group(`Image Node #${i} (ID: ${node.id})`);
    console.log('Properties:', node.properties);
    console.log('Input texture:', node.getInputData(0));
    console.log('_sprite:', node._sprite);
    if (node._sprite && node._sprite.texture) {
      console.log('Sprite texture:');
      window.inspectTexture(node._sprite.texture);
    }
    console.groupEnd();
  });
};

console.log('Debug tools loaded! Run these commands to debug:');
console.log('- inspectTextureResourceNodes() - Check all texture resource nodes');
console.log('- inspectImageNodes() - Check all image nodes');
console.log('- inspectTexture(textureObject) - Detailed texture inspection');
console.log('- findNodesByType("node/type") - Find nodes by type');
