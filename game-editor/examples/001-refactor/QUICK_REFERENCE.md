# 蛋蛋射击 - 技术要点速查

## 🚀 快速启动
```bash
cd gamelibs/001-refactor
python3 -m http.server 8080
# 访问 http://localhost:8080
```

## 📁 核心文件
| 文件 | 行数 | 主要功能 |
|------|------|----------|
| `src/utils/RootManager.js` | 2387 | 游戏核心管理器，所有主要功能 |
| `src/utils/GridManager.js` | 413 | 网格系统管理 |
| `src/scenes/TestScene.js` | 288 | 测试场景，支持Step1-8切换 |
| `src/test/Step7TestModule.js` | - | 最完整的游戏功能模块 |
| `src/test/Step8TestModule.js` | - | 高级功能扩展容器 |

## 🎮 测试模块功能
| Step | 状态 | 核心功能 |
|------|------|----------|
| Step1 | ✅ | 网格初始化、蛋对象创建 |
| Step2 | ✅ | 发射器、瞄准线、力度系统 |
| Step3 | ✅ | 基础物理、重力、反弹 |
| Step4 | ✅ | 进阶物理、复杂碰撞 |
| Step5 | ✅ | 发射对齐、网格放置 |
| Step6 | ✅ | 颜色匹配、消除标记 |
| Step7 | ✅ | 直接掉落、悬空检测、爆炸 |
| Step8 | 🆕 | 高级功能容器（待扩展） |

## 🔧 关键配置

### 网格配置
```javascript
config: {
    rows: 6,        // 网格行数
    cols: 8,        // 网格列数  
    eggRadius: 18,  // 蛋半径
    startX: -140,   // 网格起始X
    startY: -200    // 网格起始Y
}
```

### 物理配置
```javascript
physics: {
    gravity: 0.08,      // 重力（已优化）
    friction: 0.997,    // 摩擦力（已优化）
    bounceX: 0.9,       // X轴反弹
    bounceY: 0.8,       // Y轴反弹
}
```

### 发射速度（已优化）
```javascript
baseSpeed = maxDistance / 20;           // 基础速度（加倍）
powerMultiplier = 0.8 + (power * 1.2); // 力度影响
verticalBonus = 2.4;                    // 垂直发射加成
```

## 🎨 颜色配置
```javascript
colors: [
    0xFF0000,  // 红色
    0xFFFF00,  // 黄色
    0xFF69B4,  // 粉色
    0x0000FF,  // 蓝色
    0x00FF00,  // 绿色
    0x8A2BE2   // 紫色
]
```

## 🛠️ 核心方法

### RootManager 关键方法
```javascript
// 场景创建
createBubbleGameScene(scene, config)

// 发射系统
handleProjectileFiring(projectile, velocity)
snapProjectileToGrid(projectile, gridManager)

// 消除系统
findConnectedEggs(gridManager, row, col, color)
processDirectFalling(gridManager, matches)

// 悬空检测（从底部向上）
findFloatingEggs(gridManager)
processFloatingEggsRecursively(gridManager)

// 动画效果
animateFallingEggs(eggs, onComplete)
createExplosionEffect(scene, x, y)
```

### GridManager 关键方法
```javascript
// 网格管理
placeEgg(row, col, egg)
removeEgg(row, col)
isEmpty(row, col)
getGridPosition(row, col)
clearAllEggs()
toggleGridDisplay()
```

## 🐛 已修复的关键问题

### 1. 网格尺寸访问错误
```javascript
// 错误写法
gridManager.rows / gridManager.cols

// 正确写法  
gridManager.config.rows / gridManager.config.cols
```

### 2. 悬空检测顺序优化
```javascript
// 从底部向上检测（优化后）
for (let row = gridManager.config.rows - 1; row >= 1; row--) {
    // 检测逻辑
}
```

### 3. 发射速度优化
```javascript
// 优化前：速度系数 /40
// 优化后：速度系数 /20 (加倍)
const baseSpeed = finalConfig.maxDistance / 20;
```

## 🎯 游戏流程

### 发射流程
1. 瞄准 → 2. 蓄力 → 3. 发射 → 4. 碰撞 → 5. 对齐

### 消除流程  
1. 颜色匹配 → 2. 数量判断(≥3) → 3. 直接掉落 → 4. 爆炸效果

### 悬空检测流程
1. 底部向上扫描 → 2. 支撑判断 → 3. 标记悬空 → 4. 连锁掉落

## 📱 调试工具

### 控制台命令
```javascript
// 手动悬空检测
rootManager.processFloatingEggsRecursively(gridManager)

// 切换网格显示
gridManager.toggleGridDisplay()

// 清空网格
gridManager.clearAllEggs()
```

### 日志分类
- **Step7**: 详细的悬空检测日志
- **RootManager**: 核心功能执行日志  
- **GridManager**: 网格操作日志

## 🚀 扩展指南

### 添加新的测试模块
1. 创建 `StepXTestModule.js` 继承 `BaseTestModule`
2. 在 `TestModuleManager.js` 注册模块
3. 在 `TestScene.js` 添加按钮映射
4. 在 `index.html` 引入脚本

### 添加新功能到RootManager
1. 在 `RootManager.js` 添加新方法
2. 在相应测试模块中调用测试
3. 添加配置参数到配置对象
4. 编写单元测试验证功能

## 📋 当前状态
- ✅ 核心泡泡龙功能完成
- ✅ 物理系统优化完成  
- ✅ 悬空检测问题修复
- ✅ Step8 容器创建完成
- 🎯 等待 Step8 具体功能需求

## 🔗 相关文档
- 📄 [完整报告](./GAME_SUMMARY_REPORT.md)
- 🎮 [在线演示](http://localhost:8080)
- 📁 [项目结构](./src/)
