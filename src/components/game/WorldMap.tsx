import { useGame } from "@/game/store";
import { FACTIONS, LOCATIONS } from "@/game/world";
import { tintClass, timeOf, weatherOf } from "@/game/weather";
import { Panel, PixelButton } from "./ui";

const ICON: Record<string, string> = {
  village: "🏘",
  castle: "🏰",
  dungeon: "🕳",
  ruin: "🏚",
  shrine: "⛩",
  camp: "⛺",
  landmark: "🗿",
};

export function WorldMap() {
  const { game, goTo, setScreen } = useGame();
  if (!game) return null;
  const here = LOCATIONS[game.locationId]!;
  const reachable = new Set(here.links);

  const edges: [string, string][] = [];
  for (const loc of Object.values(LOCATIONS)) {
    for (const l of loc.links) {
      if (loc.id < l) edges.push([loc.id, l]);
    }
  }

  const time = timeOf(game);
  const sky = weatherOf(game);

  return (
    <div className="mx-auto w-full max-w-6xl px-3 pb-8">
      <Panel
        title="The Marches"
        right={
          <span className="flex items-center gap-2">
            <span className="pixel-font text-[8px] uppercase text-muted-foreground">Day {game.day} · {time.label} · {sky.glyph} {sky.name}</span>
            <PixelButton size="sm" variant="ghost" onClick={() => setScreen("location")}>Back</PixelButton>
          </span>
        }
      >
        <div
          className={`map-grid ${tintClass(time.phase)} relative w-full overflow-hidden border-2 border-border bg-background/70`}
          style={{ aspectRatio: "16 / 10" }}
        >
          {/* ambient depth: drifting hills, high cloud, torch-warm sky */}
          <span aria-hidden className="map-sky" />
          <span aria-hidden className="map-hills" />
          <span aria-hidden className="map-clouds" />
          {sky.fx !== "none" ? <span aria-hidden className={`wx wx-${sky.fx} pointer-events-none absolute inset-0 z-[3]`} /> : null}
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
            {edges.map(([a, b]) => {
              const la = LOCATIONS[a]!;
              const lb = LOCATIONS[b]!;
              const active = a === game.locationId || b === game.locationId;
              return (
                <line
                  key={`${a}-${b}`}
                  x1={la.x}
                  y1={la.y}
                  x2={lb.x}
                  y2={lb.y}
                  stroke={active ? "oklch(0.72 0.14 68)" : "oklch(0.45 0.03 62 / 0.55)"}
                  strokeWidth={active ? 0.5 : 0.25}
                  strokeDasharray="1.5 1.5"
                  vectorEffect="non-scaling-stroke"
                />
              );
            })}
          </svg>
          {Object.values(LOCATIONS).map((loc) => {
            const isHere = loc.id === game.locationId;
            const canGo = reachable.has(loc.id);
            const faction = loc.faction ? FACTIONS[loc.faction] : null;
            return (
              <button
                key={loc.id}
                onClick={() => canGo && goTo(loc.id)}
                disabled={!canGo && !isHere}
                title={`${loc.name}${faction ? ` — ${faction.name}` : ""}`}
                className={`absolute -translate-x-1/2 -translate-y-1/2 px-1 leading-none transition-transform ${
                  isHere ? "z-10 scale-125" : canGo ? "hover:scale-125" : "opacity-55"
                }`}
                style={{ left: `${loc.x}%`, top: `${loc.y}%` }}
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
                  <span className="block text-lg drop-shadow">{ICON[loc.kind] ?? "•"}</span>
                </span>
                <span
                  className="pixel-font block text-[7px] whitespace-nowrap"
                  style={{ color: isHere ? "oklch(0.85 0.15 68)" : faction?.color ?? "oklch(0.7 0.02 80)" }}
                >
                  {loc.name}
                </span>
                {isHere ? <span className="party-token pixel-font block text-[8px] text-primary">▲ you</span> : null}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Click a connected settlement to travel. Every leg of road costs a day, and the roads are not what they were.
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
