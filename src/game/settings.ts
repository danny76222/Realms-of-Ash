import { useCallback, useEffect, useState } from "react";
import { configureSound } from "./sound";
import { configureMusic } from "./music";
import { configureVoice, setVoiceEngine, type VoiceEngine } from "./voice";

export interface Settings {
  animations: boolean;
  scanlines: boolean;
  bigText: boolean;
  sceneArt: boolean;
  sound: boolean;
  music: boolean;
  volume: number;
  typewriter: boolean;
  voice: boolean;
  voiceRate: number;
  voiceEngine: VoiceEngine;
}

const KEY = "roa.settings.v1";
const DEFAULTS: Settings = {
  animations: true,
  scanlines: true,
  bigText: false,
  sceneArt: true,
  sound: false,
  music: false,
  volume: 0.5,
  typewriter: true,
  voice: false,
  voiceRate: 1,
  voiceEngine: "studio",
};

export function readSettings(): Settings {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    return { ...DEFAULTS, ...(JSON.parse(localStorage.getItem(KEY) ?? "{}") as Partial<Settings>) };
  } catch {
    return DEFAULTS;
  }
}

function apply(s: Settings) {
  configureSound(s.sound, s.volume);
  configureMusic(s.music, s.volume);
  setVoiceEngine(s.voiceEngine);
  configureVoice(s.voice, s.voiceRate, Math.max(0.4, s.volume + 0.3));
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("no-anim", !s.animations);
  root.classList.toggle("scanlines", s.scanlines);
  root.classList.toggle("big-text", s.bigText);
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);

  useEffect(() => {
    const s = readSettings();
    setSettings(s);
    apply(s);
  }, []);

  const set = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      apply(next);
      return next;
    });
  }, []);

  return { settings, set };
}
