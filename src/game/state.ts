import { BACKGROUNDS, ITEMS } from "./data";
import { SAVE_VERSION, makeUnit, pick, rnd, unitStats, xpForLevel } from "./engine";
import { FACTIONS, FACTION_IDS, LOCATIONS, NPCS, relKey } from "./world";
import { timeOfDay, weatherAt } from "./weather";
import type {
  BackgroundId,
  Battle,
  ClassId,
  FactionId,
  GameState,
  RelationKind,
  WorldEvent,
} from "./types";

/* ---------------- creation ---------------- */

const INITIAL_RELATIONS: [FactionId, FactionId, RelationKind][] = [
  ["ravensfell", "ironpact", "war"],
  ["ravensfell", "goldmere", "peace"],
  ["ravensfell", "sunmarch", "alliance"],
  ["ravensfell", "thornwold", "peace"],
  ["ravensfell", "freeholds", "peace"],
  ["goldmere", "ironpact", "peace"],
  ["goldmere", "sunmarch", "peace"],
  ["goldmere", "thornwold", "peace"],
  ["goldmere", "freeholds", "alliance"],
  ["ironpact", "sunmarch", "war"],
  ["ironpact", "thornwold", "peace"],
  ["ironpact", "freeholds", "peace"],
  ["sunmarch", "thornwold", "war"],
  ["sunmarch", "freeholds", "peace"],
  ["thornwold", "freeholds", "peace"],
];

export function newGame(opts: {
  heroName: string;
  heroClass: ClassId;
  background: BackgroundId;
  portrait: string;
}): GameState {
  const bg = BACKGROUNDS[opts.background];
  const hero = makeUnit(opts.heroName.trim() || "Nameless", opts.heroClass, 1, true);
  hero.base = {
    maxHp: hero.base.maxHp + (bg.bonus.maxHp ?? 0),
    atk: hero.base.atk + (bg.bonus.atk ?? 0),
    def: hero.base.def + (bg.bonus.def ?? 0),
    spd: hero.base.spd + (bg.bonus.spd ?? 0),
  };
  hero.equipment.weapon = "rusty_sword";
  hero.hp = unitStats(hero).maxHp;

  const relations: Record<string, RelationKind> = {};
  for (const [a, b, kind] of INITIAL_RELATIONS) relations[relKey(a, b)] = kind;

  const factions = Object.fromEntries(
    FACTION_IDS.map((id) => [
      id,
      {
        strength: FACTIONS[id].strength,
        treasury: FACTIONS[id].treasury,
        rep: id === "ironpact" ? -10 : 0,
        territory: Object.values(LOCATIONS).filter((l) => l.faction === id).map((l) => l.id),
        lordId: FACTIONS[id].lordId,
      },
    ]),
  ) as GameState["factions"];

  const npcs = Object.fromEntries(
    Object.keys(NPCS).map((id) => [id, { affinity: 0, alive: true, recruited: false, met: false }]),
  ) as GameState["npcs"];

  return {
    version: SAVE_VERSION,
    seed: Math.floor(Math.random() * 1e9),
    heroName: hero.name,
    heroClass: opts.heroClass,
    background: opts.background,
    portrait: opts.portrait,
    day: 1,
    hour: 8,
    gold: bg.gold,
    renown: bg.renown,
    locationId: "oakhollow",
    party: [hero],
    inventory: { poultice: 2 },
    skillPoints: 0,
    quests: {},
    activeSide: [],
    branch: null,
    beatIndex: 0,
    storyFlags: { [bg.flag]: true },
    choiceHistory: [],
    factions,
    relations,
    npcs,
    marriedTo: null,
    clearedDungeons: [],
    dungeonRuns: {},
    worldEvents: [],
    log: ["You arrive in Oakhollow with a rusted sword and no reputation at all."],
    endingId: null,
  };
}

/* ---------------- small helpers ---------------- */

export function pushLog(state: GameState, line: string): GameState {
  return { ...state, log: [line, ...state.log].slice(0, 80) };
}

export function addItem(state: GameState, itemId: string, qty = 1): GameState {
  const inv = { ...state.inventory };
  inv[itemId] = (inv[itemId] ?? 0) + qty;
  if (inv[itemId]! <= 0) delete inv[itemId];
  return { ...state, inventory: inv };
}

