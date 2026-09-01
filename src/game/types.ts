import type { RngState } from "./rng";

/* ---------------- core ids ---------------- */

export type ClassId = "warrior" | "archer" | "healer" | "squire" | "scout";
export type BackgroundId = "hedge_knight" | "merchant_son" | "poacher" | "acolyte" | "exile";

export type FactionId =
  "ravensfell" | "goldmere" | "ironpact" | "sunmarch" | "thornwold" | "freeholds";

export type RelationKind = "war" | "peace" | "alliance";
export type BranchId = "loyalist" | "usurper" | "independent";

/* ---------------- stats & units ---------------- */

export interface UnitStats {
  maxHp: number;
  atk: number;
  def: number;
  spd: number;
}

export interface Unit {
  id: string;
  name: string;
  classId: ClassId;
  level: number;
  xp: number;
  hp: number;
  base: UnitStats;
  equipment: { weapon: string | null; armor: string | null };
  skills: string[];
  isHero?: boolean;
  npcId?: string;
}

/* ---------------- items ---------------- */

export type ItemKind = "weapon" | "armor" | "trinket" | "potion" | "treasure" | "gift";

export interface Item {
  id: string;
  name: string;
  kind: ItemKind;
  price: number;
  atk?: number;
  def?: number;
  hp?: number;
  spd?: number;
  desc: string;
}

/* ---------------- skills ---------------- */

export type SkillCategory = "offense" | "defense" | "support" | "utility";
export type SkillEffect =
  | { type: "strike"; mult: number; pierce?: boolean }
  | { type: "cleave"; mult: number }
  | { type: "heal"; pct: number }
  | { type: "guard"; reduce: number }
  | { type: "buffAtk"; amount: number }
  | { type: "debuffDef"; amount: number }
  | { type: "drain"; mult: number }
  | { type: "focus"; amount: number }
  | { type: "stun"; mult: number };

export interface Skill {
  id: string;
  name: string;
  category: SkillCategory;
  cost: number;
  minLevel: number;
  classes?: ClassId[];
  desc: string;
  effect: SkillEffect;
}

/* ---------------- world ---------------- */

export type LocationKind =
  "village" | "castle" | "dungeon" | "ruin" | "shrine" | "camp" | "landmark";

export interface WorldLocation {
  id: string;
  name: string;
  kind: LocationKind;
  faction: FactionId | null;
  x: number;
  y: number;
  links: string[];
  blurb: string;
  shop?: string[];
  recruits?: ClassId[];
  danger?: number;
  depth?: number;
  npcs?: string[];
}

/* ---------------- npcs ---------------- */

export type NpcRole = "lord" | "heir" | "retainer" | "commoner" | "rogue" | "cleric" | "usurper";

export interface Npc {
  id: string;
  name: string;
  title: string;
  role: NpcRole;
  faction: FactionId | null;
  portrait: string;
  personality: string;
  eligible?: boolean;
  home: string;
  blurb: string;
}

export interface NpcState {
  affinity: number;
  alive: boolean;
  recruited: boolean;
  met: boolean;
  married?: boolean;
}

/* ---------------- factions ---------------- */

export interface Faction {
  id: FactionId;
  name: string;
  house: string;
  color: string;
  banner: string;
  capital: string;
  lordId: string;
  blurb: string;
  strength: number;
  treasury: number;
}

export interface FactionRuntime {
  strength: number;
  treasury: number;
  rep: number;
  territory: string[];
  lordId: string;
}

/* ---------------- quests & story ---------------- */

export type QuestStatus = "locked" | "active" | "ready" | "done";
export interface QuestState {
  /** Which motive was taken at accept. Absent on quests from before ruling 18. */
  motive?: QuestMotive;
  status: QuestStatus;
  progress: number;
}

export type SideQuestKind = "bandit" | "delivery" | "escort" | "investigate" | "rescue";

/**
 * Ruling 18: taking work is a choice, not a button.
 *
 * "coin" is the old behaviour and its numbers are unchanged. "favour" refuses
 * payment: no gold, double the regard of the person who asked, and a little
 * honour, which is the first side-quest content to move honour at all.
 */
export type QuestMotive = "coin" | "favour";

