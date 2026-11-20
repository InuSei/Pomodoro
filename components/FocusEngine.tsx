"use client";

import { useEffect, useEffectEvent, useState } from "react";
import { Heart, Pause, Play, Plus, RotateCcw, SkipForward, Trash2, Volume2, VolumeX } from "lucide-react";
import { PRESETS, catchUp, segmentMs, type Preset, type Segment } from "@/lib/timer";
import { SUBJECTS, SUBJECT_SHORT, type Subject } from "@/lib/subjects";
import { chime, unlockAudio } from "@/lib/chime";
import { addPreset, deletePreset, logSession, type LogInput } from "@/app/actions";
import { dueOrder, type DeckCard } from "@/lib/deck";
import MicroGoals, { type Goal } from "./MicroGoals";
import QuickRecall from "./QuickRecall";

const fmt = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

const RING_R = 120;
const RING_C = 2 * Math.PI * RING_R;

const iconBtn =
  "rounded-full border border-line bg-surface p-3 text-muted transition-colors hover:bg-accent-soft hover:text-fg";
const smallBtn = "rounded-full border border-line bg-surface px-3 py-1 text-sm font-bold hover:bg-accent-soft";
const field = "rounded-xl border border-line bg-bg px-3 py-2 text-fg";

type Props = { customPresets: Preset[]; notes: string[]; deck: DeckCard[] };

