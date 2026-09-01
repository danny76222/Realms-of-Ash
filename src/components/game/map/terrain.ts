/**
 * The terrain engine: a heightfield, relief shading, and a naturalistic ramp.
 *
 * Ruling 19 asks for a campaign map of Bannerlord's quality. Studying that map,
 * almost all of the difference from a drawn SVG map comes from one thing: the
 * ground is a RELIEF-SHADED HEIGHTFIELD, not a set of filled regions. Ridges
 * catch the light on one side and fall into shadow on the other, snow sits on
 * the high ground because it is high rather than because someone drew it there,
 * and the colour comes from elevation instead of from an outline.
 *
 * So this file builds an elevation grid for The Marches, shades it with a light
 * from the north-west, and colours it by height, slope and cover. Everything
 * that reads as three-dimensional on the finished map comes from here.
 *
 * Determinism: no Math.random anywhere. The noise is a hashed value-noise keyed
 * on integer lattice points, so the same map is produced on every machine and
 * every reload. The rule in src/game is not enforced out here, but a map that
 * reshuffles itself between renders would be worse in every way.
 */
import { MAP_W, MAP_H } from "./projection";
import { COAST, ISLETS, LAKES, PEAKS, REGIONS, RIVERS } from "./geography";

/** Sea level on the 0..1 elevation scale. Everything below is water. */
export const SEA_LEVEL = 0.3;

/* ---------------- deterministic value noise ---------------- */

function hash2(ix: number, iy: number): number {
  let h = Math.imul(ix, 0x27d4eb2d) ^ Math.imul(iy, 0x165667b1);
  h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d);
  h = Math.imul(h ^ (h >>> 12), 0x297a2d39);
  return ((h ^ (h >>> 15)) >>> 0) / 4294967296;
}

const smooth = (t: number): number => t * t * (3 - 2 * t);

function valueNoise(x: number, y: number): number {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = smooth(x - x0);
  const fy = smooth(y - y0);
  const a = hash2(x0, y0);
  const b = hash2(x0 + 1, y0);
  const c = hash2(x0, y0 + 1);
  const d = hash2(x0 + 1, y0 + 1);
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
}

/** Fractal noise. Octaves of detail, each finer and quieter than the last. */
function fbm(x: number, y: number, octaves = 5, lacunarity = 2.07, gain = 0.5): number {
  let sum = 0;
  let amp = 1;
  let norm = 0;
  let fx = x;
  let fy = y;
  for (let i = 0; i < octaves; i++) {
    sum += valueNoise(fx, fy) * amp;
    norm += amp;
    amp *= gain;
    fx *= lacunarity;
    fy *= lacunarity;
  }
  return sum / norm;
}

/** Ridged noise, which folds the peaks of the noise into sharp lines. */
function ridged(x: number, y: number, octaves = 4): number {
  let sum = 0;
  let amp = 1;
  let norm = 0;
  let fx = x;
  let fy = y;
  for (let i = 0; i < octaves; i++) {
    const n = 1 - Math.abs(valueNoise(fx, fy) * 2 - 1);
    sum += n * n * amp;
    norm += amp;
    amp *= 0.5;
    fx *= 2.13;
    fy *= 2.13;
  }
  return sum / norm;
}

/* ---------------- the land mask ---------------- */

export interface Field {
  w: number;
  h: number;
  /** Elevation, 0..1. Below SEA_LEVEL is water. */
  height: Float32Array;
  /** 1 inside the drawn coastline, 0 outside. Anti-aliased at the edge. */
  land: Float32Array;
  /** How wooded the ground is, 0..1. Drives colour, not shape. */
  wood: Float32Array;
}

type Cover = string;

/**
 * Rasterise the authored coastline into a mask.
 *
 * The coast is a hand-drawn SVG path and stays the truth for where the land is.
 * The heightfield is built inside it rather than replacing it, so the shape of
 * the realm is still someone's drawing and only the relief is computed.
 */
