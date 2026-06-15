import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";

const MyWorksScreen = lazy(() => import("@/components/screens/MyWorksScreen"));

export const Route = createFileRoute("/my-works")({
  component: MyWorksScreen,
});
