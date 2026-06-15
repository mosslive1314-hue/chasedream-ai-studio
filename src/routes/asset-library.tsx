import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";

const AssetLibraryScreen = lazy(() => import("@/components/screens/AssetLibraryScreen"));

export const Route = createFileRoute("/asset-library")({
  component: AssetLibraryScreen,
});
