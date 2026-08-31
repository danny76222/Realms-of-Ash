# Direction rulings

Henry and Danny's answers on how Realm of Ash should work, numbered so they can
be cited and not re-litigated. Claude asks; the ruling is recorded the moment it
is given, with the reasoning where it was given.

A ruling can be superseded. It is never quietly dropped: strike it through, add
the new one, and say what changed.

Format borrowed from the Isles project, where the same file stopped the same
three arguments recurring every session.

---

## 1. The spine is the succession war

**Ruled 2026-08-31.** Reputation drives the events that happen, in the manner of
Red Dead Redemption 2. The six houses matter. Routine and relationships serve
the war rather than replacing it.

Consequence: when scope grows, cut whatever does not feed the war.

## 2. Movement is zones, not one continuous world

**Ruled 2026-08-31.** You walk around inside places, and still travel between
them on the realm map. The existing `links` graph in `world.ts` becomes the
doors out of each zone.

Consequence: the faction geography is preserved. `ZoneExit.to` must name a
location already in that location's `links`, so there is one source of truth for
how the realm connects.

## 3. Combat stays on a separate battle screen

**Ruled 2026-08-31.** Encounter, transition, fight, return. Position never
enters the fight.

Reasoning: `Battle` holds combatants, order, turn and round, and has no
coordinates anywhere. Turn-based combat on the overworld tiles would mean
rewriting `engine.ts` from nothing. The existing engine is good and it stays.

## 4. Renown measures fame AND virtue

**Ruled 2026-08-31.** Both, as two separate things.

- **Fame** is the size of your name. It rises with deeds of any moral colour.
  A butcher and a hero both become known.
- **Honour** is the colour of your name. It moves on how you got there.

Consequence: `GameState.renown` is currently one number and is not enough. It
becomes two. A famous, dishonourable player and a famous, honourable one should
meet different worlds, not the same world at a different volume.

Open: whether honour is one axis or a small set of traits. Not yet asked.

## 5. Houses forgive, by event and by decay

**Ruled 2026-08-31.** Standing recovers two ways: a triggered event that earns
forgiveness, and a slow tick back toward neutral over time.

Consequence: the mid game is recoverable. A bad early choice is a wound, not a
sentence. Decay needs a resting point per house, which means a `data/` file
rather than numbers scattered in `src/` (Isles gate G171: a threshold has one
home).

## 6. Reputation is per area, not only per house

**Ruled 2026-08-31.** Standing is local as well as political. A player can be
welcome in one Ravensfell village and hated in the next one over.

Consequence: this is a fourth tier the design did not have, below house and
above nothing. It is the tier zones will read when they load, so it is the tier
that makes walking around feel different. Needs a new field on `GameState`
keyed by location.

Open: does local standing drift toward its house's standing over time, or are
they fully independent? Not yet asked.

## 7. The player gets a ledger screen

**Ruled 2026-08-31.** A visible screen carrying all reputation, stats and
standing. Not hidden.

Reasoning: Claude argued hidden reads better; Henry ruled for visible. Recorded
because the argument should not be had again.

Consequence: the world must still show standing through behaviour as well. The
ledger is where you check a number you already suspected, not the only place the
game tells you.

## 8. The world map must become a real map

**Ruled 2026-08-31.** It is a grid of nodes and lines at the moment. It needs to
be an actual drawn map.

Reference: Isles gates G60, G61 and G110 cover exactly this, measuring that the
drawn coast keeps its shape and that the ground is a wash rather than a stain.
Worth reading before starting.

Not yet scheduled.

## 9. Point of no return: deferred to Claude

**Ruled 2026-08-31**, Henry deferred. Claude's answer, to be confirmed or
overruled:

Reputation **gates** the branch choice and does not lock it. You cannot
credibly take the loyalist path if Ravensfell despises you, so standing decides
which branches are open to you when the choice arrives. Once taken, the branch
fixes the frame of the endgame, but reputation keeps moving inside it, and a
branch pursued against your own standing should be harder rather than
forbidden.

Reasoning: locking on reputation makes the first third of the game the only part
where standing matters, which contradicts ruling 1. Gating keeps it live to the
end.

## 10. Determinism: the same seed replays the same campaign

**Ruled 2026-08-31**, Claude's call under "steal anything useful from Isles",
implemented the same day.

`GameState.seed` existed but only the weather and the dungeons read it.
Everything else drew from `Math.random` at twenty sites, so the same seed
produced a different campaign every time.

Consequence: every rule-level draw now comes from `src/game/rng.ts`, seeded from
the campaign. Enforced by eslint, proved by `scripts/determinism.ts`, which is
shown to fail on an injected unseeded draw before it is trusted.

This is what makes the reputation work tunable: you cannot ask whether standing
changed the events without running the same campaign twice.

