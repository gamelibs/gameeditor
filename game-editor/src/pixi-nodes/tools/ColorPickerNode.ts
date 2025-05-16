import { LiteGraph, LGraphNode } from "litegraph.js";
import { NodeColors, NodeSizes } from '../../nodesConfig';

/**
 * ColorPickerNode
 * 输出一个颜色值（#RRGGBB），可用于连接 display 节点的 color 输入端口。
 * 使用原生HTML5 color picker，更可靠且无依赖
 */
export class ColorPickerNode extends LGraphNode {
    static title = "Color Picker";
    static desc = "Outputs color value for controlling node colors";
    static color_in_terminal = "#5a67d8"; // 逻辑节点颜色
    static color_out_terminal = "#5a67d8";

    _color_value: string = "#ffffff";
    _colorPickerElement: HTMLInputElement | null = null;
    _colorPickerContainer: HTMLElement | null = null;
    
    constructor() {
        super();
        this.title = ColorPickerNode.title;
        this.addOutput("color", "string");
        this.properties = { 
            color: "#ffffff" 
        };
        
        this.size = [180, 80];
        this.color = NodeColors.logic || "#5a67d8"; 
        this.boxcolor = NodeColors.logic || "#5a67d8";

        // 添加简单文本 widget，我们将自行绘制颜色选择器
        this.addWidget("text", "Color", this.properties.color, (v) => {
            // 检查输入是否为有效颜色
            if(/^#[0-9A-F]{6}$/i.test(v)) {
                this.properties.color = v;
                this._color_value = v;
                this.setDirtyCanvas(true, true);
            }
        });
        
        // 创建颜色选择器元素但不添加到DOM，等到点击时再添加
        this._createColorPickerElement();
    }
    
    /**
     * 创建颜色选择器HTML元素
     * @private
     */
    _createColorPickerElement() {
        // 创建容器
        this._colorPickerContainer = document.createElement('div');
        this._colorPickerContainer.className = 'native-color-picker-container';
        this._colorPickerContainer.style.position = 'fixed';
        this._colorPickerContainer.style.zIndex = '10000';
        this._colorPickerContainer.style.background = '#2a2a2a';
        this._colorPickerContainer.style.padding = '10px';
        this._colorPickerContainer.style.borderRadius = '5px';
        this._colorPickerContainer.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.3)';
        this._colorPickerContainer.style.display = 'none';
        this._colorPickerContainer.style.width = '200px';
        
        // 创建标题和关闭按钮的容器
        const headerDiv = document.createElement('div');
        headerDiv.style.display = 'flex';
        headerDiv.style.justifyContent = 'space-between';
        headerDiv.style.alignItems = 'center';
        headerDiv.style.marginBottom = '10px';
        
        // 创建标题
        const title = document.createElement('div');
        title.textContent = 'Select Color';
        title.style.color = '#fff';
        title.style.fontWeight = 'bold';
        headerDiv.appendChild(title);
        
        // 创建关闭按钮
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '×';
        closeBtn.style.background = 'transparent';
        closeBtn.style.border = 'none';
        closeBtn.style.color = '#fff';
        closeBtn.style.cursor = 'pointer';
        closeBtn.style.fontSize = '16px';
        closeBtn.style.width = '20px';
        closeBtn.style.height = '20px';
        closeBtn.style.lineHeight = '16px';
        closeBtn.style.padding = '0';
        closeBtn.addEventListener('click', this._hideColorPicker.bind(this));
        headerDiv.appendChild(closeBtn);
        
        this._colorPickerContainer.appendChild(headerDiv);
        
        // 创建颜色选择器
        this._colorPickerElement = document.createElement('input');
        this._colorPickerElement.type = 'color';
        this._colorPickerElement.value = this.properties.color;
        this._colorPickerElement.style.width = '100%';
        this._colorPickerElement.style.height = '40px';
        this._colorPickerElement.style.border = 'none';
        this._colorPickerElement.style.outline = 'none';
        this._colorPickerElement.style.cursor = 'pointer';
        this._colorPickerElement.style.borderRadius = '3px';
        this._colorPickerElement.style.marginBottom = '5px';
        
