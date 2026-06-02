import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import { EazoProvider } from "@eazo/sdk/react";
import { cn } from "@/utils/utils";
import { Toaster } from "@/components/ui/sonner";
import { UserSyncEffect } from "@/components/user-profile/user-sync-effect";
import { BottomNav, SideNav } from "@/components/layout/nav";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const SITE_URL = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : undefined;

const SITE_TITLE = "逐梦 Creator Studio";
const SITE_DESCRIPTION = "AI 互动影游开发工作台 — 将剧本转化为可玩互动叙事结构";

export const metadata: Metadata = {
  ...(SITE_URL ? { metadataBase: new URL(SITE_URL) } : {}),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  icons: { icon: "https://eazo.ai/favicon.ico" },
  openGraph: {
    type: "website",
    siteName: "逐梦 Creator Studio",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: "/",
    locale: "zh_CN",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" className={cn("h-full antialiased", inter.variable)}>
      <body className="min-h-svh flex flex-col" style={{ background: "var(--app-bg)" }}>
        <EazoProvider>
          <UserSyncEffect />
          {/* Desktop sidebar — hidden on mobile */}
          <SideNav />
          {/* Main content — offset on desktop for sidebar */}
          <main className="flex-1 flex flex-col md:ml-[200px] pb-16 md:pb-0" style={{ transition:"margin-left 220ms ease" }}>
            {children}
          </main>
          {/* Mobile bottom nav — hidden on desktop */}
          <BottomNav />
          <Toaster />
        </EazoProvider>
      </body>
    </html>
  );
}
