// Self-check for segment advancing: run with `npm run check:timer`.
import assert from "node:assert/strict";
import { PRESETS, catchUp } from "../lib/timer.ts";

const min = 60_000;
const stamina = PRESETS.find((p) => p.id === "stamina")!.segments; // 55 / 10 / 55 / 15
const end0 = 55 * min;

assert.deepEqual(catchUp(stamina, 0, end0, 10 * min), { index: 0, endAt: end0, done: false, crossed: 0 }, "mid-segment: no change");
assert.deepEqual(catchUp(stamina, 0, end0, end0), { index: 1, endAt: 65 * min, done: false, crossed: 1 }, "exactly at end: break starts, timed from old end");
assert.deepEqual(catchUp(stamina, 0, end0, 70 * min), { index: 2, endAt: 120 * min, done: false, crossed: 2 }, "hidden tab through focus + break: lands in block 2");
assert.deepEqual(catchUp(stamina, 3, 135 * min, 136 * min), { index: 3, endAt: 135 * min, done: true, crossed: 1 }, "last segment ends: done");
assert.equal(catchUp(stamina, 0, end0, 999 * min).done, true, "far past the end: done");

console.log("timer checks passed");
