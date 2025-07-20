/**
 * 节点代码生成器
 * 使用 Handlebars 模板引擎根据节点定义生成代码
 */

import { LGraph, LGraphNode } from 'litegraph.js';

/**
 * 代码生成上下文
 */
interface CodeGenerationContext {
  getVarName(node: LGraphNode): string;
  getNodeById(id: string): LGraphNode | null;
  getConnectedNodes(node: LGraphNode): LGraphNode[];
  getNodeExecutionOrder(): LGraphNode[];
}

/**
 * 节点代码生成器
 * 负责将节点图转换为可执行的JavaScript代码
 */
export class NodeCodeGenerator {
  private varNameCounter = 0;
  private nodeVarMap = new Map<string, string>();

  /**
   * 为节点图生成代码
   * @param graph 节点图实例
   * @returns 生成的代码
   */
  generateCode(graph: LGraph): string {
    // 创建代码生成上下文
    const context = this.createContext(graph);
    
    // 分析节点依赖和执行顺序
    const sortedNodes = this.analyzeDependencies(graph);
    
    // 收集所有导入声明
    const imports = this.collectImports(sortedNodes);
    
    // 生成节点代码
    const nodesCode = this.generateNodesCode(sortedNodes, context);
    
    // 组装完整代码
    return this.assembleCode(imports, nodesCode, sortedNodes);
  }

  /**
   * 创建代码生成上下文
   */
  private createContext(graph: LGraph): CodeGenerationContext {
    return {
      getVarName: (node: LGraphNode) => this.getVarName(node),
      getNodeById: (id: string) => this.getNodeById(graph, id),
      getConnectedNodes: (node: LGraphNode) => this.getConnectedNodes(graph, node),
      getNodeExecutionOrder: () => this.analyzeDependencies(graph)
    };
  }

  /**
   * 分析节点依赖关系
   */
  private analyzeDependencies(graph: LGraph): LGraphNode[] {
    const nodes = (graph as any)._nodes || [];
    const visited = new Set<string>();
    const sorted: LGraphNode[] = [];
    
    // 拓扑排序
    const visit = (node: LGraphNode) => {
      if (visited.has(node.id)) return;
      visited.add(node.id);
      
      // 先处理依赖节点
      const inputs = (node as any).inputs || [];
      for (const input of inputs) {
        const linkId = input.link;
        if (linkId !== null && linkId !== undefined) {
          const link = (graph as any).links?.[String(linkId)];
          if (link) {
            const sourceNode = this.getNodeById(graph, link.origin_id);
            if (sourceNode) {
              visit(sourceNode);
            }
          }
        }
      }
      
      sorted.push(node);
    };
    
    // 处理所有节点
    for (const node of nodes) {
      visit(node);
    }
    
    return sorted;
  }

  /**
   * 收集所有节点的导入声明
   */
  private collectImports(nodes: LGraphNode[]): string[] {
    const imports = new Set<string>();
    
    for (const node of nodes) {
      const baseNode = node as unknown as any;
      if (baseNode.getImports && typeof baseNode.getImports === 'function') {
        const nodeImports = baseNode.getImports();
        if (Array.isArray(nodeImports)) {
          nodeImports.forEach(imp => imports.add(imp));
        }
      }
    }
    
    return Array.from(imports);
  }

  /**
   * 生成所有节点的代码
   */
  private generateNodesCode(nodes: LGraphNode[], context: CodeGenerationContext): string {
    if (nodes.length === 0) {
      return '    // 🔍 暂无节点，请在编辑器中添加节点';
    }

    const nodeCodeParts: string[] = [];
    
    for (const node of nodes) {
      const nodeCode = this.generateNodeCode(node, context);
      if (nodeCode) {
        nodeCodeParts.push(nodeCode);
      }
    }
    
    return nodeCodeParts.join('\n\n');
  }

  /**
   * 为单个节点生成代码
   */
  private generateNodeCode(node: LGraphNode, context: CodeGenerationContext): string {
    const baseNode = node as unknown as any;
    
    // 检查节点是否支持代码生成
    if (!baseNode.getCodeTemplate || typeof baseNode.getCodeTemplate !== 'function') {
      return `    // 节点 ${node.title || node.type} 未实现代码生成`;
    }
    
    try {
      // 获取代码模板
      const template = baseNode.getCodeTemplate();
      
      // 获取变量名
      const varName = context.getVarName(node);
      
      // 处理属性和输入
      const props = baseNode.processProperties?.(context) || {};
      const inputs = baseNode.processInputs?.(context) || {};
      
      // 编译模板数据
      const templateData = {
        varName,
        nodeTitle: node.title || node.type,
        nodeType: node.type,
        ...props,
        ...inputs
      };
      
      // 使用模板替换
      let processedCode = this.processTemplate(template, templateData);
      
      // 添加节点注释
      const comment = `    // 节点: ${node.title || node.type} (${node.type})`;
      
      return `${comment}\n${processedCode}`;
      
    } catch (error) {
      console.error(`生成节点 ${node.title || node.type} 代码时出错:`, error);
      return `    // 节点 ${node.title || node.type} 代码生成出错: ${error}`;
    }
  }

