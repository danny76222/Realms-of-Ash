import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { useGame } from "@/game/store";
import { Icon } from "./icons";
import { FACTIONS, LOCATIONS } from "@/game/world";
import { tintClass, timeOf, weatherOf } from "@/game/weather";
import { Panel, PixelButton } from "./ui";
import { DrawnMap } from "./map/DrawnMap";
import { TerrainCanvas } from "./map/TerrainCanvas";
import { MAP_VARS } from "./map/palette";
import { labelFontPx, placeLabels } from "./map/labelPlacement";
import { leftPct, topPct } from "./map/projection";
import type { FactionId } from "@/game/types";

/**
 * A banner behind a settlement name, in the colour of whoever holds it.
 *
 * It is strongest where it meets the shield and fades to nothing at the far
 * end, which is what stops a row of names reading as a row of stickers laid on
 * the ground. `toRight` says which way the tail runs, so the solid end is
 * always the end nearest the mark whichever side the name was placed on.
 */
function bannerFor(colour: string, toRight: boolean): string {
  const dir = toRight ? "90deg" : "270deg";
  // Only a little black, and only at the head, where the text sits. Mixing the
  // house colour heavily toward black was turning six distinct banners into six
  // slightly different dark plates.
  const head = `color-mix(in oklab, ${colour} 86%, black)`;
  const mid = `color-mix(in oklab, ${colour} 72%, transparent)`;
  return `linear-gradient(${dir}, ${head} 0%, ${head} 26%, ${mid} 62%, transparent 100%)`;
}

/**
 * The settlement mark: a heater shield charged with the place's own device.
 *
 * The old mark was an inked glyph, which worked over flat washes and is much
 * weaker over shaded relief, where there is no longer a quiet background to
 * ink against. A shield reads at any size, carries the holder's colour, and is
 * how every campaign map of this kind marks a holding.
 */
function ShieldMark({ kind, colour, big }: { kind: string; colour: string; big?: boolean }) {
  const w = big ? 19 : 16;
  return (
    <span
      aria-hidden
      className="relative block"
      style={{ width: w, height: w * 1.16, margin: "0 auto" }}
    >
      <svg
        viewBox="0 0 20 23"
        width={w}
        height={w * 1.16}
        style={{ display: "block", filter: "drop-shadow(0 1px 1.5px oklch(0.1 0.02 60 / 0.85))" }}
      >
        <path
          d="M1.4 1.4 H18.6 V11.4 C18.6 16.6 14.6 20.2 10 21.8 C5.4 20.2 1.4 16.6 1.4 11.4 Z"
          fill={colour}
          stroke="oklch(0.14 0.02 60)"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="M2.9 2.9 H17.1 V11.4 C17.1 15.7 13.7 18.9 10 20.3 C6.3 18.9 2.9 15.7 2.9 11.4 Z"
          fill="none"
          stroke="oklch(0.97 0.02 85 / 0.4)"
          strokeWidth="0.8"
        />
      </svg>
      <span
        className="absolute inset-0 flex items-start justify-center"
        style={{ paddingTop: w * 0.2 }}
      >
        {/* The charge, drawn light so it reads on any house colour. */}
        <Icon
          name={ICON[kind] ?? "place"}
          className="block"
          style={{ width: w * 0.62, height: w * 0.62, color: "oklch(0.97 0.02 85)" }}
        />
      </span>
    </span>
  );
}

const ICON: Record<string, string> = {
  village: "village",
  castle: "castle",
  dungeon: "dungeon",
  ruin: "ruin",
  shrine: "shrine",
  camp: "camp",
  landmark: "landmark",
};

/**
 * Weather is drawn over the map, not instead of it. The shared overlay classes
 * in `styles.css` are tuned for the location art, where a heavy curtain of rain
 * reads well over a single painting. Over a drawing made of thin lines it turns
 * the whole map to corduroy, so the map asks for a lighter hand.
 */
const WX_OPACITY: Record<string, number> = {
  rain: 0.24,
  storm: 0.2,
  snow: 0.42,
  fog: 0.4,
};

