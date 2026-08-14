import assert from "node:assert/strict";
import { before, test } from "node:test";

process.env.PLUGIN_ORIGIN = "https://plugin.example.test";

let GET: (request: Request) => Promise<Response>;
let POST: (request: Request) => Promise<Response>;
let DELETE: (request: Request) => Promise<Response>;
let contract: typeof import("../src/mcp/server");
let readWidgetHtml: typeof import("../src/mcp/widget")["readWidgetHtml"];
let mcpProtocol: typeof import("@modelcontextprotocol/server");
let healthz: typeof import("../app/healthz/route");
let domainChallenge: typeof import("../app/.well-known/openai-apps-challenge/route");

before(async () => {
  ({ GET, POST, DELETE } = await import("../app/mcp/route"));
  contract = await import("../src/mcp/server");
  ({ readWidgetHtml } = await import("../src/mcp/widget"));
  mcpProtocol = await import("@modelcontextprotocol/server");
  healthz = await import("../app/healthz/route");
  domainChallenge = await import("../app/.well-known/openai-apps-challenge/route");
});

function rpcRequest(
  method: string,
  params: Record<string, unknown> = {},
  protocolVersion?: string,
): Request {
  return new Request("http://localhost:3000/mcp", {
    method: "POST",
    headers: {
      accept: "application/json, text/event-stream",
      "content-type": "application/json",
      ...(protocolVersion
        ? { "mcp-protocol-version": protocolVersion, "mcp-method": method }
        : {}),
    },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
}

async function readMcpPayload(response: Response): Promise<Record<string, unknown>> {
  const text = await response.text();

  if (response.headers.get("content-type")?.includes("text/event-stream")) {
    const message = text
      .split(/\r?\n/)
      .find((line) => line.startsWith("data: "))
      ?.slice("data: ".length);
    assert.ok(message, "SSE MCP response must contain a JSON-RPC data event");
    return JSON.parse(message) as Record<string, unknown>;
  }

  return JSON.parse(text) as Record<string, unknown>;
}

async function call(method: string, params: Record<string, unknown> = {}) {
  const response = await POST(rpcRequest(method, params));
  return { response, body: await readMcpPayload(response) };
}

async function callModernDiscover() {
  const params = {
    _meta: {
      [mcpProtocol.PROTOCOL_VERSION_META_KEY]: "2026-07-28",
      [mcpProtocol.CLIENT_CAPABILITIES_META_KEY]: {},
      [mcpProtocol.CLIENT_INFO_META_KEY]: {
        name: "contract-test",
        version: "1.0.0",
      },
    },
  };
  const response = await POST(rpcRequest("server/discover", params, "2026-07-28"));
  return { response, body: await readMcpPayload(response) };
}

test("greeting schemas validate input and structured output", () => {
  assert.deepEqual(contract.GreetingInputSchema.parse({ name: "  Ada  " }), { name: "Ada" });
  assert.throws(() => contract.GreetingInputSchema.parse({ name: "\u0000" }));
  assert.throws(() => contract.GreetingInputSchema.parse({ name: "" }));
  assert.equal(
    contract.GreetingOutputSchema.safeParse({
      name: "Ada",
      greeting: "Hello, Ada!",
      generatedAt: new Date().toISOString(),
    }).success,
    true,
  );
});

test("widget is single-file and cannot contain an undefined deployment URL", async () => {
  const html = await readWidgetHtml();
  assert.match(html, /<html/i);
  assert.match(html, /text\/html/);
  assert.doesNotMatch(html, /<(?:script|link)[^>]+(?:src|href)=/i);
  assert.doesNotMatch(html, /https:\/\/undefined/i);
});

test("MCP discovery exposes the required tool contract", async () => {
  const initialized = await call("initialize", {
    protocolVersion: "2025-06-18",
    capabilities: {},
    clientInfo: { name: "contract-test", version: "1.0.0" },
  });
  assert.equal(initialized.response.status, 200);

  const discovered = await callModernDiscover();
  assert.equal(discovered.response.status, 200, JSON.stringify(discovered.body));
  assert.ok(discovered.body.result);

  const { response, body } = await call("tools/list");
  assert.equal(response.status, 200);
  const result = body.result as { tools: Array<Record<string, unknown>> };
  const tool = result.tools.find((candidate) => candidate.name === contract.TOOL_NAME);

  assert.ok(tool);
  assert.deepEqual(tool.annotations, {
    readOnlyHint: true,
    destructiveHint: false,
    openWorldHint: false,
    idempotentHint: true,
  });
  assert.deepEqual(tool._meta, {
    securitySchemes: [{ type: "noauth" }],
    ui: { resourceUri: contract.RESOURCE_URI },
    "ui/resourceUri": contract.RESOURCE_URI,
    "openai/outputTemplate": contract.RESOURCE_URI,
    "openai/toolInvocation/invoking": "Preparing greeting",
    "openai/toolInvocation/invoked": "Greeting ready",
  });
  const outputSchema = tool.outputSchema as {
    type?: string;
    required?: string[];
    properties?: Record<string, unknown>;
  };
  assert.equal(outputSchema.type, "object");
  assert.deepEqual(outputSchema.required, ["name", "greeting", "generatedAt"]);
  assert.deepEqual(Object.keys(outputSchema.properties ?? {}).sort(), [
    "generatedAt",
    "greeting",
    "name",
  ]);
});

test("MCP resources list and read the immutable widget", async () => {
  const listed = await call("resources/list");
  const listResult = listed.body.result as { resources: Array<Record<string, unknown>> };
  const resource = listResult.resources.find((candidate) => candidate.uri === contract.RESOURCE_URI);
  assert.ok(resource);
  assert.equal(resource.mimeType, contract.RESOURCE_MIME_TYPE);

  const read = await call("resources/read", { uri: contract.RESOURCE_URI });
  const readResult = read.body.result as {
    contents: Array<{ mimeType: string; text: string; _meta: Record<string, unknown> }>;
  };
  assert.equal(readResult.contents[0]?.mimeType, contract.RESOURCE_MIME_TYPE);
  assert.match(readResult.contents[0]?.text ?? "", /<html/i);
  const ui = readResult.contents[0]?._meta.ui as {
    domain?: string;
    prefersBorder?: boolean;
    csp?: { connectDomains?: string[]; resourceDomains?: string[] };
  };
  assert.equal(ui.domain, "https://plugin.example.test");
  assert.equal(ui.prefersBorder, true);
  assert.deepEqual(ui.csp, { connectDomains: [], resourceDomains: [] });
  assert.equal(
    readResult.contents[0]?._meta["openai/widgetDescription"],
    "Displays a personalized greeting in a compact card.",
  );
});

test("MCP accepts valid calls and rejects invalid or unknown calls", async () => {
  const valid = await call("tools/call", {
    name: contract.TOOL_NAME,
    arguments: { name: "Ada" },
  });
  const validResult = valid.body.result as {
    structuredContent: { name: string; greeting: string; generatedAt: string };
  };
  assert.equal(validResult.structuredContent.name, "Ada");
  assert.equal(validResult.structuredContent.greeting, "Hello, Ada!");
  assert.ok(validResult.structuredContent.generatedAt);

  const invalid = await call("tools/call", {
    name: contract.TOOL_NAME,
    arguments: { name: "" },
  });
  const invalidResult = invalid.body.result as { isError?: boolean };
  assert.equal(invalidResult.isError, true);

  const unknown = await call("tools/call", {
    name: "does_not_exist",
    arguments: {},
  });
  assert.ok(
    [-32601, -32602].includes((unknown.body.error as { code?: number }).code ?? 0),
    "unknown tools must return a JSON-RPC method or parameter error",
  );
});

test("HTTP guard rejects unsupported MCP content types", async () => {
  const response = await POST(
    new Request("http://localhost:3000/mcp", {
      method: "POST",
      headers: { "content-type": "text/plain" },
      body: "invalid",
    }),
  );
  assert.equal(response.status, 415);
});

test("health and domain challenge routes have safe responses", async () => {
  const health = healthz.GET();
  assert.equal(health.status, 200);
  assert.equal((await health.json()).status, "ok");
  assert.equal(health.headers.get("cache-control"), "no-store");

  Reflect.set(process.env, "OPENAI_APPS_CHALLENGE_TOKEN", "challenge-token");
  try {
    const challenge = domainChallenge.GET();
    assert.equal(challenge.status, 200);
    assert.equal(challenge.headers.get("content-type"), "text/plain; charset=utf-8");
    assert.equal(await challenge.text(), "challenge-token");
  } finally {
    Reflect.deleteProperty(process.env, "OPENAI_APPS_CHALLENGE_TOKEN");
  }
});

test("legacy session methods remain stateless", async () => {
  const getResponse = await GET(new Request("http://localhost:3000/mcp"));
  const deleteResponse = await DELETE(new Request("http://localhost:3000/mcp", { method: "DELETE" }));
  assert.equal(getResponse.status, 405);
  assert.equal(deleteResponse.status, 405);
});
