import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/detroit")({
  beforeLoad: () => {
    throw redirect({ to: "/nodes" });
  },
});
