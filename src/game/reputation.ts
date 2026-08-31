/**
 * Standing: what the realm, the houses and the villages think of you.
 *
 * This file is the ONE home for every number the reputation system reads
 * (Isles gate G171: a threshold has one home). If a rule elsewhere in
 * src/game/ compares standing against a magic number, that number belongs here
 * instead, so it can be tuned in one place and argued about once.
 *
 * The four tiers, per direction rulings 4 and 6:
 *
 *   fame      how big your name is. Rises on any deed, good or ill.
 *   honour    what colour that name is. Ruling 4: fame and virtue are separate.
 *   rep       standing with each of the six houses. Political, and it trades.
 *   standing  standing in each PLACE. Local, and it is what a zone reads.
 *
 * The point of keeping them apart is that the interesting positions are the
 * contradictory ones: famous across the realm and hated in the village you are
 * standing in.
 */
import type { FactionId, GameState, RelationKind } from "./types";

export const REPUTATION = {
  /** Every tier is clamped to this range, so one scale is learned once. */
  min: -100,
  max: 100,

  fame: {
    /** Fame never goes negative. An infamous hero is famous, not unknown. */
    min: 0,
    /** Above this the realm treats you as a power in your own right. */
    known: 30,
    renowned: 60,
    legendary: 85,
  },

  honour: {
    /** Below this, people who can afford scruples stop dealing with you. */
    blackened: -40,
    stained: -15,
    clean: 15,
    exemplary: 55,
  },

  /** How a shift with one house moves the others, through war and alliance. */
  bleed: {
    /** Helping a house costs you with anyone they are at war with. */
    war: -0.5,
    /** And earns a little with their allies. */
    alliance: 0.25,
    /** Peace is not friendship. Nothing carries across it. */
    peace: 0,
  },

  /** Ruling 5: houses forgive, by event and by slow decay toward neutral. */
  decay: {
    /** A house lets one point go every this many days. */
    houseEveryDays: 8,
    /** A place forgets slower than a court does. People live there. */
    placeEveryDays: 15,
    /** What both decay toward. Not friendship, just the absence of a grudge. */
    restingPoint: 0,
    /** Below this magnitude there is nothing left to forgive. */
    floor: 1,
  },

  /** Ruling 1: the world simulation reads the ledger instead of a flat roll. */
  events: {
    /** Chance of a day producing any event at all, at fame 0. */
    baseChance: 0.34,
    /** Added to that chance at maximum fame. An unknown lives a quiet life. */
    fameLift: 0.3,
    /** Weight a house gets simply for existing. */
    baseWeight: 1,
    /** Extra weight per point of ill will. Being hated draws attention. */
    weightPerOffence: 0.05,
    /** Extra weight per point of good will. Friends write less often than enemies. */
    weightPerFavour: 0.02,
    /** Multiplier for the house whose ground the player is standing on. */
    hereMultiplier: 2.2,
    /** Chance an event is aimed AT the player rather than between two houses. */
    aimedAtPlayerChance: 0.3,
  },

  /** What standing does to the road. The world reading the ledger on the ground. */
  road: {
    /** Ambush chance added at maximum fame: a known purse is worth taking. */
    fameDanger: 0.12,
    /** Added as honour falls to its floor: enemies made, and they remember. */
    dishonourDanger: 0.1,
    /** Subtracted where a place holds you in high regard and watches the road. */
    welcomeSafety: 0.1,
  },

  /** What a deed is worth. Kept here so quests and story beats agree. */
  award: {
    questFame: 0,
    questHonour: 1,
    questLocalStanding: 6,
    /** Killing a named person is unambiguous, so it is derived, not authored. */
    killHonour: -8,
    dungeonLocalStanding: 4,
  },
} as const;

export type StandingTier = "hated" | "resented" | "unknown" | "trusted" | "beloved";

export function clamp(
  value: number,
  lo: number = REPUTATION.min,
  hi: number = REPUTATION.max,
): number {
  return Math.max(lo, Math.min(hi, value));
}

/** Standing in one place. Absent means nobody there has an opinion yet. */
export function standingIn(state: GameState, locationId: string): number {
  return state.standing[locationId] ?? 0;
}

export function standingTier(value: number): StandingTier {
  if (value <= -50) return "hated";
  if (value <= -15) return "resented";
  if (value < 15) return "unknown";
  if (value < 50) return "trusted";
  return "beloved";
}

export function fameTier(fame: number): string {
  const f = REPUTATION.fame;
  if (fame >= f.legendary) return "legendary";
  if (fame >= f.renowned) return "renowned";
  if (fame >= f.known) return "known";
  return "unproven";
}

export function honourTier(honour: number): string {
  const h = REPUTATION.honour;
  if (honour <= h.blackened) return "blackened";
  if (honour <= h.stained) return "stained";
  if (honour < h.clean) return "unweighed";
  if (honour < h.exemplary) return "clean";
  return "exemplary";
}

/**
 * How much attention a house pays you. Being hated draws more of it than being
 * liked, which is why offence is weighted above favour.
 */
export function houseAttention(rep: number): number {
  const e = REPUTATION.events;
  const offence = Math.max(0, -rep) * e.weightPerOffence;
  const favour = Math.max(0, rep) * e.weightPerFavour;
  return e.baseWeight + offence + favour;
}

/**
 * How a shift with one house carries to another, given how the two stand.
 * Ruling 1's consequence: six independent numbers are bookkeeping, six numbers
 * that trade against each other are politics.
 */
export function bleedFactor(relation: RelationKind): number {
  const b = REPUTATION.bleed;
  if (relation === "war") return b.war;
  if (relation === "alliance") return b.alliance;
  return b.peace;
}

/**
 * The extra danger the road carries because of who you are. Reads fame,
 * honour and how the place you are entering regards you.
 */
export function roadDanger(state: GameState, locationId: string): number {
  const r = REPUTATION.road;
  const fameRisk = (state.fame / REPUTATION.max) * r.fameDanger;
  const dishonour = Math.max(0, -state.honour) / REPUTATION.max;
  const welcome = Math.max(0, standingIn(state, locationId)) / REPUTATION.max;
  return fameRisk + dishonour * r.dishonourDanger - welcome * r.welcomeSafety;
}

/** Which house holds the ground the player is standing on, if any. */
export function houseOfPlace(state: GameState, locationId: string): FactionId | null {
  for (const [id, f] of Object.entries(state.factions)) {
    if (f.territory.includes(locationId)) return id as FactionId;
  }
  return null;
}
