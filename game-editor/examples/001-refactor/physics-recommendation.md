# 轻量级物理库推荐

## 当前游戏物理需求分析

### 现有问题
- 自制的物理系统在边界碰撞和泡泡碰撞检测上可能存在精度问题
- PhysicsManager.js 文件过于复杂，维护困难
- simulateBubbleMovement 方法使用 requestAnimationFrame 可能导致性能问题

### 物理需求
1. **圆形碰撞检测** - 泡泡与泡泡
2. **边界反弹** - 左右墙壁反弹
3. **直线运动** - 射击轨迹
4. **重力效果** - 粒子和掉落泡泡

## 推荐方案

### 1. SAT.js (最推荐) - ~15KB
- **优点**: 专注2D碰撞检测，API简单，性能优秀
- **适用**: 圆形碰撞检测完全满足需求
- **CDN**: https://cdnjs.cloudflare.com/ajax/libs/sat/0.9.0/SAT.min.js

```javascript
// 使用示例
const V = SAT.Vector;
const C = SAT.Circle;

// 创建两个圆形
const circle1 = new C(new V(100, 100), 20);
const circle2 = new C(new V(120, 120), 20);

// 检测碰撞
const collision = SAT.testCircleCircle(circle1, circle2);
```

### 2. P2.js (功能丰富) - ~150KB
- **优点**: 功能完整，支持约束、弹簧等高级功能
- **缺点**: 相对较大，可能过度设计
- **适用**: 如果未来需要复杂物理效果

### 3. Planck.js - ~100KB
- **优点**: Box2D的JavaScript移植，性能好
- **缺点**: API相对复杂
- **适用**: 需要高性能物理仿真

### 4. 自定义轻量解决方案 - ~5KB
- **优点**: 最轻量，完全定制
- **缺点**: 需要自己实现和维护
- **适用**: 当前项目最佳选择

## 建议实施方案

### 方案A: 使用SAT.js (推荐)
```html
<!-- 在 index.html 中添加 -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/sat/0.9.0/SAT.min.js"></script>
```

### 方案B: 轻量自定义物理引擎
创建一个简化的物理系统，替换现有的 PhysicsManager.js:

```javascript
// SimplePhysics.js - 约5KB
class SimplePhysics {
    // 圆形碰撞检测
    static circleCollision(x1, y1, r1, x2, y2, r2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < (r1 + r2);
    }
    
    // 边界反弹
    static bounceOffWalls(bubble, bounds) {
        if (bubble.x - bubble.radius <= bounds.left || 
            bubble.x + bubble.radius >= bounds.right) {
            bubble.velocity.x *= -1;
        }
    }
}
```

## 实施建议

1. **立即方案**: 先用自定义轻量物理引擎替换现有系统
2. **后续优化**: 如果需要更复杂物理效果，再考虑SAT.js
3. **性能优先**: 避免使用requestAnimationFrame，改用PIXI的ticker系统

## 下一步行动

1. 要不要我帮你实现一个轻量级的自定义物理引擎？
2. 或者你更倾向于集成SAT.js？
3. 还是想看看其他选项？
