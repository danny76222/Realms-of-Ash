/**
 * The map's own palette, defined once and referenced as CSS variables
 * everywhere else, rather than as hex literals scattered through the drawing.
 *
 * The theme variables in `styles.css` carry the interface: parchment, ember,
 * iron border. They do not carry sea, heather, or vine, because nothing else
 * in the game needs those. Those live here, in the same dark warm register,
 * and the ones the theme already owns are borrowed rather than restated.
 */
/** CSS custom properties, set on the map frame and read by the drawing. */
export const MAP_VARS: Record<string, string> = {
  "--map-sea": "oklch(0.235 0.045 248)",
  "--map-sea-deep": "oklch(0.185 0.038 254)",
  "--map-shallow": "oklch(0.32 0.05 232)",
  "--map-land": "oklch(0.305 0.028 72)",
  "--map-land-high": "oklch(0.375 0.034 78)",
  "--map-ink": "oklch(0.13 0.02 58)",
  "--map-forest": "oklch(0.355 0.05 152)",
  "--map-forest-ink": "oklch(0.5 0.075 150)",
  "--map-moor": "oklch(0.345 0.032 42)",
  "--map-moor-ink": "oklch(0.52 0.05 46)",
  "--map-downs": "oklch(0.42 0.05 98)",
  "--map-downs-ink": "oklch(0.58 0.07 96)",
  "--map-marsh": "oklch(0.3 0.03 178)",
  "--map-marsh-ink": "oklch(0.48 0.04 180)",
  "--map-field": "oklch(0.37 0.042 86)",
  "--map-field-ink": "oklch(0.54 0.05 84)",
  "--map-hill": "oklch(0.34 0.032 46)",
  "--map-hill-ink": "oklch(0.52 0.05 50)",
  "--map-river": "oklch(0.46 0.07 232)",
  "--map-road": "oklch(0.56 0.045 74)",
};

import type { Region } from "./geography";

/** The texture colour for each ground cover, and the wash beneath it. */
export const COVER_INK: Record<Region["cover"], string> = {
  forest: "var(--map-forest-ink)",
  moor: "var(--map-moor-ink)",
  downs: "var(--map-downs-ink)",
  marsh: "var(--map-marsh-ink)",
  field: "var(--map-field-ink)",
  hill: "var(--map-hill-ink)",
};

export const COVER_WASH: Record<Region["cover"], string> = {
  forest: "var(--map-forest)",
  moor: "var(--map-moor)",
  downs: "var(--map-downs)",
  marsh: "var(--map-marsh)",
  field: "var(--map-field)",
  hill: "var(--map-hill)",
};
