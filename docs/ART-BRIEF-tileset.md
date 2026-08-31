# Art brief: the first tileset test

Ruling 2 in `docs/DIRECTION.md` says movement becomes zones you walk around in.
The code for that is known work. The unknown is the art: whether we can produce
tiles that join without a seam and a character who stays the same person across
his walk frames. This brief exists to answer that question this week, with a
number rather than an argument.

This is a test, not the tileset. Six ground tiles and one character. If the six
pass, we commission the rest on the same terms. If they do not, we take one of
the fallbacks at the bottom and we stop debating zone movement on the strength
of how the samples felt.

Everything here is checkable by `scripts/tileset-gate.mjs`, which is what "pass"
means. Run it before sending anything back for review.

## 1. What to deliver

Six ground tiles, as six separate PNG files, in one directory:

| File | What it is |
| --- | --- |
| `grass.png` | Open ground. The default surface of a village or field zone. |
| `dirt.png` | A worn dirt path. Reads as walked on, not as bare soil. |
| `stone.png` | Interior stone floor. Keep or hall. |
| `water.png` | Still water. Impassable, so it must read as impassable at a glance. |
| `wall.png` | Stone wall face, seen from the side as a vertical surface. |
| `roof.png` | Tiled or thatched roof, seen from above. |

Plus one character sprite sheet, specified in section 4.

Format: PNG, 8 bits per channel, RGB or RGBA, not interlaced, not indexed
colour. The gate reads those and refuses anything else by name rather than
guessing at it.

## 2. Tile size: 32x32

Deliver every tile at 32 by 32 pixels.

The reasoning is short. 16x16 is not enough room to draw a stone wall that reads
as stone at a glance, and we would spend the saving on detail we cannot fit.
64x64 quadruples the pixels an image tool has to keep coherent, and coherence is
the thing being tested. 32x32 is the size most top-down games of this kind
settle on, which also means the fallback of buying an existing tileset stays
open, because most licensed sets are sold at 32. At 32 a character stands about
one and a half tiles tall and a small village zone is roughly 30 by 20 tiles,
which is a screen you can cross in a few seconds.

Every tile must be square and all six must be the same size. Mixed sizes are not
something to fix in the renderer later. They are a brief that was not followed.

## 3. Seamlessness, stated exactly

A tile is laid down repeatedly in a grid. Each copy sits directly against the
next. So:

- The rightmost column of pixels must continue into the leftmost column. Put the
  tile's right edge against its own left edge and the texture must carry on with
  no line, no step in brightness, no interruption in the pattern.
- The bottom row of pixels must continue into the top row, on the same terms.

Said another way: the tile must wrap. If you laid a four by four grid of the same
tile and looked at it, you should not be able to see where one copy ends and the
next begins.

This is the single most common failure of image-tool output. A generated texture
usually looks correct on its own and shows a grid of lines the moment it is
tiled, because nothing in the generation process knew the edges had to meet.
Expect to fix this deliberately, by offsetting the image by half its width and
height and painting out the cross that appears in the middle, or by using a tool
mode that generates tileable output directly.

Detail that reads as a specific object, a distinctive rock or a bright flower,
will repeat visibly across a field even when the edges are perfect. Keep the six
ground tiles low in contrast and free of landmarks. Landmarks belong in a later
set of props, not in the ground.

## 4. The character sprite

One character, drawn as a sprite sheet.

- Four directions: facing down, up, left, right. Down is the character seen from
  the front, walking toward the camera.
- At least three frames per direction: one idle standing frame and two walk
  frames. Twelve frames minimum in total. If you deliver four walk frames per
  direction that is welcome, but three is the bar.
- Left and right may be mirrored from each other. Down and up may not, since they
  show different sides of the character.

Across every one of those frames, these must not change:

- **Silhouette.** Same height, same build, same outline. A character who gains or
  loses bulk between frames flickers when animated, and that is more distracting
  than a low frame count.
