import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-zinc-950">
      <main className="flex w-full max-w-xl flex-col gap-6 px-8 py-16">
        <Link
          href="/"
          prefetch={false}
          className="text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          &larr; Back
        </Link>

        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          About
        </h1>

        <div className="flex flex-col gap-4 text-zinc-600 dark:text-zinc-400">
          <p>
            This is a minimal starter for building MCP Apps with Next.js.
            It demonstrates client-side navigation working inside ChatGPT's,
            Cursor's, or Claude.ai's sandboxed iframe.
          </p>
          <p>
            The MCP server at <code className="text-zinc-800 dark:text-zinc-200">/mcp</code>{" "}
            self-fetches this Next.js app's rendered HTML and serves it as
            an MCP resource. The{" "}
            <code className="text-zinc-800 dark:text-zinc-200">useMcpApp</code>{" "}
            hook connects to the host via the{" "}
            <code className="text-zinc-800 dark:text-zinc-200">App</code> class
            from <code className="text-zinc-800 dark:text-zinc-200">@modelcontextprotocol/ext-apps</code>.
          </p>
        </div>
      </main>
    </div>
  );
}
