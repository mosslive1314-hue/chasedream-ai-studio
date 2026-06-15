import { createFileRoute } from "@tanstack/react-router";
import PublishScreen from "@/components/screens/PublishScreen";

export const Route = createFileRoute("/publish")({
  component: PublishScreen,
});
