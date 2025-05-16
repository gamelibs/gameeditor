/**
 * Container type definitions for the game editor
 * Defines the types of containers used in the hierarchy
 */

/**
 * Container types definition
 * 使用 const 对象替代 enum 以兼容 erasableSyntaxOnly
 */
export const ContainerType = {
  // Root container
  ROOT: 'root',
  STAGE: 'stage', // 保留兼容性

  // Layer containers
  UI_LAYER: 'ui_layer',
  GAME_LAYER: 'game_layer',
  SYSTEM_LAYER: 'system_layer',

  // UI containers
  LOADING: 'loading',
  MAIN_MENU: 'main_menu',
  GAME_UI: 'game_ui',
  POPUP: 'popup',

  // Game containers
  BACKGROUND: 'background',
  ENTITY: 'entity',
  EFFECT: 'effect',

  // System containers
  DEBUG: 'debug',
  TRANSITION: 'transition',
  
  // Generic container
  GENERIC: 'generic'
} as const;

// 为类型检查定义类型
export type ContainerTypeKeys = keyof typeof ContainerType;
export type ContainerTypeValues = typeof ContainerType[ContainerTypeKeys];

/**
 * Layer priorities definition
 * Higher values = rendered on top
 * 使用 const 对象替代 enum 以兼容 erasableSyntaxOnly
 */
export const LayerPriority = {
  BACKGROUND: 10,
  GAME: 20,
  ENTITY: 30,
  EFFECT: 40,
  UI_BACKGROUND: 50,
  UI: 60,
  POPUP: 70,
  SYSTEM: 80,
  DEBUG: 90,
  TRANSITION: 100
} as const;

// 为类型检查定义类型
export type LayerPriorityKeys = keyof typeof LayerPriority;
export type LayerPriorityValues = typeof LayerPriority[LayerPriorityKeys];

/**
 * Container lifecycle states definition
 * 使用 const 对象替代 enum 以兼容 erasableSyntaxOnly
 */
export const ContainerLifecycleState = {
  UNINITIALIZED: 'uninitialized',  // Container is created but not initialized
  INITIALIZED: 'initialized',       // Container is initialized but not active
  ACTIVE: 'active',                 // Container is active and visible
  INACTIVE: 'inactive',             // Container is initialized but inactive and invisible
  DESTROYED: 'destroyed'            // Container is destroyed
} as const;

// 为类型检查定义类型
export type ContainerLifecycleStateKeys = keyof typeof ContainerLifecycleState;
export type ContainerLifecycleStateValues = typeof ContainerLifecycleState[ContainerLifecycleStateKeys];
