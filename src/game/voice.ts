/**
 * Modular dialogue voice layer.
 *
 * The game talks to a `SpeechProvider` interface only, so the built-in
 * browser Web Speech (SpeechSynthesis) provider can later be swapped for a
 * server-backed TTS API without touching any UI code: implement
 * `SpeechProvider` and call `setSpeechProvider(myProvider)` once at boot.
 */

export interface VoiceProfile extends StudioHints {
  /** 0.1 – 2. Lower = deeper. */
  pitch: number;
  /** 0.5 – 1.5 multiplier applied on top of the player's speed setting. */
  rate: number;
  /** Preferred browser-voice flavour, matched loosely against voice names. */
  prefer?: "female" | "male" | "any";
  /** Extra name hints, tried in order against the browser's voice list. */
  hints?: string[];
}

export interface SpeakHandlers {
  /** Fired as the engine crosses a word boundary — used for synced subtitles. */
  onProgress?: (charIndex: number) => void;
  onStart?: () => void;
  onEnd?: () => void;
  /** Voice unavailable / failed. Subtitles must stay readable regardless. */
  onError?: () => void;
}

/** Studio voice hints, ignored by the browser engine. */
export interface StudioHints {
  /** Named gateway voice, e.g. "onyx". Derived from the profile when absent. */
  apiVoice?: string;
  /** Delivery direction, e.g. "gruff veteran, clipped and dry". */
  direction?: string;
}

export interface SpeechProvider {
  readonly id: string;
  supported(): boolean;
  speak(text: string, profile: VoiceProfile, handlers: SpeakHandlers): void;
  cancel(): void;
}

/* ------------------------------------------------------------------ */
/* Browser SpeechSynthesis provider (free, no API key)                 */
/* ------------------------------------------------------------------ */

function synth(): SpeechSynthesis | null {
  if (typeof window === "undefined") return null;
  return window.speechSynthesis ?? null;
}

let cachedVoices: SpeechSynthesisVoice[] = [];

function voices(): SpeechSynthesisVoice[] {
  const s = synth();
  if (!s) return [];
  const list = s.getVoices();
  if (list.length) cachedVoices = list;
  return cachedVoices;
}

if (typeof window !== "undefined" && window.speechSynthesis) {
  // Chrome populates the list asynchronously.
  window.speechSynthesis.onvoiceschanged = () => void voices();
}

const FEMALE_HINTS = ["female", "samantha", "victoria", "karen", "moira", "fiona", "serena", "tessa", "zira", "google uk english female"];
const MALE_HINTS = ["male", "daniel", "alex", "fred", "oliver", "arthur", "rishi", "david", "google uk english male"];

function pickVoice(profile: VoiceProfile): SpeechSynthesisVoice | undefined {
  const all = voices();
  if (!all.length) return undefined;
  const english = all.filter((v) => v.lang.toLowerCase().startsWith("en"));
  const pool = english.length ? english : all;
  const tryHints = (hints: string[]) => pool.find((v) => hints.some((h) => v.name.toLowerCase().includes(h)));

  const byHint = profile.hints ? tryHints(profile.hints.map((h) => h.toLowerCase())) : undefined;
  if (byHint) return byHint;
  if (profile.prefer === "female") {
    const v = tryHints(FEMALE_HINTS);
    if (v) return v;
  }
  if (profile.prefer === "male") {
    const v = tryHints(MALE_HINTS);
    if (v) return v;
  }
  return pool[0];
}

export const browserSpeech: SpeechProvider = {
  id: "web-speech",
  supported: () => Boolean(synth()),
  speak(text, profile, handlers) {
    const s = synth();
    if (!s) {
      handlers.onError?.();
      return;
    }
    try {
      s.cancel();
      const u = new SpeechSynthesisUtterance(stripForSpeech(text));
      const voice = pickVoice(profile);
      if (voice) u.voice = voice;
      u.pitch = clamp(profile.pitch, 0.1, 2);
      u.rate = clamp(profile.rate * globalRate, 0.5, 2);
      u.volume = clamp(globalVolume, 0, 1);
      u.onstart = () => handlers.onStart?.();
      u.onend = () => handlers.onEnd?.();
      u.onerror = () => handlers.onError?.();
      u.onboundary = (e) => handlers.onProgress?.(e.charIndex);
      s.speak(u);
    } catch {
      handlers.onError?.();
    }
  },
  cancel() {
    try {
      synth()?.cancel();
    } catch {
      /* ignore */
    }
  },
};

