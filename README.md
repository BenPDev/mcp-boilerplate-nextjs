# MCP + Next.js production starter

This is a reusable base for a public MCP server with a React widget rendered
inside ChatGPT. It is intentionally **not** a submission-ready product: the
only capability is `show_greeting`, a read-only technical demonstration. Replace
that tool, public-policy content, and submission tests with the real use case
before publishing.

## Architecture

- `app/mcp/route.ts` exposes the public stateless MCP endpoint using
  `mcp-handler` v2 and `@modelcontextprotocol/server` v2.
- `web/` holds the independent React widget. Vite plus
  `vite-plugin-singlefile` produces one fully inline HTML file at
  `web/dist/index.html` before the Next.js build.
- `src/mcp/server.ts` declares the versioned UI resource
  `ui://mcp-nextjs-starter/greeting/v1.html`, the tool output schema,
  read-only annotations, no-auth compatibility metadata, UI metadata, and CSP.
- The public Next.js pages are a diagnostic and policy site only. They are not
  self-fetched and they contain no iframe/history/fetch patches.

## Requirements

- Node.js 22 LTS (`.nvmrc`)
- Corepack and pnpm 10.29.3

The repository uses pnpm's strict dependency build policy. Only reviewed
native builds (`sharp` and `unrs-resolver`) are allowed in
`pnpm-workspace.yaml`; a newly introduced lifecycle script fails installation
until explicitly reviewed.

## Configure and run

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

Copy `.env.example` to a local `.env.local` when testing a tunnel or production
deployment. `PLUGIN_ORIGIN` must be an HTTPS origin with no path, query,
fragment, or credentials. Production builds deliberately fail without it:

```bash
PLUGIN_ORIGIN=https://plugin.example.com pnpm build
pnpm start
```

In PowerShell, set it for the current shell instead:

```powershell
$env:PLUGIN_ORIGIN = "https://plugin.example.com"
pnpm build
pnpm start
```

The public routes are:

- `POST /mcp` — MCP endpoint. `GET` and `DELETE` currently return `405` because
  this deployment is stateless and does not expose session streaming or
  termination routes.
- `GET /healthz` — no-store health response.
- `GET /.well-known/openai-apps-challenge` — returns only the configured domain
  verification token; otherwise 404.
- `/support`, `/privacy`, `/terms` — starter content that must be replaced for
  a real product.

## Quality gate

```bash
pnpm check
PLUGIN_ORIGIN=https://plugin.example.test pnpm build
pnpm audit --prod --audit-level=high
```

`pnpm test` exercises the MCP initialize/list/read/call flows as well as valid,
invalid, and unknown-tool requests. It also checks the single-file widget,
resource MIME type, output schema, annotations, CSP/domain metadata, and the
absence of `https://undefined`.

For manual protocol debugging run `pnpm inspect`, connect it to
`http://localhost:3000/mcp`, then repeat against the HTTPS preview deployment.
For the final host check, connect the stable HTTPS endpoint in ChatGPT Developer
Mode and exercise the UI bridge, themes, locale, responsiveness, invalid input,
retries, and out-of-scope prompts.

## Deploy to Vercel

Set `PLUGIN_ORIGIN` for every production build to the stable origin: either the
project's fixed `*.vercel.app` domain or a custom domain. Do not use a Vercel
preview URL as the permanent widget domain. The
Next configuration includes `web/dist/**` in the `/mcp` function trace so the
widget file exists at runtime.

Provider-side security, alerting, and rollback tasks are documented in
[docs/operations.md](docs/operations.md). In particular, configure Vercel WAF
and rate limiting for `/mcp`, alert on initialization/tool failures, and retain
the previous deployment for immediate promotion-based rollback.

## OpenAI submission

Follow the current OpenAI MCP, ChatGPT UI, reference, and submission guidance.
Do not create or submit `chatgpt-app-submission.json` for this generic demo.
Once the real product replaces `show_greeting`, add exactly five positive and
three negative evaluation cases, justify every annotation, verify the domain,
and ensure support/privacy/terms accurately reflect the deployed service.
