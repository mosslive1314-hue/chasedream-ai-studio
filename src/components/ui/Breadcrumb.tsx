"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Ghost } from "lucide-react";

const S = {
  primary: "#5E50E8",
  text: "#1A1D2E",
  text3: "#8892B0",
};

interface Crumb {
  label: string;
  href: string;
}

// Route → group + page mapping
const ROUTE_MAP: Record<string, { group: string; groupHref: string; page: string }> = {
  "/":            { group: "内容", groupHref: "/",           page: "工作台" },
  "/pipeline":    { group: "内容", groupHref: "/",           page: "制作管线" },
  "/parse":       { group: "创作", groupHref: "/parse",     page: "剧本解构" },
  "/script":      { group: "创作", groupHref: "/script",    page: "剧本编辑" },
  "/interaction": { group: "创作", groupHref: "/interaction", page: "互动设计" },
  "/nodes":       { group: "设计", groupHref: "/nodes",     page: "节点图谱" },
  "/assets":      { group: "设计", groupHref: "/assets",    page: "资产库" },
  "/simulator":   { group: "设计", groupHref: "/simulator", page: "演出预览" },
  "/cinematic":   { group: "设计", groupHref: "/cinematic", page: "演出设计" },
  "/overview":    { group: "交付", groupHref: "/overview",  page: "质检总览" },
  "/publish":     { group: "交付", groupHref: "/publish",   page: "发布" },
  "/collab":      { group: "交付", groupHref: "/publish",   page: "协作" },
  "/settings":    { group: "系统", groupHref: "/settings",  page: "设置" },
  "/canvas":      { group: "设计", groupHref: "/nodes",     page: "画布" },
  "/node-canvas": { group: "设计", groupHref: "/nodes",     page: "节点画布" },
  "/qte-editor":  { group: "设计", groupHref: "/cinematic", page: "QTE 编辑器" },
  "/factory":     { group: "内容", groupHref: "/",           page: "工厂" },
  "/debugger":    { group: "设计", groupHref: "/simulator", page: "调试器" },
  "/playt":       { group: "设计", groupHref: "/simulator", page: "试玩" },
};

export function Breadcrumb() {
  const pathname = usePathname();
  const info = ROUTE_MAP[pathname];

  if (!info) return null;

  const crumbs: Crumb[] = [
    { label: "幽灵协议", href: "/" },
  ];

  // Only add group level if it's different from the current page
  if (info.groupHref !== pathname) {
    crumbs.push({ label: info.group, href: info.groupHref });
  }

  return (
    <div className="flex items-center gap-1 text-[10px] px-4 pt-2 select-none">
      <Ghost size={11} style={{ color: S.primary }} />
      {crumbs.map((c, i) => (
        <span key={c.href} className="flex items-center gap-1">
          <ChevronRight size={9} style={{ color: S.text3 }} />
          <Link href={c.href} className="hover:underline" style={{ color: S.text3 }}>
            {c.label}
          </Link>
        </span>
      ))}
      <ChevronRight size={9} style={{ color: S.text3 }} />
      <span className="font-medium" style={{ color: S.text }}>{info.page}</span>
    </div>
  );
}
