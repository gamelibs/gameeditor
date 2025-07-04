// 射手类（门将）
class Shooter extends PIXI.Container {
    constructor(game) {
        super();
        
        this.game = game;
        this.currentBubble = null;
        this.nextBubble = null;
        this.aimLine = null;
        this.isAiming = false;
        this.shootDirection = { x: 0, y: -1 };
        
        this.init();
    }
    
    init() {
        this.createShooter();
        this.createAimLine();
        this.loadNextBubble();
        this.setupEvents();
        
        // 设置位置（屏幕底部中央）
        this.x = GAME_CONFIG.WIDTH / 2;
        this.y = GAME_CONFIG.HEIGHT - 80;
    }
    
    createShooter() {
        // 创建门将射手
        this.shooterSprite = new PIXI.Graphics();
        
        // 门将身体
        this.shooterSprite.beginFill(0x32CD32); // 绿色球衣
        this.shooterSprite.drawRect(-30, -40, 60, 80);
        this.shooterSprite.endFill();
        
        // 门将手套
        this.shooterSprite.beginFill(0xFFD700); // 金色手套
        this.shooterSprite.drawCircle(-25, -20, 8);
        this.shooterSprite.drawCircle(25, -20, 8);
        this.shooterSprite.endFill();
        
        // 门将头部
        this.shooterSprite.beginFill(0xFFDBB3); // 肤色
        this.shooterSprite.drawCircle(0, -35, 12);
        this.shooterSprite.endFill();
        
        // 门将眼睛
        this.shooterSprite.beginFill(0x000000);
        this.shooterSprite.drawCircle(-4, -38, 2);
        this.shooterSprite.drawCircle(4, -38, 2);
        this.shooterSprite.endFill();
        
        // 号码
        const numberText = new PIXI.Text('1', {
            fontFamily: 'Arial',
            fontSize: 24,
            fill: 0xFFFFFF,
            fontWeight: 'bold'
        });
        numberText.anchor.set(0.5);
        numberText.y = -10;
        
        this.shooterSprite.addChild(numberText);
        this.addChild(this.shooterSprite);
        
        // 射手底座（草地）
        this.base = new PIXI.Graphics();
        this.base.beginFill(0x228B22);
        this.base.drawEllipse(0, 20, 40, 15);
        this.base.endFill();
        
        // 草地纹理
        this.base.lineStyle(1, 0x32CD32, 0.5);
        for (let i = 0; i < 20; i++) {
            const x = Math.random() * 80 - 40;
            const y = Math.random() * 10 + 15;
            this.base.moveTo(x, y);
            this.base.lineTo(x + Math.random() * 6 - 3, y + Math.random() * 4 - 2);
        }
        
        this.addChild(this.base);
    }
    
    createAimLine() {
        this.aimLine = new PIXI.Graphics();
        this.aimLine.visible = false;
        this.addChild(this.aimLine);
    }
    
    loadNextBubble() {
        // 将下一个泡泡设为当前泡泡
        if (this.nextBubble) {
            this.currentBubble = this.nextBubble;
            this.currentBubble.x = 0;
            this.currentBubble.y = -50;
        } else {
            this.currentBubble = this.createRandomBubble();
            this.currentBubble.x = 0;
            this.currentBubble.y = -50;
            this.addChild(this.currentBubble);
        }
        
        // 生成新的下一个泡泡
        this.nextBubble = this.createRandomBubble();
        this.nextBubble.x = 50;
        this.nextBubble.y = -50;
        this.nextBubble.scale.set(0.7); // 稍小一些
        this.addChild(this.nextBubble);
        
        // 添加预览标签
        if (!this.nextLabel) {
            this.nextLabel = new PIXI.Text('下一个', {
                fontFamily: 'Arial',
                fontSize: 12,
                fill: 0xFFFFFF
            });
            this.nextLabel.anchor.set(0.5);
            this.nextLabel.x = 50;
            this.nextLabel.y = -80;
            this.addChild(this.nextLabel);
        }
    }
    
