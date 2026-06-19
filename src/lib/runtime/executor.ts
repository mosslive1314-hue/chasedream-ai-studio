// ChaseDream Runtime — 节点执行器
// 依赖 SceneContext 和 PlayableNode 类型，不依赖 React

import type { PlayableNode } from '@/lib/types/game';
import type { SceneContext } from './scene-context';

// ── 执行结果 ──────────────────────────────────────────────────────────────

export interface ExecutorResult {
  finished: boolean; // 是否到达结局
  waitingForChoice: boolean; // 是否等待玩家选择
  waitingForClick: boolean; // 是否等待玩家点击继续
  endingType?: 'good' | 'bad';
}

// ── 节点执行器 ────────────────────────────────────────────────────────────

export class NodeExecutor {
  private context: SceneContext;
  private graph: Record<string, PlayableNode>;

  constructor(graph: Record<string, PlayableNode>, context: SceneContext) {
    this.graph = graph;
    this.context = context;
  }

  /**
   * 执行一个节点，返回执行结果
   * 1. 获取 PlayableNode
   * 2. visitNode
   * 3. 如果有 backgroundImage → setBackground
   * 4. 如果有 char 和 text → setSubtitle
   * 5. 如果 isEnding → 返回 { finished: true, endingType }
   * 6. 如果有 choices → 返回 { waitingForChoice: true }
   * 7. 否则返回 { waitingForClick: true }
   */
  execute(nodeId: string): ExecutorResult {
    const node = this.graph[nodeId];
    if (!node) {
      return { finished: false, waitingForChoice: false, waitingForClick: false };
    }

    // 记录节点访问
    this.context.visitNode(nodeId);

    // 设置背景图
    if (node.backgroundImage) {
      this.context.setBackground(node.backgroundImage);
    }

    // 设置字幕/对白
    if (node.char && node.text) {
      this.context.setSubtitle(node.char, node.text);
    }

    // 判断结局
    if (node.isEnding) {
      return {
        finished: true,
        waitingForChoice: false,
        waitingForClick: false,
        endingType: node.endingType,
      };
    }

    // 判断是否有选择
    if (node.choices && node.choices.length > 0) {
      return {
        finished: false,
        waitingForChoice: true,
        waitingForClick: false,
      };
    }

    // 无选择，等待点击继续
    return {
      finished: false,
      waitingForChoice: false,
      waitingForClick: true,
    };
  }

  /**
   * 玩家选择某个选项后，跳转到下一节点
   * 1. 获取当前节点的 choices
   * 2. 应用 effect（context.applyEffect）
   * 3. 返回 next nodeId
   */
  choose(optionIndex: number): string | null {
    const currentNode = this.getCurrentNode();
    if (!currentNode || !currentNode.choices) return null;

    const choice = currentNode.choices[optionIndex];
    if (!choice) return null;

    // 应用效果
    if (choice.effect) {
      this.context.applyEffect(choice.effect);
    }

    return choice.next;
  }

  /**
   * 玩家点击继续，跳到下一个节点（无选择的情况）
   * 查找从当前节点出发的 causal 边的目标
   * 如果没有下一个节点，返回 null
   */
  advance(): string | null {
    const currentNode = this.getCurrentNode();
    if (!currentNode) return null;

    // 单一选择视为 causal 边（自动前进），返回其目标
    if (currentNode.choices && currentNode.choices.length === 1) {
      const choice = currentNode.choices[0];
      if (choice.effect) {
        this.context.applyEffect(choice.effect);
      }
      return choice.next;
    }

    // 无下一个节点
    return null;
  }

  /** 获取当前节点 */
  getCurrentNode(): PlayableNode | null {
    const currentNodeId = this.context.getCurrentNodeId();
    if (!currentNodeId) return null;
    return this.graph[currentNodeId] ?? null;
  }
}