export function flag(state: GameState, key: string): boolean | number | string | undefined {
  return state.storyFlags[key];
}

export function setFlags(state: GameState, flags: Record<string, boolean | number | string>): GameState {
  return { ...state, storyFlags: { ...state.storyFlags, ...flags } };
}

export function shiftRep(state: GameState, faction: FactionId, amount: number): GameState {
  const f = state.factions[faction];
  return {
    ...state,
    factions: {
      ...state.factions,
      [faction]: { ...f, rep: Math.max(-100, Math.min(100, f.rep + amount)) },
    },
  };
}

export function relationOf(state: GameState, a: FactionId, b: FactionId): RelationKind {
  return state.relations[relKey(a, b)] ?? "peace";
}

export function setRelation(state: GameState, a: FactionId, b: FactionId, kind: RelationKind): GameState {
  return { ...state, relations: { ...state.relations, [relKey(a, b)]: kind } };
}

export function shiftAffinity(state: GameState, npcId: string, amount: number): GameState {
  const n = state.npcs[npcId];
  if (!n) return state;
  return {
    ...state,
    npcs: { ...state.npcs, [npcId]: { ...n, affinity: Math.max(-100, Math.min(100, n.affinity + amount)), met: true } },
  };
}

export function killNpc(state: GameState, npcId: string): GameState {
  const n = state.npcs[npcId];
  if (!n) return state;
  return { ...state, npcs: { ...state.npcs, [npcId]: { ...n, alive: false } } };
}

export function recruitNpc(state: GameState, npcId: string): GameState {
  const n = state.npcs[npcId];
  const def = NPCS[npcId];
  if (!n || !def || n.recruited || state.party.length >= 4) return state;
  const cls: ClassId =
    def.role === "retainer" ? "warrior" : def.role === "cleric" ? "healer" : def.role === "rogue" ? "scout" : "archer";
  const unit = makeUnit(def.name, cls, Math.max(1, state.party[0]!.level), false);
  unit.npcId = npcId;
  return {
    ...state,
    party: [...state.party, unit],
    npcs: { ...state.npcs, [npcId]: { ...n, recruited: true, met: true } },
  };
}

export function partyLevel(state: GameState): number {
  return state.party[0]?.level ?? 1;
}

/* ---------------- rest & travel ---------------- */

export function restParty(state: GameState, fraction = 1): GameState {
  return {
    ...state,
    party: state.party.map((u) => ({
      ...u,
      hp: Math.min(unitStats(u).maxHp, Math.round(u.hp + unitStats(u).maxHp * fraction)),
    })),
  };
}

export function advanceDays(state: GameState, days: number): GameState {
  let s = { ...state, day: state.day + days };
  for (let i = 0; i < days; i++) s = simulateWorldDay(s);
  return s;
}

/** Move the clock. Days roll over at midnight and the world acts on each one. */
export function advanceHours(state: GameState, hours: number): GameState {
  const start = typeof state.hour === "number" ? state.hour : 8;
  const total = start + hours;
  const rolled = Math.floor(total / 24);
  let s: GameState = { ...state, hour: ((total % 24) + 24) % 24 };
  if (rolled > 0) s = advanceDays(s, rolled);
  return s;
}

/** A full night's sleep: the world moves a day, you wake at first light. */
export function sleepToMorning(state: GameState): GameState {
  return { ...advanceDays(state, 1), hour: 7 };
}

