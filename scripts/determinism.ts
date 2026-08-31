/**
 * Gate D1: the same seed and the same inputs produce the same campaign.
 *
 * Borrowed from the Isles project, where the equivalent gate (G4) is what makes
 * an automated playtest fleet possible at all: you cannot compare two runs, or
 * ask whether a rule change mattered, if every run drifts on its own.
 *
 * Run: bun scripts/determinism.ts
 *
 * A guard proves nothing until it has been shown to FAIL on the defect it
 * exists to catch (Isles gate G5). Run with --prove to inject a Math.random
 * draw into the loop and watch this script reject it.
 */
import { newGame, simulateWorldDay, travelTo, advanceDays } from "../src/game/state";
import { createBattle, takeTurn } from "../src/game/engine";
import { LOCATIONS } from "../src/game/world";
import type { GameState } from "../src/game/types";

const PROVE = process.argv.includes("--prove");

function campaign(seed: number): string {
  let g: GameState = newGame({
    heroName: "Test",
    heroClass: "warrior",
    background: "hedge_knight",
    portrait: "a",
    seed,
  });

  const ids = Object.keys(LOCATIONS).sort();
  for (let day = 0; day < 60; day++) {
    g = simulateWorldDay(g);
    const dest = ids[day % ids.length]!;
    const { state, ambush } = travelTo(g, dest);
    g = state;
    if (ambush) {
      const { battle, rng } = createBattle({
        state: g,
        title: "Test fight",
        enemyIds: ambush,
        returnTo: dest,
      });
      g = { ...g, rng };
      let b = battle;
      let guard = 0;
      while (b.status === "active" && guard++ < 40) {
        const foe = b.combatants.find((c) => c.side === "enemy" && c.hp > 0);
        b = takeTurn(b, foe ? { kind: "attack", targetId: foe.id } : { kind: "defend" }).battle;
      }
    }
    g = advanceDays(g, 1);
    // The defect: a rule that draws from Math.random and lets it reach state.
    // It must actually change something, or the control proves nothing.
    if (PROVE && Math.random() < 0.5) g = advanceDays(g, 1);
  }

  // A cheap state hash. Anything that drifts moves this string.
  return JSON.stringify({
    day: g.day,
    gold: g.gold,
    renown: g.renown,
    hp: g.party.map((u) => u.hp),
    ids: g.party.map((u) => u.id),
    events: g.worldEvents.map((e) => e.text),
    factions: Object.entries(g.factions).map(([k, f]) => [k, f.strength, f.treasury, f.rep]),
    rng: g.rng,
  });
}

let failures = 0;
for (const seed of [1, 2, 12345, 999983]) {
  const a = campaign(seed);
  const b = campaign(seed);
  const same = a === b;
  if (!same) failures++;
  console.log(`seed ${String(seed).padStart(6)}  ${same ? "identical" : "DRIFTED"}`);
}

// Different seeds must produce different campaigns, or the stream is dead.
if (campaign(1) === campaign(2)) {
  console.log("seed 1 and seed 2 produced the SAME campaign: the seed is not being read");
  failures++;
}

if (PROVE) {
  console.log(
    failures > 0
      ? "\nnegative control PASSED: the gate caught the injected Math.random"
      : "\nnegative control FAILED: the gate did not notice an unseeded draw",
  );
  process.exit(failures > 0 ? 0 : 1);
}
console.log(
  failures === 0 ? "\nD1 pass: campaigns replay exactly" : `\nD1 FAIL: ${failures} problems`,
);
process.exit(failures === 0 ? 0 : 1);
