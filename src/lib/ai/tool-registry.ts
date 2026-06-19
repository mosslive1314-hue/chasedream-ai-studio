/**
 * Internal Tool Registry — 工具定义、注册、查找
 *
 * 管理画布原生 Agent 可用的所有工具。
 * 每个工具对应一个 Store action，通过 handler 调用。
 * 危险操作（remove_*）标记为 dangerous，执行前需 HITL 确认。
 */

import type { ToolDefinition } from './model-router';
import { useDciStore } from '@/store/use-dci-store';
import { useVersionStore } from '@/store/use-version-store';
import { useCollabStore } from '@/store/use-collab-store';
import { useProjectStore } from '@/store/use-project-store';
import { useExportStore } from '@/store/use-export-store';
import { useAnalyticsStore } from '@/store/use-analytics-store';

// ─── 工具执行结果 ────────────────────────────────────────

/** 工具执行结果 */
export interface ToolResult {
  /** 是否成功 */
  success: boolean;
  /** 返回数据 */
  data?: unknown;
  /** 错误信息 */
  error?: string;
  /** 是否需要 HITL 确认 */
  requiresConfirmation?: boolean;
  /** HITL 确认描述 */
  confirmationDescription?: string;
}

/** 工具处理函数签名 */
export type ToolHandler = (args: Record<string, unknown>) => Promise<ToolResult>;

/** 工具分类 */
export type ToolCategory = 'node' | 'edge' | 'character' | 'scene' | 'variable' | 'script' | 'query';

/** 已注册的工具 */
export interface RegisteredTool {
  /** 工具定义（OpenAI function calling 格式） */
  definition: ToolDefinition;
  /** 工具执行处理函数 */
  handler: ToolHandler;
  /** 是否为危险操作（需要 HITL） */
  dangerous: boolean;
  /** 工具分类 */
  category: ToolCategory;
}

// ─── ToolRegistry 类 ────────────────────────────────────

/**
 * ToolRegistry — 工具注册中心
 *
 * 管理所有 Agent 可用的工具，支持注册、查找、执行。
 */
export class ToolRegistry {
  private tools: Map<string, RegisteredTool> = new Map();

  /**
   * 注册一个工具
   *
   * @param definition - 工具定义（OpenAI function calling 格式）
   * @param handler - 工具执行函数
   * @param options - 可选配置（dangerous 标记、分类）
   */
  register(
    definition: ToolDefinition,
    handler: ToolHandler,
    options?: { dangerous?: boolean; category?: ToolCategory }
  ): void {
    this.tools.set(definition.function.name, {
      definition,
      handler,
      dangerous: options?.dangerous ?? false,
      category: options?.category ?? 'query',
    });
  }

  /**
   * 获取指定名称的已注册工具
   */
  getTool(name: string): RegisteredTool | undefined {
    return this.tools.get(name);
  }

  /**
   * 获取所有工具的定义列表（用于传递给 LLM 的 tools 参数）
   */
  getToolDefinitions(): ToolDefinition[] {
    return Array.from(this.tools.values()).map((t) => t.definition);
  }

  /**
   * 执行指定名称的工具
   */
  async execute(name: string, args: Record<string, unknown>): Promise<ToolResult> {
    const tool = this.tools.get(name);
    if (!tool) {
      return { success: false, error: `未知工具: ${name}` };
    }
    return tool.handler(args);
  }

  /**
   * 获取所有已注册的工具名称
   */
  getToolNames(): string[] {
    return Array.from(this.tools.keys());
  }

  /**
   * 获取指定分类的工具列表
   */
  getToolsByCategory(category: ToolCategory): RegisteredTool[] {
    return Array.from(this.tools.values()).filter((t) => t.category === category);
  }
}

// ─── 默认工具注册表工厂 ─────────────────────────────────

/**
 * 创建并填充默认工具注册表
 *
 * 注册 18 个核心工具，每个工具的 handler 通过 getStore() 调用对应的 store action。
 *
 * @param getStore - 获取 NarrativeStore 的函数（避免循环依赖）
 */
