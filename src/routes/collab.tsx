import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";

const CollabScreen = lazy(() => import("@/components/screens/CollabScreen"));

export const Route = createFileRoute("/collab")({
  component: CollabScreen,
});
