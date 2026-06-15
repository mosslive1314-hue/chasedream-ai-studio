import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";

const StoryOverviewScreen = lazy(() => import("@/components/screens/StoryOverviewScreen"));

export const Route = createFileRoute("/story-overview")({
  component: StoryOverviewScreen,
});
