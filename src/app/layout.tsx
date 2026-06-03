import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import { EazoProvider } from "@eazo/sdk/react";
import { cn } from "@/utils/utils";
import { Toaster } from "@/components/ui/sonner";
import { UserSyncEffect } from "@/components/user-profile/user-sync-effect";
import { SideNav } from "@/components/layout/nav";
import { WorkbenchHeader } from "@/components/layout/WorkbenchHeader";
import { EmbeddedAdapter } from "@/components/layout/EmbeddedAdapter";
import { ToastContainer } from "@/components/ui/ToastContainer";
import { OnboardingGate } from "@/components/ui/OnboardingGate";
import { UndoRedoListener } from "@/components/ui/UndoRedoListener";
import { CommandPalette } from "@/components/ui/CommandPalette";
import { SaveIndicator } from "@/components/ui/SaveIndicator";
import { Breadcrumb } from "@/components/ui/Breadcrumb";

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
          {/* P13: Undo/Redo keyboard listener + auto-save tracking */}
          <UndoRedoListener />
          {/* P13: Cmd+K command palette */}
          <CommandPalette />
          {/* Desktop sidebar — hidden on mobile */}
          <SideNav />
          {/* Main content — offset on desktop for sidebar */}
          <main className="flex-1 flex flex-col md:ml-[200px]" style={{ transition:"margin-left 220ms ease" }}>
            {/* Global workstation header — hidden when embedded in Eazo platform */}
            <EmbeddedAdapter header={<WorkbenchHeader />}>
            {/* P13: Top bar with breadcrumb + save indicator */}
            <div className="flex items-center justify-between">
              <Breadcrumb />
              <div className="px-4 py-2">
                <SaveIndicator />
              </div>
            </div>
            {children}
            </EmbeddedAdapter>
          </main>
          <Toaster />
          <ToastContainer />
          <OnboardingGate />
        </EazoProvider>
      </body>
    </html>
  );
}
