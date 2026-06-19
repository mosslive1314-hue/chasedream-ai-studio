"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";

// 旧 Screen 组件（管理功能复用其完整逻辑，数据走同一套 store）
import CollabScreen from "@/components/screens/CollabScreen";
import MyWorksScreen from "@/components/screens/MyWorksScreen";
import VersionScreen from "@/components/screens/VersionScreen";

export type ManageModalType = "collab" | "my-works" | "versions" | null;

interface ManageModalProps {
  type: ManageModalType;
  onClose: () => void;
}

const MODAL_CONFIG: Record<Exclude<ManageModalType, null>, { title: string; component: ReactNode }> = {
  collab: { title: "协作管理", component: <CollabScreen /> },
  "my-works": { title: "我的作品", component: <MyWorksScreen /> },
  versions: { title: "版本管理", component: <VersionScreen /> },
};

/**
 * 管理入口模态 — 统一承载协作/作品/版本三个管理功能。
 * 从工具栏图标触发，全屏模态覆盖，暗色主题。
 */
export function ManageModal({ type, onClose }: ManageModalProps) {
  if (!type) return null;
  const config = MODAL_CONFIG[type];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="flex h-[80vh] w-[80vw] flex-col overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-3">
          <h2 className="text-sm font-medium text-zinc-100">{config.title}</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 transition hover:text-zinc-200"
            title="关闭"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-auto bg-zinc-950 text-zinc-200 studio-dark-embed">
          {config.component}
        </div>
      </div>
    </div>
  );
}
