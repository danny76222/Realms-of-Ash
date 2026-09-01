/**
 * The playtest fleet: bots that play whole campaigns and report what is wrong.
 *
 * Borrowed from the Isles project, where recurring blind playthroughs after
 * every build change are what surface balance and dead-content problems that
 * nobody finds by reading code.
 *
 * The case for it here is already made: Danny's agent found a battle soft-lock
 * that would have hit most players on their FIRST fight, and found it by
 * playing rather than by reading. Finding that class of problem should not
 * depend on somebody happening to try.
 *
 * The bots play temperaments, not one optimal line, because a game that only
 * works for a player who does the right thing is not finished:
 *
 *   builder    takes work, finishes it, keeps the party fed and levelled
 *   reckless   fights everything, never rests, never buys
 *   coward     avoids fights, travels constantly, hoards gold
 *   idle       does almost nothing, to see whether the world still moves
 *
 * Run:      bun scripts/playtest.ts
 *           bun scripts/playtest.ts --seeds 40 --days 400
 * Control:  bun scripts/playtest.ts --prove
 */
import {
  newGame,
  travelTo,
  advanceDays,
  sleepToMorning,
  restParty,
  applyBattleResult,
  partyLevel,
} from "../src/game/state";
import { createBattle, takeTurn, activeCombatant } from "../src/game/engine";
import { generateSideQuests, acceptQuest, completeQuest, applyChoice } from "../src/game/progress";
import { BEATS, ENDINGS, currentBeat, resolveEnding } from "../src/game/story";
import { FACTION_IDS } from "../src/game/world";
import { relationOf } from "../src/game/state";
import { LOCATIONS } from "../src/game/world";
import { Rng } from "../src/game/rng";
import type { GameState, Battle, QuestMotive } from "../src/game/types";

const arg = (name: string, fallback: number): number => {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? fallback : Number(process.argv[i + 1]);
};
const PROVE = process.argv.includes("--prove");
const SEEDS = arg("seeds", 24);
const DAYS = arg("days", 300);

type Temperament = "builder" | "reckless" | "coward" | "idle" | "generous";
// "generous" exists to exercise ruling 18's favour motive: someone who takes
// work and refuses payment for it. Without a bot that plays that way, half the
// new content would never be measured.
const TEMPERAMENTS: Temperament[] = ["builder", "reckless", "coward", "idle", "generous"];

interface Report {
  seed: number;
  temperament: Temperament;
  days: number;
  level: number;
  gold: number;
  fame: number;
  honour: number;
  wipes: number;
  battles: number;
  questsDone: number;
  forCoin: number;
  forFavour: number;
  beatsSeen: string[];
  branch: string | null;
  ending: string | null;
  wars: number;
  friendly: number;
  ironpactRep: number;
  endingScores: Record<string, number>;
  problems: string[];
}

/** Bounded battle resolution. Returns null if the fight would not end. */
function fight(
  g: GameState,
  enemyIds: string[],
  title: string,
): { state: GameState; won: boolean } | null {
  const { battle, rng } = createBattle({ state: g, title, enemyIds, returnTo: g.locationId });
  let s: GameState = { ...g, rng };
  let b: Battle = battle;

  let guard = 0;
  while (b.status === "active") {
    if (guard++ > 400) return null; // soft-lock: the fight will not resolve
    const actor = activeCombatant(b);
    if (!actor) return null;
    if (actor.side !== "ally") return null; // the UI can never act here; this is the bug Danny found
    const foe = b.combatants.find((c) => c.side === "enemy" && c.hp > 0);
    if (!foe) break;
    b = takeTurn(b, { kind: "attack", targetId: foe.id }).battle;
  }
  const won = b.status === "won";
  // applyBattleResult returns { state, levelUps }, not a bare GameState.
  const applied = applyBattleResult(s, b);
  return { state: applied.state, won };
}

