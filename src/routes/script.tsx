import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";

const ScriptScreen = lazy(() => import("@/components/screens/ScriptScreen"));

export const Route = createFileRoute("/script")({
  component: ScriptScreen,
});
