import { pick, rnd } from "./engine";
import { DUNGEON_BOSSES, DUNGEON_POOLS, ENEMIES } from "./enemies";
import { ITEMS } from "./data";
import { FACTIONS, LOCATIONS, NPCS } from "./world";
import {
  addItem,
  advanceDays,
  killNpc,
  pushLog,
  recruitNpc,
  setFlags,
  setRelation,
  shiftAffinity,
  shiftRep,
} from "./state";
import type { FactionId, GameState, SideQuest, SideQuestKind, StoryBeat, StoryChoice } from "./types";

/* ---------------- story choices ---------------- */

export function applyChoice(state: GameState, beat: StoryBeat, choice: StoryChoice): GameState {
  let s = state;
  if (choice.flags) s = setFlags(s, choice.flags);
  if (choice.branch) s = { ...s, branch: choice.branch };
  if (choice.gold) s = { ...s, gold: s.gold + choice.gold };
  if (choice.renown) s = { ...s, renown: s.renown + choice.renown };
  for (const [fid, amount] of Object.entries(choice.rep ?? {})) {
    s = shiftRep(s, fid as FactionId, amount as number);
  }
  for (const n of choice.npc ?? []) {
    if (n.affinity) s = shiftAffinity(s, n.npcId, n.affinity);
    if (n.kill) s = killNpc(s, n.npcId);
    if (n.recruit) s = recruitNpc(s, n.npcId);
  }
  for (const r of choice.relations ?? []) s = setRelation(s, r.a, r.b, r.kind);

  s = {
    ...s,
    beatIndex: s.beatIndex + 1,
    choiceHistory: [
      ...s.choiceHistory,
      { beatId: beat.id, choiceId: choice.id, day: s.day, summary: `${beat.title}: ${choice.label}` },
    ],
  };
  s = pushLog(s, `${beat.title} — ${choice.label}.`);
  return advanceDays(s, 1);
}

/* ---------------- npc memory lines ---------------- */

export function npcMemoryLine(s: GameState, npcId: string): string | null {
  const npc = NPCS[npcId];
  if (!npc) return null;
  const st = s.npcs[npcId];
  if (!st) return null;
  const lines: string[] = [];

  if (npcId === "bram_carter") {
    if (s.storyFlags["helped_bram"]) lines.push('"You put yourself between me and three Pact men. I tell that story badly, but I tell it often."');
    if (s.storyFlags["pact_contact"]) lines.push('"I know what you took off them on the Oakhollow road. I know exactly what it bought."');
  }
  if (npcId === "lord_corvane") {
    if (s.storyFlags["ledger_exposed"]) lines.push('"You put the ledger in my hand. I have not had a peaceful hour since, and I thank you for it."');
    if (s.storyFlags["millford_saved"]) lines.push('"Millford eats this winter because of you. My levies know it."');
    if (s.storyFlags["looted_millford"]) lines.push('"A reeve in Millford is missing a strongbox. I am choosing, for now, not to look too hard."');
  }
  if (npcId === "lord_draeven") {
    if (s.storyFlags["ledger_sold"]) lines.push('"You sold me a clerk\'s life at a fair price and never once haggled. I found that restful."');
    if (s.branch === "loyalist") lines.push('"You chose the old men and their old debts. I confess I expected better arithmetic from you."');
  }
  if (npcId === "captain_maud") {
    if (s.storyFlags["maud_ransomed"]) lines.push('"You sold me back by weight. I have your habits written down now."');
    if (st.recruited) lines.push('"Still breathing. Still your problem."');
  }
  if (npcId === "osrick_quill" && s.storyFlags["ledger_kept"]) lines.push('"You still have my copies? Good. Use them on someone who has it coming."');
  if (npcId === "sister_dulcie" && s.storyFlags["list_used"]) lines.push('"I mend what I can. I do not have to be glad to see you."');

  if (s.marriedTo === npcId) lines.push('"You could at least write when you are off getting stabbed."');
  if (lines.length === 0) {
    if (st.affinity >= 40) lines.push(`"${s.heroName}. Sit. There is wine, and there is bad news, in that order."`);
    else if (st.affinity <= -30) lines.push('"Say what you came to say and then be somewhere else."');
  }
  return lines[0] ?? null;
}

/* ---------------- side quests ---------------- */

const KINDS: SideQuestKind[] = ["bandit", "delivery", "escort", "investigate", "rescue"];

