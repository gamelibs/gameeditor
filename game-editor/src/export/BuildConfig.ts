/**
 * 游戏构建配置和优化选项
 */
export interface BuildConfig {
  // 基本配置
  projectName: string;
  gameTitle: string;
  version: string;
  
  // 构建选项
  target: 'web' | 'cordova' | 'electron';
  minify: boolean;
  includeDebugInfo: boolean;
  
  // 优化选项
  optimization: {
    bundleAssets: boolean;        // 是否打包资源
    compressTextures: boolean;    // 是否压缩纹理
    generateWebP: boolean;        // 是否生成WebP格式
    treeshaking: boolean;         // 是否启用tree shaking
    cacheManifest: boolean;       // 是否生成缓存清单
  };
  
  // PWA配置
  pwa: {
    enabled: boolean;
    name: string;
    shortName: string;
    description: string;
    themeColor: string;
    backgroundColor: string;
    icons: Array<{
      src: string;
      sizes: string;
      type: string;
    }>;
  };
  
  // 移动端配置
  mobile: {
    orientation: 'portrait' | 'landscape' | 'any';
    fullscreen: boolean;
    statusBarStyle: 'default' | 'black' | 'black-translucent';
  };
}

export const DEFAULT_BUILD_CONFIG: BuildConfig = {
  projectName: 'my-game',
  gameTitle: 'My Awesome Game',
  version: '1.0.0',
  target: 'web',
  minify: true,
  includeDebugInfo: false,
  
  optimization: {
    bundleAssets: true,
    compressTextures: true,
    generateWebP: true,
    treeshaking: true,
    cacheManifest: true
  },
  
  pwa: {
    enabled: true,
    name: 'My Awesome Game',
    shortName: 'MyGame',
    description: 'An awesome game built with Pixi.js',
    themeColor: '#4ECDC4',
    backgroundColor: '#222222',
    icons: [
      { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' }
    ]
  },
  
  mobile: {
    orientation: 'any',
    fullscreen: false,
    statusBarStyle: 'default'
  }
};
