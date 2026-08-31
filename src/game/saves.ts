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

/**
 * Bring an older save forward instead of refusing it.
 *
 * CLAUDE.md calls the save version a trap, and it is: Danny plays this game
 * while building it, so dropping his campaign because a field was added is a
 * real cost. Each step is small and one-way, and anything older than the
 * oldest step here is genuinely unreadable and returns null.
 */
export function migrate(state: GameState): GameState | null {
  if (!state || typeof state !== "object") return null;
  let s = state as GameState & { renown?: number };

  // 5 -> 6: renown split into fame and honour (ruling 4), and standing became
  // per place as well as per house (ruling 6).
  if (s.version === 5) {
    s = {
      ...s,
      version: 6,
      fame: typeof s.renown === "number" ? s.renown : 0,
      honour: 0,
      standing: {},
    };
    delete s.renown;
  }

  if (s.version !== SAVE_VERSION) return null;
  // A save from before a field existed still has to satisfy the current shape.
  return {
    ...s,
    fame: typeof s.fame === "number" ? s.fame : 0,
    honour: typeof s.honour === "number" ? s.honour : 0,
    standing: s.standing && typeof s.standing === "object" ? s.standing : {},
  };
}
