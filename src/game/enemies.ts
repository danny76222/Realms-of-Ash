import type { ClassId, UnitStats } from "./types";

export interface EnemyTemplate {
  id: string;
  name: string;
  classId: ClassId;
  sprite: string;
  family: "bandit" | "troop" | "monster" | "boss";
  tier: number;
  base: UnitStats;
  gold: number;
  xp: number;
  loot?: string[];
  skills?: string[];
  boss?: boolean;
  taunt?: string;
}

const E = (e: EnemyTemplate) => e;

export const ENEMIES: Record<string, EnemyTemplate> = Object.fromEntries(
  [
    /* bandits */
    E({ id: "cutpurse", name: "Cutpurse", classId: "scout", sprite: "bandit", family: "bandit", tier: 1, base: { maxHp: 24, atk: 8, def: 3, spd: 11 }, gold: 14, xp: 16, loot: ["old_coin"] }),
    E({ id: "brigand", name: "Brigand", classId: "warrior", sprite: "bandit", family: "bandit", tier: 1, base: { maxHp: 34, atk: 11, def: 5, spd: 6 }, gold: 20, xp: 22, loot: ["poultice"], skills: ["power_strike"] }),
    E({ id: "road_archer", name: "Road Archer", classId: "archer", sprite: "bandit", family: "bandit", tier: 2, base: { maxHp: 28, atk: 12, def: 3, spd: 9 }, gold: 22, xp: 24, skills: ["aimed_shot"] }),
    E({ id: "camp_boss", name: "Camp Headman", classId: "warrior", sprite: "bandit", family: "bandit", tier: 3, base: { maxHp: 62, atk: 15, def: 8, spd: 7 }, gold: 60, xp: 55, loot: ["arming_sword"], skills: ["power_strike", "rally"] }),

    /* faction troops */
    E({ id: "pact_pikeman", name: "Pact Pikeman", classId: "squire", sprite: "troop", family: "troop", tier: 2, base: { maxHp: 44, atk: 12, def: 10, spd: 5 }, gold: 26, xp: 30, skills: ["shield_bash"] }),
    E({ id: "pact_hammer", name: "Pact Hammerman", classId: "warrior", sprite: "troop", family: "troop", tier: 3, base: { maxHp: 56, atk: 16, def: 9, spd: 6 }, gold: 34, xp: 40, loot: ["mail_shirt"], skills: ["sunder", "power_strike"] }),
    E({ id: "ash_crossbow", name: "Ash Company Crossbow", classId: "archer", sprite: "troop", family: "troop", tier: 3, base: { maxHp: 38, atk: 17, def: 5, spd: 8 }, gold: 30, xp: 38, skills: ["aimed_shot"] }),
    E({ id: "sun_lancer", name: "Sunmarch Lancer", classId: "warrior", sprite: "troop", family: "troop", tier: 3, base: { maxHp: 50, atk: 15, def: 8, spd: 11 }, gold: 32, xp: 38, skills: ["power_strike"] }),
    E({ id: "thorn_bowman", name: "Thornwold Bowman", classId: "archer", sprite: "troop", family: "troop", tier: 2, base: { maxHp: 34, atk: 14, def: 4, spd: 10 }, gold: 24, xp: 30, skills: ["aimed_shot"] }),
    E({ id: "raven_guard", name: "Ravensfell Guard", classId: "squire", sprite: "troop", family: "troop", tier: 2, base: { maxHp: 48, atk: 12, def: 11, spd: 5 }, gold: 26, xp: 32, skills: ["bulwark"] }),
    E({ id: "mercenary", name: "Goldmere Mercenary", classId: "warrior", sprite: "troop", family: "troop", tier: 3, base: { maxHp: 52, atk: 15, def: 9, spd: 7 }, gold: 44, xp: 40, loot: ["old_coin"], skills: ["leech_cut"] }),

    /* monsters */
    E({ id: "fen_hound", name: "Fen Hound", classId: "scout", sprite: "monster", family: "monster", tier: 1, base: { maxHp: 30, atk: 11, def: 3, spd: 13 }, gold: 8, xp: 20 }),
    E({ id: "barrow_wight", name: "Barrow Wight", classId: "healer", sprite: "monster", family: "monster", tier: 3, base: { maxHp: 46, atk: 14, def: 7, spd: 8 }, gold: 30, xp: 44, loot: ["relic_shard"], skills: ["leech_cut"] }),
    E({ id: "mire_crawler", name: "Mire Crawler", classId: "warrior", sprite: "monster", family: "monster", tier: 2, base: { maxHp: 42, atk: 13, def: 6, spd: 7 }, gold: 12, xp: 30, skills: ["hamstring"] }),
    E({ id: "cave_troll", name: "Deep Troll", classId: "warrior", sprite: "monster", family: "monster", tier: 4, base: { maxHp: 90, atk: 19, def: 11, spd: 4 }, gold: 70, xp: 90, loot: ["relic_shard"], skills: ["executioner"] }),
    E({ id: "wolf_cultist", name: "Wolf Cultist", classId: "healer", sprite: "monster", family: "monster", tier: 2, base: { maxHp: 36, atk: 11, def: 5, spd: 9 }, gold: 18, xp: 28, skills: ["mend"] }),
    E({ id: "ember_shade", name: "Ember Shade", classId: "scout", sprite: "monster", family: "monster", tier: 4, base: { maxHp: 54, atk: 20, def: 6, spd: 14 }, gold: 40, xp: 70, skills: ["whirl"] }),

    /* named bosses */
    E({ id: "boss_maud", name: "Maud Kell, Ash Captain", classId: "warrior", sprite: "boss", family: "boss", tier: 4, boss: true, base: { maxHp: 130, atk: 21, def: 12, spd: 9 }, gold: 260, xp: 220, loot: ["war_ledger"], skills: ["rally", "executioner", "bulwark"], taunt: "\"Nothing personal. You just picked wrong.\"" }),
    E({ id: "boss_widow", name: "The Fen Widow", classId: "scout", sprite: "boss", family: "boss", tier: 5, boss: true, base: { maxHp: 120, atk: 24, def: 9, spd: 16 }, gold: 300, xp: 260, loot: ["relic_shard"], skills: ["hamstring", "vampiric_arc", "whirl"], taunt: "\"You have such a loud way of walking.\"" }),
    E({ id: "boss_ironhand", name: "Ser Gral Ironhand", classId: "squire", sprite: "boss", family: "boss", tier: 5, boss: true, base: { maxHp: 170, atk: 22, def: 18, spd: 6 }, gold: 320, xp: 280, loot: ["plate_harness"], skills: ["iron_will", "sunder", "power_strike"], taunt: "\"The Hammer builds. You only break.\"" }),
    E({ id: "boss_draeven", name: "Corvus Draeven, the Hammer", classId: "warrior", sprite: "boss", family: "boss", tier: 6, boss: true, base: { maxHp: 240, atk: 28, def: 16, spd: 10 }, gold: 800, xp: 600, loot: ["oath_blade"], skills: ["warlords_edge", "executioner", "storm_of_steel", "iron_will"], taunt: "\"I did not steal a crown. I picked one up off the floor.\"" }),
    E({ id: "boss_corvane", name: "Aldric Corvane, the Old Raven", classId: "warrior", sprite: "boss", family: "boss", tier: 6, boss: true, base: { maxHp: 210, atk: 25, def: 17, spd: 8 }, gold: 700, xp: 560, loot: ["oath_blade"], skills: ["rally", "iron_will", "executioner"], taunt: "\"I hoped you were better than this.\"" }),
    E({ id: "boss_coalition", name: "The Coalition Marshal", classId: "warrior", sprite: "boss", family: "boss", tier: 6, boss: true, base: { maxHp: 220, atk: 26, def: 15, spd: 9 }, gold: 700, xp: 560, skills: ["warlords_edge", "storm_of_steel"], taunt: "\"A realm with no king is a field with no fence.\"" }),
  ].map((e) => [e.id, e]),
);

