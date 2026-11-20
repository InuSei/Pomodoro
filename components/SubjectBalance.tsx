import { SUBJECT_SHORT, type Subject } from "@/lib/subjects";

type Row = { subject: Subject; minutes: number; blocks: number };

const fmtMinutes = (m: number) => (m < 60 ? `${m}m` : `${Math.floor(m / 60)}h${m % 60 ? ` ${m % 60}m` : ""}`);

// Single-series bar list. Light-mode accent is under 3:1 on white, so every row carries a visible text value.
export default function SubjectBalance({ rows }: { rows: Row[] }) {
  const max = Math.max(...rows.map((r) => r.minutes));

  return (
    <section aria-labelledby="balance-heading" className="rounded-3xl border border-line bg-surface p-6 shadow-paper sm:p-8">
      <h2 id="balance-heading" className="font-display text-xl tracking-wide">
        Subject balance
      </h2>
      <p className="text-sm text-muted">Focus minutes over the last 7 days</p>

      {max === 0 ? (
        <p className="mt-4 rounded-2xl bg-accent-soft px-4 py-3 text-sm">
          No focus blocks logged yet this week. Your first one will show up here.
        </p>
      ) : (
        <ul className="mt-5 space-y-3">
          {rows.map((r) => (
            <li
              key={r.subject}
              title={`${r.subject}: ${r.minutes} min across ${r.blocks} ${r.blocks === 1 ? "block" : "blocks"}`}
              className="grid grid-cols-[5.5rem_1fr_auto] items-center gap-3 text-sm"
            >
              <span className="font-bold">{SUBJECT_SHORT[r.subject]}</span>
              <span className="h-3" aria-hidden>
                {r.minutes > 0 && (
                  <span
                    className="block h-full min-w-1 rounded-r-[4px] bg-accent"
                    style={{ width: `${(r.minutes / max) * 100}%` }}
                  />
                )}
              </span>
              <span className={r.minutes ? "tabular-nums" : "text-muted"}>
                {r.minutes ? `${fmtMinutes(r.minutes)} · ${r.blocks} ${r.blocks === 1 ? "block" : "blocks"}` : "not yet"}
                <span className="sr-only"> — {r.subject}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
