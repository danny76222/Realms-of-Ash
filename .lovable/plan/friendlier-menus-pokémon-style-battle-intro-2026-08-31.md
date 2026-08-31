# Friendlier Menus + Pokémon-Style Battle Intro

Two changes, both presentation-only: clearer menus/settings, and a proper "a battle has begun" transition that sweeps into a Pokémon-style battle layout — keeping the torch-lit, pixel, low-fantasy look.

## 1. Menus and options made friendlier

Title screen
- Group the main actions into a clear stack with plain labels and short helper lines: Continue (shows the latest save's hero and day), New Game, Load Game, Settings.
- Continue is de-emphasised when no save exists instead of silently doing nothing.

In-game top bar
- Keep the stats row, but collapse the button cluster into fewer, clearer controls: Map / Here, Journal, and one Menu button.
- Everything else (Realm, Save & Load, Settings, Abandon) moves into the pause menu, so the header stops being a wall of buttons.
- Pause menu becomes a centred overlay with a dimmed backdrop, big labelled rows with one-line descriptions, and Esc / click-outside to close.

Settings (shared by title and pause menu)
- One panel, grouped into sections: Display (screen transitions, CRT scanlines, larger text, scene art), Text (typewriter dialogue), Audio (UI sounds, ambient soundtrack, volume).
- Each toggle gets a short explanation line, the volume slider shows its percentage and is disabled when both audio toggles are off.
- Both places render the exact same settings component, so they can't drift apart again.

## 2. Battle start animation and Pokémon-style battle screen

Transition (plays whenever a battle begins)
- A short full-screen sequence: torch-flare flash, then diagonal/iris pixel wipes in the amber-and-ash palette, with the encounter title stamping into the middle ("Bandits bar the road").
- Roughly 1.1s, then the battle screen fades up. Skipped instantly when "Screen transitions" is off or reduced motion is set; a click also skips it.
- Plays a low drum/horn sting through the existing sound kit when UI sounds are on.

Battle layout (Pokémon-inspired, same art style)
- Staged arena instead of two equal columns: enemies upper-right on a raised platform, your party lower-left and closer/larger, on a torch-lit backdrop matching the location kind.
- Each side gets a floating status plate (name, HP bar with numeric HP, focus bar, status chips) in an ornate frame, in the classic corner positions.
- Combatants slide in from off-screen on entry — enemies from the right, party from the left.
- Bottom of the screen becomes a fixed command box: a large four-way Attack / Defend / Skill / Flee menu, with Skill and Item opening a sub-list of usable options plus cost and focus availability, and a Back option. Target selection highlights the chosen sprite with a marker.
- The battle text banner sits in the command box and reads one line at a time, with the field log available underneath.

Feedback (kept and strengthened)
- Existing hit/crit/heal shake, flash and floating numbers stay, applied to the new sprite positions; the whole screen gets a brief shake on crits.
- Victory/defeat keeps the current result banner and rewards, now presented in the command box.

## Technical notes

- New `BattleIntro` overlay component driven by a transition flag in the game store when `fight()` runs; it renders above the battle screen and unmounts itself on completion.
- `BattleScreen.tsx` is restructured into arena + status plates + command box subcomponents; combat logic, targeting rules and `act()` calls are unchanged.
- New keyframes in `src/styles.css` for the wipe, sprite entrances, screen shake and command-box slide, all disabled under `html.no-anim` / reduced motion.
- Menu work touches `TitleScreen.tsx`, `TopBar.tsx` and a new shared `SettingsPanel` component; no changes to save data, engine or story logic.
- Intro sting reuses `playSfx` in `src/game/sound.ts`; the ambient score keeps ducking during battle as it does now.