function rasteriseLand(w: number, h: number): Float32Array {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.scale(w / MAP_W, h / MAP_H);
  ctx.fillStyle = "#fff";
  ctx.fill(new Path2D(COAST));
  for (const d of ISLETS) ctx.fill(new Path2D(d));
  const data = ctx.getImageData(0, 0, w, h).data;
  const out = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) out[i] = data[i * 4 + 3]! / 255;
  return out;
}

/**
 * Rasterise the region polygons, softened.
 *
 * The regions are authored as hard closed shapes, which is right for a drawn
 * map and wrong for a heightfield: a hard edge in elevation reads as a plateau
 * with a cliff, and a hard edge in colour reads as a green blob painted on.
 * Blurring by a good fraction of the region size turns them into influences
 * rather than outlines, which is what they were always meant to be.
 */
function rasteriseCover(w: number, h: number, kinds: Cover[], blurPx = 26): Float32Array {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  if (blurPx > 0) ctx.filter = `blur(${(blurPx * w) / 768}px)`;
  ctx.scale(w / MAP_W, h / MAP_H);
  ctx.fillStyle = "#fff";
  for (const r of REGIONS) {
    if (!kinds.includes(r.cover)) continue;
    ctx.fill(new Path2D(r.d));
  }
  const data = ctx.getImageData(0, 0, w, h).data;
  const out = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) out[i] = data[i * 4 + 3]! / 255;
  return out;
}

/**
 * A smooth field of how mountainous the ground is, built from the authored
 * peaks rather than from a polygon. Ranges follow where the mountains actually
 * are, so ridges run between neighbouring peaks instead of over the whole map.
 */
function massifField(w: number, h: number): Float32Array {
  const out = new Float32Array(w * h);
  const tallest = PEAKS.reduce((m, p) => Math.max(m, p.h), 1);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const mx = (x / w) * MAP_W;
      const my = (y / h) * MAP_H;
      let v = 0;
      for (const p of PEAKS) {
        const dx = mx - p.x;
        const dy = my - p.y;
        const r = 13 + (p.h / tallest) * 12;
        const d2 = (dx * dx + dy * dy) / (r * r);
        if (d2 < 1) {
          const t = 1 - Math.sqrt(d2);
          v = Math.max(v, t * t * (3 - 2 * t));
        }
      }
      out[y * w + x] = v;
    }
  }
  return out;
}

/**
 * Distance in map units from every pixel to the nearest sea, measured by a
 * two-pass chamfer sweep. Land rises as it leaves the coast, which is what
 * stops the interior reading as a flat plate.
 */
function distanceInland(land: Float32Array, w: number, h: number): Float32Array {
  const INF = 1e9;
  const d = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) d[i] = land[i]! > 0.5 ? INF : 0;
  const step = MAP_W / w;
  const diag = step * Math.SQRT2;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      let v = d[i]!;
      if (x > 0) v = Math.min(v, d[i - 1]! + step);
      if (y > 0) v = Math.min(v, d[i - w]! + step);
      if (x > 0 && y > 0) v = Math.min(v, d[i - w - 1]! + diag);
      if (x < w - 1 && y > 0) v = Math.min(v, d[i - w + 1]! + diag);
      d[i] = v;
    }
  }
  for (let y = h - 1; y >= 0; y--) {
    for (let x = w - 1; x >= 0; x--) {
      const i = y * w + x;
      let v = d[i]!;
      if (x < w - 1) v = Math.min(v, d[i + 1]! + step);
      if (y < h - 1) v = Math.min(v, d[i + w]! + step);
      if (x < w - 1 && y < h - 1) v = Math.min(v, d[i + w + 1]! + diag);
      if (x > 0 && y < h - 1) v = Math.min(v, d[i + w - 1]! + diag);
      d[i] = v;
    }
  }
  return d;
}

/* ---------------- the heightfield ---------------- */

/**
 * Build the elevation of The Marches.
 *
 * Four things add up, in order of how much they matter to the eye:
 *
 *   1. The authored peaks, as smooth domes. These are the mountains someone
 *      placed, and they keep their positions.
 *   2. A ridged noise field concentrated on the upland regions, which turns
 *      those domes into ranges with spurs and valleys rather than bumps.
 *   3. Distance inland, so the coast is low and the interior is not a plate.
 *   4. Fine fractal detail everywhere, so no slope is ever perfectly smooth.
 *
 * Rivers then cut a shallow valley, because a river running over a ridge is the
 * fastest way to make a map look computer-generated.
 */
