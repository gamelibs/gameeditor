// 资源加载器
class AssetLoader extends PIXI.utils.EventEmitter {
    constructor() {
        super();
        this.loader = null;
        this.totalAssets = 0;
        this.loadedAssets = 0;
    }
    
    // 加载所有资源
    loadAssets() {
        return new Promise((resolve, reject) => {
            // 跳过外部资源加载，直接使用程序生成的纹理
            console.log('使用程序生成的纹理，跳过外部资源加载');
            
            // 模拟加载进度
            let progress = 0;
            const progressInterval = setInterval(() => {
                progress += 0.1;
                this.emit('progress', progress);
                
                if (progress >= 1) {
                    clearInterval(progressInterval);
                    this.emit('complete');
                    resolve({});
                }
            }, 100);
        });
    }
    
    // 创建蛋形主题的泡泡纹理
    createBubbleTextures() {
        const bubbleTextures = {};
        const colors = GAME_CONFIG.BUBBLE_COLORS;
        const colorNames = ['red', 'blue', 'yellow', 'green', 'orange', 'purple'];
        
        colors.forEach((color, index) => {
            // 使用RootManager的统一蛋形方法
            const eggShape = window.rootManager.createEggShape(0, 0, 32, 40, color, true);
            
            // 转换为纹理
            bubbleTextures[colorNames[index]] = PIXI.RenderTexture.create({
                width: 46,
                height: 46
            });
        });
        
        return bubbleTextures;
    }
    
    // 创建射手纹理
    createShooterTexture() {
        const graphics = new PIXI.Graphics();
        
        // 射手身体
        graphics.beginFill(0x4A90E2);
        graphics.drawRect(0, 0, 60, 80);
        graphics.endFill();
        
        // 射手装备
        graphics.beginFill(0xFFD700);
        graphics.drawCircle(10, 20, 8);
        graphics.drawCircle(50, 20, 8);
        graphics.endFill();
        
        // 射手头部
        graphics.beginFill(0xFFDBB3);
        graphics.drawCircle(30, 15, 12);
        graphics.endFill();
        
        const texture = PIXI.RenderTexture.create({ width: 60, height: 80 });
        return texture;
    }
    
    // 创建背景纹理
    createBackgroundTexture() {
        const graphics = new PIXI.Graphics();
        
        // 自然背景
        graphics.beginFill(0x87CEEB);
        graphics.drawRect(0, 0, GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT);
        graphics.endFill();
        
        // 装饰线条
        graphics.lineStyle(3, 0xFFFFFF, 0.5);
        
        // 装饰性几何图案
        graphics.moveTo(0, GAME_CONFIG.HEIGHT / 2);
        graphics.lineTo(GAME_CONFIG.WIDTH, GAME_CONFIG.HEIGHT / 2);
        
        // 装饰圆形
        graphics.drawCircle(GAME_CONFIG.WIDTH / 2, GAME_CONFIG.HEIGHT / 2, 80);
        
        // 边界装饰
        graphics.drawRoundedRect(50, 50, GAME_CONFIG.WIDTH - 100, GAME_CONFIG.HEIGHT - 100, 20);
        
        const texture = PIXI.RenderTexture.create({
            width: GAME_CONFIG.WIDTH,
            height: GAME_CONFIG.HEIGHT
        });
        
        return texture;
    }
    
    getProgress() {
        return this.loadedAssets / this.totalAssets;
    }
}