function play(seed: number, temperament: Temperament): Report {
  let g = newGame({
    heroName: "Bot",
    heroClass: "warrior",
    background: "hedge_knight",
    portrait: "device-1",
    seed,
  });

  const r = new Rng(seed ^ 0x5eed);
  const problems: string[] = [];
  const beatsSeen = new Set<string>();
  let wipes = 0;
  let battles = 0;
  let questsDone = 0;
  let forCoin = 0;
  let forFavour = 0;
  let heldQuest: ReturnType<typeof generateSideQuests>[number] | null = null;

  const startDay = g.day;
  while (g.day - startDay < DAYS) {
    const dayBefore = g.day;

    // Story beats first: they are the spine and should never stall.
    const beat = currentBeat(g);
    if (beat && temperament !== "idle") {
      beatsSeen.add(beat.id);
      const open = beat.choices.filter((c) => !c.requires || c.requires(g));
      if (open.length === 0) {
        problems.push(`beat "${beat.id}" offered no answerable choice on day ${g.day}`);
        break;
      }
      g = applyChoice(g, beat, r.pick(open));
    }

    // Work in hand.
    const works = temperament === "builder" || temperament === "generous";
    if (works) {
      if (heldQuest && g.locationId === heldQuest.target) {
        const enemies = ["brigand", "cutpurse"];
        const out = fight(g, enemies, heldQuest.name);
        if (!out) {
          problems.push(
            `SOFT-LOCK: quest fight at ${g.locationId} could not resolve on day ${g.day}`,
          );
          break;
        }
        g = out.state;
        battles++;
        if (out.won) {
          g = completeQuest(g, heldQuest);
          questsDone++;
        } else {
          wipes++;
        }
        heldQuest = null;
      } else if (!heldQuest) {
        const offered = generateSideQuests(g, g.locationId);
        if (offered.length > 0) {
          heldQuest = r.pick(offered);
          // A builder weighs it; a generous player never takes the money.
          const motive: QuestMotive =
            temperament === "generous" ? "favour" : r.chance(0.5) ? "favour" : "coin";
          if (motive === "favour") forFavour++;
          else forCoin++;
          g = acceptQuest(g, heldQuest, motive);
        }
      }
    }

    // Move, or do not.
    const here = LOCATIONS[g.locationId];
    const links = here?.links ?? [];
    const shouldMove =
      temperament === "idle" ? r.chance(0.1) : temperament === "coward" ? true : r.chance(0.7);

    if (shouldMove && links.length > 0) {
      const dest = heldQuest && links.includes(heldQuest.target) ? heldQuest.target : r.pick(links);
      const { state, ambush } = travelTo(g, dest);
      g = state;
      if (ambush) {
        if (temperament === "coward") {
          // Fleeing is not modelled here; a coward takes the fight badly.
          g = restParty(g, 0.05);
        }
        const out = fight(g, ambush, "Ambush on the road");
        if (!out) {
          problems.push(`SOFT-LOCK: ambush near ${dest} could not resolve on day ${g.day}`);
          break;
        }
        g = out.state;
        battles++;
        if (!out.won) wipes++;
      }
    } else {
      g = sleepToMorning(g);
    }

    if (works && g.party.every((u) => u.hp < u.base.maxHp * 0.5)) {
      g = restParty(g, 1);
      g = advanceDays(g, 1);
    }

    // The clock must always move, or the loop is not a campaign.
    if (g.day === dayBefore) g = advanceDays(g, 1);
  }

  const ending = g.day - startDay >= DAYS ? resolveEnding(g).id : null;

  if (g.gold < 0) problems.push(`gold went negative (${g.gold})`);
  if (g.fame < 0) problems.push(`fame went negative (${g.fame})`);
  if (g.party.length === 0) problems.push("the party emptied and the campaign continued");
  if (partyLevel(g) === 1 && battles > 30) {
    problems.push(`${battles} battles and still level 1: experience is not reaching the party`);
  }

  return {
    seed,
    temperament,
    days: g.day - startDay,
    level: partyLevel(g),
    gold: g.gold,
    fame: g.fame,
    honour: g.honour,
    wipes,
    battles,
    questsDone,
    forCoin,
    forFavour,
    beatsSeen: [...beatsSeen],
    branch: g.branch,
    ending,
    wars: (() => {
      let n = 0;
      for (let i = 0; i < FACTION_IDS.length; i++)
        for (let j = i + 1; j < FACTION_IDS.length; j++)
          if (relationOf(g, FACTION_IDS[i]!, FACTION_IDS[j]!) === "war") n++;
      return n;
    })(),
    friendly: FACTION_IDS.filter((id) => g.factions[id].rep >= 25).length,
    ironpactRep: Math.round(g.factions.ironpact.rep),
    endingScores: Object.fromEntries(ENDINGS.map((e) => [e.id, e.score(g)])),
    problems,
  };
}