## 11. No em-dashes, no emoji

**Ruled 2026-08-31.** Cut both. This closes what was open question 1.

Where the line falls, since "emoji" needs a definition to be gateable:

- **Cut:** pictographic emoji, the ones that render as colour glyphs. These were
  doing real work as house banners, map markers, weather, class sprites, hero
  portraits, battle actions and stat labels, so they are **replaced**, not
  deleted. `src/components/game/icons.tsx` holds the replacement set: 16x16
  inline SVG in currentColor, so the marks take the theme and sit with the
  pixel type. The game layer now stores icon NAMES and only the interface knows
  what a name looks like.
- **Kept:** monochrome typographic marks that render as text, currently the
  star, the tick, the play triangle, the lozenge and the middle dot. They are
  punctuation, not pictures.
- **Cut:** the em-dash, replaced with the punctuation a human editor would
  choose, varied by sentence. The prose is not otherwise rewritten. Word choice,
  sentence length and meaning are untouched.

## 12. The tileset question gets answered by measurement

**Ruled 2026-08-31**, Claude's call under ruling 8's dependency.

Whether AI tooling can produce a usable tileset is the real gate on zone
movement, and it is not a matter of opinion. There is now a commissioning brief
(`docs/ART-BRIEF-tileset.md`) and a gate that measures candidate tiles
(`scripts/tileset-gate.mjs`) for edge wrap error, consistent dimensions and
palette drift, with a negative control.

Six tiles is enough to find out: grass, dirt path, stone, water, wall, roof.

## 13. No preview deploy yet

**Ruled 2026-08-31.** Danny reviews the build through Claude rather than
playing a hosted copy. Revisit once Lovable sync exists.

When we do deploy, it is **guest saves only**: local storage, no Supabase
variables on the host. The keys are publishable and protected by RLS, so the
reason is fewer moving parts rather than safety.

Two things worth keeping, since they took a while to establish:

- The build already targets Cloudflare Workers. `bun run build` emits the
  `cloudflare-module` nitro preset and writes its own `wrangler.json`, so a
  deploy is `npx wrangler deploy` from `.output/server` and needs no config
  change. Netlify would mean switching the preset and spending build credits
  for no gain.
- **Lovable's own Publish button ships Lovable's copy of the code, not this
  repo.** Until the GitHub connection exists, pressing it publishes the game as
  it was before any of this work. Nobody should reach for it as a shortcut.

## 14. Steps 1 to 3 are built, and measured

**Built 2026-08-31.** Rulings 1, 4, 5 and 6 are now in the code rather than in
this document.

- **Fame and honour are separate numbers** (ruling 4). `GameState.renown` is
  gone. Save version 6, with a real migration that carries old renown into fame
  rather than refusing the save.
- **Standing is per place** (ruling 6), `GameState.standing`, keyed by location.
  Quests pay into it, and the road reads it.
- **House standing trades** (step 2). `shiftRep` now carries a shift to houses
  at war with or allied to the one you moved, so there is no free favour.
- **The world reads the ledger** (step 1). `simulateWorldDay` weights how often
  anything happens by fame, which houses it happens to by how badly you have
  offended them, and pulls events toward the ground you are standing on.
- **Houses and places forgive** (ruling 5), one point at a time, the court
  faster than the village.
- **Events aimed at the player** (step 3): bounty, offer, shunned, welcome.

Every number the system reads lives in `src/game/reputation.ts` and nowhere
else, so it is tuned in one place.

Measured by `bun run gate:reputation`, which is the point. The claim
"reputation drives events" is worth nothing until something checks it:

- Offending a house makes it appear **2.74x** more often in your world, and the
  effect held on **8 of 8** seeds.
- A famous player gets 266 events where an unknown gets 161.
- All four player-aimed kinds fire, each for the life that earns it.

The control runs both arms identically and must report no effect, so a reported
effect is real rather than noise.

## 15. The Ledger is built

**Built 2026-08-31**, ruling 7. Menu, then The Ledger.

It carries fame and honour with what each currently means in words, standing
with all six houses as bars that read negative left of centre, every place that
has formed a view of you, and the realm's own record of what it did about you.

The ruling's warning is designed into it: the world must still show standing
through behaviour, so every reading says what it means rather than only what it
is, and the last section is the world's actions rather than the player's stats.

## 16. Forgiveness is asymmetric

**Amends ruling 5, 2026-08-31**, on evidence from the playtest harness.

Ruling 5 said houses forgive by slow decay toward neutral. Built symmetrically,
that made favour evaporate as fast as injury, so every campaign converged on
every house regarding the player as a stranger, and reputation stopped driving
anything late in the game.

A grudge now heals every 8 days. A favour fades every 40. A place holds both
longer than a court does, because people live there.

