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

---

## Open questions, not yet ruled

These are asked as they become load-bearing, not all at once.

1. **Em-dashes and emoji in player-facing text.** The lore prose uses 45
   em-dashes and reads well. The interface uses emoji as heraldry and icons.
   Henry's global house style rejects both as machine-looking. The lint gate
   currently reports these as warnings and blocks nothing, and no prose has
   been rewritten. Ruling needed before anyone touches it.
2. **Does local standing drift toward house standing?** See ruling 6.
3. **Is honour one axis or several traits?** See ruling 4.
4. **What does a house forgiveness event look like?** Ruling 5 says they exist.
   Nobody has said what earns one.
5. **Repo formatting.** Prettier would rewrite 50 files, most untouched by this
   work. Running it would collide with whatever Lovable generates next. Needs a
   decision about when, ideally at a moment when Danny is not mid-build.
