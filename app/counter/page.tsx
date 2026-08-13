"use client";

import { useState } from "react";
import Link from "next/link";

export default function CounterPage() {
  const [count, setCount] = useState(0);

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
          Counter
        </h1>

        <p className="text-zinc-600 dark:text-zinc-400">
          A simple client-side counter to verify that React hydration and
          interactivity work inside the ChatGPT, Cursor, or Claude.ai iframe.
        </p>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setCount((c) => c - 1)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 bg-white text-lg font-medium text-zinc-900 transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            -
          </button>
          <span className="min-w-[3ch] text-center text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
            {count}
          </span>
          <button
            onClick={() => setCount((c) => c + 1)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 bg-white text-lg font-medium text-zinc-900 transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            +
          </button>
        </div>
      </main>
    </div>
  );
}
