import { NodeColors, NodeSizes } from '../../nodesConfig';
import { Sprite, Texture, Graphics } from 'pixi.js';

export function registerResourceGroupNode(LiteGraph: any) {
  function ResourceGroupNode(this: any) {
    this.title = 'Resource Group';
    this.size = NodeSizes.large;
    this.boxcolor = NodeColors.resource;
    this.color = NodeColors.resource;
    this.resizable = true;

    // 分组属性
    this.properties = {
      groupName: 'default',
      autoCollect: true // 是否自动收集所有输入
    };

    // 支持多个输入端口，类型可为任意资源
    this.addInput('Resource 1', '*');
    this.addOutput('children', 'array');
    this.addOutput('trigger', 'number'); // 添加一个触发更新的输出

    // 分组名编辑
    this.addWidget('text', 'Group', this.properties.groupName, (v: string) => { this.properties.groupName = v; });
    // 自动收集开关
    this.addWidget('toggle', 'Auto Collect', this.properties.autoCollect, (v: boolean) => { this.properties.autoCollect = v; });
    // 动态添加输入端口
    this.addWidget('button', 'Add Input', null, () => {
      this.addInput(`Resource ${this.inputs.length + 1}`, '*');
      this.setDirtyCanvas(true, true);
    });
    // 资源列表可视化
    this.addWidget('html', '', '', () => {}, {
      get: () => this.renderResourceListHtml()
    });
  }

  ResourceGroupNode.prototype.renderResourceListHtml = function() {
    // 检查是否有连接的输入端口和有效资源
    let hasResources = false;
    let connectedInputsCount = 0;
    
    for (let i = 0; i < this.inputs.length; i++) {
      const input = this.inputs[i];
      if (input.link) {
        connectedInputsCount++;
        const res = this.getInputData(i);
        if (res) {
          hasResources = true;
          break;
        }
      }
    }
    
    let html = '<div style="max-height:120px;overflow:auto;font-size:12px;">';
    
    // 只有连接了输入端口才显示资源列表
    if (connectedInputsCount > 0) {
      if (hasResources) {
        html += '<b>Resources:</b><ul>';
        for (let i = 0; i < this.inputs.length; i++) {
          const input = this.inputs[i];
          if (input.link) {
            const res = this.getInputData(i);
            if (res) {
              let type = 'unknown';
              if (res instanceof Sprite) type = 'Sprite';
              else if (res instanceof Texture) type = 'Texture';
              else if (res instanceof Graphics) type = 'Graphics';
              else if (res.constructor?.name === 'Graphics') type = 'Graphics';
              else if (res.type) type = res.type;
              html += `<li>${res.alias || res.name || '[unnamed]'} <span style="color:#888">(${type})</span></li>`;
            }
          }
        }
        html += '</ul>';
      } else {
        html += '<i>Connected, waiting for resources...</i>';
      }
    } else {
      html += '<i>Connect resource inputs to display here</i>';
    }
    
    html += '</div>';
    return html;
  };

  // 添加 RAF 强制持续执行的机制
  ResourceGroupNode.prototype._lastExecuteTime = 0;
  ResourceGroupNode.prototype._rafId = null;
  ResourceGroupNode.prototype._hasConnectedInputs = false;

  ResourceGroupNode.prototype.onAdded = function() {
    // 启动 RAF 循环，确保节点持续执行
    if (!this._rafId) {
      const loop = () => {
        // 检查是否有连接的输入端口
        this._hasConnectedInputs = false;
        if (this.graph && this.inputs) {
          for (let i = 0; i < this.inputs.length; i++) {
            const input = this.inputs[i];
            if (input.link !== null) {
              this._hasConnectedInputs = true;
              break;
            }
          }
        }
        
        // 只有在有连接的输入端口时才记录启动日志
        if (this._hasConnectedInputs && !this._loggedStart) {
          console.log(`[ResourceGroupNode ${this.id}] Starting render loop with connected inputs`);
          this._loggedStart = true;
        }
        
        // 每 100ms 触发一次执行（仅当有连接时）
        const now = Date.now();
        if (this._hasConnectedInputs && now - this._lastExecuteTime > 100) {
          this._lastExecuteTime = now;
          // 强制图表执行
          if (this.graph) {
            this.graph.runStep();
          }
        }
        this._rafId = requestAnimationFrame(loop);
      };
      this._rafId = requestAnimationFrame(loop);
    }
  };

  ResourceGroupNode.prototype.onRemoved = function() {
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
  };

  ResourceGroupNode.prototype.onExecute = function() {
    // 收集所有输入资源，输出为数组
    const children = [];
    
    // 检查是否有连接的输入端口
    let hasConnectedInputs = false;
    if (this.graph && this.inputs) {
      for (let i = 0; i < this.inputs.length; i++) {
        const input = this.inputs[i];
        if (input.link !== null) {
          hasConnectedInputs = true;
          break;
        }
      }
    }
    
    // 只有在有连接的输入端口时才打印详细日志
    if (hasConnectedInputs) {
      console.log(`[ResourceGroupNode ${this.id}] Executing. Inputs: ${this.inputs.length}`);
      
      // 添加强制触发连接节点的机制
      if (this.graph) {
        // 强制触发所有输入节点的执行
        for (let i = 0; i < this.inputs.length; i++) {
          const input = this.inputs[i];
          const link = input.link && this.graph.links[input.link];
          if (link) {
            const originNode = this.graph.getNodeById(link.origin_id);
            if (originNode && originNode.onExecute) {
              console.log(`[ResourceGroupNode ${this.id}] Forcing execution of input node:`, originNode.title);
              originNode.onExecute();
            }
          }
        }
      }
    }
    
    for (let i = 0; i < this.inputs.length; i++) {
      const input = this.inputs[i];
      // 只处理已连接的输入端口
      if (input.link) {
        const res = this.getInputData(i);
        
        if (hasConnectedInputs) {
          console.log(`[ResourceGroupNode ${this.id}] Input ${i}:`, res, res ? res.constructor?.name : 'N/A');
        }
        
        if (res) {
          // 自动将 Texture 转为 Sprite
          if (res instanceof Texture) {
            const sprite = new Sprite(res);
            if (hasConnectedInputs) {
              console.log(`[ResourceGroupNode ${this.id}] Created Sprite from Texture:`, sprite);
            }
            children.push(sprite);
          } else if (
            res instanceof Sprite || 
            // 直接检查是否为 Graphics 实例，而不是通过构造函数名
            res.constructor?.name === 'Graphics' || 
            // 也可以通过检查特有方法来判断是 Graphics
            (res && typeof res.clear === 'function' && typeof res.beginFill === 'function') ||
            // 其他显示对象类型
            (res && typeof res === 'object' && res.constructor && (
              res.constructor.name === 'Spine' ||
              res.constructor.name === 'Container')
            ) ||
            // 通用显示对象检查
            (res && typeof res === 'object' && typeof res.render === 'function')
          ) {
            if (hasConnectedInputs) {
              console.log(`[ResourceGroupNode ${this.id}] Added displayObject:`, res, 'constructor:', res.constructor?.name);
              // 详细记录显示对象的属性
              if (res.constructor?.name === 'Graphics') {
                console.log(`[ResourceGroupNode ${this.id}] Graphics details:`, 
                  'visible:', res.visible, 
                  'x/y:', res.x, res.y,
                  'parent:', res.parent ? 'has parent' : 'no parent'
                );
              } else if (res instanceof Sprite || res.constructor?.name === 'Sprite') {
                console.log(`[ResourceGroupNode ${this.id}] Sprite details:`, 
                  'visible:', res.visible, 
                  'x/y:', res.x, res.y,
                  'scale:', res.scale?.x, res.scale?.y,
                  'texture:', res.texture ? 'valid' : 'invalid',
                  'parent:', res.parent ? 'has parent' : 'no parent'
                );
                
                // 确保 Sprite 的纹理有效
                if (!res.texture || res.texture.valid === false) {
                  console.warn(`[ResourceGroupNode ${this.id}] Sprite has invalid texture`);
                }
              }
            }
            
            // 确保对象可见
            if (typeof res.visible !== 'undefined') {
              res.visible = true;
              console.log(`[ResourceGroupNode ${this.id}] Set object visibility to true`);
            }
            
            // 现在我们不再克隆对象，而是对所有显示对象生成副本，避免引用问题
            if (res.constructor?.name === 'Graphics') {
              // Graphics 对象需要特殊处理
              const clonedGraphics = new Graphics();
              clonedGraphics.x = res.x;
              clonedGraphics.y = res.y;
              clonedGraphics.scale = res.scale;
              clonedGraphics.rotation = res.rotation;
              clonedGraphics.alpha = res.alpha;
              
              // 提取并复制当前状态
              clonedGraphics.clear();
              
              // 尝试通过多种方式复制图形数据
              try {
                // 现代 PixiJS v8 方法
                if (res._geometry && res._geometry.graphicsData) {
                  for (const data of res._geometry.graphicsData) {
                    if (data.fillStyle && data.fillStyle.color !== undefined) {
                      clonedGraphics.beginFill(data.fillStyle.color);
                      const shape = data.shape;
                      if (shape.x !== undefined && shape.y !== undefined && 
                          shape.width !== undefined && shape.height !== undefined) {
                        clonedGraphics.drawRect(shape.x, shape.y, shape.width, shape.height);
                      }
                      clonedGraphics.endFill();
                    }
                  }
                } 
                // 尝试直接读取 geometry 属性
                else if (res.geometry && typeof res.geometry === 'object') {
                  // 绘制默认矩形，并设置颜色
                  clonedGraphics.beginFill(0xff0000);
                  clonedGraphics.drawRect(0, 0, 100, 100);
                  clonedGraphics.endFill();
                }
                else {
                  // 如果无法获取图形数据，至少绘制一个标记
                  clonedGraphics.beginFill(0xff0000);
                  clonedGraphics.drawRect(0, 0, 100, 100);
                  clonedGraphics.endFill();
                }
              } catch (e) {
                console.error(`[ResourceGroupNode ${this.id}] Error cloning graphics:`, e);
                // 兜底处理
                clonedGraphics.beginFill(0xff0000);
                clonedGraphics.drawRect(0, 0, 100, 100);
                clonedGraphics.endFill();
              }
              
              console.log(`[ResourceGroupNode ${this.id}] Created cloned Graphics:`, clonedGraphics);
              children.push(clonedGraphics);
            } 
            else if (res instanceof Sprite || res.constructor?.name === 'Sprite') {
              // Sprite 对象处理 - 不克隆，而是直接添加
              // 警告：直接添加 Sprite 可能导致问题，但我们先测试是否有问题
              console.log(`[ResourceGroupNode ${this.id}] Adding original Sprite (no clone):`, res);
              children.push(res);
            } 
            else {
              // 其他显示对象直接添加
              console.log(`[ResourceGroupNode ${this.id}] Adding original display object (no clone):`, res.constructor?.name);
              children.push(res);
            }
          } else if (hasConnectedInputs) {
            console.log(`[ResourceGroupNode ${this.id}] Unhandled input type:`, typeof res, res);
          }
        }
      }
    }
    
    // 即使 children 为空，也输出一个空数组，避免输出 undefined
    if (hasConnectedInputs && children.length > 0) {
      console.log(`[ResourceGroupNode ${this.id}] Outputting children:`, children.map(c => c.constructor?.name || c.type || 'unknown'));
    }
    
    this.setOutputData(0, children);
    
    // 强制图表在下一帧继续执行
    if (this.graph && hasConnectedInputs) {
      this.graph.beforeUpdateTime = 0;
    }
  };

  // 支持节点序列化/反序列化时自动恢复输入端口
  ResourceGroupNode.prototype.onConfigure = function(info: any) {
    if (info && info.inputs && info.inputs.length > 1) {
      for (let i = this.inputs.length; i < info.inputs.length; i++) {
        this.addInput(`Resource ${i + 1}`, '*');
      }
    }
  };

  LiteGraph.registerNodeType('resource/group', ResourceGroupNode);
}
