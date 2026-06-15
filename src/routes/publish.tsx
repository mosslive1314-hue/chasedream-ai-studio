import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";

const PublishScreen = lazy(() => import("@/components/screens/PublishScreen"));

export const Route = createFileRoute("/publish")({
  component: PublishScreen,
});
