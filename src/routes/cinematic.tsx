import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";

const CinematicEditorScreen = lazy(() => import("@/components/screens/CinematicEditorScreen"));

export const Route = createFileRoute("/cinematic")({
  component: CinematicEditorScreen,
});
