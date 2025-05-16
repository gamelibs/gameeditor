// pixiEventNode.ts: 事件管理节点，用于处理各种UI事件
import { Logger } from '../../pixiNodeLogger';

export function registerPixiEventNode(LiteGraph: any) {
  function PixiEventNode(this: any) {
    this.title = "Event Handler";
    this.color = "#2e8f38";
    this.boxcolor = "#34a042";
    
    // 事件输入（可以从多个UI组件接收事件）
    this.addInput("event", "event");
    
    // 事件类型和名称
    this.properties = {
      eventId: "",         // 事件唯一标识
      eventType: "click",  // 事件类型 (click, hover, etc)
      eventName: "Click Event" // 事件显示名称
    };
    
    // 使用默认事件ID
    if (!this.properties.eventId) {
      this.properties.eventId = "event_" + Math.floor(Math.random() * 10000);
    }
    
    // 配置选项
    this.addWidget("text", "Event Name", this.properties.eventName, (v: string) => {
      this.properties.eventName = v;
    });
    
    this.addWidget("combo", "Event Type", this.properties.eventType, (v: string) => {
      this.properties.eventType = v;
      // 更新输出端口
      this.updateOutputs();
    }, { values: ["click", "hover", "press", "release"] });
    
    // 添加测试按钮
    this.addWidget("button", "测试事件", null, () => {
      console.log('🔘 点击了事件处理器的测试按钮');
      this.testTrigger();
    });
    
    // 添加事件输出（根据事件类型可以有不同输出）
    this.addOutput("triggered", "event");
    
    // 保存内部状态
    this._lastEventTime = 0;
    this._eventCount = 0;
    
    // 确保 onAction 方法被正确绑定到实例
    console.log('EventHandler 节点初始化, ID:', this.id);
    if (typeof this.onAction !== 'function') {
      console.error('❌ onAction 方法未定义!');
    }
  }
  
  // 更新输出端口以匹配事件类型
  PixiEventNode.prototype.updateOutputs = function() {
    // 基本的触发输出总是存在
    if (!this.outputs || this.outputs.length === 0) {
      this.addOutput("triggered", "event");
    }
    
    // 根据事件类型添加特定输出
    if (this.properties.eventType === "hover") {
      // 悬停事件添加额外的开始/结束输出
      if (this.outputs.length < 3) {
        this.addOutput("hoverStart", "event");
        this.addOutput("hoverEnd", "event");
      }
    } else if (this.outputs.length > 1) {
      // 移除不需要的输出端口
      this.outputs.splice(1, this.outputs.length - 1);
    }
  };
  
  // 当节点接收到事件时
  PixiEventNode.prototype.onAction = function(action: string, data: any) {
    // 通用事件处理
    const now = Date.now();
    this._eventCount++;
    this._lastEventTime = now;
    
    // 添加强烈的视觉反馈
    this._flashColor = "#ff0";  // 黄色闪烁
    setTimeout(() => { this._flashColor = "#0f0"; }, 100);  // 然后变绿
    setTimeout(() => { this._flashColor = null; }, 500);    // 最后恢复正常
    this.setDirtyCanvas(true, true); // 强制重绘节点
    
    Logger.info("PixiEventNode", `📨 接收到事件: ${action || "未知"}, 数据:`, data);
    Logger.info("PixiEventNode", `事件信息 - ID: ${this.id}, 名称: ${this.properties.eventName}, 类型: ${this.properties.eventType}`);
    console.log("❗ 事件处理器收到事件:", {action, data}); // 在控制台直接输出，方便调试
    
    // 触发输出事件
    Logger.info("PixiEventNode", `📤 触发输出事件 (slot 0)`);
    this.triggerSlot(0, data);
    
    // 根据事件类型处理特定输出
    if (this.properties.eventType === "hover") {
      if (action === "hoverStart") {
        Logger.info("PixiEventNode", `触发悬停开始事件 (slot 1)`);
        this.triggerSlot(1, data);
      } else if (action === "hoverEnd") {
        Logger.info("PixiEventNode", `触发悬停结束事件 (slot 2)`);
        this.triggerSlot(2, data);
      }
    }
  };
  
  PixiEventNode.prototype.onExecute = function() {
    // 节点每帧执行的逻辑（如果需要）
    
    // 每隔5秒自我触发一次测试事件（仅用于调试）
    const now = Date.now();
    if (!this._lastTestTime || now - this._lastTestTime > 5000) {
      // 暂时注释掉自动测试，需要时可以取消注释
      // this._lastTestTime = now;
      // console.log('🔄 EventHandler 节点自我测试事件');
      // this.onAction('test', {type: 'self-test', time: now});
    }
  };
  
  // 添加手动测试方法
  PixiEventNode.prototype.testTrigger = function() {
    console.log('🧪 手动触发事件处理器测试');
    
    // 创建一个包含更多信息的事件数据对象
    const eventData = {
      type: 'manual-test',
      time: Date.now(),
      source: 'EventHandler',
      id: this.id,
      name: this.properties.eventName,
      eventType: this.properties.eventType,
      // 添加特殊标记，指示这是测试事件，应该播放音频
      playAudio: true,
      buttonId: 'test-button-' + Math.floor(Math.random() * 1000)
    };
    
    // 调用onAction处理事件
    this.onAction('manual-test', eventData);
    
    // 查找连接的节点并尝试直接触发它们的音频播放
    if (this.outputs && this.outputs.length > 0) {
      const output = this.outputs[0];  // 第一个输出端口
      if (output.links && output.links.length > 0) {
        // 对于每个连接的链接
        for (let i = 0; i < output.links.length; ++i) {
          const linkId = output.links[i];
          const linkedNode = this.graph._nodes.find(n => n.inputs && n.inputs.some(input => 
            input.link === linkId
          ));
          
          if (linkedNode && typeof linkedNode.onAction === 'function') {
            // 如果连接的节点有onAction方法，直接调用它触发"playAudio"动作
            Logger.info("PixiEventNode", `🔊 直接调用连接节点(${linkedNode.id})的onAction('playAudio')`);
            console.log(`🔊 直接调用节点的播放方法:`, linkedNode.id);
            linkedNode.onAction("playAudio", eventData);
          }
        }
      }
    }
    
    return true;
  };
  
  // 初始化闪烁颜色属性
  PixiEventNode.prototype._flashColor = null;
  
  // 处理UI绘制以显示事件状态
  PixiEventNode.prototype.onDrawBackground = function(ctx: CanvasRenderingContext2D) {
    if (!this.flags.collapsed) {
      const now = Date.now();
      const timeSinceEvent = now - this._lastEventTime;
      
      // 如果有闪烁颜色，绘制背景矩形（强调整个节点）
      if (this._flashColor) {
        const oldFill = ctx.fillStyle;
        ctx.fillStyle = this._flashColor;
        ctx.fillRect(0, 0, this.size[0], this.size[1]);
        ctx.fillStyle = oldFill;
      }
      
      // 如果最近有事件触发，显示一个指示器
      if (timeSinceEvent < 2000) { // 扩展到2秒，更容易注意到
        const alpha = 1 - (timeSinceEvent / 2000);
        ctx.fillStyle = `rgba(255,120,0,${alpha})`; // 橙色，更显眼
        ctx.beginPath();
        ctx.arc(this.size[0] - 10, 10, 8, 0, 2 * Math.PI); // 更大的圆点
        ctx.fill();
      }
      
      // 显示事件计数，大一点更明显
      ctx.fillStyle = "#FFF"; // 白色更显眼
      ctx.font = "bold 11px Arial";
      ctx.fillText(`Events: ${this._eventCount}`, 5, this.size[1] - 8);
      
      // 如果最近收到事件，显示最后事件时间
      if (timeSinceEvent < 5000) {
        const secondsAgo = Math.floor(timeSinceEvent / 1000);
        ctx.fillStyle = "#FFF";
        ctx.font = "9px Arial"; 
        ctx.fillText(`${secondsAgo}s ago`, this.size[0] - 40, this.size[1] - 8);
      }
    }
  };
  
  // 注册节点
  LiteGraph.registerNodeType("event/handler", PixiEventNode);
}
