// 输入管理器
class InputManager {
    constructor(game) {
        this.game = game;
        this.keys = new Map();
        this.mouse = { x: 0, y: 0, pressed: false };
        this.touches = new Map();
        
        this.init();
    }
    
    init() {
        this.setupKeyboardEvents();
        this.setupMouseEvents();
        this.setupTouchEvents();
    }
    
    setupKeyboardEvents() {
        document.addEventListener('keydown', (event) => {
            this.keys.set(event.code, true);
            this.handleKeyDown(event);
        });
        
        document.addEventListener('keyup', (event) => {
            this.keys.set(event.code, false);
            this.handleKeyUp(event);
        });
    }
    
    setupMouseEvents() {
        const canvas = this.game.app.view;
        
        canvas.addEventListener('mousemove', (event) => {
            this.updateMousePosition(event);
        });
        
        canvas.addEventListener('mousedown', (event) => {
            this.mouse.pressed = true;
            this.updateMousePosition(event);
            this.handlePointerStart(event);
        });
        
        canvas.addEventListener('mouseup', (event) => {
            this.mouse.pressed = false;
            this.handlePointerEnd(event);
        });
        
        canvas.addEventListener('contextmenu', (event) => {
            event.preventDefault(); // 禁用右键菜单
        });
    }
    
    setupTouchEvents() {
        const canvas = this.game.app.view;
        
        canvas.addEventListener('touchstart', (event) => {
            event.preventDefault();
            
            for (const touch of event.changedTouches) {
                this.touches.set(touch.identifier, {
                    x: this.getTouchX(touch),
                    y: this.getTouchY(touch),
                    startTime: Date.now()
                });
            }
            
            this.handlePointerStart(event);
        });
        
        canvas.addEventListener('touchmove', (event) => {
            event.preventDefault();
            
            for (const touch of event.changedTouches) {
                if (this.touches.has(touch.identifier)) {
                    this.touches.set(touch.identifier, {
                        ...this.touches.get(touch.identifier),
                        x: this.getTouchX(touch),
                        y: this.getTouchY(touch)
                    });
                }
            }
            
            this.handlePointerMove(event);
        });
        
        canvas.addEventListener('touchend', (event) => {
            event.preventDefault();
            
            for (const touch of event.changedTouches) {
                this.touches.delete(touch.identifier);
            }
            
            this.handlePointerEnd(event);
        });
        
        canvas.addEventListener('touchcancel', (event) => {
            event.preventDefault();
            
            for (const touch of event.changedTouches) {
                this.touches.delete(touch.identifier);
            }
        });
    }
    
    updateMousePosition(event) {
        const rect = this.game.app.view.getBoundingClientRect();
        this.mouse.x = (event.clientX - rect.left) * (GAME_CONFIG.WIDTH / rect.width);
        this.mouse.y = (event.clientY - rect.top) * (GAME_CONFIG.HEIGHT / rect.height);
    }
    
    getTouchX(touch) {
        const rect = this.game.app.view.getBoundingClientRect();
        return (touch.clientX - rect.left) * (GAME_CONFIG.WIDTH / rect.width);
    }
    
    getTouchY(touch) {
        const rect = this.game.app.view.getBoundingClientRect();
        return (touch.clientY - rect.top) * (GAME_CONFIG.HEIGHT / rect.height);
    }
    
    handleKeyDown(event) {
        switch (event.code) {
            case 'Space':
                event.preventDefault();
                if (this.game.state === GAME_STATES.PLAYING) {
                    this.game.scenes.game.shooter.swapBubbles();
                } else if (this.game.state === GAME_STATES.PAUSED) {
                    this.game.resume();
                }
                break;
                
            case 'Escape':
                event.preventDefault();
                if (this.game.state === GAME_STATES.PLAYING) {
                    this.game.pause();
                } else if (this.game.state === GAME_STATES.PAUSED) {
                    this.game.resume();
                }
                break;
                
            case 'KeyR':
                if (this.game.state === GAME_STATES.GAME_OVER) {
                    this.game.restart();
                }
                break;
                
            case 'KeyM':
                // 切换静音
                if (this.game.audioManager) {
                    this.game.audioManager.toggleMute();
                }
                break;
        }
    }
    
