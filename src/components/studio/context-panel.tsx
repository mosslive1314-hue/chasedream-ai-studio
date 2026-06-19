"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft, Clock, Users, Layers, X, Info } from "lucide-react";
import { useNarrativeStore } from "@/store";
import type { StoryNode } from "@/lib/types/narrative";
import { VersionPanel } from "./version-panel";
import { DeleteConfirmDialog } from "./delete-confirm-dialog";

interface ContextPanelProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  selectedNodeId: string | null;
  onSelectNode: (id: string | null) => void;
}

// 可编辑字段
function EditableField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <p className="mb-0.5 text-[10px] uppercase tracking-wide text-zinc-500">{label}</p>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md bg-zinc-900 px-2 py-1 text-xs text-zinc-200 outline-none border border-zinc-800 focus:border-orange-500"
      />
    </div>
  );
}

// 只读字段展示
function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-0.5 text-[10px] uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="truncate rounded-md bg-zinc-900 px-2 py-1 text-xs text-zinc-200">{value}</p>
    </div>
  );
}

// 节点属性编辑（选中节点时显示）
function NodeProperties({
  node,
  onClear,
  onUpdate,
  onDelete,
}: {
  node: StoryNode;
  onClear: () => void;
  onUpdate: (updates: Partial<StoryNode>) => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-200">节点属性</span>
        <button onClick={onClear} className="text-zinc-500 hover:text-zinc-300" title="取消选择">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <Field label="ID" value={node.id} />
      <EditableField
        label="标签"
        value={node.label}
        onChange={(v) => onUpdate({ label: v })}
      />
      <Field label="类型" value={node.type} />
      <Field label="坐标" value={`(${node.x}, ${node.y})`} />
      {node.povCharacterId && <Field label="POV 角色" value={node.povCharacterId} />}
      {node.hasError && (
        <div className="rounded-md border border-red-900/50 bg-red-950/30 p-2 text-[11px] text-red-300">
          {node.errorMsg ?? "节点存在错误"}
        </div>
      )}
      <button
        onClick={onDelete}
        className="mt-1 rounded-md border border-red-900/50 bg-red-950/30 px-2 py-1.5 text-xs text-red-300 hover:bg-red-900/40"
      >
        删除此节点
      </button>
    </div>
  );
}

