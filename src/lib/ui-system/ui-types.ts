/**
 * UI 系统类型定义
 * 借鉴 VoidNovelEngine 的 .ui 系统，定义运行时 UI 元素、定义与实例的结构
 */

/** UI 元素类型 */
export type UIElementType =
  | 'button'        // 按钮
  | 'label'         // 文本标签
  | 'image'         // 图片
  | 'panel'         // 面板/容器
  | 'list'          // 列表
  | 'slider'        // 滑块
  | 'checkbox'      // 复选框
  | 'input'         // 输入框
  | 'progress'      // 进度条
  | 'divider';      // 分割线

/** 布局方向 */
export type UILayout = 'horizontal' | 'vertical' | 'grid';

/** 显示动画 */
export type UIAnimation = 'fade' | 'slide' | 'scale' | 'none';

/** UI 元素 — 构成 UI 树的最小节点 */
export interface UIElement {
  /** 元素 ID（在单个 UI 定义内唯一） */
  id: string;
  /** 元素类型 */
  type: UIElementType;
  /** 文本内容（label / button 使用） */
  text?: string;
  /** 图片 URL（image 类型使用） */
  imageUrl?: string;
  /** 子元素（panel / list 类型可以有子元素） */
  children?: UIElement[];
  /** 样式类名 */
  className?: string;
  /** 内联样式 */
  style?: Record<string, string | number>;
  /** 事件回调 ID（由 UIManager 路由到已注册的处理器） */
  onClick?: string;
  /** 是否可见（默认 true） */
  visible?: boolean;
  /** 布局方式（panel 类型使用） */
  layout?: UILayout;
  /** grid 列数（layout 为 grid 时生效） */
  gridColumns?: number;
  /** 数据绑定键名（运行时可绑定到元素状态） */
  dataBinding?: string;
  /** 滑块最小值（slider 类型使用） */
  min?: number;
  /** 滑块最大值（slider 类型使用） */
  max?: number;
  /** 滑块步长（slider 类型使用） */
  step?: number;
  /** 当前值（slider / checkbox / input / progress 使用） */
  value?: number | string | boolean;
}

/** UI 定义 — 描述一个 UI 的静态结构 */
export interface UIDefinition {
  /** 定义 ID（唯一） */
  id: string;
  /** 名称 */
  name: string;
  /** 描述 */
  description?: string;
  /** 根元素 */
  root: UIElement;
  /** 是否模态（模态 UI 会显示遮罩层） */
  modal: boolean;
  /** 是否可关闭 */
  closable: boolean;
  /** 显示动画 */
  animation?: UIAnimation;
  /** 层级（z-index） */
  zIndex?: number;
}

/** UI 实例 — 运行时创建的 UI 对象 */
export interface UIInstance {
  /** 实例 ID（全局唯一） */
  id: string;
  /** 引用的 UI 定义 ID */
  definitionId: string;
  /** 是否可见 */
  visible: boolean;
  /** 运行时状态（元素 ID → 值） */
  elementStates: Record<string, any>;
  /** 创建时间戳 */
  createdAt: number;
  /** 是否模态 */
  modal: boolean;
}

/** UI 系统状态（用于序列化） */
export interface UISystemState {
  /** 活跃实例列表 */
  activeInstances: UIInstance[];
  /** 已注册定义 ID 列表 */
  registeredDefinitions: string[];
}

/** UI 事件 — 元素交互产生的运行时事件 */
export interface UIEvent {
  /** 触发事件的实例 ID */
  instanceId: string;
  /** 触发事件的元素 ID */
  elementId: string;
  /** 事件类型 */
  eventType: 'click' | 'change' | 'submit';
  /** 事件携带的值 */
  value?: any;
}
