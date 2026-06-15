import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";

const SimulatorScreen = lazy(() => import("@/components/screens/SimulatorScreen"));

export const Route = createFileRoute("/simulator")({
  component: SimulatorScreen,
});
