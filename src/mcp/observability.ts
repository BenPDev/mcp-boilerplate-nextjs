type McpLogEvent = {
  timestamp: string;
  event: string;
  method?: string;
  status?: number;
  outcome?: "success" | "error" | "timeout" | "rejected";
  durationMs?: number;
  errorType?: string;
};

function writeLog(event: McpLogEvent): void {
  // Intentionally excludes MCP arguments, structured content, tokens, and PII.
  console.info(JSON.stringify(event));
}

export function logMcpResponse(input: Omit<McpLogEvent, "timestamp" | "event">): void {
  writeLog({ timestamp: new Date().toISOString(), event: "mcp_request", ...input });
}

export function logMcpHandlerEvent(event: unknown): void {
  if (!event || typeof event !== "object") return;

  const candidate = event as {
    type?: unknown;
    method?: unknown;
    status?: unknown;
    duration?: unknown;
    error?: unknown;
  };

  if (candidate.type !== "ERROR") return;

  writeLog({
    timestamp: new Date().toISOString(),
    event: "mcp_handler_error",
    method: typeof candidate.method === "string" ? candidate.method : undefined,
    outcome: "error",
    durationMs:
      typeof candidate.duration === "number" ? candidate.duration : undefined,
    errorType:
      candidate.error instanceof Error
        ? candidate.error.name
        : typeof candidate.error === "string"
          ? "handler_error"
          : "unknown_error",
  });
}
