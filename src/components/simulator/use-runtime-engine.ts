/**
 * 运行时引擎 Hook — 封装 SceneContext + NodeExecutor
 * 提供 React 友好的接口来管理演出运行时状态
 */

"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import { SceneContext, NodeExecutor, type RuntimeSnapshot } from "@/lib/runtime";
import type { PlayableNode } from "@/lib/types/game";

export interface RuntimeEngineState {
  /** 当前节点 ID */
  currentNodeId: string;
  /** 当前节点数据 */
  currentNode: PlayableNode | null;
  /** 所有场景对象 */
  sceneObjects: ReturnType<SceneContext['getAllObjects']>;
  /** 运行时变量 */
  variables: Record<string, number | string | boolean>;
  /** 访问历史 */
  history: string[];
  /** 是否到达结局 */
  isFinished: boolean;
  /** 结局类型 */
  endingType: 'good' | 'bad' | null;
  /** 是否等待选择 */
  waitingForChoice: boolean;
  /** 是否可回退 */
  canRollback: boolean;
  /** 快照数量 */
  snapshotCount: number;
}

export interface RuntimeEngineActions {
  /** 执行一个节点 */
  execute: (nodeId: string) => void;
  /** 选择选项 */
  choose: (optionIndex: number) => string | null;
  /** 点击继续 */
  advance: () => string | null;
  /** 回退一步 */
  rollback: () => boolean;
  /** 重置到起始节点 */
  reset: (startNodeId: string, initVars?: Record<string, number>) => void;
  /** 捕获快照 */
  captureSnapshot: () => RuntimeSnapshot;
  /** 恢复快照 */
  restoreSnapshot: (snapshot: RuntimeSnapshot) => void;
  /** 获取 SceneContext 实例（高级用法） */
  getContext: () => SceneContext;
}

/**
 * 使用运行时引擎
 * @param graph 可玩图
 */
export function useRuntimeEngine(graph: Record<string, PlayableNode>): RuntimeEngineState & RuntimeEngineActions {
  const contextRef = useRef<SceneContext>(new SceneContext());
  const executorRef = useRef<NodeExecutor>(new NodeExecutor(graph, contextRef.current));

  // 更新 executor 的 graph 引用（graph 可能因 rebuild 变化）
  executorRef.current = new NodeExecutor(graph, contextRef.current);

  const [updateCounter, forceUpdate] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [endingType, setEndingType] = useState<'good' | 'bad' | null>(null);
  const [waitingForChoice, setWaitingForChoice] = useState(false);

  const refresh = useCallback(() => forceUpdate(n => n + 1), []);

  const execute = useCallback((nodeId: string) => {
    const result = executorRef.current.execute(nodeId);
    setIsFinished(result.finished);
    setEndingType(result.endingType ?? null);
    setWaitingForChoice(result.waitingForChoice);
    refresh();
  }, [refresh]);

  const choose = useCallback((optionIndex: number): string | null => {
    // 选择前先保存快照
    contextRef.current.pushSnapshot();
    const nextId = executorRef.current.choose(optionIndex);
    if (nextId) {
      execute(nextId);
    }
    return nextId;
  }, [execute]);

  const advance = useCallback((): string | null => {
    contextRef.current.pushSnapshot();
    const nextId = executorRef.current.advance();
    if (nextId) {
      execute(nextId);
    }
    return nextId;
  }, [execute]);

  const rollback = useCallback((): boolean => {
    const snapshot = contextRef.current.popSnapshot();
    if (snapshot) {
      setIsFinished(false);
      setEndingType(null);
      setWaitingForChoice(false);
      refresh();
      return true;
    }
    return false;
  }, [refresh]);

  const reset = useCallback((startNodeId: string, initVars?: Record<string, number>) => {
    const ctx = contextRef.current;
    ctx.clearObjects();
    // 重置变量
    if (initVars) {
      for (const [k, v] of Object.entries(initVars)) {
        ctx.setVariable(k, v);
      }
    }
    // 清空快照栈
    while (ctx.canRollback()) ctx.popSnapshot();
    setIsFinished(false);
    setEndingType(null);
    setWaitingForChoice(false);
    execute(startNodeId);
  }, [execute]);

  const captureSnapshot = useCallback(() => contextRef.current.captureSnapshot(), []);
  const restoreSnapshot = useCallback((snapshot: RuntimeSnapshot) => {
    contextRef.current.restoreSnapshot(snapshot);
    refresh();
  }, [refresh]);
  const getContext = useCallback(() => contextRef.current, []);

  // 派生状态
  const ctx = contextRef.current;
  const state: RuntimeEngineState = useMemo(() => ({
    currentNodeId: ctx.getCurrentNodeId(),
    currentNode: executorRef.current.getCurrentNode(),
    sceneObjects: ctx.getAllObjects(),
    variables: ctx.getAllVariables(),
    history: ctx.getHistory(),
    isFinished,
    endingType,
    waitingForChoice,
    canRollback: ctx.canRollback(),
    snapshotCount: ctx.getSnapshotCount(),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- updateCounter is required to force re-render when executing non-choice/non-ending nodes
  }), [ctx, isFinished, endingType, waitingForChoice, updateCounter]);

  return {
    ...state,
    execute,
    choose,
    advance,
    rollback,
    reset,
    captureSnapshot,
    restoreSnapshot,
    getContext,
  };
}
