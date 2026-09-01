/**
 * The geography of the Marches, drawn by hand.
 *
 * Every path in this file was authored point by point in the 160 x 100 map
 * space defined by `projection.ts`, and positioned to suit the settlement
 * coordinates that already exist in `src/game/world.ts`. Nothing here is
 * generated from noise at runtime: procedural coastlines look procedural, and
 * this is meant to look drawn.
 *
 * Where the terrain and a settlement disagreed, the terrain moved. Greyfen is
 * damp because the fen reaches it, the Drowned Chapel stands on a tongue of
 * land between the sea and that fen, and the Ashen Marsh is the delta of the
 * river that runs down past the Gallows Oak.
 */

/* ------------------------------------------------------------------ */
/* Coast                                                               */
/* ------------------------------------------------------------------ */

/**
 * The landmass. Land runs off the top of the frame into the northern moors;
 * the sea takes the north-east, the whole eastern seaboard, the south, and
 * bites into the west as the Drowned Water.
 */
export const COAST =
  "M -10 -10 " +
  "L 118 -10 " +
  "C 123 0, 127 7, 136 11 " +
  "C 142 14, 149 14, 153 20 " +
  "C 157 25, 153 30, 148 33 " +
  "C 154 38, 158 46, 154 53 " +
  "C 150 58, 152 64, 156 70 " +
  "C 160 76, 154 82, 148 88 " +
  "C 143 93, 135 89, 129 94 " +
  "C 122 100, 113 92, 105 94 " +
  "C 97 96, 89 101, 81 97 " +
  "C 73 93, 65 99, 57 95 " +
  "C 50 92, 41 96, 34 90 " +
  "C 27 85, 21 88, 16 82 " +
  "C 11 76, 13 69, 9 63 " +
  "C 5 57, 6 51, 12 48 " +
  "C 18 46, 24 49, 28 45 " +
  "C 24 41, 15 42, 11 36 " +
  "C 7 31, 9 27, 13 23 " +
  "C 8 18, 6 9, 10 2 " +
  "C 11 -2, 6 -7, -10 -10 Z";

/** Skerries. Small, but they tell the eye the sea is a sea. */
export const ISLETS = [
  "M 144 26 c 2 -2, 5 -1, 5 1 c 0 2, -4 3, -6 1 z",
  "M 158 60 c 3 -2, 6 0, 5 2 c -1 2, -6 1, -5 -2 z",
  "M 96 99 c 3 -3, 7 -1, 6 2 c -1 2, -7 2, -6 -2 z",
  "M 4 44 c 2 -2, 5 -1, 5 1 c 0 2, -5 3, -5 -1 z",
];

/* ------------------------------------------------------------------ */
/* Fresh water                                                         */
/* ------------------------------------------------------------------ */

/**
 * Rivers, source to mouth. The Marchwater is the spine of the realm: it puts
 * the Old Toll Bridge on a crossing worth taxing and ends in the Ashen Marsh.
 */
export const RIVERS: { id: string; d: string; width: number }[] = [
  {
    id: "marchwater",
    width: 0.9,
    d:
      "M 36 14 C 41 20, 46 21, 50 26 " +
      "C 54 30, 55 32, 58 34 " +
      "C 63 36, 67 32, 72 30 " +
      "C 76 29, 78 33, 80 37 " +
      "C 82 42, 78 46, 74 50 " +
      "C 71 53, 73 58, 76 63 " +
      "C 79 69, 77 76, 79 84 " +
      "C 80 89, 80 93, 81 97",
  },
  {
    id: "silver",
    width: 0.65,
    d:
      "M 120 42 C 117 36, 116 30, 114 24 " +
      "C 113 20, 118 18, 124 17 " +
      "C 131 16, 137 13, 143 9",
  },
  {
    id: "roseford",
    width: 0.7,
    d:
      "M 92 43 C 96 47, 100 51, 105 55 " + "C 109 59, 111 63, 114 68 " + "C 117 74, 120 82, 124 92",
  },
  {
    id: "glenwater",
    width: 0.55,
    d: "M 56 47 C 52 53, 49 58, 46 63 " + "C 42 69, 36 74, 30 79 " + "C 26 82, 22 84, 18 84",
  },
];

/** Where a road crosses water and somebody has built something about it. */
export const BRIDGES: { x: number; y: number; a: number }[] = [
  { x: 71.6, y: 29.8, a: -18 },
  { x: 105.2, y: 55, a: 42 },
  { x: 57.6, y: 33.2, a: 58 },
];

