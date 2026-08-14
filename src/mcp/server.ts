import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { getPluginConfig } from "@/src/config";
import { readWidgetHtml } from "@/src/mcp/widget";

export const SERVER_NAME = "mcp-nextjs-production-starter";
export const SERVER_VERSION = "1.0.0";
export const RESOURCE_URI = "ui://mcp-nextjs-starter/greeting/v1.html";
export const RESOURCE_MIME_TYPE = "text/html;profile=mcp-app";
export const TOOL_NAME = "show_greeting";

export const GreetingInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required.")
    .max(80, "Name must contain at most 80 characters.")
    .refine(
      (value) => !/[\u0000-\u001F\u007F]/.test(value),
      "Name cannot contain control characters.",
    )
    .describe("Name of the person to greet"),
});

export const GreetingOutputSchema = z.object({
  name: z.string(),
  greeting: z.string(),
  generatedAt: z.string().datetime(),
});

export type GreetingOutput = z.infer<typeof GreetingOutputSchema>;

export function createGreeting(name: string): GreetingOutput {
  return {
    name,
    greeting: `Hello, ${name}!`,
    generatedAt: new Date().toISOString(),
  };
}

function getResourceMeta() {
  const { origin } = getPluginConfig();
  const csp = { connectDomains: [], resourceDomains: [] };

  return {
    ui: {
      csp,
      domain: origin,
      prefersBorder: true,
    },
    "openai/widgetDescription":
      "Displays a personalized greeting in a compact card.",
    "openai/widgetPrefersBorder": true,
    "openai/widgetDomain": origin,
    "openai/widgetCSP": {
      connect_domains: [],
      resource_domains: [],
    },
  };
}

/** Registers the immutable UI resource and the deliberately narrow demo tool. */
export function registerPlugin(server: McpServer): void {
  server.registerResource(
    "greeting-widget",
    RESOURCE_URI,
    {
      title: "Greeting widget",
      description: "A compact UI for displaying a personalized greeting.",
      mimeType: RESOURCE_MIME_TYPE,
      _meta: getResourceMeta(),
    },
    async () => ({
      contents: [
        {
          uri: RESOURCE_URI,
          mimeType: RESOURCE_MIME_TYPE,
          text: await readWidgetHtml(),
          _meta: getResourceMeta(),
        },
      ],
    }),
  );

  server.registerTool(
    TOOL_NAME,
    {
      title: "Show greeting",
      description:
        "Use this when the user explicitly asks to display a personalized greeting.",
      inputSchema: GreetingInputSchema,
      outputSchema: GreetingOutputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
        idempotentHint: true,
      },
      // SDK v2 carries OpenAI's no-auth declaration as compatibility metadata.
      // Keep it mirrored here until the public descriptor gains a native field.
      _meta: {
        securitySchemes: [{ type: "noauth" }],
        ui: { resourceUri: RESOURCE_URI },
        "ui/resourceUri": RESOURCE_URI,
        "openai/outputTemplate": RESOURCE_URI,
        "openai/toolInvocation/invoking": "Preparing greeting",
        "openai/toolInvocation/invoked": "Greeting ready",
      },
    },
    async ({ name }) => {
      const greeting = createGreeting(name);
      return {
        content: [{ type: "text", text: greeting.greeting }],
        structuredContent: greeting,
      };
    },
  );
}
