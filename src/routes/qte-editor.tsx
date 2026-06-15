import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/qte-editor")({
  beforeLoad: () => {
    throw redirect({ to: "/interaction" });
  },
});
