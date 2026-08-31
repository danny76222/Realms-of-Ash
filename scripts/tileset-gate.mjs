/**
 * Tileset gate: does a candidate tile set actually tile, and does it read as one world?
 *
 * Run: node scripts/tileset-gate.mjs <directory>
 *      node scripts/tileset-gate.mjs --prove
 *
 * The question this answers is not "is the art good". It is the narrower,
 * checkable question the zone-movement decision in docs/DIRECTION.md ruling 2
 * actually hangs on: can we get tiles out of an image tool that join without a
 * seam, at one size, in one palette. Taste is argued about. This is measured.
 *
 * What it measures, per tile:
 *
 * 1. Edge wrap error. A tile laid in a grid puts its right edge column against
 *    the left edge column of the next copy, and its bottom row against the top
 *    row of the copy below. So the right column must continue into the left
 *    column, and the bottom row into the top row. We take the mean absolute
 *    per-channel difference (0 to 255) between those pairs. Zero means the edges
 *    match exactly. A high number means a visible line every 32 pixels.
 *
 * 2. Interior baseline. The mean absolute difference between neighbouring
 *    columns and rows inside the tile. This is how much the texture itself
 *    varies from one pixel step to the next. A noisy grass tile has a high
 *    baseline and a flat stone floor has a low one, so the same absolute seam
 *    error is not equally bad on both. The seam is compared against the tile's
 *    own baseline as well as against a flat number.
 *
 * 3. Geometry. Every tile must be square and all tiles must share one size.
 *    Mixed sizes are not a rendering problem to solve later, they are a brief
 *    that was not followed.
 *
 * 4. Palette. Distinct colour count across the set, plus a flag on any tile
 *    whose mean luminance or mean hue is a clear outlier against the others.
 *    Independently generated tiles drift in hue and value, and the drifting one
 *    is the tile that stops reading as the same world. This flag is advisory and
 *    does not fail the run on its own: six materials that include water and roof
 *    are supposed to differ in hue. It is there so a human looks at the named
 *    tile, not so a script overrules them.
 *
 * A guard proves nothing until it has been shown to FAIL on the defect it exists
 * to catch. That rule comes from the Isles project (gate G5) and is the same
 * reason scripts/determinism.ts has a --prove mode. Here, --prove writes two
 * synthetic tile sets to a temp directory: one that tiles, which the gate must
 * accept, and one built from a left-to-right gradient, which cannot tile and
 * which the gate must reject. If either result comes back the wrong way round,
 * the gate is not trustworthy and --prove exits non-zero.
 *
 * Node built-ins only. The PNG decoder below is deliberate: adding an image
 * library to this repo would mean a bun.lock change and a supply-chain wait for
 * a script that reads six small files.
 */

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import zlib from "node:zlib";

/* ------------------------------------------------------------------ *
 * Thresholds. One home for each number, per Isles gate G171.
 * ------------------------------------------------------------------ */

// Mean absolute per-channel difference across a wrapped edge, 0 to 255.
// 12.0 is roughly 4.7 percent of full range. Tiles whose edges match exactly
// score 0. Honest texture noise in hand-made tiling art lands in the low single
// digits. Anything a person can see as a repeating line scores far above this:
// the deliberate non-tiling gradient in --prove scores over 100.
const SEAM_MAX = 12.0;

// A seam may also fail relative to the tile's own texture. If the wrap error is
// more than 2.5 times the tile's average neighbouring-pixel difference, the join
// is discontinuous in a way the texture does not explain, even when the absolute
// number is small. Only applied when the baseline is meaningful.
const SEAM_RATIO_MAX = 2.5;
const BASELINE_FLOOR = 2.0;

// Robust outlier flags, advisory only.
const LUMA_Z_MAX = 3.5; // modified z score, Iglewicz and Hoaglin
const HUE_DEG_MAX = 60; // circular distance from the set's median hue

/* ------------------------------------------------------------------ *
 * PNG decoding. 8-bit RGB and RGBA, non-interlaced.
 * ------------------------------------------------------------------ */

const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

class UndecodableError extends Error {}

