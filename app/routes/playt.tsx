import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/playt")({
  beforeLoad: () => {
    throw redirect({ to: "/simulator" });
  },
});
