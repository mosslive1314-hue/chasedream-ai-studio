import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function buildMcpServer(userId: string): McpServer {
  const server = new McpServer({
    name: "chasedream-studio",
    version: "1.0.0",
  });

  // Tool: list projects
  server.tool(
    "list_projects",
    "List all interactive movie-game projects for the current user",
    {},
    async () => ({
      content: [{ type: "text" as const, text: JSON.stringify({ userId, projects: ["幽灵协议", "荒诞内阁", "聚变边疆"] }) }],
    })
  );

  // Tool: get project status
  server.tool(
    "get_project_status",
    "Get the production status of a specific project",
    { projectId: z.string().describe("The project ID or title") },
    async ({ projectId }) => ({
      content: [{ type: "text" as const, text: JSON.stringify({ projectId, stage1: 100, stage2: 100, stage3: 60, progress: 74 }) }],
    })
  );

  // Tool: trigger ai factory
  server.tool(
    "trigger_ai_factory",
    "Start or resume the AI factory pipeline for a project",
    { projectId: z.string(), mode: z.enum(["faithful", "optimized", "interactive"]).optional() },
    async ({ projectId, mode }) => ({
      content: [{ type: "text" as const, text: JSON.stringify({ started: true, projectId, mode: mode ?? "faithful" }) }],
    })
  );

  return server;
}
