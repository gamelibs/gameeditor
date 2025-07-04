/**
 * 文件下载工具
 */
import type { GameFile } from '../export/GameProjectGenerator';

// 创建并下载ZIP文件
export async function downloadGameProject(files: GameFile[], projectName: string): Promise<void> {
  try {
    // 动态导入JSZip
    const JSZip = (await import('jszip')).default;
    
    const zip = new JSZip();
    
    // 添加所有文件到ZIP
    for (const file of files) {
      zip.file(file.path, file.content);
    }
    
    // 生成ZIP blob
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    
    // 创建下载链接
    const url = URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${projectName}.zip`;
    
    // 触发下载
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // 清理URL对象
    URL.revokeObjectURL(url);
    
  } catch (error) {
    console.error('下载失败:', error);
    
    // 如果JSZip不可用，则提供替代方案
    downloadAsMultipleFiles(files, projectName);
  }
}

// 备用方案：分别下载每个文件
function downloadAsMultipleFiles(files: GameFile[], projectName: string): void {
  console.warn('ZIP下载不可用，将分别下载各个文件');
  
  files.forEach((file, index) => {
    setTimeout(() => {
      const blob = new Blob([file.content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${projectName}-${file.path.replace('/', '-')}`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
    }, index * 100); // 延迟避免浏览器阻止多个下载
  });
}

// 显示成功消息
export function showSuccessMessage(message: string): void {
  const successMsg = document.createElement('div');
  successMsg.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #4ECDC4;
    color: white;
    padding: 15px 20px;
    border-radius: 6px;
    z-index: 2000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    font-size: 14px;
    max-width: 400px;
  `;
  successMsg.textContent = message;
  
  document.body.appendChild(successMsg);
  
  setTimeout(() => {
    if (document.body.contains(successMsg)) {
      document.body.removeChild(successMsg);
    }
  }, 5000);
}