        // 添加颜色变更事件
        this._colorPickerElement.addEventListener('input', this._onColorChange.bind(this));
        this._colorPickerElement.addEventListener('change', this._onColorChange.bind(this));
        
        this._colorPickerContainer.appendChild(this._colorPickerElement);
        
        // 创建当前颜色显示
        const colorValueDiv = document.createElement('div');
        colorValueDiv.style.display = 'flex';
        colorValueDiv.style.alignItems = 'center';
        colorValueDiv.style.marginBottom = '10px';
        
        const colorValueLabel = document.createElement('span');
        colorValueLabel.textContent = 'Value: ';
        colorValueLabel.style.color = '#ccc';
        colorValueLabel.style.marginRight = '5px';
        colorValueDiv.appendChild(colorValueLabel);
        
        const colorValueInput = document.createElement('input');
        colorValueInput.type = 'text';
        colorValueInput.value = this.properties.color;
        colorValueInput.style.backgroundColor = '#444';
        colorValueInput.style.color = '#fff';
        colorValueInput.style.border = '1px solid #666';
        colorValueInput.style.borderRadius = '3px';
        colorValueInput.style.padding = '3px 5px';
        colorValueInput.style.width = '70px';
        colorValueInput.style.fontSize = '12px';
        colorValueInput.addEventListener('input', (e) => {
            const input = e.target as HTMLInputElement;
            const value = input.value;
            if (/^#[0-9A-F]{6}$/i.test(value)) {
                this._colorPickerElement!.value = value;
            }
        });
        colorValueDiv.appendChild(colorValueInput);
        this._colorPickerContainer.appendChild(colorValueDiv);
        
        // 添加保存和应用按钮的容器
        const buttonContainer = document.createElement('div');
        buttonContainer.style.display = 'flex';
        buttonContainer.style.justifyContent = 'space-between';
        buttonContainer.style.gap = '5px';
        
        // 添加保存按钮
        const saveButton = document.createElement('button');
        saveButton.textContent = 'Apply & Close';
        saveButton.style.padding = '5px 5px';
        saveButton.style.backgroundColor = '#4285f4';
        saveButton.style.color = '#fff';
        saveButton.style.border = 'none';
        saveButton.style.borderRadius = '3px';
        saveButton.style.cursor = 'pointer';
        saveButton.style.flex = '1';
        saveButton.addEventListener('click', () => {
            this._updateColorValue(this._colorPickerElement!.value);
            colorValueInput.value = this._colorPickerElement!.value; // 同步更新文本输入框
            this._hideColorPicker();
        });
        buttonContainer.appendChild(saveButton);
        
        // 添加应用按钮
        const applyButton = document.createElement('button');
        applyButton.textContent = 'Apply';
        applyButton.style.padding = '5px 5px';
        applyButton.style.backgroundColor = '#666';
        applyButton.style.color = '#fff';
        applyButton.style.border = 'none';
        applyButton.style.borderRadius = '3px';
        applyButton.style.cursor = 'pointer';
        applyButton.style.flex = '1';
        applyButton.addEventListener('click', () => {
            this._updateColorValue(this._colorPickerElement!.value);
            colorValueInput.value = this._colorPickerElement!.value; // 同步更新文本输入框
            // 不关闭选择器
        });
        buttonContainer.appendChild(applyButton);
        
        this._colorPickerContainer.appendChild(buttonContainer);
        
        // 在颜色选择器元素上设置变更事件监听器
        this._colorPickerElement.addEventListener('input', (e) => {
            const input = e.target as HTMLInputElement;
            colorValueInput.value = input.value; // 更新文本输入框
        });
        
