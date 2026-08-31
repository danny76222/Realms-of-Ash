# Realm of Ash

A low-fantasy campaign game. Six houses, one usurper. Built in Lovable,
worked on locally by two people with their own Claude Code sessions.

**Names to know:** the Lovable project is "Realm Of Echoes", the game is
"Realm of Ash", the repo is `Realms-of-Ash`. Same thing.

## Lovable sync: read this first

This repo is connected to Lovable. That has two hard consequences:

1. **Never rewrite published history.** No force push, no rebase, amend or
   squash of anything already pushed. It rewrites history on Lovable's side
   and Danny loses his project history.
2. **Keep `main` working.** Commits pushed to the connected branch sync back
   into the Lovable editor. A broken commit breaks his editor, not just CI.

Because of (1), fix mistakes with a new commit, never by editing the past.

## Two people, two agents

Pull before you start and check `git log` for commits you did not make. Danny
also builds through Lovable, so changes can arrive in this repo without anyone
having typed `git push`.

Work on a branch and open a PR rather than committing to `main` directly.
Agents make large multi-file edits quickly, and two of them on `main` conflict
much harder than two people typing by hand.

## Stack

TanStack Start (not Next, not Remix, not plain React Router), React, TypeScript,
Tailwind, Vite, Supabase. Package manager is **bun**, despite what README.md
says. The README is Lovable boilerplate and is wrong on this point.

If you do not have bun: `curl -fsSL https://bun.sh/install | bash`.
Do not fall back to `npm i`. It would create a competing `package-lock.json`
and drift from the `bun.lock` that Lovable builds against.

```sh
bun install
bun run dev      # vite dev
bun run build
bun run lint     # eslint
bun run format   # prettier
```

`bunfig.toml` sets `minimumReleaseAge = 86400`, a 24 hour supply-chain guard
that blocks packages published in the last day. Do not add entries to
`minimumReleaseAgeExcludes` without asking the repo owner.

`vite.config.ts` uses `@lovable.dev/vite-tanstack-config`, which already
bundles the TanStack, React, Tailwind, tsconfig-paths and nitro plugins. Adding
any of them by hand breaks the app with duplicate plugins.

## Layout

```
src/game/         game logic, plain TS, no React except store.tsx
src/components/game/   one component per screen
src/components/ui/     46 shadcn/radix primitives, generated, leave alone
src/routes/       TanStack file-based routes
src/integrations/supabase/   generated client and auth plumbing
src/assets/art/   67 jpgs, imported as modules
```

### The game core

`src/game/` is the interesting part and it is deliberately framework-free.
`types.ts` defines the domain, `state.ts` and `engine.ts` hold the rules,
`store.tsx` is the only React surface: a context exposing `game`, `screen`,
`battle`, and an `update(fn)` that takes a `GameState => GameState`.

State updates are immutable. Return a new `GameState` from `update`, never
mutate the one you were handed.

Put new rules in `src/game/`, not in a component. A component that computes
combat maths is a bug in the making, because the same maths is needed by the
save system and the dungeon generator.

### Saves are versioned, and that is a trap

`engine.ts` exports `SAVE_VERSION`. Saves live in localStorage under
`roa_saves_v1` and in Supabase `save_slots.state` as JSONB.

**Any change to the shape of `GameState` invalidates existing saves.** If you
change it, bump `SAVE_VERSION` and write a migration for old saves. Danny plays
this game while building it, so silently breaking his campaign is a real cost,
not a theoretical one.

### Supabase

One table, `save_slots`, with RLS on and a policy scoping every row to
`auth.uid() = user_id`. Keep it that way. The publishable key is client-visible
by design and is only safe while RLS holds.

Schema changes go in `supabase/migrations/` as a new file. Never edit an
applied migration.

### Assets

Art is imported as a module, `import titleArt from "@/assets/art/title.jpg"`,
so Vite can hash and bundle it. That is why it lives in `src/assets/` and not
`public/`. Moving it to `public/` breaks every import.

Each image is a full copy in git history every time it is regenerated, so
regenerate art deliberately rather than in bulk.

## Determinism

Every random draw in the rule files comes from `src/game/rng.ts`, seeded from
`GameState.seed`. The same seed and the same inputs replay the same campaign.

`newGame` choosing a seed is the single declared exception, and it says so
inline. Everything else is a build failure, enforced in `eslint.config.js`.

```sh
bun run gates                  # lint + determinism
bun run gate:determinism:prove # watch the gate fail on an injected defect
```

A guard proves nothing until it has been shown to FAIL on the defect it exists
to catch. `scripts/determinism.ts --prove` is that proof, and `LESSONS.md`
records the time the proof itself was wrong.

## Direction and lessons

- `docs/DIRECTION.md` carries numbered rulings on how the game should work. Cite
  them rather than re-arguing them. Add to it the moment a question is answered.
- `LESSONS.md` carries failure modes and the gates that now prevent them. Add to
  it the moment something is rejected.

## Conventions

- `@/` is the alias for `src/`.
- `routeTree.gen.ts` is generated. Do not hand-edit it.
- Routes are file-based: `src/routes/about.tsx` is `/about`, `$id.tsx` is a
  dynamic segment. See `src/routes/README.md`. Do not create `src/pages/` or
  `app/layout.tsx`.
- Prettier decides formatting. Run `bun run format`, do not argue with it.
- `.env` is gitignored. `.env.example` lists the keys. Get real values from the
  Lovable project, never from a teammate over chat.

## House style

The game's voice is dry, grounded, low fantasy. "Six houses, one usurper, and a
great many people who would simply like the roads to be safe again." Match that
register in any player-facing text. No emoji in game copy.
