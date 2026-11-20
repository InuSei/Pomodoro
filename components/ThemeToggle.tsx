"use client";

import { Moon, Sun } from "lucide-react";

// shortcut: theme lives in localStorage only; sync to UserConfig.themeMode once Phase 3 loads config.
export default function ThemeToggle() {
  function toggle() {
    const dark = document.documentElement.classList.toggle("dark");
    localStorage.theme = dark ? "dark" : "light";
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle light / dark theme"
      className="rounded-full border border-line bg-surface p-2 text-muted transition-colors hover:bg-accent-soft hover:text-fg"
    >
      <Sun className="size-5 dark:hidden" aria-hidden />
      <Moon className="hidden size-5 dark:block" aria-hidden />
    </button>
  );
}
