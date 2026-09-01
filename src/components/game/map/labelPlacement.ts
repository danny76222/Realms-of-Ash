/**
 * Where each settlement's name goes.
 *
 * The first version of this hand-picked a side per settlement, which looked
 * right at exactly one panel width and collided at every other one: the label
 * font does not scale with the SVG, so names grow relative to the map as the
 * panel shrinks. Placement has to be solved against the real geometry at the
 * size the map is actually being drawn.
 *
 * The solver is deterministic. Settlements are placed in a fixed order, the
 * candidate sides are tried in a fixed order, and a candidate is rejected if
 * it leaves the frame, covers another settlement's mark, or touches a name
 * already placed. Nothing is drawn at random, so the same panel width always
 * produces the same layout, which is what gate D1 asks of everything else.
 */

import { LOCATIONS } from "@/game/world";
import type { WorldLocation } from "@/game/types";
import { leftPct, topPct } from "./projection";

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Placement extends Box {
  id: string;
}

/** How far a name is held off its own mark, in pixels. */
const MARK = 9;

/** Half the box a mark is treated as occupying. Smaller than the button, because
 * the drawn glyph does not fill it and names may sit close without touching. */
const BLOCK = 8;

/** A name pushed out to the second ring when the first is full. */
const RING = 9;

/** Keep names off the frame by this much. */
const INSET = 3;

/** Names may not touch each other. One pixel of air is enough to read them. */
const GAP = 1.5;

/**
 * What gets dropped first when the map is too small to carry every name.
 * A castle keeps its name long after a wayside camp has lost it.
 */
const RANK: Record<WorldLocation["kind"], number> = {
  castle: 1,
  village: 2,
  dungeon: 3,
  ruin: 4,
  shrine: 4,
  camp: 5,
  landmark: 5,
};

/** Tried in this order, after the settlement's preferred side. */
const SIDES = ["s", "n", "e", "w", "se", "sw", "ne", "nw"] as const;
export type Side = (typeof SIDES)[number];

/**
 * The side each settlement would rather have, kept from the hand-drawn pass.
 * It is a preference and nothing more: the solver overrules it whenever the
 * geometry says it will not fit.
 */
export const PREFERRED: Record<string, Side> = {
  cairn_road: "s",
  north_barrows: "n",
  moorwatch: "e",
  corvane_keep: "w",
  greyfen: "w",
  oakhollow: "e",
  millford: "w",
  bandit_stones: "n",
  old_toll_bridge: "n",
  counting_ruin: "n",
  vantry_hall: "s",
  silverbrook: "n",
  east_shrine: "s",
  coinmoor: "e",
  cassock_town: "n",
  briar_cross: "n",
  barrow_wood: "s",
  drowned_chapel: "s",
  elmswatch: "w",
  brannoc_stockade: "w",
  green_shrine: "s",
  gallows_oak: "n",
  harrow_glen: "w",
  wolfden: "s",
  aleyne_citadel: "n",
  vinehill: "s",
  roseford: "n",
  hollow_mine: "w",
  south_marsh: "s",
  draeven_hold: "s",
  slagfoot: "n",
  cinder_pits: "w",
  emberdown: "w",
  sunken_fort: "s",
  black_stair: "s",
};

function candidate(side: Side, cx: number, cy: number, w: number, h: number, push: number): Box {
  const m = MARK + push;
  const half = m * 0.6;
  switch (side) {
    case "n":
      return { x: cx - w / 2, y: cy - m - h, w, h };
    case "e":
      return { x: cx + m, y: cy - h / 2, w, h };
    case "w":
      return { x: cx - m - w, y: cy - h / 2, w, h };
    case "se":
      return { x: cx + half, y: cy + half, w, h };
    case "sw":
      return { x: cx - half - w, y: cy + half, w, h };
    case "ne":
      return { x: cx + half, y: cy - half - h, w, h };
    case "nw":
      return { x: cx - half - w, y: cy - half - h, w, h };
    default:
      return { x: cx - w / 2, y: cy + m, w, h };
  }
}

