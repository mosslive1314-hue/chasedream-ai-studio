/**
 * DSL 编译器 — 把 AST 编译为 StoryNode[] + NodeEdge[]
 * 借鉴 VoidNovelEngine 的文本→节点图编译流程
 */

import type { ASTNode } from './types';
import type { StoryNode, NodeEdge, NodeType } from '@/lib/types/narrative';
import type { Condition, AtomicCondition, CompositeCondition } from '@/lib/condition-engine';

export interface CompileResult {
  nodes: StoryNode[];
  edges: NodeEdge[];
  errors: string[];
  warnings: string[];
  labelMap: Map<string, string>; // label name → node id
}

/** 编译 AST 为节点图数据 */
export function compile(ast: ASTNode[]): CompileResult {
  const nodes: StoryNode[] = [];
  const edges: NodeEdge[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];
  const labelMap = new Map<string, string>(); // label 名 → 节点 ID

  // 第一遍：收集所有 label，分配节点 ID
  let nodeCounter = 0;
  const pendingJumps: { fromNode: string; target: string; line: number }[] = [];
  const pendingChoices: { nodeId: string; options: { text: string; target: string; effects?: string[] }[]; line: number }[] = [];
  const pendingIfs: { nodeId: string; cond: string; bodyTargets: string[]; elseTargets: string[]; line: number }[] = [];

  // 当前 label 上下文
  let currentLabelNode: string | null = null;
  let currentLabelText: string[] = [];
  let currentCol = 0;
  let currentRow = 0;

  /** 生成新节点 ID */
  const newId = () => `dsl_${++nodeCounter}`;

  /** 生成坐标 */
  const newPos = () => ({ x: currentCol * 280, y: currentRow * 160 });

  /** 提交当前 label 积累的文本到节点 */
  const flushLabel = () => {
    if (currentLabelNode && currentLabelText.length > 0) {
      const node = nodes.find(n => n.id === currentLabelNode);
      if (node && currentLabelText.length > 0) {
        node.label = currentLabelText.join('\n');
      }
      currentLabelText = [];
    }
  };

  // 第一遍扫描：收集 label → ID 映射
  for (const node of ast) {
    if (node.kind === 'label') {
      const id = newId();
      labelMap.set(node.name, id);
    }
  }

  // 第二遍扫描：生成节点和边
  for (const node of ast) {
    switch (node.kind) {
      case 'label': {
        flushLabel();
        const id = labelMap.get(node.name)!;
        const type: NodeType = node.name === 'start' ? 'start' : 'scene';
        const pos = newPos();
        nodes.push({ id, label: node.name, type, x: pos.x, y: pos.y });
        currentLabelNode = id;
        currentRow++;
        currentCol = 0;
        break;
      }

      case 'say': {
        const speaker = node.character ? `${node.character}: ` : '';
        currentLabelText.push(`${speaker}${node.text}`);
        break;
      }

      case 'text': {
        currentLabelText.push(node.text);
        break;
      }

      case 'scene': {
        currentLabelText.push(`[场景:${node.sceneId}]`);
        break;
      }

      case 'bg': {
        currentLabelText.push(`[背景:${node.assetId}]`);
        break;
      }

      case 'bgm': {
        currentLabelText.push(`[BGM:${node.assetId}]`);
        break;
      }

      case 'sfx': {
        currentLabelText.push(`[音效:${node.assetId}]`);
        break;
      }

      case 'var_set': {
        currentLabelText.push(`[变量:${node.varId} ${node.operator}= ${node.value}]`);
        break;
      }

      case 'choice': {
        flushLabel();
        const choiceId = newId();
        const pos = newPos();
        nodes.push({ id: choiceId, label: '选择', type: 'choice', x: pos.x, y: pos.y });
        currentCol++;
        currentRow++;

        // 父节点 → choice 节点
        if (currentLabelNode) {
          edges.push({ from: currentLabelNode, to: choiceId, edgeType: 'causal' });
        }

        // 每个选项 → 子节点
        for (const opt of node.options) {
          const optId = newId();
          const optPos = newPos();
          nodes.push({ id: optId, label: opt.text, type: 'scene', x: optPos.x, y: optPos.y });
          currentCol++;
          currentRow++;

          // choice → option（互斥边）
          const edgeLabel = opt.effects?.join('; ');
          edges.push({ from: choiceId, to: optId, edgeType: 'exclusive', label: edgeLabel });

          // option → target label
          if (opt.target) {
            pendingJumps.push({ fromNode: optId, target: opt.target, line: node.line });
          }
        }

        pendingChoices.push({ nodeId: choiceId, options: node.options, line: node.line });
        break;
      }

      case 'if': {
        flushLabel();
        const condId = newId();
        const pos = newPos();
        nodes.push({ id: condId, label: `条件: ${node.condition}`, type: 'condition', x: pos.x, y: pos.y });
        currentCol++;
        currentRow++;

        // 父节点 → condition 节点
        if (currentLabelNode) {
          edges.push({ from: currentLabelNode, to: condId, edgeType: 'causal' });
        }

        // if body → 第一个节点
        const ifBodyTargets: string[] = [];
        for (const bodyNode of node.body) {
          if (bodyNode.kind === 'jump') {
            pendingJumps.push({ fromNode: condId, target: bodyNode.target, line: node.line });
            ifBodyTargets.push(bodyNode.target);
          }
        }
        // 条件边
        const cond = parseCondition(node.condition);
        if (ifBodyTargets.length > 0) {
          const targetId = labelMap.get(ifBodyTargets[0]);
          if (targetId) {
            edges.push({ from: condId, to: targetId, edgeType: 'conditional', condition: cond, label: 'if' });
          }
        }

        // elif 链
        for (const elif of node.elifs) {
          for (const elifNode of elif.body) {
            if (elifNode.kind === 'jump') {
              pendingJumps.push({ fromNode: condId, target: elifNode.target, line: node.line });
              const elifTargetId = labelMap.get(elifNode.target);
              if (elifTargetId) {
                edges.push({ from: condId, to: elifTargetId, edgeType: 'conditional', condition: parseCondition(elif.condition), label: 'elif' });
              }
            }
          }
        }

        // else body
        if (node.elseBody) {
          for (const elseNode of node.elseBody) {
            if (elseNode.kind === 'jump') {
              pendingJumps.push({ fromNode: condId, target: elseNode.target, line: node.line });
              const elseTargetId = labelMap.get(elseNode.target);
              if (elseTargetId) {
                // NOT 条件
                const notCond: CompositeCondition = { type: 'composite', operator: 'NOT', conditions: [cond] };
                edges.push({ from: condId, to: elseTargetId, edgeType: 'conditional', condition: notCond, label: 'else' });
              }
            }
          }
        }

        pendingIfs.push({ nodeId: condId, cond: node.condition, bodyTargets: ifBodyTargets, elseTargets: [], line: node.line });
        break;
      }

      case 'ending': {
        flushLabel();
        const endId = newId();
        const pos = newPos();
        const type: NodeType = node.endingType === 'good' ? 'ending_good' : 'ending_bad';
        nodes.push({ id: endId, label: node.endingType === 'good' ? '好结局' : '坏结局', type, x: pos.x, y: pos.y });
        currentRow++;
        if (currentLabelNode) {
          edges.push({ from: currentLabelNode, to: endId, edgeType: 'causal' });
        }
        currentLabelNode = endId;
        break;
      }

      case 'jump': {
        pendingJumps.push({ fromNode: currentLabelNode || '', target: node.target, line: node.line });
        break;
      }
    }
  }

  flushLabel();

  // 第三遍：处理 pending jumps
  for (const jump of pendingJumps) {
    if (!jump.fromNode) continue;
    const targetId = labelMap.get(jump.target);
    if (targetId) {
      // 避免重复边
      const exists = edges.some(e => e.from === jump.fromNode && e.to === targetId);
      if (!exists) {
        edges.push({ from: jump.fromNode, to: targetId, edgeType: 'causal' });
      }
    } else {
      errors.push(`第 ${jump.line} 行: 跳转目标 "${jump.target}" 不存在`);
    }
  }

  // 验证：是否有 start label
  if (!labelMap.has('start')) {
    warnings.push('缺少 #start 标签，建议添加一个起始入口');
  }

  // 验证：孤立节点
  for (const node of nodes) {
    if (node.type === 'start') continue;
    const hasIncoming = edges.some(e => e.to === node.id);
    const hasOutgoing = edges.some(e => e.from === node.id);
    if (!hasIncoming && !hasOutgoing) {
      warnings.push(`节点 ${node.id} ("${node.label}") 是孤立的`);
    }
  }

  return { nodes, edges, errors, warnings, labelMap };
}