    handleKeyUp(event) {
        // 处理按键释放事件
    }
    
    handlePointerStart(event) {
        // 恢复音频上下文（处理浏览器自动播放策略）
        if (this.game.audioManager) {
            this.game.audioManager.resumeAudioContext();
        }
        
        // 根据游戏状态处理输入
        switch (this.game.state) {
            case GAME_STATES.MENU:
                // 菜单状态下的点击处理由菜单场景处理
                break;
                
            case GAME_STATES.PLAYING:
                // 游戏状态下的射击处理由射手处理
                break;
                
            case GAME_STATES.PAUSED:
                this.game.resume();
                break;
                
            case GAME_STATES.GAME_OVER:
                // 游戏结束状态下可能重新开始
                break;
        }
    }
    
    handlePointerMove(event) {
        // 指针移动事件处理
        if (this.game.state === GAME_STATES.PLAYING) {
            // 瞄准处理由射手组件处理
        }
    }
    
    handlePointerEnd(event) {
        // 指针释放事件处理
        if (this.game.state === GAME_STATES.PLAYING) {
            // 射击处理由射手组件处理
        }
    }
    
    // 检查按键是否被按下
    isKeyPressed(keyCode) {
        return this.keys.get(keyCode) || false;
    }
    
    // 检查鼠标是否被按下
    isMousePressed() {
        return this.mouse.pressed;
    }
    
    // 获取鼠标位置
    getMousePosition() {
        return { x: this.mouse.x, y: this.mouse.y };
    }
    
    // 获取触摸点数量
    getTouchCount() {
        return this.touches.size;
    }
    
    // 获取第一个触摸点位置
    getFirstTouchPosition() {
        const firstTouch = this.touches.values().next().value;
        return firstTouch ? { x: firstTouch.x, y: firstTouch.y } : null;
    }
    
    // 检查是否为长按
    isLongPress(touchId, duration = 500) {
        const touch = this.touches.get(touchId);
        return touch && (Date.now() - touch.startTime) > duration;
    }
    
    // 计算两个触摸点之间的距离（用于缩放手势）
    getTouchDistance() {
        const touchArray = Array.from(this.touches.values());
        if (touchArray.length < 2) return 0;
        
        const touch1 = touchArray[0];
        const touch2 = touchArray[1];
        
        return MathUtils.distance(touch1.x, touch1.y, touch2.x, touch2.y);
    }
    
    // 获取双指中心点
    getTouchCenter() {
        const touchArray = Array.from(this.touches.values());
        if (touchArray.length < 2) return null;
        
        const touch1 = touchArray[0];
        const touch2 = touchArray[1];
        
        return {
            x: (touch1.x + touch2.x) / 2,
            y: (touch1.y + touch2.y) / 2
        };
    }
    
    // 检查点击是否在指定区域内
    isClickInArea(x, y, width, height, clickX, clickY) {
        return clickX >= x && clickX <= x + width && 
               clickY >= y && clickY <= y + height;
    }
    
    // 检查点击是否在圆形区域内
    isClickInCircle(centerX, centerY, radius, clickX, clickY) {
        return MathUtils.distance(centerX, centerY, clickX, clickY) <= radius;
    }
    
    // 清理资源
    destroy() {
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('keyup', this.handleKeyUp);
        
        const canvas = this.game.app.view;
        if (canvas) {
            canvas.removeEventListener('mousemove', this.updateMousePosition);
            canvas.removeEventListener('mousedown', this.handlePointerStart);
            canvas.removeEventListener('mouseup', this.handlePointerEnd);
            canvas.removeEventListener('touchstart', this.handlePointerStart);
            canvas.removeEventListener('touchmove', this.handlePointerMove);
            canvas.removeEventListener('touchend', this.handlePointerEnd);
            canvas.removeEventListener('touchcancel', this.handlePointerEnd);
        }
        
        this.keys.clear();
        this.touches.clear();
    }
}