export function buildField(w: number, h: number): Field {
  const land = rasteriseLand(w, h);
  const inland = distanceInland(land, w, h);
  const upland = rasteriseCover(w, h, ["hill", "downs"], 30);
  const moor = rasteriseCover(w, h, ["moor"], 30);
  const wood = rasteriseCover(w, h, ["forest"], 14);
  const marsh = rasteriseCover(w, h, ["marsh"], 20);
  const massif = massifField(w, h);
  const height = new Float32Array(w * h);

  // PEAKS.h is the drawing size of the old symbol, roughly 3 to 5. Normalise it
  // to a share of the elevation range, and give a taller peak a wider footprint
  // so a mountain has flanks rather than being a spike.
  const tallest = PEAKS.reduce((m, p) => Math.max(m, p.h), 1);
  const peaks = PEAKS.map((p) => ({
    x: p.x,
    y: p.y,
    h: p.h / tallest,
    r: 5 + (p.h / tallest) * 11,
  }));

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const mx = (x / w) * MAP_W;
      const my = (y / h) * MAP_H;
      const isLand = land[i]!;

      if (isLand < 0.02) {
        // Sea floor: shelves away from the shore so shallows read lighter.
        const depth = Math.min(1, inland[i]! / 26);
        height[i] = SEA_LEVEL - 0.02 - depth * 0.26 - fbm(mx * 0.06, my * 0.06, 3) * 0.02;
        continue;
      }

      // 1. authored peaks, as broad domes rather than spikes
      let peak = 0;
      for (const p of peaks) {
        const dx = mx - p.x;
        const dy = my - p.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d > p.r) continue;
        const t = 1 - d / p.r;
        peak = Math.max(peak, p.h * t * t * (3 - 2 * t));
      }

      // 2. the shape of the country, at the scale of a county. This is the
      //    layer that stops everything reading as one flat plate with bumps.
      const broad = (fbm(mx * 0.018, my * 0.018, 3) - 0.42) * 0.17;

      // 3. ranges: ridged noise, and ONLY on the massifs. Ridges spread over
      //    the whole map is what makes terrain read as crumpled foil.
      const m = massif[i]!;
      const ridge = m > 0.01 ? (ridged(mx * 0.032, my * 0.032, 4) - 0.32) * m * 0.4 : 0;

      // 4. rolling hill country, wider and gentler than the ranges
      const rolling =
        (fbm(mx * 0.045, my * 0.045, 3) - 0.45) * (upland[i]! * 0.6 + moor[i]! * 0.35);

      // 5. away from the sea
      const rise = Math.min(1, inland[i]! / 40) ** 1.3 * 0.13;

      // 6. detail, kept quiet. Texture, not landform.
      const detail = (fbm(mx * 0.22, my * 0.22, 4) - 0.5) * 0.022;

      let e = SEA_LEVEL + 0.015 + rise + broad + rolling + ridge + peak * 0.46 + detail;

      // Marsh sits low and flat: fen is not hill country.
      e -= marsh[i]! * 0.055;

      // Feather the very edge of the coast so the shoreline is not a cliff.
      if (isLand < 1) e = SEA_LEVEL - 0.01 + (e - SEA_LEVEL + 0.01) * isLand;

      height[i] = e;
    }
  }

  carveRivers(height, w, h);
  carveLakes(height, w, h);
  return { w, h, height, land, wood };
}

/** Rivers cut a shallow valley, so they run in the ground instead of over it. */
function carveRivers(height: Float32Array, w: number, h: number): void {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.scale(w / MAP_W, h / MAP_H);
  ctx.strokeStyle = "#fff";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.filter = "blur(2px)";
  for (const r of RIVERS) {
    ctx.lineWidth = r.width * 3.2;
    ctx.stroke(new Path2D(r.d));
  }
  const data = ctx.getImageData(0, 0, w, h).data;
  for (let i = 0; i < w * h; i++) {
    const v = data[i * 4 + 3]! / 255;
    if (v > 0) height[i] = height[i]! - v * 0.035;
  }
}

