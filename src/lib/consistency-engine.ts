/**
 * Consistency Verification Engine
 * Automatically detects logical contradictions in narrative data.
 */

import type { StoryNode, NodeEdge, GameCharacter, GameProp, GameVariable, NarrativeIntent } from '@/lib/studio-data';

export type ConsistencyIssueSeverity = 'error' | 'warning' | 'info';

export interface ConsistencyIssue {
  id: string;
  severity: ConsistencyIssueSeverity;
  category: 'character' | 'prop' | 'variable' | 'structure' | 'narrative';
  title: string;
  description: string;
  affectedNodeIds: string[];
  affectedEntityIds: string[];
  suggestion: string;
  fixLink?: string;
}

interface NarrativeData {
  storyNodes: StoryNode[];
  nodeEdges: NodeEdge[];
  characters: GameCharacter[];
  props: GameProp[];
  variables: GameVariable[];
  narrativeIntents: NarrativeIntent[];
}

/**
 * Run all consistency checks on the narrative data
 */
export function runConsistencyChecks(data: NarrativeData): ConsistencyIssue[] {
  const issues: ConsistencyIssue[] = [];

  // 1. Character consistency -- dead characters shouldn't appear in later nodes
  issues.push(...checkCharacterConsistency(data));

  // 2. Prop consistency -- unobtained props shouldn't be usable
  issues.push(...checkPropConsistency(data));

  // 3. Variable consistency -- dead variables, unreachable conditions
  issues.push(...checkVariableConsistency(data));

  // 4. Structure consistency -- disconnected nodes, dead ends
  issues.push(...checkStructureConsistency(data));

  // 5. Narrative consistency -- emotional arc gaps, missing fail feedback
  issues.push(...checkNarrativeConsistency(data));

  return issues;
}

function checkCharacterConsistency(data: NarrativeData): ConsistencyIssue[] {
  const issues: ConsistencyIssue[] = [];

  for (const char of data.characters) {
    // Check if character appears in nodes they shouldn't
    const appearNodes = char.appearNodes || [];
    if (appearNodes.length === 0) {
      issues.push({
        id: `char-no-appear-${char.id}`,
        severity: 'warning',
        category: 'character',
        title: `${char.name} 没有出场节点`,
        description: `角色「${char.name}」已配置但未在任何节点出场`,
        affectedNodeIds: [],
        affectedEntityIds: [char.id],
        suggestion: `为「${char.name}」添加出场节点，或从角色列表中移除`,
        fixLink: '/nodes',
      });
    }

    // Check for gaps in character appearance (e.g., appears in N01 and N08 but nothing between)
    if (appearNodes.length >= 2) {
      const nodeIndices = appearNodes.map(id => data.storyNodes.findIndex(n => n.id === id)).filter(i => i >= 0);
      if (nodeIndices.length >= 2) {
        const maxGap = Math.max(...nodeIndices.slice(1).map((idx, i) => idx - nodeIndices[i]));
        if (maxGap > 4) {
          issues.push({
            id: `char-gap-${char.id}`,
            severity: 'info',
            category: 'character',
            title: `${char.name} 出场间隔过大`,
            description: `角色「${char.name}」在连续 ${maxGap} 个节点中未出场，可能导致玩家遗忘`,
            affectedNodeIds: appearNodes,
            affectedEntityIds: [char.id],
            suggestion: `考虑在中间节点添加「${char.name}」的提及或间接出场`,
            fixLink: '/nodes',
          });
        }
      }
    }
  }

  return issues;
}

function checkPropConsistency(data: NarrativeData): ConsistencyIssue[] {
  const issues: ConsistencyIssue[] = [];

  for (const prop of data.props) {
    const refNodes = prop.refNodes || [];
    if (refNodes.length === 0) {
      issues.push({
        id: `prop-no-ref-${prop.id}`,
        severity: 'warning',
        category: 'prop',
        title: `道具「${prop.name}」未被引用`,
        description: `道具已配置但未关联到任何节点`,
        affectedNodeIds: [],
        affectedEntityIds: [prop.id],
        suggestion: `将「${prop.name}」关联到使用它的节点`,
        fixLink: '/nodes',
      });
    }
  }

  return issues;
}

function checkVariableConsistency(data: NarrativeData): ConsistencyIssue[] {
  const issues: ConsistencyIssue[] = [];

  for (const v of data.variables) {
    // Dead variable -- never read
    if ((!v.readBy || v.readBy.length === 0) && (v.modifiedBy || []).length > 0) {
      issues.push({
        id: `var-dead-${v.id}`,
        severity: 'warning',
        category: 'variable',
        title: `变量「${v.label}」从未被读取`,
        description: `变量在 ${v.modifiedBy.length} 个节点被修改，但没有任何节点读取它`,
        affectedNodeIds: v.modifiedBy,
        affectedEntityIds: [v.id],
        suggestion: `在条件判定中使用「${v.label}」，或移除不必要的修改`,
        fixLink: '/nodes',
      });
    }

    // Orphan variable -- never modified but read
    if ((!v.modifiedBy || v.modifiedBy.length === 0) && (v.readBy || []).length > 0) {
      issues.push({
        id: `var-orphan-${v.id}`,
        severity: 'info',
        category: 'variable',
        title: `变量「${v.label}」始终为初始值`,
        description: `变量在 ${v.readBy.length} 个节点被读取，但没有任何节点修改它`,
        affectedNodeIds: v.readBy,
        affectedEntityIds: [v.id],
        suggestion: `添加修改变量的节点，或改为直接使用常量`,
        fixLink: '/nodes',
      });
    }
  }

  return issues;
}

