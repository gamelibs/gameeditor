/**
 * 颜色选择器工具类
 * 提供颜色转换和处理相关的工具函数
 */

/**
 * 将RGBA颜色值转换为十六进制颜色字符串
 * @param r 红色通道 (0-255)
 * @param g 绿色通道 (0-255)
 * @param b 蓝色通道 (0-255)
 * @param a 不透明度 (0-1)
 * @returns 十六进制颜色字符串，例如 "#FF0000"
 */
export function rgbaToHex(r: number, g: number, b: number, a: number = 1): string {
    return "#" + 
        Math.round(r).toString(16).padStart(2, '0') + 
        Math.round(g).toString(16).padStart(2, '0') + 
        Math.round(b).toString(16).padStart(2, '0');
}

/**
 * 将十六进制颜色字符串转换为RGBA对象
 * @param hex 十六进制颜色字符串，例如 "#FF0000"
 * @returns RGBA对象 {r, g, b, a}
 */
export function hexToRgba(hex: string): { r: number, g: number, b: number, a: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
        a: 1
    } : { r: 0, g: 0, b: 0, a: 1 };
}

/**
 * 验证颜色格式是否正确 (#RRGGBB 格式)
 * @param color 要验证的颜色字符串
 * @returns 是否为有效颜色
 */
export function isValidColor(color: string): boolean {
    return /^#[0-9A-F]{6}$/i.test(color);
}
