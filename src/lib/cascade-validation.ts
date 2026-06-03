/**
 * 跨页面级联验证工具
 *
 * 当用户修改角色/场景/道具/节点时，自动检查受影响的关联数据，
 * 返回影响报告供 UI 展示（toast 通知或内联警告）。
 */

import { useNarrativeStore } from "@/store";

export interface CascadeImpact {
  type: "character" | "scene" | "prop" | "node" | "variable";
  entityId: string;
  entityLabel: string;
  affectedNodes: string[];
  affectedScenes: string[];
  affectedCinematics: string[];
  severity: "info" | "warning" | "error";
  message: string;
}

/**
 * 检查删除/修改角色时的级联影响
 */
export function checkCharacterImpact(characterId: string): CascadeImpact | null {
  const state = useNarrativeStore.getState();
  const character = state.characters.find(c => c.id === characterId);
  if (!character) return null;

  const affectedNodes = character.appearNodes || [];
  const affectedScenes = state.scenes.filter(s =>
    s.refNodes.some(n => affectedNodes.includes(n))
  ).map(s => s.id);
  const affectedCinematics = state.cinematicDirections.filter(d =>
    affectedNodes.includes(d.nodeId)
  ).map(d => d.nodeId);

  if (affectedNodes.length === 0 && affectedScenes.length === 0) {
    return {
      type: "character",
      entityId: characterId,
      entityLabel: character.name,
      affectedNodes: [],
      affectedScenes: [],
      affectedCinematics: [],
      severity: "info",
      message: `角色「${character.name}」暂未关联任何节点`,
    };
  }

  const severity = affectedCinematics.length > 0 ? "warning" : "info";

  return {
    type: "character",
    entityId: characterId,
    entityLabel: character.name,
    affectedNodes,
    affectedScenes,
    affectedCinematics,
    severity,
    message: `角色「${character.name}」关联 ${affectedNodes.length} 个节点、${affectedScenes.length} 个场景、${affectedCinematics.length} 个演出方向`,
  };
}

/**
 * 检查删除/修改场景时的级联影响
 */
export function checkSceneImpact(sceneId: string): CascadeImpact | null {
  const state = useNarrativeStore.getState();
  const scene = state.scenes.find(s => s.id === sceneId);
  if (!scene) return null;

  const refNodes = scene.refNodes || [];
  const charactersInScene = state.characters.filter(c =>
    (c.appearNodes || []).some(n => refNodes.includes(n))
  );

  return {
    type: "scene",
    entityId: sceneId,
    entityLabel: scene.name,
    affectedNodes: refNodes,
    affectedScenes: [],
    affectedCinematics: state.cinematicDirections
      .filter(d => refNodes.includes(d.nodeId))
      .map(d => d.nodeId),
    severity: charactersInScene.length > 0 ? "warning" : "info",
    message: `场景「${scene.name}」关联 ${refNodes.length} 个节点，涉及 ${charactersInScene.length} 个角色`,
  };
}

/**
 * 检查删除/修改道具时的级联影响
 */
export function checkPropImpact(propId: string): CascadeImpact | null {
  const state = useNarrativeStore.getState();
  const prop = state.props.find(p => p.id === propId);
  if (!prop) return null;

  const refNodes = prop.refNodes || [];

  return {
    type: "prop",
    entityId: propId,
    entityLabel: prop.name,
    affectedNodes: refNodes,
    affectedScenes: [],
    affectedCinematics: [],
    severity: refNodes.length > 3 ? "warning" : "info",
    message: `道具「${prop.name}」关联 ${refNodes.length} 个节点`,
  };
}

/**
 * 检查删除节点时的级联影响
 */
export function checkNodeDeletionImpact(nodeId: string): CascadeImpact | null {
  const state = useNarrativeStore.getState();
  const node = state.storyNodes.find(n => n.id === nodeId);
  if (!node) return null;

  // Check edges pointing to/from this node
  const inEdges = state.nodeEdges.filter(e => e.to === nodeId);
  const outEdges = state.nodeEdges.filter(e => e.from === nodeId);

  // Check if this node is referenced by characters, scenes, props
  const charsUsingNode = state.characters.filter(c =>
    (c.appearNodes || []).includes(nodeId)
  );
  const scenesUsingNode = state.scenes.filter(s =>
    (s.refNodes || []).includes(nodeId)
  );

  const severity = inEdges.length > 0 || outEdges.length > 0 ? "error" : "warning";

  return {
    type: "node",
    entityId: nodeId,
    entityLabel: node.label,
    affectedNodes: [...new Set([...inEdges.map(e => e.from), ...outEdges.map(e => e.to)])],
    affectedScenes: scenesUsingNode.map(s => s.id),
    affectedCinematics: state.cinematicDirections
      .filter(d => d.nodeId === nodeId)
      .map(d => d.nodeId),
    severity,
    message: `节点「${node.label}」有 ${inEdges.length} 条入边、${outEdges.length} 条出边，被 ${charsUsingNode.length} 个角色和 ${scenesUsingNode.length} 个场景引用`,
  };
}

/**
 * 检查变量修改时的级联影响
 */
export function checkVariableImpact(variableId: string): CascadeImpact | null {
  const state = useNarrativeStore.getState();
  const variable = state.variables.find(v => v.id === variableId);
  if (!variable) return null;

  const modifiedBy = variable.modifiedBy || [];
  const readBy = variable.readBy || [];
  const allNodes = [...new Set([...modifiedBy, ...readBy])];

  return {
    type: "variable",
    entityId: variableId,
    entityLabel: variable.name,
    affectedNodes: allNodes,
    affectedScenes: [],
    affectedCinematics: [],
    severity: allNodes.length > 5 ? "warning" : "info",
    message: `变量「${variable.name}」在 ${modifiedBy.length} 个节点中修改，在 ${readBy.length} 个节点中读取`,
  };
}

/**
 * 生成所有影响报告的摘要（供 toast 使用）
 */
export function summarizeImpacts(impacts: (CascadeImpact | null)[]): {
  warnings: number;
  errors: number;
  summary: string;
} {
  const valid = impacts.filter(Boolean) as CascadeImpact[];
  const warnings = valid.filter(i => i.severity === "warning").length;
  const errors = valid.filter(i => i.severity === "error").length;
  const totalAffected = valid.reduce((sum, i) => sum + i.affectedNodes.length, 0);

  let summary = "";
  if (errors > 0) {
    summary = `${errors} 项高风险变更，可能破坏关联数据`;
  } else if (warnings > 0) {
    summary = `${warnings} 项变更影响关联数据（共 ${totalAffected} 个节点）`;
  } else {
    summary = "变更影响较小";
  }

  return { warnings, errors, summary };
}