/* ------------------------------------------------------------------ */
/* Lovable AI gateway provider (natural voices, works in every browser)*/
/* ------------------------------------------------------------------ */

const API_VOICES = ["alloy", "ash", "ballad", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer"] as const;
const FEMALE_API = ["coral", "nova", "shimmer", "sage", "alloy"];
const MALE_API = ["onyx", "ash", "echo", "fable", "ballad"];

function apiVoiceFor(profile: VoiceProfile): string {
  if (profile.apiVoice && (API_VOICES as readonly string[]).includes(profile.apiVoice)) return profile.apiVoice;
  const pool = profile.prefer === "female" ? FEMALE_API : profile.prefer === "male" ? MALE_API : API_VOICES.slice();
  // Deeper profiles pick from the deeper end of the pool, deterministically.
  const idx = Math.min(pool.length - 1, Math.max(0, Math.round((1 - clamp(profile.pitch, 0.5, 1.6) / 1.6) * (pool.length - 1))));
  return pool[idx] ?? "alloy";
}

export const gatewaySpeech: SpeechProvider = {
  id: "lovable-tts",
  supported: () => typeof window !== "undefined" && typeof window.Audio === "function",
  speak(text, profile, handlers) {
    const clean = stripForSpeech(text);
    const controller = new AbortController();
    activeAbort?.abort();
    activeAbort = controller;
    stopAudio();

    fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: clean,
        voice: apiVoiceFor(profile),
        speed: clamp(profile.rate * globalRate, 0.5, 1.6),
        ...(profile.direction ? { instructions: profile.direction } : {}),
      }),
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(String(res.status));
        const url = URL.createObjectURL(await res.blob());
        if (controller.signal.aborted) {
          URL.revokeObjectURL(url);
          return;
        }
        const audio = new Audio(url);
        audio.volume = clamp(globalVolume, 0, 1);
        activeAudio = audio;
        const cleanup = () => {
          URL.revokeObjectURL(url);
          if (activeAudio === audio) activeAudio = null;
        };
        audio.onplay = () => handlers.onStart?.();
        audio.ontimeupdate = () => {
          if (!audio.duration || !isFinite(audio.duration)) return;
          handlers.onProgress?.(Math.floor((audio.currentTime / audio.duration) * clean.length));
        };
        audio.onended = () => {
          cleanup();
          handlers.onEnd?.();
        };
        audio.onerror = () => {
          cleanup();
          handlers.onError?.();
        };
        await audio.play();
      })
      .catch((err) => {
        if ((err as Error)?.name === "AbortError") return;
        // Fall back to the browser engine so a line is never silent-and-stuck.
        if (browserSpeech.supported()) browserSpeech.speak(text, profile, handlers);
        else handlers.onError?.();
      });
  },
  cancel() {
    activeAbort?.abort();
    activeAbort = null;
    stopAudio();
    browserSpeech.cancel();
  },
};

let activeAudio: HTMLAudioElement | null = null;
let activeAbort: AbortController | null = null;

function stopAudio() {
  if (!activeAudio) return;
  try {
    activeAudio.pause();
    activeAudio.src = "";
  } catch {
    /* ignore */
  }
  activeAudio = null;
}

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

export type VoiceEngine = "studio" | "browser";

let provider: SpeechProvider = gatewaySpeech;
let enabled = false;
let globalRate = 1;
let globalVolume = 0.9;

export function setSpeechProvider(p: SpeechProvider) {
  provider.cancel();
  provider = p;
}

export function speechProviderId(): string {
  return provider.id;
}

export function setVoiceEngine(engine: VoiceEngine) {
  const next = engine === "browser" ? browserSpeech : gatewaySpeech;
  if (next === provider) return;
  provider.cancel();
  provider = next;
}

export function configureVoice(on: boolean, rate: number, volume: number) {
  enabled = on;
  globalRate = clamp(rate, 0.5, 1.6);
  globalVolume = clamp(volume, 0, 1);
  if (!on) provider.cancel();
}

export function voiceSupported(): boolean {
  return provider.supported();
}

export function speakLine(text: string, profile: VoiceProfile, handlers: SpeakHandlers = {}): boolean {
  if (!enabled || !provider.supported()) return false;
  provider.speak(text, profile, handlers);
  return true;
}

export function stopSpeech() {
  provider.cancel();
}

/** Strip quote marks and pixel-glyph noise so the engine reads cleanly. */
export function stripForSpeech(text: string): string {
  return text
    .replace(/[«»"“”]/g, "")
    .replace(/[—–]/g, ", ")
    .replace(/[▶❖·]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}
