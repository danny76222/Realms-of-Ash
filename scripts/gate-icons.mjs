/**
 * Gate I1: an icon NAME is never rendered as text.
 *
 * Since ruling 11, the game layer stores icon names ("house-goldmere") where it
 * used to store emoji. Both are strings, so the compiler cannot tell them
 * apart, and every place that rendered the old emoji as text kept compiling and
 * started printing the name instead.
 *
 * That has now happened four times: the title menu, the pause menu, the hero
 * portrait picker, the muster roll, and the State of the Realm house list. Each
 * one passed `tsc` and was only caught by looking at the screen. A fifth would
 * be a failure of process, so this is a gate rather than another note.
 *
 * It scans JSX for a name-carrying field interpolated as text, which is the
 * exact shape of the bug: `{f.banner}` rather than `<Icon name={f.banner} />`.
 *
 * Run:      node scripts/gate-icons.mjs
 * Control:  node scripts/gate-icons.mjs --prove
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const FIELDS = ["banner", "sprite", "glyph", "portrait"];
// `{x.banner}` or `{GLYPH.anything}` sitting where JSX renders text, meaning it
// is not being passed as a prop (`name={...}`) and not inside a string.
const BARE = new RegExp(String.raw`(?<![\w=])\{\s*(?:[A-Za-z_$][\w$]*\.)?(?:${FIELDS.join("|")})\s*\}`);
const GLYPH_CONST = /(?<!=)\{\s*GLYPH\.\w+\s*\}/;

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (full.endsWith(".tsx")) out.push(full);
  }
  return out;
}

function scan(text, file) {
  const hits = [];
  text.split("\n").forEach((line, i) => {
    if (line.trimStart().startsWith("//") || line.trimStart().startsWith("*")) return;
    if (BARE.test(line) || GLYPH_CONST.test(line)) {
      hits.push(`${file}:${i + 1}  ${line.trim().slice(0, 100)}`);
    }
  });
  return hits;
}

const PROVE = process.argv.includes("--prove");

if (PROVE) {
  const defect = `      <span aria-hidden>{f.banner}</span>\n      <span>{GLYPH.gold} gold</span>\n`;
  const caught = scan(defect, "injected.tsx");
  const clean = scan(`      <Icon name={f.banner} />\n      <Icon name={GLYPH.gold} />\n`, "clean.tsx");
  console.log(`injected defect produced ${caught.length} hits (want 2)`);
  console.log(`the correct form produced ${clean.length} hits (want 0)`);
  const ok = caught.length === 2 && clean.length === 0;
  console.log(
    ok
      ? "\ncontrol PASSED: the gate catches the defect and does not fire on the fix"
      : "\ncontrol FAILED: the gate cannot tell the defect from the fix",
  );
  process.exit(ok ? 0 : 1);
}

const hits = walk("src/components").flatMap((f) => scan(readFileSync(f, "utf8"), f));
if (hits.length) {
  console.log(hits.join("\n"));
  console.log(`\nI1 FAIL: ${hits.length} icon name(s) rendered as text. Use <Icon name={...} />`);
  process.exit(1);
}
console.log("I1 pass: no icon name is rendered as text");
