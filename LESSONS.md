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

## The lockfile pinned 8 packages to a registry only Lovable can reach

**2026-08-31.** Danny's cloud agent could not run `bun install`: it 403'd. The
cause was `bun.lock` pinning the whole Supabase family plus `iceberg-js`, eight
packages, to
`europe-west1-npm.pkg.dev/lovable-core-prod/sandbox-npm-cache/`, which is
Lovable's internal Artifact Registry cache. Everything else, including the
`@lovable.dev` packages themselves, resolved from public npm normally.

The mirror is not merely firewalled off from his sandbox. It answers a request
from anywhere outside Lovable with a 307 and an empty body, so the project could
only be built inside Lovable's own environment. Nobody had noticed because both
Lovable and Henry's machine had the packages cached.

Fixed by deleting the vendor URL from those eight entries so bun resolves them
from the default registry. Versions and integrity hashes were left untouched,
and that is what makes it safe: the public npm tarball for
`@supabase/auth-js@2.112.4` hashes to exactly the `sha512-z8Desgw...` the
lockfile already demanded, so the bytes are identical and the URL was the only
thing wrong.

Proved by installing with `--frozen-lockfile` against a cold cache directory,
which forces a real network fetch and refuses to rewrite the lockfile: 417
packages, the same count as before.

**Watch for it coming back.** Lovable regenerates the lockfile, so a future sync
may reintroduce the mirror URLs. If an install fails for anyone outside Lovable,
check this first:

```sh
grep -c "lovable-core-prod" bun.lock   # must be 0
```

## One player-aimed event starved the other three

**2026-08-31.** `playerEvent` picked what the world does to you with a chain of
early returns, so the FIRST condition that matched always won. A famous and
dishonourable player matched `bounty` immediately and therefore drew bounties
and nothing else, for the whole campaign. `offer`, `shunned` and `welcome` were
written, wired, reachable in principle, and dead in practice.

The R3 gate caught it on its first run, and only because it printed the KINDS
it saw rather than a count. A count would have read 186 events and looked
healthy.

Fixed by gathering every event the ledger currently earns and picking among
them, so eligibility competes instead of racing.

Two things now guard it, both from Isles:
- The gate sweeps four different player profiles, not one. A single profile
  only ever earns one kind of attention, which is how the first version of the
  gate missed this.
- Every declared kind must actually fire somewhere in the sweep, or the gate
  fails by name (Isles G32). Content that never appears is dead code wearing a
  costume.

**Generalise this.** A first-match chain over conditions that overlap is a
starvation bug waiting to happen, and it never announces itself: the feature
works, the tests pass, and three quarters of the content silently never ships.
Measure coverage of kinds, not volume of output.

## An icon name rendered as text, four times, so now it is a gate

**2026-08-31.** Ruling 11 replaced emoji with icon names. Both are strings, so
the compiler cannot tell them apart, and every place that used to render the
emoji as text kept compiling and started printing `house-goldmere` at the
player.

It happened in the title menu, the pause menu, the hero portrait picker, the
muster roll, and the State of the Realm house list. Every one passed `tsc`.
Every one was caught by looking at the screen, and the last was found only
because someone happened to read that line while doing something else.

`scripts/gate-icons.mjs` (I1) now scans JSX for a name-carrying field
interpolated as text, which is the exact shape of the bug. Proved by injecting
the defect and confirming the gate fires on it and not on the correct form.

Two things worth carrying forward:

- **A type-preserving change is the dangerous kind.** Replacing a value's
  MEANING while keeping its TYPE buys no compiler help at all. The `IconName`
  union caught the props and was blind to every bare `{x.banner}`.
- **The first real run found a false positive**, a local variable called
  `banner` holding the boss taunt line. It was renamed to `latestLine` rather
  than the gate being loosened. Weakening a guard to fit the code is how guards
  stop catching things.
