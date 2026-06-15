import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";

const SettingsScreen = lazy(() => import("@/components/screens/SettingsScreen"));

export const Route = createFileRoute("/settings")({
  component: SettingsScreen,
});
