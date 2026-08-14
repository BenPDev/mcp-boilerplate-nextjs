import Link from "next/link";

export default function Home() {
  return (
    <main className="site-shell">
      <section className="hero">
        <p className="eyebrow">MCP + ChatGPT UI</p>
        <h1>Production-oriented Next.js starter</h1>
        <p>
          The public site is deliberately separate from the MCP widget. The
          widget is compiled to one self-contained HTML resource and served by
          <code>/mcp</code>.
        </p>
        <div className="actions">
          <a href="/healthz">Check health</a>
          <a href="/mcp">MCP endpoint</a>
        </div>
      </section>
      <section className="card-grid" aria-label="Operational links">
        <article>
          <h2>Demo capability</h2>
          <p>
            <code>show_greeting</code> displays a validated personalized
            greeting. Replace it with the real product before submission.
          </p>
        </article>
        <article>
          <h2>Operational pages</h2>
          <nav>
            <Link href="/support">Support</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
          </nav>
        </article>
      </section>
    </main>
  );
}
