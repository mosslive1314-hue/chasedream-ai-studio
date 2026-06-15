# Project Memory — ChaseDream Creator Studio

## Tech Stack (Current — migration/tanstack branch)
- **Framework**: TanStack Start 1.168.x (Vite 8 + Nitro 3)
- **Router**: TanStack Router (file-based, src/routes/)
- **State**: Zustand 5 + IndexedDB persistence (via idb-keyval)
- **UI**: TailwindCSS 4 + Shadcn UI + Framer Motion
- **Auth**: @eazo/sdk (EazoProvider + requireAuth)
- **Build**: Vite 8 + Nitro 3 (NOT vinxi)
- **SSR**: Disabled (defaultSsr: false) — app is 100% client-rendered
- **Server Functions**: createServerFn (no `request` in handler ctx — use middleware for headers)

## Key Architecture Decisions
- **No SSR**: 71% client components, zero SSR/SSG benefit → disabled via `router.update({ defaultSsr: false })`
- **ClientOnly wrapper**: Root layout uses `<ClientOnly>` to gate all browser-only components
- **Lazy routes**: All route files use `React.lazy()` for screen components
- **Auth fallback**: Dev mode (no EAZO_PRIVATE_KEY) returns mock user via local requireAuth stub
- **MCP API**: Removed (createAPIFileRoute no longer exported in TanStack Start 1.168.x)
- **Yjs over loro**: TipTap integration is decisive — PRD deviation accepted
- **AG-UI + A2UI**: Both stacked — AG-UI transport, A2UI content description

## Migration Status (Next.js → TanStack Start)
- ✅ Package replacement complete (react-start@1.168.25, react-router@1.170.15)
- ✅ 23 route files migrated (file-based routing)
- ✅ All Next.js imports replaced (next/navigation → @tanstack/react-router, etc.)
- ✅ "use client" directives removed (37 files)
- ✅ SSR disabled + ClientOnly wrapper → all 16 routes return HTTP 200
- ✅ TypeScript: 0 errors (excluding legacy app/ and _archived/ dirs)
- ✅ Server Functions updated (no `request` in handler context)
- ✅ Link href→to migration complete
- ✅ Auth module: dev-mode fallback when no EAZO_PRIVATE_KEY

## File Paths
- Routes: `src/routes/*.tsx` (file-based, auto-registered in routeTree.gen.ts)
- Screens: `src/components/screens/*Screen.tsx` (lazy-loaded)
- Stores: `src/store/*.ts` (Zustand with persist + idbStorage)
- Server functions: `src/server/functions/*.ts`
- Root layout: `src/routes/__root.tsx` (ClientOnly wrapping all interactive content)
- ClientOnly component: `src/components/lib/ClientOnly.tsx`
- Router config: `src/router.tsx` (defaultSsr: false via router.update)
- Vite config: `vite.config.ts` (tanstackStart + viteReact + tailwindcss + nitro)
- tsconfig: excludes `app/` and `tsr.config.ts` (legacy Next.js files)
