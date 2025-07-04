// 游戏场景
class GameScene extends PIXI.Container {
    constructor(game) {
        super();
        
        this.game = game;
        this.grid = null;
        this.shooter = null;
        this.ui = null;
        this.audioManager = null;
        this.inputManager = null;
        
        this.score = 0;
        this.level = 1;
        this.isGameActive = false;
        this.refillTimer = 0;
        this.refillInterval = GAME_CONFIG.GAMEPLAY.REFILL_TIME_BASE;
        
        this.init();
    }
    
    init() {
        this.createBackground();
        this.createGame();
        this.createUI();
        this.setupSystems();
        this.setupEvents();
    }
    
    createBackground() {
        // 游戏背景
        this.background = new PIXI.Graphics();
        
        // 草地
        this.background.beginFill(0x228B22);
        this.background.drawRect(0, 0, GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT);
        this.background.endFill();
        
        // 球场标线
        this.background.lineStyle(3, 0xFFFFFF, 0.8);
        
        // 边界线
        this.background.drawRect(20, 20, GAME_CONFIG.WIDTH - 40, GAME_CONFIG.HEIGHT - 40);
        
        // 中线
        this.background.moveTo(20, GAME_CONFIG.HEIGHT / 2);
        this.background.lineTo(GAME_CONFIG.WIDTH - 20, GAME_CONFIG.HEIGHT / 2);
        
        // 中圈
        this.background.drawCircle(GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT / 2, 60);
        
        // 球门区域
        this.background.drawRect(GAME_CONFIG.WIDTH / 2 - 80, 20, 160, 50);
        this.background.drawRect(GAME_CONFIG.WIDTH / 2 - 80, GAME_CONFIG.HEIGHT - 70, 160, 50);
        
        // 草地纹理
        this.background.lineStyle(1, 0x32CD32, 0.3);
        for (let i = 0; i < 200; i++) {
            const x = Math.random() * GAME_CONFIG.WIDTH;
            const y = Math.random() * GAME_CONFIG.HEIGHT;
            this.background.moveTo(x, y);
            this.background.lineTo(x + Math.random() * 10 - 5, y + Math.random() * 5 - 2.5);
        }
        
        this.addChild(this.background);
    }
    
    createGame() {
        // 创建游戏网格
        this.grid = new Grid(this.game);
        this.grid.x = (GAME_CONFIG.WIDTH - this.grid.width * this.grid.cellWidth) / 2;
        this.grid.y = 100;
        this.addChild(this.grid);
        
        // 创建射手
        this.shooter = new Shooter(this.game);
        this.addChild(this.shooter);
    }
    
    createUI() {
        this.ui = new PIXI.Container();
        
        // 分数显示
        this.scoreText = new PIXI.Text('分数: 0', {
            fontFamily: 'Arial',
            fontSize: 24,
            fill: 0xFFFFFF,
            fontWeight: 'bold',
            stroke: 0x000000,
            strokeThickness: 2
        });
        this.scoreText.x = 20;
        this.scoreText.y = 20;
        this.ui.addChild(this.scoreText);
        
        // 关卡显示
        this.levelText = new PIXI.Text('关卡: 1', {
            fontFamily: 'Arial',
            fontSize: 20,
            fill: 0xFFD700,
            fontWeight: 'bold',
            stroke: 0x000000,
            strokeThickness: 2
        });
        this.levelText.x = 20;
        this.levelText.y = 50;
        this.ui.addChild(this.levelText);
        
        // 时间条背景
        this.timeBarBg = new PIXI.Graphics();
        this.timeBarBg.beginFill(0x000000, 0.5);
        this.timeBarBg.drawRoundedRect(0, 0, 200, 10, 5);
        this.timeBarBg.endFill();
        this.timeBarBg.x = GAME_CONFIG.WIDTH - 220;
        this.timeBarBg.y = 30;
        this.ui.addChild(this.timeBarBg);
        
        // 时间条
        this.timeBar = new PIXI.Graphics();
        this.timeBar.x = this.timeBarBg.x;
        this.timeBar.y = this.timeBarBg.y;
        this.ui.addChild(this.timeBar);
        
        // 时间标签
        this.timeLabel = new PIXI.Text('新行时间', {
            fontFamily: 'Arial',
            fontSize: 14,
            fill: 0xFFFFFF
        });
        this.timeLabel.x = GAME_CONFIG.WIDTH - 220;
        this.timeLabel.y = 10;
        this.ui.addChild(this.timeLabel);
        
        // 暂停按钮
        this.pauseButton = this.createButton('⏸', GAME_CONFIG.WIDTH - 50, 70, () => {
            this.game.pause();
        });
        this.ui.addChild(this.pauseButton);
        
        this.addChild(this.ui);
    }
    
