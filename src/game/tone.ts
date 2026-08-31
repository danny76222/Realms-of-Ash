import { FACTION_IDS, FACTIONS } from "./world";
import { relationOf } from "./state";
import type { FactionId, GameState } from "./types";

export type WorldMood = "peace" | "tense" | "war";

export interface WorldTone {
  /** Number of wars burning between the six houses. */
  wars: number;
  mood: WorldMood;
  /** House whose colours the UI should fly, if the player has thrown in with one. */
  allegiance: { id: string; name: string; color: string } | null;
  /** Short line for the HUD banner. */
  label: string;
}

/**
 * Reads the state of the realm for visual purposes only: how warlike the world
 * has become, and whose banner the player is effectively flying. Screens use
 * this to grade their colour and fly the right heraldry.
 */
export function worldTone(s: GameState): WorldTone {
  let wars = 0;
  for (let i = 0; i < FACTION_IDS.length; i++) {
    for (let j = i + 1; j < FACTION_IDS.length; j++) {
      if (relationOf(s, FACTION_IDS[i]!, FACTION_IDS[j]!) === "war") wars++;
    }
  }
  const mood: WorldMood = wars >= 5 ? "war" : wars >= 2 ? "tense" : "peace";

  let best: FactionId | null = null;
  let bestRep = 24;
  for (const id of FACTION_IDS) {
    const rep = s.factions[id]?.rep ?? 0;
    if (rep > bestRep) {
      bestRep = rep;
      best = id;
    }
  }
  const f = best ? FACTIONS[best] : null;

  return {
    wars,
    mood,
    allegiance: f ? { id: f.id, name: f.name, color: f.color } : null,
    label: mood === "war" ? `${wars} wars burning` : mood === "tense" ? `${wars} borders in arms` : "an uneasy quiet",
  };
}

/** Rough time of day derived from the world clock, used for map tinting. */
export function dayPhase(day: number): "dawn" | "day" | "dusk" | "night" {
  const p = day % 4;
  return p === 0 ? "dawn" : p === 1 ? "day" : p === 2 ? "dusk" : "night";
}
