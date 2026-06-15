import { createFileRoute } from "@tanstack/react-router";
import ParseScreen from "@/components/screens/ParseScreen";

export const Route = createFileRoute("/parse")({
  component: ParseScreen,
});
