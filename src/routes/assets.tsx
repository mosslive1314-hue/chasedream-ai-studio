import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";

const AssetsScreen = lazy(() => import("@/components/screens/AssetsScreen"));

export const Route = createFileRoute("/assets")({
  component: AssetsScreen,
});
