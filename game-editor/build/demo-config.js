/**
 * 模块配置示例 - Demo Config
 * 演示编辑器如何动态配置游戏模块
 * 
 * 编辑器将根据节点图生成类似的配置
 */

// 示例：配置游戏模块
window.configureGameModules({
    // 资源管理模块
    resource: {
        description: '资源管理系统',
        priority: 10,        // 高优先级，最先加载
        required: true,      // 必需模块
        className: 'ResourceManager',
        dependencies: []     // 无依赖
    },
    
    // 音频系统模块
    audio: {
        description: '音频播放系统',
        priority: 20,
        required: false,     // 可选模块
        className: 'AudioManager',
        dependencies: ['resource']  // 依赖资源模块
    },
    
    // 状态管理模块
    state: {
        description: '游戏状态管理',
        priority: 30,
        required: true,
        className: 'StateManager',
        dependencies: []
    },
    
    // 输入处理模块
    input: {
        description: '输入事件处理',
        priority: 40,
        required: true,
        className: 'InputManager',
        dependencies: ['state']
    },
    
    // 场景管理模块
    scene: {
        description: '场景切换管理',
        priority: 50,
        required: true,
        className: 'SceneManager',
        dependencies: ['state', 'resource']
    },
    
    // UI系统模块
    ui: {
        description: 'UI界面系统',
        priority: 60,
        required: false,
        className: 'UIManager',
        dependencies: ['resource', 'input'],
        optionalDependencies: ['audio']
    },
    
    // 主游戏逻辑模块
    main: {
        description: '主游戏逻辑',
        priority: 100,      // 最后加载
        required: true,
        className: 'GameMain',
        dependencies: ['resource', 'state', 'input', 'scene'],
        optionalDependencies: ['audio', 'ui']
    }
});

console.log('📋 演示模块配置已加载，共7个模块');
console.log('🔄 模块加载顺序：resource → audio → state → input → scene → ui → main');
