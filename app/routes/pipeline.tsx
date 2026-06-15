import { createFileRoute } from "@tanstack/react-router";
import PipelineScreen from "@/components/screens/PipelineScreen";

export const Route = createFileRoute("/pipeline")({
  component: PipelineScreen,
});