function decodePng(buf, label) {
  const fail = (why) => {
    throw new UndecodableError(`${label}: ${why}`);
  };

  if (buf.length < 8 || !buf.subarray(0, 8).equals(PNG_SIG)) fail("not a PNG file (signature does not match)");

  let off = 8;
  let ihdr = null;
  const idat = [];

  while (off + 8 <= buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString("ascii", off + 4, off + 8);
    const dataStart = off + 8;
    const dataEnd = dataStart + len;
    if (dataEnd + 4 > buf.length) fail(`truncated file, chunk ${type} runs past the end`);

    if (type === "IHDR") {
      ihdr = {
        width: buf.readUInt32BE(dataStart),
        height: buf.readUInt32BE(dataStart + 4),
        bitDepth: buf[dataStart + 8],
        colorType: buf[dataStart + 9],
        compression: buf[dataStart + 10],
        filter: buf[dataStart + 11],
        interlace: buf[dataStart + 12],
      };
    } else if (type === "IDAT") {
      idat.push(buf.subarray(dataStart, dataEnd));
    } else if (type === "IEND") {
      break;
    }
    off = dataEnd + 4;
  }

  if (!ihdr) fail("no IHDR chunk, the file is not a readable PNG");
  if (idat.length === 0) fail("no IDAT chunk, the file carries no image data");

  const COLOR_NAMES = {
    0: "greyscale",
    2: "RGB",
    3: "indexed colour (palette)",
    4: "greyscale with alpha",
    6: "RGBA",
  };

  if (ihdr.interlace !== 0) {
    fail("interlaced (Adam7). This gate decodes non-interlaced PNGs only. Re-export without interlacing.");
  }
  if (ihdr.bitDepth !== 8) {
    fail(`${ihdr.bitDepth}-bit channels. This gate decodes 8-bit channels only. Re-export as 8 bits per channel.`);
  }
  if (ihdr.colorType !== 2 && ihdr.colorType !== 6) {
    const name = COLOR_NAMES[ihdr.colorType] ?? `colour type ${ihdr.colorType}`;
    fail(`${name}. This gate decodes 8-bit RGB and RGBA only. Re-export as RGB or RGBA.`);
  }
  if (ihdr.compression !== 0) fail(`compression method ${ihdr.compression}, only method 0 (deflate) is defined`);
  if (ihdr.filter !== 0) fail(`filter method ${ihdr.filter}, only method 0 is defined`);

  let raw;
  try {
    raw = zlib.inflateSync(Buffer.concat(idat));
  } catch (e) {
    fail(`the compressed image data would not inflate (${e.message})`);
  }

  const { width, height } = ihdr;
  const channels = ihdr.colorType === 6 ? 4 : 3;
  const stride = width * channels;
  const expected = (stride + 1) * height;
  if (raw.length < expected) {
    fail(`decompressed to ${raw.length} bytes, expected ${expected} for ${width}x${height}`);
  }

  // Undo the per-scanline filters. Each scanline is prefixed with a filter byte.
  const out = Buffer.alloc(stride * height);
  let rp = 0;
  for (let y = 0; y < height; y++) {
    const ft = raw[rp++];
    const line = raw.subarray(rp, rp + stride);
    rp += stride;
    const cur = out.subarray(y * stride, y * stride + stride);
    const prev = y > 0 ? out.subarray((y - 1) * stride, (y - 1) * stride + stride) : null;

    for (let i = 0; i < stride; i++) {
      const x = line[i];
      const a = i >= channels ? cur[i - channels] : 0;
      const b = prev ? prev[i] : 0;
      const c = prev && i >= channels ? prev[i - channels] : 0;
      let v;
      switch (ft) {
        case 0:
          v = x;
          break;
        case 1:
          v = x + a;
          break;
        case 2:
          v = x + b;
          break;
        case 3:
          v = x + ((a + b) >> 1);
          break;
        case 4: {
          const p = a + b - c;
          const pa = Math.abs(p - a);
          const pb = Math.abs(p - b);
          const pc = Math.abs(p - c);
          v = x + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c);
          break;
        }
        default:
          fail(`unknown scanline filter type ${ft} on row ${y}`);
      }
      cur[i] = v & 0xff;
    }
  }

  return { width, height, channels, data: out };
}

