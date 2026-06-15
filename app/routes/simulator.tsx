import { createFileRoute } from "@tanstack/react-router";
import SimulatorScreen from "@/components/screens/SimulatorScreen";

export const Route = createFileRoute("/simulator")({
  component: SimulatorScreen,
});
