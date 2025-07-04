/**
 * 颜色管理器
 * 负责游戏中所有颜色相关的功能
 */
class ColorManager {
    constructor(config = null) {
        // 使用全局配置或传入的配置
        this.config = config || window.gameConfig;
        
        if (!this.config) {
            console.warn('ColorManager: 未找到配置，使用默认颜色');
            this._initDefaultColors();
        }
    }

    /**
     * 初始化默认颜色（当没有配置时使用）
     * @private
     */
    _initDefaultColors() {
        this.config = {
            colors: {
                gameEggs: [
                    0xFF0000, // 纯红色
                    0xFFFF00, // 纯黄色
                    0xFF69B4, // 亮粉色
                    0x0066FF, // 纯蓝色
                    0x00FF00, // 纯绿色
                    0x9933FF  // 纯紫色
                ],
                decorative: [
                    0xFF6B6B, // 红色
                    0x4ECDC4, // 青色  
                    0x45B7D1, // 蓝色
                    0x96CEB4, // 绿色
                    0xFECA57, // 黄色
                    0xFF9FF3, // 粉色
                    0x54A0FF, // 浅蓝
                    0x5F27CD, // 紫色
                    0x00D2D3, // 青绿
                    0xFF6348  // 橙红
                ]
            }
        };
    }

    /**
     * 获取游戏专用的随机蛋颜色（6种固定颜色）
     * @returns {number} 颜色值
     */
    getRandomGameEggColor() {
        const colors = this.getGameEggColors();
        return colors[Math.floor(Math.random() * colors.length)];
    }

    /**
     * 获取指定索引的游戏蛋颜色
     * @param {number} index - 颜色索引 (0-5)
     * @returns {number} 颜色值
     */
    getGameEggColor(index) {
        const colors = this.getGameEggColors();
        return colors[index % colors.length];
    }

    /**
     * 获取游戏蛋颜色数组
     * @returns {Array<number>} 游戏蛋颜色数组
     */
    getGameEggColors() {
        return [...this.config.colors.gameEggs];
    }

    /**
     * 获取装饰用的随机颜色
     * @returns {number} 颜色值
     */
    getRandomDecorativeColor() {
        const colors = this.getDecorativeColors();
        return colors[Math.floor(Math.random() * colors.length)];
    }

    /**
     * 获取装饰颜色数组
     * @returns {Array<number>} 装饰颜色数组
     */
    getDecorativeColors() {
        return [...this.config.colors.decorative];
    }

    /**
     * 根据颜色值获取对应的索引
     * @param {number} color - 颜色值
     * @returns {number} 颜色索引，未找到返回-1
     */
    getGameColorIndex(color) {
        const colors = this.getGameEggColors();
        return colors.indexOf(color);
    }

    /**
     * 检查是否为有效的游戏蛋颜色
     * @param {number} color - 颜色值
     * @returns {boolean} 是否为有效颜色
     */
    isValidGameColor(color) {
        return this.getGameColorIndex(color) !== -1;
    }

    /**
     * 获取颜色的十六进制字符串表示
     * @param {number} color - 颜色值
     * @returns {string} 十六进制字符串（如 "#FF0000"）
     */
    colorToHex(color) {
        return `#${color.toString(16).padStart(6, '0').toUpperCase()}`;
    }

    /**
     * 从十六进制字符串解析颜色
     * @param {string} hex - 十六进制字符串（如 "#FF0000" 或 "FF0000"）
     * @returns {number} 颜色值
     */
    hexToColor(hex) {
        // 移除 # 前缀
        const cleanHex = hex.replace('#', '');
        return parseInt(cleanHex, 16);
    }

    /**
     * 获取颜色的RGB分量
     * @param {number} color - 颜色值
     * @returns {Object} RGB分量 {r, g, b}
     */
    colorToRGB(color) {
        return {
            r: (color >> 16) & 0xFF,
            g: (color >> 8) & 0xFF,
            b: color & 0xFF
        };
    }

    /**
     * 从RGB分量组合颜色
     * @param {number} r - 红色分量 (0-255)
     * @param {number} g - 绿色分量 (0-255)
     * @param {number} b - 蓝色分量 (0-255)
     * @returns {number} 颜色值
     */
    rgbToColor(r, g, b) {
        return (r << 16) | (g << 8) | b;
    }

    /**
     * 计算两个颜色的对比度
     * @param {number} color1 - 第一个颜色
     * @param {number} color2 - 第二个颜色
     * @returns {number} 对比度比值 (1-21)
     */
    getContrast(color1, color2) {
        const lum1 = this._getLuminance(color1);
        const lum2 = this._getLuminance(color2);
        
        const brightest = Math.max(lum1, lum2);
        const darkest = Math.min(lum1, lum2);
        
        return (brightest + 0.05) / (darkest + 0.05);
    }

