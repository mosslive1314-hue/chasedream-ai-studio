// 左侧项目结构树
import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, ChevronRight, User, MapPin, Package, GitBranch } from "lucide-react";

interface TreeSectionProps {
  label: string;
  icon: React.ReactNode;
  items: string[];
  defaultOpen?: boolean;
}

function TreeSection({ label, icon, items, defaultOpen = true }: TreeSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mb-1">
      <button
        className="w-full flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider focus:outline-none"
        style={{ color: "var(--app-text-muted)" }}
        onClick={() => setOpen(!open)}
      >
        {open ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
        <span className="flex items-center gap-1">{icon} {label}</span>
        <span className="ml-auto text-[9px] font-normal">{items.length}</span>
      </button>
      {open && (
        <div className="pl-6 space-y-0.5">
          {items.map((item) => (
            <motion.button
              key={item}
              whileTap={{ scale: 0.97 }}
              className="w-full text-left px-2 py-1 rounded text-[10px] truncate focus:outline-none transition-colors hover:text-[color:var(--app-text)]"
              style={{ color: "var(--app-text-secondary)" }}
            >
              {item}
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}

interface Props {
  onNodeSelect?: (id: string) => void;
}

export function ProjectTree({ onNodeSelect }: Props) {
  const nodes = [
    "N01 序章·霓虹夜幕", "N02 任务简报", "N03 进入路线？",
    "N04 暗夜通道", "N05 换装渗透", "N06 警卫逼近",
    "N07 潜行判定", "N08 数据到手", "N09 身份暴露",
    "N10 幽灵归来", "N11 今夜失败",
  ];

  return (
    <div className="flex flex-col h-full overflow-y-auto py-2" style={{ scrollbarWidth: "none" }}>
      {/* Chapter header */}
      <div className="px-3 py-2 mb-1">
        <div className="flex items-center gap-1.5">
          <GitBranch size={12} style={{ color: "var(--app-primary)" }} />
          <span className="text-[11px] font-bold" style={{ color: "var(--app-text)" }}>第一章 渗透行动</span>
        </div>
      </div>

      {/* Nodes */}
      <TreeSection
        label="剧情节点"
        icon={<GitBranch size={9} />}
        items={nodes}
        defaultOpen={true}
      />
      <TreeSection
        label="角色"
        icon={<User size={9} />}
        items={["艾拉（主角）", "线人", "反派主管"]}
        defaultOpen={false}
      />
      <TreeSection
        label="场景"
        icon={<MapPin size={9} />}
        items={["霓虹街道", "地下酒吧", "暗夜通道", "换装室", "警卫室", "数据机房"]}
        defaultOpen={false}
      />
      <TreeSection
        label="道具"
        icon={<Package size={9} />}
        items={["追踪芯片", "变声器", "黑市通行证", "数据手套", "隐形药剂", "假身份证", "爆破装置", "夜视镜", "无线耳机"]}
        defaultOpen={false}
      />
    </div>
  );
}
