# Production operations

This repository has no access to a Vercel account, so the provider controls below
must be configured in the target project before release.

## Required Vercel configuration

1. Attach a stable custom HTTPS domain and set `PLUGIN_ORIGIN` to its origin.
   Use the same origin on production and never infer it from preview variables.
2. Set `OPENAI_APPS_CHALLENGE_TOKEN` only while domain verification is in
   progress. Verify `/.well-known/openai-apps-challenge` returns exactly the
   supplied token and nothing else.
3. Create a Vercel Firewall rate-limit rule for `POST /mcp`. Start with a
   conservative per-IP policy appropriate to the product's expected traffic;
   the greeting demo is safe at 60 requests/minute with a small burst. Add WAF
   rules for abnormal request sizes and known malicious traffic, without
   blocking ChatGPT's legitimate traffic.
4. Alert on function errors, elevated 5xx rate, timeout rate, and a sustained
   increase in MCP tool errors. Send structured logs to the approved log drain.
   The application logs method, status, duration, and error type only; never
   add request bodies, tool arguments, tokens, or personal data to dashboards.
5. Test a preview deployment first. Roll back by promoting the immediately
   previous healthy Vercel deployment. Keep UI resource URIs versioned so a
   rollback can serve the matching HTML contract.

## Release gate

Run locally and in CI with Node 22:

```bash
pnpm install --frozen-lockfile
pnpm check
PLUGIN_ORIGIN=https://plugin.example.test pnpm build
pnpm audit --prod --audit-level=high
```

Then validate `GET /healthz`, connect `POST /mcp` with MCP Inspector, and test
the exact preview URL in ChatGPT Developer Mode. Test direct and indirect tool
selection, invalid input, retries, and requests outside the tool's scope.

## CSP changes

The current resource is fully inline and therefore declares empty
`connectDomains` and `resourceDomains`. Before adding any API, image, font,
script, or iframe, list its exact HTTPS origin in the corresponding UI CSP
field, justify it in review, and add an automated regression test.

## Submission boundary

`show_greeting` is a technical demonstration and is intentionally not
submission-ready as a product. Replace it with the real use case, update
support/privacy/terms pages to the actual operator and data practices, and
only then create `chatgpt-app-submission.json` with exactly five positive and
three negative tests plus annotation justifications.
