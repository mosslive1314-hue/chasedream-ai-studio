import { createFileRoute } from "@tanstack/react-router";
import VersionScreen from "@/components/screens/VersionScreen";

export const Route = createFileRoute("/version")({
  component: VersionScreen,
});
