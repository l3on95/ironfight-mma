/**
 * Tidal Athletics — Audio Engine
 *
 * Zwei MP3-Dateien:
 *   /audio/cartoon-music-soundtrack-boxing-bell-hit-double-489811.mp3 → Glocke
 *   /audio/lesiakower-countdown-sound-effect-8-bit-151797.mp3         → Countdown
 *
 * iOS-Safari/PWA-sicher durch 2-Stufen-Ladung:
 *   Stufe 1 (initAudio/onMount): fetch() → ArrayBuffer — KEIN AudioContext nötig
 *   Stufe 2 (unlockAudio/User-Geste): decodeAudioData() — braucht laufenden Context
 *
 * Wichtig: Kein synthetisierter Fallback — wenn Buffers noch nicht bereit sind,
 * wird der Ton einfach übersprungen (passiert nur in den ersten ~200 ms).
 */

const BELL_URL =
  "/audio/cartoon-music-soundtrack-boxing-bell-hit-double-489811.mp3";
const COUNTDOWN_URL =
  "/audio/lesiakower-countdown-sound-effect-8-bit-151797.mp3";

// ─── Zustandsvariablen ────────────────────────────────────────────────────

let _ctx: AudioContext | null = null;
let _unlocked = false;
let _muted = false;

// Stufe 1: Rohe Bytes — kein AudioContext nötig
let _bellArr: ArrayBuffer | null = null;
let _countdownArr: ArrayBuffer | null = null;
let _fetchState: "idle" | "loading" | "done" | "error" = "idle";

// Stufe 2: Dekodierte Buffer — braucht laufenden AudioContext
let _bellBuffer: AudioBuffer | null = null;
let _countdownBuffer: AudioBuffer | null = null;
let _decodeState: "idle" | "decoding" | "done" | "error" = "idle";

// ─── Exports für Settings ─────────────────────────────────────────────────

export function setAudioMuted(value: boolean) {
  _muted = value;
}

export function isAudioUnlocked() {
  return _unlocked;
}

// ─── AudioContext (lazy, nur nach User-Geste wirklich nutzbar auf iOS) ────

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!_ctx) {
    const Ctor =
      window.AudioContext ||
      (window as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return null;
    _ctx = new Ctor();
  }
  return _ctx;
}

// ─── Stufe 1: Fetch (kein AudioContext, kein User-Gesture nötig) ──────────

async function prefetch(): Promise<void> {
  if (_fetchState !== "idle") return;
  _fetchState = "loading";
  try {
    const [br, cr] = await Promise.all([
      fetch(BELL_URL),
      fetch(COUNTDOWN_URL),
    ]);
    if (!br.ok || !cr.ok) throw new Error("HTTP error");
    [_bellArr, _countdownArr] = await Promise.all([
      br.arrayBuffer(),
      cr.arrayBuffer(),
    ]);
    _fetchState = "done";
  } catch {
    _fetchState = "error";
  }
}

/**
 * Beim Timer-Mount aufrufen — lädt MP3-Rohdaten im Hintergrund vor.
 * Kein AudioContext nötig → iOS-safe.
 */
export function initAudio(): void {
  if (typeof window === "undefined") return;
  prefetch().catch(() => {});
}

// ─── Stufe 2: Decode (braucht laufenden AudioContext — nur nach User-Geste) ─

async function decode(ctx: AudioContext): Promise<void> {
  if (_decodeState !== "idle") return;
  if (!_bellArr || !_countdownArr) return;
  _decodeState = "decoding";
  try {
    // slice() weil decodeAudioData den Buffer transferiert
    [_bellBuffer, _countdownBuffer] = await Promise.all([
      ctx.decodeAudioData(_bellArr.slice(0)),
      ctx.decodeAudioData(_countdownArr.slice(0)),
    ]);
    _decodeState = "done";
  } catch {
    _decodeState = "error";
  }
}

// ─── Unlock + Decode (muss in User-Geste aufgerufen werden) ───────────────

/**
 * Innerhalb eines Click/Touch-Handlers aufrufen.
 * Entsperrt iOS-Audiopipeline UND dekodiert die MP3-Buffer.
 * Wartet auf Decode → danach sind alle Sounds sofort bereit.
 */