Ruling 5 otherwise stands. The event half of forgiveness is still unbuilt.

---

## 17. Ruling 13 is superseded: it deploys now, unlisted

**Amends ruling 13, 2026-08-31.** Danny wants a link he can open on his iPad.
Ruling 13's "no preview deploy yet" is retired; everything else it said about
_how_ to deploy, still stands and is what got built.

- **Unlisted, not authenticated.** No login screen, no password. The
  `*.workers.dev` link Cloudflare hands back is not listed or indexed
  anywhere, so nobody finds it without being given it, but anyone holding the
  exact URL can open it. If that stops being enough, ruling 13 already named
  the upgrade path: Cloudflare Access in front of the same deploy.
- **Guest saves only, exactly as ruling 13 already specified.** No Supabase
  variables on the host. The publishable key is safe to expose, but the
  reason to still leave it off is the one ruling 13 gave: fewer moving parts
  on something public-ish, not safety.
- **Danny deploys it himself, from his own machine**, not Claude from this
  session: `bun run build` then `npx wrangler deploy --prebuilt` from
  `.output/server`, against his own Cloudflare account. Keeps Cloudflare
  credentials out of any cloud session entirely.
- **Lovable's Publish button is still the wrong button.** Ruling 13's warning
  there was never about the preview deploy question; it stands untouched.

---

## 18. Side quests get a real choice, not just accept or don't

**Proposed 2026-08-31, deferred to Danny and Henry.** Claude's answer, to be
confirmed, amended, or overruled:

Danny asked for dialogue that affects the storyline and quests. The main
questline already has exactly that: `StoryBeat.choices` in `story.ts`, full
branching, gated by reputation (ruling 9), landing in one of seven endings.
What has none of it is `generateSideQuests` (`progress.ts`). Every side quest
is accept-or-don't, one flat `desc` line shared by every quest of that kind,
realm-wide. Recruitment in a tavern has a person and a name; a bandit-clearing
job from the same village does not.

Proposal, scoped small on purpose:

- **One real choice at accept, not a dialogue tree.** `For coin` (today's
  numbers, unchanged) or `As a favour` (refuse payment: `rewardGold` drops to
  0, `npcShift` doubles, and the quest grants a small honour award it
  currently does not). This is a fourth lever alongside gold, fame and
  reputation, and it is the first side-quest content to move honour at all;
  open question 2 already flagged that most non-story choices carry no
  authored honour value.
- **A giver line, not a quest-log line.** `desc` is one string per `kind`
  today. It becomes two, keyed by `kind` and the choice about to be made,
  voiced as the giver asking rather than the log describing. Still fully
  procedural, still no per-location authoring.
- **Not touching the main questline.** `StoryBeat`/`StoryChoice` already does
  the bigger version of this well; ruling 3's reasoning for leaving working
  systems alone applies here too.
- **Measured, not just built.** The reputation gate already sweeps four
  player temperaments; extending it to assert both choices actually get taken
  across the sweep, and that they produce different fame/honour/gold
  outcomes, is what makes "quests now have a real choice" a checked claim
  rather than a description of the diff.

Consequence: `SideQuest` needs a per-kind pair of giver lines instead of one,
`acceptQuest` takes the choice and branches the reward math, and
`completeQuest` reads back which one was taken. No new screen: this fits in
the same accept step `LocationScreen.tsx` already has.

Reasoning for staying small: Danny asked for the light-touch version over a
full quest-giver dialogue-tree overhaul, given the size of the rest. Worth
revisiting for a bigger pass later, closer to how ledger and reputation went
in ruling 14 to 16, once this smaller version has actually been played.

---

## Open questions, not yet ruled

These are asked as they become load-bearing, not all at once.

1. **Does local standing drift toward house standing?** See ruling 6. Built as
   fully independent for now: a village can hate you while its house does not.
   Cheap to change, and worth playing before deciding.
2. **Is honour one axis or several traits?** See ruling 4. Built as one axis.
   Honour currently moves from quests and, where a choice does not author a
   value, is derived from unambiguous acts: killing a named person costs 8.
   Most story choices still carry no authored honour value, so honour moves
   less than fame does. Authoring those is real work and wants a view on what
   each choice means.
3. **What does a house forgiveness event look like?** Ruling 5 gave houses a
   slow decay toward neutral, which is built. The _event_ half is not: nothing
   yet lets you earn forgiveness deliberately.
4. **Repo formatting.** Prettier would rewrite 50 files, most untouched by this
   work. Running it would collide with whatever Lovable generates next. Needs a
   decision about when, ideally at a moment when Danny is not mid-build.
5. **Do the heraldic marks need real art eventually?** The six house devices are
   geometric SVG. They read cleanly and cost nothing, but a drawn charge per
   house would carry more of the world. Not urgent.
