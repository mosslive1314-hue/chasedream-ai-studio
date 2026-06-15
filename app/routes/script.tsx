import { createFileRoute } from "@tanstack/react-router";
import ScriptScreen from "@/components/screens/ScriptScreen";

export const Route = createFileRoute("/script")({
  component: ScriptScreen,
});