    createButton(text, x, y, onClick) {
        const button = new PIXI.Container();
        
        const bg = new PIXI.Graphics();
        bg.beginFill(0x4169E1, 0.8);
        bg.drawCircle(0, 0, 20);
        bg.endFill();
        
        const buttonText = new PIXI.Text(text, {
            fontFamily: 'Arial',
            fontSize: 20,
            fill: 0xFFFFFF
        });
        buttonText.anchor.set(0.5);
        
        button.addChild(bg);
        button.addChild(buttonText);
        button.x = x;
        button.y = y;
        
        button.interactive = true;
        button.buttonMode = true;
        button.on('pointerdown', () => {
            // 播放按钮点击音效 - 已禁用
            // this.audioManager.playButton();
            onClick();
        });
        
        return button;
    }
    
    setupSystems() {
        // 音频管理器
        this.audioManager = new AudioManager();
        this.game.audioManager = this.audioManager;
        
        // 输入管理器
        this.inputManager = new InputManager(this.game);
        this.game.inputManager = this.inputManager;
    }
    
    setupEvents() {
        // 监听泡泡射击事件
        this.game.on(EVENTS.BUBBLE_SHOT, this.onBubbleShot.bind(this));
        
        // 游戏循环
        this.game.app.ticker.add(this.update.bind(this));
    }
    
    onBubbleShot(data) {
        const { bubble, direction } = data;
        
        // 播放射击音效
        // this.audioManager.playShoot();
        
        // 将泡泡添加到场景中进行物理模拟
        this.addChild(bubble);
        
        // 开始泡泡移动模拟
        this.simulateBubbleMovement(bubble, direction);
    }
    
    simulateBubbleMovement(bubble, direction) {
        const speed = GAME_CONFIG.PHYSICS.SHOOTING_SPEED;
        let velocityX = direction.x * speed;
        let velocityY = direction.y * speed;
        
        const animate = () => {
            if (!bubble || !bubble.parent) return;
            
            // 更新位置
            bubble.x += velocityX;
            bubble.y += velocityY;
            
            // 检查边界碰撞
            const radius = bubble.radius;
            
            // 左右边界
            if (bubble.x - radius <= this.grid.x || 
                bubble.x + radius >= this.grid.x + this.grid.width * this.grid.cellWidth) {
                velocityX = -velocityX;
                // this.audioManager.playHit(); // 使用碰撞音效而不是爆炸音效
            }
            
            // 顶部边界
            if (bubble.y - radius <= this.grid.y) {
                velocityY = Math.abs(velocityY);
            }
            
            // 检查与现有泡泡的碰撞
            const collision = this.checkBubbleCollision(bubble);
            if (collision) {
                this.handleBubbleCollision(bubble, collision);
                return;
            }
            
            // 继续动画
            requestAnimationFrame(animate);
        };
        
        animate();
    }
    
    checkBubbleCollision(movingBubble) {
        // 优化的碰撞检测 - 只检查附近区域而不是全部网格
        const gridX = movingBubble.x - this.grid.x;
        const gridY = movingBubble.y - this.grid.y;
        
        // 计算当前泡泡所在的大概网格位置
        const cellCol = Math.floor(gridX / this.grid.cellWidth);
        const cellRow = Math.floor(gridY / this.grid.cellHeight);
        
        // 只检查周围3x3的区域，大幅提升性能
        for (let row = Math.max(0, cellRow - 1); row <= Math.min(this.grid.bubbles.length - 1, cellRow + 1); row++) {
            for (let col = Math.max(0, cellCol - 1); col <= Math.min(this.grid.getRowWidth(row) - 1, cellCol + 1); col++) {
                const staticBubble = this.grid.getBubble(col, row);
                if (staticBubble && staticBubble !== movingBubble) {
                    // 使用平方距离避免开平方根运算，提升性能
                    const dx = gridX - staticBubble.x;
                    const dy = gridY - staticBubble.y;
                    const distanceSquared = dx * dx + dy * dy;
                    const radiusSum = movingBubble.radius + staticBubble.radius;
                    
                    if (distanceSquared <= radiusSum * radiusSum) {
                        return { col, row, bubble: staticBubble };
                    }
                }
            }
        }
        return null;
    }
    
