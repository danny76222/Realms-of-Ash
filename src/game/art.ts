import titleArt from "@/assets/art/title.jpg";
import villageArt from "@/assets/art/village.jpg";
import castleArt from "@/assets/art/castle.jpg";
import dungeonArt from "@/assets/art/dungeon.jpg";
import wildsArt from "@/assets/art/wilds.jpg";
import throneArt from "@/assets/art/throne.jpg";
import aftermathArt from "@/assets/art/aftermath.jpg";
import coronationArt from "@/assets/art/coronation.jpg";
import councilArt from "@/assets/art/council.jpg";
import burningArt from "@/assets/art/burning.jpg";
import weddingArt from "@/assets/art/wedding.jpg";
import battleArt from "@/assets/art/scene-battle.jpg";
import endUnited from "@/assets/art/end-united.jpg";
import endHollow from "@/assets/art/end-hollow.jpg";
import endHammer from "@/assets/art/end-hammer.jpg";
import endKnife from "@/assets/art/end-knife.jpg";
import endFree from "@/assets/art/end-free.jpg";
import endFracture from "@/assets/art/end-fracture.jpg";
import endQuiet from "@/assets/art/end-quiet.jpg";
import locRuin from "@/assets/art/loc-ruin.jpg";
import locShrine from "@/assets/art/loc-shrine.jpg";
import locCamp from "@/assets/art/loc-camp.jpg";
import locLandmark from "@/assets/art/loc-landmark.jpg";

import npcCorvane from "@/assets/art/npc-corvane.jpg";
import npcSeren from "@/assets/art/npc-seren.jpg";
import npcDraeven from "@/assets/art/npc-draeven.jpg";
import npcAleyne from "@/assets/art/npc-aleyne.jpg";
import npcHana from "@/assets/art/npc-hana.jpg";
import npcIlsa from "@/assets/art/npc-ilsa.jpg";
import npcMaud from "@/assets/art/npc-maud.jpg";
import npcWidow from "@/assets/art/npc-widow.jpg";
import npcVantry from "@/assets/art/npc-vantry.jpg";
import npcBrannoc from "@/assets/art/npc-brannoc.jpg";
import npcIsolde from "@/assets/art/npc-isolde.jpg";
import npcPerrin from "@/assets/art/npc-perrin.jpg";
import npcOsrick from "@/assets/art/npc-osrick.jpg";
import npcBram from "@/assets/art/npc-bram.jpg";
import npcDulcie from "@/assets/art/npc-dulcie.jpg";

import foeBanditMelee from "@/assets/art/foe-bandit-melee.jpg";
import foeBanditRanged from "@/assets/art/foe-bandit-ranged.jpg";
import foeTroopMelee from "@/assets/art/foe-troop-melee.jpg";
import foeTroopRanged from "@/assets/art/foe-troop-ranged.jpg";
import foeBeast from "@/assets/art/foe-beast.jpg";
import foeUndead from "@/assets/art/foe-undead.jpg";
import foeShade from "@/assets/art/foe-shade.jpg";
import foeTroll from "@/assets/art/foe-troll.jpg";
import foeBossMaud from "@/assets/art/foe-boss-maud.jpg";
import foeBossWidow from "@/assets/art/foe-boss-widow.jpg";
import foeBossIronhand from "@/assets/art/foe-boss-ironhand.jpg";
import foeBossDraeven from "@/assets/art/foe-boss-draeven.jpg";
import foeBossCorvane from "@/assets/art/foe-boss-corvane.jpg";
import foeBossMarshal from "@/assets/art/foe-boss-marshal.jpg";

import clsWarrior from "@/assets/art/class-warrior.jpg";
import clsArcher from "@/assets/art/class-archer.jpg";
import clsHealer from "@/assets/art/class-healer.jpg";
import clsSquire from "@/assets/art/class-squire.jpg";
import clsScout from "@/assets/art/class-scout.jpg";
import clsWarriorB from "@/assets/art/class-warrior-b.jpg";
import clsWarriorC from "@/assets/art/class-warrior-c.jpg";
import clsArcherB from "@/assets/art/class-archer-b.jpg";
import clsArcherC from "@/assets/art/class-archer-c.jpg";
import clsHealerB from "@/assets/art/class-healer-b.jpg";
import clsHealerC from "@/assets/art/class-healer-c.jpg";
import clsSquireB from "@/assets/art/class-squire-b.jpg";
import clsSquireC from "@/assets/art/class-squire-c.jpg";
import clsScoutB from "@/assets/art/class-scout-b.jpg";
import clsScoutC from "@/assets/art/class-scout-c.jpg";

export const ART = {
  title: titleArt,
  throne: throneArt,
  aftermath: aftermathArt,
  coronation: coronationArt,
  council: councilArt,
  burning: burningArt,
  wedding: weddingArt,
  battle: battleArt,
};

