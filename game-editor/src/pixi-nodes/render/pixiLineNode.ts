import { Graphics } from 'pixi.js';
import { NodeColors, NodeSizes } from '../../nodesConfig';
import { BaseDisplayNode } from '../base/BaseDisplayNode';

export function registerPixiLineNode(LiteGraph: any) {
    class PixiLineNode extends BaseDisplayNode {
        _graphics: Graphics | null = null;

        constructor() {
            super();

            this.title = 'Pixi Line';
            this.size = NodeSizes.medium;
            this.boxcolor = NodeColors.render;
            this.color = NodeColors.render;
            this.properties = {
                ...this.properties,
                length: 100,
                thickness: 2
            };
            this.addWidget('number', 'length', this.properties.length, (v: number) => { this.properties.length = v; this.onDisplayPropertyChanged(); });
            this.addWidget('number', 'thickness', this.properties.thickness, (v: number) => { this.properties.thickness = v; this.onDisplayPropertyChanged(); });
            this.addOutput('graphics', 'pixi_display_object');
        }

        onExecute() {
            // 首先调用父类的onExecute以处理颜色输入
            super.onExecute();

            if (!this._graphics) {
                this._graphics = new Graphics();
                this._graphics.visible = true;
            }
            this.drawLine();
            this.setOutputData(0, this._graphics);
        }

        onDisplayPropertyChanged() {
            if (this._graphics) {
                this.drawLine();
            }
        }

        private drawLine() {
            if (!this._graphics) return;
            this._graphics.clear();
            this.applyDisplayProperties(this._graphics);

            // 颜色处理改进：支持十六进制颜色（来自ColorPickerNode）
            let colorHex = this.properties.color || '#ffffff';
            if (!/^#[0-9A-F]{6}$/i.test(colorHex)) {
                colorHex = '#ffffff'; // 默认白色
            }
            const colorInt = parseInt(colorHex.replace('#', ''), 16);
            const thickness = Math.max(1, this.properties.thickness || 2);

            // 绘制连接线 - 正确使用 PixiJS v8 API
            this._graphics.setStrokeStyle({
                width: thickness,
                color: colorInt,
                cap: "round",
                join: "round"
            });
            
            // 绘制线条
            this._graphics.moveTo(0, 0);
            this._graphics.lineTo(this.properties.length, 0);
            this._graphics.stroke();
            
            // 画端点
            this._graphics.setFillStyle(colorInt);
            this._graphics.circle(0, 0, thickness * 0.8);
            this._graphics.fill();
            this._graphics.circle(this.properties.length, 0, thickness * 0.8);
            this._graphics.fill();
        }
    }

    LiteGraph.registerNodeType('render/line', PixiLineNode);
}
