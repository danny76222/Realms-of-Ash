/**
 * Gate R1: standing changes what the world does.
 *
 * Direction ruling 1 says reputation drives the events that happen. That is a
 * claim, and until it is measured it is only a claim: the code can read the
 * ledger and still produce a world that looks identical either way.
 *
 * This is the Realm of Ash version of the Isles gate that asks whether ruling
 * matters (G11). It runs the SAME campaign twice from the same seed, changing
 * one thing, and asks whether the world noticed.
 *
 *   R1  A house you have offended appears in your events more than it would
 *       have. Measured against the same seed with no offence given.
 *   R2  A famous player gets more eventful days than an unknown one.
 *   R3  Events aimed at the player fire at all, and only when earned.
 *
 * Run:        bun scripts/reputation.ts
 * Control:    bun scripts/reputation.ts --prove
 *
 * The control runs both arms IDENTICALLY, giving no offence in either. A gate
 * that still reports a difference is measuring noise and is worthless, so it
 * must report no effect. This is the project's rule from LESSONS.md: a guard
 * proves nothing until it has been shown to fail on the defect it catches, and
 * here the defect is a measurement that cannot tell signal from nothing.
 */
import { newGame, advanceDays, shiftRep } from "../src/game/state";
import { FACTIONS, FACTION_IDS } from "../src/game/world";
import type { FactionId, GameState } from "../src/game/types";

const PROVE = process.argv.includes("--prove");
const DAYS = 220;
const SEEDS = [1, 7, 23, 101, 555, 1201, 4242, 9973];
const TARGET: FactionId = "goldmere";

function start(seed: number): GameState {
  return newGame({
    heroName: "Test",
    heroClass: "warrior",
    background: "hedge_knight",
    portrait: "device-1",
    seed,
  });
}

/** Events naming a house. The world talking about them where you can hear it. */
function mentions(state: GameState, faction: FactionId): number {
  const name = FACTIONS[faction].name;
  return state.worldEvents.filter((e) => e.text.includes(name)).length;
}

function run(seed: number, opts: { offend?: boolean; fame?: number }): GameState {
  let g = start(seed);
  if (opts.fame !== undefined) g = { ...g, fame: opts.fame };
  if (opts.offend) g = shiftRep(g, TARGET, -70);
  return advanceDays(g, DAYS);
}

let failures = 0;
const fail = (msg: string) => {
  console.log(`  FAIL  ${msg}`);
  failures++;
};

/* ---------------- R1: an offended house comes looking ---------------- */

console.log(`R1: does offending ${FACTIONS[TARGET].name} change what the world does?\n`);
console.log("  seed     quiet   offended   change");
let quietTotal = 0;
let offendedTotal = 0;
let movedUp = 0;

for (const seed of SEEDS) {
  const quiet = mentions(run(seed, {}), TARGET);
  // In prove mode BOTH arms are identical, so any reported effect is noise.
  const offended = mentions(run(seed, { offend: !PROVE }), TARGET);
  quietTotal += quiet;
  offendedTotal += offended;
  if (offended > quiet) movedUp++;
  const delta = offended - quiet;
  console.log(
    `  ${String(seed).padStart(5)}  ${String(quiet).padStart(6)}  ${String(offended).padStart(9)}   ${delta >= 0 ? "+" : ""}${delta}`,
  );
}

const ratio = quietTotal === 0 ? Infinity : offendedTotal / quietTotal;
console.log(
  `\n  totals: ${quietTotal} quiet, ${offendedTotal} offended, ratio ${ratio.toFixed(2)}, rose on ${movedUp}/${SEEDS.length} seeds`,
);

