import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import PalettePicker from "@/components/PalettePicker";
import { getConfig } from "@/lib/config";
import { requireSession } from "@/lib/session";
import { saveSettings } from "../actions";

const field = "mt-1 w-full rounded-xl border border-line bg-bg px-3 py-2";

export default async function SettingsPage() {
  await requireSession();
  const config = await getConfig();

  return (
    <main className="mx-auto max-w-lg p-6">
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted hover:text-fg">
        <ArrowLeft className="size-4" aria-hidden /> Back to my desk
      </Link>
      <h1 className="mt-4 font-display text-3xl tracking-wide">Settings</h1>

      <section aria-labelledby="theme-heading" className="mt-6 rounded-3xl border border-line bg-surface p-6 shadow-paper">
        <h2 id="theme-heading" className="text-sm font-bold">Color theme</h2>
        <p className="mb-4 text-sm text-muted">Applies right away. Each has a light and dark version.</p>
        <PalettePicker />
      </section>

      <form action={saveSettings} className="mt-6 space-y-5 rounded-3xl border border-line bg-surface p-6 shadow-paper">
        <label className="block">
          <span className="text-sm font-bold">What should I call you?</span>
          <input name="displayName" defaultValue={config.displayName} maxLength={60} className={field} />
        </label>

        <label className="block">
          <span className="text-sm font-bold">MTLE exam date</span>
          <input name="examDate" type="date" defaultValue={config.examDate?.slice(0, 10) ?? ""} className={field} />
        </label>

        <label className="block">
          <span className="text-sm font-bold">Break-time notes</span>
          <span className="block text-sm text-muted">One per line. A random one shows during each break.</span>
          <textarea
            name="notes"
            rows={6}
            defaultValue={config.encouragementNotes.join("\n")}
            className={field}
          />
        </label>

        <button
          type="submit"
          className="w-full rounded-xl bg-accent px-4 py-3 font-bold text-on-accent transition-opacity hover:opacity-90"
        >
          Save
        </button>
      </form>
    </main>
  );
}
