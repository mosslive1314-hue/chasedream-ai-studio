import { createFileRoute } from "@tanstack/react-router";
import InteractionScreen from "@/components/screens/InteractionScreen";

export const Route = createFileRoute("/interaction")({
  component: InteractionScreen,
});