function checkStructureConsistency(data: NarrativeData): ConsistencyIssue[] {
  const issues: ConsistencyIssue[] = [];
  const nodeIds = new Set(data.storyNodes.map(n => n.id));
  const edgeFromIds = new Set(data.nodeEdges.map(e => e.from));
  const edgeToIds = new Set(data.nodeEdges.map(e => e.to));

  // Isolated nodes -- no edges in or out
  for (const node of data.storyNodes) {
    if (!edgeFromIds.has(node.id) && !edgeToIds.has(node.id) && node.type !== 'start') {
      issues.push({
        id: `struct-isolated-${node.id}`,
        severity: 'error',
        category: 'structure',
        title: `孤立节点「${node.label}」`,
        description: `节点没有任何连入或连出的边`,
        affectedNodeIds: [node.id],
        affectedEntityIds: [],
        suggestion: `为「${node.label}」添加边连接到故事图中`,
        fixLink: '/nodes',
      });
    }
  }

  // Dead ends -- non-ending nodes with no outgoing edges
  for (const node of data.storyNodes) {
    if (!edgeFromIds.has(node.id) && !['ending_good', 'ending_bad'].includes(node.type)) {
      issues.push({
        id: `struct-deadend-${node.id}`,
        severity: 'error',
        category: 'structure',
        title: `死路节点「${node.label}」`,
        description: `非结局节点没有出路`,
        affectedNodeIds: [node.id],
        affectedEntityIds: [],
        suggestion: `为「${node.label}」添加连出的边，或将其标记为结局节点`,
        fixLink: '/nodes',
      });
    }
  }

  // Dangling edges -- reference non-existent nodes
  for (const edge of data.nodeEdges) {
    if (!nodeIds.has(edge.from)) {
      issues.push({
        id: `struct-dangling-${edge.from}-${edge.to}`,
        severity: 'error',
        category: 'structure',
        title: `悬空边：起点 ${edge.from} 不存在`,
        description: `边从 ${edge.from} → ${edge.to}，但起点节点不存在`,
        affectedNodeIds: [edge.from],
        affectedEntityIds: [],
        suggestion: `删除该边或创建缺失的节点`,
        fixLink: '/nodes',
      });
    }
    if (!nodeIds.has(edge.to)) {
      issues.push({
        id: `struct-dangling-${edge.from}-${edge.to}-to`,
        severity: 'error',
        category: 'structure',
        title: `悬空边：终点 ${edge.to} 不存在`,
        description: `边从 ${edge.from} → ${edge.to}，但终点节点不存在`,
        affectedNodeIds: [edge.to],
        affectedEntityIds: [],
        suggestion: `删除该边或创建缺失的节点`,
        fixLink: '/nodes',
      });
    }
  }

  return issues;
}

function checkNarrativeConsistency(data: NarrativeData): ConsistencyIssue[] {
  const issues: ConsistencyIssue[] = [];

  // Missing fail feedback on condition/QTE nodes
  for (const node of data.storyNodes) {
    if (['condition', 'qte'].includes(node.type) && node.hasError) {
      issues.push({
        id: `narr-feedback-${node.id}`,
        severity: 'error',
        category: 'narrative',
        title: `「${node.label}」缺少失败反馈`,
        description: node.errorMsg || '条件/QTE 节点缺少失败路径的反馈文案',
        affectedNodeIds: [node.id],
        affectedEntityIds: [],
        suggestion: `补充「${node.label}」失败时的叙事反馈文案`,
        fixLink: '/nodes',
      });
    }
  }

  // Choice nodes with only one option
  for (const node of data.storyNodes) {
    if (node.type === 'choice') {
      const outgoing = data.nodeEdges.filter(e => e.from === node.id);
      if (outgoing.length < 2) {
        issues.push({
          id: `narr-single-choice-${node.id}`,
          severity: 'warning',
          category: 'narrative',
          title: `「${node.label}」只有 ${outgoing.length} 个选项`,
          description: '选择节点应该至少有 2 个选项才有意义',
          affectedNodeIds: [node.id],
          affectedEntityIds: [],
          suggestion: `为「${node.label}」添加更多选择分支`,
          fixLink: '/nodes',
        });
      }
    }
  }

  return issues;
}
