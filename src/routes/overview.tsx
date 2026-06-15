import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";

const OverviewScreen = lazy(() => import("@/components/screens/OverviewScreen"));

export const Route = createFileRoute("/overview")({
  component: OverviewScreen,
});