export function travelTo(state: GameState, destId: string): { state: GameState; ambush: string[] | null } {
  const dest = LOCATIONS[destId];
  if (!dest) return { state, ambush: null };
  let s: GameState = { ...state, locationId: destId };
  s = advanceHours(s, 5 + Math.floor(Math.random() * 5));
  s = restParty(s, 0.12);
  const sky = weatherAt(s.seed, s.day, destId);
  const light = timeOfDay(typeof s.hour === "number" ? s.hour : 8);
  s = pushLog(s, `Day ${s.day}, ${light.label}: the party reaches ${dest.name}. ${sky.name.toLowerCase()} on the road.`);

  const escortId = s.activeSide.find((q) => q.startsWith("escort"));
  if (escortId) {
    const q = s.quests[escortId];
    if (q?.status === "active") {
      const progress = q.progress + 1;
      s = { ...s, quests: { ...s.quests, [escortId]: { status: progress >= 2 ? "ready" : "active", progress } } };
    }
  }

  const base = dest.kind === "castle" ? 0.1 : dest.kind === "village" ? 0.24 : 0.36;
  const danger = Math.min(0.75, base * sky.ambushMul * light.ambushMul);
  if (Math.random() < danger) {
    const level = partyLevel(s);
    const pool: string[][] = [
      ["cutpurse", "cutpurse"],
      ["brigand", "cutpurse"],
      ["road_archer", "brigand"],
      ["brigand", "brigand", "road_archer"],
      ["camp_boss", "brigand", "road_archer"],
    ];
    return { state: s, ambush: pick(pool.slice(0, Math.min(pool.length, 2 + Math.floor(level / 3)))) };
  }
  return { state: s, ambush: null };
}

/* ---------------- world clock ---------------- */

function addEvent(state: GameState, ev: WorldEvent): GameState {
  return { ...state, worldEvents: [ev, ...state.worldEvents].slice(0, 40) };
}

export function simulateWorldDay(state: GameState): GameState {
  let s = state;
  if (Math.random() > 0.34) return s;

  const a = pick(FACTION_IDS);
  const b = pick(FACTION_IDS.filter((f) => f !== a));
  const rel = relationOf(s, a, b);
  const A = FACTIONS[a].name;
  const B = FACTIONS[b].name;
  const roll = Math.random();

  if (rel === "war") {
    if (roll < 0.5) {
      const loser = s.factions[a].strength >= s.factions[b].strength ? b : a;
      const winner = loser === a ? b : a;
      const hit = Math.round(rnd(2, 6));
      s = {
        ...s,
        factions: {
          ...s.factions,
          [loser]: { ...s.factions[loser], strength: Math.max(8, s.factions[loser].strength - hit) },
          [winner]: { ...s.factions[winner], treasury: s.factions[winner].treasury + hit * 30 },
        },
      };
      s = addEvent(s, {
        day: s.day,
        kind: "raid",
        text: `${FACTIONS[winner].name} raiders burn granaries in ${FACTIONS[loser].name} (-${hit} strength).`,
      });
      // territory can change hands
      if (Math.random() < 0.22) {
        const spoils = s.factions[loser].territory.filter((t) => LOCATIONS[t]?.kind === "village");
        if (spoils.length > 1) {
          const taken = pick(spoils);
          s = {
            ...s,
            factions: {
              ...s.factions,
              [loser]: { ...s.factions[loser], territory: s.factions[loser].territory.filter((t) => t !== taken) },
              [winner]: { ...s.factions[winner], territory: [...s.factions[winner].territory, taken] },
            },
          };
          s = addEvent(s, {
            day: s.day,
            kind: "territory",
            text: `${LOCATIONS[taken]!.name} now flies the banner of ${FACTIONS[winner].name}.`,
          });
        }
      }
    } else if (roll < 0.62) {
      s = setRelation(s, a, b, "peace");
      s = addEvent(s, { day: s.day, kind: "peace", text: `${A} and ${B} sign a grudging truce.` });
    }
  } else if (rel === "peace") {
    if (roll < 0.14) {
      s = setRelation(s, a, b, "war");
      s = addEvent(s, { day: s.day, kind: "war", text: `${A} declares war on ${B} over an old border claim.` });
    } else if (roll < 0.22) {
      s = setRelation(s, a, b, "alliance");
      s = addEvent(s, { day: s.day, kind: "alliance", text: `${A} and ${B} swear an alliance at a hasty feast.` });
    }
  } else if (rel === "alliance" && roll < 0.1) {
    s = setRelation(s, a, b, "peace");
    s = addEvent(s, { day: s.day, kind: "court", text: `The alliance between ${A} and ${B} quietly lapses.` });
  }

  // the usurper grows if unopposed
  if (Math.random() < 0.25) {
    const ip = s.factions.ironpact;
    const growth = s.storyFlags["draeven_checked"] ? 0 : 1;
    s = {
      ...s,
      factions: { ...s.factions, ironpact: { ...ip, strength: Math.min(140, ip.strength + growth) } },
    };
  }
  return s;
}