    handleBubbleCollision(movingBubble, collision) {
        // 移除移动中的泡泡
        this.removeChild(movingBubble);
        
        // 找到最佳放置位置
        const gridPos = MathUtils.pixelToHex(
            movingBubble.x - this.grid.x,
            movingBubble.y - this.grid.y,
            this.grid.cellWidth,
            this.grid.cellHeight
        );
        
        const position = this.grid.findNearestEmptyPosition(gridPos.col, gridPos.row);
        if (position) {
            // 将泡泡添加到网格
            const newBubble = this.grid.addBubble(position.col, position.row, movingBubble.bubbleColor);
            
            if (newBubble) {
                // 检查匹配
                this.checkMatches(position.col, position.row, movingBubble.bubbleColor);
            }
        }
        
        // 清理移动的泡泡
        movingBubble.destroy();
    }
    
    checkMatches(col, row, color) {
        const matches = this.grid.findMatches(col, row, color);
        
        if (matches.length >= GAME_CONFIG.GAMEPLAY.MIN_MATCH_COUNT) {
            // 播放匹配音效 - 已禁用
            // this.audioManager.playMatch();
            
            // 移除匹配的泡泡
            const removedBubbles = this.grid.removeMatches(matches);
            
            // 计算分数
            const points = removedBubbles.length * GAME_CONFIG.GAMEPLAY.POINTS_PER_BUBBLE;
            this.addScore(points);
            
            // 检查悬空泡泡
            setTimeout(() => {
                this.checkFloatingBubbles();
            }, 300);
        }
        
        // 检查游戏状态
        setTimeout(() => {
            this.checkGameState();
        }, 500);
    }
    
    checkFloatingBubbles() {
        const floating = this.grid.findFloatingBubbles();
        
        if (floating.length > 0) {
            // 移除悬空泡泡
            const removedBubbles = this.grid.removeFloatingBubbles(floating);
            
            // 额外分数
            const bonusPoints = removedBubbles.length * GAME_CONFIG.GAMEPLAY.POINTS_PER_BUBBLE * 0.5;
            this.addScore(bonusPoints);
        }
    }
    
    checkGameState() {
        if (this.grid.isGameOver()) {
            this.gameOver();
        } else if (this.grid.isVictory()) {
            this.levelComplete();
        }
    }
    
    addScore(points) {
        this.score += points;
        this.scoreText.text = `分数: ${this.score}`;
        this.game.addScore(points);
    }
    
    levelComplete() {
        this.level++;
        this.levelText.text = `关卡: ${this.level}`;
        this.game.nextLevel();
        
        // 播放胜利音效 - 已禁用
        // this.audioManager.playVictory();
        
        // 生成新关卡
        this.grid.clear();
        this.grid.generateInitialBubbles();
        
        // 增加难度
        this.refillInterval = Math.max(5000, this.refillInterval - 1000);
    }
    
    gameOver() {
        this.isGameActive = false;
        // 播放游戏结束音效 - 已禁用
        // this.audioManager.playGameOver();
        
        // 保存最高分
        const highScore = parseInt(localStorage.getItem('eggBubbleHighScore') || '0');
        if (this.score > highScore) {
            localStorage.setItem('eggBubbleHighScore', this.score.toString());
        }
        
        // 显示游戏结束界面
        this.showGameOverScreen();
    }
    
