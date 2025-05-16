import { BaseNode } from './BaseNode';

/**
 * BaseDisplayNode
 * 通用显示对象属性基类，适用于所有需要位置、缩放、旋转、透明度、锚点的渲染节点。
 */
export abstract class BaseDisplayNode extends BaseNode {
    properties: Record<string, any> = {
        x: 0,
        y: 0,
        scale: 1,
        rotation: 0,
        alpha: 1,
        anchor: 0.5,
        color: '#ffffff' // 默认颜色
    };

    constructor() {
        super();
        this.addDisplayPropertyWidgets();
        // 添加颜色输入端口 - 用于连接ColorPickerNode
        this.addInput('color', 'string');
    }

    addDisplayPropertyWidgets() {
        this.addWidget('number', 'x', this.properties.x, (v: number) => { this.properties.x = v; this.onDisplayPropertyChanged(); });
        this.addWidget('number', 'y', this.properties.y, (v: number) => { this.properties.y = v; this.onDisplayPropertyChanged(); });
        this.addWidget('number', 'scale', this.properties.scale, (v: number) => { this.properties.scale = v; this.onDisplayPropertyChanged(); });
        this.addWidget('number', 'rotation', this.properties.rotation, (v: number) => { this.properties.rotation = v; this.onDisplayPropertyChanged(); });
        this.addWidget('number', 'alpha', this.properties.alpha, (v: number) => { this.properties.alpha = v; this.onDisplayPropertyChanged(); });
        this.addWidget('number', 'anchor', this.properties.anchor, (v: number) => { this.properties.anchor = v; this.onDisplayPropertyChanged(); });
        // 移除了颜色widget，改为使用颜色输入端口
    }

    // 添加默认的onExecute方法来处理颜色输入
    onExecute() {
        // 检查并处理颜色输入
        const colorInput = this.getInputData(0);
        if (colorInput && typeof colorInput === 'string' && /^#[0-9A-F]{6}$/i.test(colorInput)) {
            // 只有当颜色值有效且与当前值不同时才更新
            if (this.properties.color !== colorInput) {
                this.properties.color = colorInput;
                this.onDisplayPropertyChanged();
            }
        }
    }

    // 子类可重写，属性变更时自动同步到显示对象
    onDisplayPropertyChanged() {
        // 例如：this._sprite && this.applyDisplayProperties(this._sprite);
    }

    // 工具方法，应用属性到任意Pixi对象
    applyDisplayProperties(obj: any) {
        if (!obj) return;
        obj.x = this.properties.x;
        obj.y = this.properties.y;
        if (obj.scale?.set) obj.scale.set(this.properties.scale);
        else obj.scale = this.properties.scale;
        obj.rotation = this.properties.rotation;
        obj.alpha = this.properties.alpha;
        if (obj.anchor?.set) obj.anchor.set(this.properties.anchor);
    }
}
