"use client";

import Link from "next/link";

// Shown when a page throws, e.g. Settings while MongoDB is unreachable (the home page has its own offline mode).
export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="grid min-h-dvh place-items-center p-6">
      <div className="max-w-sm rounded-3xl border border-line bg-surface p-8 text-center shadow-paper">
        <h1 className="font-display text-2xl tracking-wide">Oops, a little hiccup</h1>
        <p className="mt-2 text-sm text-muted">
          This page couldn&apos;t load. Your study database may be unreachable right now.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-xl bg-accent px-4 py-2 font-bold text-on-accent hover:opacity-90"
          >
            Try again
          </button>
          <Link href="/" className="rounded-xl border border-line px-4 py-2 font-bold hover:bg-accent-soft">
            Back to my desk
          </Link>
        </div>
      </div>
    </main>
  );
}
