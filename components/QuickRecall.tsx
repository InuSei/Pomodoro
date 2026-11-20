"use client";

import { useState } from "react";
import { rateCard } from "@/app/actions";
import type { DeckCard } from "@/lib/deck";
import FlipCard from "./FlipCard";

// Post-focus "2-Minute Quick Recall" (spec §3.4): an invitation, then 2–3 cards, then a send-off.
export default function QuickRecall({ cards, onClose }: { cards: DeckCard[]; onClose: () => void }) {
  const [pos, setPos] = useState(-1); // -1 = still on the invitation
  const btn = "rounded-full border border-line bg-surface px-4 py-1.5 text-sm font-bold hover:bg-accent-soft";

  if (pos === -1) {
    return (
      <div className="w-full max-w-md rounded-2xl border border-line bg-bg p-4 text-center">
        <p className="font-bold">2-minute quick recall?</p>
        <p className="text-sm text-muted">
          {cards.length} {cards.length === 1 ? "card" : "cards"} while it&apos;s fresh in your head.
        </p>
        <div className="mt-3 flex justify-center gap-2">
          <button type="button" onClick={() => setPos(0)} className={`${btn} border-accent bg-accent text-on-accent hover:bg-accent hover:opacity-90`}>
            Let&apos;s go
          </button>
          <button type="button" onClick={onClose} className={`${btn} text-muted`}>
            Skip
          </button>
        </div>
      </div>
    );
  }

  if (pos >= cards.length) {
    return (
      <div className="w-full max-w-md rounded-2xl border border-line bg-bg p-4 text-center">
        <p className="font-bold">Nice recall! Enjoy the rest of your break.</p>
        <button type="button" onClick={onClose} className={`${btn} mt-3`}>
          Close
        </button>
      </div>
    );
  }

  const card = cards[pos];
  return (
    <div className="w-full max-w-md">
      <p className="mb-1 text-xs text-muted">
        Quick recall · card {pos + 1} of {cards.length}
      </p>
      <FlipCard
        key={card.id}
        card={card}
        onRate={(gotIt) => {
          rateCard(card.id, gotIt).catch(() => {}); // a lost rating only means the card shows up again later
          setPos(pos + 1);
        }}
      />
    </div>
  );
}
