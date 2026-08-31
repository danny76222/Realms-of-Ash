import { LOCATIONS } from "./world";
import type { GameState } from "./types";

/* ------------------------------------------------------------------ */
/* Weather                                                             */
/* ------------------------------------------------------------------ */

export type WeatherId = "clear" | "overcast" | "rain" | "storm" | "snow" | "fog";

export interface Weather {
  id: WeatherId;
  name: string;
  glyph: string;
  /** Flavour line shown when arriving somewhere. */
  line: string;
  /** Multiplier applied to road ambush odds. */
  ambushMul: number;
  /** CSS filter applied to location/map art. */
  filter: string;
  /** Overlay class used for falling rain/snow etc. */
  fx: "none" | "rain" | "storm" | "snow" | "fog";
}

export const WEATHERS: Record<WeatherId, Weather> = {
  clear: {
    id: "clear",
    name: "Clear",
    glyph: "clear",
    line: "Clear sky, hard light, and a road you can see the end of.",
    ambushMul: 0.85,
    filter: "saturate(1.05) brightness(1.03)",
    fx: "none",
  },
  overcast: {
    id: "overcast",
    name: "Overcast",
    glyph: "overcast",
    line: "Flat grey overhead. The realm looks like it is thinking something over.",
    ambushMul: 1,
    filter: "saturate(0.85) brightness(0.95)",
    fx: "none",
  },
  rain: {
    id: "rain",
    name: "Rain",
    glyph: "rain",
    line: "Steady rain. Cloaks soak through, bowstrings sulk, and nobody hears you coming.",
    ambushMul: 1.35,
    filter: "saturate(0.8) brightness(0.85) contrast(1.05)",
    fx: "rain",
  },
  storm: {
    id: "storm",
    name: "Storm",
    glyph: "storm",
    line: "Wind with teeth in it. Thunder walks the hills and the road empties.",
    ambushMul: 1.6,
    filter: "saturate(0.7) brightness(0.72) contrast(1.15)",
    fx: "storm",
  },
  snow: {
    id: "snow",
    name: "Snow",
    glyph: "snow",
    line: "Snow, quiet and patient. Tracks last for hours and so do grudges.",
    ambushMul: 1.2,
    filter: "saturate(0.65) brightness(1.06) contrast(0.95)",
    fx: "snow",
  },
  fog: {
    id: "fog",
    name: "Fog",
    glyph: "fog",
    line: "Fog to the knees. The world ends twenty paces out and starts again without warning.",
    ambushMul: 1.45,
    filter: "saturate(0.6) brightness(0.95) contrast(0.85)",
    fx: "fog",
  },
};

function hash(...parts: (string | number)[]): number {
  let h = 2166136261 >>> 0;
  const s = parts.join("|");
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

/**
 * Weather is a pure function of the world seed, the day, and where you stand,
 * so it survives saves without storing anything and stays consistent while the
 * player pokes around one place. The far north snows; the marshes fog.
 */
export function weatherAt(seed: number, day: number, locationId: string): Weather {
  const loc = LOCATIONS[locationId];
  const north = (loc?.y ?? 50) < 28;
  const south = (loc?.y ?? 50) > 62;
  const roll = hash(seed, Math.floor(day), north ? "n" : south ? "s" : "m") % 100;

  if (north) {
    if (roll < 26) return WEATHERS.snow;
    if (roll < 40) return WEATHERS.fog;
    if (roll < 52) return WEATHERS.rain;
    if (roll < 60) return WEATHERS.storm;
    if (roll < 78) return WEATHERS.overcast;
    return WEATHERS.clear;
  }
  if (south) {
    if (roll < 22) return WEATHERS.fog;
    if (roll < 42) return WEATHERS.rain;
    if (roll < 52) return WEATHERS.storm;
    if (roll < 72) return WEATHERS.overcast;
    return WEATHERS.clear;
  }
  if (roll < 20) return WEATHERS.rain;
  if (roll < 28) return WEATHERS.storm;
  if (roll < 36) return WEATHERS.fog;
  if (roll < 60) return WEATHERS.overcast;
  return WEATHERS.clear;
}

export function weatherOf(state: GameState, locationId?: string): Weather {
  return weatherAt(state.seed, state.day, locationId ?? state.locationId);
}

/* ------------------------------------------------------------------ */
/* Day / night cycle                                                   */
/* ------------------------------------------------------------------ */

export type Phase = "dawn" | "morning" | "midday" | "afternoon" | "dusk" | "night";

export interface TimeOfDay {
  hour: number;
  phase: Phase;
  label: string;
  /** CSS filter for the sky/scene at this hour. */
  filter: string;
  /** Extra ambush multiplier: the dark is not on your side. */
  ambushMul: number;
}

export function hourOf(state: GameState): number {
  const h = (state as { hour?: number }).hour;
  return typeof h === "number" ? ((h % 24) + 24) % 24 : 8;
}

export function timeOfDay(hour: number): TimeOfDay {
  const h = ((Math.floor(hour) % 24) + 24) % 24;
  const mk = (phase: Phase, label: string, filter: string, ambushMul: number): TimeOfDay => ({ hour: h, phase, label, filter, ambushMul });
  if (h < 5) return mk("night", "dead of night", "brightness(0.55) saturate(0.6) hue-rotate(-18deg)", 1.5);
  if (h < 8) return mk("dawn", "first light", "brightness(0.9) saturate(1.1) hue-rotate(8deg)", 1.1);
  if (h < 11) return mk("morning", "morning", "brightness(1.02) saturate(1.02)", 0.9);
  if (h < 14) return mk("midday", "midday", "brightness(1.06) saturate(1.05)", 0.85);
  if (h < 17) return mk("afternoon", "afternoon", "brightness(1) saturate(1)", 0.95);
  if (h < 20) return mk("dusk", "dusk", "brightness(0.85) saturate(1.15) sepia(0.12)", 1.2);
  return mk("night", "night", "brightness(0.6) saturate(0.65) hue-rotate(-14deg)", 1.45);
}

export function timeOf(state: GameState): TimeOfDay {
  return timeOfDay(hourOf(state));
}

/** Combined scene grading for a place: weather first, then the light. */
export function sceneFilter(state: GameState, locationId?: string): string {
  return `${weatherOf(state, locationId).filter} ${timeOf(state).filter}`;
}

/** Existing CSS tint classes only know four phases. */
export function tintClass(phase: Phase): "tint-dawn" | "tint-day" | "tint-dusk" | "tint-night" {
  if (phase === "dawn") return "tint-dawn";
  if (phase === "dusk") return "tint-dusk";
  if (phase === "night") return "tint-night";
  return "tint-day";
}