        // 添加到文档
        document.body.appendChild(this._colorPickerContainer);
        console.log('Color picker element created:', this._colorPickerContainer);
    }

    /**
     * 更新颜色值并同步到UI
     * @param color 新的颜色值，例如 "#FF0000"
     * @private
     */
    _updateColorValue(color: string) {
        if (!color || !color.startsWith('#')) return;
        
        try {
            // 转换颜色为大写，确保统一格式
            color = color.toUpperCase();
            
            // 更新节点属性
            this.properties.color = color;
            this._color_value = color;
            
            // 更新输入框
            if (this.widgets && this.widgets[0]) {
                // 直接设置 widget 的值
                this.widgets[0].value = color;
                
                // 如果 widget 有 DOM 元素，尝试更新它
                const widget = this.widgets[0];
                if (widget.type === "text" && widget.inputEl) {
                    widget.inputEl.value = color;
                }
                
                // 执行 widget 的回调函数（如果存在）
                if (typeof widget.callback === "function") {
                    widget.callback(color);
                }
            }
            
            // 触发重绘
            this.setDirtyCanvas(true, true);
            
            // 立即更新输出
            this.setOutputData(0, color);
            
            // 通知图表有变更 
            if (this.graph) {
                this.graph.change();
            }
        } catch (error) {
            console.error('Error updating color value:', error);
        }
    }
    
    /**
     * 处理颜色变更事件
     * @param event 颜色变更事件
     * @private
     */
    _onColorChange(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input && input.value) {
            const newColor = input.value;
            // 实时更新颜色预览，但不关闭面板
            this._updateColorValue(newColor);
        }
    }
    
    /**
     * 显示颜色选择器
     * @private
     */
    _showColorPicker() {
        console.log('Attempting to show color picker:', this._colorPickerContainer);
        try {
            if (this._colorPickerContainer) {
                // 更新颜色值
                if (this._colorPickerElement) {
                    this._colorPickerElement.value = this.properties.color;
                }
                
                // 设置固定位置在右上角
                this._colorPickerContainer.style.position = 'fixed';
                this._colorPickerContainer.style.right = '20px';
                this._colorPickerContainer.style.top = '80px';
                this._colorPickerContainer.style.left = 'auto';
                this._colorPickerContainer.style.zIndex = '10000'; // 确保在最顶层
                
                // 显示选择器
                this._colorPickerContainer.style.display = 'block';
            }
        } catch (error) {
            console.error('Error showing color picker:', error);
        }
    }
    
    /**
     * 隐藏颜色选择器
     * @private
     */
    _hideColorPicker() {
        try {
            if (this._colorPickerContainer) {
                this._colorPickerContainer.style.display = 'none';
            }
        } catch (error) {
            console.error('Error hiding color picker:', error);
        }
    }

    onDrawForeground(ctx: CanvasRenderingContext2D) {
        if (!this.flags.collapsed) {
            // 绘制颜色预览框
            ctx.save();
            ctx.fillStyle = this.properties.color;
            ctx.strokeStyle = "#000";
            ctx.lineWidth = 1;
            const x = 10;
            const y = 55;
            const width = this.size[0] - 20;
            const height = 20;
            
            ctx.fillRect(x, y, width, height);
            ctx.strokeRect(x, y, width, height);
            
            ctx.restore();
        }
    }
    
    onMouseDown(_: MouseEvent, pos: [number, number]) {
        console.log('ColorPickerNode onMouseDown', pos);
        if (!this.flags.collapsed) {
            const x = pos[0];
            const y = pos[1];
            
            // 检查点击是否在颜色框内
            if (x > 10 && x < this.size[0] - 10 && y > 55 && y < 75) {
                console.log('ColorPickerNode clicked within color box');
                this._showColorPicker();
                return true;
            }
        }
        return false;
    }
     /**
     * 在每次节点执行时触发，用于输出颜色值
     */
    onExecute() {
        // 确保输出当前色值
        this.setOutputData(0, this.properties.color);
    }
    
    /**
     * 当节点被移除时，清理颜色选择器元素
     */
    onRemoved() {
        // 清理颜色选择器
        if (this._colorPickerContainer && this._colorPickerContainer.parentNode) {
            this._colorPickerContainer.parentNode.removeChild(this._colorPickerContainer);
        }
        this._colorPickerContainer = null;
        this._colorPickerElement = null;
    }
}

// 注册节点
export function registerColorPickerNode(LiteGraph: any) {
    LiteGraph.registerNodeType("tools/color_picker", ColorPickerNode);
}