    createRandomBubble() {
        const colors = GAME_CONFIG.BUBBLE_COLORS;
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        // 使用RootManager的公共蛋形方法
        const bubble = window.rootManager.createEggShape(0, 0, 32, 40, color, true);
        
        // 添加Bubble类的属性以保持兼容性
        bubble.bubbleColor = color;
        bubble.velocity = { x: 0, y: 0 };
        bubble.isMoving = false;
        
        return bubble;
    }
    
    setupEvents() {
        // 监听鼠标/触摸事件
        this.game.app.view.addEventListener('mousemove', this.onPointerMove.bind(this));
        this.game.app.view.addEventListener('touchmove', this.onPointerMove.bind(this));
        this.game.app.view.addEventListener('mousedown', this.onPointerDown.bind(this));
        this.game.app.view.addEventListener('touchstart', this.onPointerDown.bind(this));
        this.game.app.view.addEventListener('mouseup', this.onPointerUp.bind(this));
        this.game.app.view.addEventListener('touchend', this.onPointerUp.bind(this));
    }
    
    onPointerMove(event) {
        if (!this.currentBubble || this.currentBubble.isMoving) {
            return;
        }
        
        const rect = this.game.app.view.getBoundingClientRect();
        const clientX = event.clientX || (event.touches && event.touches[0].clientX);
        const clientY = event.clientY || (event.touches && event.touches[0].clientY);
        
        const x = (clientX - rect.left) * (GAME_CONFIG.WIDTH / rect.width);
        const y = (clientY - rect.top) * (GAME_CONFIG.HEIGHT / rect.height);
        
        this.updateAim(x, y);
    }
    
    onPointerDown(event) {
        if (!this.currentBubble || this.currentBubble.isMoving) {
            return;
        }
        
        this.isAiming = true;
        this.aimLine.visible = true;
        
        // 门将准备射击动画
        this.shooterSprite.scale.set(1.1);
    }
    
    onPointerUp(event) {
        if (!this.currentBubble || this.currentBubble.isMoving || !this.isAiming) {
            return;
        }
        
        this.shoot();
        this.isAiming = false;
        this.aimLine.visible = false;
        
        // 恢复门将大小
        this.shooterSprite.scale.set(1.0);
    }
    
    updateAim(targetX, targetY) {
        const shooterX = this.x;
        const shooterY = this.y - 50;
        
        // 计算射击方向
        const dx = targetX - shooterX;
        const dy = targetY - shooterY;
        const length = Math.sqrt(dx * dx + dy * dy);
        
        if (length > 0) {
            this.shootDirection.x = dx / length;
            this.shootDirection.y = dy / length;
        }
        
        // 限制射击角度（不能向下射击）
        if (this.shootDirection.y > -0.1) {
            this.shootDirection.y = -0.1;
            const length = Math.sqrt(this.shootDirection.x * this.shootDirection.x + this.shootDirection.y * this.shootDirection.y);
            this.shootDirection.x /= length;
            this.shootDirection.y /= length;
        }
        
        // 更新瞄准线
        this.updateAimLine();
        
        // 旋转当前泡泡指向目标
        if (this.currentBubble) {
            const angle = Math.atan2(this.shootDirection.y, this.shootDirection.x);
            this.currentBubble.rotation = angle + Math.PI / 2;
        }
    }
    
