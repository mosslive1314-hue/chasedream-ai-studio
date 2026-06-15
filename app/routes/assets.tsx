import { createFileRoute } from "@tanstack/react-router";
import AssetsScreen from "@/components/screens/AssetsScreen";

export const Route = createFileRoute("/assets")({
  component: AssetsScreen,
});
