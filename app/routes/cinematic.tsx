import { createFileRoute } from "@tanstack/react-router";
import CinematicEditorScreen from "@/components/screens/CinematicEditorScreen";

export const Route = createFileRoute("/cinematic")({
  component: CinematicEditorScreen,
});
