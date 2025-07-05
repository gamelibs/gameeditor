import type { BuildConfig } from './BuildConfig';

/**
 * 生成增强的HTML模板
 */
export function generateEnhancedHTML(config: any, buildConfig: BuildConfig): string {
  const { pwa, mobile } = buildConfig;
  
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no, viewport-fit=cover">
    <meta name="description" content="${pwa.description}">
    <meta name="theme-color" content="${pwa.themeColor}">
    <meta name="apple-mobile-web-app-capable" content="${mobile.fullscreen ? 'yes' : 'no'}">
    <meta name="apple-mobile-web-app-status-bar-style" content="${mobile.statusBarStyle}">
    <meta name="apple-mobile-web-app-title" content="${pwa.shortName}">
    <meta name="mobile-web-app-capable" content="yes">
    
    <!-- 屏幕方向控制 -->
    ${mobile.orientation !== 'any' ? `<meta name="screen-orientation" content="${mobile.orientation}">` : ''}
    
    <!-- 预加载关键资源 -->
    <link rel="preload" href="js/pixi.min.js" as="script">
    <link rel="preload" href="css/game.css" as="style">
    
    <!-- PWA清单文件 -->
    ${pwa.enabled ? '<link rel="manifest" href="manifest.json">' : ''}
    
    <!-- 图标 -->
    <link rel="icon" type="image/x-icon" href="favicon.ico">
    <link rel="apple-touch-icon" href="icons/icon-192.png">
    
    <title>${config.title}</title>
    <link rel="stylesheet" href="css/game.css">
    
    <!-- 本地Pixi.js库 -->
    <script src="js/pixi.min.js"></script>
</head>
<body>
    <!-- 加载画面 -->
    <div id="loading-screen" class="loading-screen">
        <div class="loading-content">
            <div class="loading-logo">
                <div class="spinner"></div>
            </div>
            <h1 class="loading-title">${config.title}</h1>
            <div class="loading-bar">
                <div class="loading-progress"></div>
            </div>
            <p class="loading-text">正在加载...</p>
            <div class="loading-tips">
                <p>💡 建议使用横屏模式获得最佳体验</p>
            </div>
        </div>
    </div>
    
    <!-- 游戏容器 -->
    <div id="game-container" class="game-container" style="display: none;">
        <!-- 游戏画布将在这里插入 -->
    </div>
    
    <!-- 错误提示 -->
    <div id="error-screen" class="error-screen" style="display: none;">
        <div class="error-content">
            <h2>⚠️ 出现错误</h2>
            <p id="error-message"></p>
            <button onclick="location.reload()">重新加载</button>
        </div>
    </div>
    
    <!-- 方向提示 -->
    ${mobile.orientation === 'landscape' ? `
    <div id="orientation-warning" class="orientation-warning">
        <div class="orientation-content">
            <div class="phone-icon">📱</div>
            <p>请将设备横置以获得最佳游戏体验</p>
        </div>
    </div>
    ` : ''}
    
    <!-- 离线提示 -->
    <div id="offline-warning" class="offline-warning" style="display: none;">
        <p>🔌 网络连接已断开，游戏可能无法正常运行</p>
    </div>
    
    <!-- Service Worker注册 -->
    ${pwa.enabled ? `
    <script>
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('sw.js')
                    .then(registration => console.log('SW registered'))
                    .catch(error => console.log('SW registration failed'));
            });
        }
    </script>
    ` : ''}
    
    <!-- 游戏脚本 -->
    <script src="js/game-runtime.js"></script>
    <script src="js/game.js"></script>
    
    <!-- 性能监控 -->
    ${buildConfig.includeDebugInfo ? `
    <script src="js/performance-monitor.js"></script>
    ` : ''}
</body>
</html>`;
}

/**
 * 生成PWA清单文件
 */
export function generatePWAManifest(buildConfig: BuildConfig): string {
  const { pwa, mobile } = buildConfig;
  
  return JSON.stringify({
    name: pwa.name,
    short_name: pwa.shortName,
    description: pwa.description,
    start_url: "./",
    display: mobile.fullscreen ? "fullscreen" : "standalone",
    orientation: mobile.orientation,
    theme_color: pwa.themeColor,
    background_color: pwa.backgroundColor,
    icons: pwa.icons.map(icon => ({
      src: icon.src,
      sizes: icon.sizes,
      type: icon.type,
      purpose: "any maskable"
    })),
    categories: ["games", "entertainment"],
    lang: "zh-CN"
  }, null, 2);
}

/**
 * 生成Service Worker
 */
export function generateServiceWorker(buildConfig: BuildConfig): string {
  return `/**
 * Service Worker for ${buildConfig.gameTitle}
 */
const CACHE_NAME = '${buildConfig.projectName}-v${buildConfig.version}';
const urlsToCache = [
  './',
  './index.html',
  './css/game.css',
  './js/game-runtime.js',
  './js/game.js',
  './js/pixi.min.js',
  './manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // 缓存命中，返回缓存的资源
        if (response) {
          return response;
        }
        // 否则发起网络请求
        return fetch(event.request);
      })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});`;
}
