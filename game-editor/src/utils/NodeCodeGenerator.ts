/**
 * 节点代码生成器
 * 使用 Handlebars 模板引擎根据节点定义生成代码
 */

import { BaseNode } from '../pixi-nodes/base/BaseNode';

// LiteGraph类型声明
interface LGraphNode {
  id: string;
  title?: string;
  type?: string;
  inputs?: Array<{
    link?: number;
    name?: string;
    type?: string;
  }>;
  outputs?: Array<{
    links?: number[];
    name?: string;
    type?: string;
  }>;
}

interface LGraph {
  links: Record<string, {
    origin_id: string;
    origin_slot: number;
    target_id: string;
    target_slot: number;
  }>;
  
  getNodeById(id: string): LGraphNode | null;
  getNodesInOrder(): LGraphNode[];
}

// 代码生成上下文
export interface CodeGenerationContext {
  // 节点实例映射表
  nodeMap: Map<string, LGraphNode>;
  
  // 节点输出变量名映射表
  outputVarNames: Map<string, string>;
  
  // 获取节点变量名
  getVarName(node: LGraphNode): string;
  
  // 获取连接到指定输入槽的输出节点变量名
  getInputVarName(node: LGraphNode, inputIndex: number): string | undefined;
  
  // 注册一个部分模板
  registerPartial(name: string, template: string): void;
}

/**
 * 节点代码生成器类
 */
export class NodeCodeGenerator {
  // 部分模板集合
  private partialTemplates: Map<string, string> = new Map();
  
  constructor() {
    // 注册默认部分模板
    this.registerDefaultPartials();
  }
  
  /**
   * 注册默认部分模板
   */
  private registerDefaultPartials() {
    // 处理容器输入的部分模板
    this.partialTemplates.set('processContainerInput', `
if ({{input}}) {
  if (Array.isArray({{input}})) {
    // 处理数组输入
    {{input}}.forEach(item => {
      if (item) {
        {{container}}{{containerSuffix}}.addChild(item);
      }
    });
  } else if ({{input}} instanceof PIXI.Container && {{input}}.children && {{input}}.children.length > 0) {
    // 处理容器输入，提取子元素
    const children = [...{{input}}.children];
    children.forEach(child => {
      // 从原父容器中移除
      if (child && child.parent) {
        child.parent.removeChild(child);
      }
      {{container}}{{containerSuffix}}.addChild(child);
    });
  } else {
    // 处理单个对象
    if ({{input}}.parent) {
      {{input}}.parent.removeChild({{input}});
    }
    {{container}}{{containerSuffix}}.addChild({{input}});
  }
}
`);
  }
  // 添加私有属性来保存当前生成的节点信息
  private currentNodeCount: number = 0;
  private currentNodeTypes: string[] = [];
  
  /**
   * 为节点图生成代码
   * @param graph 节点图实例
   * @returns 生成的代码
   */
  generateCode(graph: LGraph): string {
    // 创建代码生成上下文
    const context = this.createContext(graph);
    
    // 分析节点依赖
    const sortedNodes = this.analyzeDependencies(graph);
    
    // 保存节点信息
    this.currentNodeCount = sortedNodes.length;
    this.currentNodeTypes = [...new Set(sortedNodes.map(node => node.type || 'unknown'))];
    
    // 收集所有导入声明
    const imports = this.collectImports(sortedNodes);
    
    // 生成节点代码
    const nodesCode = this.generateNodesCode(sortedNodes, context);
    
    // 组装完整代码
    return this.assembleCode(imports, nodesCode);
  }
  