export const DUNGEON_POOLS: Record<string, string[]> = {
  barrow_wood: ["fen_hound", "barrow_wight", "cutpurse", "mire_crawler"],
  north_barrows: ["barrow_wight", "cave_troll", "fen_hound"],
  drowned_chapel: ["barrow_wight", "mire_crawler", "wolf_cultist"],
  bandit_stones: ["cutpurse", "brigand", "road_archer", "camp_boss"],
  counting_ruin: ["cutpurse", "mercenary", "road_archer"],
  hollow_mine: ["pact_pikeman", "cave_troll", "pact_hammer"],
  cinder_pits: ["ember_shade", "pact_hammer", "ash_crossbow"],
  wolfden: ["fen_hound", "wolf_cultist", "cave_troll"],
  sunken_fort: ["barrow_wight", "mire_crawler", "pact_pikeman", "ember_shade"],
  black_stair: ["ember_shade", "cave_troll", "barrow_wight"],
};

/**
 * Named bosses that hold the deepest chamber of a dungeon, and the story flag
 * that must be set before they show up there.
 */
export const DUNGEON_BOSSES: Record<string, { enemyId: string; requiresFlag?: string; chamber: string }> = {
  black_stair: { enemyId: "boss_ironhand", requiresFlag: "branch_locked", chamber: "the Ironhand's forge-floor" },
  sunken_fort: { enemyId: "boss_widow", requiresFlag: "branch_locked", chamber: "the flooded keep-hall" },
  cinder_pits: { enemyId: "boss_maud", requiresFlag: "maud_spared", chamber: "the ash captain's pit" },
};


export const FACTION_TROOPS: Record<string, string[]> = {
  ravensfell: ["raven_guard", "road_archer"],
  goldmere: ["mercenary", "ash_crossbow"],
  ironpact: ["pact_pikeman", "pact_hammer", "ash_crossbow"],
  sunmarch: ["sun_lancer", "mercenary"],
  thornwold: ["thorn_bowman", "brigand"],
  freeholds: ["mercenary", "raven_guard"],
};
