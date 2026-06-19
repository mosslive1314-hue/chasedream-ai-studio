/**
 * ContextPanel — 右侧上下文面板
 *
 * Agent-First 布局的右侧区域，根据当前 Workbench tab 和选中内容动态变化：
 * - 画布 tab + 选中节点 → 节点属性编辑
 * - 预览 tab → 当前场景信息
 * - 始终可见：角色列表、变量、版本快照入口
 *
 * 可折叠（图标模式/展开模式）
 */

import {
  GitBranch, Play, Package, Settings,
  Layers, Users, GitMerge, Clock,
} from "lucide-react";
import { useUIStore } from "@/store/use-ui-store";
import { useNarrativeStore } from "@/store";
import { useVersionStore } from "@/store/use-version-store";
import { useMemo } from "react";

// ─── Design Tokens ───────────────────────────────────────────

const S = {
  bg: "#FFFFFF",
  border: "#E2E5F0",
  primary: "#5E50E8",
  primary10: "rgba(94,80,232,0.10)",
  text: "#1A1D2E",
  text2: "#4A5068",
  text3: "#8892B0",
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
};

// ─── Component ───────────────────────────────────────────────

export function ContextPanel() {
  const activeTab = useUIStore(s => s.activeTab);
  const collapsed = useUIStore(s => s.contextPanelCollapsed);
  const selectedNodeId = useUIStore(s => s.selectedNodeId);

  // Narrative store data
  const storyNodes = useNarrativeStore(s => s.storyNodes);
  const characters = useNarrativeStore(s => s.characters);
  const variables = useNarrativeStore(s => s.variables);
  const snapshots = useVersionStore(s => s.snapshots);

  // Selected node details
  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null;
    return storyNodes.find(n => n.id === selectedNodeId) ?? null;
  }, [selectedNodeId, storyNodes]);

  // Collapsed: show icon-only strip
  if (collapsed) {
    return (
      <div className="flex flex-col items-center pt-3 gap-3 w-full h-full" style={{ background: S.bg }}>
        <ContextIcon icon={Layers} label="属性" />
        <ContextIcon icon={Users} label="角色" />
        <ContextIcon icon={GitMerge} label="变量" />
        <ContextIcon icon={Clock} label="版本" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full overflow-hidden" style={{ background: S.bg }}>
      {/* ── Header ──────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-3 h-9 shrink-0 border-b text-xs font-semibold"
        style={{ color: S.text, borderColor: S.border }}
      >
        <span>属性面板</span>
        <span className="text-xs font-normal" style={{ color: S.text3 }}>
          {activeTab === "canvas" ? "节点属性" : activeTab === "simulator" ? "预览信息" : activeTab === "assets" ? "资产管理" : "配置"}
        </span>
      </div>

      {/* ── Scrollable Content ──────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">

        {/* Selected Node Properties (canvas tab) */}
        {activeTab === "canvas" && selectedNode && (
          <Section title="选中节点" icon={<GitBranch size={12} style={{ color: S.primary }} />}>
            <div className="space-y-2">
              <PropRow label="ID" value={selectedNode.id} />
              <PropRow label="类型" value={selectedNode.type} />
              <PropRow label="标题" value={selectedNode.title ?? "—"} />
              {selectedNode.description && (
                <PropRow label="描述" value={selectedNode.description.slice(0, 80) + (selectedNode.description.length > 80 ? "…" : "")} />
              )}
            </div>
          </Section>
        )}

        {activeTab === "canvas" && !selectedNode && (
          <Section title="节点属性" icon={<GitBranch size={12} style={{ color: S.primary }} />}>
            <p className="text-xs" style={{ color: S.text3 }}>
              在画布中选中一个节点查看其属性
            </p>
          </Section>
        )}

        {/* Characters Quick View */}
        <Section title="角色" icon={<Users size={12} style={{ color: S.primary }} />}>
          <div className="space-y-1">
            {characters.slice(0, 5).map(char => (
              <div key={char.id} className="flex items-center gap-2 text-xs py-1">
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs shrink-0"
                  style={{ background: S.primary, fontSize: 9 }}
                >
                  {(char.name ?? "?")[0]}
                </span>
                <span style={{ color: S.text2 }}>{char.name}</span>
              </div>
            ))}
            {characters.length === 0 && (
              <p className="text-xs" style={{ color: S.text3 }}>暂无角色</p>
            )}
          </div>
        </Section>

        {/* Variables Quick View */}
        <Section title="变量" icon={<GitMerge size={12} style={{ color: S.primary }} />}>
          <div className="space-y-1">
            {Object.entries(variables).slice(0, 6).map(([key, val]) => (
              <div key={key} className="flex items-center justify-between text-xs py-0.5">
                <span style={{ color: S.text2 }}>{key}</span>
                <span className="font-mono" style={{ color: S.primary }}>{String(val)}</span>
              </div>
            ))}
            {Object.keys(variables).length === 0 && (
              <p className="text-xs" style={{ color: S.text3 }}>暂无变量</p>
            )}
          </div>
        </Section>

        {/* Version Quick View */}
        <Section title="版本快照" icon={<Clock size={12} style={{ color: S.primary }} />}>
          <div className="space-y-1">
            {snapshots.slice(0, 3).map(snap => (
              <div key={snap.id} className="flex items-center justify-between text-xs py-0.5">
                <span style={{ color: S.text2 }}>{snap.label}</span>
                <span style={{ color: S.text3, fontSize: 9 }}>
                  {new Date(snap.timestamp).toLocaleDateString("zh-CN")}
                </span>
              </div>
            ))}
            {snapshots.length === 0 && (
              <p className="text-xs" style={{ color: S.text3 }}>暂无快照</p>
            )}
          </div>
        </Section>

        {/* Simulator Info (simulator tab) */}
        {activeTab === "simulator" && (
          <Section title="预览信息" icon={<Play size={12} style={{ color: S.primary }} />}>
            <p className="text-xs" style={{ color: S.text3 }}>
              在预览模式中浏览故事线，选择分支查看不同结局。
            </p>
          </Section>
        )}

        {/* Assets Info (assets tab) */}
        {activeTab === "assets" && (
          <Section title="资产概览" icon={<Package size={12} style={{ color: S.primary }} />}>
            <p className="text-xs" style={{ color: S.text3 }}>
              管理项目的文本、图片、音频和视频资产。
            </p>
          </Section>
        )}

        {/* Settings Info (settings tab) */}
        {activeTab === "settings" && (
          <Section title="配置" icon={<Settings size={12} style={{ color: S.primary }} />}>
            <p className="text-xs" style={{ color: S.text3 }}>
              配置 AI 模型 API Key 和其他项目设置。
            </p>
          </Section>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        {icon}
        <span className="text-xs font-semibold" style={{ color: S.text }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

function PropRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 text-xs">
      <span className="shrink-0 w-10 text-right" style={{ color: S.text3 }}>{label}</span>
      <span className="break-all" style={{ color: S.text2 }}>{value}</span>
    </div>
  );
}

function ContextIcon({ icon: Icon, label }: { icon: typeof Layers; label: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5" title={label}>
      <Icon size={14} style={{ color: S.text3 }} />
      <span style={{ fontSize: 8, color: S.text3 }}>{label}</span>
    </div>
  );
}
