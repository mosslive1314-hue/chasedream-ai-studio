import type { CharacterId, CharacterProfile } from "../types";

export const characterProfiles: Record<CharacterId, CharacterProfile> = {
  lin: {
    id: "lin",
    name: "林知夏",
    shortName: "知夏",
    role: "品牌策略顾问",
    theme: "信任与野心",
    color: "#9dd5c0",
    accent: "#264d3f",
  },
  qi: {
    id: "qi",
    name: "祁蔓",
    shortName: "祁蔓",
    role: "舞蹈教练",
    theme: "热烈与自我证明",
    color: "#ffb46b",
    accent: "#5c2d15",
  },
  su: {
    id: "su",
    name: "苏晚晴",
    shortName: "晚晴",
    role: "咖啡店主",
    theme: "疗愈与坦诚",
    color: "#f2d7a6",
    accent: "#4b3924",
  },
  xia: {
    id: "xia",
    name: "夏若璃",
    shortName: "若璃",
    role: "独立游戏主播",
    theme: "陪伴与勇气",
    color: "#83c7ff",
    accent: "#17395a",
  },
  cheng: {
    id: "cheng",
    name: "程安雅",
    shortName: "安雅",
    role: "律师",
    theme: "边界与责任",
    color: "#f08a8a",
    accent: "#5c1f2a",
  },
  ruan: {
    id: "ruan",
    name: "阮星遥",
    shortName: "星遥",
    role: "天文馆策展人",
    theme: "理想与现实",
    color: "#b9a9ff",
    accent: "#31295d",
  },
};

export const characterOrder: CharacterId[] = ["lin", "qi", "su", "xia", "cheng", "ruan"];

