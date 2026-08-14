import { readFile } from "node:fs/promises";
import path from "node:path";

const widgetPath = path.join(process.cwd(), "web", "dist", "index.html");

/** Reads the Vite-produced, fully inline MCP App resource. */
export async function readWidgetHtml(): Promise<string> {
  try {
    return await readFile(widgetPath, "utf8");
  } catch (error) {
    const code =
      typeof error === "object" && error && "code" in error
        ? String(error.code)
        : "unknown";
    throw new Error(
      `The MCP widget bundle is unavailable (${code}). Run \"pnpm build:widget\" before starting the server.`,
    );
  }
}