export async function unlockAudio(): Promise<boolean> {
  const ctx = getCtx();
  if (!ctx) return false;
  try {
    if (ctx.state === "suspended") {
      await ctx.resume();
    }
    // Stiller Buffer — entsperrt iOS-Pipeline
    const silent = ctx.createBuffer(1, 1, 22050);
    const src = ctx.createBufferSource();
    src.buffer = silent;
    src.connect(ctx.destination);
    src.start(0);

    _unlocked = true;

    // Jetzt dekodieren — Context ist running, User-Geste ist aktiv
    // Warten damit alle Sounds direkt nach Start bereit sind
    await decode(ctx);

    return true;
  } catch {
    _unlocked = true; // Auch ohne Decode als entsperrt markieren
    return true;
  }
}

// ─── Basis-Wiedergabe ─────────────────────────────────────────────────────

function playBuffer(
  buffer: AudioBuffer,
  volume: number,
  playbackRate = 1.0,
  delaySeconds = 0,
): void {
  if (!_unlocked || _muted) return;
  const ctx = getCtx();
  if (!ctx) return;

  // Context kann nach Tab-Wechsel suspendiert sein — resume versuchen
  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {});
    return; // Diesen Ton überspringen, nächster klappt dann
  }

  const gain = ctx.createGain();
  gain.gain.value = Math.max(0, Math.min(1, volume));
  gain.connect(ctx.destination);

  const src = ctx.createBufferSource();
  src.buffer = buffer;
  src.playbackRate.value = playbackRate;
  src.connect(gain);
  src.start(ctx.currentTime + delaySeconds);
}

// ─── PUBLIC API ───────────────────────────────────────────────────────────

/** Rundenstart — Boxing Bell */
export function playRoundStart(): void {
  if (!_bellBuffer) return;
  playBuffer(_bellBuffer, 0.9);
}

/** Rundenende — Boxing Bell (Datei enthält bereits Doppelglocke) */
export function playRoundEnd(): void {
  if (!_bellBuffer) return;
  playBuffer(_bellBuffer, 0.85);
}

/** Session-Ende — Bell zweimal mit Versatz */
export function playSessionEnd(): void {
  if (!_bellBuffer) return;
  playBuffer(_bellBuffer, 0.85, 1.0, 0);
  playBuffer(_bellBuffer, 0.85, 1.0, 0.9);
}

/** Pause-Start — leiser Glocken-Hinweis */
export function playRestStart(): void {
  if (!_bellBuffer) return;
  playBuffer(_bellBuffer, 0.4, 0.85);
}

/**
 * Countdown-Tick mit dynamischer Lautstärke
 * @param volume 0..1 — steigt in den letzten Sekunden an
 */
export function playCountdownTick(volume = 0.5): void {
  if (!_countdownBuffer) return;
  playBuffer(_countdownBuffer, Math.max(0.2, Math.min(1, volume)));
}

/** Letzter Tick — etwas lauter und schneller */
export function playLastTick(): void {
  if (!_countdownBuffer) return;
  playBuffer(_countdownBuffer, 1.0, 1.25);
}

/** Vorbereitungs-Beep — leiser Countdown-Ton */
export function playPrepBeep(): void {
  if (!_countdownBuffer) return;
  playBuffer(_countdownBuffer, 0.35, 0.9);
}

// ─── Tick-Lautstärke ─────────────────────────────────────────────────────

/**
 * Lautstärke für Countdown-Ticks — steigt in den letzten 10 Sek. an.
 */
export function tickVolumeForRemaining(remaining: number): number {
  if (remaining > 10 || remaining < 1) return 0.5;
  if (remaining <= 2) return 1.0;
  const t = (10 - remaining) / 7; // 0..1 von Sek. 10 bis Sek. 3
  return 0.3 + 0.65 * t;
}

// ─── Vibration ────────────────────────────────────────────────────────────

let _vibrateEnabled = true;

export function setVibrationEnabled(value: boolean) {
  _vibrateEnabled = value;
}

export function vibrate(pattern: number | number[]) {
  if (!_vibrateEnabled) return;
  if (typeof navigator === "undefined") return;
  const nav = navigator as Navigator & {
    vibrate?: (p: number | number[]) => boolean;
  };
  try {
    nav.vibrate?.(pattern);
  } catch {
    /* ignore */
  }
}

export function vibrateTick() {
  vibrate(35);
}

export function vibrateRoundEnd() {
  vibrate([180, 80, 180]);
}

export function vibrateSessionEnd() {
  vibrate([300, 120, 300, 120, 500]);
}
