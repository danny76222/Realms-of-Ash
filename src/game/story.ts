import { FACTIONS, FACTION_IDS } from "./world";
import { relationOf } from "./state";
import type { EndingDef, GameState, StoryBeat } from "./types";

const f = (s: GameState, k: string) => s.storyFlags[k];
const alive = (s: GameState, id: string) => s.npcs[id]?.alive !== false;

export const BEATS: StoryBeat[] = [
  {
    id: "b0_ashes",
    chapter: 1,
    title: "Ashes on the Oakhollow Road",
    location: "oakhollow",
    available: (s) => s.beatIndex === 0,
    intro: () =>
      "Bram Carter's wagon is on its side and three men in Pact grey are going through it with the calm of tax collectors. One of them is whistling. Badly.",
    choices: [
      {
        id: "help",
        label: "Draw steel for the carter",
        detail: "Three against one, but the whistling really is unforgivable.",
        flags: { helped_bram: true },
        npc: [{ npcId: "bram_carter", affinity: 25 }],
        rep: { ironpact: -5, ravensfell: 4 },
        fame: 3,
        outcome:
          "The Pact men leave at a run. Bram, bleeding from the ear, insists on giving you half a cheese and his eternal friendship. You accept both.",
      },
      {
        id: "watch",
        label: "Watch from the treeline",
        detail: "Learn what they are looking for before anyone learns your name.",
        flags: { saw_pact_orders: true },
        npc: [{ npcId: "bram_carter", affinity: -10 }],
        outcome:
          "They are not robbing him. They are searching for a courier's satchel. You memorise the name on the orders (Captain Maud Kell) and Bram limps away without ever seeing you.",
      },
      {
        id: "join",
        label: "Offer to help them search",
        detail: "Pact silver spends the same as anyone's.",
        flags: { pact_contact: true },
        rep: { ironpact: 8, ravensfell: -6 },
        npc: [{ npcId: "bram_carter", affinity: -25 }],
        gold: 60,
        outcome:
          "They pay you sixty in Pact coin and tell you their captain always needs practical people. Bram watches you take it. He will remember that face.",
      },
    ],
  },
  {
    id: "b1_ledger",
    chapter: 1,
    title: "The Clerk with the Ledger",
    location: "cassock_town",
    available: (s) => s.beatIndex === 1,
    intro: (s) =>
      `Osrick Quill has receipts: three years of Iron Pact silver paid into ${FACTIONS.goldmere.name} and ${FACTIONS.thornwold.name} pockets. "Lord Draeven didn't take the realm," he whispers. "He bought it on credit."${
        f(s, "pact_contact")
          ? " He also knows you've been seen taking Pact coin, and he is very nervous about it."
          : ""
      }`,
    choices: [
      {
        id: "expose",
        label: "Carry the ledger to Ravensfell",
        detail: "Put it in the Old Raven's hands and let the realm see the debt.",
        flags: { ledger_exposed: true, draeven_checked: true },
        rep: { ravensfell: 12, goldmere: -8, ironpact: -12 },
        npc: [
          { npcId: "osrick_quill", affinity: 20 },
          { npcId: "lord_corvane", affinity: 15 },
        ],
        fame: 8,
        outcome:
          "Corvane reads it twice, then a third time, then pours you a drink he clearly regrets opening. The realm now knows who paid for whose loyalty. And Goldmere knows exactly who told them.",
      },
      {
        id: "sell",
        label: "Sell the ledger to the Iron Pact",
        detail: "A fortune, and a clerk who becomes an inconvenience.",
        flags: { ledger_sold: true },
        rep: { ironpact: 15, freeholds: -10, ravensfell: -8 },
        npc: [
          { npcId: "osrick_quill", affinity: -60, kill: true },
          { npcId: "captain_maud", affinity: 15 },
        ],
        gold: 500,
        outcome:
          "The Fen Widow pays in full, compliments your handwriting, and asks where the clerk sleeps. You tell her. Osrick is found in the millrace two days later, still holding a receipt.",
      },
      {
        id: "keep",
        label: "Keep the ledger yourself",
        detail: "Leverage is worth more than either payment.",
        flags: { ledger_kept: true },
        npc: [{ npcId: "osrick_quill", affinity: 10, recruit: false }],
        fame: 4,
        outcome:
          "Osrick copies it out for you in a hand so neat it's insulting, and asks only that you use it on someone who deserves it. You now own the debts of half the realm's nobility.",
      },
    ],
  },
  {
    id: "b2_burning",
    chapter: 2,
    title: "Millford Burns",
    location: "millford",
    available: (s) => s.beatIndex === 2,
    intro: () =>
      "Ash Company outriders are firing the granaries at Millford, not for plunder, but so that Ravensfell's levies starve before the muster. A Pact sergeant is directing it off a wax tablet, like a man ticking off errands.",
    battle: {
      title: "The Burning of Millford",
      enemyIds: ["pact_hammer", "ash_crossbow", "pact_pikeman"],
    },
    choices: [
      {
        id: "save_grain",
        label: "Save the granaries",
        detail: "Feed the levies, even if the raiders escape.",
        flags: { millford_saved: true },
        rep: { ravensfell: 10, ironpact: -8 },
        fame: 6,
        outcome:
          "Half the grain survives. Ravensfell's muster will eat this winter, and every village between here and the moors hears who put out the fires.",
      },
      {
        id: "chase",
        label: "Chase the sergeant down",
        detail: "Take the wax tablet. Let the grain burn.",
        flags: { has_pact_orders: true },
        rep: { ironpact: -6 },
        fame: 3,
        outcome:
          "You take the tablet off his body: a full raid schedule signed by Maud Kell, and beneath it a second seal you don't recognise yet. Millford eats ash this winter.",
      },
      {
        id: "loot",
        label: "Empty the reeve's strongbox in the confusion",
        detail: "Nobody counts coins during a fire.",
        flags: { looted_millford: true },
        rep: { ravensfell: -12, freeholds: -8 },
        gold: 350,
        outcome:
          "Three hundred and fifty in mixed coin, and a reputation you'll be explaining for the rest of the war.",
      },
    ],
  },
  {
    id: "b3_choosing",
    chapter: 3,
    title: "The Choosing",
    location: null,
    available: (s) => s.beatIndex === 3,
    intro: (s) =>
      `Three letters arrive in the same week. Lord Corvane summons you to the loyalist muster. Corvus Draeven invites you to dinner: "no oaths required, only appetite." And the Reeve's Council offers you a charter of your own, if you can hold land long enough to sign it.${
        s.marriedTo
          ? ` Your marriage into ${FACTIONS[s.npcs[s.marriedTo] ? (Object.values(FACTIONS).find((x) => x.lordId)?.id ?? "ravensfell") : "ravensfell"].name} is mentioned in all three, in three different tones.`
          : ""
      }`,
    choices: [
      {
        id: "loyalist",
        label: "Rally the loyalist coalition",
        detail: "Bind the old houses together and break the Hammer in the field.",
        branch: "loyalist",
        flags: { branch_locked: true, draeven_checked: true },
        rep: { ravensfell: 18, sunmarch: 10, ironpact: -20 },
        relations: [
          { a: "ravensfell", b: "sunmarch", kind: "alliance" },
          { a: "ravensfell", b: "ironpact", kind: "war" },
        ],
        npc: [{ npcId: "lord_corvane", affinity: 20 }],
        fame: 12,
        outcome:
          "You take the loyalist banner at the muster field. Corvane's captains cheer. Corvane himself looks like a man handing over a debt.",
      },
      {
        id: "usurper",
        label: "Take Draeven's hand",
        detail: "Serve the Hammer, and be paid in the coin of the new order.",
        branch: "usurper",
        flags: { branch_locked: true, dined_with_draeven: true },
        rep: { ironpact: 25, ravensfell: -20, sunmarch: -12 },
        npc: [
          { npcId: "lord_draeven", affinity: 20 },
          { npcId: "captain_maud", affinity: 10 },
        ],
        gold: 400,
        fame: 6,
        outcome:
          "Dinner is excellent. Draeven talks for two hours about drainage, granaries and standing courts, and never once about crowns. By the pudding you realise the most frightening thing about him: he means it.",
      },
      {
        id: "independent",
        label: "Raise your own banner",
        detail: "Let the great houses bleed each other while you carve out a holding.",
        branch: "independent",
        flags: { branch_locked: true, own_banner: true },
        rep: { freeholds: 15, ravensfell: -8, ironpact: -8 },
        fame: 10,
        outcome:
          "You hang your own colours over a border tower nobody has bothered to garrison in ten years. Within a month, two hundred people who like the idea of no lord at all are living under it.",
      },
    ],
  },
  {
    id: "b4_lieutenant",
    chapter: 4,
    title: "The Ash Captain",
    location: null,
    available: (s) => s.beatIndex === 4,
    intro: (s) =>
      s.branch === "usurper"
        ? "Maud Kell has begun quietly refusing orders, sparing villages the Hammer marked for burning. Draeven asks you, pleasantly, over wine, to correct her."
        : "Maud Kell's Ash Company has the road, the high ground, and a professional's contempt for amateurs with banners. She offers terms before she offers battle.",
    battle: {
      title: "Maud Kell's Stand",
      enemyIds: ["boss_maud", "ash_crossbow", "pact_pikeman"],
      boss: "boss_maud",
    },
    choices: [
      {
        id: "spare",
        label: "Spare her and take her oath",
        detail: "A captain who spares villages is worth more alive.",
        flags: { maud_spared: true },
        npc: [{ npcId: "captain_maud", affinity: 35, recruit: true }],
        rep: { ironpact: -6 },
        outcome:
          'Maud wipes her blade, looks at the field, and says, "Fine. But I pick our ground from now on." She means it, and she is usually right.',
      },
      {
        id: "execute",
        label: "Execute her on the field",
        detail: "Make an example the whole realm can read.",
        flags: { maud_dead: true },
        npc: [
          { npcId: "captain_maud", affinity: -100, kill: true },
          { npcId: "lord_draeven", affinity: -10 },
        ],
        rep: { ironpact: -12, ravensfell: 6 },
        fame: 8,
        outcome:
          "The Ash Company disbands within a fortnight. So does a good deal of the realm's willingness to surrender to you.",
      },
      {
        id: "ransom",
        label: "Ransom her back to the Pact",
        detail: "Gold now, an enemy later.",
        flags: { maud_ransomed: true },
        npc: [{ npcId: "captain_maud", affinity: -20 }],
        gold: 450,
        rep: { goldmere: 6 },
        outcome:
          "Four hundred and fifty in Pact silver, and a captain who now knows exactly how you fight.",
      },
    ],
  },
  {
    id: "b5_widow",
    chapter: 5,
    title: "The Fen Widow's Errand",
    location: null,
    available: (s) => s.beatIndex === 5,
    intro: (s) =>
      `${alive(s, "the_fen_widow") ? "The Fen Widow" : "One of the Widow's apprentices"} has been moving through the border villages with a list of names. Yours is on it, third from the top, which is either an insult or a promotion.`,
    battle: {
      title: "Ambush at the Gallows Oak",
      enemyIds: ["boss_widow", "ember_shade", "cutpurse"],
      boss: "boss_widow",
    },
    choices: [
      {
        id: "burn_list",
        label: "Burn the list",
        detail: "Nobody else on it needs to die for a war they didn't choose.",
        flags: { list_burned: true },
        npc: [
          { npcId: "the_fen_widow", affinity: -30, kill: true },
          { npcId: "sister_dulcie", affinity: 20 },
        ],
        fame: 10,
        rep: { freeholds: 10, thornwold: 6 },
        outcome:
          "Eleven names, most of them millers and priests, go up in a very small fire. Sister Dulcie says a word over it that is not quite a prayer.",
      },
      {
        id: "use_list",
        label: "Finish the list yourself",
        detail: "Every name on it is someone's informant.",
        flags: { list_used: true },
        npc: [
          { npcId: "the_fen_widow", affinity: -30, kill: true },
          { npcId: "sister_dulcie", affinity: -35 },
        ],
        rep: { ironpact: 8, freeholds: -14, ravensfell: -6 },
        gold: 300,
        fame: 6,
        outcome:
          "The border quiets. It is the particular quiet of people deciding not to speak to you again.",
      },
      {
        id: "warn",
        label: "Warn every name on it",
        detail: "Ride the border for a week and lose the initiative.",
        flags: { list_warned: true },
        npc: [
          { npcId: "the_fen_widow", affinity: -20 },
          { npcId: "bram_carter", affinity: 20 },
        ],
        rep: { freeholds: 12, ravensfell: 8, ironpact: -10 },
        fame: 12,
        outcome:
          "Eleven households vanish into the woods before the knives arrive. It costs you a week, and buys you a border that will hide you when you need it.",
      },
    ],
  },
  {
    id: "b6_ironhand",
    chapter: 6,
    title: "Ser Gral Ironhand at the Black Stair",
    location: null,
    available: (s) => s.beatIndex === 6,
    intro: (s) =>
      s.branch === "usurper"
        ? "Ironhand thinks Draeven has gone soft, keeping you around. He intends to demonstrate this at length, with a mace."
        : "The Hammer's last lieutenant holds the Black Stair, and beneath it the foundry that arms half the Pact. Take the stair, take the war.",
    battle: {
      title: "The Black Stair",
      enemyIds: ["boss_ironhand", "pact_hammer", "pact_hammer"],
      boss: "boss_ironhand",
    },
    choices: [
      {
        id: "break_foundry",
        label: "Break the foundry",
        detail: "Cripple Pact strength for good.",
        flags: { foundry_broken: true },
        rep: { ironpact: -18, thornwold: 8 },
        fame: 12,
        outcome:
          "The great wheel goes into the shaft. Pact levies will be fighting the rest of this war with their grandfathers' steel.",
      },
      {
        id: "seize_foundry",
        label: "Seize the foundry intact",
        detail: "Whoever holds it arms the next realm, whatever that turns out to be.",
        flags: { foundry_held: true },
        rep: { goldmere: 10, freeholds: 8 },
        gold: 400,
        fame: 8,
        outcome:
          "You put your own guards on the door and hire back every smith who'll swear. It is the single most valuable thing you have ever owned.",
      },
    ],
  },
  {
    id: "b7_final",
    chapter: 7,
    title: "The Last Field",
    location: null,
    available: (s) => s.beatIndex === 7,
    intro: (s) =>
      s.branch === "usurper"
        ? "Corvane's loyalists have crossed the moor road with everything left to them. The Old Raven means to end it personally, and he means to end it with you."
        : s.branch === "independent"
          ? "The great houses have finally agreed on one thing: your banner. A joint Coalition marshal rides at the head of the combined host, and he has orders to take your tower down to the footings."
          : "Corvus Draeven waits at the muster field with the Ash Company's remnant, an honour guard, and the maddening patience of a man who has already drawn the map of the realm he intends to build.",
    battle: {
      title: "The Last Field",
      enemyIds: ["boss_draeven", "pact_hammer", "ash_crossbow"],
      boss: "boss_draeven",
    },
    choices: [
      {
        id: "end_it",
        label: "End it with the sword",
        detail: "No terms, no speeches.",
        flags: { final_kill: true },
        fame: 25,
        outcome:
          "It ends the way these things always end: quickly, and in mud, and with someone's second-best banner over the body.",
      },
      {
        id: "terms",
        label: "Offer terms over the body of the field",
        detail: "A realm needs someone left alive to administer it.",
        flags: { final_terms: true },
        fame: 18,
        rep: { goldmere: 10, freeholds: 10, sunmarch: 6 },
        outcome:
          "Terms are signed on a drumhead in the rain. Half the lords present think you weak. The other half start quietly wondering what you'd want for their charter.",
      },
    ],
  },
];

