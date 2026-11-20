"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { PALETTES } from "@/lib/palettes";

// shortcut: palette lives in localStorage like light/dark, so each device keeps its own; move to UserConfig for cross-device sync.
export default function PalettePicker() {
  const [current, setCurrent] = useState<string>("strawberry");
  useEffect(() => setCurrent(localStorage.palette || "strawberry"), []);

  function choose(id: string) {
    document.documentElement.dataset.palette = id;
    localStorage.palette = id;
    setCurrent(id);
  }

  return (
    <div role="radiogroup" aria-label="Color theme" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {PALETTES.map((p) => (
        <button
          key={p.id}
          type="button"
          role="radio"
          aria-checked={current === p.id}
          data-palette={p.id}
          onClick={() => choose(p.id)}
          className={`flex flex-col gap-2 rounded-2xl border-2 bg-bg p-3 text-left text-fg transition-transform hover:-translate-y-0.5 ${
            current === p.id ? "border-accent" : "border-line"
          }`}
        >
          <span className="flex items-center gap-1.5" aria-hidden>
            <span className="size-5 rounded-full bg-accent" />
            <span className="size-5 rounded-full border border-line bg-accent-soft" />
            <span className="size-5 rounded-full border border-line bg-surface" />
            {current === p.id && <Check className="ml-auto size-4 text-fg" />}
          </span>
          <span className="text-sm font-bold">{p.name}</span>
        </button>
      ))}
    </div>
  );
}
