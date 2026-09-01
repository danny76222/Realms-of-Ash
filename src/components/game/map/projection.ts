/**
 * The drawn map lives in its own 160 x 100 coordinate space, which matches the
 * 16:10 frame the map panel has always used, so nothing is stretched.
 *
 * `LOCATIONS[id].x` and `.y` are the truth for where settlements are and are
 * never edited. This file is the only place that turns those 0..100 world
 * coordinates into map coordinates, leaving a margin of sea and moor around
 * the edge so the region has room to have a shape.
 */

export const MAP_W = 160;
export const MAP_H = 100;

/** World x (0..100) to map x. 0 lands at 10, 100 lands at 150. */
export function px(x: number): number {
  return 10 + x * 1.4;
}

/** World y (0..100) to map y. 0 lands at 8, 100 lands at 92. */
export function py(y: number): number {
  return 8 + y * 0.84;
}

/** Same point as a percentage, for the HTML markers layered over the drawing. */
export function leftPct(x: number): number {
  return (px(x) / MAP_W) * 100;
}

export function topPct(y: number): number {
  return (py(y) / MAP_H) * 100;
}