const TITLES: Record<SideQuestKind, string[]> = {
  bandit: ["Clear the {t} Road", "Brigands at {t}", "The {t} Toll-Takers"],
  delivery: ["Cart to {t}", "Sealed Letter for {t}", "Salt and Silver to {t}"],
  escort: ["Escort the Envoy to {t}", "Ride Guard to {t}", "See the Widow Safe to {t}"],
  investigate: ["Something in {t}", "The {t} Question", "Whose Silver in {t}?"],
  rescue: ["The Missing of {t}", "Pull Them Out of {t}", "Hostages at {t}"],
};

const DESCS: Record<SideQuestKind, string> = {
  bandit: "Kill or scatter the band camped nearby. Bring back something identifiable.",
  delivery: "Carry the goods there without opening the crate. The crate is nailed shut for reasons.",
  escort: "Travel two legs of road with a passenger who talks the entire way.",
  investigate: "Ask questions in the right order and do not get caught asking the wrong one.",
  rescue: "Someone is being held. Get them out; getting them out politely is optional.",
};

export function generateSideQuests(s: GameState, locationId: string): SideQuest[] {
  const loc = LOCATIONS[locationId];
  if (!loc) return [];
  const seedBase = (s.seed % 9973) + locationId.length * 131 + Math.floor(s.day / 4) * 17;
  const out: SideQuest[] = [];
  const neighbours = loc.links.filter((l) => LOCATIONS[l]);
  const count = loc.kind === "castle" ? 3 : 2;
  for (let i = 0; i < count; i++) {
    const n = (seedBase + i * 71) % 1000;
    const kind = KINDS[n % KINDS.length]!;
    const target = neighbours[(n >> 3) % Math.max(1, neighbours.length)] ?? locationId;
    const tName = LOCATIONS[target]?.name ?? loc.name;
    const title = TITLES[kind][(n >> 5) % TITLES[kind].length]!.replace("{t}", tName);
    const lvl = Math.max(1, s.party[0]?.level ?? 1);
    out.push({
      id: `${kind}_${locationId}_${i}_${Math.floor(s.day / 4)}`,
      name: title,
      kind,
      giver: loc.npcs?.[0] ?? "",
      location: locationId,
      target,
      faction: loc.faction,
      need: kind === "escort" ? 2 : 1,
      desc: DESCS[kind],
      rewardGold: Math.round(60 + lvl * 28 + (n % 40)),
      rewardRenown: 2 + (n % 3),
      repShift: 3 + (n % 4),
      ...(loc.npcs?.[0] ? { npcShift: { npcId: loc.npcs[0]!, amount: 5 } } : {}),
    });
  }
  return out;
}

export function acceptQuest(s: GameState, q: SideQuest): GameState {
  if (s.activeSide.includes(q.id)) return s;
  return pushLog(
    { ...s, activeSide: [...s.activeSide, q.id], quests: { ...s.quests, [q.id]: { status: "active", progress: 0 } } },
    `Accepted: ${q.name}.`,
  );
}

export function completeQuest(s: GameState, q: SideQuest): GameState {
  let out: GameState = {
    ...s,
    gold: s.gold + q.rewardGold,
    renown: s.renown + q.rewardRenown,
    activeSide: s.activeSide.filter((id) => id !== q.id),
    quests: { ...s.quests, [q.id]: { status: "done", progress: 0 } },
  };
  if (q.faction && q.repShift) out = shiftRep(out, q.faction, q.repShift);
  if (q.npcShift) out = shiftAffinity(out, q.npcShift.npcId, q.npcShift.amount);
  // side work occasionally moves the world
  if (q.faction && Math.random() < 0.3) {
    const rival = (Object.keys(FACTIONS) as FactionId[]).filter((f) => f !== q.faction);
    const other = pick(rival);
    out = shiftRep(out, other, -2);
    out = pushLog(out, `Word of your work for ${FACTIONS[q.faction].name} reaches ${FACTIONS[other].name}, who are unimpressed.`);
  }
  return pushLog(out, `Completed: ${q.name}. +${q.rewardGold} gold, +${q.rewardRenown} renown.`);
}

export function questEnemies(q: SideQuest, level: number): string[] {
  const base: Record<SideQuestKind, string[]> = {
    bandit: ["brigand", "cutpurse", "road_archer"],
    delivery: ["cutpurse", "cutpurse"],
    escort: ["road_archer", "brigand"],
    investigate: ["mercenary", "cutpurse"],
    rescue: ["brigand", "camp_boss"],
  };
  const list = [...base[q.kind]];
  if (level >= 5) list.push(pick(["mercenary", "pact_pikeman", "fen_hound"]));
  return list;
}

/* ---------------- dungeons ---------------- */

