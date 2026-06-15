import { createFileRoute } from "@tanstack/react-router";
import AssetLibraryScreen from "@/components/screens/AssetLibraryScreen";

export const Route = createFileRoute("/asset-library")({
  component: AssetLibraryScreen,
});
