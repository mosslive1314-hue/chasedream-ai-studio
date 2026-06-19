import { START_NODE_ID, storyNodes } from "../data/story";
import type {
  CharacterId,
  Choice,
  Condition,
  Effect,
  GameSettings,
  GameState,
  GlobalKey,
  GlobalStats,
  MetricKey,
  RelationshipStats,
  RouteId,
  StoryNode,
} from "../types";

export const SAVE_KEY = "panorama-romance-game-save-v1";

const characters: CharacterId[] = ["lin", "qi", "su", "xia", "cheng", "ruan"];
const metrics: MetricKey[] = ["spark", "trust", "boundary"];
const globalKeys: GlobalKey[] = ["career", "integrity", "stress"];

const defaultRelationship: RelationshipStats = {
  spark: 30,
  trust: 30,
  boundary: 50,
};

const defaultGlobals: GlobalStats = {
  career: 32,
  integrity: 38,
  stress: 45,
};

export const defaultSettings: GameSettings = {
  autoDrift: true,
  reducedMotion: false,
  uiScale: "comfortable",
  gyroscope: false,
  audio: {
    masterVolume: 0.8,
    voiceVolume: 1,
    bgmVolume: 0.5,
    muted: false,
  },
};

export function createInitialState(): GameState {
  return {
    currentNodeId: START_NODE_ID,
    lineIndex: 0,
    relationships: characters.reduce(
      (acc, id) => {
        acc[id] = { ...defaultRelationship };
        return acc;
      },
      {} as Record<CharacterId, RelationshipStats>,
    ),
    globals: { ...defaultGlobals },
    flags: [],
    memories: [],
    visitedNodes: [START_NODE_ID],
    seenHotspots: [],
    route: null,
    settings: { ...defaultSettings },
    lastSavedAt: Date.now(),
  };
}

export function getNode(id: string): StoryNode {
  const node = storyNodes[id];
  if (!node) {
    return storyNodes[START_NODE_ID];
  }
  return node;
}

export function getCurrentNode(state: GameState): StoryNode {
  return getNode(state.currentNodeId);
}

export function isDialogueComplete(state: GameState): boolean {
  return state.lineIndex >= getCurrentNode(state).lines.length - 1;
}

export function advanceLine(state: GameState): GameState {
  const node = getCurrentNode(state);
  if (state.lineIndex >= node.lines.length - 1) {
    return state;
  }
  return stamp({ ...state, lineIndex: state.lineIndex + 1 });
}

export function enterNode(state: GameState, nodeId: string): GameState {
  const nextId = storyNodes[nodeId] ? nodeId : START_NODE_ID;
  return stamp({
    ...state,
    currentNodeId: nextId,
    lineIndex: 0,
    visitedNodes: unique([...state.visitedNodes, nextId]),
  });
}

export function chooseChoice(state: GameState, choice: Choice): GameState {
  const withEffect = applyEffect(state, choice.effect);
  return enterNode(withEffect, choice.next);
}

export function revealHotspot(state: GameState, hotspotId: string, effect?: Effect): GameState {
  const key = `${state.currentNodeId}:${hotspotId}`;
  if (state.seenHotspots.includes(key)) {
    return state;
  }

  return stamp({
    ...applyEffect(state, effect),
    seenHotspots: unique([...state.seenHotspots, key]),
  });
}

export function applyEffect(state: GameState, effect?: Effect): GameState {
  if (!effect) {
    return state;
  }

  const relationships = structuredClone(state.relationships);
  if (effect.relationships) {
    for (const character of characters) {
      const changes = effect.relationships[character];
      if (!changes) {
        continue;
      }
      for (const metric of metrics) {
        const delta = changes[metric];
        if (typeof delta === "number") {
          relationships[character][metric] = clamp(relationships[character][metric] + delta);
        }
      }
    }
  }

  const globals = { ...state.globals };
  if (effect.globals) {
    for (const key of globalKeys) {
      const delta = effect.globals[key];
      if (typeof delta === "number") {
        globals[key] = clamp(globals[key] + delta);
      }
    }
  }

  return stamp({
    ...state,
    relationships,
    globals,
    flags: unique([...state.flags, ...(effect.flags ?? [])]),
    memories: unique([...state.memories, ...(effect.memories ?? [])]),
    route: effect.route === undefined ? state.route : effect.route,
  });
}

export function canShowChoice(state: GameState, choice: Choice): boolean {
  return conditionMatches(state, choice.condition);
}

export function getAvailableChoices(state: GameState): Choice[] {
  return getCurrentNode(state).choices.filter((choice) => canShowChoice(state, choice));
}

export function conditionMatches(state: GameState, condition?: Condition): boolean {
  if (!condition) {
    return true;
  }

  if (condition.route !== undefined && condition.route !== state.route) {
    return false;
  }

  if (condition.flags?.some((flag) => !state.flags.includes(flag))) {
    return false;
  }

  if (condition.missingFlags?.some((flag) => state.flags.includes(flag))) {
    return false;
  }

  if (
    condition.minRelationship?.some(
      ({ character, metric, value }) => state.relationships[character][metric] < value,
    )
  ) {
    return false;
  }

  if (condition.minGlobal?.some(({ key, value }) => state.globals[key] < value)) {
    return false;
  }

  if (condition.maxGlobal?.some(({ key, value }) => state.globals[key] > value)) {
    return false;
  }

  return true;
}

