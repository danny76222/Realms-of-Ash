# Deepening the story, romance, dungeons and presentation

Much of the underlying logic already exists (story flags and branch locking, marriage regard/proposal, per-visit dungeon generation, save snapshots that persist all of it to the backend). This pass surfaces those systems properly in the UI, fills the gaps, and finishes the art and feel.

## 1. Branching story choice UI
- Rework the story screen into a proper decision scene: speaker portrait, scene art, choice cards that show what each option is likely to cost (faction standing, an NPC's regard, a locked branch) before it is picked.
- Add a "consequences so far" ledger, reachable from the quest log, listing the flags the player has set in plain language ("You burned the ledger", "Maud Kell owes you her life").
- Choices already write into story flags, faction relations and NPC affinity; those all ride inside the save snapshot stored in the backend, so a save/load restores the exact branch state. Later beats, side-quest availability, NPC dialogue lines and ending selection read from the same flags.
- Fill remaining gaps: gate a few late-beat missions on specific flags, and make endings check branch + relations + who lived, died or was recruited.

## 2. Marriage / political alliance
- Give eligible nobles a dedicated courtship panel at their home location: a regard meter with named tiers, gift options drawn from inventory, courtship dialogue choices, and the proposal gated on regard and renown.
- Add a wedding event scene (art + narrated beat) instead of the current silent state change, and make marriage shift the spouse's faction stance, pull their wars into the player's late game, and appear in ending text.
- Spouse becomes a party member with a unique line set, and reacts to later story choices.

## 3. Procedural dungeon runs
- Keep the fixed dungeon identity and flavour; per visit, generate a wave sequence with varied room count, encounter composition scaled to party level and dungeon danger, and rolled loot tables (common / uncommon / rare tiers).
- Add a between-wave "delve" screen: room description, current haul, choice to press on or withdraw with what you have.
- Story-linked dungeons get their unique boss at the final wave when the matching story flag is set, with the boss's own skills and a flag-setting reward.

## 4. Remaining portraits
- Paint the five NPCs still on sigil glyphs (Ser Isolde, Ser Perrin, Osrick Quill, Bram Carter, Sister Dulcie) and a portrait per recruitable companion archetype (squire, warrior, archer, scout, healer), in the same painted 16-bit style as the existing set.
- Register them so dialogue, location scenes, party panel and combat all use artwork with the glyph only as a last-resort fallback.

## 5. Combat presentation
- Add portrait panels for both sides: party on the left, enemies on the right, with framed portraits, HP/focus bars, and status badges.
- Brief animations: hit shake and flash, crit emphasis, heal glow, defeat fade.
- Clearer action feedback: highlighted active turn, floating damage/heal numbers, and a one-line result banner for each action (Attack / Defend / Skill / Flee).

## 6. Optional UI sound
- Small synthesized sound set (hover, click, confirm, cancel, screen transition, hit, victory) generated with the Web Audio API so no audio files are needed.
- New Settings toggle plus a volume slider, off by default until enabled, persisted with the other settings.

## 7. Art consistency
- Regenerate the castle banner in the torch-lit amber/ash palette.
- Unify all banners behind one frame treatment: same vignette, grain/texture overlay and aspect ratio, applied through the shared art component rather than per screen.

## 8. Dialogue system
- Shared dialogue box component used by story beats, NPC talk, wedding and ending scenes: typewriter subtitle reveal with click-to-skip, cross-fading portraits, consistent name plate and choice styling.

## Technical notes
- Story flags, faction relations, NPC affinity, marriage and dungeon run counts continue to live in the versioned game-state snapshot persisted to the backend save slots; no schema change is required. If you would rather have flags in their own queryable table, say so and I will add a migration.
- Sound is generated in-browser (no asset downloads) and gated behind the settings flag.
- Combat animations use CSS transitions and respect the existing "reduce animations" setting.

## Scope check
This is a large batch. I would build it in this order: story/dialogue UI → marriage → dungeons → combat panels → portraits and art fixes → sound.
