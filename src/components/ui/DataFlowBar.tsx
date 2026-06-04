"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Sparkles, CheckCircle2, AlertCircle, ChevronDown, X } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  type BridgeSource,
  type BridgeTransfer,
  consumeTransfers,
  getPendingCount,
  getFlowConfig,
  getTargetRoute,
} from "@/lib/data-flow-bridge";
import { useUIStore } from "@/store";

const S = {
  card: "#FFFFFF", s2: "#F4F6FC",
  border: "#E8EAF2", border2: "#D0D5E4",
  primary: "#7C6CF5", accent: "#00A99D",
  text: "#1A1D2E", text2: "#4A5068", text3: "#8892B0",
  success: "#10B981", warning: "#F59E0B", error: "#EF4444",
};

interface DataFlowBarProps {
  /** 当前页面标识 */
  page: BridgeSource;
  /** 推送到下一页的处理函数 */
  onPushForward?: () => void;
  /** 接收上一页数据的处理函数 */
  onReceiveIncoming?: (transfers: BridgeTransfer[]) => void;
}

const PAGE_LABELS: Record<BridgeSource, string> = {
  parse: "剧本解构",
  script: "剧本编辑",
  interaction: "互动设计",
  assets: "资产页",
  cinematic: "演出设计",
  overview: "质检总览",
};

/**
 * 数据流桥接条
 * 显示当前页面在创作管线中的数据流入/流出状态
 */
export function DataFlowBar({ page, onPushForward, onReceiveIncoming }: DataFlowBarProps) {
  const router = useRouter();
  const addToast = useUIStore(s => s.addToast);
  const [incomingCount, setIncomingCount] = useState(0);
  const [showIncoming, setShowIncoming] = useState(false);
  const [incomingTransfers, setIncomingTransfers] = useState<BridgeTransfer[]>([]);
  const { incoming, outgoing } = getFlowConfig(page);

  // 检查待消费传输
  useEffect(() => {
    const count = getPendingCount(page);
    setIncomingCount(count);
    if (count > 0) {
      setShowIncoming(true);
    }
  }, [page]);

  // 消费传入数据
  const handleConsume = useCallback(() => {
    const transfers = consumeTransfers(page);
    setIncomingTransfers(transfers);
    setIncomingCount(0);
    if (onReceiveIncoming) {
      onReceiveIncoming(transfers);
    }
    addToast({
      type: "success",
      title: "数据已接收",
      message: `从${incoming ? PAGE_LABELS[incoming.from] : "上一页"}接收到 ${transfers.length} 项数据`,
    });
  }, [page, incoming, onReceiveIncoming, addToast]);

  // 向前推送
  const handlePushForward = useCallback(() => {
    if (onPushForward) {
      onPushForward();
    }
    if (outgoing) {
      addToast({
        type: "info",
        title: "数据已推送",
        message: `${outgoing.label} — 前往${PAGE_LABELS[outgoing.to]}查看`,
        link: { href: getTargetRoute(outgoing.to), label: `前往${PAGE_LABELS[outgoing.to]}` },
      });
    }
  }, [onPushForward, outgoing, addToast]);

  // 导航到目标页
  const handleNavigate = useCallback((target: BridgeSource) => {
    router.push(getTargetRoute(target));
  }, [router]);

  if (!incoming && !outgoing) return null;

  return (
    <div className="space-y-1.5">
      {/* 主流水线状态条 */}
      <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl"
        style={{ background: S.s2, border: `1px solid ${S.border}` }}>
        {/* 流入 */}
        {incoming && (
          <>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={incomingCount > 0 ? handleConsume : () => handleNavigate(incoming.from)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-bold focus:outline-none"
              style={{
                background: incomingCount > 0 ? `${S.accent}15` : "transparent",
                color: incomingCount > 0 ? S.accent : S.text3,
                border: `1px solid ${incomingCount > 0 ? `${S.accent}30` : S.border}`,
              }}>
              <ArrowLeft size={9} />
              <span>{PAGE_LABELS[incoming.from]}</span>
              {incomingCount > 0 && (
                <span className="ml-0.5 px-1 py-0 rounded-full text-[7px] text-white font-bold"
                  style={{ background: S.accent }}>
                  {incomingCount}
                </span>
              )}
            </motion.button>
            <ArrowRight size={9} style={{ color: S.text3 }} />
          </>
        )}

        {/* 当前页 */}
        <div className="flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-bold"
          style={{ background: `${S.primary}10`, color: S.primary }}>
          {PAGE_LABELS[page]}
        </div>

        {/* 流出 */}
        {outgoing && (
          <>
            <ArrowRight size={9} style={{ color: S.text3 }} />
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handlePushForward}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-bold focus:outline-none"
              style={{
                background: `${S.primary}08`,
                color: S.primary,
                border: `1px solid ${S.primary}25`,
              }}>
              <span>{PAGE_LABELS[outgoing.to]}</span>
              <ArrowRight size={9} />
            </motion.button>
          </>
        )}
      </div>

      {/* 流入数据面板 */}
      <AnimatePresence>
        {showIncoming && incomingCount > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden">
            <div className="px-3 py-2 rounded-xl space-y-1.5"
              style={{ background: `${S.accent}06`, border: `1px solid ${S.accent}20` }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Sparkles size={10} style={{ color: S.accent }} />
                  <span className="text-[9px] font-bold" style={{ color: S.accent }}>
                    来自{incoming ? PAGE_LABELS[incoming.from] : "上一页"}的数据
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <motion.button whileTap={{ scale: 0.95 }}
                    onClick={handleConsume}
                    className="px-2 py-0.5 rounded-md text-[8px] font-bold text-white focus:outline-none"
                    style={{ background: S.accent }}>
                    接收并应用
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.95 }}
                    onClick={() => setShowIncoming(false)}
                    className="p-0.5 rounded focus:outline-none"
                    style={{ color: S.text3 }}>
                    <X size={10} />
                  </motion.button>
                </div>
              </div>
              <p className="text-[8px]" style={{ color: S.text3 }}>
                {incoming?.label} — 点击下方按钮将数据导入当前页面
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 已接收数据反馈 */}
      <AnimatePresence>
        {incomingTransfers.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden">
            <div className="px-3 py-2 rounded-xl space-y-1"
              style={{ background: `${S.success}06`, border: `1px solid ${S.success}20` }}>
              {incomingTransfers.map(t => (
                <div key={t.id} className="flex items-center gap-1.5">
                  <CheckCircle2 size={9} style={{ color: S.success }} />
                  <span className="text-[8px] font-medium" style={{ color: S.text2 }}>
                    {t.label}
                  </span>
                  <span className="text-[7px]" style={{ color: S.text3 }}>
                    {new Date(t.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              ))}
              <motion.button whileTap={{ scale: 0.95 }}
                onClick={() => setIncomingTransfers([])}
                className="text-[8px] font-bold focus:outline-none"
                style={{ color: S.success }}>
                关闭
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
