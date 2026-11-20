"use client";

import { useState } from "react";
import { Lightbulb, Trash2 } from "lucide-react";
import type { DeckCard } from "@/lib/deck";
import { SUBJECT_SHORT } from "@/lib/subjects";

type Props = { card: DeckCard; onRate: (gotIt: boolean) => void; onDelete?: () => void };

// Remount with key={card.id} so each new card starts face-down.
export default function FlipCard({ card, onRate, onDelete }: Props) {
  const [flipped, setFlipped] = useState(false);

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

      <div aria-live="polite">
        {flipped ? (
          <div className="mt-3 motion-safe:animate-pop">
            <p className="rounded-xl border border-line bg-surface px-3 py-2">{card.answer}</p>
            {card.highYieldTip && (
              <p className="mt-2 flex gap-1.5 text-sm text-muted">
                <Lightbulb className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
                {card.highYieldTip}
              </p>
            )}
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
    </div>
  );
}
