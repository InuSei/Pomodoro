import dbConnect from "./mongodb";
import { SUBJECTS, type Subject } from "./subjects";
import type { DeckCard } from "./deck";
import type { Preset } from "./timer";
import Flashcard from "@/models/Flashcard";
import StudySession from "@/models/StudySession";
import UserConfig from "@/models/UserConfig";

// Returns the single config document as plain data (safe to pass to client components), creating it on first use.
export async function getConfig() {
  await dbConnect();
  const c = (await UserConfig.findOneAndUpdate(
    {},
    {},
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
  ).lean())!;
  return {
    displayName: c.displayName,
    examDate: c.examDate ? c.examDate.toISOString() : null,
    customPresets: c.customPresets.map((p) => ({
      id: p.id,
      name: p.name,
      segments: p.segments.map((s) => ({ type: s.type, minutes: s.minutes })),
    })) as Preset[],
    encouragementNotes: [...c.encouragementNotes],
  };
}

// Focus minutes and logged blocks per subject over the last 7 days (rolling, so no week-start timezone issues).
export async function weeklyBalance() {
  await dbConnect();
  const rows = await StudySession.aggregate<{ _id: string; minutes: number; blocks: number }>([
    { $match: { completedAt: { $gte: new Date(Date.now() - 7 * 86_400_000) } } },
    { $group: { _id: "$subject", minutes: { $sum: "$durationMinutes" }, blocks: { $sum: 1 } } },
  ]);
  return SUBJECTS.map((subject) => {
    const r = rows.find((x) => x._id === subject);
    return { subject, minutes: r?.minutes ?? 0, blocks: r?.blocks ?? 0 };
  });
}

// shortcut: loads the whole deck (newest 2000) into the page; page it from the DB if the deck ever gets huge.
export async function getDeck(): Promise<DeckCard[]> {
  await dbConnect();
  const cards = await Flashcard.find().sort({ createdAt: -1 }).limit(2000).lean();
  return cards.map((c) => ({
    id: String(c._id),
    subject: c.subject as Subject,
    topicTitle: c.topicTitle ?? "",
    question: c.question,
    answer: c.answer,
    highYieldTip: c.highYieldTip ?? "",
    status: c.status as DeckCard["status"],
    lastReviewedAt: c.lastReviewedAt ? c.lastReviewedAt.toISOString() : null,
  }));
}