/* ------------------------------------------------------------------ *
 * PNG encoding, used only by --prove to make its own test images.
 * ------------------------------------------------------------------ */

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encodePngRgb(width, height, rgb) {
  const stride = width * 3;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filter type None, so --prove tests the decoder honestly
    rgb.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  return Buffer.concat([PNG_SIG, chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}

/* ------------------------------------------------------------------ *
 * Measurements.
 * ------------------------------------------------------------------ */

function px(img, x, y, c) {
  return img.data[y * img.width * img.channels + x * img.channels + c];
}

// Mean absolute per-channel difference between two columns.
function columnDiff(img, xa, xb) {
  let sum = 0;
  for (let y = 0; y < img.height; y++) for (let c = 0; c < 3; c++) sum += Math.abs(px(img, xa, y, c) - px(img, xb, y, c));
  return sum / (img.height * 3);
}

function rowDiff(img, ya, yb) {
  let sum = 0;
  for (let x = 0; x < img.width; x++) for (let c = 0; c < 3; c++) sum += Math.abs(px(img, x, ya, c) - px(img, x, yb, c));
  return sum / (img.width * 3);
}

function measure(img) {
  const seamX = columnDiff(img, img.width - 1, 0);
  const seamY = rowDiff(img, img.height - 1, 0);

  let cols = 0;
  for (let x = 1; x < img.width; x++) cols += columnDiff(img, x, x - 1);
  let rows = 0;
  for (let y = 1; y < img.height; y++) rows += rowDiff(img, y, y - 1);
  const baseline = (cols / Math.max(1, img.width - 1) + rows / Math.max(1, img.height - 1)) / 2;

  let lumaSum = 0;
  let hx = 0;
  let hy = 0;
  let hueWeight = 0;
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      const r = px(img, x, y, 0);
      const g = px(img, x, y, 1);
      const b = px(img, x, y, 2);
      lumaSum += 0.2126 * r + 0.7152 * g + 0.0722 * b;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const chroma = max - min;
      if (chroma < 8) continue; // near-grey pixels carry no usable hue
      let h;
      if (max === r) h = ((g - b) / chroma) % 6;
      else if (max === g) h = (b - r) / chroma + 2;
      else h = (r - g) / chroma + 4;
      const rad = (h * 60 * Math.PI) / 180;
      hx += chroma * Math.cos(rad);
      hy += chroma * Math.sin(rad);
      hueWeight += chroma;
    }
  }

  const n = img.width * img.height;
  const hue = hueWeight > 0 ? ((Math.atan2(hy, hx) * 180) / Math.PI + 360) % 360 : null;
  return { seamX, seamY, seam: Math.max(seamX, seamY), baseline, luma: lumaSum / n, hue };
}

