import type { BackgroundId, ClassId, Item, Skill, UnitStats } from "./types";

export const CLASSES: Record<
  ClassId,
  {
    id: ClassId;
    name: string;
    sprite: string;
    blurb: string;
    base: UnitStats;
    growth: UnitStats;
    startSkill: string;
  }
> = {
  warrior: {
    id: "warrior",
    name: "Warrior",
    sprite: "sword",
    blurb: "A sworn blade of the shield-wall. Heavy armour, heavier swings.",
    base: { maxHp: 46, atk: 12, def: 9, spd: 6 },
    growth: { maxHp: 8, atk: 3, def: 2, spd: 1 },
    startSkill: "power_strike",
  },
  archer: {
    id: "archer",
    name: "Archer",
    sprite: "bow",
    blurb: "A forest-born marksman. Finds the gap in any plate.",
    base: { maxHp: 34, atk: 13, def: 5, spd: 10 },
    growth: { maxHp: 5, atk: 3, def: 1, spd: 2 },
    startSkill: "aimed_shot",
  },
  healer: {
    id: "healer",
    name: "Healer",
    sprite: "chalice",
    blurb: "A wandering keeper of the old rites. Mends flesh, steadies nerve.",
    base: { maxHp: 32, atk: 8, def: 5, spd: 8 },
    growth: { maxHp: 5, atk: 2, def: 1, spd: 1 },
    startSkill: "mend",
  },
  squire: {
    id: "squire",
    name: "Squire",
    sprite: "shield",
    blurb: "A young oath-taker with a battered kite shield.",
    base: { maxHp: 42, atk: 9, def: 10, spd: 5 },
    growth: { maxHp: 7, atk: 2, def: 3, spd: 1 },
    startSkill: "shield_bash",
  },
  scout: {
    id: "scout",
    name: "Scout",
    sprite: "dagger",
    blurb: "A border rider who knows every ditch and deer path.",
    base: { maxHp: 36, atk: 11, def: 6, spd: 12 },
    growth: { maxHp: 6, atk: 3, def: 1, spd: 2 },
    startSkill: "whirl",
  },
};

export const BACKGROUNDS: Record<
  BackgroundId,
  { id: BackgroundId; name: string; blurb: string; bonus: Partial<UnitStats>; gold: number; renown: number; flag: string }
> = {
  hedge_knight: {
    id: "hedge_knight",
    name: "Hedge Knight",
    blurb: "Armour bought on credit, a horse bought on worse credit.",
    bonus: { atk: 2, def: 1 },
    gold: 120,
    renown: 6,
    flag: "bg_knight",
  },
  merchant_son: {
    id: "merchant_son",
    name: "Merchant's Heir",
    blurb: "You can read a ledger, which in this realm counts as sorcery.",
    bonus: { spd: 1 },
    gold: 420,
    renown: 2,
    flag: "bg_merchant",
  },
  poacher: {
    id: "poacher",
    name: "Poacher",
    blurb: "Every lord's forest has fed you. None of them know it.",
    bonus: { spd: 3, atk: 1 },
    gold: 90,
    renown: 0,
    flag: "bg_poacher",
  },
  acolyte: {
    id: "acolyte",
    name: "Lapsed Acolyte",
    blurb: "You left the cloister with the herb-lore and none of the humility.",
    bonus: { maxHp: 8 },
    gold: 150,
    renown: 3,
    flag: "bg_acolyte",
  },
  exile: {
    id: "exile",
    name: "Disinherited Noble",
    blurb: "A name that opens doors, and a claim that closes them again.",
    bonus: { def: 2, maxHp: 4 },
    gold: 200,
    renown: 12,
    flag: "bg_exile",
  },
};

export const PORTRAITS = ["device-1", "device-2", "device-3", "device-4", "device-5", "device-6", "device-7", "device-8"];

/* ---------------- items ---------------- */

const item = (i: Item) => i;

export const ITEMS: Record<string, Item> = Object.fromEntries(
  [
    item({ id: "rusty_sword", name: "Rusted Sword", kind: "weapon", price: 20, atk: 2, desc: "Mostly rust holding hands." }),
    item({ id: "arming_sword", name: "Arming Sword", kind: "weapon", price: 160, atk: 6, desc: "Honest steel, honest price." }),
    item({ id: "war_axe", name: "War Axe", kind: "weapon", price: 320, atk: 11, spd: -1, desc: "Subtle as a barn door." }),
    item({ id: "hunting_bow", name: "Hunting Bow", kind: "weapon", price: 180, atk: 7, spd: 1, desc: "Yew, sinew, patience." }),
    item({ id: "oath_blade", name: "Oathkeeper Blade", kind: "weapon", price: 900, atk: 18, def: 2, desc: "Named, and it knows it." }),
    item({ id: "gambeson", name: "Gambeson", kind: "armor", price: 90, def: 3, hp: 6, desc: "Padded linen. Smells of every previous owner." }),
    item({ id: "mail_shirt", name: "Mail Shirt", kind: "armor", price: 280, def: 7, hp: 10, spd: -1, desc: "Rings enough to jingle." }),
    item({ id: "plate_harness", name: "Plate Harness", kind: "armor", price: 820, def: 13, hp: 20, spd: -2, desc: "You are now furniture that fights." }),
    item({ id: "ranger_cloak", name: "Ranger's Cloak", kind: "armor", price: 240, def: 4, spd: 3, desc: "Grey-green, forgettable, ideal." }),
    item({ id: "poultice", name: "Poultice", kind: "potion", price: 30, hp: 25, desc: "Restores 25 HP and dignity." }),
    item({ id: "strong_tonic", name: "Strong Tonic", kind: "potion", price: 80, hp: 60, desc: "Restores 60 HP. Tastes of pond." }),
    item({ id: "luck_charm", name: "Bone Charm", kind: "trinket", price: 140, spd: 2, desc: "Superstition, load-bearing." }),
    item({ id: "silver_ring", name: "Silver Ring", kind: "gift", price: 200, desc: "A courting gift with no pretensions." }),
    item({ id: "poem_scroll", name: "Bad Love Poem", kind: "gift", price: 60, desc: "Rhymes 'heart' with 'cart'. Endearing." }),
    item({ id: "falcon_hood", name: "Jewelled Falcon Hood", kind: "gift", price: 480, desc: "Nobles adore this sort of nonsense." }),
    item({ id: "old_coin", name: "Old Crown Coin", kind: "treasure", price: 120, desc: "Minted under a king nobody misses." }),
    item({ id: "relic_shard", name: "Relic Shard", kind: "treasure", price: 260, desc: "Warm to the touch. Probably fine." }),
    item({ id: "war_ledger", name: "Captured Ledger", kind: "treasure", price: 300, desc: "Numbers that ruin reputations." }),
  ].map((i) => [i.id, i]),
);

