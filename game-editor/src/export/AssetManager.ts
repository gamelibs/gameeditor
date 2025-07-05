/**
 * 资源管理器 - 用于游戏导出时的资源处理
 */
export interface GameAsset {
  id: string;
  type: 'image' | 'audio' | 'font' | 'texture';
  url: string;
  localPath?: string;
  data?: string | ArrayBuffer;
}

export class AssetManager {
  private assets: Map<string, GameAsset> = new Map();
  
  /**
   * 添加资源
   */
  addAsset(asset: GameAsset) {
    this.assets.set(asset.id, asset);
  }
  
  /**
   * 获取所有资源
   */
  getAllAssets(): GameAsset[] {
    return Array.from(this.assets.values());
  }
  
  /**
   * 下载并转换资源为base64
   */
  async downloadAndConvertAssets(): Promise<void> {
    const downloadPromises = Array.from(this.assets.values()).map(async (asset) => {
      if (asset.url.startsWith('http')) {
        try {
          const response = await fetch(asset.url);
          const blob = await response.blob();
          
          // 转换为base64
          const reader = new FileReader();
          const base64 = await new Promise<string>((resolve) => {
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
          
          asset.data = base64;
          asset.localPath = `assets/${asset.type}s/${asset.id}.${this.getExtension(asset.url)}`;
        } catch (error) {
          console.warn(`Failed to download asset ${asset.id}:`, error);
        }
      }
    });
    
    await Promise.all(downloadPromises);
  }
  
  /**
   * 生成资源清单文件
   */
  generateManifest(): string {
    const manifest = {
      version: "1.0.0",
      assets: this.getAllAssets().map(asset => ({
        id: asset.id,
        type: asset.type,
        path: asset.localPath || asset.url,
        url: asset.url
      }))
    };
    
    return JSON.stringify(manifest, null, 2);
  }
  
  private getExtension(url: string): string {
    const match = url.match(/\.([^.]+)$/);
    return match ? match[1] : 'bin';
  }
}