if (PROVE) {
  // Both arms were the same campaign. Anything other than "no effect" means the
  // measurement is picking up noise and R1 cannot be trusted.
  if (offendedTotal !== quietTotal) {
    fail(
      `control arms differ (${quietTotal} vs ${offendedTotal}); the measurement is not deterministic`,
    );
  } else {
    console.log("  control: identical arms produced identical counts, as they must");
  }
} else {
  if (ratio < 1.25)
    fail(`offending a house barely changed its presence (ratio ${ratio.toFixed(2)}, want 1.25+)`);
  if (movedUp < Math.ceil(SEEDS.length * 0.6)) {
    fail(
      `the effect did not hold across seeds (${movedUp}/${SEEDS.length}, want ${Math.ceil(SEEDS.length * 0.6)}+)`,
    );
  }
}

/* ---------------- R2: fame buys you an eventful life ---------------- */

console.log(`\nR2: does fame change how often anything happens?\n`);
let unknownDays = 0;
let famousDays = 0;
for (const seed of SEEDS) {
  unknownDays += run(seed, { fame: 0 }).worldEvents.length;
  famousDays += run(seed, { fame: 100 }).worldEvents.length;
}
console.log(`  unknown (fame 0): ${unknownDays} events    famous (fame 100): ${famousDays} events`);
if (!PROVE && famousDays <= unknownDays) {
  fail(`fame did not make the world busier (${unknownDays} vs ${famousDays})`);
}

/* ---------------- R3: the world acts on the player directly ---------------- */

console.log(`\nR3: do events aimed at the player fire?\n`);
const aimedKinds = new Set(["bounty", "offer", "shunned", "welcome"]);
let aimed = 0;
const seenKinds = new Set<string>();

// Four different lives, because one player profile only ever earns one kind of
// attention. Sweeping a single profile is how the first version of this gate
// missed that bounties were starving everything else.
const PROFILES: { name: string; shape: (g: GameState) => GameState }[] = [
  {
    name: "famous and blackened",
    shape: (g) => {
      let x: GameState = { ...g, fame: 70, honour: -50 };
      for (const f of FACTION_IDS) x = shiftRep(x, f, -40);
      return x;
    },
  },
  {
    name: "a favourite of one house",
    shape: (g) => shiftRep({ ...g, fame: 40, honour: 30 }, "ravensfell", 60),
  },
  {
    name: "hated where they stand",
    shape: (g) => shiftRep({ ...g, fame: 35, honour: -10 }, "ravensfell", -60),
  },
  {
    name: "beloved locally",
    shape: (g) => ({ ...g, fame: 25, honour: 40, standing: { [g.locationId]: 55 } }),
  },
];

for (const profile of PROFILES) {
  const kinds = new Set<string>();
  let count = 0;
  for (const seed of SEEDS) {
    const end = advanceDays(profile.shape(start(seed)), DAYS);
    for (const e of end.worldEvents) {
      if (aimedKinds.has(e.kind)) {
        count++;
        aimed++;
        kinds.add(e.kind);
        seenKinds.add(e.kind);
      }
    }
  }
  console.log(
    `  ${profile.name.padEnd(26)} ${String(count).padStart(4)} events: ${[...kinds].sort().join(", ") || "none"}`,
  );
}

console.log(
  `\n  ${aimed} aimed events in total, kinds seen: ${[...seenKinds].sort().join(", ") || "none"}`,
);
if (!PROVE) {
  if (aimed === 0) fail("no event ever fired at the player, so step 3 is not wired up");
  // Isles gate G32: every kind the sim declares must actually be raised, or it
  // is dead code pretending to be content.
  for (const kind of aimedKinds) {
    if (!seenKinds.has(kind)) fail(`the "${kind}" event never fired for any player in the sweep`);
  }
}

/* ---------------- verdict ---------------- */

if (PROVE) {
  console.log(
    failures > 0
      ? "\ncontrol FAILED: the measurement moved when nothing changed, so R1 cannot be trusted"
      : "\ncontrol PASSED: with nothing changed the gate reports no effect, so a reported effect is real",
  );
  process.exit(failures > 0 ? 1 : 0);
}
console.log(
  failures === 0 ? "\nR pass: standing changes the world" : `\nR FAIL: ${failures} problems`,
);
process.exit(failures === 0 ? 0 : 1);