/** Still water: the pool the eastern shrine watches, and a moorland tarn. */
export const LAKES = [
  "M 132 20 c 5 -3, 11 -1, 12 3 c 1 4, -5 7, -11 6 c -6 -1, -7 -6, -1 -9 z",
  "M 30 11 c 4 -2, 9 -1, 9 2 c 0 3, -5 4, -9 3 c -4 -1, -4 -4, 0 -5 z",
];

/* ------------------------------------------------------------------ */
/* Ground cover                                                        */
/* ------------------------------------------------------------------ */

export interface Region {
  id: string;
  /** Which texture fills it. */
  cover: "forest" | "moor" | "downs" | "marsh" | "field" | "hill";
  /** Closed path in map space. */
  d: string;
}

export const REGIONS: Region[] = [
  /* Ravensfell: northern moors, high and thin and cold. */
  {
    id: "high_moor",
    cover: "moor",
    d:
      "M 8 4 C 20 -4, 40 -6, 56 0 " +
      "C 66 4, 70 12, 68 20 " +
      "C 66 27, 56 30, 46 29 " +
      "C 36 28, 26 31, 18 27 " +
      "C 10 23, 4 12, 8 4 Z",
  },
  {
    id: "corvane_moor",
    cover: "moor",
    d:
      "M 14 24 C 24 20, 36 24, 42 30 " +
      "C 46 34, 44 39, 38 40 " +
      "C 30 41, 20 38, 15 34 " +
      "C 11 31, 11 26, 14 24 Z",
  },
  {
    id: "coinmoor_heath",
    cover: "moor",
    d:
      "M 102 36 C 110 32, 120 34, 122 39 " +
      "C 124 44, 117 47, 110 46 " +
      "C 103 45, 98 40, 102 36 Z",
  },

  /* Greyfen and the Drowned Water: half marsh, half village, entirely damp. */
  {
    id: "greyfen_marsh",
    cover: "marsh",
    d:
      "M 12 32 C 20 28, 30 30, 34 36 " +
      "C 38 42, 33 48, 25 49 " +
      "C 17 50, 10 45, 10 39 " +
      "C 10 35, 10 33, 12 32 Z",
  },
  {
    id: "ashen_marsh",
    cover: "marsh",
    d:
      "M 66 60 C 76 56, 88 60, 90 68 " +
      "C 92 76, 84 83, 74 82 " +
      "C 64 81, 58 74, 60 67 " +
      "C 61 63, 63 61, 66 60 Z",
  },

  /* Thornwold: one forest with thirty banners in it. */
  {
    id: "thornwold_deep",
    cover: "forest",
    d:
      "M 30 42 C 42 34, 58 38, 66 48 " +
      "C 72 56, 70 68, 60 76 " +
      "C 50 84, 34 82, 27 72 " +
      "C 21 63, 22 49, 30 42 Z",
  },
  {
    id: "elms_wood",
    cover: "forest",
    d: "M 34 38 C 42 33, 50 35, 52 40 " + "C 54 45, 47 48, 40 47 " + "C 33 46, 30 41, 34 38 Z",
  },
  {
    id: "barrow_wood",
    cover: "forest",
    d: "M 50 36 C 58 32, 68 35, 68 41 " + "C 68 47, 59 49, 53 46 " + "C 48 43, 46 38, 50 36 Z",
  },
  {
    id: "oakhollow_wood",
    cover: "forest",
    d: "M 40 22 C 47 18, 55 20, 55 25 " + "C 55 30, 47 32, 42 29 " + "C 38 27, 37 24, 40 22 Z",
  },

  /* Sunmarch: chalk downland, terraced vines, and better manners. */
  {
    id: "sunmarch_downs",
    cover: "downs",
    d:
      "M 74 42 C 86 34, 104 38, 111 48 " +
      "C 117 57, 109 67, 96 68 " +
      "C 83 69, 72 60, 71 51 " +
      "C 70 46, 71 44, 74 42 Z",
  },

  /* Goldmere and the Free Holds: tilled ground, tolls, and ledgers. */
  {
    id: "goldmere_fields",
    cover: "field",
    d:
      "M 92 16 C 104 10, 124 12, 134 20 " +
      "C 141 26, 136 35, 126 38 " +
      "C 114 42, 99 38, 93 30 " +
      "C 89 24, 89 18, 92 16 Z",
  },
  {
    id: "cassock_fields",
    cover: "field",
    d: "M 64 24 C 74 19, 88 22, 90 29 " + "C 92 36, 83 41, 74 40 " + "C 65 39, 60 32, 64 24 Z",
  },

  /* The middle ground: rough grazing between the toll bridge and the oak. */
  {
    id: "gallows_heath",
    cover: "moor",
    d: "M 60 36 C 70 31, 84 34, 87 42 " + "C 90 50, 80 56, 69 54 " + "C 59 52, 55 41, 60 36 Z",
  },
  {
    id: "toll_pasture",
    cover: "field",
    d: "M 58 26 C 66 22, 74 24, 75 29 " + "C 76 34, 68 37, 62 35 " + "C 56 33, 54 28, 58 26 Z",
  },

  /* The Iron Pact: hill country, and everything under it. */
  {
    id: "pact_hills",
    cover: "hill",
    d:
      "M 108 44 C 122 38, 142 46, 147 60 " +
      "C 152 74, 143 87, 129 89 " +
      "C 114 91, 100 82, 97 70 " +
      "C 94 58, 99 48, 108 44 Z",
  },
];