/** Full-width illustration for each ending. */
export const ENDING_ART: Record<string, string> = {
  united_realm: endUnited,
  hollow_crown: endHollow,
  hammers_heir: endHammer,
  the_usurpers_end: endKnife,
  free_holds_rise: endFree,
  fractured_realm: endFracture,
  quiet_life: endQuiet,
};

/** Banner art shown when entering a location, by location kind. */
export const LOCATION_ART: Record<string, string> = {
  village: villageArt,
  castle: castleArt,
  dungeon: dungeonArt,
  ruin: locRuin,
  shrine: locShrine,
  camp: locCamp,
  landmark: locLandmark,
  wilds: wildsArt,
};

/**
 * Per-place look. Every location of a kind shares a painted backdrop, but each
 * gets its own light: a stable hue/brightness shift seeded from its id, so
 * Oakhollow and Millford never feel like the same village with a new label.
 */
export function locationLook(id: string, kind: string): { src: string | undefined; filter: string } {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  const hue = (h % 26) - 13;
  const bright = 0.88 + ((h >> 5) % 24) / 100;
  const sat = 0.85 + ((h >> 9) % 35) / 100;
  return { src: LOCATION_ART[kind], filter: `hue-rotate(${hue}deg) brightness(${bright.toFixed(2)}) saturate(${sat.toFixed(2)})` };
}

/** Painted portraits for every named character. */
export const NPC_ART: Record<string, string> = {
  lord_corvane: npcCorvane,
  lady_seren: npcSeren,
  lord_draeven: npcDraeven,
  lady_aleyne: npcAleyne,
  hana_of_the_glen: npcHana,
  reeve_ilsa: npcIlsa,
  captain_maud: npcMaud,
  the_fen_widow: npcWidow,
  lord_vantry: npcVantry,
  lord_brannoc: npcBrannoc,
  ser_isolde: npcIsolde,
  ser_perrin: npcPerrin,
  osrick_quill: npcOsrick,
  bram_carter: npcBram,
  sister_dulcie: npcDulcie,
};

/** Portraits for hired companions, by class. */
export const CLASS_ART: Record<string, string> = {
  warrior: clsWarrior,
  archer: clsArcher,
  healer: clsHealer,
  squire: clsSquire,
  scout: clsScout,
};

/**
 * Three painted faces per class, so a company of two archers is two people
 * rather than the same portrait twice. The face is picked from the unit's id,
 * so a companion keeps their face for the whole campaign.
 */
export const CLASS_FACES: Record<string, string[]> = {
  warrior: [clsWarrior, clsWarriorB, clsWarriorC],
  archer: [clsArcher, clsArcherB, clsArcherC],
  healer: [clsHealer, clsHealerB, clsHealerC],
  squire: [clsSquire, clsSquireB, clsSquireC],
  scout: [clsScout, clsScoutB, clsScoutC],
};

function faceIndex(key: string, count: number): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h % count;
}

/** Best available portrait for a party unit or npc. */
export function unitArt(opts: { npcId?: string | undefined; classId?: string | undefined; unitId?: string | undefined; name?: string | undefined }): string | undefined {
  if (opts.npcId && NPC_ART[opts.npcId]) return NPC_ART[opts.npcId];
  const faces = opts.classId ? CLASS_FACES[opts.classId] : undefined;
  if (faces?.length) return faces[faceIndex(opts.unitId ?? opts.name ?? opts.classId ?? "x", faces.length)];
  if (opts.classId && CLASS_ART[opts.classId]) return CLASS_ART[opts.classId];
  return undefined;
}


/** Scene art per story beat. */
export const BEAT_ART: Record<string, string> = {
  b0_ashes: burningArt,
  b1_ledger: councilArt,
  b2_burning: burningArt,
  b2_field: battleArt,
  b3_choosing: councilArt,
  b4_lieutenant: aftermathArt,
  b5_widow: throneArt,
  b6_ironhand: battleArt,
  b7_final: throneArt,
};

/** Thematic glyphs used instead of generic UI icons. */
export const GLYPH = {
  map: "map",
  party: "party",
  quests: "quests",
  save: "save",
  settings: "settings",
  menu: "menu",
  realm: "realm",
  rest: "rest",
  travel: "travel",
  gold: "gold",
  day: "day",
  renown: "renown",
  place: "place",
};

