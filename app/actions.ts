"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isValidObjectId } from "mongoose";
import { checkBatch } from "@/lib/deck";
import { generateCards } from "@/lib/gemini";
import dbConnect from "@/lib/mongodb";
import { requireSession } from "@/lib/session";
import { SUBJECTS, type Subject } from "@/lib/subjects";
import type { Segment } from "@/lib/timer";
import Flashcard from "@/models/Flashcard";
import StudySession from "@/models/StudySession";
import UserConfig from "@/models/UserConfig";

export type LogInput = {
  subject: Subject;
  durationMinutes: number;
  presetName: string;
  microGoals: { text: string; completed: boolean }[];
};

export async function logSession(input: LogInput) {
  await requireSession();
  await dbConnect();
  // Fields picked one by one so a crafted request can't set completedAt or extra keys; the schema validates the values.
  await StudySession.create({
    subject: input.subject,
    durationMinutes: input.durationMinutes,
    presetName: input.presetName,
    microGoals: input.microGoals.map((g) => ({ text: g.text, completed: g.completed })),
  });
  revalidatePath("/");
}

export async function saveSettings(formData: FormData) {
  await requireSession();
  await dbConnect();
  const examDate = String(formData.get("examDate") ?? "");
  await UserConfig.findOneAndUpdate(
    {},
    {
      displayName: String(formData.get("displayName") ?? "").trim() || "Future RMT",
      examDate: examDate ? new Date(examDate) : null, // "YYYY-MM-DD" parses as UTC midnight
      encouragementNotes: String(formData.get("notes") ?? "")
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 50),
    },
    { upsert: true, runValidators: true },
  );
  revalidatePath("/");
  redirect("/");
}

export async function addPreset(name: string, segments: Segment[]) {
  await requireSession();
  if (!Array.isArray(segments) || segments.length < 1 || segments.length > 20) {
    throw new Error("A preset needs 1–20 segments");
  }
  await dbConnect();
  const id = randomUUID();
  await UserConfig.findOneAndUpdate(
    {},
    { $push: { customPresets: { id, name, segments: segments.map((s) => ({ type: s.type, minutes: s.minutes })) } } },
    { upsert: true, runValidators: true },
  );
  revalidatePath("/");
  return id;
}

export async function deletePreset(id: string) {
  await requireSession();
  await dbConnect();
  await UserConfig.updateOne({}, { $pull: { customPresets: { id: String(id) } } });
  revalidatePath("/");
}

// Returns a message instead of throwing: production builds hide thrown error text from the browser.
// FormData fields: subject, notes, files (0–5 PDFs/photos; the browser has already cut PDFs to the chosen pages),
// multipleChoice ("1" = cards get 3 wrong options each).
export async function generateFlashcards(formData: FormData): Promise<{ count: number } | { error: string }> {
  await requireSession();
  const subject = String(formData.get("subject") ?? "") as Subject;
  const text = String(formData.get("notes") ?? "").trim();
  const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (!SUBJECTS.includes(subject)) return { error: "Pick a subject first." };
  const problem = checkBatch(text, files);
  if (problem) return { error: problem };

  let generated;
  try {
    const uploads = await Promise.all(
      files.map(async (f) => ({ mimeType: f.type, data: Buffer.from(await f.arrayBuffer()).toString("base64") })),
    );
    generated = await generateCards(subject, text, uploads, formData.get("multipleChoice") === "1");
  } catch (err) {
    console.error("Gemini generation failed:", err);
    if (!process.env.GEMINI_API_KEY) return { error: "No Gemini API key yet. Add GEMINI_API_KEY to .env.local." };
    return { error: "Gemini couldn't make cards right now. Try again in a minute." };
  }
  if (!generated.cards.length) return { error: "No usable cards came back. Try notes with more concrete facts, or clearer photos." };

  await dbConnect();
  await Flashcard.insertMany(generated.cards.map((c) => ({ ...c, subject, topicTitle: generated.topicTitle })));
  revalidatePath("/");
  return { count: generated.cards.length };
}

// "Got it" retires the card to mastered; "Needs review" keeps it learning, and the fresh lastReviewedAt
// sends it to the back of the due queue.
export async function rateCard(id: string, gotIt: boolean) {
  await requireSession();
  if (!isValidObjectId(id)) throw new Error("Bad card id");
  await dbConnect();
  await Flashcard.updateOne(
    { _id: id },
    { $set: { status: gotIt ? "mastered" : "learning", lastReviewedAt: new Date() }, $inc: { reviewCount: 1 } },
  );
  revalidatePath("/");
}

export async function deleteCard(id: string) {
  await requireSession();
  if (!isValidObjectId(id)) throw new Error("Bad card id");
  await dbConnect();
  await Flashcard.deleteOne({ _id: id });
  revalidatePath("/");
}