// 角色列表
function CharacterList() {
  const characters = useNarrativeStore((s) => s.characters);
  return (
    <div>
      <div className="mb-2 flex items-center gap-1.5 text-[11px] font-medium text-zinc-400">
        <Users className="h-3 w-3" /> 角色列表 ({characters.length})
      </div>
      <div className="space-y-1">
        {characters.length === 0 && (
          <p className="px-2 py-1 text-[11px] text-zinc-600">暂无角色</p>
        )}
        {characters.map((c) => (
          <div key={c.id} className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-zinc-900">
            <span>{c.emoji}</span>
            <span className="flex-1 truncate text-xs text-zinc-200">{c.name}</span>
            <span className="text-[10px] text-zinc-600">{c.role}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// 变量列表
function VariableList() {
  const variables = useNarrativeStore((s) => s.variables);
  return (
    <div>
      <div className="mb-2 flex items-center gap-1.5 text-[11px] font-medium text-zinc-400">
        <Layers className="h-3 w-3" /> 变量列表 ({variables.length})
      </div>
      <div className="space-y-1">
        {variables.length === 0 && (
          <p className="px-2 py-1 text-[11px] text-zinc-600">暂无变量</p>
        )}
        {variables.map((v) => (
          <div
            key={v.id}
            className="flex items-center justify-between rounded-md px-2 py-1 hover:bg-zinc-900"
          >
            <span className="truncate text-xs text-zinc-200">{v.label}</span>
            <span className="font-mono text-[10px] text-zinc-500">{v.initialValue}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// 帮助说明
function HelpInfo() {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="mb-2 flex w-full items-center gap-1.5 text-[11px] font-medium text-zinc-400"
      >
        <Info className="h-3 w-3" /> 使用说明
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden text-[11px] leading-relaxed text-zinc-500"
          >
            <p className="mb-1.5"><b className="text-zinc-400">对话区</b>：用自然语言指挥 Agent 创建/修改内容，如"创建一个场景"。</p>
            <p className="mb-1.5"><b className="text-zinc-400">预览</b>：画布默认显示实时预览，Agent 产出会即时反映。</p>
            <p className="mb-1.5"><b className="text-zinc-400">节点图</b>：切到"节点图"tab 可查看/编辑分支结构。</p>
            <p><b className="text-zinc-400">浮动面板</b>：选中节点时本面板自动浮出，可拖拽位置。</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// 浮动上下文面板：覆盖在画布右侧，选中节点或手动触发时显示
export function ContextPanel({
  collapsed,
  onToggleCollapse,
  selectedNodeId,
  onSelectNode,
}: ContextPanelProps) {
  const storyNodes = useNarrativeStore((s) => s.storyNodes);
  const updateNode = useNarrativeStore((s) => s.updateNode);
  const removeNode = useNarrativeStore((s) => s.removeNode);
  const rebuildPlayableGraph = useNarrativeStore((s) => s.rebuildPlayableGraph);
  const selected = storyNodes.find((n) => n.id === selectedNodeId) ?? null;
  const [showVersionPanel, setShowVersionPanel] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // 折叠状态：只显示一个恢复按钮（贴在右边缘）
  if (collapsed) {
    return (
      <button
        onClick={onToggleCollapse}
        className="absolute right-0 top-1/2 z-30 flex h-16 w-7 -translate-y-1/2 items-center justify-center rounded-l-md border border-r-0 border-zinc-700 bg-zinc-900/90 text-zinc-400 backdrop-blur hover:bg-zinc-800 hover:text-zinc-200"
        title="展开上下文面板"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
    );
  }

  // 展开状态：浮动面板贴在画布右侧
  return (
    <motion.div
      initial={{ x: 40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 40, opacity: 0 }}
      transition={{ type: "spring", damping: 26, stiffness: 300 }}
      className="absolute right-3 top-12 z-30 flex h-[calc(100%-4rem)] w-[280px] flex-col rounded-lg border border-zinc-700 bg-zinc-950/95 shadow-2xl backdrop-blur"
    >
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-zinc-800 px-3">
        <span className="text-xs font-medium text-zinc-200">
          {selected ? "节点属性" : "上下文"}
        </span>
        <button
          onClick={onToggleCollapse}
          className="text-zinc-500 hover:text-zinc-300"
          title="收起面板"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-3">
        {selected ? (
          <NodeProperties
            node={selected}
            onClear={() => onSelectNode(null)}
            onUpdate={(updates) => {
              updateNode(selected.id, updates);
              rebuildPlayableGraph();
            }}
            onDelete={() => {
              setDeleteTargetId(selected.id);
            }}
          />
        ) : (
          <>
            <HelpInfo />
            <CharacterList />
            <VariableList />
          </>
        )}
      </div>

      {/* 底部：版本快照入口 */}
      <div className="shrink-0 border-t border-zinc-800 p-2">
        <button
          onClick={() => setShowVersionPanel(true)}
          className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
        >
          <Clock className="h-3.5 w-3.5" /> 版本快照
        </button>
      </div>

      {/* 版本快照面板 */}
      <AnimatePresence>
        {showVersionPanel && (
          <VersionPanel onClose={() => setShowVersionPanel(false)} />
        )}
      </AnimatePresence>

      {/* 删除确认对话框 — 显示级联影响 */}
      {deleteTargetId && (
        <DeleteConfirmDialog
          nodeId={deleteTargetId}
          onConfirm={() => {
            removeNode(deleteTargetId);
            rebuildPlayableGraph();
            onSelectNode(null);
            setDeleteTargetId(null);
          }}
          onCancel={() => setDeleteTargetId(null)}
        />
      )}
    </motion.div>
  );
}
