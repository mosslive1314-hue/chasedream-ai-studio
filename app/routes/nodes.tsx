import { createFileRoute } from "@tanstack/react-router";
import NodesScreen from "@/components/screens/NodesScreen";

export const Route = createFileRoute("/nodes")({
  component: NodesScreen,
});
