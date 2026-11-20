// Client-safe flashcard helpers (no database imports, so browser components can use them).
import type { Subject } from "./subjects";

export const MAX_NOTES = 4000; // characters of pasted notes per batch (spec §3.4)

export type DeckCard = {
  id: string;
  subject: Subject;
  topicTitle: string;
  question: string;
  answer: string;
  highYieldTip: string;
  status: "learning" | "mastered";
  lastReviewedAt: string | null;
};

// Review order: learning cards first, never-reviewed then oldest-reviewed; mastered cards after.
export function dueOrder(a: DeckCard, b: DeckCard) {
  if (a.status !== b.status) return a.status === "learning" ? -1 : 1;
  return (a.lastReviewedAt ?? "").localeCompare(b.lastReviewedAt ?? "");
}

export const UPLOAD_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
export const MAX_FILES = 5;
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024; // Vercel rejects request bodies over 4.5 MB

/** Error message for a generate request, or null if it's OK. The panel uses it for instant feedback, the server to enforce. */
export function checkBatch(notes: string, files: { type: string; size: number }[]): string | null {
  if (files.length > MAX_FILES) return `Up to ${MAX_FILES} files at a time.`;
  if (files.some((f) => !UPLOAD_TYPES.includes(f.type))) return "Files must be PDF, JPG, PNG, WebP or HEIC.";
  if (files.reduce((n, f) => n + f.size, 0) > MAX_UPLOAD_BYTES) return "Files add up to more than 4 MB. Try fewer pages or photos.";
  if (notes.length > MAX_NOTES) return `Notes are over ${MAX_NOTES} characters. Try a smaller chunk.`;
  if (!files.length && notes.length < 40) return "Paste a bit more (at least a few lines), or add a PDF or photo.";
  return null;
}

/** "20-22, 25" → sorted 0-based page indexes for a PDF with `pageCount` pages, or an error message. */
export function parsePages(spec: string, pageCount: number): number[] | string {
  const bad = "Pages should look like 20-22 or 3, 5, 8.";
  const picked = new Set<number>();
  for (const part of spec.split(",")) {
    const m = part.trim().match(/^(\d+)(?:\s*[-–]\s*(\d+))?$/);
    if (!m) return bad;
    const from = Number(m[1]);
    const to = Number(m[2] ?? m[1]);
    if (from < 1 || to < from) return bad;
    if (to > pageCount) return `This PDF only has ${pageCount} pages.`;
    for (let p = from; p <= to; p++) picked.add(p - 1);
  }
  return [...picked].sort((a, b) => a - b);
}
