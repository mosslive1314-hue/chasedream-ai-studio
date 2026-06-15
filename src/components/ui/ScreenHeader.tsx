
import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

export interface StatBadge {
  label: string;
  value: string | number;
  accent?: boolean;
}

export interface NextStepLink {
  label: string;
  href: string;
  primary?: boolean;
}

/** 页面主题色 — 与各 screen-theme 保持一致的色值键 */
export interface ScreenHeaderTheme {
  card: string;
  s2: string;
  border: string;
  primary: string;
  text: string;
  text2: string;
  text3: string;
  error: string;
}

export interface ScreenHeaderProps {
  tag: string;
  title: string;
  subtitle?: string;
  stats?: StatBadge[];
  nextStep?: NextStepLink;
  theme?: ScreenHeaderTheme;
  children?: ReactNode;
}

export function ScreenHeader({ tag, title, subtitle, stats, nextStep, theme, children }: ScreenHeaderProps) {
  // 使用传入主题或全局 CSS 变量回退
  const t = theme ?? {
    card: "var(--surface, #fff)",
    s2: "var(--surface-2, #f4f6fc)",
    border: "var(--border, #e2e5f0)",
    primary: "var(--primary, #5e50e8)",
    text: "var(--text, #1a1d2e)",
    text2: "var(--text-2, #4a5068)",
    text3: "var(--text-3, #8892b0)",
    error: "var(--error, #dc2626)",
  };

  return (
    <header
      className="shrink-0 border-b px-4 py-3"
      style={{
        background: t.card,
        borderColor: t.border,
      }}
    >
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0">
          <div
            className="text-[10px] font-bold uppercase tracking-wide"
            style={{ color: t.text3 }}
          >
            {tag}
          </div>
          <h1
            className="truncate text-lg font-black"
            style={{ color: t.text }}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              className="truncate text-xs"
              style={{ color: t.text3 }}
            >
              {subtitle}
            </p>
          )}
        </div>

        {stats && stats.length > 0 && (
          <div className="ml-auto grid grid-cols-2 gap-1.5 md:grid-cols-5">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-lg px-2.5 py-1.5 text-center"
                style={{
                  background: t.s2,
                  border: `1px solid ${t.border}`,
                }}
              >
                <div
                  className="text-sm font-bold"
                  style={{
                    color: stat.accent ? t.error : t.text,
                  }}
                >
                  {stat.value}
                </div>
                <div
                  className="text-[9px]"
                  style={{ color: t.text3 }}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        )}

        {nextStep && (
          <Link
            to={nextStep.href}
            className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-colors hover:opacity-90"
            style={{
              background: nextStep.primary ? t.primary : t.s2,
              color: nextStep.primary ? "#fff" : t.text2,
              border: nextStep.primary ? "none" : `1px solid ${t.border}`,
            }}
          >
            {nextStep.label}
            <ArrowRight size={12} />
          </Link>
        )}

        {children}
      </div>
    </header>
  );
}