export default function FocusEngine({ customPresets, notes, deck }: Props) {
  const presets = [...PRESETS, ...customPresets];
  const [subject, setSubject] = useState<Subject>(SUBJECTS[0]);
  const [presetId, setPresetId] = useState(PRESETS[0].id);
  const preset = presets.find((p) => p.id === presetId) ?? PRESETS[0];
  const segments = preset.segments;
  const isCustom = customPresets.some((p) => p.id === presetId);

  const [index, setIndex] = useState(0);
  const [endAt, setEndAt] = useState<number | null>(null); // only set while running
  const [left, setLeft] = useState(segmentMs(segments[0]));
  const [done, setDone] = useState(false);
  const [sound, setSound] = useState(true);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [offer, setOffer] = useState<LogInput | null>(null); // an unfinished focus block the user may log
  const [unsaved, setUnsaved] = useState<LogInput[]>([]); // logs that failed to reach the database
  const [builderOpen, setBuilderOpen] = useState(false);
  const [builderError, setBuilderError] = useState<string | null>(null);
  const [noteSeed] = useState(() => Math.floor(Math.random() * 1000));
  const [restored, setRestored] = useState(false);
  const [recallCards, setRecallCards] = useState<DeckCard[] | null>(null);

  const running = endAt !== null;
  const seg = segments[index];
  const total = segmentMs(seg);
  const inSession = !done && (running || index > 0 || left < total);

  // Survive a refresh or closed tab: restore once on mount, then save on every change. If segments ended
  // while the tab was closed, the tick below catches up and logs those focus blocks.
  // shortcut: sound + timer state in localStorage like the theme; spec wanted IndexedDB, only needed for big data like wallpapers.
  useEffect(() => {
    setSound(localStorage.sound !== "off");
    try {
      const saved = JSON.parse(localStorage.timer ?? "null");
      const p = saved && presets.find((x) => x.id === saved.presetId);
      if (p && saved.index < p.segments.length && SUBJECTS.includes(saved.subject)) {
        setSubject(saved.subject);
        setPresetId(saved.presetId);
        setIndex(saved.index);
        setEndAt(saved.endAt);
        setLeft(saved.left);
        setDone(saved.done);
      }
      if (saved) {
        setGoals(saved.goals ?? []);
        setUnsaved(saved.unsaved ?? []);
      }
    } catch {
      // corrupt saved state: start fresh
    }
    setRestored(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- mount only

  useEffect(() => {
    if (restored) localStorage.timer = JSON.stringify({ subject, presetId, index, endAt, left, done, goals, unsaved });
  }, [restored, subject, presetId, index, endAt, left, done, goals, unsaved]);

  const entry = (minutes: number): LogInput => ({
    subject,
    durationMinutes: minutes,
    presetName: preset.name,
    microGoals: goals.map(({ text, completed }) => ({ text, completed })),
  });

  // Failed saves are kept (and survive refresh) with a Retry button rather than silently dropped.
  function send(e: LogInput) {
    logSession(e).catch(() => setUnsaved((u) => [...u, e]));
  }

  const onSegmentsEnded = useEffectEvent((ended: Segment[]) => {
    if (sound) chime();
    if (!ended.some((s) => s.type === "focus")) return;
    for (const s of ended) if (s.type === "focus") send(entry(s.minutes));
    // Quick recall: due cards from the subject just studied first, then other due cards.
    const due = deck.filter((c) => c.status === "learning").sort(dueOrder);
    const picks = [...due.filter((c) => c.subject === subject), ...due.filter((c) => c.subject !== subject)].slice(0, 3);
    setRecallCards(picks.length ? picks : null);
  });

  useEffect(() => {
    if (endAt === null) return;
    const tick = () => {
      const now = Date.now();
      const r = catchUp(segments, index, endAt, now);
      if (r.crossed) onSegmentsEnded(segments.slice(index, r.done ? segments.length : r.index));
      if (r.done) {
        setEndAt(null);
        setLeft(0);
        setDone(true);
      } else if (r.crossed) {
        setIndex(r.index);
        setEndAt(r.endAt); // re-runs this effect with the new segment
      } else {
        setLeft(endAt - now);
      }
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [endAt, index, segments]);

  useEffect(() => {
    if (!inSession) return;
    document.title = `[${running ? "" : "Paused "}${fmt(left)}] ${SUBJECT_SHORT[subject]} — RMT-Chan`;
    return () => void (document.title = "RMT-Chan");
  }, [inSession, running, left, subject]);

  // No-guilt stop: leaving a focus block early offers to log the whole minutes done so far.
  function offerPartial() {
    if (done || seg.type !== "focus") return;
    const minutes = Math.floor((total - (running ? endAt! - Date.now() : left)) / 60_000);
    if (minutes >= 1) setOffer(entry(minutes));
  }

  function reset(segs: Segment[] = segments) {
    setIndex(0);
    setEndAt(null);
    setLeft(segmentMs(segs[0]));
    setDone(false);
  }

  function start() {
    unlockAudio();
    if (done) {
      reset();
      setEndAt(Date.now() + segmentMs(segments[0]));
    } else {
      setEndAt(Date.now() + left);
    }
  }

  function pause() {
    setLeft(endAt! - Date.now());
    setEndAt(null);
  }

  function skip() {
    offerPartial();
    if (index + 1 >= segments.length) {
      setEndAt(null);
      setLeft(0);
      setDone(true);
      return;
    }
    const next = segmentMs(segments[index + 1]);
    setIndex(index + 1);
    setLeft(next);
    if (running) setEndAt(Date.now() + next);
  }

  function choosePreset(id: string) {
    offerPartial();
    setPresetId(id);
    reset((presets.find((p) => p.id === id) ?? PRESETS[0]).segments);
  }

  async function createPreset(fd: FormData) {
    const focus = Number(fd.get("focus"));
    const rest = Number(fd.get("break"));
    const segs = Array.from({ length: Number(fd.get("cycles")) }, (): Segment[] => [
      { type: "focus", minutes: focus },
      { type: "break", minutes: rest },
    ]).flat();
    try {
      const id = await addPreset(String(fd.get("name")).trim(), segs);
      offerPartial();
      setPresetId(id);
      reset(segs);
      setBuilderOpen(false);
      setBuilderError(null);
    } catch {
      setBuilderError("Couldn't save that preset. Try again?");
    }
  }

  async function removePreset() {
    if (!confirm(`Delete the "${preset.name}" preset?`)) return;
    await deletePreset(preset.id);
    setPresetId(PRESETS[0].id);
    reset(PRESETS[0].segments);
  }

  function toggleSound() {
    localStorage.sound = sound ? "off" : "on";
    setSound(!sound);
  }

  const focusCount = segments.filter((s) => s.type === "focus").length;
  const block = segments.slice(0, index + 1).filter((s) => s.type === "focus").length;
  const label = done
    ? "Session complete — lovely work!"
    : seg.type === "focus"
      ? `Focus${focusCount > 1 ? ` · Block ${block} of ${focusCount}` : ""}`
      : "Break — stretch & sip some water";
  const progress = done ? 1 : 1 - left / total;
  const note = seg.type === "break" && !done && notes.length ? notes[(noteSeed + index) % notes.length] : null;

  return (
    <section className="flex flex-col items-center gap-6 rounded-3xl border border-line bg-surface p-6 shadow-paper sm:p-8">
      <div role="group" aria-label="Subject" className="flex flex-wrap justify-center gap-2">
        {SUBJECTS.map((s) => (
          <button
            key={s}
            type="button"
            title={s}
            aria-pressed={s === subject}
            onClick={() => setSubject(s)}
            className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
              s === subject
                ? "border-accent bg-accent font-bold text-on-accent"
                : "border-line bg-surface text-fg hover:bg-accent-soft"
            }`}
          >
            {SUBJECT_SHORT[s]}
          </button>
        ))}
      </div>

      <div className="flex w-full flex-col items-center gap-3">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <label className="flex items-center gap-2 text-sm text-muted">
            Preset
            <select
              value={preset.id}
              disabled={running}
              onChange={(e) => choosePreset(e.target.value)}
              className={`${field} disabled:opacity-60`}
            >
              <optgroup label="Built-in">
                {PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} · {p.segments.map((s) => s.minutes).join("/")}
                  </option>
                ))}
              </optgroup>
              {customPresets.length > 0 && (
                <optgroup label="Your presets">
                  {customPresets.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} · {p.segments.length / 2}× {p.segments[0].minutes}/{p.segments[1]?.minutes}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </label>
          {isCustom && !running && (
            <button type="button" onClick={removePreset} aria-label={`Delete preset ${preset.name}`} className="rounded-full p-2 text-muted hover:bg-accent-soft hover:text-fg">
              <Trash2 className="size-4" aria-hidden />
            </button>
          )}
          {!running && (
            <button type="button" onClick={() => setBuilderOpen(!builderOpen)} aria-expanded={builderOpen} className={`${smallBtn} inline-flex items-center gap-1 text-muted`}>
              <Plus className="size-4" aria-hidden /> Custom
            </button>
          )}
        </div>

        {builderOpen && !running && (
          <form action={createPreset} className="grid w-full max-w-md grid-cols-3 gap-3 rounded-2xl border border-line bg-bg p-4 text-sm">
            <label className="col-span-3 flex flex-col gap-1">
              Name
              <input name="name" required maxLength={60} placeholder="e.g. Hema marathon" className={field} />
            </label>
            <label className="flex flex-col gap-1">
              Focus (min)
              <input name="focus" type="number" required min={1} max={240} defaultValue={25} className={field} />
            </label>
            <label className="flex flex-col gap-1">
              Break (min)
              <input name="break" type="number" required min={1} max={240} defaultValue={5} className={field} />
            </label>
            <label className="flex flex-col gap-1">
              Cycles
              <input name="cycles" type="number" required min={1} max={10} defaultValue={3} className={field} />
            </label>
            {builderError && (
              <p role="alert" className="col-span-3 rounded-lg bg-accent-soft px-3 py-2">
                {builderError}
              </p>
            )}
            <button type="submit" className="col-span-3 rounded-xl bg-accent px-4 py-2 font-bold text-on-accent hover:opacity-90">
              Save preset
            </button>
          </form>
        )}
      </div>

      <div className="relative size-64 sm:size-72">
        <svg viewBox="0 0 260 260" className="size-full -rotate-90" aria-hidden>
          <circle cx="130" cy="130" r={RING_R} fill="none" strokeWidth="10" className="stroke-accent-soft" />
          <circle
            cx="130"
            cy="130"
            r={RING_R}
            fill="none"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={RING_C}
            strokeDashoffset={RING_C * (1 - progress)}
            className={`transition-[stroke-dashoffset] duration-300 ease-linear ${done || seg.type === "focus" ? "stroke-accent" : "stroke-muted"}`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span role="timer" className="font-display text-6xl tabular-nums sm:text-7xl">
            {fmt(left)}
          </span>
          <span aria-live="polite" className="mt-2 max-w-48 text-sm text-muted">
            {label}
          </span>
        </div>
      </div>

      <ol aria-label="Session segments" className="flex w-full max-w-xs gap-1.5">
        {segments.map((s, i) => (
          <li
            key={i}
            style={{ flexGrow: s.minutes }}
            className={`h-2 rounded-full ${s.type === "focus" ? "bg-accent" : "bg-muted"} ${
              done || i < index ? "opacity-30" : i === index ? "" : "opacity-50"
            }`}
          >
            <span className="sr-only">
              {s.type} {s.minutes} minutes{i === index && !done ? " (current)" : ""}
            </span>
          </li>
        ))}
      </ol>

      {recallCards && (seg.type === "break" || done) && (
        <QuickRecall key={recallCards[0].id + index} cards={recallCards} onClose={() => setRecallCards(null)} />
      )}

      {note && (
        <p className="flex max-w-md items-start gap-2 rounded-2xl bg-accent-soft px-4 py-3">
          <Heart className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
          {note}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => {
            offerPartial();
            reset();
          }}
          aria-label="Reset session"
          className={iconBtn}
        >
          <RotateCcw className="size-5" aria-hidden />
        </button>
        <button
          type="button"
          onClick={running ? pause : start}
          className="flex items-center gap-2 rounded-full bg-accent px-8 py-3 text-lg font-bold text-on-accent transition-opacity hover:opacity-90"
        >
          {running ? <Pause className="size-5" aria-hidden /> : <Play className="size-5" aria-hidden />}
          {running ? "Pause" : done ? "Again" : inSession ? "Resume" : "Start"}
        </button>
        <button type="button" onClick={skip} disabled={done} aria-label="Skip to next segment" className={`${iconBtn} disabled:opacity-40`}>
          <SkipForward className="size-5" aria-hidden />
        </button>
        <button type="button" onClick={toggleSound} aria-label={sound ? "Mute chimes" : "Unmute chimes"} className={iconBtn}>
          {sound ? <Volume2 className="size-5" aria-hidden /> : <VolumeX className="size-5" aria-hidden />}
        </button>
      </div>

      <div role="status" className="flex flex-col items-center gap-2 empty:hidden">
        {offer && (
          <div className="flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-line bg-bg px-4 py-2 text-sm">
            <span>
              Log {offer.durationMinutes} min of {SUBJECT_SHORT[offer.subject]} anyway?
            </span>
            <button
              type="button"
              onClick={() => {
                send(offer);
                setOffer(null);
              }}
              className={smallBtn}
            >
              Log it
            </button>
            <button type="button" onClick={() => setOffer(null)} className={`${smallBtn} text-muted`}>
              No thanks
            </button>
          </div>
        )}
        {unsaved.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-2 rounded-2xl bg-accent-soft px-4 py-2 text-sm">
            <span>
              Couldn&apos;t save {unsaved.length} focus {unsaved.length === 1 ? "block" : "blocks"}.
            </span>
            <button
              type="button"
              onClick={() => {
                const pending = unsaved;
                setUnsaved([]);
                pending.forEach(send);
              }}
              className={smallBtn}
            >
              Retry
            </button>
          </div>
        )}
      </div>

      <div className="w-full max-w-md">
        <MicroGoals goals={goals} setGoals={setGoals} sound={sound} />
      </div>
    </section>
  );
}