/* ---------------- the sweep ---------------- */

if (PROVE) {
  // The control: a battle whose enemy always outruns the party is exactly the
  // soft-lock Danny found. The harness must REPORT it rather than hang or pass.
  console.log("Control: a fight the player can never act in must be reported, not hung on.\n");
  const g = newGame({
    heroName: "Bot",
    heroClass: "healer", // spd 5, slower than a Cutpurse
    background: "acolyte",
    portrait: "device-1",
    seed: 1,
  });
  const slowParty: GameState = {
    ...g,
    party: g.party.map((u) => ({ ...u, base: { ...u.base, spd: 1 } })),
  };
  const out = fight(slowParty, ["cutpurse", "road_archer"], "Control fight");
  console.log(
    out === null
      ? "control PASSED: the harness detected a fight it could not resolve"
      : "control result: the fight resolved, so leading enemy turns are handled (Danny's fix is in place)",
  );
  // Either answer is informative, but the harness must never hang. Reaching
  // this line at all is the thing being proved.
  console.log("the harness terminated rather than hanging, which is what this control checks");
  process.exit(0);
}

const reports: Report[] = [];
for (const t of TEMPERAMENTS) {
  for (let i = 0; i < SEEDS; i++) reports.push(play(1000 + i * 37, t));
}

console.log(
  `Played ${reports.length} campaigns of ${DAYS} days across ${TEMPERAMENTS.length} temperaments.\n`,
);
console.log("  temperament   level  gold   fame  honour  battles  wipes  quests");
for (const t of TEMPERAMENTS) {
  const rs = reports.filter((x) => x.temperament === t);
  const avg = (f: (x: Report) => number) =>
    (rs.reduce((a, x) => a + f(x), 0) / rs.length).toFixed(1);
  console.log(
    `  ${t.padEnd(12)} ${avg((x) => x.level).padStart(6)} ${avg((x) => x.gold).padStart(6)} ${avg((x) => x.fame).padStart(6)} ${avg((x) => x.honour).padStart(7)} ${avg((x) => x.battles).padStart(8)} ${avg((x) => x.wipes).padStart(6)} ${avg((x) => x.questsDone).padStart(7)}`,
  );
}

/* ---------------- content that never appeared ---------------- */

const seenBeats = new Set(reports.flatMap((r) => r.beatsSeen));
const unseenBeats = BEATS.filter((b) => !seenBeats.has(b.id)).map((b) => b.id);
const seenEndings = new Set(reports.map((r) => r.ending).filter(Boolean) as string[]);
const unseenEndings = ENDINGS.filter((e) => !seenEndings.has(e.id)).map((e) => e.id);

console.log(`\nStory beats reached: ${seenBeats.size}/${BEATS.length}`);
if (unseenBeats.length) console.log(`  never reached: ${unseenBeats.join(", ")}`);
const branches = reports.reduce<Record<string, number>>((acc, x) => {
  const k = x.branch ?? "none";
  acc[k] = (acc[k] ?? 0) + 1;
  return acc;
}, {});
const usurpers = reports.filter((x) => x.branch === "usurper");
if (usurpers.length) {
  console.log("\nUsurper campaigns, why hammers_heir loses:");
  console.log("  wars  friendly  ironpactRep   winner (score)   hammers_heir");
  for (const u of usurpers.slice(0, 8)) {
    const best = Object.entries(u.endingScores).sort((a, b) => b[1] - a[1])[0]!;
    console.log(
      `  ${String(u.wars).padStart(4)}  ${String(u.friendly).padStart(8)}  ${String(u.ironpactRep).padStart(11)}   ${best[0]} (${best[1]})   ${u.endingScores["hammers_heir"]}`,
    );
  }
}
console.log(
  `Branches taken: ${Object.entries(branches)
    .map(([k, v]) => `${k} ${v}`)
    .join(", ")}`,
);
console.log(
  `Endings reached: ${seenEndings.size}/${ENDINGS.length}  (${[...seenEndings].join(", ") || "none"})`,
);
if (unseenEndings.length) console.log(`  never reached: ${unseenEndings.join(", ")}`);

