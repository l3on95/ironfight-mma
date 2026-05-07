/**
 * Tidal Athletics — Speech Engine
 *
 * Web Speech API wrapper für deutsche Trainings-Ansagen.
 * Client-only: alle Funktionen sind silent bei SSR oder nicht unterstützten Browsern.
 * Kein externes Paket nötig — nutzt den nativen Browser-Standard.
 *
 * Unterstützte Ankündigungen:
 *  - Übungsname beim Start
 *  - Pause-Ansage mit optionalem Vorschau der nächsten Übung
 *  - "Gleich: [Übung]" kurz vor Ende der Pause
 *  - "Los!" beim Übungsstart
 *  - "Fertig!" am Session-Ende
 */

let _enabled = true;

export function setSpeechEnabled(value: boolean): void {
  _enabled = value;
}

export function isSpeechEnabled(): boolean {
  return _enabled;
}

function getGermanVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined") return null;
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((v) => v.lang.startsWith("de") && v.localService) ??
    voices.find((v) => v.lang.startsWith("de")) ??
    voices[0] ??
    null
  );
}

function raw(text: string, rate = 0.95, pitch = 1.0, volume = 1.0): void {
  if (!_enabled || typeof window === "undefined") return;
  try {
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = "de-DE";
    utt.rate = rate;
    utt.pitch = pitch;
    utt.volume = volume;
    const voice = getGermanVoice();
    if (voice) utt.voice = voice;
    window.speechSynthesis.speak(utt);
  } catch {
    /* ignore — unsupported browser or policy block */
  }
}

/** Übungsname ankündigen (bei Phase-Start) */
export function speakExerciseName(name: string): void {
  raw(name, 0.88, 1.0);
}

/** Pause-Ansage, optional mit nächster Übung */
export function speakRest(nextName?: string): void {
  if (nextName) {
    raw(`Pause. Als nächstes: ${nextName}`, 0.88, 1.0);
  } else {
    raw("Pause", 0.88, 1.0);
  }
}

/** Kurz-Vorschau der nächsten Übung während laufender Pause */
export function speakUpcoming(name: string): void {
  raw(`Gleich: ${name}`, 0.9, 1.0);
}

/** Scharfes "Los!" beim Work-Start (schneller, höher) */
export function speakGo(): void {
  raw("Los!", 1.1, 1.2);
}

/** Session-Abschluss */
export function speakDone(): void {
  raw("Workout abgeschlossen! Gut gemacht.", 0.88, 1.0);
}

/** Laufende Sprachausgabe sofort stoppen */
export function cancelSpeech(): void {
  if (typeof window === "undefined") return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    /* ignore */
  }
}
