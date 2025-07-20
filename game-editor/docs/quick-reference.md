# 编辑器界面快速参考

## 🚀 快速启动

```bash
cd game-editor
npm install
npm run dev
```

访问：http://localhost:5175

## 📁 核心文件

| 文件 | 职责 | 关键功能 |
|------|------|----------|
| `index.html` | HTML结构 | 基础容器元素 |
| `src/main.ts` | 应用入口 | 初始化流程、错误处理 |
| `src/style.css` | 全局样式 | CSS变量、基础重置 |
| `src/core/EventBus.ts` | 事件系统 | 组件间通信 |
| `src/core/EditorCore.ts` | 编辑器核心 | LiteGraph集成 |
| `src/ui/UIManager.ts` | UI管理器 | 组件生命周期 |
| `src/utils/ZIndexManager.ts` | 层级管理 | z-index统一管理 |

## 🎨 UI组件

### 面板组件 (src/ui/panels/)

| 组件 | 功能 | 位置 |
|------|------|------|
| `TopbarPanel` | 主工具栏 | 顶部固定 |
| `NodeEditorPanel` | 节点编辑器 | 主要区域 |
| `NodeLibraryPanel` | 节点库 | 左侧滑出 |
| `FloatingGamePreview` | 游戏预览 | 右侧浮动 |

### 独立组件 (src/ui/components/)

| 组件 | 功能 | 位置 |
|------|------|------|
| `FloatingPreviewButton` | 预览控制按钮 | 右下角 |

## 🔧 开发指南

### 创建新面板

```typescript
// 1. 继承BasePanel
export class MyPanel extends BasePanel {
  constructor(eventBus: EventBus) {
    super(eventBus, 'my-panel-id');
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    // 注入样式
    this.injectStyles();
    
    // 创建内容
    this.createContent();
    
    // 设置事件
    this.setupEventListeners();
    
    this.isInitialized = true;
  }

  private injectStyles() {
    const style = document.createElement('style');
    style.id = 'my-panel-styles';
    style.textContent = `/* 样式 */`;
    document.head.appendChild(style);
  }
}

// 2. 在UIManager中注册
this.panels.set('myPanel', new MyPanel(this.eventBus));
```

### 事件通信

```typescript
// 发送事件
this.eventBus.emit('my-event', { data: 'value' });

// 监听事件
this.eventBus.on('my-event', (data) => {
  console.log('收到事件:', data);
});
```

### 样式规范

```css
/* 使用组件前缀 */
.my-panel-container {
  /* 基础样式 */
}

/* 重要样式使用!important */
.my-panel-critical {
  display: flex !important;
  z-index: 2000 !important;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .my-panel-container {
    /* 移动端样式 */
  }
}
```

## 🛡️ 层级管理

### Z-Index层级

```typescript
// 获取组件z-index
const zIndex = ZIndexManager.getZIndex('FLOATING.PANELS');

// 设置元素z-index
ZIndexManager.setZIndex(element, 'FLOATING.PANELS');

// 创建样式规则
const rule = ZIndexManager.createStyleRule(
  '.my-component', 
  'FLOATING.PANELS',
  'position: fixed;'
);
```

### 层级规划

| 层级 | 范围 | 用途 |
|------|------|------|
| 基础层 | 0-999 | 基础UI组件 |
| 编辑器层 | 1000-1999 | 核心编辑器组件 |
| 浮动层 | 2000-9999 | 浮动面板和按钮 |
| LiteGraph层 | 10000-10999 | LiteGraph组件 |
| 系统层 | 11000+ | 系统级弹窗 |

## 🧪 调试工具

### 浏览器控制台

```javascript
// 全局编辑器对象
window.editor

// 验证层级
window.editor.ZIndexManager.validateZIndexLayers();

// 修复topbar
window.editor.ZIndexManager.fixTopbarVisibility();

// 查看面板状态
window.editor.uiManager.getAllPanelStates();

// 发送测试事件
window.editor.eventBus.emit('test', { msg: 'hello' });
```

### 常见问题

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| Topbar消失 | z-index冲突 | `ZIndexManager.fixTopbarVisibility()` |
| 样式冲突 | 全局样式污染 | 使用组件前缀和!important |
| 事件不响应 | 监听器未注册 | 检查事件名称和监听器 |
| 组件重叠 | 层级设置错误 | 使用ZIndexManager设置正确层级 |

## 📱 响应式设计

### 断点设置

```css
/* 移动端 */
@media (max-width: 768px) {
  /* 移动端样式 */
}

/* 平板端 */
@media (min-width: 769px) and (max-width: 1024px) {
  /* 平板端样式 */
}

/* 桌面端 */
@media (min-width: 1025px) {
  /* 桌面端样式 */
}
```

### 布局适配

```typescript
// 检测设备类型
const isMobile = window.innerWidth <= 768;

// 响应式调整
private adjustForMobile() {
  if (window.innerWidth <= 768) {
    // 移动端逻辑
  } else {
    // 桌面端逻辑
  }
}

// 监听窗口变化
window.addEventListener('resize', () => {
  this.adjustForMobile();
});
```

## 🔍 性能优化

### 最佳实践

1. **懒加载** - 按需初始化组件
2. **防抖** - 处理频繁事件
3. **缓存** - 避免重复计算
4. **清理** - 及时移除事件监听器

```typescript
// 防抖示例
private debounceRefresh = debounce(() => {
  this.refreshPreview();
}, 300);

// 清理示例
destroy() {
  this.eventBus.off('my-event', this.handleEvent);
  if (this.element) {
    this.element.remove();
  }
}
```

## 📋 检查清单

### 新组件开发

- [ ] 继承BasePanel或独立实现标准接口
- [ ] 独立的样式注入，使用组件前缀
- [ ] 正确的z-index层级设置
- [ ] 响应式设计支持
- [ ] 事件监听器清理
- [ ] 错误处理和降级方案
- [ ] 文档和注释完整

### 代码审查

- [ ] 无全局样式污染
- [ ] 无内存泄漏风险
- [ ] 事件命名规范
- [ ] TypeScript类型完整
- [ ] 错误处理完善
- [ ] 性能影响评估

---

**快速参考版本：** v1.0  
**对应主文档：** [editor-ui-refactor.md](./editor-ui-refactor.md)
