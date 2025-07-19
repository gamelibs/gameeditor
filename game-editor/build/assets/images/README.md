# 图片资源目录

这个目录用于存放游戏的图片资源文件。

## 支持的格式
- PNG (推荐，支持透明)
- JPG/JPEG
- WebP (现代浏览器)
- SVG (矢量图形)

## 建议的文件结构
```
images/
├── ui/           # 用户界面元素
│   ├── buttons/  # 按钮图片
│   ├── icons/    # 图标
│   └── backgrounds/ # 背景图片
├── sprites/      # 游戏精灵
│   ├── player/   # 玩家角色
│   ├── enemies/  # 敌人
│   └── items/    # 道具
├── effects/      # 特效图片
└── tiles/        # 瓦片地图
```

## 命名规范
- 使用小写字母和连字符
- 描述性名称，如：`player-idle.png`
- 包含尺寸信息，如：`button-large-64x32.png`

## 优化建议
- 压缩图片文件大小
- 使用适当的图片格式
- 考虑使用精灵图(sprite sheet)减少HTTP请求 