// Self-check for segment advancing: run with `npm run check:timer`.
import assert from "node:assert/strict";
import { PRESETS, catchUp, randomOther } from "../lib/timer.ts";

const min = 60_000;
const stamina = PRESETS.find((p) => p.id === "stamina")!.segments; // 55 / 10 / 55 / 15
const end0 = 55 * min;

assert.deepEqual(catchUp(stamina, 0, end0, 10 * min), { index: 0, endAt: end0, done: false, crossed: 0 }, "mid-segment: no change");
assert.deepEqual(catchUp(stamina, 0, end0, end0), { index: 1, endAt: 65 * min, done: false, crossed: 1 }, "exactly at end: break starts, timed from old end");
assert.deepEqual(catchUp(stamina, 0, end0, 70 * min), { index: 2, endAt: 120 * min, done: false, crossed: 2 }, "hidden tab through focus + break: lands in block 2");
assert.deepEqual(catchUp(stamina, 3, 135 * min, 136 * min), { index: 3, endAt: 135 * min, done: true, crossed: 1 }, "last segment ends: done");
assert.equal(catchUp(stamina, 0, end0, 999 * min).done, true, "far past the end: done");

// Break notes: never the same one twice in a row, every note reachable, safe with 0–1 notes.
const seen = new Set<number>();
let prev = -1;
for (let i = 0; i < 2000; i++) {
  const next = randomOther(prev, 4);
  assert.ok(next >= 0 && next < 4, "in range");
  assert.notEqual(next, prev, "no back-to-back repeat");
  seen.add(next);
  prev = next;
}
assert.equal(seen.size, 4, "every note gets shown");
assert.equal(randomOther(0, 1), 0, "single note");
assert.equal(randomOther(-1, 0), 0, "no notes does not crash");
assert.ok(randomOther(7, 3) < 3, "stale index after notes shrink stays in range");

console.log("timer checks passed");
