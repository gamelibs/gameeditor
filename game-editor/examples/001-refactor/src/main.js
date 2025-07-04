// 游戏入口文件
document.addEventListener('DOMContentLoaded', () => {
    console.log('蛋蛋射击游戏开始初始化...');
    
    // 检查Pixi.js是否加载
    if (typeof PIXI === 'undefined') {
        console.error('PIXI.js 未正确加载');
        showError('游戏加载失败：PIXI.js 未找到');
        return;
    }

    // 创建全局物理系统实例
    window.physicsManager = new PhysicsManager({
        debug: true,  // 开启调试模式
        gravity: 0.2,
        friction: 0.98,
        bounceX: 0.8,
        bounceY: 0.6
    });
    
    // 创建游戏实例
    let game;
    
    try {
        game = new Game();
        
        // 全局游戏引用（用于调试）
        window.game = game;
        
        console.log('游戏初始化成功');
        
        // 游戏事件监听
        game.on('score_update', (score) => {
            console.log('分数更新:', score);
        });
        
        game.on('level_change', (level) => {
            console.log('关卡变更:', level);
        });
        
        game.on('game_over', (finalScore) => {
            console.log('游戏结束，最终分数:', finalScore);
        });
        
        // 窗口失焦时暂停游戏
        window.addEventListener('blur', () => {
            if (game.state === GAME_STATES.PLAYING) {
                game.pause();
            }
        });
        
        // 窗口获得焦点时恢复游戏
        window.addEventListener('focus', () => {
            if (game.state === GAME_STATES.PAUSED) {
                game.resume();
            }
        });
        
        // 页面关闭时清理资源
        window.addEventListener('beforeunload', () => {
            if (game) {
                game.destroy();
            }
        });
        
    } catch (error) {
        console.error('游戏初始化失败:', error);
        showError('游戏初始化失败: ' + error.message);
    }
});

// 显示错误信息
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #ff4444;
        color: white;
        padding: 20px;
        border-radius: 10px;
        font-family: Arial, sans-serif;
        font-size: 18px;
        text-align: center;
        z-index: 9999;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    `;
    errorDiv.textContent = message;
    
    document.body.appendChild(errorDiv);
    
    // 5秒后自动移除错误提示
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.parentNode.removeChild(errorDiv);
        }
    }, 5000);
}

// 调试工具函数
window.debugGame = {
    getGameState: () => window.game ? window.game.state : 'No game instance',
    getScore: () => window.game ? window.game.getScore() : 'No game instance',
    getLevel: () => window.game ? window.game.getLevel() : 'No game instance',
    restart: () => window.game ? window.game.restart() : 'No game instance',
    pause: () => window.game ? window.game.pause() : 'No game instance',
    resume: () => window.game ? window.game.resume() : 'No game instance'
};

console.log('调试工具已加载，使用 window.debugGame 访问调试功能');
