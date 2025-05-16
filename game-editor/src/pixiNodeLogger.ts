/**
 * 日志系统，用于控制 PixiNodes 的日志输出
 */

// 日志级别定义
export const LogLevels = {
  NONE: 0,      // 不输出任何日志
  ERROR: 1,     // 只输出错误
  WARNING: 2,   // 输出错误和警告
  INFO: 3,      // 输出基本信息（默认）
  DEBUG: 4      // 输出所有调试信息
};

// 日志级别名称，用于UI显示
export const LogLevelNames = {
  [LogLevels.NONE]: "None",
  [LogLevels.ERROR]: "Error",
  [LogLevels.WARNING]: "Warning",
  [LogLevels.INFO]: "Info",
  [LogLevels.DEBUG]: "Debug"
};

// 默认日志级别（调试时设置为 INFO，生产环境可改为 NONE）
let currentLogLevel = LogLevels.INFO;

// 日志工具函数
export const Logger = {
  error: (tag: string, ...args: any[]) => {
    if (currentLogLevel >= LogLevels.ERROR) {
      console.error(`[${tag}]`, ...args);
    }
  },
  warn: (tag: string, ...args: any[]) => {
    if (currentLogLevel >= LogLevels.WARNING) {
      console.warn(`[${tag}]`, ...args);
    }
  },
  info: (tag: string, ...args: any[]) => {
    if (currentLogLevel >= LogLevels.INFO) {
      console.log(`[${tag}]`, ...args);
    }
  },
  debug: (tag: string, ...args: any[]) => {
    if (currentLogLevel >= LogLevels.DEBUG) {
      console.log(`[${tag} DEBUG]`, ...args);
    }
  },
  // 设置日志级别
  setLevel: (level: number) => {
    if (level >= LogLevels.NONE && level <= LogLevels.DEBUG) {
      currentLogLevel = level;
      console.log(`PixiNodes 日志级别已设置为: ${LogLevelNames[level]} (${level})`);
      return true;
    } else {
      console.warn(`无效的日志级别: ${level}, 保持当前级别: ${LogLevelNames[currentLogLevel]} (${currentLogLevel})`);
      return false;
    }
  },
  // 获取当前日志级别
  getLevel: () => {
    return currentLogLevel;
  },
  // 获取当前日志级别名称
  getLevelName: () => {
    return LogLevelNames[currentLogLevel];
  }
};

// 初始化LiteGraph日志控制
export function setupPixiNodeLogger(LiteGraph: any) {
  // 暴露日志控制功能
  LiteGraph.PixiNodes = LiteGraph.PixiNodes || {};
  LiteGraph.PixiNodes.Logger = Logger;
  LiteGraph.PixiNodes.LogLevels = LogLevels;
  LiteGraph.PixiNodes.LogLevelNames = LogLevelNames;
  
  // 提供简便的全局方法
  LiteGraph.setPixiNodeLogLevel = (level: number) => {
    return Logger.setLevel(level);
  };
  
  LiteGraph.getPixiNodeLogLevel = () => {
    return Logger.getLevel();
  };
  
  // 添加提示
  console.log(`PixiNodes 日志系统已初始化，当前级别: ${LogLevelNames[currentLogLevel]} (${currentLogLevel})`);
  console.log(`可通过 LiteGraph.setPixiNodeLogLevel(level) 设置日志级别，可用级别:`);
  console.log(`  NONE: ${LogLevels.NONE} - 不输出任何日志`);
  console.log(`  ERROR: ${LogLevels.ERROR} - 只输出错误`);
  console.log(`  WARNING: ${LogLevels.WARNING} - 输出警告和错误`);
  console.log(`  INFO: ${LogLevels.INFO} - 输出基本信息`);
  console.log(`  DEBUG: ${LogLevels.DEBUG} - 输出所有调试信息`);
  console.log(`示例: LiteGraph.setPixiNodeLogLevel(${LogLevels.ERROR}) 设置为仅显示错误`);
}
