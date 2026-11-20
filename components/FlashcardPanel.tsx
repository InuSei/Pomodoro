"use client";

import { useEffect, useState } from "react";
import { FileText, Image as ImageIcon, Sparkles, X } from "lucide-react";
import { deleteCard, generateFlashcards, rateCard } from "@/app/actions";
import { MAX_FILES, MAX_NOTES, MAX_UPLOAD_BYTES, checkBatch, dueOrder, parsePages, type DeckCard } from "@/lib/deck";
import { cutPdf, formatBytes, pdfPageCount, prepareUpload } from "@/lib/upload";
import { SUBJECTS, SUBJECT_SHORT, type Subject } from "@/lib/subjects";
import FlipCard from "./FlipCard";

const field = "w-full rounded-xl border border-line bg-bg px-3 py-2 text-fg";
const isPdf = (f: File) => f.type === "application/pdf";

type Picked = { file: File; pageCount?: number }; // pageCount only for PDFs

export default function FlashcardPanel({ deck }: { deck: DeckCard[] }) {
  const [tab, setTab] = useState<"paste" | "deck">("paste");
  const [message, setMessage] = useState<string | null>(null);

  const [subject, setSubject] = useState<Subject>(SUBJECTS[0]);
  const [notes, setNotes] = useState("");
  const [files, setFiles] = useState<Picked[]>([]);
  const [pages, setPages] = useState("");
  const [preparing, setPreparing] = useState(false);
  const [pending, setPending] = useState(false);
  const hasPdf = files.some((p) => isPdf(p.file));
  const totalBytes = files.reduce((n, p) => n + p.file.size, 0);

  const [filter, setFilter] = useState<Subject | "all">("all");
  const filtered = deck.filter((c) => filter === "all" || c.subject === filter);
  const snapshot = () => [...filtered].sort(dueOrder).map((c) => c.id);
  // The review order is frozen per pass, so rating a card doesn't reshuffle the queue under you.
  const [order, setOrder] = useState<string[]>(snapshot);
  const [pos, setPos] = useState(0);
  useEffect(() => {
    setOrder(snapshot());
    setPos(0);
  }, [filter, deck.length]); // eslint-disable-line react-hooks/exhaustive-deps -- re-snapshot only on filter / added or deleted cards

  const byId = new Map(deck.map((c) => [c.id, c]));
  const queue = order.map((id) => byId.get(id)).filter((c): c is DeckCard => !!c);
  const current = queue[pos];
  const mastered = filtered.filter((c) => c.status === "mastered").length;

  async function addFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = [...(e.target.files ?? [])];
    e.target.value = ""; // so picking the same file again still fires change
    if (!picked.length) return;
    setPreparing(true);
    setMessage(null);
    const ready: Picked[] = [];
    for (const raw of picked) {
      const file = await prepareUpload(raw);
      if (!isPdf(file)) {
        ready.push({ file });
        continue;
      }
      try {
        ready.push({ file, pageCount: await pdfPageCount(file) });
      } catch {
        setMessage(`Couldn't open ${file.name}. Is it password-protected?`);
      }
    }
    setPreparing(false);
    const next = [...files, ...ready];
    if (next.length > MAX_FILES) setMessage(`Up to ${MAX_FILES} files at a time. Kept the first ${MAX_FILES}.`);
    setFiles(next.slice(0, MAX_FILES));
  }

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    const spec = hasPdf ? pages.trim() : "";
    const tooBig = files.find((p) => isPdf(p.file) && p.file.size > MAX_UPLOAD_BYTES);
    if (tooBig && !spec) {
      return setMessage(`${tooBig.file.name} is ${formatBytes(tooBig.file.size)}. Type which pages to use (e.g. 20-22) and only those get sent.`);
    }
    setPending(true);
    setMessage(null);
    try {
      // Cut PDFs down to the chosen pages here, so only those pages are uploaded.
      let toSend: File[];
      try {
        toSend = await Promise.all(
          files.map(async ({ file, pageCount }) => {
            if (!isPdf(file) || !spec || !pageCount) return file;
            const indexes = parsePages(spec, pageCount);
            if (typeof indexes === "string") throw new Error(indexes);
            return cutPdf(file, indexes);
          }),
        );
      } catch (err) {
        return setMessage(err instanceof Error ? err.message : "Couldn't read that PDF.");
      }
      const sendBytes = toSend.reduce((n, f) => n + f.size, 0);
      const problem = checkBatch(notes.trim(), toSend);
      if (problem) {
        return setMessage(
          spec && sendBytes > MAX_UPLOAD_BYTES
            ? `Pages ${spec} come to ${formatBytes(sendBytes)}, over the ${formatBytes(MAX_UPLOAD_BYTES)} limit. Try fewer pages.`
            : problem,
        );
      }
      const fd = new FormData();
      fd.set("subject", subject);
      fd.set("notes", notes);
      for (const f of toSend) fd.append("files", f);
      const r = await generateFlashcards(fd);
      if ("error" in r) {
        setMessage(r.error);
      } else {
        setNotes("");
        setFiles([]);
        setPages("");
        setFilter(subject);
        setTab("deck");
        setMessage(`Made ${r.count} cards for ${SUBJECT_SHORT[subject]}!`);
      }
    } catch {
      setMessage("Something went wrong. Try again?");
    } finally {
      setPending(false);
    }
  }

  function rate(card: DeckCard, gotIt: boolean) {
    rateCard(card.id, gotIt).catch(() => setMessage("Couldn't save that rating."));
    setPos(pos + 1);
  }

  async function remove(card: DeckCard) {
    if (!confirm("Delete this card?")) return;
    await deleteCard(card.id).catch(() => setMessage("Couldn't delete that card."));
  }

  const tabBtn = (id: "paste" | "deck", label: string) => (
    <button
      type="button"
      role="tab"
      aria-selected={tab === id}
      onClick={() => {
        setTab(id);
        setMessage(null);
      }}
      className={`flex-1 rounded-full px-3 py-1.5 text-sm font-bold transition-colors ${
        tab === id ? "bg-accent text-on-accent" : "text-muted hover:text-fg"
      }`}
    >
      {label}
    </button>
  );

  return (
    <section aria-labelledby="cards-heading" className="rounded-3xl border border-line bg-surface p-6 shadow-paper">
      <h2 id="cards-heading" className="font-display text-xl tracking-wide">
        Flashcards
      </h2>

      <div role="tablist" aria-label="Flashcard tools" className="mt-3 flex gap-1 rounded-full border border-line bg-bg p-1">
        {tabBtn("paste", "Paste notes")}
        {tabBtn("deck", `Review deck (${deck.length})`)}
      </div>

      {message && (
        <p role="status" className="mt-3 rounded-xl bg-accent-soft px-3 py-2 text-sm">
          {message}
        </p>
      )}

      {tab === "paste" ? (
        <form role="tabpanel" onSubmit={generate} className="mt-4 space-y-3">
          <label className="block text-sm">
            <span className="font-bold">Subject</span>
            <select value={subject} onChange={(e) => setSubject(e.target.value as Subject)} className={`mt-1 ${field}`}>
              {SUBJECTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="font-bold">Your notes</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={MAX_NOTES}
              rows={7}
              placeholder="Paste lecture notes, transes or mnemonics…"
              className={`mt-1 ${field}`}
            />
            <span className="mt-1 block text-right text-xs text-muted">
              {notes.length} / {MAX_NOTES}
            </span>
          </label>

          <div className="text-sm">
            <label htmlFor="card-files" className="font-bold">
              Or add a PDF or photos of your notes
            </label>
            <span className="block text-xs text-muted">
              Up to {MAX_FILES} files. Big PDFs are fine: pick the pages and only those get sent. Handwriting works too.
            </span>
            <input
              id="card-files"
              type="file"
              multiple
              accept=".pdf,application/pdf,image/jpeg,image/png,image/webp,.heic,.heif"
              onChange={addFiles}
              disabled={files.length >= MAX_FILES || preparing}
              className="mt-2 block w-full text-xs text-muted file:mr-3 file:cursor-pointer file:rounded-full file:border file:border-line file:bg-accent-soft file:px-4 file:py-2 file:text-sm file:font-bold file:text-fg disabled:opacity-60"
            />
            {preparing && <p className="mt-2 text-xs text-muted">Getting files ready…</p>}
            {files.length > 0 && (
              <ul className="mt-2 space-y-1.5">
                {files.map(({ file, pageCount }, i) => (
                  <li key={`${file.name}-${i}`} className="flex items-center gap-2 rounded-xl border border-line bg-bg px-3 py-1.5">
                    {isPdf(file) ? (
                      <FileText className="size-4 shrink-0 text-accent" aria-hidden />
                    ) : (
                      <ImageIcon className="size-4 shrink-0 text-accent" aria-hidden />
                    )}
                    <span className="min-w-0 flex-1 truncate">{file.name}</span>
                    <span className="shrink-0 text-xs text-muted">
                      {pageCount ? `${pageCount} pages · ` : ""}
                      {formatBytes(file.size)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setFiles(files.filter((_, j) => j !== i))}
                      aria-label={`Remove ${file.name}`}
                      className="rounded-full p-1 text-muted hover:bg-accent-soft hover:text-fg"
                    >
                      <X className="size-3.5" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {hasPdf && (
            <label className="block text-sm">
              <span className="font-bold">Which pages?</span>
              <span className="block text-xs text-muted">
                {totalBytes > MAX_UPLOAD_BYTES
                  ? "Needed for this big PDF. 2–4 pages per batch works best, e.g. 20-22."
                  : "Optional. Keeps cards on one topic, e.g. 20-22 or 3, 5, 8."}
              </span>
              <input
                value={pages}
                onChange={(e) => setPages(e.target.value)}
                inputMode="numeric"
                maxLength={40}
                placeholder="All pages"
                className={`mt-1 ${field}`}
              />
            </label>
          )}

          <button
            type="submit"
            disabled={pending || preparing}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 font-bold text-on-accent transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            <Sparkles className="size-4" aria-hidden />
            {pending ? "Making your cards…" : "Generate quick recall cards"}
          </button>
          <p className="text-xs text-muted">AI can make mistakes. Check cards against your notes, and delete any that are off.</p>
        </form>
      ) : (
        <div role="tabpanel" className="mt-4 space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <label className="sr-only" htmlFor="deck-filter">
              Filter by subject
            </label>
            <select
              id="deck-filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value as Subject | "all")}
              className={`${field} w-auto flex-1`}
            >
              <option value="all">All subjects</option>
              {SUBJECTS.map((s) => (
                <option key={s} value={s}>
                  {SUBJECT_SHORT[s]}
                </option>
              ))}
            </select>
            <span className="shrink-0 text-muted">
              {filtered.length} cards · {mastered} mastered
            </span>
          </div>

          {current ? (
            <>
              <p className="text-xs text-muted">
                Card {pos + 1} of {queue.length}
                {current.status === "learning" ? " · due" : ""}
              </p>
              <FlipCard key={current.id} card={current} onRate={(g) => rate(current, g)} onDelete={() => remove(current)} />
            </>
          ) : (
            <div className="rounded-2xl bg-accent-soft px-4 py-6 text-center text-sm">
              {queue.length ? (
                <>
                  <p className="font-bold">That&apos;s the whole stack. Lovely work!</p>
                  <button
                    type="button"
                    onClick={() => {
                      setOrder(snapshot());
                      setPos(0);
                    }}
                    className="mt-3 rounded-full border border-line bg-surface px-4 py-1.5 font-bold hover:bg-bg"
                  >
                    Start over
                  </button>
                </>
              ) : (
                <p>No cards here yet. Paste some notes to make your first batch.</p>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