    /**
     * 获取颜色的亮度
     * @private
     * @param {number} color - 颜色值
     * @returns {number} 亮度值 (0-1)
     */
    _getLuminance(color) {
        const rgb = this.colorToRGB(color);
        
        // 转换为线性RGB
        const toLinear = (c) => {
            c = c / 255;
            return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        };
        
        const r = toLinear(rgb.r);
        const g = toLinear(rgb.g);
        const b = toLinear(rgb.b);
        
        // ITU-R BT.709标准
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }

    /**
     * 获取颜色的较暗版本
     * @param {number} color - 原始颜色
     * @param {number} factor - 变暗因子 (0-1)
     * @returns {number} 变暗后的颜色
     */
    darkenColor(color, factor = 0.2) {
        const rgb = this.colorToRGB(color);
        const multiplier = 1 - factor;
        
        return this.rgbToColor(
            Math.floor(rgb.r * multiplier),
            Math.floor(rgb.g * multiplier),
            Math.floor(rgb.b * multiplier)
        );
    }

    /**
     * 获取颜色的较亮版本
     * @param {number} color - 原始颜色
     * @param {number} factor - 变亮因子 (0-1)
     * @returns {number} 变亮后的颜色
     */
    lightenColor(color, factor = 0.2) {
        const rgb = this.colorToRGB(color);
        
        return this.rgbToColor(
            Math.min(255, Math.floor(rgb.r + (255 - rgb.r) * factor)),
            Math.min(255, Math.floor(rgb.g + (255 - rgb.g) * factor)),
            Math.min(255, Math.floor(rgb.b + (255 - rgb.b) * factor))
        );
    }

    /**
     * 生成渐变色数组
     * @param {number} startColor - 起始颜色
     * @param {number} endColor - 结束颜色
     * @param {number} steps - 渐变步数
     * @returns {Array<number>} 渐变色数组
     */
    generateGradient(startColor, endColor, steps) {
        const startRGB = this.colorToRGB(startColor);
        const endRGB = this.colorToRGB(endColor);
        const gradient = [];
        
        for (let i = 0; i < steps; i++) {
            const ratio = i / (steps - 1);
            const r = Math.floor(startRGB.r + (endRGB.r - startRGB.r) * ratio);
            const g = Math.floor(startRGB.g + (endRGB.g - startRGB.g) * ratio);
            const b = Math.floor(startRGB.b + (endRGB.b - startRGB.b) * ratio);
            
            gradient.push(this.rgbToColor(r, g, b));
        }
        
        return gradient;
    }

    /**
     * 获取颜色的名称（用于调试）
     * @param {number} color - 颜色值
     * @returns {string} 颜色名称或十六进制值
     */
    getColorName(color) {
        const gameColors = this.getGameEggColors();
        const colorNames = ['红色', '黄色', '粉色', '蓝色', '绿色', '紫色'];
        
        const index = gameColors.indexOf(color);
        if (index !== -1) {
            return colorNames[index];
        }
        
        return this.colorToHex(color);
    }

    /**
     * 验证颜色配置
     * @returns {boolean} 配置是否有效
     */
    validateConfig() {
        try {
            const gameColors = this.getGameEggColors();
            const decorativeColors = this.getDecorativeColors();
            
            if (!Array.isArray(gameColors) || gameColors.length === 0) {
                console.error('ColorManager: 游戏颜色配置无效');
                return false;
            }
            
            if (!Array.isArray(decorativeColors) || decorativeColors.length === 0) {
                console.error('ColorManager: 装饰颜色配置无效');
                return false;
            }
            
            // 检查是否有重复颜色
            const uniqueGameColors = new Set(gameColors);
            if (uniqueGameColors.size !== gameColors.length) {
                console.warn('ColorManager: 游戏颜色配置中存在重复颜色');
            }
            
            return true;
        } catch (error) {
            console.error('ColorManager: 配置验证失败', error);
            return false;
        }
    }

    /**
     * 重置为默认颜色配置
     */
    resetToDefault() {
        this._initDefaultColors();
        console.log('ColorManager: 已重置为默认颜色配置');
    }

    /**
     * 获取调试信息
     * @returns {Object} 调试信息
     */
    getDebugInfo() {
        return {
            gameColorsCount: this.getGameEggColors().length,
            decorativeColorsCount: this.getDecorativeColors().length,
            gameColors: this.getGameEggColors().map(c => this.colorToHex(c)),
            configValid: this.validateConfig()
        };
    }
}

// 暴露到全局
window.ColorManager = ColorManager;