export function WorldMap() {
  const { game, goTo, setScreen } = useGame();
  const factions = game?.factions;
  const locationId = game?.locationId ?? "";

  const frameRef = useRef<HTMLDivElement | null>(null);
  const labelRefs = useRef<Record<string, HTMLSpanElement | null>>({});
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [dims, setDims] = useState<Record<string, { w: number; h: number }>>({});

  const setLabelRef = useCallback((id: string, el: HTMLSpanElement | null) => {
    labelRefs.current[id] = el;
  }, []);

  /* The map is fluid, so the layout has to be solved at the size it is drawn. */
  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const read = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const fontPx = labelFontPx(size.w);

  /* Measure the names as rendered rather than guessing from character counts. */
  useLayoutEffect(() => {
    const next: Record<string, { w: number; h: number }> = {};
    for (const [id, el] of Object.entries(labelRefs.current)) {
      if (!el) continue;
      next[id] = { w: Math.ceil(el.offsetWidth), h: Math.ceil(el.offsetHeight) };
    }
    setDims((prev) => {
      const same =
        Object.keys(prev).length === Object.keys(next).length &&
        Object.entries(next).every(([k, v]) => prev[k]?.w === v.w && prev[k]?.h === v.h);
      return same ? prev : next;
    });
  }, [fontPx, size.w, size.h]);

  const placements = useMemo(
    () => placeLabels(size.w, size.h, dims, locationId),
    [size.w, size.h, dims, locationId],
  );

  /**
   * Who holds each settlement now, rather than who held it at the start.
   * `state.ts` moves villages between `factions[*].territory` when a war is
   * won, so the map should show the war, not the almanac.
   */
  const owners = useMemo(() => {
    const map = new Map<string, FactionId | null>();
    for (const loc of Object.values(LOCATIONS)) map.set(loc.id, loc.faction);
    if (factions) {
      for (const [fid, f] of Object.entries(factions)) {
        for (const id of f.territory) map.set(id, fid as FactionId);
      }
    }
    return map;
  }, [factions]);

  if (!game) return null;
  const here = LOCATIONS[game.locationId]!;
  const reachable = new Set(here.links);

  const time = timeOf(game);
  const sky = weatherOf(game);

  return (
    <div className="mx-auto w-full max-w-6xl px-3 pb-8">
      <Panel
        title="The Marches"
        right={
          <span className="flex items-center gap-2">
            <span className="pixel-font text-[8px] text-muted-foreground uppercase">
              Day {game.day} · {time.label} · {sky.name}
            </span>
            <PixelButton size="sm" variant="ghost" onClick={() => setScreen("location")}>
              Back
            </PixelButton>
          </span>
        }
      >
        <div
          ref={frameRef}
          className={`${tintClass(time.phase)} relative w-full overflow-hidden border-2 border-border`}
          style={{ ...MAP_VARS, aspectRatio: "16 / 10" } as CSSProperties}
        >
          {/* The shaded ground. Everything that reads as three-dimensional is
              painted here; the SVG above carries only what is drawn ON the
              land: water, roads, borders, marks and names. */}
          <TerrainCanvas className="absolute inset-0" />

          <DrawnMap
            ownerOf={(id) => owners.get(id) ?? null}
            currentId={game.locationId}
            reachable={reachable}
          />

          {/* weather sits over the drawing, high cloud drifts across it */}
          <span aria-hidden className="map-clouds" />
          {sky.fx !== "none" ? (
            <span
              aria-hidden
              className={`wx wx-${sky.fx} pointer-events-none absolute inset-0 z-[3]`}
              style={{ opacity: WX_OPACITY[sky.fx] ?? 0.3 }}
            />
          ) : null}

          {/* the settlement marks: ordinary buttons, so travel stays a click */}
          {Object.values(LOCATIONS).map((loc) => {
            const isHere = loc.id === game.locationId;
            const canGo = reachable.has(loc.id);
            const ownerId = owners.get(loc.id) ?? null;
            const faction = ownerId ? FACTIONS[ownerId] : null;
            return (
              <button
                key={loc.id}
                onClick={() => canGo && goTo(loc.id)}
                disabled={!canGo && !isHere}
                title={`${loc.name}${faction ? `, ${faction.name}` : ""}`}
                className={`absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 leading-none transition-transform ${
                  isHere ? "z-[6] scale-125" : canGo ? "z-[5] hover:scale-125" : "z-[4] opacity-70"
                }`}
                style={{ left: `${leftPct(loc.x)}%`, top: `${topPct(loc.y)}%` }}
              >
                <span className="relative block">
                  {/* villages breathe woodsmoke */}
                  {loc.kind === "village" ? <span aria-hidden className="chimney-smoke" /> : null}
                  {/* A heater shield in the holder's colour, with the place's own
                      mark on it. This is how ownership reads at a glance without
                      a legend, and it survives being drawn over shaded terrain
                      in a way an inked glyph does not. */}
                  <ShieldMark
                    kind={loc.kind}
                    colour={faction?.color ?? "oklch(0.55 0.02 80)"}
                    big={loc.kind === "castle"}
                  />
                </span>
                {isHere ? (
                  <span
                    aria-hidden
                    className="party-token pointer-events-none absolute left-1/2 block -translate-x-1/2"
                    style={{ top: "-15px" }}
                  >
                    {/* The party as a medallion rather than a caret and a word.
                        A campaign map marks where you are with a portrait ring,
                        and it stays legible when the map is busy. */}
                    <span
                      className="block rounded-full"
                      style={{
                        width: 14,
                        height: 14,
                        background:
                          "radial-gradient(circle at 40% 34%, oklch(0.62 0.11 74), oklch(0.36 0.06 66))",
                        boxShadow:
                          "0 0 0 1.5px oklch(0.88 0.14 78), 0 0 0 2.5px oklch(0.14 0.02 60), 0 2px 3px oklch(0.1 0.02 60 / 0.8)",
                      }}
                    />
                  </span>
                ) : null}
              </button>
            );
          })}

          {/* the names, laid out against the frame so none of them collide */}
          <div aria-hidden className="pointer-events-none absolute inset-0 z-[7]">
            {Object.values(LOCATIONS).map((loc) => {
              const at = placements[loc.id];
              const isHere = loc.id === game.locationId;
              const ownerId = owners.get(loc.id) ?? null;
              const faction = ownerId ? FACTIONS[ownerId] : null;
              return (
                <span
                  key={loc.id}
                  ref={(el) => setLabelRef(loc.id, el)}
                  className="pixel-font absolute block px-[4px] py-[1.5px] leading-[1.3] whitespace-nowrap"
                  style={{
                    left: at ? `${at.x}px` : 0,
                    top: at ? `${at.y}px` : 0,
                    fontSize: `${fontPx}px`,
                    visibility: at ? "visible" : "hidden",
                    opacity: isHere ? 1 : reachable.has(loc.id) ? 1 : 0.86,
                    color: isHere ? "oklch(0.95 0.11 84)" : "oklch(0.96 0.012 85)",
                    // A banner in the holder's colour, strongest where it meets
                    // the shield and fading to nothing at its tail, so a name
                    // never becomes a solid block sitting on the terrain.
                    background: bannerFor(
                      faction?.color ?? "oklch(0.42 0.015 80)",
                      at && size.w ? at.x >= (leftPct(loc.x) / 100) * size.w : true,
                    ),
                    textShadow: "0 1px 1px oklch(0.12 0.02 60 / 0.95)",
                  }}
                >
                  {loc.name}
                </span>
              );
            })}
          </div>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Click a connected settlement to travel. Every leg of road costs a day, and the roads are
          not what they were.
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {here.links.map((l) => (
            <PixelButton key={l} size="sm" variant="ghost" onClick={() => goTo(l)}>
              → {LOCATIONS[l]?.name}
            </PixelButton>
          ))}
        </div>
      </Panel>
    </div>
  );
}
