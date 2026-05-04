/**
 * IronFight MMA — Audio Engine
 * Web Audio API — keine externen Assets nötig
 *
 * playStartSignal()   → aufsteigender Dreiklang + Bass (Runde startet)
 * playEndSignal()     → absteigende Alarm-Sequenz (Runde/Session endet)
 * playRestStart()     → weicher Gong (Pause beginnt)
 * playCountdownTick() → kurzer Metronom-Klick (letzte 10 Sek. in Rest)
 * playLastTick()      → lauterer Alarm-Tick (letzte Sekunde)
 * playPrepBeep()      → neutrales Vorbereitungs-Beep
 */

let _ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!_ctx) {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) throw new Error("Web Audio API nicht verfügbar");
    _ctx = new Ctor();
  }
  if (_ctx.state === "suspended") _ctx.resume();
  return _ctx;
}

function master(ctx: AudioContext, vol: number): GainNode {
  const g = ctx.createGain();
  g.gain.value = vol;
  g.connect(ctx.destination);
  return g;
}

function tone(
  ctx: AudioContext,
  out: GainNode,
  freq: number,
  t: number,
  dur: number,
  type: OscillatorType = "sine",
  attack = 0.01,
  release = 0.06,
) {
  const osc = ctx.createOscillator();
  const env = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  env.gain.setValueAtTime(0, t);
  env.gain.linearRampToValueAtTime(1, t + attack);
  env.gain.setValueAtTime(1, t + dur - release);
  env.gain.linearRampToValueAtTime(0, t + dur);
  osc.connect(env);
  env.connect(out);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

function noise(ctx: AudioContext, out: GainNode, t: number, dur = 0.04) {
  const n = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, n, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * 0.35;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const env = ctx.createGain();
  env.gain.setValueAtTime(1, t);
  env.gain.exponentialRampToValueAtTime(0.001, t + dur);
  src.connect(env);
  env.connect(out);
  src.start(t);
}

// ─── PUBLIC API ───────────────────────────────────────────────────────────────

/** Aufsteigender Dreiklang + Bass-Punch → Runde beginnt */
export function playStartSignal() {
  try {
    const ctx = getCtx();
    const m = master(ctx, 0.7);
    const now = ctx.currentTime;
    tone(ctx, m, 440, now,        0.16, "square", 0.005, 0.07);
    tone(ctx, m, 554, now + 0.19, 0.16, "square", 0.005, 0.07);
    tone(ctx, m, 660, now + 0.38, 0.32, "square", 0.005, 0.18);
    tone(ctx, m, 80,  now,        0.09, "sine",   0.002, 0.07);
    tone(ctx, m, 80,  now + 0.19, 0.09, "sine",   0.002, 0.07);
    tone(ctx, m, 80,  now + 0.38, 0.09, "sine",   0.002, 0.07);
    noise(ctx, m, now);
    noise(ctx, m, now + 0.19);
    noise(ctx, m, now + 0.38);
  } catch (_) { /* kein Audio — ignorieren */ }
}

/** Absteigende Alarm-Sequenz → Runde/Session endet */
export function playEndSignal() {
  try {
    const ctx = getCtx();
    const m = master(ctx, 0.75);
    const now = ctx.currentTime;
    const freqs = [880, 660, 880, 660, 440];
    freqs.forEach((f, i) => {
      tone(ctx, m, f, now + i * 0.15, 0.11, "sawtooth", 0.005, 0.06);
      noise(ctx, m, now + i * 0.15, 0.03);
    });
    tone(ctx, m, 330, now + freqs.length * 0.15, 0.5, "square", 0.01, 0.35);
  } catch (_) {}
}

/** Weicher Gong-Ton → Pause beginnt */
export function playRestStart() {
  try {
    const ctx = getCtx();
    const m = master(ctx, 0.5);
    const now = ctx.currentTime;
    tone(ctx, m, 220, now,       0.8, "sine", 0.01, 0.6);
    tone(ctx, m, 440, now,       0.5, "sine", 0.01, 0.4);
    tone(ctx, m, 330, now + 0.05, 0.4, "sine", 0.01, 0.3);
  } catch (_) {}
}

/** Kurzer Metronom-Klick → letzte 10 Sek. in Rest-Phase */
export function playCountdownTick() {
  try {
    const ctx = getCtx();
    const m = master(ctx, 0.45);
    const now = ctx.currentTime;
    tone(ctx, m, 1100, now, 0.035, "sine", 0.001, 0.02);
    noise(ctx, m, now, 0.02);
  } catch (_) {}
}

/** Lauterer Alarm-Tick → letzte Sekunde in Rest-Phase */
export function playLastTick() {
  try {
    const ctx = getCtx();
    const m = master(ctx, 0.85);
    const now = ctx.currentTime;
    tone(ctx, m, 1600, now, 0.055, "square", 0.001, 0.025);
    noise(ctx, m, now, 0.03);
  } catch (_) {}
}

/** Neutrales Vorbereitungs-Beep */
export function playPrepBeep() {
  try {
    const ctx = getCtx();
    const m = master(ctx, 0.4);
    const now = ctx.currentTime;
    tone(ctx, m, 600, now, 0.09, "sine", 0.005, 0.05);
  } catch (_) {}
}

// Legacy-Compat — verwenden alte Importe in use-workout-timer.ts
export function beep(freq = 600, _ms = 100) {
  playPrepBeep();
}

export async function beepSequence(
  _pattern: { freq: number; ms: number; gap?: number }[],
) {
  playEndSignal();
}
