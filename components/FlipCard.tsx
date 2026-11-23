"use client";

import { useState } from "react";
import { Check, Lightbulb, Trash2, X } from "lucide-react";
import type { DeckCard } from "@/lib/deck";
import { SUBJECT_SHORT } from "@/lib/subjects";

type Props = { card: DeckCard; onRate: (gotIt: boolean) => void; onDelete?: () => void };

// Remount with key={card.id} so each new card starts face-down.
// Multiple-choice cards: picking an option reveals the answer; "Next" rates it (right = got it).
export default function FlipCard({ card, onRate, onDelete }: Props) {
  const [flipped, setFlipped] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  // Alphabetical, so server and browser render the same order and the answer's slot carries no hint.
  const options = card.distractors.length ? [card.answer, ...card.distractors].sort((a, b) => a.localeCompare(b)) : [];
  const tip = card.highYieldTip && (
    <p className="mt-2 flex gap-1.5 text-sm text-muted">
      <Lightbulb className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
      {card.highYieldTip}
    </p>
  );

  return (
    <div className="rounded-2xl border border-line bg-bg p-4">
      <div className="flex items-center gap-2 text-xs text-muted">
        <span className="shrink-0 rounded-full bg-accent-soft px-2 py-0.5 font-bold text-fg">{SUBJECT_SHORT[card.subject]}</span>
        {card.topicTitle && <span className="truncate">{card.topicTitle}</span>}
        <span className="ml-auto flex shrink-0 items-center gap-1">
          {card.status === "mastered" && <span>mastered</span>}
          {onDelete && (
            <button type="button" onClick={onDelete} aria-label="Delete this card" className="rounded-full p-1 hover:bg-accent-soft hover:text-fg">
              <Trash2 className="size-3.5" aria-hidden />
            </button>
          )}
        </span>
      </div>

      <p className="mt-3 font-bold">{card.question}</p>

      {options.length > 0 ? (
        <div>
          <ul className="mt-3 grid gap-2">
            {options.map((o) => {
              const right = o === card.answer;
              const state = picked === null ? "" : right ? "right" : o === picked ? "wrong" : "other";
              return (
                <li key={o}>
                  <button
                    type="button"
                    disabled={picked !== null}
                    onClick={() => setPicked(o)}
                    className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left ${
                      state === "right"
                        ? "border-accent bg-accent font-bold text-on-accent"
                        : state === "wrong"
                          ? "border-line bg-surface text-muted line-through"
                          : state === "other"
                            ? "border-line bg-surface text-muted"
                            : "border-line bg-surface hover:bg-accent-soft"
                    }`}
                  >
                    <span className="flex-1">{o}</span>
                    {state === "right" && <Check className="size-4 shrink-0" aria-label="Correct answer" />}
                    {state === "wrong" && <X className="size-4 shrink-0" aria-label="Your pick, wrong" />}
                  </button>
                </li>
              );
            })}
          </ul>
          <div aria-live="polite">
            {picked !== null && (
              <div className="mt-3 motion-safe:animate-pop">
                <p className="font-bold">{picked === card.answer ? "Correct!" : `Not quite. It's ${card.answer}.`}</p>
                {tip}
                <button
                  type="button"
                  onClick={() => onRate(picked === card.answer)}
                  className="mt-4 w-full rounded-xl bg-accent px-3 py-2 font-bold text-on-accent hover:opacity-90"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
      <div aria-live="polite">
        {flipped ? (
          <div className="mt-3 motion-safe:animate-pop">
            <p className="rounded-xl border border-line bg-surface px-3 py-2">{card.answer}</p>
            {tip}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onRate(false)}
                className="rounded-xl border border-line bg-surface px-3 py-2 font-bold hover:bg-accent-soft"
              >
                Needs review
              </button>
              <button
                type="button"
                onClick={() => onRate(true)}
                className="rounded-xl bg-accent px-3 py-2 font-bold text-on-accent hover:opacity-90"
              >
                Got it
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setFlipped(true)}
            className="mt-4 w-full rounded-xl border border-dashed border-accent px-3 py-2 text-sm font-bold hover:bg-accent-soft"
          >
            Show answer
          </button>
        )}
      </div>
      )}
    </div>
  );
}
