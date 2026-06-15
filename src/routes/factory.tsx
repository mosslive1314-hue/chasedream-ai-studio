import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/factory")({
  beforeLoad: () => {
    throw redirect({ to: "/parse" });
  },
});