    updateAimLine() {
        if (!this.isAiming) {
            return;
        }
        
        this.aimLine.clear();
        this.aimLine.lineStyle(3, 0xFFD700, 0.8);
        
        // 绘制虚线瞄准线
        const startX = 0;
        const startY = -50;
        const segments = 10;
        const segmentLength = 30;
        
        for (let i = 0; i < segments; i++) {
            const x1 = startX + this.shootDirection.x * (i * segmentLength * 2);
            const y1 = startY + this.shootDirection.y * (i * segmentLength * 2);
            const x2 = startX + this.shootDirection.x * (i * segmentLength * 2 + segmentLength);
            const y2 = startY + this.shootDirection.y * (i * segmentLength * 2 + segmentLength);
            
            // 停止绘制如果超出屏幕
            if (y1 < -GAME_CONFIG.HEIGHT) {
                break;
            }
            
            this.aimLine.moveTo(x1, y1);
            this.aimLine.lineTo(x2, y2);
        }
    }
    
    shoot() {
        if (!this.currentBubble || this.currentBubble.isMoving) {
            return;
        }
        
        // 门将射击动画
        this.playShootAnimation();
        
        // 发射泡泡
        const bubble = this.currentBubble;
        bubble.velocity.x = this.shootDirection.x * GAME_CONFIG.PHYSICS.SHOOTING_SPEED;
        bubble.velocity.y = this.shootDirection.y * GAME_CONFIG.PHYSICS.SHOOTING_SPEED;
        bubble.isMoving = true;
        
        // 从射手中移除泡泡
        this.removeChild(bubble);
        
        // 发射事件
        this.game.emit(EVENTS.BUBBLE_SHOT, {
            bubble: bubble,
            direction: this.shootDirection
        });
        
        // 加载下一个泡泡
        this.currentBubble = null;
        setTimeout(() => {
            this.loadNextBubble();
        }, 300);
    }
    
    playShootAnimation() {
        // 门将踢球动画
        const originalRotation = this.shooterSprite.rotation;
        
        // 向射击方向倾斜
        const kickAngle = Math.atan2(this.shootDirection.y, this.shootDirection.x) * 0.2;
        this.shooterSprite.rotation = kickAngle;
        
        // 恢复原始位置
        setTimeout(() => {
            this.shooterSprite.rotation = originalRotation;
        }, 200);
        
        // 手套发光效果
        const glowEffect = new PIXI.Graphics();
        glowEffect.beginFill(0xFFD700, 0.5);
        glowEffect.drawCircle(-25, -20, 12);
        glowEffect.drawCircle(25, -20, 12);
        glowEffect.endFill();
        
        this.shooterSprite.addChild(glowEffect);
        
        setTimeout(() => {
            this.shooterSprite.removeChild(glowEffect);
        }, 300);
    }
    
    // 切换当前泡泡和下一个泡泡
    swapBubbles() {
        if (!this.currentBubble || !this.nextBubble || this.currentBubble.isMoving) {
            return;
        }
        
        // 交换位置和大小
        const tempX = this.currentBubble.x;
        const tempY = this.currentBubble.y;
        const tempScale = this.currentBubble.scale.x;
        
        this.currentBubble.x = this.nextBubble.x;
        this.currentBubble.y = this.nextBubble.y;
        this.currentBubble.scale.set(this.nextBubble.scale.x);
        
        this.nextBubble.x = tempX;
        this.nextBubble.y = tempY;
        this.nextBubble.scale.set(tempScale);
        
        // 交换引用
        const temp = this.currentBubble;
        this.currentBubble = this.nextBubble;
        this.nextBubble = temp;
    }
    
    getCurrentBubbleColor() {
        return this.currentBubble ? this.currentBubble.bubbleColor : null;
    }
    
    getNextBubbleColor() {
        return this.nextBubble ? this.nextBubble.bubbleColor : null;
    }
    
    // 重置射手
    reset() {
        if (this.currentBubble) {
            this.removeChild(this.currentBubble);
            this.currentBubble.destroy();
        }
        
        if (this.nextBubble) {
            this.removeChild(this.nextBubble);
            this.nextBubble.destroy();
        }
        
        this.currentBubble = null;
        this.nextBubble = null;
        this.isAiming = false;
        this.aimLine.visible = false;
        
        this.loadNextBubble();
    }
}
