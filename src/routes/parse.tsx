import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";

const ParseScreen = lazy(() => import("@/components/screens/ParseScreen"));

export const Route = createFileRoute("/parse")({
  component: ParseScreen,
});
