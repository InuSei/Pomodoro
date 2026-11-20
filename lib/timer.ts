// Same shape as UserConfig.customPresets so custom presets (Phase 3) drop straight in.
export type Segment = { type: "focus" | "break"; minutes: number };
export type Preset = { id: string; name: string; segments: Segment[] };

const f = (minutes: number): Segment => ({ type: "focus", minutes });
const b = (minutes: number): Segment => ({ type: "break", minutes });

export const PRESETS: Preset[] = [
  { id: "micro", name: "Brain-Fog Micro-Sprint", segments: [f(20), b(5)] },
  { id: "classic", name: "Classic Balanced", segments: [f(45), b(10)] },
  { id: "deep", name: "Deep Dive", segments: [f(60), b(15)] },
  { id: "stamina", name: "Board Stamina Block", segments: [f(55), b(10), f(55), b(15)] },
];

export const segmentMs = (s: Segment) => s.minutes * 60_000;

/**
 * Where the clock should be at `now`, given that segment `index` was due to end at `endAt`.
 * Each next segment starts at the previous one's end (not at `now`), so time spent in a
 * throttled background tab still counts and segments are never stretched.
 */
export function catchUp(segments: Segment[], index: number, endAt: number, now: number) {
  let crossed = 0;
  while (endAt <= now) {
    crossed++;
    if (index + 1 >= segments.length) return { index, endAt, done: true, crossed };
    index++;
    endAt += segmentMs(segments[index]);
  }
  return { index, endAt, done: false, crossed };
}