const AMBIENT: Record<string, string[]> = {
  village: [
    "Woodsmoke, wet thatch, and someone arguing about a fence line.",
    "Children run the lane with a stick and a grand plan. Dogs supervise.",
    "The well rope creaks. Three people watch you and pretend not to.",
  ],
  castle: [
    "Boot-heels on flagstone. Somewhere above, a door closes with authority.",
    "Banners breathe in the draught. The guards weigh your worth in one glance.",
    "Wax, iron and old wine: the smell of decisions being made without you.",
  ],
  dungeon: [
    "The dark goes down further than the torchlight is willing to follow.",
    "Water counts the seconds somewhere ahead. Nothing else does.",
    "Cold air comes up the passage carrying a smell you refuse to name.",
  ],
  ruin: [
    "Frost-split stone, ivy, and the shape of rooms nobody remembers using.",
    "The wind moves through empty windows like it still lives here.",
  ],
  shrine: [
    "Candle stubs, cut flowers, and a hush that asks something of you.",
    "Someone has been here recently. The wax is still soft.",
  ],
  camp: [
    "Cook-fires and bad singing. Fewer sentries than there ought to be.",
    "Horses shift on their tethers. Somebody just stopped talking.",
  ],
  landmark: [
    "The land opens out. For a moment the war is somewhere else.",
    "Old stone, older road. Travellers have left small offerings.",
  ],
};

export function ambientLine(kind: string, seed: number) {
  const list = AMBIENT[kind] ?? AMBIENT["landmark"]!;
  return list[Math.abs(seed) % list.length]!;
}

/* ── Enemy portraits ───────────────────────────────────────────────── */

const foeArt: Record<string, string> = {
  banditMelee: foeBanditMelee,
  banditRanged: foeBanditRanged,
  troopMelee: foeTroopMelee,
  troopRanged: foeTroopRanged,
  beast: foeBeast,
  undead: foeUndead,
  shade: foeShade,
  troll: foeTroll,
};

/** Painted portrait per enemy template id. */
export const ENEMY_ART: Record<string, string> = {
  cutpurse: foeArt["banditRanged"]!,
  brigand: foeArt["banditMelee"]!,
  road_archer: foeArt["banditRanged"]!,
  camp_boss: foeArt["banditMelee"]!,
  pact_pikeman: foeArt["troopMelee"]!,
  pact_hammer: foeArt["troopMelee"]!,
  ash_crossbow: foeArt["troopRanged"]!,
  sun_lancer: foeArt["troopMelee"]!,
  thorn_bowman: foeArt["troopRanged"]!,
  raven_guard: foeArt["troopMelee"]!,
  mercenary: foeArt["troopMelee"]!,
  fen_hound: foeArt["beast"]!,
  barrow_wight: foeArt["undead"]!,
  mire_crawler: foeArt["beast"]!,
  cave_troll: foeArt["troll"]!,
  wolf_cultist: foeArt["undead"]!,
  ember_shade: foeArt["shade"]!,
  boss_maud: foeBossMaud,
  boss_widow: foeBossWidow,
  boss_ironhand: foeBossIronhand,
  boss_draeven: foeBossDraeven,
  boss_corvane: foeBossCorvane,
  boss_coalition: foeBossMarshal,
};

/** Enemy portraits keyed by display name, since combatants carry names not template ids. */
export const ENEMY_ART_BY_NAME: Record<string, string> = {
  "Cutpurse": ENEMY_ART["cutpurse"]!,
  "Brigand": ENEMY_ART["brigand"]!,
  "Road Archer": ENEMY_ART["road_archer"]!,
  "Camp Headman": ENEMY_ART["camp_boss"]!,
  "Pact Pikeman": ENEMY_ART["pact_pikeman"]!,
  "Pact Hammerman": ENEMY_ART["pact_hammer"]!,
  "Ash Company Crossbow": ENEMY_ART["ash_crossbow"]!,
  "Sunmarch Lancer": ENEMY_ART["sun_lancer"]!,
  "Thornwold Bowman": ENEMY_ART["thorn_bowman"]!,
  "Ravensfell Guard": ENEMY_ART["raven_guard"]!,
  "Goldmere Mercenary": ENEMY_ART["mercenary"]!,
  "Fen Hound": ENEMY_ART["fen_hound"]!,
  "Barrow Wight": ENEMY_ART["barrow_wight"]!,
  "Mire Crawler": ENEMY_ART["mire_crawler"]!,
  "Deep Troll": ENEMY_ART["cave_troll"]!,
  "Wolf Cultist": ENEMY_ART["wolf_cultist"]!,
  "Ember Shade": ENEMY_ART["ember_shade"]!,
  "Maud Kell, Ash Captain": ENEMY_ART["boss_maud"]!,
  "The Fen Widow": ENEMY_ART["boss_widow"]!,
  "Ser Gral Ironhand": ENEMY_ART["boss_ironhand"]!,
  "Corvus Draeven, the Hammer": ENEMY_ART["boss_draeven"]!,
  "Aldric Corvane, the Old Raven": ENEMY_ART["boss_corvane"]!,
  "The Coalition Marshal": ENEMY_ART["boss_coalition"]!,
};

/** Best painted portrait for an enemy combatant; falls back by class flavour. */
export function enemyArt(opts: { name: string; classId?: string | undefined; boss?: boolean | undefined }): string | undefined {
  const exact = ENEMY_ART_BY_NAME[opts.name];
  if (exact) return exact;
  if (opts.boss) return foeBossMarshal;
  if (opts.classId === "archer") return foeTroopRanged;
  return foeTroopMelee;
}