- **Palette.** Exactly the same colours on the cloak, the hair, the boots, in
  every frame. Not similar colours. The same ones.
- **Light direction.** One light source, in the same place for all frames.
  Shadows fall the same way whichever direction the character faces.

Character consistency across frames is the second thing image tools reliably fail
at, and unlike seams it cannot be measured by a script. It is judged by animating
the frames and watching. If the character shimmers, changes colour, or grows and
shrinks, it is a fail regardless of how good each single frame looks.

Deliver either a single sheet with frames in a regular grid, or one PNG per
frame, named `hero-down-0.png`, `hero-down-1.png` and so on. Say which, and state
the frame size.

## 5. One palette across the whole set

All six tiles and the character share one limited palette. Aim for roughly 32 to
48 distinct colours across the entire set.

This constraint is not decoration. Tiles generated independently drift in hue and
in value: the grass comes back slightly bluer than the dirt was lit for, the
stone comes back at a different brightness, and laid next to each other they stop
reading as one world even though each is competent on its own. A shared palette
is the cheapest fix, and it is the one thing hardest to add afterwards.

Practically: fix the palette first, on one tile, then generate or paint every
other tile against that fixed set of colours rather than starting each one fresh.

The register is the game's: dry, grounded, low fantasy. Muted earths, greens that
have some grey in them, stone that is genuinely grey rather than blue. Nothing
saturated. Water is dark and still, not tropical.

## 6. What pass means

Put the six tiles in a directory and run:

```sh
node scripts/tileset-gate.mjs path/to/tiles
```

The gate passes when all of the following hold:

1. Every file decodes. 8-bit RGB or RGBA, not interlaced.
2. Every tile is square and all six are the same size.
3. Every tile's edge wrap error is at or under **12.0** on a 0 to 255 scale. That
   is the mean absolute per-channel difference between the right edge column and
   the left edge column, and between the bottom row and the top row.
4. No tile's wrap error is more than **2.5 times** its own interior texture
   variation. A flat stone floor is held to a tighter standard than noisy grass,
   because on a flat surface a small step is still a visible line.

The gate also reports the distinct colour count across the set, and flags any
tile whose mean hue or mean luminance sits far off the rest. Those flags are
advisory and do not fail the run on their own, because six materials that include
water and roof are supposed to differ in hue. They are there so a person looks at
the named tile.

The gate has a `--prove` mode which builds a deliberately non-tiling image and
confirms it gets rejected. A guard proves nothing until it has been shown to fail
on the defect it exists to catch. Run `node scripts/tileset-gate.mjs --prove` if
you want to trust the number before you trust the art.

The character sprite is not gated by script. It passes when the frames are
animated at about eight frames a second and the character stays one person.

## 7. If the gate keeps failing

The point of this test is that it can come back negative, and that a negative
result is useful. Two or three honest attempts is enough evidence. If the tiles
will not wrap, or the character will not hold together, do not keep generating.
Take one of these:

- **Buy a licensed tileset.** A finished 32x32 top-down set costs less than a day
  of anyone's time and arrives already tiling and already in one palette. Check
  the licence terms before buying. If we ever publish this, the terms need to
  allow it.
- **Hand-pixel a smaller set.** Six tiles at 32x32 in a fixed palette is a real
  but bounded job. Fewer materials, drawn by hand, beats twenty generated ones
  that do not sit together. Making a tile wrap by hand is easy: paint it offset
  by half, then shift it back.
- **Keep the current map and drop zone movement.** Ruling 2 is a ruling, not a
  commitment to ship at any cost. Zones exist to make local standing, ruling 6,
  something you feel rather than read on the ledger. If the art is not reachable
  this month, that is worth knowing before the code is written, and the node
  graph keeps working in the meantime.

Whichever way it goes, record the outcome in `docs/DIRECTION.md`. A test that
answers a question and does not get written down gets re-run by the next person.
