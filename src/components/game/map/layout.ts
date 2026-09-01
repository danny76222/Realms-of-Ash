/**
 * Roads and labels.
 *
 * Roads are the existing `links` graph in `world.ts`, drawn as curves rather
 * than straight lines: a road bends. The bend is a fixed perpendicular offset
 * derived from the pair of ids, so the same two settlements are joined by the
 * same curve every time the map is drawn.
 *
 * Label placement lives in `labelPlacement.ts`, which solves it against the
 * measured geometry rather than fixing a side per settlement.
 */

import { LOCATIONS } from "@/game/world";
import { px, py } from "./projection";

/* ------------------------------------------------------------------ */
/* Roads                                                               */
/* ------------------------------------------------------------------ */

export interface Road {
  key: string;
  a: string;
  b: string;
  d: string;
}

/** Stable small integer from an edge key. Not a random draw: the same two ids always give the same number. */
function edgeSeed(key: string): number {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) % 1000;
}

/** How hard each road bends, where the default look wrong. Positive bends one way, negative the other. */
const BEND_OVERRIDE: Record<string, number> = {
  "cassock_town|millford": 0.16,
  "cassock_town|vantry_hall": -0.12,
  "aleyne_citadel|coinmoor": 0.14,
  "corvane_keep|moorwatch": -0.14,
  "draeven_hold|hollow_mine": 0.15,
  "brannoc_stockade|cassock_town": -0.13,
};

export function buildRoads(): Road[] {
  const out: Road[] = [];
  for (const loc of Object.values(LOCATIONS)) {
    for (const other of loc.links) {
      if (loc.id >= other) continue;
      const target = LOCATIONS[other];
      if (!target) continue;
      const key = `${loc.id}|${other}`;
      const ax = px(loc.x);
      const ay = py(loc.y);
      const bx = px(target.x);
      const by = py(target.y);
      const dx = bx - ax;
      const dy = by - ay;
      const len = Math.hypot(dx, dy) || 1;
      const seed = edgeSeed(key);
      const bend = BEND_OVERRIDE[key] ?? ((seed % 13) / 13 - 0.5) * 0.34;
      // A road pushed to one side of the straight line, and a second, smaller
      // kink the other way, so the curve reads as a route round something.
      const nx = -dy / len;
      const ny = dx / len;
      const k = len * bend;
      const k2 = len * bend * -0.42;
      const c1x = ax + dx * 0.3 + nx * k;
      const c1y = ay + dy * 0.3 + ny * k;
      const c2x = ax + dx * 0.7 + nx * k2;
      const c2y = ay + dy * 0.7 + ny * k2;
      out.push({
        key,
        a: loc.id,
        b: other,
        d: `M ${ax.toFixed(2)} ${ay.toFixed(2)} C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${bx.toFixed(2)} ${by.toFixed(2)}`,
      });
    }
  }
  return out;
}