  /**
   * 创建代码生成上下文
   */
  private createContext(graph: LGraph): CodeGenerationContext {
    const nodeMap = new Map<string, LGraphNode>();
    const outputVarNames = new Map<string, string>();
    
    // 收集所有节点
    const nodes = graph.getNodesInOrder();
    nodes.forEach((node: LGraphNode) => {
      nodeMap.set(node.id, node);
      
      // 生成唯一变量名
      const baseNode = node as unknown as BaseNode;
      const prefix = baseNode.getVariablePrefix?.() || 'node';
      const varName = `${prefix}_${node.id.replace ? node.id.replace(/[^\w]/g, '_') : node.id}`;
      
      outputVarNames.set(node.id, varName);
    });
    
    return {
      nodeMap,
      outputVarNames,
      
      // 获取节点变量名
      getVarName: (node: LGraphNode) => {
        return outputVarNames.get(node.id) || `node_${node.id.replace(/[^\w]/g, '_')}`;
      },
      
      // 获取连接到输入的节点变量名
      getInputVarName: (node: LGraphNode, inputIndex: number) => {
        const input = node.inputs?.[inputIndex];
        if (!input || !input.link) return undefined;
        
        const linkInfo = graph.links[input.link];
        if (!linkInfo) return undefined;
        
        const sourceNodeId = linkInfo.origin_id;
        return outputVarNames.get(sourceNodeId);
      },
      
      // 注册部分模板
      registerPartial: (name: string, template: string) => {
        this.partialTemplates.set(name, template);
      }
    };
  }
  
  /**
   * 分析节点依赖关系，返回排序后的节点列表
   */
  private analyzeDependencies(graph: LGraph): LGraphNode[] {
    const nodes = graph.getNodesInOrder();
    const visited = new Set<string>();
    const result: LGraphNode[] = [];
    
    // 简单拓扑排序，确保依赖节点先于被依赖节点处理
    const visit = (node: LGraphNode) => {
      if (visited.has(node.id)) return;
      visited.add(node.id);
      
      // 获取该节点所有输入连接
      for (let i = 0; i < (node.inputs?.length || 0); i++) {
        const input = node.inputs![i];
        if (input.link) {
          const linkInfo = graph.links[input.link];
          if (linkInfo) {
            const sourceNodeId = linkInfo.origin_id;
            const sourceNode = graph.getNodeById(sourceNodeId);
            if (sourceNode) {
              visit(sourceNode);
            }
          }
        }
      }
      
      result.push(node);
    };
    
    // 遍历所有节点
    nodes.forEach(visit);
    
    return result;
  }
  
  /**
   * 收集所有节点的导入声明
   */
  private collectImports(nodes: LGraphNode[]): string[] {
    const importSet = new Set<string>();
    
    nodes.forEach(node => {
      const baseNode = node as unknown as BaseNode;
      if (baseNode.getImports) {
        const imports = baseNode.getImports();
        imports.forEach(imp => importSet.add(imp));
      }
    });
    
    return Array.from(importSet);
  }
  
  /**
   * 为所有节点生成代码
   */
  private generateNodesCode(nodes: LGraphNode[], context: CodeGenerationContext): string {
    let code = '';
    
    nodes.forEach(node => {
      const nodeCode = this.generateNodeCode(node, context);
      if (nodeCode) {
        code += `\n// ${node.title || node.type}\n`;
        code += nodeCode;
        code += '\n';
      }
    });
    
    return code;
  }
  
  /**
   * 为单个节点生成代码
   */
  private generateNodeCode(node: LGraphNode, context: CodeGenerationContext): string {
    const baseNode = node as unknown as BaseNode;
    if (!baseNode.getCodeTemplate) {
      return `// 节点 ${node.title || node.type} 未实现代码生成\n`;
    }
    
    try {
      // 获取模板
      const template = baseNode.getCodeTemplate();
      
      // 获取变量名
      const varName = context.getVarName(node);
      
      // 处理属性和输入
      const props = baseNode.processProperties?.(context) || {};
      const inputs = baseNode.processInputs?.(context) || {};
      
      // 编译模板数据
      const templateData = {
        varName,
        ...props,
        inputs
      };
      
      // 使用简单模板替换（实际项目中可以使用 Handlebars 等模板引擎）
      let processedCode = template;
      
      // 替换变量
      Object.entries(templateData).forEach(([key, value]) => {
        if (typeof value === 'string') {
          processedCode = processedCode.replace(new RegExp(`{{${key}}}`, 'g'), value);
        }
      });
      
      // 处理条件块 {{#if xxx}} ... {{/if}}
      processedCode = this.processConditionals(processedCode, templateData);
      
      // 处理部分模板 {{> partialName param1 param2}}
      processedCode = this.processPartials(processedCode, templateData);
      
      return processedCode;
    } catch (error) {
      console.error(`生成节点 ${node.title || node.type} 代码时出错:`, error);
      return `// 节点 ${node.title || node.type} 代码生成出错: ${error}\n`;
    }
  }
  
