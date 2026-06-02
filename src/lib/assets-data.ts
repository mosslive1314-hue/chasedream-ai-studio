export type AssetType = "scene" | "character" | "prop" | "bgm" | "voice" | "video";

export interface AssetNode {
  nodeId: string;
  nodeLabel: string;
  type: AssetType;
  hasImage: boolean;
  hasBgm: boolean;
  hasVoice: boolean;
  hasVideo: boolean;
  imageUrl?: string;
  missing: number; // count of missing assets
}

export interface Character {
  id: string;
  name: string;
  role: string;
  refNodes: number;
  states: { label: string; done: boolean }[];
  promptHint: string;
}

export const ASSET_NODES: AssetNode[] = [
  { nodeId:"N01", nodeLabel:"序章·霓虹夜幕", type:"scene", hasImage:true,  hasBgm:false, hasVoice:false, hasVideo:false, missing:3, imageUrl:"https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=300&q=60" },
  { nodeId:"N02", nodeLabel:"任务简报",       type:"scene", hasImage:true,  hasBgm:false, hasVoice:false, hasVideo:false, missing:3, imageUrl:"https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=300&q=60" },
  { nodeId:"N03", nodeLabel:"进入路线？",     type:"scene", hasImage:true,  hasBgm:false, hasVoice:false, hasVideo:false, missing:3, imageUrl:"https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=300&q=60" },
  { nodeId:"N04", nodeLabel:"暗夜通道",       type:"scene", hasImage:true,  hasBgm:false, hasVoice:false, hasVideo:false, missing:3, imageUrl:"https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=300&q=60" },
  { nodeId:"N05", nodeLabel:"换装渗透",       type:"scene", hasImage:true,  hasBgm:false, hasVoice:false, hasVideo:false, missing:3, imageUrl:"https://images.unsplash.com/photo-1520295187453-cd239786490c?auto=format&fit=crop&w=300&q=60" },
  { nodeId:"N06", nodeLabel:"警卫逼近",       type:"scene", hasImage:false, hasBgm:false, hasVoice:false, hasVideo:false, missing:4 },
  { nodeId:"N07", nodeLabel:"潜行判定",       type:"scene", hasImage:true,  hasBgm:false, hasVoice:false, hasVideo:false, missing:3, imageUrl:"https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=300&q=60" },
  { nodeId:"N08", nodeLabel:"数据到手",       type:"scene", hasImage:true,  hasBgm:false, hasVoice:false, hasVideo:false, missing:3, imageUrl:"https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?auto=format&fit=crop&w=300&q=60" },
  { nodeId:"N09", nodeLabel:"身份暴露",       type:"scene", hasImage:false, hasBgm:false, hasVoice:false, hasVideo:false, missing:4 },
];

export const CHARACTERS: Character[] = [
  {
    id:"c1", name:"艾拉", role:"女主角 · 主角", refNodes:9,
    states:[
      { label:"默认", done:true },
      { label:"愤怒", done:true },
      { label:"受伤", done:false },
      { label:"沉默", done:false },
    ],
    promptHint:"黑色短发，银色义眼，黑色风衣，赛博朋克都市，4K...",
  },
  {
    id:"c2", name:"线人", role:"神秘男 · 支线", refNodes:4,
    states:[
      { label:"默认", done:true },
      { label:"紧张", done:false },
      { label:"受伤", done:false },
      { label:"死亡", done:false },
    ],
    promptHint:"中年男性，破旧夹克，背光站立，霓虹反射...",
  },
  {
    id:"c3", name:"反派主管", role:"反派 · 阴谋核心", refNodes:3,
    states:[
      { label:"默认", done:false },
      { label:"愤怒", done:false },
    ],
    promptHint:"西装革履，冷峻表情，企业高层，摩天楼背景...",
  },
];

export const ASSET_TABS = [
  { id:"scene",     label:"场景背景", count:"8/9",  warn:false },
  { id:"character", label:"角色立绘", count:"6/12", warn:true },
  { id:"bgm",       label:"BGM",     count:"0/9",  warn:true },
  { id:"voice",     label:"配音",    count:"0/9",  warn:true },
  { id:"video",     label:"视频",    count:"1/9",  warn:true },
  { id:"ui",        label:"UI素材",  count:"--",   warn:false },
] as const;
