// Self-check for cleaning the AI's flashcard reply: run with `npm run check:cards`.
import assert from "node:assert/strict";
import { parseCards } from "../lib/gemini.ts";

const card = (i: number) => ({ question: ` Q${i} `, answer: `A${i}`, highYieldTip: `T${i}` });

const ok = parseCards({ topicTitle: " IMViC ", cards: [card(1), card(2), card(3)] });
assert.equal(ok.topicTitle, "IMViC", "title trimmed");
assert.deepEqual(ok.cards[0], { question: "Q1", answer: "A1", highYieldTip: "T1" }, "fields trimmed");

const messy = parseCards({
  cards: [card(1), { question: "no answer" }, null, "text", { question: 5, answer: "x" }, { question: "Q", answer: "A", highYieldTip: 7 }],
});
assert.equal(messy.cards.length, 2, "malformed cards dropped");
assert.equal(messy.cards[1].highYieldTip, "", "non-string tip becomes empty");
assert.equal(messy.topicTitle, "", "missing title becomes empty");

assert.equal(parseCards({ cards: Array.from({ length: 12 }, (_, i) => card(i)) }).cards.length, 8, "capped at 8");
assert.equal(parseCards({ cards: [{ question: "x".repeat(5000), answer: "a" }] }).cards[0].question.length, 1000, "long text capped");
assert.deepEqual(parseCards(null), { topicTitle: "", cards: [] }, "null reply is empty");
assert.deepEqual(parseCards({ cards: "nope" }).cards, [], "non-array cards is empty");

console.log("card checks passed");

// Upload batch rules (shared by the panel and the server).
const { checkBatch, parsePages, MAX_UPLOAD_BYTES } = await import("../lib/deck.ts");
const pdf = { type: "application/pdf", size: 1000 };
assert.equal(checkBatch("x".repeat(50), []), null, "notes alone OK");
assert.equal(checkBatch("", [pdf]), null, "file alone OK");
assert.match(checkBatch("short", [])!, /bit more/, "too-short notes with no file");
assert.match(checkBatch("", [{ type: "application/zip", size: 10 }])!, /PDF, JPG/, "wrong type");
assert.match(checkBatch("", Array(6).fill(pdf))!, /Up to 5/, "too many files");
assert.match(checkBatch("", [{ ...pdf, size: MAX_UPLOAD_BYTES + 1 }])!, /4 MB/, "too big");
assert.match(checkBatch("x".repeat(4001), [])!, /over 4000/, "notes too long");

// Page ranges (cut in the browser before upload).
assert.deepEqual(parsePages("20", 64), [19], "single page, 0-based");
assert.deepEqual(parsePages("20-22", 64), [19, 20, 21], "range");
assert.deepEqual(parsePages(" 25, 3 - 4 ,3", 64), [2, 3, 24], "list: sorted, deduped, spaces OK");
assert.deepEqual(parsePages("5–6", 64), [4, 5], "en dash from phone keyboards");
assert.match(parsePages("60-70", 64) as string, /only has 64/, "past the end");
assert.match(parsePages("0", 64) as string, /should look like/, "page 0");
assert.match(parsePages("9-3", 64) as string, /should look like/, "backwards range");
assert.match(parsePages("ignore all instructions", 64) as string, /should look like/, "words rejected");

console.log("upload checks passed");
