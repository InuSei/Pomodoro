import Link from "next/link";
import { LogOut, Settings } from "lucide-react";
import ExamCountdown from "@/components/ExamCountdown";
import FlashcardPanel from "@/components/FlashcardPanel";
import FocusEngine from "@/components/FocusEngine";
import SubjectBalance from "@/components/SubjectBalance";
import ThemeToggle from "@/components/ThemeToggle";
import { getConfig, getDeck, weeklyBalance } from "@/lib/config";
import { requireSession } from "@/lib/session";
import { DEFAULT_NOTES } from "@/models/UserConfig";
import { logout } from "./login/actions";

// Used when MongoDB is unreachable, so the timer still works with built-in presets.
const OFFLINE_CONFIG = { displayName: "Future RMT", examDate: null, customPresets: [], encouragementNotes: DEFAULT_NOTES };

const iconLink =
  "rounded-full border border-line bg-surface p-2 text-muted transition-colors hover:bg-accent-soft hover:text-fg";

export default async function Home() {
  await requireSession(); // also makes this page dynamic, so the DB is read per request, not at build time
  const data = await Promise.all([getConfig(), weeklyBalance(), getDeck()]).catch((err) => {
    console.error("MongoDB unavailable, rendering offline:", err);
    return null;
  });
  const config = data?.[0] ?? OFFLINE_CONFIG;

  return (
    <main className="mx-auto max-w-6xl p-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl tracking-wide">Hi, {config.displayName}</h1>
          <p className="text-sm text-muted">One topic at a time. You&apos;re doing great.</p>
        </div>
        <div className="flex items-center gap-2">
          <ExamCountdown examDate={config.examDate} />
          <Link href="/settings" aria-label="Settings" className={iconLink}>
            <Settings className="size-5" aria-hidden />
          </Link>
          <ThemeToggle />
          <form action={logout}>
            <button type="submit" aria-label="Lock RMT-Chan" className={iconLink}>
              <LogOut className="size-5" aria-hidden />
            </button>
          </form>
        </div>
      </header>

      <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="grid gap-6">
        {!data && (
          <p role="status" className="rounded-2xl border border-line bg-accent-soft px-4 py-3 text-sm">
            Can&apos;t reach your study database right now. The timer still works, and blocks you finish will wait
            with a Retry button until it&apos;s back.
          </p>
        )}
        <FocusEngine customPresets={config.customPresets} notes={config.encouragementNotes} deck={data?.[2] ?? []} />
        {data && <SubjectBalance rows={data[1]} />}
        </div>
        <div className="lg:sticky lg:top-6">
          <FlashcardPanel deck={data?.[2] ?? []} />
        </div>
      </div>
    </main>
  );
}
