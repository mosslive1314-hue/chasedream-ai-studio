import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/node-canvas")({
  beforeLoad: () => {
    throw redirect({ to: "/nodes" });
  },
});
