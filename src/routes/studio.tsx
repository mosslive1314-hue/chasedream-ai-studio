import { createFileRoute, Outlet } from "@tanstack/react-router";

// StudioLayout 在 __root.tsx 中根据路径直接渲染，
// 此路由仅作为路径占位，渲染空 Outlet
export const Route = createFileRoute("/studio")({
  component: () => <Outlet />,
});
