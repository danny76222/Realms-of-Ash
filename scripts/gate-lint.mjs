/**
 * Fails only on the determinism gates (D2, D3), not on the 600-odd pre-existing
 * prettier complaints this repo has never been formatted against. Formatting is
 * open question 5 in docs/DIRECTION.md and is deliberately not being fixed while
 * Danny is mid-build in Lovable.
 */
import { ESLint } from "eslint";

const GATE_RULES = new Set(["no-restricted-properties", "no-restricted-globals", "no-restricted-syntax"]);
const results = await new ESLint().lintFiles(["src/game/**/*.ts", "src/game/**/*.tsx"]);
const hits = results.flatMap((r) =>
  r.messages.filter((m) => m.severity === 2 && GATE_RULES.has(m.ruleId ?? "")).map((m) => `${r.filePath}:${m.line}  ${m.message}`),
);
if (hits.length) {
  console.log(hits.join("\n"));
  console.log(`\nD2/D3 FAIL: ${hits.length} violations`);
  process.exit(1);
}
console.log("D2/D3 pass: no unseeded draws, no wall clock, no DOM in the rule files");