export interface SideQuest {
  id: string;
  name: string;
  kind: SideQuestKind;
  giver: string;
  location: string;
  target: string;
  faction: FactionId | null;
  need: number;
  desc: string;
  /** What the giver says, keyed by the motive the player is weighing. */
  ask: Record<QuestMotive, string>;
  rewardGold: number;
  rewardFame: number;
  repShift?: number;
  npcShift?: { npcId: string; amount: number };
}

export interface StoryChoice {
  id: string;
  label: string;
  detail: string;
  requires?: (s: GameState) => boolean;
  flags?: Record<string, boolean | number | string>;
  branch?: BranchId;
  rep?: Partial<Record<FactionId, number>>;
  npc?: { npcId: string; affinity?: number; kill?: boolean; recruit?: boolean }[];
  relations?: { a: FactionId; b: FactionId; kind: RelationKind }[];
  gold?: number;
  fame?: number;
  /** Left out on most choices. Derived from unambiguous acts when absent. */
  honour?: number;
  outcome: string;
}

export interface StoryBeat {
  id: string;
  chapter: number;
  title: string;
  location: string | null;
  branch?: BranchId[];
  intro: (s: GameState) => string;
  available: (s: GameState) => boolean;
  battle?: { title: string; enemyIds: string[]; boss?: string };
  choices: StoryChoice[];
}

export interface EndingDef {
  id: string;
  title: string;
  body: (s: GameState) => string;
  score: (s: GameState) => number;
}

/* ---------------- world events ---------------- */

export interface WorldEvent {
  day: number;
  text: string;
  kind:
    | "war"
    | "peace"
    | "alliance"
    | "raid"
    | "territory"
    | "court"
    /** Aimed at the player rather than between two houses. Ruling 1. */
    | "bounty"
    | "offer"
    | "shunned"
    | "welcome";
  /** Set on events aimed at the player, so the interface can mark them. */
  aboutYou?: boolean;
}

/* ---------------- game state ---------------- */

export interface GameState {
  version: number;
  seed: number;
  /** Serialised sfc32 stream. Every rule-level random draw comes from here. */
  rng: RngState;
  heroName: string;
  heroClass: ClassId;
  background: BackgroundId;
  portrait: string;
  day: number;
  /** Hour of the day, 0-23. The clock inside the day. */
  hour: number;
  gold: number;
  /** Ruling 4: how big your name is. Any deed grows it, good or ill. */
  fame: number;
  /** Ruling 4: what colour that name is. Separate from how big it is. */
  honour: number;
  /** Ruling 6: standing in each PLACE, keyed by location id. Absent means no opinion. */
  standing: Record<string, number>;
  locationId: string;
  party: Unit[];
  inventory: Record<string, number>;
  skillPoints: number;
  quests: Record<string, QuestState>;
  activeSide: string[];
  branch: BranchId | null;
  beatIndex: number;
  storyFlags: Record<string, boolean | number | string>;
  choiceHistory: { beatId: string; choiceId: string; day: number; summary: string }[];
  factions: Record<FactionId, FactionRuntime>;
  relations: Record<string, RelationKind>;
  npcs: Record<string, NpcState>;
  marriedTo: string | null;
  clearedDungeons: string[];
  dungeonRuns: Record<string, number>;
  worldEvents: WorldEvent[];
  log: string[];
  endingId?: string | null;
}

/* ---------------- battle ---------------- */

export type BattleSide = "ally" | "enemy";

export interface StatusFx {
  atkMod: number;
  defMod: number;
  stunned: boolean;
}

export interface Combatant {
  id: string;
  name: string;
  side: BattleSide;
  classId: ClassId;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  spd: number;
  focus: number;
  maxFocus: number;
  defending: boolean;
  guard: number;
  fx: StatusFx;
  sprite: string;
  skills: string[];
  boss?: boolean;
}

export interface BattleReward {
  gold: number;
  xp: number;
  loot: string[];
}

export interface Battle {
  title: string;
  /** The battle carries its own stream so a fight replays exactly. */
  rng: RngState;
  combatants: Combatant[];
  order: string[];
  turn: number;
  round: number;
  log: string[];
  status: "active" | "won" | "lost" | "fled";
  reward: BattleReward;
  returnTo: string;
  tag: string | null;
  canFlee: boolean;
}
