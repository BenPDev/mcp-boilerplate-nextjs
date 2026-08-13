# MCP Apps — Minimal Next.js Starter

A minimal [Next.js](https://nextjs.org) starter for building [MCP Apps](https://modelcontextprotocol.io) — interactive UIs that MCP hosts render alongside tool calls.

## How it works

The Next.js app serves two roles:

1. **MCP server** (`app/mcp/route.ts`) — registers tools and resources via [`mcp-handler`](https://github.com/vercel/mcp-handler) and [`@modelcontextprotocol/ext-apps`](https://github.com/anthropics/ext-apps).
2. **Widget UI** (`app/page.tsx`) — a React page that MCP hosts render inside a sandboxed iframe. The MCP route self-fetches the rendered page HTML and serves it as an MCP resource.

The `useMcpApp` hook (`app/hooks/use-mcp-app.ts`) connects to the host via the `App` class from `@modelcontextprotocol/ext-apps` and provides tool input/result data as React state.

## Getting started

```bash
pnpm install
```

### Local development with a tunnel

MCP Apps need a public HTTPS URL. Use [ngrok](https://ngrok.com) (or any tunnel):

```bash
ngrok http 3000
```

Copy the HTTPS URL and set it in `.env`:

```
BASE_URL=https://xxxx-xxx-xxx.ngrok-free.app
```

Then start the dev server:

```bash
pnpm dev
```

### Connect to a host

Add your MCP server URL to any MCP host that supports Apps:

```
https://xxxx-xxx-xxx.ngrok-free.app/mcp
```

For example, in ChatGPT, Cursor, or Claude.ai: Settings > Apps > add the URL above.

## Project structure

```
app/
  page.tsx              — Homepage (widget UI)
  about/page.tsx        — Example sub-page (navigation demo)
  counter/page.tsx      — Example sub-page (interactivity demo)
  mcp/route.ts          — MCP server endpoint
  hooks/use-mcp-app.ts  — React hook for the MCP Apps bridge
  layout.tsx            — Root layout with iframe bootstrap patches
baseUrl.ts              — Public URL resolver (tunnel / Vercel)
middleware.ts           — CORS headers for cross-origin iframe access
next.config.ts          — assetPrefix for iframe asset loading
```

## Key files

- **`app/mcp/route.ts`** — Define your tools and resources here. The `greet` tool is a minimal example.
- **`app/page.tsx`** — Your widget UI. Edit this like any Next.js page. It receives tool data via `useMcpApp()`.
- **`app/hooks/use-mcp-app.ts`** — Singleton `App` bridge with `sessionStorage` persistence. Provides `toolInput`, `toolResult`, and `connected` state.

## Deploy

Deploy to [Vercel](https://vercel.com/new) — no additional configuration needed. The `BASE_URL` is automatically derived from Vercel's environment variables in production.

Once deployed, connect it to any MCP host using:

```
https://your-app.vercel.app/mcp
```

For example, in ChatGPT, Cursor, or Claude.ai: Settings > Apps > add the URL above as a connector.

## Learn more

- [MCP Apps specification](https://modelcontextprotocol.io)
- [@modelcontextprotocol/ext-apps](https://github.com/anthropics/ext-apps)
- [mcp-handler](https://github.com/vercel/mcp-handler)
