import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/debugger")({
  beforeLoad: () => {
    throw redirect({ to: "/simulator" });
  },
});
