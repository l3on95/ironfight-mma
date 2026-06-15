/**
 * IronFight MMA — Audio Engine (Hybrid: MP3 + Web Audio API)
 *
 * Glocken-Sounds: HTMLAudioElement mit den Original-MP3-Dateien.
 * Countdown-Tick: Web Audio API (kurz, kein Asset nötig).
 * Kein Keep-Alive-Loop → kein dauerhafter Lockscreen-Medienplayer.
 *
 * iOS-Verhalten:
 *  - Lockscreen-Player erscheint nur kurz während des Glockentons (~1-2 Sek.)
 *  - Spotify wird kurz unterbrochen, setzt danach automatisch wieder ein
 *  - AVAudioSession wird nach dem Ton freigegeben (kein dauerhafter Loop mehr)
 *
 * iOS-Grenzen (technisch nicht aus Web-Apps steuerbar):
 *  - AVAudioSession-Ducking (30 % Lautstärke) nur für native Apps
 *  - Safari erzwingt Playback-Kategorie; kein Ambient-Mixing möglich
 */

const BELL_URL      = "/audio/cartoon-music-soundtrack-boxing-bell-hit-double-489811.mp3";
const COUNTDOWN_URL = "/audio/lesiakower-countdown-sound-effect-8-bit-151797.mp3";

// ─── State ────────────────────────────────────────────────────────────────────

let _bell:      HTMLAudioElement | null = null;
let _countdown: HTMLAudioElement | null = null;
let _ctx:       AudioContext | null = null;

let _unlocked = false;
let _muted    = false;
let _vibrateEnabled = true;
const _unlockListeners = new Set<() => void>();

function notifyUnlock() {
  for (const l of _unlockListeners) l();
}

// ─── Exports ──────────────────────────────────────────────────────────────────

export function setAudioMuted(value: boolean) { _muted = value; }
export function isAudioUnlocked(): boolean    { return _unlocked; }
export function subscribeAudioUnlocked(cb: () => void): () => void {
  _unlockListeners.add(cb);
  return () => { _unlockListeners.delete(cb); };
}

/** No-op — rückwärtskompatibel */
export function initAudio(): void {}
/** No-op — Keep-Alive wurde entfernt */
export function stopKeepAlive(): void {}

// ─── AudioContext (für Countdown-Ticks) ───────────────────────────────────────

function getCtx(): AudioContext | null {
  if (_muted || typeof window === "undefined") return null;
  if (!_ctx) {
    _ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  if (_ctx.state === "suspended") _ctx.resume().catch(() => {});
  return _ctx.state === "running" ? _ctx : null;
}

// ─── Unlock ───────────────────────────────────────────────────────────────────

/**
 * Muss in einer User-Geste aufgerufen werden.
 * Aktiviert AudioContext und pre-buffert die MP3-Elemente für iOS.
 */
export async function unlockAudio(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (_unlocked) return true;

  // AudioContext für Countdown-Ticks resume
  if (!_ctx) {
    _ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  if (_ctx.state === "suspended") {
    try { await _ctx.resume(); } catch { /* ignore */ }
  }

  // MP3-Elemente lazy anlegen und kurz anspielen+pausieren → iOS Pre-Buffer
  if (!_bell) {
    _bell = new Audio(BELL_URL);
    _bell.preload = "auto";
  }
  if (!_countdown) {
    _countdown = new Audio(COUNTDOWN_URL);
    _countdown.preload = "auto";
  }
  for (const el of [_bell, _countdown]) {
    try { await el.play(); el.pause(); el.currentTime = 0; } catch { /* ignore */ }
  }

  _unlocked = true;
  notifyUnlock();
  return true;
}

// ─── MP3-Wiedergabe ───────────────────────────────────────────────────────────

function playMp3(el: HTMLAudioElement | null, volume: number): void {
  if (!el || !_unlocked || _muted) return;
  try {
    el.volume = Math.max(0, Math.min(1, volume));
    el.currentTime = 0;
    el.play().catch(() => {});
  } catch { /* ignore */ }
}

// ─── Web Audio Synth-Hilfsfunktionen (für Countdown-Tick) ────────────────────

function createGain(ctx: AudioContext, value: number): GainNode {
  const g = ctx.createGain();
  g.gain.value = value;
  g.connect(ctx.destination);
  return g;
}

function tone(
  ctx: AudioContext,
  output: GainNode,
  freq: number,
  startTime: number,
  duration: number,
  type: OscillatorType = "sine",
  attack = 0.01,
  release = 0.05,
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

function noiseBurst(ctx: AudioContext, output: GainNode, startTime: number, duration = 0.04) {
  const bufferSize = Math.ceil(ctx.sampleRate * duration);
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

/** Rundenstart — Boxing Bell (MP3) */
export function playRoundStart(): void { playMp3(_bell, 0.9); }

/** Rundenende — Boxing Bell (MP3) */
export function playRoundEnd(): void { playMp3(_bell, 0.85); }

/** Session-Ende — Boxing Bell (MP3) */
export function playSessionEnd(): void { playMp3(_bell, 0.85); }

/**
 * Countdown-Ton — MP3 wenn freigeschaltet, sonst synthetisch
 * @param volume 0..1
 */
export function playCountdownTick(volume = 1.0): void {
  const vol = Math.max(0.2, Math.min(1, volume));
  if (_unlocked && _countdown && !_muted) {
    playMp3(_countdown, vol * 0.9);
    return;
  }
  // Fallback: synthetischer Tick (funktioniert ohne vorherigen Unlock)
  const ctx = getCtx();
  if (!ctx) return;
  const master = createGain(ctx, vol * 0.5);
  const now = ctx.currentTime;
  tone(ctx, master, 1200, now, 0.04, "sine", 0.001, 0.02);
  noiseBurst(ctx, master, now, 0.02);
}

// ─── Vibration ────────────────────────────────────────────────────────────────

export function setVibrationEnabled(value: boolean) { _vibrateEnabled = value; }

function vibrate(pattern: number | number[]) {
  if (!_vibrateEnabled || typeof navigator === "undefined") return;
  const nav = navigator as Navigator & { vibrate?: (p: number | number[]) => boolean };
  try { nav.vibrate?.(pattern); } catch { /* ignore */ }
}

export function vibrateTick()       { vibrate(35); }
export function vibrateRoundEnd()   { vibrate([180, 80, 180]); }
export function vibrateSessionEnd() { vibrate([300, 120, 300, 120, 500]); }
