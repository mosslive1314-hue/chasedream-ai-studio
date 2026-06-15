import { createFileRoute } from "@tanstack/react-router";
import OverviewScreen from "@/components/screens/OverviewScreen";

export const Route = createFileRoute("/overview")({
  component: OverviewScreen,
});
