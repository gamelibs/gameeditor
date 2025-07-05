/**
 * 生成增强的CSS样式
 */
export function generateEnhancedCSS(): string {
  return `/**
 * 游戏样式 - 增强版
 */

/* 重置样式 */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

html, body {
    width: 100%;
    height: 100%;
    overflow: hidden;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    background: #000;
    color: #fff;
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
    -webkit-tap-highlight-color: transparent;
}

/* 加载画面 */
.loading-screen {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    transition: opacity 0.5s ease;
}

.loading-content {
    text-align: center;
    max-width: 90%;
}

.loading-logo {
    margin-bottom: 2rem;
}

.spinner {
    width: 60px;
    height: 60px;
    border: 4px solid rgba(255, 255, 255, 0.3);
    border-top: 4px solid #fff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.loading-title {
    font-size: 2.5rem;
    font-weight: bold;
    margin-bottom: 1.5rem;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
}

.loading-bar {
    width: 300px;
    max-width: 80vw;
    height: 8px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 4px;
    margin: 0 auto 1rem;
    overflow: hidden;
}

.loading-progress {
    height: 100%;
    background: linear-gradient(90deg, #4ECDC4, #44A08D);
    border-radius: 4px;
    width: 0%;
    transition: width 0.3s ease;
    animation: shimmer 2s infinite;
}

@keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
}

.loading-text {
    font-size: 1.1rem;
    opacity: 0.9;
    margin-bottom: 1rem;
}

.loading-tips {
    font-size: 0.9rem;
    opacity: 0.7;
    margin-top: 2rem;
}

/* 游戏容器 */
.game-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    background: #222;
}

.game-container canvas {
    border: none;
    background: transparent;
    touch-action: manipulation;
    image-rendering: pixelated;
    image-rendering: -moz-crisp-edges;
    image-rendering: crisp-edges;
}

/* 错误画面 */
.error-screen {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.9);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1001;
}

.error-content {
    text-align: center;
    background: #fff;
    color: #333;
    padding: 2rem;
    border-radius: 12px;
    max-width: 90%;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
}

.error-content h2 {
    color: #e74c3c;
    margin-bottom: 1rem;
}

.error-content button {
    background: #3498db;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 6px;
    font-size: 1rem;
    cursor: pointer;
    margin-top: 1rem;
    transition: background 0.3s ease;
}

.error-content button:hover {
    background: #2980b9;
}

/* 方向提示 */
.orientation-warning {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.95);
    display: none;
    justify-content: center;
    align-items: center;
    z-index: 999;
    color: white;
}

.orientation-content {
    text-align: center;
    padding: 2rem;
}

.phone-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
    animation: rotate 2s ease-in-out infinite alternate;
}

@keyframes rotate {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(90deg); }
}

/* 离线提示 */
.offline-warning {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: #e74c3c;
    color: white;
    text-align: center;
    padding: 10px;
    z-index: 1002;
    animation: slideDown 0.3s ease;
}

@keyframes slideDown {
    from { transform: translateY(-100%); }
    to { transform: translateY(0); }
}

/* 响应式设计 */
@media (max-width: 768px) {
    .loading-title {
        font-size: 2rem;
    }
    
    .loading-bar {
        width: 250px;
    }
}

@media (max-height: 600px) {
    .loading-title {
        font-size: 1.8rem;
        margin-bottom: 1rem;
    }
    
    .loading-tips {
        display: none;
    }
}

/* 横屏检测 */
@media (orientation: portrait) {
    .orientation-warning {
        display: flex !important;
    }
}

@media (orientation: landscape) {
    .orientation-warning {
        display: none !important;
    }
}

/* 高DPI屏幕优化 */
@media (-webkit-min-device-pixel-ratio: 2) {
    .game-container canvas {
        image-rendering: auto;
    }
}

/* 安全区域适配 */
@supports(padding: max(0px)) {
    .game-container {
        padding-left: env(safe-area-inset-left);
        padding-right: env(safe-area-inset-right);
        padding-top: env(safe-area-inset-top);
        padding-bottom: env(safe-area-inset-bottom);
    }
}

/* 性能优化 */
.game-container,
.loading-screen {
    will-change: transform;
    transform: translateZ(0);
}

/* 暗色模式支持 */
@media (prefers-color-scheme: dark) {
    .error-content {
        background: #2c3e50;
        color: #ecf0f1;
    }
}

/* 减少动画（尊重用户偏好） */
@media (prefers-reduced-motion: reduce) {
    .spinner,
    .loading-progress,
    .phone-icon {
        animation: none;
    }
    
    .loading-screen,
    .error-content button,
    .offline-warning {
        transition: none;
    }
}

/* 打印样式 */
@media print {
    .loading-screen,
    .error-screen,
    .orientation-warning,
    .offline-warning {
        display: none !important;
    }
}`;
}
