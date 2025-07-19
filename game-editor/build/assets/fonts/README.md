# 字体资源目录

这个目录用于存放游戏的字体资源文件。

## 支持的格式
- WOFF2 (推荐，文件最小)
- WOFF (广泛支持)
- TTF/OTF (传统格式)
- EOT (IE支持)

## 建议的文件结构
```
fonts/
├── display/      # 显示字体
│   ├── title/    # 标题字体
│   └── ui/       # 界面字体
├── text/         # 文本字体
│   ├── body/     # 正文字体
│   └── code/     # 代码字体
└── decorative/   # 装饰字体
```

## 命名规范
- 使用小写字母和连字符
- 包含字体名称和样式，如：`roboto-regular.woff2`
- 包含字重信息，如：`opensans-bold-700.woff2`

## 字体优化建议
- 使用WOFF2格式减少文件大小
- 只包含必要的字符集
- 考虑使用字体子集化
- 实现字体预加载

## 字体加载策略
```css
/* 字体预加载 */
@font-face {
  font-family: 'GameFont';
  src: url('fonts/game-font.woff2') format('woff2');
  font-display: swap; /* 优化加载体验 */
}
```

## 性能考虑
- 字体文件大小控制在100KB以内
- 使用font-display: swap避免FOUT
- 考虑使用系统字体作为fallback 