function median(xs) {
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function circularMedianDeg(degs) {
  // Smallest total circular distance, evaluated against the candidates themselves.
  let best = degs[0];
  let bestCost = Infinity;
  for (const c of degs) {
    const cost = degs.reduce((a, d) => a + circDist(c, d), 0);
    if (cost < bestCost) {
      bestCost = cost;
      best = c;
    }
  }
  return best;
}

function circDist(a, b) {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

/* ------------------------------------------------------------------ *
 * The gate.
 * ------------------------------------------------------------------ */

function pad(s, n) {
  return String(s).padEnd(n);
}

function fmt(v) {
  return v.toFixed(2).padStart(7);
}

/**
 * Grades every PNG in dir. Returns { ok, tiles, reasons } and prints a report
 * unless quiet. Throws UndecodableError if a file cannot be decoded.
 */
function runGate(dir, { quiet = false } = {}) {
  const say = quiet ? () => {} : (s = "") => console.log(s);

  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
    return { ok: false, tiles: [], reasons: [`Not a directory: ${dir}`] };
  }

  const files = fs
    .readdirSync(dir)
    .filter((f) => f.toLowerCase().endsWith(".png"))
    .sort();

  if (files.length === 0) {
    return { ok: false, tiles: [], reasons: [`No PNG files in ${dir}. Nothing to grade.`] };
  }

  const tiles = files.map((f) => {
    const img = decodePng(fs.readFileSync(path.join(dir, f)), f);
    return { name: f, img, m: measure(img) };
  });

  const reasons = [];

  // Geometry.
  const sizes = new Set(tiles.map((t) => `${t.img.width}x${t.img.height}`));
  for (const t of tiles) {
    if (t.img.width !== t.img.height) reasons.push(`${t.name} is ${t.img.width}x${t.img.height}, not square.`);
  }
  if (sizes.size > 1) reasons.push(`Tiles are not all the same size: ${[...sizes].join(", ")}.`);

  // Per-tile seam grading.
  say(`Tileset gate: ${files.length} PNG file(s) in ${dir}`);
  say(`Threshold: wrap error <= ${SEAM_MAX.toFixed(1)} of 255, and <= ${SEAM_RATIO_MAX}x the tile's own texture baseline.`);
  say("");
  say(`${pad("tile", 26)} ${pad("size", 10)} ${"right|left"} ${"bottom|top"} ${" baseline"}  result`);

  for (const t of tiles) {
    const { seamX, seamY, seam, baseline } = t.m;
    const overFlat = seam > SEAM_MAX;
    const overRatio = baseline >= BASELINE_FLOOR && seam > SEAM_RATIO_MAX * baseline;
    t.pass = !overFlat && !overRatio;
    const why = t.pass ? "PASS" : `FAIL (${[overFlat ? "over threshold" : null, overRatio ? "over baseline ratio" : null].filter(Boolean).join(", ")})`;
    say(`${pad(t.name, 26)} ${pad(`${t.img.width}x${t.img.height}`, 10)} ${fmt(seamX)}    ${fmt(seamY)}    ${fmt(baseline)}  ${why}`);
    if (!t.pass) reasons.push(`${t.name}: wrap error ${seam.toFixed(2)} (right|left ${seamX.toFixed(2)}, bottom|top ${seamY.toFixed(2)}, baseline ${baseline.toFixed(2)}).`);
  }

  // Palette.
  const colours = new Set();
  for (const t of tiles) {
    const { width, height, channels, data } = t.img;
    for (let i = 0; i < width * height; i++) {
      const o = i * channels;
      colours.add((data[o] << 16) | (data[o + 1] << 8) | data[o + 2]);
    }
  }

  say("");
  say(`Palette: ${colours.size} distinct colours across ${tiles.length} tile(s).`);

  const lumas = tiles.map((t) => t.m.luma);
  const lMed = median(lumas);
  const lMad = median(lumas.map((v) => Math.abs(v - lMed))) || 1e-9;
  const hues = tiles.filter((t) => t.m.hue !== null).map((t) => t.m.hue);
  const hMed = hues.length ? circularMedianDeg(hues) : null;

  const flags = [];
  for (const t of tiles) {
    const z = (0.6745 * (t.m.luma - lMed)) / lMad;
    if (Math.abs(z) > LUMA_Z_MAX) flags.push(`${t.name}: mean luminance ${t.m.luma.toFixed(1)} against a set median of ${lMed.toFixed(1)}.`);
    if (hMed !== null && t.m.hue !== null && circDist(t.m.hue, hMed) > HUE_DEG_MAX) {
      flags.push(`${t.name}: mean hue ${t.m.hue.toFixed(0)} degrees, ${circDist(t.m.hue, hMed).toFixed(0)} degrees off the set median of ${hMed.toFixed(0)}.`);
    }
  }

  if (flags.length) {
    say("Palette flags (advisory, look at these tiles by eye):");
    for (const f of flags) say(`  ${f}`);
  } else if (tiles.length > 1) {
    say("Palette flags: none. No tile sits far off the set in hue or value.");
  }

  const passed = tiles.filter((t) => t.pass).length;
  say("");
  say(`${passed}/${tiles.length} tiles pass the seam threshold.`);

  return { ok: reasons.length === 0, tiles, reasons };
}

/* ------------------------------------------------------------------ *
 * --prove: show the gate accepting a tiling image and rejecting one that
 * cannot tile. Without the rejection half, a passing run means nothing.
 * ------------------------------------------------------------------ */

function makeTiling(size, seed) {
  // A wrapping sine texture: continuous by construction across both edges,
  // because every term uses a whole number of cycles over the tile.
  const rgb = Buffer.alloc(size * size * 3);
  let s = seed;
  const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  const base = [70 + rnd() * 40, 90 + rnd() * 50, 60 + rnd() * 30];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const w = Math.sin((2 * Math.PI * 2 * x) / size) * Math.cos((2 * Math.PI * 3 * y) / size) * 14 + Math.sin((2 * Math.PI * (x + y)) / size) * 8;
      const o = (y * size + x) * 3;
      for (let c = 0; c < 3; c++) rgb[o + c] = Math.max(0, Math.min(255, Math.round(base[c] + w)));
    }
  }
  return encodePngRgb(size, size, rgb);
}

