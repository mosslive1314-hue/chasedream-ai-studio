import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";

const InteractionScreen = lazy(() => import("@/components/screens/InteractionScreen"));

export const Route = createFileRoute("/interaction")({
  component: InteractionScreen,
});