/**
 * 解析条件表达式为 Condition 对象
 * 支持: trust >= 50, suspicion < 30 and trust > 20, not flag_eq
 */
function parseCondition(expr: string): Condition {
  const trimmed = expr.trim();

  // 尝试解析复合条件（and/or）
  const andParts = splitByKeyword(trimmed, 'and');
  if (andParts.length > 1) {
    return { type: 'composite', operator: 'AND', conditions: andParts.map(p => parseCondition(p)) };
  }

  const orParts = splitByKeyword(trimmed, 'or');
  if (orParts.length > 1) {
    return { type: 'composite', operator: 'OR', conditions: orParts.map(p => parseCondition(p)) };
  }

  // NOT
  if (trimmed.startsWith('not ')) {
    return { type: 'composite', operator: 'NOT', conditions: [parseCondition(trimmed.slice(4))] };
  }

  // 原子条件
  return parseAtomic(trimmed);
}

/** 按关键字分割（不分割引号内内容） */
function splitByKeyword(expr: string, keyword: string): string[] {
  const parts: string[] = [];
  let current = '';
  let inQuote = false;
  const kwLen = keyword.length;

  for (let i = 0; i < expr.length; i++) {
    const ch = expr[i];
    if (ch === '"' || ch === "'") inQuote = !inQuote;

    if (!inQuote && expr.slice(i, i + kwLen + 1) === ` ${keyword} `) {
      parts.push(current.trim());
      current = '';
      i += kwLen;
      continue;
    }
    current += ch;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

/** 解析原子条件 */
function parseAtomic(expr: string): AtomicCondition {
  // 匹配: 变量ID 操作符 值
  const m = expr.match(/^(\S+)\s*(==|!=|>=|<=|>|<)\s*(.+)$/);
  if (m) {
    const targetId = m[1];
    const opStr = m[2];
    const valStr = m[3].trim();

    const operatorMap: Record<string, AtomicCondition['operator']> = {
      '==': 'eq', '!=': 'neq', '>': 'gt', '>=': 'gte', '<': 'lt', '<=': 'lte',
    };

    const value = isNaN(Number(valStr)) ? valStr.replace(/^["']|["']$/g, '') : Number(valStr);

    return {
      type: 'atomic',
      targetId,
      targetType: 'variable',
      operator: operatorMap[opStr],
      value,
    };
  }

  // 无法解析，返回一个总是 true 的条件
  return { type: 'atomic', targetId: '_unknown', targetType: 'variable', operator: 'eq', value: expr };
}