export interface DungeonRoom {
  index: number;
  name: string;
  enemies: string[];
  loot: string[];
  gold: number;
}

const ROOM_NAMES = [
  "a collapsed antechamber",
  "a flooded stair",
  "a hall of broken benches",
  "a smoke-blackened forge floor",
  "a gallery of bad carvings",
  "a storeroom picked half clean",
  "a shaft with a rope still hanging",
  "a shrine somebody defaced twice",
];

export function generateDungeon(s: GameState, locationId: string): DungeonRoom[] {
  const loc = LOCATIONS[locationId];
  const pool = DUNGEON_POOLS[locationId] ?? ["cutpurse", "fen_hound"];
  const depth = loc?.depth ?? 3;
  const level = s.party[0]?.level ?? 1;
  const rooms: DungeonRoom[] = [];
  const boss = DUNGEON_BOSSES[locationId];
  const bossHere = !!boss && (!boss.requiresFlag || !!s.storyFlags[boss.requiresFlag]);
  for (let i = 0; i < depth; i++) {
    const last = i === depth - 1;
    const size = last ? 3 : 1 + Math.floor(Math.random() * 2) + (i > 1 ? 1 : 0);
    const enemies: string[] = [];
    for (let e = 0; e < size; e++) {
      const candidates = pool.filter((p) => !ENEMIES[p]?.boss);
      enemies.push(pick(candidates.length ? candidates : pool));
    }
    if (last && bossHere && boss) enemies[0] = boss.enemyId;
    const loot: string[] = [];
    const lootTable = ["poultice", "old_coin", "relic_shard", "strong_tonic", "luck_charm", "gambeson"];
    if (Math.random() < 0.55 || last) loot.push(pick(lootTable));
    if (last && Math.random() < 0.5) loot.push(pick(["arming_sword", "mail_shirt", "ranger_cloak", "war_axe"]));
    rooms.push({
      index: i,
      name: last ? (bossHere && boss ? boss.chamber : "the deepest chamber") : pick(ROOM_NAMES),
      enemies,
      loot,
      gold: Math.round(rnd(15, 45) * (1 + i * 0.4) * (1 + level * 0.08)),
    });
  }

  return rooms;
}

export function finishDungeon(s: GameState, locationId: string, gold: number, loot: string[]): GameState {
  let out: GameState = {
    ...s,
    gold: s.gold + gold,
    renown: s.renown + 4,
    clearedDungeons: s.clearedDungeons.includes(locationId) ? s.clearedDungeons : [...s.clearedDungeons, locationId],
    dungeonRuns: { ...s.dungeonRuns, [locationId]: (s.dungeonRuns[locationId] ?? 0) + 1 },
  };
  for (const l of loot) out = addItem(out, l, 1);
  const names = loot.map((l) => ITEMS[l]?.name ?? l).join(", ");
  return pushLog(out, `Cleared ${LOCATIONS[locationId]?.name}. +${gold} gold${names ? `, ${names}` : ""}.`);
}

/* ---------------- marriage ---------------- */

export function giveGift(s: GameState, npcId: string, itemId: string): GameState {
  const item = ITEMS[itemId];
  if (!item || !s.inventory[itemId]) return s;
  const worth = item.kind === "gift" ? Math.round(item.price / 20) + 4 : Math.round(item.price / 60) + 1;
  let out = addItem(s, itemId, -1);
  out = shiftAffinity(out, npcId, worth);
  return pushLog(out, `${NPCS[npcId]?.name ?? "They"} accepts the ${item.name}. (+${worth} regard)`);
}

export function canPropose(s: GameState, npcId: string): boolean {
  const npc = NPCS[npcId];
  const st = s.npcs[npcId];
  if (!npc?.eligible || !st?.alive || s.marriedTo) return false;
  return st.affinity >= 60 && s.renown >= 30;
}

export function marry(s: GameState, npcId: string): GameState {
  const npc = NPCS[npcId];
  if (!npc || !canPropose(s, npcId)) return s;
  let out: GameState = {
    ...s,
    marriedTo: npcId,
    npcs: { ...s.npcs, [npcId]: { ...s.npcs[npcId]!, married: true, affinity: Math.min(100, s.npcs[npcId]!.affinity + 15) } },
    renown: s.renown + 15,
  };
  out = setFlags(out, { married: true, [`married_${npcId}`]: true });
  if (npc.faction) {
    out = shiftRep(out, npc.faction, 25);
    out = pushLog(out, `You are wed to ${npc.name}. ${FACTIONS[npc.faction].name} now counts your fate with theirs.`);
  }
  return recruitNpc(out, npcId);
}