    showGameOverScreen() {
        const gameOverContainer = new PIXI.Container();
        
        // 半透明背景
        const overlay = new PIXI.Graphics();
        overlay.beginFill(0x000000, 0.7);
        overlay.drawRect(0, 0, GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT);
        overlay.endFill();
        gameOverContainer.addChild(overlay);
        
        // 游戏结束文本
        const gameOverText = new PIXI.Text('游戏结束', {
            fontFamily: 'Arial',
            fontSize: 48,
            fill: 0xFF0000,
            fontWeight: 'bold',
            stroke: 0xFFFFFF,
            strokeThickness: 3
        });
        gameOverText.anchor.set(0.5);
        gameOverText.x = GAME_CONFIG.WIDTH / 2;
        gameOverText.y = GAME_CONFIG.HEIGHT / 2 - 100;
        gameOverContainer.addChild(gameOverText);
        
        // 最终分数
        const finalScoreText = new PIXI.Text(`最终分数: ${this.score}`, {
            fontFamily: 'Arial',
            fontSize: 32,
            fill: 0xFFFFFF,
            fontWeight: 'bold'
        });
        finalScoreText.anchor.set(0.5);
        finalScoreText.x = GAME_CONFIG.WIDTH / 2;
        finalScoreText.y = GAME_CONFIG.HEIGHT / 2 - 30;
        gameOverContainer.addChild(finalScoreText);
        
        // 重新开始按钮
        const restartButton = this.createButton('重新开始', GAME_CONFIG.WIDTH / 2 - 80, GAME_CONFIG.HEIGHT / 2 + 40, () => {
            this.restart();
        });
        gameOverContainer.addChild(restartButton);
        
        // 返回菜单按钮
        const menuButton = this.createButton('返回菜单', GAME_CONFIG.WIDTH / 2 + 80, GAME_CONFIG.HEIGHT / 2 + 40, () => {
            this.game.emit('scene_change', 'menu');
        });
        gameOverContainer.addChild(menuButton);
        
        this.addChild(gameOverContainer);
        this.gameOverScreen = gameOverContainer;
    }
    
    update(deltaTime) {
        if (!this.isGameActive) return;
        
        // 更新补充计时器
        this.refillTimer += deltaTime * 16.67; // 转换为毫秒
        
        if (this.refillTimer >= this.refillInterval) {
            this.addNewRow();
            this.refillTimer = 0;
        }
        
        // 更新时间条
        const progress = this.refillTimer / this.refillInterval;
        this.updateTimeBar(progress);
    }
    
    updateTimeBar(progress) {
        const width = 200 * progress;
        const color = progress > 0.8 ? 0xFF0000 : progress > 0.6 ? 0xFFFF00 : 0x00FF00;
        
        this.timeBar.clear();
        this.timeBar.beginFill(color);
        this.timeBar.drawRoundedRect(0, 0, width, 10, 5);
        this.timeBar.endFill();
    }
    
    addNewRow() {
        // 播放新行补充音效 - 已禁用
        // this.audioManager.playRefill();
        this.grid.addNewRow();
        
        // 检查游戏是否结束
        setTimeout(() => {
            this.checkGameState();
        }, 100);
    }
    
    restart() {
        // 清理游戏结束界面
        if (this.gameOverScreen) {
            this.removeChild(this.gameOverScreen);
            this.gameOverScreen = null;
        }
        
        // 重置游戏状态
        this.score = 0;
        this.level = 1;
        this.refillTimer = 0;
        this.refillInterval = GAME_CONFIG.GAMEPLAY.REFILL_TIME_BASE;
        this.isGameActive = true;
        
        // 重置UI
        this.scoreText.text = '分数: 0';
        this.levelText.text = '关卡: 1';
        
        // 重置网格和射手
        this.grid.clear();
        this.grid.generateInitialBubbles();
        this.shooter.reset();
        
        // 重置游戏对象
        this.game.resetScore();
        this.game.resetLevel();
    }
    
    onEnter() {
        this.visible = true;
        this.isGameActive = true;
        
        // 如果是新游戏，重置状态
        if (this.score === 0) {
            this.restart();
        }
    }
    
    onExit() {
        this.visible = false;
        this.isGameActive = false;
    }
    
    destroy() {
        if (this.audioManager) {
            this.audioManager.destroy();
        }
        
        if (this.inputManager) {
            this.inputManager.destroy();
        }
        
        super.destroy();
    }
}