function makeNonTiling(size) {
  // A left-to-right, top-to-bottom ramp. Smooth inside, so its texture baseline
  // is low, and hard discontinuity at both wraps. This is the defect the gate
  // exists to catch: the tile that looks fine on its own and shows a grid of
  // lines the moment it is laid out.
  const rgb = Buffer.alloc(size * size * 3);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const o = (y * size + x) * 3;
      const v = Math.round((x / (size - 1)) * 200 + 20);
      const u = Math.round((y / (size - 1)) * 180 + 30);
      rgb[o] = v;
      rgb[o + 1] = u;
      rgb[o + 2] = Math.round((v + u) / 2);
    }
  }
  return encodePngRgb(size, size, rgb);
}

function prove() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "tileset-gate-prove-"));
  const goodDir = path.join(root, "tiling");
  const badDir = path.join(root, "not-tiling");
  fs.mkdirSync(goodDir);
  fs.mkdirSync(badDir);

  const NAMES = ["grass", "dirt", "stone", "water", "wall", "roof"];
  NAMES.forEach((n, i) => fs.writeFileSync(path.join(goodDir, `${n}.png`), makeTiling(32, 1000 + i * 77)));
  fs.writeFileSync(path.join(badDir, "grass-gradient.png"), makeNonTiling(32));

  console.log("Proving the gate. A guard proves nothing until it has been shown to fail on the defect it catches.");
  console.log(`Temp directory: ${root}`);
  console.log("");
  console.log("Control 1: six synthetic tiles that wrap by construction. The gate must ACCEPT these.");
  console.log("");
  const good = runGate(goodDir);
  console.log("");
  console.log("Control 2: one tile built from a left-to-right ramp, which cannot tile. The gate must REJECT it.");
  console.log("");
  const bad = runGate(badDir);
  console.log("");

  let ok = true;
  if (good.ok) {
    console.log("Control 1: the gate accepted the tiling set. Correct.");
  } else {
    console.log("Control 1 WRONG: the gate rejected a set that does tile. It is too strict to trust.");
    for (const r of good.reasons) console.log(`  ${r}`);
    ok = false;
  }
  if (!bad.ok) {
    const seam = bad.tiles[0] ? bad.tiles[0].m.seam.toFixed(2) : "n/a";
    console.log(`Control 2: the gate REJECTED the non-tiling image, wrap error ${seam} against a threshold of ${SEAM_MAX.toFixed(1)}. Correct.`);
  } else {
    console.log("Control 2 WRONG: the gate accepted an image that cannot tile. It would pass a broken tileset.");
    ok = false;
  }

  fs.rmSync(root, { recursive: true, force: true });
  console.log("");
  console.log(ok ? "PROVE PASS: the gate accepts what tiles and rejects what does not." : "PROVE FAIL: the gate is not trustworthy. Fix it before grading real art.");
  return ok;
}

/* ------------------------------------------------------------------ *
 * Entry point.
 * ------------------------------------------------------------------ */

const args = process.argv.slice(2);

try {
  if (args.includes("--prove")) {
    process.exit(prove() ? 0 : 1);
  }

  const dir = args.find((a) => !a.startsWith("--"));
  if (!dir) {
    console.error("Usage: node scripts/tileset-gate.mjs <directory>");
    console.error("       node scripts/tileset-gate.mjs --prove");
    process.exit(2);
  }

  const result = runGate(path.resolve(dir));
  if (!result.ok) {
    console.error("");
    console.error("FAIL:");
    for (const r of result.reasons) console.error(`  ${r}`);
    console.error("");
    console.error("See docs/ART-BRIEF-tileset.md for what pass means and what to do if this keeps failing.");
    process.exit(1);
  }
  console.log("PASS: every tile wraps, all tiles are square and one size.");
  process.exit(0);
} catch (e) {
  if (e instanceof UndecodableError) {
    console.error(`Cannot decode: ${e.message}`);
    console.error("This gate reads 8-bit RGB or RGBA, non-interlaced PNGs. It will not guess at anything else.");
    process.exit(3);
  }
  throw e;
}