function carveLakes(height: Float32Array, w: number, h: number): void {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.scale(w / MAP_W, h / MAP_H);
  ctx.fillStyle = "#fff";
  for (const d of LAKES) ctx.fill(new Path2D(d));
  const data = ctx.getImageData(0, 0, w, h).data;
  for (let i = 0; i < w * h; i++) {
    if (data[i * 4 + 3]! > 120) height[i] = SEA_LEVEL - 0.04;
  }
}

/* ---------------- relief shading and colour ---------------- */

interface Rgb {
  r: number;
  g: number;
  b: number;
}

const rgb = (r: number, g: number, b: number): Rgb => ({ r, g, b });

/**
 * The elevation ramp, sampled at heights above sea level.
 *
 * Deliberately desaturated. Bannerlord's map reads as terrain seen from a long
 * way up, and the thing that sells it is that no colour is bright: shore sand,
 * olive lowland, dry khaki upland, bare grey rock, snow. Saturated green hills
 * are what make a fantasy map look like a board game.
 */
const RAMP: { at: number; c: Rgb }[] = [
  { at: 0.0, c: rgb(178, 166, 132) }, // wet sand at the waterline
  { at: 0.03, c: rgb(150, 152, 106) }, // coastal flat
  { at: 0.09, c: rgb(134, 144, 92) }, // lowland pasture
  { at: 0.18, c: rgb(150, 148, 98) }, // rising ground
  { at: 0.3, c: rgb(172, 158, 110) }, // dry upland
  { at: 0.44, c: rgb(186, 170, 132) }, // high pasture
  { at: 0.56, c: rgb(176, 166, 150) }, // scree
  { at: 0.68, c: rgb(168, 162, 156) }, // bare rock
  { at: 0.82, c: rgb(214, 214, 212) }, // old snow
  { at: 1.0, c: rgb(246, 248, 250) }, // snow
];

function rampAt(t: number): Rgb {
  if (t <= RAMP[0]!.at) return RAMP[0]!.c;
  for (let i = 1; i < RAMP.length; i++) {
    const b = RAMP[i]!;
    if (t <= b.at) {
      const a = RAMP[i - 1]!;
      const k = (t - a.at) / (b.at - a.at);
      return rgb(
        a.c.r + (b.c.r - a.c.r) * k,
        a.c.g + (b.c.g - a.c.g) * k,
        a.c.b + (b.c.b - a.c.b) * k,
      );
    }
  }
  return RAMP[RAMP.length - 1]!.c;
}

const SEA_SHALLOW = rgb(88, 122, 138);
const SEA_DEEP = rgb(30, 48, 68);
const WOODLAND = rgb(78, 96, 62);

/**
 * Paint the field.
 *
 * Relief shading is the standard hillshade: take the surface normal from the
 * local gradient, dot it with a light coming from the north-west at about 45
 * degrees up. North-west is not arbitrary, it is the convention every printed
 * relief map uses, because a light from the other side makes people read
 * valleys as ridges and ridges as valleys.
 *
 * On top of that, a second very soft light from the opposite side lifts the
 * shadows so they read as air rather than as holes, and slope darkens rock
 * faces so cliffs stay legible where the sun happens to hit them flat.
 */
