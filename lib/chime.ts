let ctx: AudioContext | undefined;

// Call from a click: browsers only allow later, non-click sounds (segment end) after a user gesture.
export function unlockAudio() {
  ctx ??= new AudioContext();
  void ctx.resume();
}

// Soft marimba-like notes (sine + quiet 4th partial, fast decay), synthesized so no audio files ship.
export function chime(freqs: number[] = [523.25, 659.25, 783.99]) {
  unlockAudio();
  const c = ctx!;
  freqs.forEach((freq, i) => {
    const t = c.currentTime + i * 0.15;
    for (const [mult, vol, decay] of [[1, 0.2, 1.2], [4, 0.03, 0.3]]) {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.frequency.value = freq * mult;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(vol, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + decay);
      osc.connect(gain).connect(c.destination);
      osc.start(t);
      osc.stop(t + decay + 0.05);
    }
  });
}
