import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";

const VersionScreen = lazy(() => import("@/components/screens/VersionScreen"));

export const Route = createFileRoute("/version")({
  component: VersionScreen,
});