  /**
   * 处理条件块
   */
  private processConditionals(template: string, data: any): string {
    // 简单的条件块处理
    const ifRegex = /{{#if\s+([^}]+)}}\n?([\s\S]*?){{\/if}}/g;
    
    return template.replace(ifRegex, (_match, condition, content) => {
      // 解析条件表达式
      let conditionValue = false;
      const conditionPath = condition.trim().split('.');
      
      // 遍历对象路径
      let current = data;
      for (const key of conditionPath) {
        current = current?.[key];
        if (current === undefined) break;
      }
      
      // 检查条件是否成立
      conditionValue = !!current;
      
      return conditionValue ? content : '';
    });
  }
  
  /**
   * 处理部分模板
   */
  private processPartials(template: string, data: any): string {
    // 查找部分模板引用 {{> partialName param1 param2 param3}}
    const partialRegex = /{{>\s+([^\s}]+)([^}]*)}}/g;
    
    return template.replace(partialRegex, (_match, partialName, paramsStr) => {
      // 获取部分模板
      const partialTemplate = this.partialTemplates.get(partialName.trim());
      if (!partialTemplate) {
        return `/* 未找到部分模板: ${partialName} */`;
      }
      
      // 解析参数
      const params = paramsStr.trim().split(/\s+/);
      const partialData: Record<string, any> = {};
      
      // 将参数映射为新的数据对象
      params.forEach((param: any, index: number) => {
        // 使用参数名或数字索引作为键
        const key = `param${index}`;
        
        // 解析参数值
        let value = param;
        const paramPath = param.split('.');
        
        // 遍历对象路径获取值
        let current = data;
        for (const key of paramPath) {
          current = current?.[key];
          if (current === undefined) break;
        }
        
        value = current !== undefined ? current : param;
        
        // 添加到模板数据
        switch (index) {
          case 0:
            partialData.input = value;
            break;
          case 1:
            partialData.container = value;
            break;
          case 2:
            partialData.containerSuffix = value;
            break;
          default:
            partialData[key] = value;
        }
      });
      
      // 递归处理部分模板中的变量替换
      let processedPartial = partialTemplate;
      
      // 替换变量
      Object.entries(partialData).forEach(([key, value]) => {
        if (typeof value === 'string') {
          processedPartial = processedPartial.replace(new RegExp(`{{${key}}}`, 'g'), value);
        }
      });
      
      // 处理条件块
      processedPartial = this.processConditionals(processedPartial, partialData);
      
      return processedPartial;
    });
  }
  
  /**
   * 组装完整代码
   */
  private assembleCode(imports: string[], nodesCode: string): string {
    return `/**
 * 游戏逻辑代码 - 基于节点生成
 * 生成时间: ${new Date().toLocaleString()}
 * 节点数量: ${this.getNodeCount()}
 * 节点类型: ${this.getNodeTypes().join(', ')}
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
    nodeCount: ${this.getNodeCount()}
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
window.initGameLogic = initGameLogic;
`;
  }

  /**
   * 获取节点数量（辅助方法）
   */
  private getNodeCount(): number {
    // 这个方法需要在生成代码时调用，所以需要保存节点信息
    return this.currentNodeCount || 0;
  }

  /**
   * 获取节点类型列表（辅助方法）
   */
  private getNodeTypes(): string[] {
    return this.currentNodeTypes || [];
  }

  // 添加私有属性来保存当前生成的节点信息
  private currentNodeCount: number = 0;
  private currentNodeTypes: string[] = [];
}
