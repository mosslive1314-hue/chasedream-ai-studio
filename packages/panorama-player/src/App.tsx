import {
  Archive,
  BarChart3,
  BookOpen,
  ChevronRight,
  Download,
  Eye,
  Gauge,
  Heart,
  Home,
  Image,
  Import,
  Map,
  Orbit,
  RotateCcw,
  Save,
  Settings,
  Shield,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import PanoramaViewer from "./components/PanoramaViewer";
import { characterOrder, characterProfiles } from "./data/characters";
import { storyNodeList } from "./data/story";
import {
  advanceLine,
  averageTrust,
  chooseChoice,
  clearSave,
  createInitialState,
  exportSave,
  getAvailableChoices,
  getCurrentNode,
  importSave,
  isDialogueComplete,
  loadGame,
  resetGame,
  revealHotspot,
  routeLabel,
  saveGame,
  updateSettings,
} from "./engine/game";
import type { Choice, GameState, Hotspot, SpeakerId, StoryNode, ViewMode } from "./types";

type Panel = "relationships" | "memories" | "settings" | "save" | null;

interface Toast {
  title: string;
  body: string;
}

export default function App() {
  const [state, setState] = useState<GameState>(() => loadGame() ?? createInitialState());
  const [panel, setPanel] = useState<Panel>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("flat");

  const node = getCurrentNode(state);
  const line = node.lines[state.lineIndex];
  const choices = useMemo(() => (isDialogueComplete(state) ? getAvailableChoices(state) : []), [state]);
  const dialogueComplete = isDialogueComplete(state);
  const routeName = routeLabel(state.route);

  useEffect(() => {
    saveGame(state);
  }, [state]);

  useEffect(() => {
    if (!toast) {
      return;
    }
    const timeout = window.setTimeout(() => setToast(null), 3600);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const handleAdvance = () => {
    if (dialogueComplete) {
      return;
    }
    setState((current) => advanceLine(current));
  };

  const handleChoice = (choice: Choice) => {
    setState((current) => chooseChoice(current, choice));
    setToast({
      title: choice.major ? "路线发生变化" : "选择已记录",
      body: choice.caption ?? "你的回应会影响关系和终章。",
    });
  };

  const handleHotspot = (hotspot: Hotspot) => {
    setState((current) => revealHotspot(current, hotspot.id, hotspot.effect));
    setToast({ title: hotspot.label, body: hotspot.description });
  };

  const handleReset = () => {
    if (!window.confirm("确定重新开始？当前存档会被清空。")) {
      return;
    }
    clearSave();
    setState((current) => resetGame(current.settings));
    setPanel(null);
    setToast({ title: "已重新开始", body: "雨夜又回到了第一帧。" });
  };

  const handleExport = async () => {
    const payload = exportSave(state);
    try {
      await navigator.clipboard.writeText(payload);
      setToast({ title: "存档已复制", body: "导入时粘贴这段存档码即可。" });
    } catch {
      window.prompt("复制存档码", payload);
    }
  };

  const handleImport = () => {
    const payload = window.prompt("粘贴存档码");
    if (!payload) {
      return;
    }
    const imported = importSave(payload);
    if (!imported) {
      setToast({ title: "导入失败", body: "存档码无法解析。" });
      return;
    }
    setState(imported);
    setToast({ title: "导入成功", body: "已载入外部存档。" });
    setPanel(null);
  };

  const endingReady = Boolean(node.ending && dialogueComplete);

  return (
    <main className={`game-shell scale-${state.settings.uiScale}`}>
      <PanoramaViewer
        autoDrift={state.settings.autoDrift}
        hotspots={node.hotspots}
        node={node}
        onHotspot={handleHotspot}
        reducedMotion={state.settings.reducedMotion}
        seenHotspots={state.seenHotspots}
        viewMode={viewMode}
      />

      <header className="topbar">
        <button className="brand-button" onClick={() => setPanel(null)} title="回到当前剧情" type="button">
          <Home size={18} />
          <span>环景心动计划</span>
        </button>
        <div className="scene-meta">
          <span>{node.chapter}</span>
          <strong>{node.title}</strong>
          <small>{node.location}</small>
        </div>
        <div className="top-actions">
          <RenderModeSwitch mode={viewMode} onChange={setViewMode} />
          <IconButton active={panel === "relationships"} label="关系" onClick={() => setPanel(panel === "relationships" ? null : "relationships")}>
            <Heart size={18} />
          </IconButton>
          <IconButton active={panel === "memories"} label="回忆" onClick={() => setPanel(panel === "memories" ? null : "memories")}>
            <Archive size={18} />
          </IconButton>
          <IconButton active={panel === "save"} label="存档" onClick={() => setPanel(panel === "save" ? null : "save")}>
            <Save size={18} />
          </IconButton>
          <IconButton active={panel === "settings"} label="设置" onClick={() => setPanel(panel === "settings" ? null : "settings")}>
            <Settings size={18} />
          </IconButton>
        </div>
      </header>

      <aside className="status-rail">
        <StatusPill icon={<Map size={15} />} label="路线" value={routeName} />
        <StatusPill icon={<BarChart3 size={15} />} label="事业" value={state.globals.career} />
        <StatusPill icon={<Shield size={15} />} label="真诚" value={state.globals.integrity} />
        <StatusPill icon={<Gauge size={15} />} label="压力" value={state.globals.stress} warn={state.globals.stress > 70} />
        <StatusPill icon={<Users size={15} />} label="信任均值" value={averageTrust(state)} />
      </aside>

      <section className="dialogue-dock">
        <div className="dialogue-main">
          <SpeakerBadge speaker={line.speaker} />
          <p>{line.text}</p>
          {!dialogueComplete && (
            <button className="next-button" onClick={handleAdvance} title="继续" type="button">
              <ChevronRight size={20} />
            </button>
          )}
        </div>

        {dialogueComplete && !endingReady && (
          <div className="choice-grid">
            {choices.map((choice) => (
              <button className={choice.major ? "choice-card is-major" : "choice-card"} key={choice.id} onClick={() => handleChoice(choice)} type="button">
                <span>{choice.label}</span>
                {choice.caption && <small>{choice.caption}</small>}
              </button>
            ))}
          </div>
        )}

        {endingReady && (
          <div className={`ending-panel type-${node.ending?.type}`}>
            <span>结局达成</span>
            <strong>{node.ending?.title}</strong>
            <p>{node.ending?.subtitle}</p>
            <div className="ending-actions">
              <button onClick={handleExport} type="button">
                <Download size={17} />
                导出存档
              </button>
              <button onClick={handleReset} type="button">
                <RotateCcw size={17} />
                重新开始
              </button>
            </div>
          </div>
        )}
      </section>

      {panel && (
        <PanelShell title={panelTitle(panel)} onClose={() => setPanel(null)}>
          {panel === "relationships" && <RelationshipPanel state={state} />}
          {panel === "memories" && <MemoryPanel currentNode={node} state={state} />}
          {panel === "settings" && (
            <SettingsPanel
              onChange={(settings) => setState((current) => updateSettings(current, settings))}
              settings={state.settings}
            />
          )}
          {panel === "save" && (
            <SavePanel
              lastSavedAt={state.lastSavedAt}
              onExport={handleExport}
              onImport={handleImport}
              onReset={handleReset}
            />
          )}
        </PanelShell>
      )}

      {toast && (
        <div className="toast">
          <strong>{toast.title}</strong>
          <span>{toast.body}</span>
        </div>
      )}
    </main>
  );
}

function IconButton({
  active,
  children,
  label,
  onClick,
}: {
  active?: boolean;
  children: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button className={active ? "icon-button is-active" : "icon-button"} onClick={onClick} title={label} type="button">
      {children}
      <span>{label}</span>
    </button>
  );
}

function RenderModeSwitch({ mode, onChange }: { mode: ViewMode; onChange: (mode: ViewMode) => void }) {
  return (
    <div aria-label="画面模式" className="render-mode-switch" role="group">
      <button className={mode === "flat" ? "is-active" : ""} onClick={() => onChange("flat")} title="平面" type="button">
        <Image size={16} />
        <span>平面</span>
      </button>
      <button className={mode === "panorama" ? "is-active" : ""} onClick={() => onChange("panorama")} title="全景" type="button">
        <Orbit size={16} />
        <span>全景</span>
      </button>
    </div>
  );
}

function StatusPill({
  icon,
  label,
  value,
  warn,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  warn?: boolean;
}) {
  return (
    <div className={warn ? "status-pill is-warn" : "status-pill"}>
      {icon}
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function SpeakerBadge({ speaker }: { speaker: SpeakerId }) {
  const profile = speaker in characterProfiles ? characterProfiles[speaker as keyof typeof characterProfiles] : null;
  const label = profile?.name ?? speakerLabel(speaker);
  return (
    <div className="speaker-badge" style={profile ? ({ "--speaker-color": profile.color } as React.CSSProperties) : undefined}>
      <span />
      <strong>{label}</strong>
    </div>
  );
}

function RelationshipPanel({ state }: { state: GameState }) {
  return (
    <div className="relationship-panel">
      {characterOrder.map((id) => {
        const profile = characterProfiles[id];
        const stats = state.relationships[id];
        return (
          <article className="relationship-row" key={id} style={{ "--character-color": profile.color } as React.CSSProperties}>
            <div className="character-head">
              <div>
                <strong>{profile.name}</strong>
                <span>{profile.role}</span>
              </div>
              <small>{profile.theme}</small>
            </div>
            <Metric icon={<Sparkles size={14} />} label="心动" value={stats.spark} />
            <Metric icon={<Shield size={14} />} label="信任" value={stats.trust} />
            <Metric icon={<Eye size={14} />} label="边界" value={stats.boundary} />
          </article>
        );
      })}
    </div>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="metric-row">
      <span>
        {icon}
        {label}
      </span>
      <div className="metric-track">
        <i style={{ width: `${value}%` }} />
      </div>
      <strong>{value}</strong>
    </div>
  );
}

function MemoryPanel({ currentNode, state }: { currentNode: StoryNode; state: GameState }) {
  const visited = storyNodeList.filter((node) => state.visitedNodes.includes(node.id));
  return (
    <div className="memory-panel">
      <div className="current-memory">
        <BookOpen size={18} />
        <div>
          <strong>{currentNode.title}</strong>
          <span>{currentNode.synopsis}</span>
        </div>
      </div>
      <div className="memory-columns">
        <section>
          <h3>已到达场景</h3>
          <ul>
            {visited.map((node) => (
              <li key={node.id}>
                <span>{node.chapter}</span>
                <strong>{node.title}</strong>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h3>已发现回忆</h3>
          <ul>
            {(state.memories.length ? state.memories : ["还没有发现隐藏回忆"]).map((memory) => (
              <li key={memory}>
                <span>记忆</span>
                <strong>{memory}</strong>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

function SettingsPanel({
  onChange,
  settings,
}: {
  onChange: (settings: Partial<GameState["settings"]>) => void;
  settings: GameState["settings"];
}) {
  return (
    <div className="settings-panel">
      <label className="toggle-row">
        <input checked={settings.autoDrift} onChange={(event) => onChange({ autoDrift: event.target.checked })} type="checkbox" />
        <span>
          <strong>自动环视</strong>
          <small>暂停操作后缓慢移动视角</small>
        </span>
      </label>
      <label className="toggle-row">
        <input checked={settings.reducedMotion} onChange={(event) => onChange({ reducedMotion: event.target.checked })} type="checkbox" />
        <span>
          <strong>减少动效</strong>
          <small>关闭环境漂移和部分过渡</small>
        </span>
      </label>
      <div className="segmented">
        <button className={settings.uiScale === "comfortable" ? "is-active" : ""} onClick={() => onChange({ uiScale: "comfortable" })} type="button">
          舒展
        </button>
        <button className={settings.uiScale === "compact" ? "is-active" : ""} onClick={() => onChange({ uiScale: "compact" })} type="button">
          紧凑
        </button>
      </div>
    </div>
  );
}

function SavePanel({
  lastSavedAt,
  onExport,
  onImport,
  onReset,
}: {
  lastSavedAt: number;
  onExport: () => void;
  onImport: () => void;
  onReset: () => void;
}) {
  return (
    <div className="save-panel">
      <div className="save-time">
        <Save size={20} />
        <div>
          <strong>自动存档</strong>
          <span>{new Date(lastSavedAt).toLocaleString()}</span>
        </div>
      </div>
      <div className="save-actions">
        <button onClick={onExport} type="button">
          <Download size={17} />
          导出
        </button>
        <button onClick={onImport} type="button">
          <Import size={17} />
          导入
        </button>
        <button className="danger" onClick={onReset} type="button">
          <RotateCcw size={17} />
          重开
        </button>
      </div>
    </div>
  );
}

function PanelShell({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <aside className="side-panel">
      <div className="panel-head">
        <strong>{title}</strong>
        <button onClick={onClose} title="关闭" type="button">
          <X size={18} />
        </button>
      </div>
      {children}
    </aside>
  );
}

function panelTitle(panel: Exclude<Panel, null>): string {
  const titles = {
    relationships: "关系",
    memories: "回忆",
    settings: "设置",
    save: "存档",
  };
  return titles[panel];
}

function speakerLabel(speaker: SpeakerId): string {
  switch (speaker) {
    case "narrator":
      return "旁白";
    case "you":
      return "沈亦舟";
    case "system":
      return "系统";
    default:
      return speaker;
  }
}