export function createDefaultToolRegistry(
  getStore: () => Record<string, unknown>
): ToolRegistry {
  const registry = new ToolRegistry();

  // ── 1. add_node ────────────────────────────────────────
  registry.register(
    {
      type: 'function',
      function: {
        name: 'add_node',
        description: '在故事图谱中添加一个新节点',
        parameters: {
          type: 'object',
          properties: {
            label: { type: 'string', description: '节点标签' },
            nodeType: {
              type: 'string',
              enum: ['scene', 'choice', 'condition', 'qte', 'ending_good', 'ending_bad'],
              description: '节点类型',
            },
            x: { type: 'number', description: 'X 坐标' },
            y: { type: 'number', description: 'Y 坐标' },
          },
          required: ['label', 'nodeType'],
        },
      },
    },
    async (args) => {
      const store = getStore() as any;
      const id = `N${String(Date.now()).slice(-4)}`;
      const node = {
        id,
        label: args.label as string,
        type: args.nodeType as string,
        x: (args.x as number) ?? 200,
        y: (args.y as number) ?? 200,
      };
      store.addNode?.(node);
      store.rebuildPlayableGraph?.();
      return { success: true, data: { id, label: args.label } };
    },
    { category: 'node' }
  );

  // ── 2. update_node ─────────────────────────────────────
  registry.register(
    {
      type: 'function',
      function: {
        name: 'update_node',
        description: '修改故事图谱中已有节点的属性',
        parameters: {
          type: 'object',
          properties: {
            nodeId: { type: 'string', description: '要修改的节点 ID' },
            label: { type: 'string', description: '新的节点标签' },
            nodeType: {
              type: 'string',
              enum: ['scene', 'choice', 'condition', 'qte', 'ending_good', 'ending_bad'],
              description: '新的节点类型',
            },
            x: { type: 'number', description: '新的 X 坐标' },
            y: { type: 'number', description: '新的 Y 坐标' },
          },
          required: ['nodeId'],
        },
      },
    },
    async (args) => {
      const store = getStore() as any;
      const nodeId = args.nodeId as string;
      const updates: Record<string, unknown> = {};
      if (args.label !== undefined) updates.label = args.label;
      if (args.nodeType !== undefined) updates.type = args.nodeType;
      if (args.x !== undefined) updates.x = args.x;
      if (args.y !== undefined) updates.y = args.y;

      store.updateNode?.(nodeId, updates);
      store.rebuildPlayableGraph?.();
      return { success: true, data: { nodeId, updates } };
    },
    { category: 'node' }
  );

  // ── 3. remove_node (dangerous) ─────────────────────────
  registry.register(
    {
      type: 'function',
      function: {
        name: 'remove_node',
        description: '删除故事图谱中的一个节点（危险操作，需要用户确认）',
        parameters: {
          type: 'object',
          properties: {
            nodeId: { type: 'string', description: '要删除的节点 ID' },
          },
          required: ['nodeId'],
        },
      },
    },
    async (args) => {
      const store = getStore() as any;
      const nodeId = args.nodeId as string;
      store.removeNode?.(nodeId);
      store.rebuildPlayableGraph?.();
      return { success: true, data: { removedNodeId: nodeId } };
    },
    { dangerous: true, category: 'node' }
  );

  // ── 4. add_edge ────────────────────────────────────────
  registry.register(
    {
      type: 'function',
      function: {
        name: 'add_edge',
        description: '在两个节点之间添加一条连接边',
        parameters: {
          type: 'object',
          properties: {
            from: { type: 'string', description: '起始节点 ID' },
            to: { type: 'string', description: '目标节点 ID' },
            label: { type: 'string', description: '边标签（如选择文本）' },
          },
          required: ['from', 'to'],
        },
      },
    },
    async (args) => {
      const store = getStore() as any;
      const edge = {
        from: args.from as string,
        to: args.to as string,
        label: args.label as string | undefined,
      };
      store.addEdge?.(edge);
      store.rebuildPlayableGraph?.();
      return { success: true, data: { from: edge.from, to: edge.to } };
    },
    { category: 'edge' }
  );

  // ── 5. remove_edge (dangerous) ─────────────────────────
  registry.register(
    {
      type: 'function',
      function: {
        name: 'remove_edge',
        description: '删除两个节点之间的连接边（危险操作，需要用户确认）',
        parameters: {
          type: 'object',
          properties: {
            from: { type: 'string', description: '起始节点 ID' },
            to: { type: 'string', description: '目标节点 ID' },
          },
          required: ['from', 'to'],
        },
      },
    },
    async (args) => {
      const store = getStore() as any;
      store.removeEdge?.(args.from as string, args.to as string);
      store.rebuildPlayableGraph?.();
      return { success: true, data: { from: args.from, to: args.to } };
    },
    { dangerous: true, category: 'edge' }
  );

  // ── 6. add_character ───────────────────────────────────
  registry.register(
    {
      type: 'function',
      function: {
        name: 'add_character',
        description: '添加一个新角色',
        parameters: {
          type: 'object',
          properties: {
            name: { type: 'string', description: '角色名称' },
            role: { type: 'string', description: '角色定位（主角/配角/反派等）' },
            description: { type: 'string', description: '角色描述' },
          },
          required: ['name', 'role'],
        },
      },
    },
    async (args) => {
      const store = getStore() as any;
      const id = `CH${String(Date.now()).slice(-4)}`;
      const character = {
        id,
        name: args.name as string,
        role: args.role as string,
        description: (args.description as string) ?? '',
      };
      store.addCharacter?.(character);
      return { success: true, data: { id, name: args.name } };
    },
    { category: 'character' }
  );

  // ── 7. update_character ────────────────────────────────
  registry.register(
    {
      type: 'function',
      function: {
        name: 'update_character',
        description: '修改已有角色的属性',
        parameters: {
          type: 'object',
          properties: {
            characterId: { type: 'string', description: '要修改的角色 ID' },
            name: { type: 'string', description: '新的角色名称' },
            role: { type: 'string', description: '新的角色定位' },
            description: { type: 'string', description: '新的角色描述' },
          },
          required: ['characterId'],
        },
      },
    },
    async (args) => {
      const store = getStore() as any;
      const characterId = args.characterId as string;
      const updates: Record<string, unknown> = {};
      if (args.name !== undefined) updates.name = args.name;
      if (args.role !== undefined) updates.role = args.role;
      if (args.description !== undefined) updates.description = args.description;

      store.updateCharacter?.(characterId, updates);
      return { success: true, data: { characterId, updates } };
    },
    { category: 'character' }
  );

  // ── 8. remove_character (dangerous) ─────────────────────
  registry.register(
    {
      type: 'function',
      function: {
        name: 'remove_character',
        description: '删除一个角色（危险操作，需要用户确认）',
        parameters: {
          type: 'object',
          properties: {
            characterId: { type: 'string', description: '要删除的角色 ID' },
          },
          required: ['characterId'],
        },
      },
    },
    async (args) => {
      const store = getStore() as any;
      const characterId = args.characterId as string;
      // removeCharacter 不存在于 narrative store，通过过滤 characters 实现
      const characters: any[] = store.characters ?? [];
      const filtered = characters.filter((c) => c.id !== characterId);
      if (filtered.length === characters.length) {
        return { success: false, error: `未找到角色: ${characterId}` };
      }
      // 使用 loadProjectData 来更新 characters
      store.loadProjectData?.({ characters: filtered } as any);
      return { success: true, data: { removedCharacterId: characterId } };
    },
    { dangerous: true, category: 'character' }
  );

  // ── 9. add_scene ───────────────────────────────────────
  registry.register(
    {
      type: 'function',
      function: {
        name: 'add_scene',
        description: '添加一个新场景',
        parameters: {
          type: 'object',
          properties: {
            name: { type: 'string', description: '场景名称' },
            description: { type: 'string', description: '场景描述' },
            backgroundAssetId: { type: 'string', description: '背景资产 ID' },
          },
          required: ['name'],
        },
      },
    },
    async (args) => {
      const store = getStore() as any;
      const id = `SC${String(Date.now()).slice(-4)}`;
      const scene = {
        id,
        name: args.name as string,
        description: (args.description as string) ?? '',
        backgroundAssetId: args.backgroundAssetId as string | undefined,
      };
      store.addScene?.(scene);
      return { success: true, data: { id, name: args.name } };
    },
    { category: 'scene' }
  );

  // ── 10. update_scene ───────────────────────────────────
  registry.register(
    {
      type: 'function',
      function: {
        name: 'update_scene',
        description: '修改已有场景的属性',
        parameters: {
          type: 'object',
          properties: {
            sceneId: { type: 'string', description: '要修改的场景 ID' },
            name: { type: 'string', description: '新的场景名称' },
            description: { type: 'string', description: '新的场景描述' },
            backgroundAssetId: { type: 'string', description: '新的背景资产 ID' },
          },
          required: ['sceneId'],
        },
      },
    },
    async (args) => {
      const store = getStore() as any;
      const sceneId = args.sceneId as string;
      const updates: Record<string, unknown> = {};
      if (args.name !== undefined) updates.name = args.name;
      if (args.description !== undefined) updates.description = args.description;
      if (args.backgroundAssetId !== undefined) updates.backgroundAssetId = args.backgroundAssetId;

      store.updateScene?.(sceneId, updates);
      return { success: true, data: { sceneId, updates } };
    },
    { category: 'scene' }
  );

  // ── 11. add_variable ───────────────────────────────────
  registry.register(
    {
      type: 'function',
      function: {
        name: 'add_variable',
        description: '添加一个新变量',
        parameters: {
          type: 'object',
          properties: {
            name: { type: 'string', description: '变量名称' },
            description: { type: 'string', description: '变量描述' },
            initialValue: { type: 'number', description: '初始值（默认 0）' },
          },
          required: ['name'],
        },
      },
    },
    async (args) => {
      const store = getStore() as any;
      const id = `VAR${String(Date.now()).slice(-4)}`;
      const variable = {
        id,
        name: args.name as string,
        description: (args.description as string) ?? '',
        initialValue: (args.initialValue as number) ?? 0,
      };
      store.addVariable?.(variable);
      return { success: true, data: { id, name: args.name } };
    },
    { category: 'variable' }
  );

  // ── 12. update_variable ────────────────────────────────
  registry.register(
    {
      type: 'function',
      function: {
        name: 'update_variable',
        description: '修改已有变量的属性',
        parameters: {
          type: 'object',
          properties: {
            variableId: { type: 'string', description: '要修改的变量 ID' },
            name: { type: 'string', description: '新的变量名称' },
            description: { type: 'string', description: '新的变量描述' },
            initialValue: { type: 'number', description: '新的初始值' },
          },
          required: ['variableId'],
        },
      },
    },
    async (args) => {
      const store = getStore() as any;
      const variableId = args.variableId as string;
      const updates: Record<string, unknown> = {};
      if (args.name !== undefined) updates.name = args.name;
      if (args.description !== undefined) updates.description = args.description;
      if (args.initialValue !== undefined) updates.initialValue = args.initialValue;

      store.updateVariable?.(variableId, updates);
      return { success: true, data: { variableId, updates } };
    },
    { category: 'variable' }
  );

  // ── 13. add_script_block ───────────────────────────────
  registry.register(
    {
      type: 'function',
      function: {
        name: 'add_script_block',
        description: '添加一个剧本内容块',
        parameters: {
          type: 'object',
          properties: {
            nodeId: { type: 'string', description: '关联的节点 ID' },
            blockType: {
              type: 'string',
              enum: ['dialogue', 'narration', 'action', 'choice', 'condition'],
              description: '剧本块类型',
            },
            content: { type: 'string', description: '剧本块内容' },
            characterId: { type: 'string', description: '对话角色 ID（dialogue 类型时必填）' },
          },
          required: ['nodeId', 'blockType', 'content'],
        },
      },
    },
    async (args) => {
      const store = getStore() as any;
      const id = `SB${String(Date.now()).slice(-4)}`;
      const block = {
        id,
        nodeId: args.nodeId as string,
        type: args.blockType as string,
        content: args.content as string,
        characterId: args.characterId as string | undefined,
      };
      store.addScriptBlock?.(block);
      return { success: true, data: { id, nodeId: args.nodeId } };
    },
    { category: 'script' }
  );

  // ── 14. update_script_block ────────────────────────────
  registry.register(
    {
      type: 'function',
      function: {
        name: 'update_script_block',
        description: '修改已有剧本块的属性',
        parameters: {
          type: 'object',
          properties: {
            blockId: { type: 'string', description: '要修改的剧本块 ID' },
            content: { type: 'string', description: '新的剧本块内容' },
            blockType: {
              type: 'string',
              enum: ['dialogue', 'narration', 'action', 'choice', 'condition'],
              description: '新的剧本块类型',
            },
            characterId: { type: 'string', description: '新的对话角色 ID' },
          },
          required: ['blockId'],
        },
      },
    },
    async (args) => {
      const store = getStore() as any;
      const blockId = args.blockId as string;
      const updates: Record<string, unknown> = {};
      if (args.content !== undefined) updates.content = args.content;
      if (args.blockType !== undefined) updates.type = args.blockType;
      if (args.characterId !== undefined) updates.characterId = args.characterId;

      store.updateScriptBlock?.(blockId, updates);
      return { success: true, data: { blockId, updates } };
    },
    { category: 'script' }
  );

  // ── 15. remove_script_block (dangerous) ────────────────
  registry.register(
    {
      type: 'function',
      function: {
        name: 'remove_script_block',
        description: '删除一个剧本内容块（危险操作，需要用户确认）',
        parameters: {
          type: 'object',
          properties: {
            blockId: { type: 'string', description: '要删除的剧本块 ID' },
          },
          required: ['blockId'],
        },
      },
    },
    async (args) => {
      const store = getStore() as any;
      const blockId = args.blockId as string;
      store.removeScriptBlock?.(blockId);
      return { success: true, data: { removedBlockId: blockId } };
    },
    { dangerous: true, category: 'script' }
  );

  // ── 16. query_story_graph (read-only) ──────────────────
  registry.register(
    {
      type: 'function',
      function: {
        name: 'query_story_graph',
        description: '查询当前故事图谱的结构信息（节点和边）',
        parameters: {
          type: 'object',
          properties: {
            includeDetails: {
              type: 'boolean',
              description: '是否包含节点详情（默认 false，仅返回摘要）',
            },
          },
        },
      },
    },
    async (args) => {
      const store = getStore() as any;
      const storyNodes: any[] = store.storyNodes ?? [];
      const nodeEdges: any[] = store.nodeEdges ?? [];
      const includeDetails = args.includeDetails as boolean;

      if (includeDetails) {
        return {
          success: true,
          data: {
            nodes: storyNodes.map((n) => ({ id: n.id, label: n.label, type: n.type })),
            edges: nodeEdges.map((e) => ({ from: e.from, to: e.to, label: e.label })),
            totalNodes: storyNodes.length,
            totalEdges: nodeEdges.length,
          },
        };
      }

      // 只读摘要
      const nodeTypeCounts: Record<string, number> = {};
      for (const node of storyNodes) {
        const t = node.type ?? 'unknown';
        nodeTypeCounts[t] = (nodeTypeCounts[t] ?? 0) + 1;
      }
      return {
        success: true,
        data: {
          totalNodes: storyNodes.length,
          totalEdges: nodeEdges.length,
          nodeTypeCounts,
        },
      };
    },
    { category: 'query' }
  );

  // ── 17. query_characters (read-only) ───────────────────
  registry.register(
    {
      type: 'function',
      function: {
        name: 'query_characters',
        description: '查询当前项目的角色列表',
        parameters: {
          type: 'object',
          properties: {
            includeDetails: {
              type: 'boolean',
              description: '是否包含角色详情（默认 false，仅返回名称列表）',
            },
          },
        },
      },
    },
    async (args) => {
      const store = getStore() as any;
      const characters: any[] = store.characters ?? [];
      const includeDetails = args.includeDetails as boolean;

      if (includeDetails) {
        return {
          success: true,
          data: characters.map((c) => ({
            id: c.id,
            name: c.name,
            role: c.role,
            description: c.description,
          })),
        };
      }

      return {
        success: true,
        data: characters.map((c) => ({ id: c.id, name: c.name, role: c.role })),
      };
    },
    { category: 'query' }
  );

  // ── 18. rebuild_playable_graph ──────────────────────────
  registry.register(
    {
      type: 'function',
      function: {
        name: 'rebuild_playable_graph',
        description: '重新构建可执行图谱（在修改节点或边后调用）',
        parameters: {
          type: 'object',
          properties: {},
        },
      },
    },
    async () => {
      const store = getStore() as any;
      const warnings = store.rebuildPlayableGraph?.() ?? [];
      return { success: true, data: { warnings } };
    },
    { category: 'node' }
  );

  // ── 19. check_consistency (read-only) ───────────────────
  registry.register(
    {
      type: 'function',
      function: {
        name: 'check_consistency',
        description: '运行一致性检查，检测叙事数据中的逻辑矛盾（孤立节点、死路、悬空边、角色/道具/变量不一致等）',
        parameters: {
          type: 'object',
          properties: {},
        },
      },
    },
    async () => {
      const store = getStore() as any;
      const { runConsistencyChecks } = await import('@/lib/consistency-engine');
      const issues = runConsistencyChecks({
        storyNodes: store.storyNodes ?? [],
        nodeEdges: store.nodeEdges ?? [],
        characters: store.characters ?? [],
        props: store.props ?? [],
        variables: store.variables ?? [],
        narrativeIntents: store.narrativeIntents ?? [],
      });
      const errors = issues.filter((i: any) => i.severity === 'error');
      const warnings = issues.filter((i: any) => i.severity === 'warning');
      return {
        success: true,
        data: {
          totalIssues: issues.length,
          errors: errors.length,
          warnings: warnings.length,
          issues: issues.map((i: any) => ({
            severity: i.severity,
            title: i.title,
            description: i.description,
            suggestion: i.suggestion,
            affectedNodeIds: i.affectedNodeIds,
          })),
        },
      };
    },
    { category: 'query' }
  );

  // ── 20. run_path_test (read-only) ───────────────────────
  registry.register(
    {
      type: 'function',
      function: {
        name: 'run_path_test',
        description: '运行路径测试，分析故事图谱的可达性：找出所有可达结局路径、检测死胡同、不可达节点、循环节点',
        parameters: {
          type: 'object',
          properties: {},
        },
      },
    },
    async () => {
      const store = getStore() as any;
      const { runPathTest } = await import('@/lib/path-test-engine');
      const result = runPathTest(store.storyNodes ?? [], store.nodeEdges ?? []);
      return {
        success: true,
        data: {
          totalPaths: result.stats.totalPaths,
          goodEndings: result.stats.goodEndings,
          badEndings: result.stats.badEndings,
          deadEnds: result.deadEnds,
          unreachableNodes: result.unreachableNodes,
          cycleNodes: result.cycleNodes,
          avgPathLength: result.stats.avgPathLength,
        },
      };
    },
    { category: 'query' }
  );

  // ── 21. set_story_outline (entry 阶段专用) ──────────────
  registry.register(
    {
      type: 'function',
      function: {
        name: 'set_story_outline',
        description: '设置故事大纲（创作起点阶段的核心产出）。基于导入内容或用户创意，总结为结构化大纲。',
        parameters: {
          type: 'object',
          properties: {
            outline: {
              type: 'string',
              description: '故事大纲文本，包含：主线标题、核心冲突、章节结构概要、结局数量',
            },
          },
          required: ['outline'],
        },
      },
    },
    async (args) => {
      const { usePipelineStore } = await import('@/store/use-pipeline-store');
      const pipeline = usePipelineStore.getState();
      pipeline.setStageOutput("storyOutline", args.outline as string);
      return { success: true, data: { outline: args.outline } };
    },
    { category: 'script' }
  );

  // ── 22. add_prop (narrative/entry 阶段) ─────────────────
  registry.register(
    {
      type: 'function',
      function: {
        name: 'add_prop',
        description: '添加一个关键道具到项目中',
        parameters: {
          type: 'object',
          properties: {
            name: { type: 'string', description: '道具名称' },
            propType: {
              type: 'string',
              enum: ['key_item', 'tool', 'weapon', 'consumable'],
              description: '道具类型：key_item=关键道具, tool=工具, weapon=武器, consumable=消耗品',
            },
            description: { type: 'string', description: '道具描述' },
            gameplayEffect: { type: 'string', description: '玩法效果（对游戏机制的影响）' },
          },
          required: ['name', 'propType'],
        },
      },
    },
    async (args) => {
      const store = getStore() as any;
      const id = `PROP${String(Date.now()).slice(-4)}`;
      const prop = {
        id,
        name: args.name as string,
        type: args.propType as 'key_item' | 'tool' | 'weapon' | 'consumable',
        description: (args.description as string) ?? '',
        gameplayEffect: (args.gameplayEffect as string) ?? '',
        refNodes: [] as string[],
        hasImage: false,
      };
      store.addProp?.(prop);
      return { success: true, data: { id, name: args.name } };
    },
    { category: 'scene' }
  );

  // ── 23. add_cinematic_direction (cinematic 阶段) ────────
  registry.register(
    {
      type: 'function',
      function: {
        name: 'add_cinematic_direction',
        description: '为指定节点创建镜头指导（演出设计阶段专用）。包含镜头、表演、音频、转场等设计。',
        parameters: {
          type: 'object',
          properties: {
            nodeId: { type: 'string', description: '关联的节点 ID' },
            shotType: {
              type: 'string',
              enum: ['wide', 'medium', 'close_up', 'tracking', 'push_in', 'pull_out', 'handheld', 'static'],
              description: '景别：wide=远景, medium=中景, close_up=特写, tracking=跟踪, push_in=推镜, pull_out=拉镜, handheld=手持, static=固定',
            },
            movement: {
              type: 'string',
              enum: ['none', 'pan_left', 'pan_right', 'tilt_up', 'tilt_down', 'dolly_in', 'dolly_out', 'crane_up', 'crane_down', 'orbit', 'static', 'push_in', 'pull_out', 'tracking'],
              description: '运镜方式',
            },
            duration: { type: 'number', description: '镜头时长（秒），默认 3' },
            focusTarget: { type: 'string', description: '焦点目标（角色名或物体）' },
            transition: {
              type: 'string',
              enum: ['cut', 'fade', 'dissolve', 'wipe', 'flash', 'slow_motion'],
              description: '转场方式：cut=硬切, fade=淡入淡出, dissolve=溶解, wipe=擦除, flash=闪白, slow_motion=慢动作',
            },
            pacing: { type: 'string', description: '节奏描述（如"缓慢推进"、"快速切换"）' },
            bgmTrack: { type: 'string', description: 'BGM 描述' },
            bgmMood: { type: 'string', description: 'BGM 情绪' },
            ambientSound: { type: 'string', description: '环境音' },
            staging: { type: 'string', description: '调度备注（角色站位/走位）' },
          },
          required: ['nodeId', 'shotType', 'movement'],
        },
      },
    },
    async (args) => {
      const store = getStore() as any;
      const SHOT_LABELS: Record<string, string> = {
        wide: '远景', medium: '中景', close_up: '特写', tracking: '跟踪',
        push_in: '推镜', pull_out: '拉镜', handheld: '手持', static: '固定',
      };
      const MOVEMENT_LABELS: Record<string, string> = {
        none: '无', pan_left: '左摇', pan_right: '右摇', tilt_up: '上摇', tilt_down: '下摇',
        dolly_in: '推车前进', dolly_out: '推车后退', crane_up: '升镜', crane_down: '降镜',
        orbit: '环绕', static: '静止', push_in: '推进', pull_out: '拉远', tracking: '跟踪',
      };
      const TRANSITION_LABELS: Record<string, string> = {
        cut: '硬切', fade: '淡入淡出', dissolve: '溶解', wipe: '擦除', flash: '闪白', slow_motion: '慢动作',
      };

      const direction = {
        nodeId: args.nodeId as string,
        camera: {
          shotType: args.shotType,
          shotLabel: SHOT_LABELS[args.shotType as string] ?? args.shotType,
          movement: args.movement,
          movementLabel: MOVEMENT_LABELS[args.movement as string] ?? args.movement,
          duration: (args.duration as number) ?? 3,
          focusTarget: args.focusTarget as string | undefined,
        },
        performances: [],
        audio: {
          bgmTrack: (args.bgmTrack as string) ?? '',
          bgmMood: (args.bgmMood as string) ?? '',
          ambientSound: (args.ambientSound as string) ?? '',
          sfx: [],
        },
        transition: args.transition ?? 'cut',
        transitionLabel: TRANSITION_LABELS[args.transition as string] ?? '硬切',
        pacing: (args.pacing as string) ?? '',
        staging: args.staging as string | undefined,
      };

      // 使用 loadProjectData 追加 cinematicDirections
      const existing = (store.cinematicDirections as any[]) ?? [];
      const filtered = existing.filter((cd) => cd.nodeId !== direction.nodeId);
      store.loadProjectData?.({ cinematicDirections: [...filtered, direction] });
      return { success: true, data: { nodeId: args.nodeId, shotType: args.shotType } };
    },
    { category: 'scene' }
  );

  // ── 24. set_qa_report (qa 阶段) ─────────────────────────
  registry.register(
    {
      type: 'function',
      function: {
        name: 'set_qa_report',
        description: '设置质量校验报告（质量校验阶段的核心产出）。基于 check_consistency 和 run_path_test 的结果汇总。',
        parameters: {
          type: 'object',
          properties: {
            errors: { type: 'number', description: '严重问题数量（死路、不可达结局、逻辑矛盾）' },
            warnings: { type: 'number', description: '警告数量（孤立节点、未使用变量、张力异常）' },
            summary: { type: 'string', description: '问题摘要和修复建议' },
          },
          required: ['errors', 'warnings', 'summary'],
        },
      },
    },
    async (args) => {
      const { usePipelineStore } = await import('@/store/use-pipeline-store');
      const pipeline = usePipelineStore.getState();
      pipeline.setStageOutput("qaReport", {
        errors: args.errors as number,
        warnings: args.warnings as number,
        summary: args.summary as string,
      });
      return { success: true, data: { errors: args.errors, warnings: args.warnings } };
    },
    { category: 'query' }
  );

  // ── 25. set_asset_list (asset 阶段) ─────────────────────
  registry.register(
    {
      type: 'function',
      function: {
        name: 'set_asset_list',
        description: '设置资产需求清单（资产生成阶段的核心产出）。包含角色立绘、场景背景、音频、视频等资产需求。',
        parameters: {
          type: 'object',
          properties: {
            assets: {
              type: 'array',
              description: '资产列表',
              items: {
                type: 'object',
                properties: {
                  type: { type: 'string', description: '资产类型：character/scene/bgm/sfx/voice/video' },
                  name: { type: 'string', description: '资产名称' },
                  prompt: { type: 'string', description: '视觉/音频提示词' },
                  status: { type: 'string', description: '状态：pending/generating/done' },
                },
              },
            },
          },
          required: ['assets'],
        },
      },
    },
    async (args) => {
      const { usePipelineStore } = await import('@/store/use-pipeline-store');
      const pipeline = usePipelineStore.getState();
      pipeline.setStageOutput("assetList", args.assets);
      return { success: true, data: { count: (args.assets as any[]).length } };
    },
    { category: 'query' }
  );

  // ── 26. add_relationship (角色关系系统) ─────────────────
  registry.register(
    {
      type: 'function',
      function: {
        name: 'add_relationship',
        description: '添加两个角色之间的关系。关系强度 -100 到 100（负数=敌对，正数=友好）。',
        parameters: {
          type: 'object',
          properties: {
            fromCharacterId: { type: 'string', description: '角色 A 的 ID' },
            toCharacterId: { type: 'string', description: '角色 B 的 ID' },
            type: {
              type: 'string',
              enum: ['ally', 'rival', 'lover', 'family', 'mentor', 'enemy', 'neutral'],
              description: '关系类型：ally=盟友, rival=对手, lover=恋人, family=家人, mentor=师徒, enemy=敌人, neutral=中立',
            },
            strength: { type: 'number', description: '关系强度 -100 到 100（负数=敌对，正数=友好）' },
            description: { type: 'string', description: '关系描述（可选）' },
          },
          required: ['fromCharacterId', 'toCharacterId', 'type', 'strength'],
        },
      },
    },
    async (args) => {
      const { useRelationshipStore } = await import('@/store/use-relationship-store');
      const store = useRelationshipStore.getState();
      // 校验角色是否存在
      const narrativeStore = getStore() as any;
      const characters: any[] = narrativeStore.characters ?? [];
      const fromId = args.fromCharacterId as string;
      const toId = args.toCharacterId as string;
      if (!characters.some((c) => c.id === fromId)) {
        return { success: false, error: `未找到角色 A: ${fromId}` };
      }
      if (!characters.some((c) => c.id === toId)) {
        return { success: false, error: `未找到角色 B: ${toId}` };
      }
      if (fromId === toId) {
        return { success: false, error: '不能为同一角色创建关系' };
      }

      const rel = {
        fromCharacterId: fromId,
        toCharacterId: toId,
        type: args.type as any,
        strength: (args.strength as number) ?? 0,
        description: (args.description as string) ?? undefined,
      };
      store.addRelationship(rel);
      // 取回新创建的关系 ID
      const created = useRelationshipStore.getState().relationships.slice(-1)[0];
      return { success: true, data: { id: created?.id, fromCharacterId: fromId, toCharacterId: toId, type: args.type } };
    },
    { category: 'character' }
  );

  // ── 27. update_relationship (角色关系系统) ──────────────
  registry.register(
    {
      type: 'function',
      function: {
        name: 'update_relationship',
        description: '更新已有角色关系的强度、类型或描述。strengthDelta 为强度增量（会叠加到当前值并 clamp -100~100）。',
        parameters: {
          type: 'object',
          properties: {
            id: { type: 'string', description: '关系 ID' },
            strengthDelta: { type: 'number', description: '强度增量（正数增强友好，负数增强敌对），可选' },
            type: {
              type: 'string',
              enum: ['ally', 'rival', 'lover', 'family', 'mentor', 'enemy', 'neutral'],
              description: '新的关系类型，可选',
            },
            description: { type: 'string', description: '新的关系描述，可选' },
          },
          required: ['id'],
        },
      },
    },
    async (args) => {
      const { useRelationshipStore } = await import('@/store/use-relationship-store');
      const store = useRelationshipStore.getState();
      const id = args.id as string;
      const existing = store.relationships.find((r) => r.id === id);
      if (!existing) {
        return { success: false, error: `未找到关系: ${id}` };
      }

      // 处理强度增量
      if (args.strengthDelta !== undefined) {
        store.adjustStrength(id, args.strengthDelta as number);
      }
      // 处理类型和描述更新
      const patch: Record<string, unknown> = {};
      if (args.type !== undefined) patch.type = args.type;
      if (args.description !== undefined) patch.description = args.description;
      if (Object.keys(patch).length > 0) {
        store.updateRelationship(id, patch);
      }

      const updated = useRelationshipStore.getState().relationships.find((r) => r.id === id);
      return { success: true, data: { id, strength: updated?.strength ?? 0, type: updated?.type } };
    },
    { category: 'character' }
  );

  // ── 28. get_relationships (角色关系系统，只读) ──────────
  registry.register(
    {
      type: 'function',
      function: {
        name: 'get_relationships',
        description: '查询角色关系。传入 characterId 返回该角色的所有关系，不传则返回全部关系。',
        parameters: {
          type: 'object',
          properties: {
            characterId: { type: 'string', description: '角色 ID（可选，不传则返回全部关系）' },
          },
        },
      },
    },
    async (args) => {
      const { useRelationshipStore } = await import('@/store/use-relationship-store');
      const store = useRelationshipStore.getState();
      const characterId = args.characterId as string | undefined;
      const relationships = characterId
        ? store.getCharacterRelationships(characterId)
        : store.relationships;
      return {
        success: true,
        data: {
          relationships: relationships.map((r) => ({
            id: r.id,
            fromCharacterId: r.fromCharacterId,
            toCharacterId: r.toCharacterId,
            type: r.type,
            strength: r.strength,
            description: r.description,
          })),
          total: relationships.length,
        },
      };
    },
    { category: 'query' }
  );

  // ── 29. record_moral_action (道德系统) ──────────────────
  registry.register(
    {
      type: 'function',
      function: {
        name: 'record_moral_action',
        description: '记录一个道德行为，更新玩家的道德倾向并写入历史。lawChaosDelta 正数=趋向混乱，负数=趋向守序；goodEvilDelta 正数=趋向邪恶，负数=趋向善良。',
        parameters: {
          type: 'object',
          properties: {
            action: { type: 'string', description: '行为描述（如"救下平民"、"处决俘虏"）' },
            lawChaosDelta: { type: 'number', description: '守序混乱轴变化（正数=混乱，负数=守序）' },
            goodEvilDelta: { type: 'number', description: '善良邪恶轴变化（正数=邪恶，负数=善良）' },
            nodeId: { type: 'string', description: '关联的节点 ID（可选）' },
          },
          required: ['action', 'lawChaosDelta', 'goodEvilDelta'],
        },
      },
    },
    async (args) => {
      const { useMoralStore } = await import('@/store/use-moral-store');
      const store = useMoralStore.getState();
      store.recordAction(
        args.action as string,
        args.lawChaosDelta as number,
        args.goodEvilDelta as number,
        args.nodeId as string | undefined,
      );
      const newState = useMoralStore.getState();
      const alignment = newState.getAlignment();
      return {
        success: true,
        data: {
          alignment,
          lawChaos: newState.lawChaos,
          goodEvil: newState.goodEvil,
          historyCount: newState.history.length,
        },
      };
    },
    { category: 'query' }
  );

  // ── 30. get_moral_state (道德系统，只读) ─────────────────
  registry.register(
    {
      type: 'function',
      function: {
        name: 'get_moral_state',
        description: '查询当前道德状态：守序混乱轴、善良邪恶轴、阵营、历史记录数量。',
        parameters: {
          type: 'object',
          properties: {},
        },
      },
    },
    async () => {
      const { useMoralStore } = await import('@/store/use-moral-store');
      const store = useMoralStore.getState();
      const alignment = store.getAlignment();
      return {
        success: true,
        data: {
          lawChaos: store.lawChaos,
          goodEvil: store.goodEvil,
          alignment,
          historyCount: store.history.length,
        },
      };
    },
    { category: 'query' }
  );

  // ── 31. convert_text_to_script (N-18 万物转剧本引擎) ─────
  registry.register(
    {
      type: 'function',
      function: {
        name: 'convert_text_to_script',
        description: '将小说/剧本/大纲文本转换为结构化故事图谱（节点+边+角色+场景）。这是创作的核心入口：用户输入文本，AI 解析为可编辑的互动叙事结构。转换结果会自动加载到当前项目中。',
        parameters: {
          type: 'object',
          properties: {
            text: { type: 'string', description: '要转换的文本（小说片段、剧本、大纲等）' },
            title: { type: 'string', description: '作品标题（可选，影响 AI 创作倾向）' },
            genre: {
              type: 'string',
              enum: ['suspense', 'romance', 'horror', 'scifi', 'fantasy', 'daily', 'custom'],
              description: '题材类型（可选）',
            },
            maxNodes: { type: 'number', description: '最大节点数（默认 15，控制生成规模）' },
          },
          required: ['text'],
        },
      },
    },
    async (args) => {
      const { convertTextToScript } = await import('@/lib/ai/script-converter');
      const text = args.text as string;
      const options: Record<string, unknown> = {};
      if (args.title) options.title = args.title;
      if (args.genre) options.genre = args.genre;
      if (args.maxNodes) options.maxNodes = args.maxNodes;

      const result = await convertTextToScript(text, options as any);

      // 将转换结果加载到当前项目
      const store = getStore() as any;
      store.loadProjectData?.({
        storyNodes: result.storyNodes,
        nodeEdges: result.nodeEdges,
        characters: result.characters,
        scenes: result.scenes,
      });
      store.rebuildPlayableGraph?.();

      return {
        success: true,
        data: {
          nodes: result.storyNodes.length,
          edges: result.nodeEdges.length,
          characters: result.characters.length,
          scenes: result.scenes.length,
          startNodeId: result.startNodeId,
        },
      };
    },
    { category: 'script' }
  );

  // ── 32. moderate_content (N-09 内容审核器) ───────────────
  registry.register(
    {
      type: 'function',
      function: {
        name: 'moderate_content',
        description: '对文本进行内容安全审核，检测暴力/色情/政治/自残等风险。无 API Key 时自动降级为本地关键词审核。返回风险等级和修改建议。',
        parameters: {
          type: 'object',
          properties: {
            text: { type: 'string', description: '要审核的文本' },
            strictness: {
              type: 'string',
              enum: ['low', 'medium', 'high'],
              description: '严格程度（默认 medium）',
            },
          },
          required: ['text'],
        },
      },
    },
    async (args) => {
      const { moderateContent } = await import('@/lib/ai/content-moderator');
      const text = args.text as string;
      const options: { strictness?: 'low' | 'medium' | 'high' } = {};
      if (args.strictness) options.strictness = args.strictness as 'low' | 'medium' | 'high';

      const result = await moderateContent(text, options);
      return {
        success: true,
        data: {
          safe: result.safe,
          riskCount: result.risks.length,
          risks: result.risks,
          summary: result.summary,
          method: result.method,
        },
      };
    },
    { category: 'query' }
  );

  // ── 33. add_context_entry (DCI 动态上下文注入器) ─────────
  registry.register(
    {
      type: 'function',
      function: {
        name: 'add_context_entry',
        description: '添加一条动态上下文条目（DCI）。当运行时满足触发条件（关键词/变量/场景/节点）时，条目内容会自动注入到 AI 对话上下文中。类似 SillyTavern WorldInfo。',
        parameters: {
          type: 'object',
          properties: {
            content: { type: 'string', description: '注入的内容文本' },
            keywords: {
              type: 'array',
              items: { type: 'string' },
              description: '关键词触发列表（当前节点文本包含任一关键词时触发）',
            },
            variables: {
              type: 'object',
              description: '变量条件，如 {"trust_level": ">50", "has_met": "==true"}',
            },
            scenes: {
              type: 'array',
              items: { type: 'string' },
              description: '场景 ID 触发列表',
            },
            nodeIds: {
              type: 'array',
              items: { type: 'string' },
              description: '节点 ID 触发列表',
            },
            position: {
              type: 'string',
              enum: ['system', 'user', 'assistant'],
              description: '注入位置（默认 system）',
            },
            priority: { type: 'number', description: '优先级 0-100，越高越优先（默认 50）' },
            comment: { type: 'string', description: '条目注释/描述' },
          },
          required: ['content'],
        },
      },
    },
    async (args) => {
      const store = useDciStore.getState();
      const id = store.addEntry({
        content: args.content as string,
        triggers: {
          keywords: (args.keywords as string[]) ?? undefined,
          variables: (args.variables as Record<string, string>) ?? undefined,
          scenes: (args.scenes as string[]) ?? undefined,
          nodeIds: (args.nodeIds as string[]) ?? undefined,
        },
        position: (args.position as 'system' | 'user' | 'assistant') ?? 'system',
        priority: (args.priority as number) ?? 50,
        enabled: true,
        comment: (args.comment as string) ?? undefined,
      });
      return { success: true, data: { id, entryCount: store.getEntries().length } };
    },
    { category: 'script' }
  );

  // ── 34. remove_context_entry (DCI) ──────────────────────
  registry.register(
    {
      type: 'function',
      function: {
        name: 'remove_context_entry',
        description: '删除一条动态上下文条目（DCI）',
        parameters: {
          type: 'object',
          properties: {
            id: { type: 'string', description: '要删除的条目 ID' },
          },
          required: ['id'],
        },
      },
    },
    async (args) => {
      const store = useDciStore.getState();
      store.removeEntry(args.id as string);
      return { success: true, data: { removedId: args.id, entryCount: store.getEntries().length } };
    },
    { category: 'script' }
  );

  // ── 35. list_context_entries (DCI, 只读) ─────────────────
  registry.register(
    {
      type: 'function',
      function: {
        name: 'list_context_entries',
        description: '列出所有动态上下文条目（DCI）',
        parameters: {
          type: 'object',
          properties: {
            enabledOnly: { type: 'boolean', description: '是否只返回启用的条目（默认 false）' },
          },
        },
      },
    },
    async (args) => {
      const store = useDciStore.getState();
      const entries = store.getEntries();
      const filtered = args.enabledOnly
        ? entries.filter((e) => e.enabled)
        : entries;
      return {
        success: true,
        data: {
          entries: filtered.map((e) => ({
            id: e.id,
            content: e.content,
            position: e.position,
            priority: e.priority,
            enabled: e.enabled,
            comment: e.comment,
            triggers: e.triggers,
          })),
          total: filtered.length,
        },
      };
    },
    { category: 'query' }
  );

  // ── 36. export_character_card (Character Card V2/V3) ─────
  registry.register(
    {
      type: 'function',
      function: {
        name: 'export_character_card',
        description: '将角色导出为 SillyTavern Character Card V2/V3 格式（JSON）。用于跨平台角色共享。',
        parameters: {
          type: 'object',
          properties: {
            characterId: { type: 'string', description: '要导出的角色 ID' },
            version: {
              type: 'number',
              enum: [2, 3],
              description: '卡片版本（默认 2）',
            },
          },
          required: ['characterId'],
        },
      },
    },
    async (args) => {
      const store = getStore() as any;
      const characters: any[] = store.characters ?? [];
      const character = characters.find((c) => c.id === args.characterId);
      if (!character) {
        return { success: false, error: `未找到角色: ${args.characterId}` };
      }

      const { exportToCharacterCard } = await import('@/lib/character-card-adapter');
      const card = exportToCharacterCard(character, {
        version: (args.version as 2 | 3) ?? 2,
      });
      return {
        success: true,
        data: {
          card,
          spec: card.spec,
          characterName: card.data.name,
        },
      };
    },
    { category: 'character' }
  );

  // ── 37. import_character_card (Character Card V2/V3) ─────
  registry.register(
    {
      type: 'function',
      function: {
        name: 'import_character_card',
        description: '从 SillyTavern Character Card V2/V3 JSON 导入角色到当前项目。',
        parameters: {
          type: 'object',
          properties: {
            cardJson: { type: 'string', description: 'Character Card JSON 字符串' },
          },
          required: ['cardJson'],
        },
      },
    },
    async (args) => {
      const { importFromJson } = await import('@/lib/character-card-adapter');
      const result = importFromJson(args.cardJson as string);
      if (!result.character) {
        return { success: false, error: '导入失败：无法解析 Character Card' };
      }

      const store = getStore() as any;
      const id = `CH${String(Date.now()).slice(-4)}`;
      const character = { ...result.character, id };
      store.addCharacter?.(character);
      return {
        success: true,
        data: {
          id,
          name: character.name,
          role: character.role,
          metadata: result.metadata,
        },
      };
    },
    { category: 'character' }
  );

  // ── 38. generate_media (N-04/05/06/07 媒体生成) ──────────
  registry.register(
    {
      type: 'function',
      function: {
        name: 'generate_media',
        description: '生成媒体资产：图像（N-04）/视频（N-05）/音频（N-06）/语音合成 TTS（N-07）。需要配置对应 API Key，否则返回明确错误。',
        parameters: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: ['image', 'video', 'audio', 'tts'],
              description: '媒体类型：image=图像, video=视频, audio=音频/BGM/音效, tts=语音合成',
            },
            prompt: { type: 'string', description: '生成提示词（TTS 时为要合成的文本）' },
            width: { type: 'number', description: '宽度（图像/视频）' },
            height: { type: 'number', description: '高度（图像/视频）' },
            duration: { type: 'number', description: '视频时长（秒）' },
            voice: { type: 'string', description: 'TTS 音色' },
            emotion: { type: 'string', description: 'TTS 情感' },
            style: { type: 'string', description: '图像风格' },
            negativePrompt: { type: 'string', description: '负面提示词' },
            audioType: {
              type: 'string',
              enum: ['bgm', 'sfx', 'ambient'],
              description: '音频类型（audio 类型时使用）',
            },
            speed: { type: 'number', description: 'TTS 语速 0.5-2.0' },
          },
          required: ['type', 'prompt'],
        },
      },
    },
    async (args) => {
      const { generateMedia } = await import('@/lib/ai/media-service');
      const options: Record<string, unknown> = {};
      if (args.width) options.width = args.width;
      if (args.height) options.height = args.height;
      if (args.duration) options.duration = args.duration;
      if (args.voice) options.voice = args.voice;
      if (args.emotion) options.emotion = args.emotion;
      if (args.style) options.style = args.style;
      if (args.negativePrompt) options.negativePrompt = args.negativePrompt;
      if (args.audioType) options.audioType = args.audioType;
      if (args.speed) options.speed = args.speed;

      const result = await generateMedia({
        type: args.type as 'image' | 'video' | 'audio' | 'tts',
        prompt: args.prompt as string,
        options: Object.keys(options).length > 0 ? options : undefined,
      });

      return {
        success: result.success,
        data: result.success
          ? { url: result.url, localPath: result.localPath, metadata: result.metadata }
          : undefined,
        error: result.error,
      };
    },
    { category: 'scene' }
  );

  // ── 39. init_npc_soul (NPC 灵魂引擎) ─────────────────────
  registry.register(
    {
      type: 'function',
      function: {
        name: 'init_npc_soul',
        description: '为角色初始化 NPC 灵魂（人格向量+记忆系统+情绪）。若角色已有灵魂则不覆盖。可传入自定义人格向量，或由 AI 根据角色描述自动生成。',
        parameters: {
          type: 'object',
          properties: {
            characterId: { type: 'string', description: '角色 ID' },
            autoGenerate: {
              type: 'boolean',
              description: '是否由 AI 根据角色描述自动生成人格向量（默认 true，需要 API Key）',
            },
          },
          required: ['characterId'],
        },
      },
    },
    async (args) => {
      const store = getStore() as any;
      const characters: any[] = store.characters ?? [];
      const character = characters.find((c) => c.id === args.characterId);
      if (!character) {
        return { success: false, error: `未找到角色: ${args.characterId}` };
      }

      const { npcSoulEngine } = await import('@/lib/npc-soul-engine');
      const autoGenerate = (args.autoGenerate as boolean) ?? true;

      if (autoGenerate) {
        const personality = await npcSoulEngine.generatePersonality(character);
        npcSoulEngine.initSoul(args.characterId as string, personality);
      } else {
        npcSoulEngine.initSoul(args.characterId as string);
      }

      const soul = npcSoulEngine.getSoul(args.characterId as string);
      return {
        success: true,
        data: {
          characterId: args.characterId,
          hasPersonality: soul !== null,
          memoryCount: soul?.memories.length ?? 0,
          currentMood: soul?.currentMood,
        },
      };
    },
    { category: 'character' }
  );

  // ── 40. add_npc_memory (NPC 灵魂引擎) ────────────────────
  registry.register(
    {
      type: 'function',
      function: {
        name: 'add_npc_memory',
        description: '为 NPC 添加一条记忆。记忆分三类：short_term（短期，快速衰减）/ long_term（长期，缓慢衰减）/ episodic（情节记忆，关联具体事件）。',
        parameters: {
          type: 'object',
          properties: {
            characterId: { type: 'string', description: '角色 ID' },
            content: { type: 'string', description: '记忆内容' },
            memoryType: {
              type: 'string',
              enum: ['short_term', 'long_term', 'episodic'],
              description: '记忆类型（默认 short_term）',
            },
            importance: { type: 'number', description: '重要性 0-100（默认 50，越高衰减越慢）' },
            relatedNodeId: { type: 'string', description: '关联节点 ID（episodic 类型时使用）' },
          },
          required: ['characterId', 'content'],
        },
      },
    },
    async (args) => {
      const { npcSoulEngine } = await import('@/lib/npc-soul-engine');
      const characterId = args.characterId as string;

      // 确保灵魂已初始化
      if (!npcSoulEngine.getSoul(characterId)) {
        npcSoulEngine.initSoul(characterId);
      }

      npcSoulEngine.addMemory(characterId, {
        content: args.content as string,
        type: (args.memoryType as 'short_term' | 'long_term' | 'episodic') ?? 'short_term',
        importance: (args.importance as number) ?? 50,
        relatedNodeId: args.relatedNodeId as string | undefined,
      });

      const soul = npcSoulEngine.getSoul(characterId);
      return {
        success: true,
        data: {
          characterId,
          memoryCount: soul?.memories.length ?? 0,
        },
      };
    },
    { category: 'character' }
  );

  // ── 41. get_npc_style_prompt (NPC 灵魂引擎, 只读) ─────────
  registry.register(
    {
      type: 'function',
      function: {
        name: 'get_npc_style_prompt',
        description: '获取 NPC 的风格提示词（基于人格向量+当前情绪）。用于指导 AI 生成符合角色性格的对话和行为。只影响"如何表达"，不影响"表达什么"。',
        parameters: {
          type: 'object',
          properties: {
            characterId: { type: 'string', description: '角色 ID' },
          },
          required: ['characterId'],
        },
      },
    },
    async (args) => {
      const { npcSoulEngine } = await import('@/lib/npc-soul-engine');
      const characterId = args.characterId as string;
      const soul = npcSoulEngine.getSoul(characterId);
      if (!soul) {
        return { success: false, error: `角色 ${characterId} 尚未初始化灵魂，请先调用 init_npc_soul` };
      }

      const stylePrompt = npcSoulEngine.generateStylePrompt(characterId);
      const memories = npcSoulEngine.retrieveMemories(characterId, '', 5);
      return {
        success: true,
        data: {
          stylePrompt,
          currentMood: soul.currentMood,
          memoryCount: soul.memories.length,
          recentMemories: memories.map((m: any) => ({
            content: m.content,
            type: m.type,
            importance: m.importance,
          })),
        },
      };
    },
    { category: 'query' }
  );

  // ── 42. update_npc_mood (NPC 灵魂引擎) ───────────────────
  registry.register(
    {
      type: 'function',
      function: {
        name: 'update_npc_mood',
        description: '更新 NPC 的当前情绪状态。情绪会影响角色的语言风格和表达方式。',
        parameters: {
          type: 'object',
          properties: {
            characterId: { type: 'string', description: '角色 ID' },
            emotion: { type: 'string', description: '情绪名称（如"愤怒"、"悲伤"、"喜悦"）' },
            intensity: { type: 'number', description: '情绪强度 0-100' },
            trigger: { type: 'string', description: '触发原因' },
          },
          required: ['characterId', 'emotion', 'intensity'],
        },
      },
    },
    async (args) => {
      const { npcSoulEngine } = await import('@/lib/npc-soul-engine');
      const characterId = args.characterId as string;

      if (!npcSoulEngine.getSoul(characterId)) {
        npcSoulEngine.initSoul(characterId);
      }

      npcSoulEngine.updateMood(
        characterId,
        args.emotion as string,
        args.intensity as number,
        args.trigger as string | undefined,
      );

      const soul = npcSoulEngine.getSoul(characterId);
      return {
        success: true,
        data: {
          characterId,
          currentMood: soul?.currentMood,
        },
      };
    },
    { category: 'character' }
  );

  // ── 43. update_prop ────────────────────────────────────────
  registry.register(
    {
      type: 'function',
      function: {
        name: 'update_prop',
        description: '更新道具信息',
        parameters: {
          type: 'object',
          properties: {
            id: { type: 'string', description: '道具 ID' },
            name: { type: 'string', description: '道具名称' },
            type: { type: 'string', description: '道具类型' },
            description: { type: 'string', description: '道具描述' },
            gameplayEffect: { type: 'string', description: '玩法效果' },
          },
          required: ['id'],
        },
      },
    },
    async (args) => {
      const store = getStore() as any;
      store.updateProp(args.id as string, {
        ...(args.name && { name: args.name as string }),
        ...(args.type && { type: args.type as string }),
        ...(args.description && { description: args.description as string }),
        ...(args.gameplayEffect && { gameplayEffect: args.gameplayEffect as string }),
      });
      return { success: true, data: { id: args.id } };
    },
    { category: 'scene' }
  );

  // ── 44. remove_prop ────────────────────────────────────────
  registry.register(
    {
      type: 'function',
      function: {
        name: 'remove_prop',
        description: '删除道具',
        parameters: {
          type: 'object',
          properties: {
            id: { type: 'string', description: '道具 ID' },
          },
          required: ['id'],
        },
      },
    },
    async (args) => {
      const store = getStore() as any;
      store.removeProp(args.id as string);
      return { success: true, data: { removedId: args.id } };
    },
    { category: 'scene' }, true
  );

  // ── 45. remove_scene ────────────────────────────────────────
  registry.register(
    {
      type: 'function',
      function: {
        name: 'remove_scene',
        description: '删除场景',
        parameters: {
          type: 'object',
          properties: {
            id: { type: 'string', description: '场景 ID' },
          },
          required: ['id'],
        },
      },
    },
    async (args) => {
      const store = getStore() as any;
      store.removeScene(args.id as string);
      return { success: true, data: { removedId: args.id } };
    },
    { category: 'scene' }, true
  );

  // ── 46. update_cinematic_direction ────────────────────────────────
  registry.register(
    {
      type: 'function',
      function: {
        name: 'update_cinematic_direction',
        description: '更新镜头指导',
        parameters: {
          type: 'object',
          properties: {
            nodeId: { type: 'string', description: '关联节点 ID' },
            shotType: { type: 'string', description: '景别' },
            cameraMovement: { type: 'string', description: '运镜' },
            duration: { type: 'number', description: '时长（秒）' },
            focus: { type: 'string', description: '焦点' },
            transition: { type: 'string', description: '转场' },
            pacing: { type: 'string', description: '节奏' },
          },
          required: ['nodeId'],
        },
      },
    },
    async (args) => {
      const store = getStore() as any;
      const nodeId = args.nodeId as string;
      const updates: Record<string, unknown> = {};
      for (const key of ['shotType', 'cameraMovement', 'focus', 'transition', 'pacing']) {
        if (args[key]) updates[key] = args[key];
      }
      if (args.duration) updates.duration = args.duration as number;
      store.updateCinematicDirection(nodeId, updates);
      return { success: true, data: { nodeId } };
    },
    { category: 'scene' }
  );

  // ── 47. remove_cinematic_direction ────────────────────────────────
  registry.register(
    {
      type: 'function',
      function: {
        name: 'remove_cinematic_direction',
        description: '删除镜头指导',
        parameters: {
          type: 'object',
          properties: {
            nodeId: { type: 'string', description: '关联节点 ID' },
          },
          required: ['nodeId'],
        },
      },
    },
    async (args) => {
      const store = getStore() as any;
      store.removeCinematicDirection(args.nodeId as string);
      return { success: true, data: { removedNodeId: args.nodeId } };
    },
    { category: 'scene' }, true
  );

  // ═══ 版本控制工具 (#48-51) ═══════════════════════════════════════

  // ── 48. create_version_snapshot ────────────────────────────────
  registry.register(
    {
      type: 'function',
      function: {
        name: 'create_version_snapshot',
        description: '创建版本快照，保存当前项目状态',
        parameters: {
          type: 'object',
          properties: {
            name: { type: 'string', description: '快照名称' },
            description: { type: 'string', description: '快照描述' },
            type: { type: 'string', enum: ['manual', 'auto', 'milestone', 'pre_publish'], description: '快照类型' },
          },
          required: ['name'],
        },
      },
    },
    async (args) => {
      const id = useVersionStore.getState().createSnapshot(
        args.name as string,
        (args.type as 'manual' | 'auto' | 'milestone' | 'pre_publish') ?? 'manual',
        args.description as string | undefined,
      );
      return { success: true, data: { snapshotId: id } };
    },
    { category: 'query' }
  );

  // ── 49. restore_version_snapshot ────────────────────────────────
  registry.register(
    {
      type: 'function',
      function: {
        name: 'restore_version_snapshot',
        description: '恢复到指定版本快照（会先自动保存当前状态）',
        parameters: {
          type: 'object',
          properties: {
            snapshotId: { type: 'string', description: '快照 ID' },
          },
          required: ['snapshotId'],
        },
      },
    },
    async (args) => {
      const ok = useVersionStore.getState().restoreFromSnapshot(args.snapshotId as string);
      return { success: ok, data: { snapshotId: args.snapshotId, restored: ok } };
    },
    { category: 'query' }, true
  );

  // ── 50. list_version_snapshots ────────────────────────────────
  registry.register(
    {
      type: 'function',
      function: {
        name: 'list_version_snapshots',
        description: '列出所有版本快照',
        parameters: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['manual', 'auto', 'milestone', 'pre_publish'], description: '按类型筛选（可选）' },
          },
        },
      },
    },
    async (args) => {
      const store = useVersionStore.getState();
      const snapshots = args.type
        ? store.getSnapshotsByType(args.type as 'manual' | 'auto' | 'milestone' | 'pre_publish')
        : store.snapshots;
      return {
        success: true,
        data: {
          snapshots: snapshots.map(s => ({ id: s.id, name: s.name, type: s.type, createdAt: s.createdAt, description: s.description })),
          total: snapshots.length,
        },
      };
    },
    { category: 'query' }
  );

  // ── 51. compare_versions ────────────────────────────────
  registry.register(
    {
      type: 'function',
      function: {
        name: 'compare_versions',
        description: '对比两个版本快照的差异',
        parameters: {
          type: 'object',
          properties: {
            fromSnapshotId: { type: 'string', description: '起始快照 ID' },
            toSnapshotId: { type: 'string', description: '目标快照 ID' },
          },
          required: ['fromSnapshotId', 'toSnapshotId'],
        },
      },
    },
    async (args) => {
      const changeSet = useVersionStore.getState().computeChangeSet(
        args.fromSnapshotId as string,
        args.toSnapshotId as string,
      );
      return { success: true, data: changeSet };
    },
    { category: 'query' }
  );

  // ═══ 资产管理工具 (#52-56) ═══════════════════════════════════════

  // ── 52. add_asset ────────────────────────────────
  registry.register(
    {
      type: 'function',
      function: {
        name: 'add_asset',
        description: '添加资产到资产库',
        parameters: {
          type: 'object',
          properties: {
            nodeId: { type: 'string', description: '关联节点 ID' },
            nodeLabel: { type: 'string', description: '关联节点标签' },
            type: { type: 'string', description: '资产类型（character/scene/bgm/sfx/voice/video）' },
            name: { type: 'string', description: '资产名称' },
            prompt: { type: 'string', description: '生成提示词' },
          },
          required: ['nodeId', 'nodeLabel', 'type', 'name'],
        },
      },
    },
    async (args) => {
      const store = getStore() as any;
      const card = {
        nodeId: args.nodeId as string,
        nodeLabel: args.nodeLabel as string,
        type: args.type as string,
        name: args.name as string,
        prompt: (args.prompt as string) ?? '',
        hasImage: false,
        hasBgm: false,
        hasVoice: false,
        hasVideo: false,
        hasScript: false,
        imageUrl: '',
      };
      store.addAssetCard(card);
      return { success: true, data: { nodeId: card.nodeId, name: card.name } };
    },
    { category: 'scene' }
  );

  // ── 53. update_asset ────────────────────────────────
  registry.register(
    {
      type: 'function',
      function: {
        name: 'update_asset',
        description: '更新资产状态',
        parameters: {
          type: 'object',
          properties: {
            nodeId: { type: 'string', description: '资产关联的节点 ID' },
            name: { type: 'string', description: '资产名称' },
            prompt: { type: 'string', description: '生成提示词' },
            hasImage: { type: 'boolean', description: '是否有图片' },
            hasBgm: { type: 'boolean', description: '是否有 BGM' },
            hasVoice: { type: 'boolean', description: '是否有语音' },
            hasVideo: { type: 'boolean', description: '是否有视频' },
            imageUrl: { type: 'string', description: '图片 URL' },
          },
          required: ['nodeId'],
        },
      },
    },
    async (args) => {
      const store = getStore() as any;
      const nodeId = args.nodeId as string;
      const updates: Record<string, unknown> = {};
      for (const key of ['name', 'prompt', 'imageUrl']) {
        if (args[key] !== undefined) updates[key] = args[key];
      }
      for (const key of ['hasImage', 'hasBgm', 'hasVoice', 'hasVideo', 'hasScript']) {
        if (args[key] !== undefined) updates[key] = args[key];
      }
      store.updateAssetCard(nodeId, updates);
      return { success: true, data: { nodeId } };
    },
    { category: 'scene' }
  );

  // ── 54. remove_asset ────────────────────────────────
  registry.register(
    {
      type: 'function',
      function: {
        name: 'remove_asset',
        description: '从资产库删除资产',
        parameters: {
          type: 'object',
          properties: {
            nodeId: { type: 'string', description: '资产关联的节点 ID' },
          },
          required: ['nodeId'],
        },
      },
    },
    async (args) => {
      const store = getStore() as any;
      store.removeAssetCard(args.nodeId as string);
      return { success: true, data: { removedNodeId: args.nodeId } };
    },
    { category: 'scene' }, true
  );

  // ── 55. list_assets ────────────────────────────────
  registry.register(
    {
      type: 'function',
      function: {
        name: 'list_assets',
        description: '列出资产库中的所有资产',
        parameters: {
          type: 'object',
          properties: {
            type: { type: 'string', description: '按类型筛选（可选）' },
          },
        },
      },
    },
    async (args) => {
      const store = getStore() as any;
      const allAssets = (store.assetCards ?? []) as any[];
      const filtered = args.type
        ? allAssets.filter(a => a.type === args.type)
        : allAssets;
      return {
        success: true,
        data: {
          assets: filtered.map(a => ({
            nodeId: a.nodeId,
            nodeLabel: a.nodeLabel,
            type: a.type,
            name: a.name,
            prompt: a.prompt,
            hasImage: a.hasImage,
            hasBgm: a.hasBgm,
            hasVoice: a.hasVoice,
            hasVideo: a.hasVideo,
          })),
          total: filtered.length,
        },
      };
    },
    { category: 'query' }
  );

  // ── 56. generate_and_add_asset ────────────────────────────────
  registry.register(
    {
      type: 'function',
      function: {
        name: 'generate_and_add_asset',
        description: '生成媒体资产并自动添加到资产库',
        parameters: {
          type: 'object',
          properties: {
            nodeId: { type: 'string', description: '关联节点 ID' },
            nodeLabel: { type: 'string', description: '关联节点标签' },
            mediaType: { type: 'string', enum: ['image', 'video', 'audio', 'tts'], description: '媒体类型' },
            prompt: { type: 'string', description: '生成提示词' },
            name: { type: 'string', description: '资产名称' },
          },
          required: ['nodeId', 'nodeLabel', 'mediaType', 'prompt'],
        },
      },
    },
    async (args) => {
      const { generateMedia } = await import('./media-service');
      const store = getStore() as any;
      const result = await generateMedia(
        args.mediaType as 'image' | 'video' | 'audio' | 'tts',
        args.prompt as string,
        { nodeId: args.nodeId as string },
      );

      if (result.success) {
        const card = {
          nodeId: args.nodeId as string,
          nodeLabel: args.nodeLabel as string,
          type: args.mediaType as string,
          name: (args.name as string) || (args.nodeLabel as string),
          prompt: args.prompt as string,
          hasImage: args.mediaType === 'image',
          hasBgm: args.mediaType === 'audio',
          hasVoice: args.mediaType === 'tts',
          hasVideo: args.mediaType === 'video',
          hasScript: false,
          imageUrl: args.mediaType === 'image' ? (result as any).url || '' : '',
        };
        store.addAssetCard(card);
      }

      return {
        success: result.success,
        data: {
          nodeId: args.nodeId,
          mediaType: args.mediaType,
          url: (result as any).url,
          added: result.success,
        },
        error: result.success ? undefined : 'Media generation failed',
      };
    },
    { category: 'scene' }
  );

  // ═══ 发布工具 (#57-59) ═══════════════════════════════════════════

  // ── 57. export_project ────────────────────────────────
  registry.register(
    {
      type: 'function',
      function: {
        name: 'export_project',
        description: '导出项目为指定格式',
        parameters: {
          type: 'object',
          properties: {
            format: { type: 'string', enum: ['json', 'html5', 'unity', 'unreal'], description: '导出格式' },
            name: { type: 'string', description: '导出任务名称' },
          },
          required: ['format'],
        },
      },
    },
    async (args) => {
      const exportStore = useExportStore.getState();
      const taskId = exportStore.runExport(
        args.format as 'json' | 'html5' | 'unity' | 'unreal',
        { name: (args.name as string) ?? `导出 ${new Date().toLocaleString('zh-CN')}` },
      );
      return { success: true, data: { taskId, format: args.format } };
    },
    { category: 'query' }
  );

  // ── 58. list_export_formats ────────────────────────────────
  registry.register(
    {
      type: 'function',
      function: {
        name: 'list_export_formats',
        description: '列出所有可用的导出格式',
        parameters: { type: 'object', properties: {} },
      },
    },
    async () => {
      const exportStore = useExportStore.getState();
      return {
        success: true,
        data: {
          formats: exportStore.formats.map(f => ({
            id: f.id,
            label: f.label,
            enabled: f.enabled,
            description: f.description,
          })),
        },
      };
    },
    { category: 'query' }
  );

  // ── 59. get_export_status ────────────────────────────────
  registry.register(
    {
      type: 'function',
      function: {
        name: 'get_export_status',
        description: '查询导出任务状态',
        parameters: {
          type: 'object',
          properties: {
            taskId: { type: 'string', description: '导出任务 ID' },
          },
          required: ['taskId'],
        },
      },
    },
    async (args) => {
      const exportStore = useExportStore.getState();
      const task = exportStore.tasks.find(t => t.id === args.taskId);
      if (!task) {
        return { success: false, error: `导出任务 ${args.taskId} 不存在` };
      }
      return {
        success: true,
        data: {
          id: task.id,
          status: task.status,
          format: task.format,
          progress: task.progress,
          resultUrl: task.resultUrl,
          error: task.error,
        },
      };
    },
    { category: 'query' }
  );

  // ═══ 协作工具 (#60-64) ═══════════════════════════════════════════

  // ── 60. add_collab_member ────────────────────────────────
  registry.register(
    {
      type: 'function',
      function: {
        name: 'add_collab_member',
        description: '添加团队成员',
        parameters: {
          type: 'object',
          properties: {
            name: { type: 'string', description: '成员姓名' },
            role: { type: 'string', enum: ['director', 'writer', 'artist', 'developer', 'editor', 'tester'], description: '角色' },
            email: { type: 'string', description: '邮箱（可选）' },
            specialties: { type: 'array', items: { type: 'string' }, description: '专长标签' },
          },
          required: ['name', 'role'],
        },
      },
    },
    async (args) => {
      const collabStore = useCollabStore.getState();
      const id = `member-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      collabStore.addMember({
        id,
        name: args.name as string,
        role: args.role as 'director' | 'writer' | 'artist' | 'developer' | 'editor' | 'tester',
        avatar: '👤',
        email: args.email as string | undefined,
        online: false,
        lastActiveAt: new Date().toISOString(),
        specialties: (args.specialties as string[]) ?? [],
        stats: { tasksCompleted: 0, reviewsDone: 0, commentsCount: 0 },
      });
      return { success: true, data: { memberId: id } };
    },
    { category: 'query' }
  );

  // ── 61. assign_collab_task ────────────────────────────────
  registry.register(
    {
      type: 'function',
      function: {
        name: 'assign_collab_task',
        description: '创建并分配协作任务',
        parameters: {
          type: 'object',
          properties: {
            title: { type: 'string', description: '任务标题' },
            assignee: { type: 'string', description: '分配给（成员姓名）' },
            assigneeRole: { type: 'string', description: '分配者角色' },
            priority: { type: 'string', enum: ['urgent', 'high', 'normal', 'low'], description: '优先级' },
            category: { type: 'string', description: '任务分类' },
            description: { type: 'string', description: '任务描述' },
            dueDate: { type: 'string', description: '截止日期' },
          },
          required: ['title', 'assignee'],
        },
      },
    },
    async (args) => {
      const collabStore = useCollabStore.getState();
      const id = `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      collabStore.addTask({
        id,
        title: args.title as string,
        assignee: args.assignee as string,
        assigneeRole: (args.assigneeRole as string) ?? 'director',
        status: 'todo',
        priority: (args.priority as 'urgent' | 'high' | 'normal' | 'low') ?? 'normal',
        category: (args.category as string) ?? '节点编辑',
        description: (args.description as string) ?? '',
        dueDate: args.dueDate as string | undefined,
        comments: 0,
      });
      return { success: true, data: { taskId: id } };
    },
    { category: 'query' }
  );

  // ── 62. update_collab_task ────────────────────────────────
  registry.register(
    {
      type: 'function',
      function: {
        name: 'update_collab_task',
        description: '更新协作任务状态',
        parameters: {
          type: 'object',
          properties: {
            taskId: { type: 'string', description: '任务 ID' },
            status: { type: 'string', enum: ['todo', 'in_progress', 'review', 'done'], description: '新状态' },
          },
          required: ['taskId', 'status'],
        },
      },
    },
    async (args) => {
      useCollabStore.getState().setTaskStatus(
        args.taskId as string,
        args.status as 'todo' | 'in_progress' | 'review' | 'done',
      );
      return { success: true, data: { taskId: args.taskId, status: args.status } };
    },
    { category: 'query' }
  );

  // ── 63. add_collab_comment ────────────────────────────────
  registry.register(
    {
      type: 'function',
      function: {
        name: 'add_collab_comment',
        description: '添加协作评论',
        parameters: {
          type: 'object',
          properties: {
            taskId: { type: 'string', description: '关联任务 ID（可选）' },
            nodeId: { type: 'string', description: '关联节点 ID（可选）' },
            author: { type: 'string', description: '评论作者' },
            authorRole: { type: 'string', description: '作者角色' },
            content: { type: 'string', description: '评论内容' },
          },
          required: ['author', 'content'],
        },
      },
    },
    async (args) => {
      const collabStore = useCollabStore.getState();
      const id = `comment-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      collabStore.addComment({
        id,
        taskId: args.taskId as string | undefined,
        nodeId: args.nodeId as string | undefined,
        author: args.author as string,
        authorRole: (args.authorRole as string) ?? 'editor',
        content: args.content as string,
        timestamp: new Date().toISOString(),
        isResolved: false,
      });
      return { success: true, data: { commentId: id } };
    },
    { category: 'query' }
  );

  // ── 64. submit_for_review ────────────────────────────────
  registry.register(
    {
      type: 'function',
      function: {
        name: 'submit_for_review',
        description: '提交内容审核',
        parameters: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['script', 'asset', 'node_graph', 'interaction', 'full_build'], description: '审核类型' },
            title: { type: 'string', description: '审核标题' },
            submitter: { type: 'string', description: '提交者' },
            reviewer: { type: 'string', description: '审核人' },
            changeSummary: { type: 'string', description: '变更摘要' },
          },
          required: ['type', 'title', 'submitter'],
        },
      },
    },
    async (args) => {
      const collabStore = useCollabStore.getState();
      const id = `review-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      collabStore.submitForReview({
        id,
        type: args.type as 'script' | 'asset' | 'node_graph' | 'interaction' | 'full_build',
        title: args.title as string,
        submitter: args.submitter as string,
        reviewer: (args.reviewer as string) ?? '',
        stage: 'submitted',
        submittedAt: new Date().toISOString(),
        comments: '',
        changeSummary: (args.changeSummary as string) ?? '',
      });
      return { success: true, data: { reviewId: id } };
    },
    { category: 'query' }
  );

  // ═══ 作品管理工具 (#65-68) ════════════════════════════════════════

  // ── 65. list_projects ────────────────────────────────
  registry.register(
    {
      type: 'function',
      function: {
        name: 'list_projects',
        description: '列出所有项目',
        parameters: { type: 'object', properties: {} },
      },
    },
    async () => {
      const projectStore = useProjectStore.getState();
      return {
        success: true,
        data: {
          projects: projectStore.projects.map(p => ({
            id: p.id,
            title: p.title,
            createdAt: p.createdAt,
            updatedAt: p.updatedAt,
            isCurrent: p.id === projectStore.currentProjectId,
          })),
          currentProjectId: projectStore.currentProjectId,
        },
      };
    },
    { category: 'query' }
  );

  // ── 66. switch_project ────────────────────────────────
  registry.register(
    {
      type: 'function',
      function: {
        name: 'switch_project',
        description: '切换当前项目',
        parameters: {
          type: 'object',
          properties: {
            projectId: { type: 'string', description: '目标项目 ID' },
          },
          required: ['projectId'],
        },
      },
    },
    async (args) => {
      const projectStore = useProjectStore.getState();
      const project = projectStore.projects.find(p => p.id === args.projectId);
      if (!project) {
        return { success: false, error: `项目 ${args.projectId} 不存在` };
      }
      projectStore.setCurrentProject(args.projectId as string);
      return { success: true, data: { projectId: args.projectId, title: project.title } };
    },
    { category: 'query' }
  );

  // ── 67. delete_project ────────────────────────────────
  registry.register(
    {
      type: 'function',
      function: {
        name: 'delete_project',
        description: '删除项目',
        parameters: {
          type: 'object',
          properties: {
            projectId: { type: 'string', description: '项目 ID' },
          },
          required: ['projectId'],
        },
      },
    },
    async (args) => {
      const projectStore = useProjectStore.getState();
      projectStore.deleteProject(args.projectId as string);
      return { success: true, data: { deletedProjectId: args.projectId } };
    },
    { category: 'query' }, true
  );

  // ── 68. get_project_analytics ────────────────────────────────
  registry.register(
    {
      type: 'function',
      function: {
        name: 'get_project_analytics',
        description: '获取项目分析数据（游玩统计）',
        parameters: {
          type: 'object',
          properties: {
            projectId: { type: 'string', description: '项目 ID（可选，默认当前项目）' },
          },
        },
      },
    },
    async (args) => {
      const analyticsStore = useAnalyticsStore.getState();
      const projectStore = useProjectStore.getState();
      const projectId = (args.projectId as string) ?? projectStore.currentProjectId ?? '';
      const sessions = analyticsStore.sessions.filter(s => s.projectId === projectId);
      return {
        success: true,
        data: {
          projectId,
          totalSessions: sessions.length,
          uniquePlayers: new Set(sessions.map(s => s.playerId)).size,
          totalChoices: sessions.reduce((sum, s) => sum + (s.choices?.length ?? 0), 0),
          completedSessions: sessions.filter(s => s.completed).length,
        },
      };
    },
    { category: 'query' }
  );

  return registry;
}

// ─── DCI 单例（会话级持久） ─────────────────────────────────

/**
 * DCI 单例已迁移到 Zustand store（useDciStore）
 *
 * 历史背景：原本使用模块级单例 _dciInstance，但单例数据无法跨会话持久化。
 * 现已迁移到 src/store/use-dci-store.ts，通过 IndexedDB 持久化条目数据，
 * 由 StoreHydrator 统一触发 rehydrate。
 *
 * 调用方式：
 * - 工具内：useDciStore.getState().addEntry(...) / removeEntry(...) / getEntries()
 * - 运行时注入：useDciStore.getState().inject(sceneState) 或 .getInjector()
 */