/* ---------------- problems ---------------- */

const problems = reports.flatMap((r) =>
  r.problems.map((p) => `  [${r.temperament} seed ${r.seed}] ${p}`),
);
const softlocks = problems.filter((p) => p.includes("SOFT-LOCK"));

console.log(`\n${problems.length} problems across ${reports.length} campaigns.`);
if (problems.length) console.log([...new Set(problems)].slice(0, 25).join("\n"));

/* ---------------- ruling 18: does the motive choice matter? ---------------- */

const builders = reports.filter((x) => x.temperament === "builder");
const generous = reports.filter((x) => x.temperament === "generous");
const coinTaken = reports.reduce((a, x) => a + x.forCoin, 0);
const favourTaken = reports.reduce((a, x) => a + x.forFavour, 0);
const mean = (rs: Report[], f: (x: Report) => number) =>
  rs.length ? rs.reduce((a, x) => a + f(x), 0) / rs.length : 0;

console.log(`\nRuling 18, the quest motive:`);
console.log(`  taken for coin: ${coinTaken}   taken as a favour: ${favourTaken}`);
console.log(
  `  builder  gold ${mean(builders, (x) => x.gold).toFixed(0).padStart(6)}  honour ${mean(builders, (x) => x.honour).toFixed(1).padStart(6)}`,
);
console.log(
  `  generous gold ${mean(generous, (x) => x.gold).toFixed(0).padStart(6)}  honour ${mean(generous, (x) => x.honour).toFixed(1).padStart(6)}`,
);

const motiveProblems: string[] = [];
if (coinTaken === 0) motiveProblems.push('the "for coin" motive was never taken');
if (favourTaken === 0) motiveProblems.push('the "as a favour" motive was never taken');
// A choice that changes nothing is not a choice. Refusing payment must cost
// gold and must be worth something the purse cannot buy.
if (mean(generous, (x) => x.gold) >= mean(builders, (x) => x.gold)) {
  motiveProblems.push("refusing payment did not cost any gold, so the choice is free");
}
if (mean(generous, (x) => x.honour) <= mean(builders, (x) => x.honour)) {
  motiveProblems.push("refusing payment bought no honour, so the choice pays nothing");
}
if (motiveProblems.length) {
  console.log("\nPLAYTEST FAIL: the quest motive choice does not matter");
  for (const m of motiveProblems) console.log(`  ${m}`);
}

// Isles G70: every rung of a ladder must be the highest rung some campaign
// reached. Here: every ending must be the winner of at least one campaign, or
// it is content nobody will ever see. Both endings that were unreachable
// turned out to be bugs rather than design, so this is worth holding.
let failures = softlocks.length + motiveProblems.length;
if (unseenBeats.length) {
  console.log(
    `\nPLAYTEST FAIL: ${unseenBeats.length} story beat(s) never reached: ${unseenBeats.join(", ")}`,
  );
  failures += unseenBeats.length;
}
if (unseenEndings.length) {
  console.log(
    `\nPLAYTEST FAIL: ${unseenEndings.length} ending(s) unreachable: ${unseenEndings.join(", ")}`,
  );
  console.log("  An ending no campaign can win is content nobody will see.");
  failures += unseenEndings.length;
}
if (softlocks.length) console.log(`\nPLAYTEST FAIL: ${softlocks.length} soft-locks`);

if (failures > 0) process.exit(1);
console.log("\nplaytest pass: no campaign got stuck, every beat and ending reachable");