/* ---------------- battle aftermath ---------------- */

export function applyBattleResult(
  state: GameState,
  battle: Battle,
): { state: GameState; levelUps: string[] } {
  let s: GameState = { ...state, party: state.party.map((u) => ({ ...u })) };
  const levelUps: string[] = [];
  let gained = 0;

  for (const u of s.party) {
    const c = battle.combatants.find((x) => x.id === u.id);
    if (c) u.hp = Math.max(1, c.hp);
  }

  if (battle.status === "won") {
    for (const u of s.party) {
      u.xp += Math.round(battle.reward.xp * (u.isHero ? 1 : 0.8));
      while (u.xp >= xpForLevel(u.level)) {
        u.xp -= xpForLevel(u.level);
        u.level += 1;
        u.hp = unitStats(u).maxHp;
        levelUps.push(`${u.name} reaches level ${u.level}.`);
        if (u.isHero) gained += 1;
      }
      u.hp = Math.min(u.hp, unitStats(u).maxHp);
    }
    s.skillPoints += gained;
    s.gold += battle.reward.gold;
    const inv = { ...s.inventory };
    for (const l of battle.reward.loot) inv[l] = (inv[l] ?? 0) + 1;
    s.inventory = inv;
    s = pushLog(s, `Victory: ${battle.title}. +${battle.reward.gold} gold.`);
  } else if (battle.status === "lost") {
    const lost = Math.round(s.gold * 0.25);
    s.gold = Math.max(0, s.gold - lost);
    s = advanceDays(s, 2);
    s = restParty(s, 0.5);
    s = pushLog(s, `Defeat at ${battle.title}. You wake two days later, ${lost} gold lighter.`);
  } else if (battle.status === "fled") {
    s = pushLog(s, `You withdrew from ${battle.title}.`);
  }
  return { state: s, levelUps };
}

/* ---------------- shops / equipment ---------------- */

export function buyItem(state: GameState, itemId: string): GameState {
  const item = ITEMS[itemId];
  if (!item || state.gold < item.price) return state;
  return addItem({ ...state, gold: state.gold - item.price }, itemId, 1);
}

export function sellItem(state: GameState, itemId: string): GameState {
  const item = ITEMS[itemId];
  if (!item || !state.inventory[itemId]) return state;
  return addItem({ ...state, gold: state.gold + Math.round(item.price * 0.5) }, itemId, -1);
}

export function equipItem(state: GameState, unitId: string, itemId: string): GameState {
  const item = ITEMS[itemId];
  if (!item || (item.kind !== "weapon" && item.kind !== "armor")) return state;
  const slot = item.kind === "weapon" ? "weapon" : "armor";
  let s = addItem(state, itemId, -1);
  s = {
    ...s,
    party: s.party.map((u) => {
      if (u.id !== unitId) return u;
      const prev = u.equipment[slot];
      if (prev) s = addItem(s, prev, 1);
      return { ...u, equipment: { ...u.equipment, [slot]: itemId } };
    }),
  };
  return s;
}

export function useItemOutOfBattle(state: GameState, itemId: string, unitId: string): GameState {
  const item = ITEMS[itemId];
  if (!item || !state.inventory[itemId] || item.kind !== "potion") return state;
  let s = addItem(state, itemId, -1);
  s = {
    ...s,
    party: s.party.map((u) =>
      u.id === unitId ? { ...u, hp: Math.min(unitStats(u).maxHp, u.hp + (item.hp ?? 0)) } : u,
    ),
  };
  return s;
}

export function learnSkill(state: GameState, skillId: string): GameState {
  if (state.skillPoints <= 0) return state;
  const hero = state.party[0];
  if (!hero || hero.skills.includes(skillId)) return state;
  return {
    ...state,
    skillPoints: state.skillPoints - 1,
    party: state.party.map((u) => (u.isHero ? { ...u, skills: [...u.skills, skillId] } : u)),
  };
}