/* ---------------- skills ---------------- */

export const SKILLS: Record<string, Skill> = Object.fromEntries(
  (
    [
      { id: "power_strike", name: "Power Strike", category: "offense", cost: 2, minLevel: 1, desc: "180% damage to one foe.", effect: { type: "strike", mult: 1.8 } },
      { id: "aimed_shot", name: "Aimed Shot", category: "offense", cost: 2, minLevel: 1, desc: "150% damage, ignores armour.", effect: { type: "strike", mult: 1.5, pierce: true } },
      { id: "shield_bash", name: "Shield Bash", category: "defense", cost: 2, minLevel: 1, desc: "120% damage and you brace.", effect: { type: "stun", mult: 1.2 } },
      { id: "mend", name: "Mend", category: "support", cost: 2, minLevel: 1, desc: "Heal the most wounded ally 45%.", effect: { type: "heal", pct: 0.45 } },
      { id: "whirl", name: "Whirl of Knives", category: "offense", cost: 3, minLevel: 1, desc: "70% damage to every foe.", effect: { type: "cleave", mult: 0.7 } },
      { id: "rally", name: "Rallying Shout", category: "support", cost: 2, minLevel: 2, desc: "+4 attack to the whole party.", effect: { type: "buffAtk", amount: 4 } },
      { id: "sunder", name: "Sunder Armour", category: "utility", cost: 2, minLevel: 3, desc: "Strip 5 defence from a foe.", effect: { type: "debuffDef", amount: 5 } },
      { id: "bulwark", name: "Bulwark", category: "defense", cost: 2, minLevel: 3, desc: "Absorb the next 25 damage.", effect: { type: "guard", reduce: 25 } },
      { id: "leech_cut", name: "Leeching Cut", category: "offense", cost: 3, minLevel: 4, desc: "110% damage, heal half of it.", effect: { type: "drain", mult: 1.1 } },
      { id: "second_wind", name: "Second Wind", category: "support", cost: 1, minLevel: 4, desc: "Heal the most wounded ally 25%.", effect: { type: "heal", pct: 0.25 } },
      { id: "read_the_field", name: "Read the Field", category: "utility", cost: 0, minLevel: 5, desc: "Gain 3 focus immediately.", effect: { type: "focus", amount: 3 } },
      { id: "executioner", name: "Executioner's Swing", category: "offense", cost: 4, minLevel: 6, desc: "250% damage to one foe.", effect: { type: "strike", mult: 2.5 } },
      { id: "storm_of_steel", name: "Storm of Steel", category: "offense", cost: 4, minLevel: 7, desc: "110% damage to every foe.", effect: { type: "cleave", mult: 1.1 } },
      { id: "iron_will", name: "Iron Will", category: "defense", cost: 3, minLevel: 8, desc: "Absorb the next 60 damage.", effect: { type: "guard", reduce: 60 } },
      { id: "field_surgery", name: "Field Surgery", category: "support", cost: 4, minLevel: 9, desc: "Heal the most wounded ally 80%.", effect: { type: "heal", pct: 0.8 } },
      { id: "warlords_edge", name: "Warlord's Edge", category: "support", cost: 4, minLevel: 10, desc: "+9 attack to the whole party.", effect: { type: "buffAtk", amount: 9 } },
      { id: "hamstring", name: "Hamstring", category: "utility", cost: 3, minLevel: 5, desc: "140% damage and the foe loses its next turn.", effect: { type: "stun", mult: 1.4 } },
      { id: "vampiric_arc", name: "Vampiric Arc", category: "offense", cost: 5, minLevel: 11, desc: "180% damage, heal half of it.", effect: { type: "drain", mult: 1.8 } },
    ] as Skill[]
  ).map((s) => [s.id, s]),
);

export function skillsAvailableAt(level: number, known: string[]): Skill[] {
  return Object.values(SKILLS).filter((s) => s.minLevel <= level && !known.includes(s.id));
}
