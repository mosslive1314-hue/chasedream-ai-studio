import { createAPIFileRoute } from "@tanstack/react-start/api";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { requireAuth } from "@/lib/auth";
import { buildMcpServer } from "@/lib/mcp/server";

async function handleMcpRequest(request: Request): Promise<Response> {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;

  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });

  const server = buildMcpServer(auth.user.id);
  await server.connect(transport);

  return transport.handleRequest(request);
}

export const APIRoute = createAPIFileRoute("/api/mcp")({
  GET: ({ request }) => handleMcpRequest(request),
  POST: ({ request }) => handleMcpRequest(request),
  DELETE: ({ request }) => handleMcpRequest(request),
});