export function finalEnemies(s: GameState): { title: string; enemyIds: string[] } {
  if (s.branch === "usurper")
    return {
      title: "The Old Raven's Charge",
      enemyIds: ["boss_corvane", "raven_guard", "sun_lancer"],
    };
  if (s.branch === "independent")
    return { title: "The Coalition Host", enemyIds: ["boss_coalition", "sun_lancer", "mercenary"] };
  return {
    title: "The Hammer's Last Field",
    enemyIds: ["boss_draeven", "pact_hammer", "ash_crossbow"],
  };
}

export function currentBeat(s: GameState): StoryBeat | null {
  return BEATS.find((b) => b.available(s)) ?? null;
}

/* ---------------- endings ---------------- */

function friendlyFactions(s: GameState): number {
  return FACTION_IDS.filter((id) => s.factions[id].rep >= 25).length;
}
function warCount(s: GameState): number {
  let n = 0;
  for (let i = 0; i < FACTION_IDS.length; i++)
    for (let j = i + 1; j < FACTION_IDS.length; j++)
      if (relationOf(s, FACTION_IDS[i]!, FACTION_IDS[j]!) === "war") n++;
  return n;
}

export const ENDINGS: EndingDef[] = [
  {
    id: "united_realm",
    title: "The Realm Made Whole",
    score: (s) =>
      (s.branch === "loyalist" ? 10 : 0) + friendlyFactions(s) * 2 + (warCount(s) <= 2 ? 5 : 0),
    body: (s) =>
      `The Hammer is broken and the houses, astonishingly, stay in the same room long enough to sign. ${
        s.npcs["lord_corvane"]?.alive
          ? "Lord Corvane rules as regent and complains about it daily."
          : "With Corvane dead, the council rules in his name and quotes him constantly."
      } ${
        s.marriedTo
          ? `Your marriage binds the settlement together in a way no oath could.`
          : `You are offered a seat on the council and a title you didn't ask for.`
      } ${friendlyFactions(s)} of the six powers count you a friend, and ${warCount(s)} wars still smoulder at the borders: a realm made whole, not a realm made quiet.`,
  },
  {
    id: "hollow_crown",
    title: "The Hollow Crown",
    score: (s) =>
      (s.branch === "loyalist" ? 6 : 0) + (warCount(s) >= 4 ? 6 : 0) + (s.fame < 60 ? 3 : 0),
    body: () =>
      "You win the last field and lose the peace. Within two years the coalition you built is three coalitions, each certain it did the most work. The crown sits on a boy nobody consulted, and the border lords have stopped answering letters. Still: the Hammer is dead, and the granaries were full this winter. Some victories are only ever the absence of a worse thing.",
  },
  {
    id: "hammers_heir",
    title: "The Hammer's Heir",
    score: (s) => (s.branch === "usurper" ? 12 : 0) + (s.factions.ironpact.rep >= 40 ? 4 : 0),
    body: (s) =>
      `Draeven's realm is built exactly as he described it over that dinner: standing courts, drained fens, roads that go where trade goes. It is also built on the Ash Company and a list of names. ${
        s.npcs["captain_maud"]?.recruited
          ? "Maud Kell keeps the peace and keeps a private tally of what it costs."
          : "Nobody is left who will tell him no."
      } You are his right hand, wealthy beyond your first year's imagining, and you have learned to sleep through the sound of the night patrols.`,
  },
  {
    id: "the_usurpers_end",
    title: "A Knife for the Hammer",
    score: (s) =>
      (s.branch === "usurper" &&
      (s.npcs["lord_draeven"]?.alive === false || s.storyFlags["final_kill"] === true)
        ? 11
        : 0) + (s.fame > 80 ? 3 : 0),
    body: () =>
      "You served the Hammer until the exact moment serving him stopped paying, and then you did what the Fen Widow would have done, only better and in public. The Pact acclaims you because the alternative is another decade of war. It is not a throne so much as a chair nobody else is willing to sit in yet.",
  },
  {
    id: "free_holds_rise",
    title: "No Lord Over Us",
    score: (s) =>
      (s.branch === "independent" ? 11 : 0) +
      (s.factions.freeholds.rep >= 30 ? 4 : 0) +
      (s.fame > 70 ? 2 : 0),
    body: (s) =>
      `The Coalition host breaks on your walls, and the charter towns take the hint. Within a decade there are eleven of them, all quarrelling, all armed, none of them kneeling. ${
        s.npcs["reeve_ilsa"]?.affinity && s.npcs["reeve_ilsa"].affinity > 20
          ? "Ilsa Farr calls it the worst-run good idea in history and refuses to leave."
          : "The Reeve's Council never quite forgives you for being right."
      } Your banner still flies over the border tower. You are asked to be king twice and decline twice, mostly out of spite.`,
  },
  {
    id: "fractured_realm",
    title: "The Realm in Pieces",
    score: (s) =>
      (warCount(s) >= 6 ? 9 : 0) +
      (friendlyFactions(s) === 0 ? 5 : 0) +
      (s.branch === "independent" ? 2 : 0),
    body: () =>
      "The Hammer falls and nothing rises to replace him. Six powers, six claims, and a map redrawn every campaign season by whoever has grain. You hold your keep, your household, and a stretch of road, and that is the honest total of what any lord in this realm now holds. History will call it a fracture. The people living through it mostly call it Tuesday.",
  },
  {
    id: "quiet_life",
    title: "The Quiet Ending",
    score: (s) => (s.fame < 40 ? 8 : 0) + (s.marriedTo ? 4 : 0),
    body: (s) =>
      `You end the war alive, moderately solvent, and famous in about four villages. ${
        s.marriedTo
          ? "You are also married, which several chroniclers consider the more remarkable achievement."
          : "The chronicles record your name once, spelled wrong."
      } The great houses go on doing what great houses do. You go on eating regularly, which in this realm is its own kind of victory.`,
  },
];

export function resolveEnding(s: GameState): EndingDef {
  return [...ENDINGS].sort((a, b) => b.score(s) - a.score(s))[0]!;
}
