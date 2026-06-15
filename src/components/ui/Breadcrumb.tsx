import { Link } from "@tanstack/react-router";
import { useLocation } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

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
  "/":            { group: "",     groupHref: "/",           page: "\u5DE5\u4F5C\u53F0" },
  "/pipeline":    { group: "",     groupHref: "/",           page: "\u5236\u4F5C\u7BA1\u7EBF" },
  "/story-overview": { group: "\u521B\u4F5C", groupHref: "/story-overview", page: "\u5267\u672C\u603B\u89C8" },
  "/parse":       { group: "\u521B\u4F5C", groupHref: "/parse",      page: "\u5267\u672C\u89E3\u6784" },
  "/script":      { group: "\u521B\u4F5C", groupHref: "/parse",      page: "\u5267\u672C\u7F16\u8F91" },
  "/interaction": { group: "\u8BBE\u8BA1", groupHref: "/interaction", page: "\u4E92\u52A8\u8BBE\u8BA1" },
  "/cinematic":   { group: "\u8BBE\u8BA1", groupHref: "/cinematic",  page: "\u6F14\u51FA\u8BBE\u8BA1" },
  "/nodes":       { group: "\u8BBE\u8BA1", groupHref: "/nodes",      page: "\u8282\u70B9\u56FE\u8C31" },
  "/my-works":   { group: "",     groupHref: "/",           page: "\u6211\u7684\u4F5C\u54C1" },
  "/assets":      { group: "",     groupHref: "/assets",     page: "\u8D44\u4EA7\u5E93" },
  "/simulator":   { group: "\u4EA4\u4ED8", groupHref: "/overview",   page: "\u6F14\u51FA\u9884\u89C8" },
  "/overview":    { group: "\u4EA4\u4ED8", groupHref: "/overview",   page: "\u8D28\u68C0\u603B\u89C8" },
  "/publish":     { group: "\u4EA4\u4ED8", groupHref: "/overview",   page: "\u53D1\u5E03" },
  "/collab":      { group: "",     groupHref: "/",           page: "\u534F\u4F5C" },
  "/version":     { group: "",     groupHref: "/",           page: "\u7248\u672C\u7BA1\u7406" },
  "/settings":    { group: "",     groupHref: "/settings",   page: "\u8BBE\u7F6E" },
  "/canvas":      { group: "\u8BBE\u8BA1", groupHref: "/nodes",      page: "\u753B\u5E03" },
  "/node-canvas": { group: "\u8BBE\u8BA1", groupHref: "/nodes",      page: "\u8282\u70B9\u753B\u5E03" },
  "/qte-editor":  { group: "\u8BBE\u8BA1", groupHref: "/nodes",      page: "QTE \u7F16\u8F91\u5668" },
  "/factory":     { group: "",     groupHref: "/",           page: "\u5DE5\u5382" },
  "/debugger":    { group: "\u8BBE\u8BA1", groupHref: "/nodes",      page: "\u8C03\u8BD5\u5668" },
  "/playt":       { group: "\u8BBE\u8BA1", groupHref: "/nodes",      page: "\u8BD5\u73A9" },
};

export function Breadcrumb() {
  const location = useLocation();
  const pathname = location.pathname;
  const info = ROUTE_MAP[pathname];

  if (!info) return null;

  const crumbs: Crumb[] = [];

  // For homepage, no group level needed
  if (pathname === "/") {
    return (
      <div className="flex items-center gap-1 text-[10px] px-4 pt-2 select-none">
        <span className="font-medium" style={{ color: S.text }}>{info.page}</span>
      </div>
    );
  }

  // Add group level for non-home pages
  if (info.group) {
    crumbs.push({ label: info.group, href: info.groupHref });
  }

  return (
    <div className="flex items-center gap-1 text-[10px] px-4 pt-2 select-none">
      {crumbs.map((c, i) => (
        <span key={c.href} className="flex items-center gap-1">
          <Link to={c.href} className="hover:underline" style={{ color: S.text3 }}>
            {c.label}
          </Link>
          <ChevronRight size={9} style={{ color: S.text3 }} />
        </span>
      ))}
      <span className="font-medium" style={{ color: S.text }}>{info.page}</span>
    </div>
  );
}
