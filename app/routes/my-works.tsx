import { createFileRoute } from "@tanstack/react-router";
import MyWorksScreen from "@/components/screens/MyWorksScreen";

export const Route = createFileRoute("/my-works")({
  component: MyWorksScreen,
});