  /**
   * 处理代码模板
   */
  private processTemplate(template: string, data: Record<string, any>): string {
    let processedCode = template;
    
    // 替换变量占位符 {{varName}}
    Object.entries(data).forEach(([key, value]) => {
      if (typeof value === 'string') {
        processedCode = processedCode.replace(new RegExp(`{{${key}}}`, 'g'), value);
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        processedCode = processedCode.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
      }
    });
    
    // 处理条件块 {{#if xxx}} ... {{/if}}
    processedCode = this.processConditionals(processedCode, data);
    
    // 处理循环块 {{#each xxx}} ... {{/each}}
    processedCode = this.processLoops(processedCode, data);
    
    return processedCode;
  }

  /**
   * 处理条件块
   */
  private processConditionals(code: string, data: Record<string, any>): string {
    const conditionalRegex = /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g;
    
    return code.replace(conditionalRegex, (match, condition, content) => {
      if (data[condition]) {
        return content;
      }
      return '';
    });
  }

  /**
   * 处理循环块
   */
  private processLoops(code: string, data: Record<string, any>): string {
    const loopRegex = /\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g;
    
    return code.replace(loopRegex, (match, arrayName, content) => {
      const array = data[arrayName];
      if (Array.isArray(array)) {
        return array.map(item => {
          let itemContent = content;
          Object.entries(item).forEach(([key, value]) => {
            itemContent = itemContent.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
          });
          return itemContent;
        }).join('\n');
      }
      return '';
    });
  }

  /**
   * 获取节点的唯一变量名
   */
  private getVarName(node: LGraphNode): string {
    if (this.nodeVarMap.has(node.id)) {
      return this.nodeVarMap.get(node.id)!;
    }
    
    const baseNode = node as unknown as any;
    let prefix = 'node';
    
    // 尝试从节点获取变量前缀
    if (baseNode.getVariablePrefix && typeof baseNode.getVariablePrefix === 'function') {
      prefix = baseNode.getVariablePrefix();
    } else if (node.type) {
      // 从节点类型生成前缀
      prefix = node.type.split('/').pop()?.toLowerCase() || 'node';
    }
    
    const varName = `${prefix}_${++this.varNameCounter}`;
    this.nodeVarMap.set(node.id, varName);
    
    return varName;
  }

  /**
   * 根据ID获取节点
   */
  private getNodeById(graph: LGraph, id: string): LGraphNode | null {
    const nodes = (graph as any)._nodes || [];
    return nodes.find((node: LGraphNode) => node.id === id) || null;
  }

  /**
   * 获取连接的节点
   */
  private getConnectedNodes(graph: LGraph, node: LGraphNode): LGraphNode[] {
    const connected: LGraphNode[] = [];
    const inputs = (node as any).inputs || [];
    
    for (const input of inputs) {
      const linkId = input.link;
      if (linkId !== null && linkId !== undefined) {
        const link = (graph as any).links?.[String(linkId)];
        if (link) {
          const sourceNode = this.getNodeById(graph, link.origin_id);
          if (sourceNode) {
            connected.push(sourceNode);
          }
        }
      }
    }
    
    return connected;
  }

  /**
   * 组装完整代码
   */
  private assembleCode(imports: string[], nodesCode: string, nodes: LGraphNode[]): string {
    const timestamp = new Date().toISOString();
    const nodeCount = nodes.length;
    const nodeTypes = [...new Set(nodes.map(node => node.type || 'unknown'))];
    
    return `/**
 * 游戏逻辑代码 - 基于节点图生成
 * 生成时间: ${timestamp}
 * 节点数量: ${nodeCount}
 * 节点类型: ${nodeTypes.join(', ')}
 */

${imports.length > 0 ? imports.join('\n') + '\n' : ''}

/**
 * 初始化游戏逻辑
 * @param {PIXI.Application} app - PIXI应用实例
 * @returns {Object} 游戏上下文对象
 */
function initGameLogic(app) {
  // 创建舞台引用
  const stage = app.stage;
  
  // 游戏对象映射表
  const gameObjects = new Map();
  
  // 游戏状态
  const gameState = {
    score: 0,
    level: 1,
    isRunning: false,
    nodeCount: ${nodeCount}
  };
  
  console.log('🎮 初始化基于节点的游戏逻辑');
  console.log('📊 节点数量:', gameState.nodeCount);
  
  // === 节点生成的代码开始 ===
${nodesCode}
  // === 节点生成的代码结束 ===
  
  // 返回游戏上下文
  return {
    app,
    stage,
    gameObjects,
    gameState,
    
    // 游戏更新方法（每帧调用）
    update: function(deltaTime) {
      // 在这里可以添加游戏逻辑更新
      // 例如：动画、物理、状态管理等
    },
    
    // 清理方法
    destroy: function() {
      gameObjects.clear();
      stage.removeChildren();
      console.log('🧹 游戏逻辑已清理');
    }
  };
}

// 导出初始化函数到全局
window.initGameLogic = initGameLogic;`;
  }

  /**
   * 获取节点数量
   */
  getNodeCount(): number {
    return this.nodeVarMap.size;
  }

  /**
   * 获取节点类型
   */
  getNodeTypes(): string[] {
    // 这里需要从外部传入节点信息
    return [];
  }
}
