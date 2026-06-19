// 资源索引管理器 —— 纯逻辑类，不依赖 React
// 借鉴 VoidNovelEngine 的 &type("locator") 引用语法，统一管理游戏资源

// 资源类型
export type ResourceType = 'image' | 'audio' | 'video' | 'font' | 'style';

// 资源条目
export interface ResourceEntry {
  id: string;           // 资产卡片 ID 或自动生成 ID
  name: string;
  type: ResourceType;
  url: string;          // 实际可访问的 URL
  metadata?: {
    characterId?: string;  // 关联角色
    sceneId?: string;      // 关联场景
    nodeId?: string;       // 关联节点
    tags?: string[];
  };
}

// 资源引用语法正则：匹配 &type("id") 格式
// 支持: &image("bg_001"), &audio("bgm_main"), &video("cutscene_01")
const RESOURCE_REF_REGEX = /^&(image|audio|video|font|style)\(["']([^"']+)["']\)$/;

// 资源类型别名映射（用于将字符串映射为 ResourceType）
const TYPE_ALIASES: Record<string, ResourceType> = {
  image: 'image',
  audio: 'audio',
  video: 'video',
  font: 'font',
  style: 'style',
  // 兼容常见别名
  img: 'image',
  picture: 'image',
  bgm: 'audio',
  music: 'audio',
  sfx: 'audio',
  sound: 'audio',
  voice: 'audio',
};

// 解析资源引用语法 &type("id")
export function parseResourceRef(ref: string): { type: ResourceType; id: string } | null {
  if (typeof ref !== 'string') return null;
  const match = ref.trim().match(RESOURCE_REF_REGEX);
  if (!match) return null;
  const [, typeStr, id] = match;
  const type = TYPE_ALIASES[typeStr];
  if (!type) return null;
  return { type, id };
}

// 资源索引类
export class ResourceIndex {
  private entries: Map<string, ResourceEntry> = new Map();

  // 注册单个资源
  register(entry: ResourceEntry): void {
    if (!entry.id || !entry.url) return;
    this.entries.set(entry.id, { ...entry });
  }

  // 批量注册：从 AssetCard[] 导入
  // 仅注册 status === 'ready' 且有 url 的卡片
  registerFromAssetCards(
    cards: Array<{ id: string; name: string; type: string; url?: string; status: string }>
  ): void {
    for (const card of cards) {
      if (card.status !== 'ready') continue;
      if (!card.url) continue;
      const type = TYPE_ALIASES[card.type?.toLowerCase?.()] ?? 'image';
      this.register({
        id: card.id,
        name: card.name,
        type,
        url: card.url,
      });
    }
  }

  // 按 ID 查找
  resolve(id: string): ResourceEntry | undefined {
    return this.entries.get(id);
  }

  // 按引用语法查找 &type("id")
  resolveByRef(ref: string): ResourceEntry | undefined {
    const parsed = parseResourceRef(ref);
    if (!parsed) return undefined;
    return this.entries.get(parsed.id);
  }

  // 按类型筛选
  getByType(type: ResourceType): ResourceEntry[] {
    const result: ResourceEntry[] = [];
    for (const entry of this.entries.values()) {
      if (entry.type === type) result.push(entry);
    }
    return result;
  }

  // 按角色筛选
  getByCharacter(characterId: string): ResourceEntry[] {
    const result: ResourceEntry[] = [];
    for (const entry of this.entries.values()) {
      if (entry.metadata?.characterId === characterId) result.push(entry);
    }
    return result;
  }

  // 按场景筛选
  getByScene(sceneId: string): ResourceEntry[] {
    const result: ResourceEntry[] = [];
    for (const entry of this.entries.values()) {
      if (entry.metadata?.sceneId === sceneId) result.push(entry);
    }
    return result;
  }

  // 注销单个资源
  unregister(id: string): void {
    this.entries.delete(id);
  }

  // 清空所有资源
  clear(): void {
    this.entries.clear();
  }

  // 获取所有资源
  getAll(): ResourceEntry[] {
    return Array.from(this.entries.values());
  }

  // 序列化为数组（用于导出）
  toJSON(): ResourceEntry[] {
    return this.getAll();
  }

  // 从数组反序列化
  fromJSON(entries: ResourceEntry[]): void {
    this.entries.clear();
    for (const entry of entries) {
      this.register(entry);
    }
  }
}