export function updateSettings(state: GameState, settings: Partial<GameSettings>): GameState {
  return stamp({
    ...state,
    settings: {
      ...state.settings,
      ...settings,
    },
  });
}

export function resetGame(settings?: GameSettings): GameState {
  return {
    ...createInitialState(),
    settings: settings ? { ...settings } : { ...defaultSettings },
    lastSavedAt: Date.now(),
  };
}

export function saveGame(state: GameState): void {
  localStorage.setItem(SAVE_KEY, JSON.stringify(stamp(state)));
}

export function loadGame(): GameState | null {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<GameState>;
    return normalizeLoadedState(parsed);
  } catch {
    return null;
  }
}

export function clearSave(): void {
  localStorage.removeItem(SAVE_KEY);
}

export function exportSave(state: GameState): string {
  return btoa(unescape(encodeURIComponent(JSON.stringify(stamp(state)))));
}

export function importSave(payload: string): GameState | null {
  try {
    const json = decodeURIComponent(escape(atob(payload.trim())));
    return normalizeLoadedState(JSON.parse(json) as Partial<GameState>);
  } catch {
    return null;
  }
}

export function routeLabel(route: RouteId): string {
  switch (route) {
    case "lin":
      return "林知夏";
    case "qi":
      return "祁蔓";
    case "su":
      return "苏晚晴";
    case "xia":
      return "夏若璃";
    case "cheng":
      return "程安雅";
    case "ruan":
      return "阮星遥";
    case "team":
      return "群像";
    case "solo":
      return "独立";
    default:
      return "未锁定";
  }
}

export function averageTrust(state: GameState): number {
  return Math.round(
    characters.reduce((total, id) => total + state.relationships[id].trust, 0) / characters.length,
  );
}

function normalizeLoadedState(parsed: Partial<GameState>): GameState {
  const base = createInitialState();
  const currentNodeId =
    typeof parsed.currentNodeId === "string" && storyNodes[parsed.currentNodeId]
      ? parsed.currentNodeId
      : base.currentNodeId;

  return {
    ...base,
    ...parsed,
    currentNodeId,
    lineIndex: clampIndex(Number(parsed.lineIndex ?? 0), getNode(currentNodeId).lines.length),
    relationships: normalizeRelationships(parsed.relationships),
    globals: normalizeGlobals(parsed.globals),
    flags: unique((parsed.flags ?? []).filter((flag): flag is string => typeof flag === "string")),
    memories: unique((parsed.memories ?? []).filter((memory): memory is string => typeof memory === "string")),
    visitedNodes: unique(
      (parsed.visitedNodes ?? [currentNodeId]).filter(
        (nodeId): nodeId is string => typeof nodeId === "string" && Boolean(storyNodes[nodeId]),
      ),
    ),
    seenHotspots: unique(
      (parsed.seenHotspots ?? []).filter((hotspot): hotspot is string => typeof hotspot === "string"),
    ),
    route: normalizeRoute(parsed.route),
    settings: { ...defaultSettings, ...(parsed.settings ?? {}) },
    lastSavedAt: Number(parsed.lastSavedAt ?? Date.now()),
  };
}

function normalizeRelationships(
  incoming?: Partial<Record<CharacterId, Partial<RelationshipStats>>>,
): Record<CharacterId, RelationshipStats> {
  return characters.reduce(
    (acc, id) => {
      acc[id] = {
        spark: clamp(Number(incoming?.[id]?.spark ?? defaultRelationship.spark)),
        trust: clamp(Number(incoming?.[id]?.trust ?? defaultRelationship.trust)),
        boundary: clamp(Number(incoming?.[id]?.boundary ?? defaultRelationship.boundary)),
      };
      return acc;
    },
    {} as Record<CharacterId, RelationshipStats>,
  );
}

function normalizeGlobals(incoming?: Partial<GlobalStats>): GlobalStats {
  return {
    career: clamp(Number(incoming?.career ?? defaultGlobals.career)),
    integrity: clamp(Number(incoming?.integrity ?? defaultGlobals.integrity)),
    stress: clamp(Number(incoming?.stress ?? defaultGlobals.stress)),
  };
}

function normalizeRoute(route: unknown): RouteId {
  if (route === null || route === "team" || route === "solo" || characters.includes(route as CharacterId)) {
    return route as RouteId;
  }
  return null;
}

function stamp(state: GameState): GameState {
  return {
    ...state,
    lastSavedAt: Date.now(),
  };
}

function clamp(value: number): number {
  if (Number.isNaN(value)) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.round(value)));
}

function clampIndex(value: number, length: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(Math.max(length - 1, 0), Math.round(value)));
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

