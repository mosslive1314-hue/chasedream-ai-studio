"use client";

import { useEffect, useRef } from "react";
import { useNarrativeStore } from "@/store";
import { runConsistencyChecks, type ConsistencyIssue } from "@/lib/consistency-engine";

/**
 * useConsistencyChecker — 自动一致性校验 Hook
 *
 * 监听 storyNodes / nodeEdges / characters / props / variables 变化，
 * 自动运行一致性检查，将结构类错误写入对应节点的 hasError / errorMsg 字段，
 * 让 context-panel 的错误展示 UI 活过来。
 *
 * 同时返回最新的 issues 列表，供 UI 层展示全局问题面板。
 */
export function useConsistencyChecker(): ConsistencyIssue[] {
  const storyNodes = useNarrativeStore((s) => s.storyNodes);
  const nodeEdges = useNarrativeStore((s) => s.nodeEdges);
  const characters = useNarrativeStore((s) => s.characters);
  const props = useNarrativeStore((s) => s.props);
  const variables = useNarrativeStore((s) => s.variables);
  const narrativeIntents = useNarrativeStore((s) => s.narrativeIntents);
  const updateNode = useNarrativeStore((s) => s.updateNode);

  const issuesRef = useRef<ConsistencyIssue[]>([]);
  const prevErrorMap = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    const issues = runConsistencyChecks({
      storyNodes,
      nodeEdges,
      characters,
      props,
      variables,
      narrativeIntents,
    });
    issuesRef.current = issues;

    // 构建本次错误映射：nodeId → 错误描述
    const errorMap = new Map<string, string>();
    for (const issue of issues) {
      if (issue.severity === "error" && issue.affectedNodeIds.length > 0) {
        for (const nodeId of issue.affectedNodeIds) {
          // 多个错误合并显示
          const existing = errorMap.get(nodeId);
          const desc = issue.title;
          errorMap.set(nodeId, existing ? `${existing}; ${desc}` : desc);
        }
      }
    }

    // 只更新有变化的节点，避免无限循环
    const allNodeIds = new Set([...errorMap.keys(), ...prevErrorMap.current.keys()]);
    for (const nodeId of allNodeIds) {
      const newMsg = errorMap.get(nodeId) ?? "";
      const oldMsg = prevErrorMap.current.get(nodeId) ?? "";
      if (newMsg !== oldMsg) {
        updateNode(nodeId, {
          hasError: newMsg !== "",
          errorMsg: newMsg || undefined,
        });
      }
    }
    prevErrorMap.current = errorMap;
  }, [storyNodes, nodeEdges, characters, props, variables, narrativeIntents, updateNode]);

  return issuesRef.current;
}
