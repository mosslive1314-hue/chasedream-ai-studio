import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";

const PipelineScreen = lazy(() => import("@/components/screens/PipelineScreen"));

export const Route = createFileRoute("/pipeline")({
  component: PipelineScreen,
});
