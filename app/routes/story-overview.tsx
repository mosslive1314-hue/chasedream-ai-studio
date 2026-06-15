import { createFileRoute } from "@tanstack/react-router";
import StoryOverviewScreen from "@/components/screens/StoryOverviewScreen";

export const Route = createFileRoute("/story-overview")({
  component: StoryOverviewScreen,
});
