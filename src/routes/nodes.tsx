import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";

const NodesScreen = lazy(() => import("@/components/screens/NodesScreen"));

export const Route = createFileRoute("/nodes")({
  component: NodesScreen,
});