export function paintField(field: Field, snowLine = 0.85): ImageData {
  const { w, h, height, land, wood } = field;
  const img = new ImageData(w, h);
  const out = img.data;

  // Vertical exaggeration. Real terrain shaded honestly looks flat on a screen.
  const zScale = 190 * (w / 640);

  const at = (x: number, y: number): number =>
    height[Math.min(h - 1, Math.max(0, y)) * w + Math.min(w - 1, Math.max(0, x))]!;

  // Light from the north-west, 45 degrees above the horizon.
  const az = (315 * Math.PI) / 180;
  const alt = (46 * Math.PI) / 180;
  const lx = Math.cos(alt) * Math.cos(az - Math.PI / 2);
  const ly = -Math.cos(alt) * Math.sin(az - Math.PI / 2);
  const lz = Math.sin(alt);
  // A weak fill light from the south-east so shadows are not black.
  const fx = -lx * 0.55;
  const fy = -ly * 0.55;
  const fz = 0.72;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const e = height[i]!;
      const o = i * 4;

      if (e < SEA_LEVEL) {
        // Water: depth alone, with a faint shimmer so it is not a flat wash.
        const depth = Math.min(1, (SEA_LEVEL - e) / 0.3);
        const k = depth ** 0.7;
        const shimmer = (fbm(x * 0.05, y * 0.05, 3) - 0.5) * 10;
        out[o] = SEA_SHALLOW.r + (SEA_DEEP.r - SEA_SHALLOW.r) * k + shimmer;
        out[o + 1] = SEA_SHALLOW.g + (SEA_DEEP.g - SEA_SHALLOW.g) * k + shimmer;
        out[o + 2] = SEA_SHALLOW.b + (SEA_DEEP.b - SEA_SHALLOW.b) * k + shimmer;
        out[o + 3] = 255;
        continue;
      }

      // Surface normal from central differences.
      const dzdx = (at(x + 1, y) - at(x - 1, y)) * zScale * 0.5;
      const dzdy = (at(x, y + 1) - at(x, y - 1)) * zScale * 0.5;
      const len = Math.sqrt(dzdx * dzdx + dzdy * dzdy + 1);
      const nx = -dzdx / len;
      const ny = -dzdy / len;
      const nz = 1 / len;

      const key = Math.max(0, nx * lx + ny * ly + nz * lz);
      const fill = Math.max(0, nx * fx + ny * fy + nz * fz);
      // Ambient keeps flat ground from reading as pure key light.
      let shade = 0.26 + key * 0.86 + fill * 0.18;

      // Steepness darkens: rock faces should not wash out.
      const slope = Math.min(1, Math.sqrt(dzdx * dzdx + dzdy * dzdy) / 2.4);
      shade *= 1 - slope * 0.14;

      const above = (e - SEA_LEVEL) / (1 - SEA_LEVEL);
      let c = rampAt(above);

      // Woodland tints the ground rather than covering it, and thins out as the
      // ground climbs, because trees stop before the snow does.
      const treeline = Math.max(0, 1 - Math.max(0, above - 0.34) / 0.28);
      const woody = Math.min(1, wood[i]! * treeline * (0.55 + fbm(x * 0.09, y * 0.09, 4) * 0.5));
      if (woody > 0) {
        c = rgb(
          c.r + (WOODLAND.r - c.r) * woody,
          c.g + (WOODLAND.g - c.g) * woody,
          c.b + (WOODLAND.b - c.b) * woody,
        );
      }

      // Snow settles above the line, and blows off steep faces, so a summit is
      // white and the crags below it stay grey. A blanket of snow over a whole
      // massif is the giveaway of a heightfield with no slope term.
      const snow = Math.max(0, Math.min(1, (above - snowLine) / 0.09)) * (1 - slope * 0.75);
      if (snow > 0) {
        c = rgb(c.r + (244 - c.r) * snow, c.g + (246 - c.g) * snow, c.b + (248 - c.b) * snow);
      }

      // The shoreline gets a pale strand so land meets water with a beach.
      const strand = Math.max(0, 1 - above / 0.02);
      if (strand > 0) {
        c = rgb(
          c.r + (150 - c.r) * strand * 0.5,
          c.g + (142 - c.g) * strand * 0.5,
          c.b + (116 - c.b) * strand * 0.5,
        );
      }

      out[o] = Math.max(0, Math.min(255, c.r * shade));
      out[o + 1] = Math.max(0, Math.min(255, c.g * shade));
      out[o + 2] = Math.max(0, Math.min(255, c.b * shade));
      out[o + 3] = 255 * Math.min(1, land[i]! * 4 + 1);
    }
  }

  return img;
}
