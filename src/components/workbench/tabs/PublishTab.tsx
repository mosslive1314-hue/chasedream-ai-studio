"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, AlertTriangle, Copy, ExternalLink } from "lucide-react";

const S = {
  bg:"#FAFBFF", card:"#FFFFFF", s2:"#F4F6FC", border:"#E2E5F0",
  primary:"#5E50E8", accent:"#00A99D",
  text:"#1A1D2E", text2:"#4A5068", text3:"#8892B0",
  success:"#059669", warning:"#D97706", error:"#DC2626",
};

const CHECKS = [
  { label:"入口节点存在",          ok:true  },
  { label:"至少一个成功结局",       ok:true  },
  { label:"至少一个失败结局",       ok:true  },
  { label:"所有发布路径可达",       ok:true  },
  { label:"9 个节点缺少 BGM",      ok:false },
  { label:"1 个场景缺少图片",      ok:false },
  { label:"逻辑检查通过",          ok:true  },
  { label:"试玩路径已验证",        ok:true  },
];

export default function PublishTab() {
  const [copied, setCopied] = useState(false);
  const h5url = "https://play.zhuomeng.ai/ghost-protocol-v1";

  const copy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const passCount = CHECKS.filter(c => c.ok).length;

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4" style={{ background:S.bg }}>
      {/* 发布状态 */}
      <div className="p-4 rounded-xl" style={{ background:S.card, border:`1px solid ${S.border}` }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold" style={{ color:S.text }}>发布状态</h3>
          <span className="text-[9px] font-bold px-2 py-0.5 rounded"
            style={{ background:`${S.success}12`, color:S.success }}>已发布</span>
        </div>
        <div className="flex items-center gap-2 p-2.5 rounded-lg" style={{ background:S.s2 }}>
          <ExternalLink size={12} style={{ color:S.accent }} />
          <span className="text-[10px] font-mono flex-1 truncate" style={{ color:S.text2 }}>{h5url}</span>
          <motion.button whileTap={{ scale:0.9 }} onClick={copy}
            className="text-[9px] font-bold px-2 py-1 rounded focus:outline-none"
            style={{ background: copied ? `${S.success}15` : `${S.primary}12`, color: copied ? S.success : S.primary }}>
            {copied ? "已复制" : <><Copy size={9} className="inline mr-0.5" />复制</>}
          </motion.button>
        </div>
      </div>

      {/* 发布检查 */}
      <div className="p-4 rounded-xl" style={{ background:S.card, border:`1px solid ${S.border}` }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold" style={{ color:S.text }}>发布检查</h3>
          <span className="text-[9px]" style={{ color:S.text3 }}>{passCount}/{CHECKS.length} 项通过</span>
        </div>
        <div className="space-y-1.5">
          {CHECKS.map((c,i) => (
            <div key={i} className="flex items-center gap-2">
              {c.ok
                ? <CheckCircle2 size={13} color={S.success} className="shrink-0" />
                : <AlertTriangle size={13} color={S.warning} className="shrink-0" />}
              <span className="text-[10px]" style={{ color: c.ok ? S.text2 : S.warning }}>{c.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 发布设置 */}
      <div className="p-4 rounded-xl" style={{ background:S.card, border:`1px solid ${S.border}` }}>
        <h3 className="text-xs font-bold mb-3" style={{ color:S.text }}>发布设置</h3>
        <div className="space-y-2">
          {[
            ["作品类型",   "互动 H5"],
            ["画幅",      "移动端竖屏 9:16"],
            ["分享标题",   "幽灵协议"],
            ["付费模式",   "免费试玩"],
          ].map(([k,v]) => (
            <div key={k} className="flex justify-between items-center py-1"
              style={{ borderBottom:`1px solid ${S.border}` }}>
              <span className="text-[10px]" style={{ color:S.text3 }}>{k}</span>
              <span className="text-[10px] font-medium" style={{ color:S.text }}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="grid grid-cols-2 gap-2">
        <motion.button whileTap={{ scale:0.97 }}
          className="py-2.5 rounded-xl text-xs font-bold text-white focus:outline-none"
          style={{ background:`linear-gradient(135deg,${S.primary},#7B6EF5)` }}>
          🚀 更新发布
        </motion.button>
        <motion.button whileTap={{ scale:0.97 }}
          className="py-2.5 rounded-xl text-xs font-bold focus:outline-none"
          style={{ background:S.s2, border:`1px solid ${S.border}`, color:S.text2 }}>
          📦 导出 JSON
        </motion.button>
        <motion.button whileTap={{ scale:0.97 }}
          className="py-2.5 rounded-xl text-xs font-bold focus:outline-none"
          style={{ background:S.s2, border:`1px solid ${S.border}`, color:S.text2 }}>
          📋 生成素材清单
        </motion.button>
        <motion.button whileTap={{ scale:0.97 }}
          className="py-2.5 rounded-xl text-xs font-bold focus:outline-none"
          style={{ background:S.s2, border:`1px solid ${S.border}`, color:S.text2 }}>
          🔗 复制分享链接
        </motion.button>
      </div>
    </div>
  );
}
