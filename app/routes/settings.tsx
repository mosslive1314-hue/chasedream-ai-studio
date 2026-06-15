import { createFileRoute } from "@tanstack/react-router";
import SettingsScreen from "@/components/screens/SettingsScreen";

export const Route = createFileRoute("/settings")({
  component: SettingsScreen,
});
