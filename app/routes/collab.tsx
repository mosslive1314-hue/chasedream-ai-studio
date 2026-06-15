import { createFileRoute } from "@tanstack/react-router";
import CollabScreen from "@/components/screens/CollabScreen";

export const Route = createFileRoute("/collab")({
  component: CollabScreen,
});
