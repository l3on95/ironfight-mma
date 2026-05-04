/**
 * IronFight MMA — Audio Engine
 * Web Audio API — keine externen Assets nötig
 *
 * Sounds:
 *  playStartSignal()    → kraftvoller 3-Ton-Dreiklang (Runde beginnt)
 *  playEndSignal()      → absteigende Alarm-Sequenz (Runde/Session endet)
 *  playCountdownTick()  → kurzer präziser Tick (letzte 10 Sek. in Rest-Phase)
 *  playRestStart()      → weicher Gong-Ton (Pause beginnt)
 *  playPrepBeep()       → einfaches Prep-Beep
 */

let _ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!_ctx) {
    _ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (_ctx.state === 'suspended') {
    _ctx.resume();
  }
  return _ctx;
}

function createGain(ctx: AudioContext, value: number): GainNode {
  const g = ctx.createGain();
  g.gain.value = value;
  g.connect(ctx.destination);
  return g;
}

/** Einzelner Ton mit Hüllkurve */
function tone(
  ctx: AudioContext,
  output: GainNode,
  freq: number,
  startTime: number,
  duration: number,
  type: OscillatorType = 'sine',
  attack = 0.01,
  release = 0.05
) {
  const osc = ctx.createOscillator();
  const env = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);
  env.gain.setValueAtTime(0, startTime);
  env.gain.linearRampToValueAtTime(1, startTime + attack);
  env.gain.setValueAtTime(1, startTime + duration - release);
  env.gain.linearRampToValueAtTime(0, startTime + duration);

  osc.connect(env);
  env.connect(output);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.01);
}

/** Kurzer Noise-Burst für mehr Punch */
function noiseBurst(ctx: AudioContext, output: GainNode, startTime: number, duration = 0.04) {
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.3;

  const src = ctx.createBufferSource();
  src.buffer = buffer;

  const env = ctx.createGain();
  env.gain.setValueAtTime(1, startTime);
  env.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  src.connect(env);
  env.connect(output);
  src.start(startTime);
}

// ─── PUBLIC API ───────────────────────────────────────────────────────────────

/**
 * START-SIGNAL: Kraftvoller aufsteigender Dreiklang + Noise-Punch
 * Klingt wie: Boxglocke → "FIGHT!"
 */
export function playStartSignal() {
  const ctx = getCtx();
  const master = createGain(ctx, 0.7);
  const now = ctx.currentTime;

  // Aufsteigender Dreiklang
  tone(ctx, master, 440, now,        0.18, 'square', 0.005, 0.08);
  tone(ctx, master, 554, now + 0.20, 0.18, 'square', 0.005, 0.08);
  tone(ctx, master, 660, now + 0.40, 0.35, 'square', 0.005, 0.20);

  // Sub-Bass Punch
  tone(ctx, master, 80,  now,        0.10, 'sine', 0.002, 0.08);
  tone(ctx, master, 80,  now + 0.20, 0.10, 'sine', 0.002, 0.08);
  tone(ctx, master, 80,  now + 0.40, 0.10, 'sine', 0.002, 0.08);

  // Noise Burst für Punch
  noiseBurst(ctx, master, now);
  noiseBurst(ctx, master, now + 0.20);
  noiseBurst(ctx, master, now + 0.40);
}

/**
 * END-SIGNAL: Absteigende Alarm-Sequenz
 * Klingt wie: Schlussglocke → "Stop!"
 */
export function playEndSignal() {
  const ctx = getCtx();
  const master = createGain(ctx, 0.75);
  const now = ctx.currentTime;

  // Absteigend + wiederholend — unverkennbar als "Ende"
  const freqs = [880, 660, 880, 660, 440];
  freqs.forEach((f, i) => {
    tone(ctx, master, f, now + i * 0.15, 0.12, 'sawtooth', 0.005, 0.06);
    noiseBurst(ctx, master, now + i * 0.15, 0.03);
  });

  // Finaler langer Abschluss-Ton
  tone(ctx, master, 330, now + freqs.length * 0.15, 0.5, 'square', 0.01, 0.35);
}

/**
 * COUNTDOWN-TICK: Kurzer präziser Metronom-Klick
 * Wird 1x/Sekunde in den letzten 10 Sek. der Rest-Phase gespielt
 */
export function playCountdownTick() {
  const ctx = getCtx();
  const master = createGain(ctx, 0.5);
  const now = ctx.currentTime;

  tone(ctx, master, 1200, now, 0.04, 'sine', 0.001, 0.02);
  noiseBurst(ctx, master, now, 0.02);
}

/**
 * LAST-TICK: Lauterer Tick bei der allerletzten Sekunde (Sekunde 1)
 */
export function playLastTick() {
  const ctx = getCtx();
  const master = createGain(ctx, 0.8);
  const now = ctx.currentTime;

  tone(ctx, master, 1600, now, 0.06, 'square', 0.001, 0.03);
  noiseBurst(ctx, master, now, 0.03);
}

/**
 * REST-START: Weicher Gong-artiger Ton — Pause hat begonnen
 */
export function playRestStart() {
  const ctx = getCtx();
  const master = createGain(ctx, 0.5);
  const now = ctx.currentTime;

  // Gong: Grundton + Oberton abklingend
  tone(ctx, master, 220, now, 0.8, 'sine', 0.01, 0.6);
  tone(ctx, master, 440, now, 0.5, 'sine', 0.01, 0.4);
  tone(ctx, master, 330, now + 0.05, 0.4, 'sine', 0.01, 0.3);
}

/**
 * PREP-BEEP: Neutrales Beep für die Vorbereitungsphase
 */
export function playPrepBeep() {
  const ctx = getCtx();
  const master = createGain(ctx, 0.4);
  const now = ctx.currentTime;

  tone(ctx, master, 600, now, 0.1, 'sine', 0.005, 0.05);
}

/** Legacy-Alias — wird vom Timer-Hook für generische Beeps genutzt */
export const beep = playPrepBeep;
