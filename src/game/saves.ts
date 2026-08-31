import { SAVE_VERSION } from "./engine";
import type { GameState } from "./types";

export interface SaveMeta {
  slot: number;
  name: string;
  heroName: string;
  heroClass: string;
  level: number;
  day: number;
  locationId: string;
  updated: string;
  cloud: boolean;
}

export interface SaveEntry extends SaveMeta {
  state: GameState;
}

const KEY = "roa_saves_v1";
export const SLOTS = [0, 1, 2, 3, 4, 5];

export function metaOf(state: GameState, slot: number, name: string, cloud = false): SaveMeta {
  return {
    slot,
    name,
    heroName: state.heroName,
    heroClass: state.heroClass,
    level: state.party[0]?.level ?? 1,
    day: state.day,
    locationId: state.locationId,
    updated: new Date().toISOString(),
    cloud,
  };
}

function readAll(): Record<string, SaveEntry> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(KEY) ?? "{}") as Record<string, SaveEntry>;
  } catch {
    return {};
  }
}

export function localSaves(): SaveEntry[] {
  return Object.values(readAll()).sort((a, b) => a.slot - b.slot);
}

export function localWrite(slot: number, name: string, state: GameState): void {
  const all = readAll();
  all[String(slot)] = { ...metaOf(state, slot, name), state };
  window.localStorage.setItem(KEY, JSON.stringify(all));
}

export function localDelete(slot: number): void {
  const all = readAll();
  delete all[String(slot)];
  window.localStorage.setItem(KEY, JSON.stringify(all));
}

export function migrate(state: GameState): GameState | null {
  if (!state || typeof state !== "object") return null;
  if (state.version !== SAVE_VERSION) return null;
  return state;
}