/* ------------------------------------------------------------------ */
/* Relief                                                              */
/* ------------------------------------------------------------------ */

/**
 * Hand-placed peaks. The Iron Pact's ridges run north-east to south-west
 * behind Draeven Hold; the northern crags stand over the Barrows.
 */
export const PEAKS: { x: number; y: number; h: number }[] = [
  { x: 118, y: 47, h: 3.6 },
  { x: 124, y: 50, h: 4.4 },
  { x: 131, y: 52, h: 3.4 },
  { x: 137, y: 55, h: 4.8 },
  { x: 143, y: 59, h: 3.8 },
  { x: 128, y: 58, h: 3 },
  { x: 134, y: 62, h: 3.6 },
  { x: 141, y: 67, h: 4.2 },
  { x: 146, y: 72, h: 3.2 },
  { x: 131, y: 70, h: 3.4 },
  { x: 137, y: 76, h: 4 },
  { x: 127, y: 80, h: 3.4 },
  { x: 120, y: 76, h: 2.8 },
  { x: 112, y: 52, h: 2.6 },
  { x: 106, y: 62, h: 2.4 },
  { x: 22, y: 6, h: 3.4 },
  { x: 29, y: 3, h: 4 },
  { x: 37, y: 5, h: 3 },
  { x: 16, y: 12, h: 2.6 },
];

/* ------------------------------------------------------------------ */
/* Territory                                                           */
/* ------------------------------------------------------------------ */

/**
 * The claimed borders, as the heralds draw them, not as the war has left
 * them. These are inked contours in the house colour: the live state of who
 * holds what is carried by the wash under each settlement, which reads from
 * `GameState.factions[*].territory` and moves when a village changes hands.
 */
export const TERRITORY: Record<string, string> = {
  ravensfell:
    "M 14 6 C 30 -2, 52 2, 62 12 " +
    "C 70 22, 66 34, 58 40 " +
    "C 48 45, 34 41, 24 36 " +
    "C 14 31, 8 18, 14 6 Z",
  goldmere:
    "M 88 14 C 100 8, 120 10, 134 18 " +
    "C 143 24, 139 38, 126 44 " +
    "C 114 49, 100 45, 93 36 " +
    "C 87 29, 84 18, 88 14 Z",
  ironpact:
    "M 110 42 C 126 37, 144 46, 148 58 " +
    "C 153 71, 146 85, 132 89 " +
    "C 117 93, 101 84, 96 73 " +
    "C 91 62, 100 47, 110 42 Z",
  sunmarch:
    "M 72 41 C 84 33, 103 39, 111 48 " +
    "C 118 57, 110 67, 98 69 " +
    "C 85 71, 73 62, 70 52 " +
    "C 69 47, 69 43, 72 41 Z",
  thornwold:
    "M 30 39 C 44 33, 62 42, 66 54 " +
    "C 71 67, 60 79, 46 81 " +
    "C 32 83, 23 70, 25 56 " +
    "C 26 47, 26 42, 30 39 Z",
  freeholds:
    "M 62 21 C 74 15, 90 19, 95 28 " +
    "C 99 37, 90 45, 78 45 " +
    "C 67 45, 59 36, 60 27 " +
    "C 60 24, 60 22, 62 21 Z",
};
