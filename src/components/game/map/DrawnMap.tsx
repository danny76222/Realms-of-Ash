/**
 * The drawing itself: sea, coast, ground cover, relief, water, borders, roads.
 *
 * Everything is one SVG in the 160 x 100 map space. The settlement marks and
 * their names are HTML laid over the top, in `WorldMap.tsx`, so that clicking
 * a settlement stays an ordinary button.
 */
import { BRIDGES, COAST, ISLETS, LAKES, PEAKS, REGIONS, RIVERS, TERRITORY } from "./geography";
import { MAP_H, MAP_W, px, py } from "./projection";
import { COVER_INK, COVER_WASH } from "./palette";
import { buildRoads } from "./layout";
import { FACTIONS, LOCATIONS } from "@/game/world";
import type { FactionId } from "@/game/types";

const ROADS = buildRoads();

/* ------------------------------------------------------------------ */
/* Texture tiles                                                       */
/* ------------------------------------------------------------------ */

function Textures() {
  return (
    <>
      <pattern id="tex-forest" patternUnits="userSpaceOnUse" width="7" height="7">
        <g
          fill="none"
          stroke={COVER_INK.forest}
          strokeWidth="0.38"
          strokeLinecap="round"
          opacity="0.85"
        >
          <path d="M0.8 4.6 L2.1 1.5 L3.4 4.6 M2.1 4.6 v1" />
          <path d="M4.2 6.4 L5.2 4 L6.2 6.4 M5.2 6.4 v0.7" />
          <path d="M4.6 2.9 L5.4 1 L6.2 2.9" />
        </g>
      </pattern>

      <pattern id="tex-moor" patternUnits="userSpaceOnUse" width="5" height="5">
        <g
          fill="none"
          stroke={COVER_INK.moor}
          strokeWidth="0.26"
          strokeLinecap="round"
          opacity="0.8"
        >
          <path d="M1 3.9 l0.45 -1.1 M1.45 3.9 l-0.4 -1" />
          <path d="M3.5 1.9 l0.4 -0.95 M3.9 1.9 l-0.35 -0.9" />
          <path d="M2.4 4.9 h0.9" />
        </g>
      </pattern>

      <pattern
        id="tex-downs"
        patternUnits="userSpaceOnUse"
        width="6"
        height="4"
        patternTransform="rotate(-14)"
      >
        <g
          fill="none"
          stroke={COVER_INK.downs}
          strokeWidth="0.3"
          strokeLinecap="round"
          opacity="0.75"
        >
          <path d="M0.4 1 h2.2 M3.6 2.5 h2 M0.9 3.4 h1.7" />
        </g>
      </pattern>

      <pattern id="tex-marsh" patternUnits="userSpaceOnUse" width="6" height="4">
        <g
          fill="none"
          stroke={COVER_INK.marsh}
          strokeWidth="0.26"
          strokeLinecap="round"
          opacity="0.8"
        >
          <path d="M0.4 1.2 h2.1 M3.4 2.4 h1.9 M1 3.4 h1.6" />
          <path d="M1.4 1.2 v-0.7 M4.3 2.4 v-0.7" />
        </g>
      </pattern>

      <pattern
        id="tex-field"
        patternUnits="userSpaceOnUse"
        width="6"
        height="6"
        patternTransform="rotate(18)"
      >
        <g fill="none" stroke={COVER_INK.field} strokeWidth="0.22" opacity="0.7">
          <path d="M0 0 h6 M0 3 h6 M0 0 v6 M3 0 v6" />
        </g>
      </pattern>

      <pattern id="tex-hill" patternUnits="userSpaceOnUse" width="7" height="5">
        <g
          fill="none"
          stroke={COVER_INK.hill}
          strokeWidth="0.3"
          strokeLinecap="round"
          opacity="0.8"
        >
          <path d="M0.4 3.6 q1.5 -2.3 3 0" />
          <path d="M3.6 4.9 q1.4 -2 2.8 0" />
        </g>
      </pattern>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Relief                                                              */
/* ------------------------------------------------------------------ */

function Peaks() {
  return (
    <g>
      {PEAKS.map((p, i) => (
        <g key={`peak-${i}`}>
          <path
            d={`M ${p.x - p.h * 0.95} ${p.y} L ${p.x} ${p.y - p.h} L ${p.x + p.h * 0.95} ${p.y} Z`}
            fill="var(--map-land-high)"
            stroke="var(--map-ink)"
            strokeWidth="0.22"
            strokeLinejoin="round"
            opacity="0.9"
          />
          <path
            d={`M ${p.x} ${p.y - p.h} L ${p.x + p.h * 0.95} ${p.y} L ${p.x + p.h * 0.22} ${p.y} Z`}
            fill="var(--map-ink)"
            opacity="0.3"
          />
        </g>
      ))}
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* The map                                                             */
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
        <Textures />

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

        <radialGradient id="vignette" cx="0.5" cy="0.5" r="0.72">
          <stop offset="55%" stopColor="var(--map-ink)" stopOpacity="0" />
          <stop offset="100%" stopColor="var(--map-ink)" stopOpacity="0.55" />
        </radialGradient>
      </defs>

      {/* --- the sea, and the fathom lines that echo the coast --- */}
      <rect x="-10" y="-10" width={MAP_W + 20} height={MAP_H + 20} fill="url(#sea-grad)" />
      <g mask="url(#sea-mask)" fill="none" stroke="var(--map-shallow)" strokeLinejoin="round">
        <path d={COAST} strokeWidth="2.2" opacity="0.5" />
        <path d={COAST} strokeWidth="5" opacity="0.28" />
        <path d={COAST} strokeWidth="9" opacity="0.16" />
        <path d={COAST} strokeWidth="15" opacity="0.09" />
      </g>

      {/* --- land --- */}
      <path d={COAST} fill="url(#land-grad)" />

      <g clipPath="url(#land-clip)">
        {/* ground cover: a wash of colour, then the texture drawn over it */}
        {REGIONS.map((r) => (
          <path
            key={`wash-${r.id}`}
            d={r.d}
            fill={COVER_WASH[r.cover]}
            opacity="0.34"
            filter="url(#soft-blur)"
          />
        ))}
        {REGIONS.map((r) => (
          <path key={`tex-${r.id}`} d={r.d} fill={`url(#tex-${r.cover})`} opacity="1" />
        ))}
        {/* a faint edge, so ground cover reads as drawn rather than sprayed */}
        {REGIONS.map((r) => (
          <path
            key={`edge-${r.id}`}
            d={r.d}
            fill="none"
            stroke={COVER_INK[r.cover]}
            strokeWidth="0.22"
            strokeDasharray="0.9 1.4"
            opacity="0.35"
          />
        ))}

        <Peaks />

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

      {/* --- the coast, inked --- */}
      <path
        d={COAST}
        fill="none"
        stroke="var(--map-ink)"
        strokeWidth="0.55"
        strokeLinejoin="round"
        opacity="0.9"
      />
      {ISLETS.map((d, i) => (
        <path
          key={`islet-${i}`}
          d={d}
          fill="var(--map-land)"
          stroke="var(--map-ink)"
          strokeWidth="0.3"
        />
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
