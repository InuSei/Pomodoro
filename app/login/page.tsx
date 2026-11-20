"use client";

import { useActionState } from "react";
import { Microscope } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { login } from "./actions";

export default function LoginPage() {
  const [error, action, pending] = useActionState(login, null);

  return (
    <main className="relative grid min-h-dvh place-items-center p-6">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <form
        action={action}
        className="w-full max-w-sm rounded-3xl border border-line bg-surface p-8 text-center shadow-paper"
      >
        <div className="mx-auto mb-4 grid size-14 place-items-center rounded-full bg-accent-soft text-accent">
          <Microscope className="size-7" aria-hidden />
        </div>
        <h1 className="font-display text-3xl leading-tight tracking-wide text-balance">Welcome back, future RMT</h1>
        <p className="mt-2 text-sm text-muted">Your study desk is ready when you are.</p>

        <label htmlFor="pin" className="sr-only">
          Passphrase
        </label>
        <input
          id="pin"
          name="pin"
          type="password"
          required
          autoFocus
          autoComplete="current-password"
          placeholder="Passphrase"
          aria-invalid={!!error}
          aria-describedby={error ? "pin-error" : undefined}
          className="mt-6 w-full rounded-xl border border-line bg-bg px-4 py-3 text-center tracking-widest placeholder:tracking-normal placeholder:text-muted"
        />
        {error && (
          <p id="pin-error" role="alert" className="mt-2 rounded-lg bg-accent-soft px-3 py-2 text-sm text-fg">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="mt-4 w-full rounded-xl bg-accent px-4 py-3 font-semibold text-on-accent transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "Unlocking…" : "Open my desk"}
        </button>
      </form>
    </main>
  );
}
