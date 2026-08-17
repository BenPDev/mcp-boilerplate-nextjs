import {
  App,
  applyDocumentTheme,
  applyHostStyleVariables,
  type McpUiHostContextChangedNotification,
  type McpUiToolResultNotification,
} from "@modelcontextprotocol/ext-apps";
import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { z } from "zod";
import "./styles.css";

const GreetingResultSchema = z.object({
  name: z.string().min(1).max(80),
  greeting: z.string().min(1).max(200),
  generatedAt: z.string().datetime(),
});

type GreetingResult = z.infer<typeof GreetingResultSchema>;
type WidgetStatus = "awaiting" | "connected" | "error" | "standalone";

const app = new App(
  { name: "mcp-nextjs-greeting-widget", version: "1.0.0" },
  {},
  { autoResize: true },
);
let connectionPromise: Promise<void> | undefined;

function updateHostAppearance(context: ReturnType<typeof app.getHostContext>): void {
  if (!context) return;

  if (context.theme) applyDocumentTheme(context.theme);
  if (context.styles?.variables) applyHostStyleVariables(context.styles.variables);
}

function getLegacyOpenAiContext(): { theme?: "light" | "dark"; locale?: string } {
  const host = globalThis as typeof globalThis & {
    openai?: { theme?: unknown; locale?: unknown };
  };
  const theme = host.openai?.theme;
  const locale = host.openai?.locale;

  return {
    theme: theme === "light" || theme === "dark" ? theme : undefined,
    locale: typeof locale === "string" ? locale : undefined,
  };
}

function GreetingCard() {
  const [result, setResult] = useState<GreetingResult | null>(null);
  const [status, setStatus] = useState<WidgetStatus>("awaiting");
  const [locale, setLocale] = useState("en-US");

  useEffect(() => {
    const onToolResult = (params: McpUiToolResultNotification["params"]) => {
      const parsed = GreetingResultSchema.safeParse(params.structuredContent);
      if (parsed.success && !params.isError) {
        setResult(parsed.data);
        setStatus("connected");
      } else if (params.isError) {
        setStatus("error");
      }
    };

    const onHostContextChanged = (
      context: McpUiHostContextChangedNotification["params"],
    ) => {
      updateHostAppearance(context);
      if (context.locale) setLocale(context.locale);
    };

    app.addEventListener("toolresult", onToolResult);
    app.addEventListener("hostcontextchanged", onHostContextChanged);

    const legacyContext = getLegacyOpenAiContext();
    if (legacyContext.theme) applyDocumentTheme(legacyContext.theme);
    if (legacyContext.locale) setLocale(legacyContext.locale);

    if (window.parent === window) {
      setStatus("standalone");
      return () => {
        app.removeEventListener("toolresult", onToolResult);
        app.removeEventListener("hostcontextchanged", onHostContextChanged);
      };
    }

    connectionPromise ??= app.connect();
    void connectionPromise
      .then(() => {
        const context = app.getHostContext();
        updateHostAppearance(context);
        if (context?.locale) setLocale(context.locale);
        setStatus("connected");
      })
      .catch(() => setStatus("error"));

    return () => {
      app.removeEventListener("toolresult", onToolResult);
      app.removeEventListener("hostcontextchanged", onHostContextChanged);
    };
  }, []);

  const timestamp = result
    ? new Intl.DateTimeFormat(locale, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(result.generatedAt))
    : null;

  return (
    <main className="widget-shell" aria-live="polite">
      <section className="greeting-card">
        <p className="eyebrow">Personalized greeting</p>
        {result ? (
          <>
            <h1>{result.greeting}</h1>
            <p className="detail">Created {timestamp}</p>
          </>
        ) : (
          <>
            <h1>Ready for a greeting</h1>
            <p className="detail">
              {status === "error"
                ? "The host could not deliver a valid greeting."
                : status === "standalone"
                  ? "Open this widget from an MCP host to display a greeting."
                  : "Waiting for a validated tool result from the host."}
            </p>
          </>
        )}
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <GreetingCard />
  </React.StrictMode>,
);
