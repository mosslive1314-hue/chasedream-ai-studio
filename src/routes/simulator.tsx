import { createFileRoute } from "@tanstack/react-router";
import { lazy } from "react";
import { z } from "zod";

const SimulatorScreen = lazy(() => import("@/components/screens/SimulatorScreen"));

const simulatorSearchSchema = z.object({
  node: z.string().optional(),
});

export const Route = createFileRoute("/simulator")({
  validateSearch: simulatorSearchSchema,
  component: SimulatorScreen,
});
