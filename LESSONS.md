# Lessons and gates

Every rejected output and every bug worth not repeating gets recorded here, with
the gate that now prevents it. Add to this file the moment something is
rejected, not at the end of a session.

Format: what happened, why it was wrong, and the gate that stops it recurring.

Convention borrowed from the Isles project, along with the rule that makes it
work: **a guard proves nothing until it has been shown to FAIL on the defect it
exists to catch.** A passing test on correct code is not evidence.

---

## Gates currently enforced

| # | Gate | Enforced by |
|---|---|---|
| D1 | The same seed and the same inputs produce an identical campaign | `scripts/determinism.ts`, proven by negative control (`--prove`) |
| D2 | No `Math.random`, `Date.now`, `new Date` in the rule files; the one exception (choosing a campaign seed) is declared inline | `eslint.config.js` |
| D3 | No DOM or wall clock in the rule files | `eslint.config.js` |
| S1 | No em-dashes in player-facing text | `eslint.config.js`, currently a WARNING pending direction ruling on open question 1 |

Run them: `bun run gates`

---

## D1 was written wrong the first time, and said so

**2026-08-31.** The first version of the determinism negative control injected
`Math.random()` into the campaign loop and threw the result away. The gate
reported "identical" on all four seeds and the control was recorded as failed,
correctly: a draw whose result never reaches state cannot change state, so it
was not a defect at all and proved nothing.

Fixed by injecting a draw that reaches state (`if (Math.random() < 0.5) g =
advanceDays(g, 1)`), at which point all four seeds drifted and the gate caught
it.

**The lesson is about the shape of the mistake, not the fix.** A negative
control that passes because the injected defect was inert looks exactly like a
working gate. Always check that the control actually made the thing it is
testing behave differently.

## The seed existed and did nothing

**2026-08-31.** `GameState.seed` had been in the type since the beginning and
was read by exactly two systems, the weather and the dungeon generator.
Combat, encounters, quests and the whole world simulation drew from
`Math.random` at twenty sites. So the game looked seeded, saved a seed with
every campaign, and replayed nothing.

Gate D2 now makes this a build failure rather than something you would only
notice by trying to reproduce a bug.

## Recruitment logic lived in a component

**2026-08-31.** The cost check, the party cap and the recruit's name were all
in `LocationScreen.tsx`, and the name was drawn from `Math.random`. Rules in a
component are invisible to the save system, to the gates and to anyone reading
`src/game/`.

Moved to `hireRecruit` in `state.ts`. The general rule is already in
CLAUDE.md; this is the first recorded instance of it being broken.

## Do not bulk-format this repo yet

**2026-08-31.** Prettier would rewrite 50 files, nearly all untouched by any
current work. Danny builds through Lovable, which regenerates code, so a
repo-wide reformat would collide with whatever it produces next and make every
future diff unreadable.

Only files actually being changed are formatted. Recorded as open question 5 in
`docs/DIRECTION.md`.
