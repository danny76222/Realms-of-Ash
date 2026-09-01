/**
 * The drawing itself: sea, coast, ground cover, relief, water, borders, roads.
 *
 * Everything is one SVG in the 160 x 100 map space. The settlement marks and
 * their names are HTML laid over the top, in `WorldMap.tsx`, so that clicking
 * a settlement stays an ordinary button.
 */
import { BRIDGES, COAST, ISLETS, LAKES, PEAKS, REGIONS, RIVERS, TERRITORY } from "./geography";
import { MAP_H, MAP_W, px, py } from "./projection";
import { buildRoads } from "./layout";
import { FACTIONS, LOCATIONS } from "@/game/world";
import type { FactionId } from "@/game/types";

const ROADS = buildRoads();

/* ------------------------------------------------------------------ */
/* Texture tiles                                                       */
/* ------------------------------------------------------------------ */

export function DrawnMap({
  ownerOf,
  currentId,
  reachable,
}: {
  /** Who holds each settlement right now, which the war can change. */
  ownerOf: (locationId: string) => FactionId | null;
  currentId: string;
  reachable: Set<string>;
}) {
  return (
    <svg
      className="absolute inset-0 h-full w-full"
      viewBox={`0 0 ${MAP_W} ${MAP_H}`}
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <clipPath id="land-clip">
          <path d={COAST} />
        </clipPath>

        <mask id="sea-mask">
          <rect x="-10" y="-10" width={MAP_W + 20} height={MAP_H + 20} fill="white" />
          <path d={COAST} fill="black" />
        </mask>

        <filter id="wash-blur" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3.8" />
        </filter>
        <filter id="soft-blur" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="1.3" />
        </filter>

        <linearGradient id="land-grad" x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0%" stopColor="var(--map-land-high)" />
          <stop offset="55%" stopColor="var(--map-land)" />
          <stop offset="100%" stopColor="var(--map-land)" />
        </linearGradient>

        <linearGradient id="sea-grad" x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0%" stopColor="var(--map-sea)" />
          <stop offset="100%" stopColor="var(--map-sea-deep)" />
        </linearGradient>

        {/* The vignette was tuned against a flat drawing. Over shaded relief
            it crushes the very thing the relief is for, so it is now a hint of
            falloff at the corners rather than a frame. */}
        <radialGradient id="vignette" cx="0.5" cy="0.5" r="0.8">
          <stop offset="70%" stopColor="var(--map-ink)" stopOpacity="0" />
          <stop offset="100%" stopColor="var(--map-ink)" stopOpacity="0.26" />
        </radialGradient>
      </defs>

      {/* The ground itself is the shaded heightfield underneath (TerrainCanvas).
          Sea, land, ground cover and peaks all come from elevation now, so the
          flat washes, texture patterns and drawn peak symbols that used to live
          here are gone. What remains is only what is drawn ON the land. */}

      <g clipPath="url(#land-clip)">
        {/* rivers, drawn twice: a soft bank, then the water */}
        {RIVERS.map((r) => (
          <path
            key={`bank-${r.id}`}
            d={r.d}
            fill="none"
            stroke="var(--map-ink)"
            strokeWidth={r.width + 0.7}
            strokeLinecap="round"
            opacity="0.35"
          />
        ))}
        {RIVERS.map((r) => (
          <path
            key={`river-${r.id}`}
            d={r.d}
            fill="none"
            stroke="var(--map-river)"
            strokeWidth={r.width}
            strokeLinecap="round"
            opacity="0.95"
          />
        ))}
        {LAKES.map((d, i) => (
          <path
            key={`lake-${i}`}
            d={d}
            fill="var(--map-river)"
            stroke="var(--map-ink)"
            strokeWidth="0.3"
            opacity="0.85"
          />
        ))}
        {BRIDGES.map((b, i) => (
          <g key={`bridge-${i}`} transform={`translate(${b.x} ${b.y}) rotate(${b.a})`}>
            <path
              d="M -1.4 -0.9 h2.8 M -1.4 0.9 h2.8"
              fill="none"
              stroke="var(--map-land-high)"
              strokeWidth="0.32"
              strokeLinecap="round"
            />
          </g>
        ))}

        {/* who holds what, right now. Villages change hands and this moves. */}
        {(Object.keys(FACTIONS) as FactionId[]).map((fid) => {
          const held = Object.values(LOCATIONS).filter((l) => ownerOf(l.id) === fid);
          if (held.length === 0) return null;
          return (
            <g
              key={`hold-${fid}`}
              fill={FACTIONS[fid].color}
              opacity="0.13"
              filter="url(#wash-blur)"
            >
              {held.map((l) => (
                <circle
                  key={l.id}
                  cx={px(l.x)}
                  cy={py(l.y)}
                  r={l.kind === "castle" ? 11 : l.kind === "village" ? 7.5 : 4}
                />
              ))}
            </g>
          );
        })}

        {/* the claimed borders, as the heralds draw them */}
        {(Object.keys(TERRITORY) as FactionId[]).map((fid) => (
          <path
            key={`border-${fid}`}
            d={TERRITORY[fid]}
            fill="none"
            stroke={FACTIONS[fid]?.color ?? "var(--map-road)"}
            strokeWidth="0.3"
            strokeDasharray="1.8 2"
            opacity="0.32"
          />
        ))}
      </g>

      {/* The coast used to be inked, which a drawn map wants and shaded relief
          does not: a hard black line round the land reads as a sticker on the
          sea. The shore now comes from the heightfield's own strand, and this
          is only a faint darkening to keep the edge crisp at small sizes. */}
      <path
        d={COAST}
        fill="none"
        stroke="var(--map-ink)"
        strokeWidth="0.28"
        strokeLinejoin="round"
        opacity="0.3"
      />
      {ISLETS.map((d, i) => (
        <path key={`islet-${i}`} d={d} fill="none" stroke="var(--map-ink)" strokeWidth="0.3" />
      ))}

      {/* --- roads: the links graph, bent --- */}
      <g fill="none" strokeLinecap="round">
        {ROADS.map((r) => (
          <path
            key={`road-shadow-${r.key}`}
            d={r.d}
            stroke="var(--map-ink)"
            strokeWidth="0.85"
            opacity="0.4"
          />
        ))}
        {ROADS.map((r) => {
          const live = r.a === currentId || r.b === currentId;
          const open = live && (reachable.has(r.a) || reachable.has(r.b));
          return (
            <path
              key={`road-${r.key}`}
              d={r.d}
              stroke={open ? "var(--primary)" : "var(--map-road)"}
              strokeWidth={open ? 0.5 : 0.3}
              strokeDasharray={open ? "1.6 1.1" : "1.2 1.3"}
              opacity={open ? 1 : 0.62}
            />
          );
        })}
      </g>

      <rect x="0" y="0" width={MAP_W} height={MAP_H} fill="url(#vignette)" pointerEvents="none" />

      {/* compass rose, out in the south-western water where nothing else goes */}
      <g transform="translate(13 92)" opacity="0.75">
        <circle r="4.4" fill="none" stroke="var(--map-shallow)" strokeWidth="0.2" />
        <circle r="2.9" fill="none" stroke="var(--map-shallow)" strokeWidth="0.14" />
        <path
          d="M 0 -4 L 1 -0.7 L 4 0 L 1 0.7 L 0 4 L -1 0.7 L -4 0 L -1 -0.7 Z"
          fill="var(--map-shallow)"
          stroke="var(--map-ink)"
          strokeWidth="0.14"
        />
        <path d="M 0 -4 L 1 -0.7 L 0 0 Z" fill="var(--primary)" />
      </g>
    </svg>
  );
}
