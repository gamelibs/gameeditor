// 简单的Node.js脚本，用于批量替换pixiStageNode.ts中的console调用
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 获取当前文件路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 文件路径
const stageNodePath = path.join(__dirname, 'src/pixi-nodes/scene/pixiStageNode.ts');
const imageNodePath = path.join(__dirname, 'src/pixi-nodes/render/pixiImageNode.ts');

// 处理单个文件的函数
function processFile(filePath, fileName) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // 替换 console.log
    let updatedContent = content.replace(/console\.log\(\s*['"]\[(\w+)\]['"]/g, 'Logger.info(\'$1\'');
    
    // 替换 console.warn
    updatedContent = updatedContent.replace(/console\.warn\(\s*['"]\[(\w+)\]['"]/g, 'Logger.warn(\'$1\'');
    
    // 替换 console.error
    updatedContent = updatedContent.replace(/console\.error\(\s*['"]\[(\w+)\]['"]/g, 'Logger.error(\'$1\'');
    
    // 写入文件
    fs.writeFileSync(filePath, updatedContent);
    console.log(`已更新 ${fileName} 中的控制台日志调用`);
}

// 处理 PixiStageNode
processFile(stageNodePath, 'pixiStageNode.ts');

// 处理 PixiImageNode
processFile(imageNodePath, 'pixiImageNode.ts');
