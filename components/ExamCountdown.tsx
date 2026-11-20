"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CalendarHeart } from "lucide-react";

// Whole days between today (in the user's own timezone) and the exam date (stored as UTC midnight).
function daysUntil(iso: string) {
  const now = new Date();
  return Math.round((Date.parse(iso) - Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())) / 86_400_000);
}

export default function ExamCountdown({ examDate }: { examDate: string | null }) {
  // Computed after mount: the server's "today" is UTC, which is a day behind Manila before 8 am.
  const [days, setDays] = useState<number | null>(null);
  useEffect(() => setDays(examDate ? daysUntil(examDate) : null), [examDate]);

  const text = !examDate
    ? "Set your MTLE date"
    : days === null
      ? "MTLE countdown"
      : days > 1
        ? `${days} days to MTLE`
        : days === 1
          ? "MTLE is tomorrow!"
          : days === 0
            ? "MTLE day — you've got this!"
            : "MTLE done — so proud of you!";

  return (
    <Link
      href="/settings"
      title="Change exam date & settings"
      className="inline-flex items-center gap-1.5 rounded-full border border-line bg-accent-soft px-3 py-1.5 text-sm font-bold text-fg transition-colors hover:border-accent"
    >
      <CalendarHeart className="size-4 text-accent" aria-hidden />
      {text}
    </Link>
  );
}