function hits(a: Box, b: Box, pad: number): boolean {
  return (
    a.x < b.x + b.w + pad && a.x + a.w + pad > b.x && a.y < b.y + b.h + pad && a.y + a.h + pad > b.y
  );
}

/**
 * The name font shrinks a little on a narrow panel and grows on a wide one,
 * so the map carries roughly the same number of names at any size.
 */
export function labelFontPx(width: number): number {
  if (width < 560) return 6;
  if (width < 900) return 7;
  return 8;
}

/**
 * Solve the layout.
 *
 * `dims` is the measured pixel size of each rendered name, so the boxes are
 * the real thing rather than an estimate from character counts.
 * Anything absent from the returned map has no room and is not drawn.
 */
export function placeLabels(
  width: number,
  height: number,
  dims: Record<string, { w: number; h: number }>,
  currentId: string,
): Record<string, Placement> {
  const out: Record<string, Placement> = {};
  if (width <= 0 || height <= 0) return out;

  const locations = Object.values(LOCATIONS);

  // Every mark is an obstacle, whether or not its own name got placed, and so
  // is the "you are here" token above the settlement the player is standing in.
  const blockers: Box[] = locations.map((l) => ({
    x: (leftPct(l.x) / 100) * width - BLOCK,
    y: (topPct(l.y) / 100) * height - BLOCK,
    w: BLOCK * 2,
    h: BLOCK * 2,
  }));
  const cur = LOCATIONS[currentId];
  if (cur) {
    blockers.push({
      x: (leftPct(cur.x) / 100) * width - 22,
      y: (topPct(cur.y) / 100) * height - BLOCK - 14,
      w: 44,
      h: 14,
    });
  }

  const order = [...locations].sort((a, b) => {
    const ra = a.id === currentId ? 0 : RANK[a.kind];
    const rb = b.id === currentId ? 0 : RANK[b.kind];
    if (ra !== rb) return ra - rb;
    return a.id < b.id ? -1 : 1;
  });

  const taken: Box[] = [];

  const inFrame = (box: Box) =>
    box.x >= INSET &&
    box.y >= INSET &&
    box.x + box.w <= width - INSET &&
    box.y + box.h <= height - INSET;

  /**
   * Try every side at two distances from the mark. `avoidMarks` is dropped on
   * the second sweep: a name laid across a distant mark is a smaller loss than
   * a settlement with no name at all, and the two hard rules, no name over
   * another name and no name off the frame, still hold either way.
   */
  const solve = (loc: WorldLocation, avoidMarks: boolean): Box | null => {
    const dim = dims[loc.id];
    if (!dim) return null;
    const cx = (leftPct(loc.x) / 100) * width;
    const cy = (topPct(loc.y) / 100) * height;
    const preferred = PREFERRED[loc.id];
    const sides: Side[] = preferred
      ? [preferred, ...SIDES.filter((s) => s !== preferred)]
      : [...SIDES];

    for (const push of [0, RING]) {
      for (const side of sides) {
        const box = candidate(side, cx, cy, dim.w, dim.h, push);
        if (!inFrame(box)) continue;
        if (taken.some((t) => hits(box, t, GAP))) continue;
        if (avoidMarks && blockers.some((t) => hits(box, t, 0))) continue;
        return box;
      }
    }
    return null;
  };

  const spilled: WorldLocation[] = [];

  for (const loc of order) {
    const box = solve(loc, true);
    if (!box) {
      spilled.push(loc);
      continue;
    }
    taken.push(box);
    out[loc.id] = { id: loc.id, ...box };
  }

  // Second sweep, for the names worth keeping. Wayside camps, landmarks and
  // ruins are the ones that go when the map runs out of room.
  for (const loc of spilled) {
    if (loc.id !== currentId && RANK[loc.kind] > 3) continue;
    const box = solve(loc, false);
    if (!box) continue;
    taken.push(box);
    out[loc.id] = { id: loc.id, ...box };
  }

  return out;
}
