"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { chime } from "@/lib/chime";

export type Goal = { id: number; text: string; completed: boolean };
const MAX_GOALS = 3;

type Props = { goals: Goal[]; setGoals: (goals: Goal[]) => void; sound: boolean };

export default function MicroGoals({ goals, setGoals, sound }: Props) {
  const [draft, setDraft] = useState("");
  const full = goals.length >= MAX_GOALS;

  function add(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || full) return;
    setGoals([...goals, { id: Date.now(), text, completed: false }]);
    setDraft("");
  }

  function toggle(goal: Goal) {
    if (!goal.completed && sound) chime([1046.5, 1318.5]);
    setGoals(goals.map((g) => (g.id === goal.id ? { ...g, completed: !g.completed } : g)));
  }

  return (
    <section aria-labelledby="goals-heading" className="w-full">
      <h2 id="goals-heading" className="text-sm font-bold text-muted">
        Tiny goals <span className="font-medium">(up to {MAX_GOALS})</span>
      </h2>

      {goals.length > 0 && (
        <ul className="mt-2 space-y-2">
          {goals.map((g) => (
            <li
              key={g.id}
              className={`flex items-center gap-3 rounded-xl border border-line bg-bg px-3 py-2 ${g.completed ? "motion-safe:animate-pop" : ""}`}
            >
              <input
                id={`goal-${g.id}`}
                type="checkbox"
                checked={g.completed}
                onChange={() => toggle(g)}
                className="size-5 shrink-0 accent-accent"
              />
              <label htmlFor={`goal-${g.id}`} className={`flex-1 ${g.completed ? "text-muted line-through" : ""}`}>
                {g.text}
              </label>
              <button
                type="button"
                onClick={() => setGoals(goals.filter((x) => x.id !== g.id))}
                aria-label={`Remove goal: ${g.text}`}
                className="rounded-full p-1 text-muted hover:bg-accent-soft hover:text-fg"
              >
                <X className="size-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}

      {!full && (
        <form onSubmit={add} className="mt-2 flex gap-2">
          <label htmlFor="new-goal" className="sr-only">
            Add a tiny goal
          </label>
          <input
            id="new-goal"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={200}
            placeholder="e.g. Read p. 1–4 of Enterobacteriaceae"
            className="min-w-0 flex-1 rounded-xl border border-line bg-bg px-3 py-2 placeholder:text-muted"
          />
          <button
            type="submit"
            aria-label="Add goal"
            className="rounded-xl border border-line bg-surface px-3 text-muted hover:bg-accent-soft hover:text-fg"
          >
            <Plus className="size-5" aria-hidden />
          </button>
        </form>
      )}
    </section>
  );
}
