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
import { MAP_VARS } from "./map/palette";
import { labelFontPx, placeLabels } from "./map/labelPlacement";
import { leftPct, topPct } from "./map/projection";
import type { FactionId } from "@/game/types";

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
                  {/* villages breathe woodsmoke, castles fly their house colours */}
                  {loc.kind === "village" ? <span aria-hidden className="chimney-smoke" /> : null}
                  {loc.kind === "castle" ? (
                    <span
                      aria-hidden
                      className="flag-wave absolute -top-1.5 left-1/2 block h-1 w-2 -translate-x-[1px]"
                      style={{ background: faction?.color ?? "var(--primary)" }}
                    />
                  ) : null}
                  {/* the mark is inked, so it reads against forest and moor alike */}
                  <Icon
                    name={ICON[loc.kind] ?? "place"}
                    className="block text-[17px] text-foreground [filter:drop-shadow(0_0_1px_var(--map-ink))_drop-shadow(0_1px_1px_var(--map-ink))]"
                  />
                </span>
                {isHere ? (
                  <span
                    className="party-token pixel-font pointer-events-none absolute left-1/2 block -translate-x-1/2 text-[8px] whitespace-nowrap text-primary"
                    style={{ top: "-13px" }}
                  >
                    ▲ you
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
                  className="pixel-font absolute block px-[3px] py-[1px] leading-[1.3] whitespace-nowrap"
                  style={{
                    left: at ? `${at.x}px` : 0,
                    top: at ? `${at.y}px` : 0,
                    fontSize: `${fontPx}px`,
                    visibility: at ? "visible" : "hidden",
                    opacity: isHere ? 1 : reachable.has(loc.id) ? 1 : 0.82,
                    color: isHere
                      ? "oklch(0.88 0.15 68)"
                      : (faction?.color ?? "oklch(0.86 0.03 85)"),
                    background: "oklch(0.14 0.02 60 / 0.72)",
                    boxShadow: "0 0 0 1px oklch(0.14 0.02 60 / 0.55)",
                    textShadow: "0 1px 0 oklch(0.1 0.02 60)",
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
