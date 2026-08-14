import { createMcpHandler } from "mcp-handler";
import { logMcpHandlerEvent, logMcpResponse } from "@/src/mcp/observability";
import {
  registerPlugin,
  SERVER_NAME,
  SERVER_VERSION,
} from "@/src/mcp/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const MAX_PAYLOAD_BYTES = 64 * 1024;
const HANDLER_TIMEOUT_MS = 25_000;
const ALLOWED_METHODS = new Set(["GET", "POST", "DELETE"]);

const rawHandler = createMcpHandler(registerPlugin, {
  serverInfo: { name: SERVER_NAME, version: SERVER_VERSION },
  instructions:
    "This server exposes one read-only greeting display tool. Use show_greeting only when the user explicitly requests a personalized greeting.",
  onEvent: logMcpHandlerEvent,
});

function mcpError(status: number, code: number, message: string): Response {
  return new Response(
    JSON.stringify({ jsonrpc: "2.0", error: { code, message }, id: null }),
    {
      status,
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "application/json; charset=utf-8",
      },
    },
  );
}

async function isPayloadWithinLimit(request: Request): Promise<boolean> {
  const header = request.headers.get("content-length");
  const declaredLength = header ? Number(header) : undefined;

  if (declaredLength !== undefined && (!Number.isFinite(declaredLength) || declaredLength < 0)) {
    return false;
  }
  if (declaredLength !== undefined && declaredLength > MAX_PAYLOAD_BYTES) {
    return false;
  }

  // A proxy may omit Content-Length. Checking a clone keeps the original body
  // available to the MCP handler while still applying a deterministic limit.
  if (declaredLength === undefined) {
    const bytes = await request.clone().arrayBuffer();
    return bytes.byteLength <= MAX_PAYLOAD_BYTES;
  }

  return true;
}

async function runWithTimeout(request: Request): Promise<Response> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      resolve(mcpError(504, -32603, "MCP request timed out."));
    }, HANDLER_TIMEOUT_MS);

    rawHandler(request).then(
      (response) => {
        clearTimeout(timeout);
        resolve(response);
      },
      (error) => {
        clearTimeout(timeout);
        reject(error);
      },
    );
  });
}

async function handleMcpRequest(request: Request): Promise<Response> {
  const startedAt = performance.now();

  if (!ALLOWED_METHODS.has(request.method)) {
    const response = new Response(null, {
      status: 405,
      headers: { Allow: "GET, POST, DELETE" },
    });
    logMcpResponse({
      method: request.method,
      status: response.status,
      outcome: "rejected",
      durationMs: Math.round(performance.now() - startedAt),
    });
    return response;
  }

  if (request.method === "POST") {
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().startsWith("application/json")) {
      const response = mcpError(415, -32600, "MCP requests must use application/json.");
      logMcpResponse({
        method: request.method,
        status: response.status,
        outcome: "rejected",
        durationMs: Math.round(performance.now() - startedAt),
      });
      return response;
    }

    if (!(await isPayloadWithinLimit(request))) {
      const response = mcpError(413, -32600, "MCP request exceeds the payload limit.");
      logMcpResponse({
        method: request.method,
        status: response.status,
        outcome: "rejected",
        durationMs: Math.round(performance.now() - startedAt),
      });
      return response;
    }
  }

  try {
    const response = await runWithTimeout(request);
    logMcpResponse({
      method: request.method,
      status: response.status,
      outcome:
        response.status === 504
          ? "timeout"
          : response.ok
            ? "success"
            : "rejected",
      durationMs: Math.round(performance.now() - startedAt),
    });
    return response;
  } catch (error) {
    const response = mcpError(500, -32603, "Internal MCP server error.");
    logMcpResponse({
      method: request.method,
      status: response.status,
      outcome: "error",
      durationMs: Math.round(performance.now() - startedAt),
      errorType: error instanceof Error ? error.name : "unknown_error",
    });
    return response;
  }
}

export { handleMcpRequest as GET, handleMcpRequest as POST, handleMcpRequest as DELETE };
