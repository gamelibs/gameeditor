#!/bin/bash

# 测试导出功能的脚本

echo "🧪 开始测试导出功能..."

# 创建测试目录
TEST_DIR="/tmp/game-export-test"
mkdir -p "$TEST_DIR"
cd "$TEST_DIR"

echo "📁 测试目录: $TEST_DIR"

# 创建一个简单的测试配置
cat > game-config.json << 'EOF'
{
  "title": "Hello World Test",
  "width": 640,
  "height": 480,
  "version": "1.0.0",
  "nodes": [
    {
      "id": 1,
      "type": "scene/pixiStage",
      "pos": [500, 400],
      "size": {"0": 180, "1": 60},
      "properties": {
        "width": 640,
        "height": 480,
        "background": "#222"
      }
    },
    {
      "id": 2,
      "type": "render/text",
      "pos": [400, 100],
      "size": {"0": 200, "1": 280},
      "properties": {
        "x": 320,
        "y": 240,
        "scale": 1,
        "rotation": 0,
        "alpha": 1,
        "anchor": 0.5,
        "text": "Hello World!",
        "fontSize": 48,
        "fontFamily": "Arial",
        "textColor": "#FFFFFF",
        "visible": true
      }
    }
  ],
  "links": [
    [1, 2, 0, 1, 0, "pixi_display_object"]
  ]
}
EOF

echo "✅ 创建了测试配置文件"

# 下载Pixi.js
echo "📥 下载 Pixi.js..."
mkdir -p js
curl -s "https://pixijs.download/release/pixi.min.js" > js/pixi.min.js

if [ -s "js/pixi.min.js" ]; then
    echo "✅ Pixi.js 下载成功 ($(du -h js/pixi.min.js | cut -f1))"
else
    echo "❌ Pixi.js 下载失败"
    exit 1
fi

# 创建基本的HTML文件进行测试
cat > test.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Pixi.js Test</title>
</head>
<body>
    <div id="test-result"></div>
    <script src="js/pixi.min.js"></script>
    <script>
        const result = document.getElementById('test-result');
        
        if (typeof PIXI !== 'undefined') {
            result.innerHTML = '✅ Pixi.js 加载成功！版本: ' + PIXI.VERSION;
            result.style.color = 'green';
            console.log('Pixi.js 版本:', PIXI.VERSION);
        } else {
            result.innerHTML = '❌ Pixi.js 加载失败';
            result.style.color = 'red';
        }
    </script>
</body>
</html>
EOF

echo "✅ 创建了测试HTML文件"

# 启动临时服务器进行测试
echo "🚀 启动测试服务器 (端口 8002)..."
python3 -m http.server 8002 &
SERVER_PID=$!

sleep 2

# 使用curl测试HTML页面是否可访问
echo "🔍 测试页面访问..."
if curl -s "http://localhost:8002/test.html" | grep -q "Pixi.js Test"; then
    echo "✅ 测试页面可以访问"
    echo "🌐 请在浏览器中访问: http://localhost:8002/test.html"
else
    echo "❌ 测试页面无法访问"
fi

echo ""
echo "📋 测试结果总结:"
echo "   - 测试目录: $TEST_DIR"
echo "   - 配置文件: game-config.json"
echo "   - Pixi.js: js/pixi.min.js"
echo "   - 测试页面: http://localhost:8002/test.html"
echo ""
echo "💡 要停止测试服务器，请运行: kill $SERVER_PID"

# 保存PID以便后续清理
echo $SERVER_PID > /tmp/test-server.pid
