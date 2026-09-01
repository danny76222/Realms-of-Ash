/**
 * The icon set, replacing the emoji the game used to draw with.
 *
 * Direction ruling 11: no emoji in player-facing text. Emoji were doing real
 * work here (house banners, map markers, battle actions), so they are replaced
 * rather than deleted.
 *
 * Everything is a 16x16 viewBox drawn in currentColor with square caps, so the
 * marks sit with the pixel type rather than fighting it, and they take the
 * theme's colour wherever they are placed. The game layer stores icon NAMES;
 * only this file knows what a name looks like.
 */
import { cn } from "@/lib/utils";

export type IconName =
  // interface
  | "day"
  | "gold"
  | "renown"
  | "honour"
  | "map"
  | "party"
  | "quests"
  | "save"
  | "settings"
  | "menu"
  | "realm"
  | "rest"
  | "travel"
  | "place"
  | "lore"
  | "branch"
  | "resume"
  | "abandon"
  | "cloud-save"
  | "voice-on"
  | "voice-off"
  | "ledger"
  // weather
  | "clear"
  | "overcast"
  | "rain"
  | "storm"
  | "snow"
  | "fog"
  // places
  | "village"
  | "castle"
  | "dungeon"
  | "ruin"
  | "shrine"
  | "camp"
  | "landmark"
  // stats and battle
  | "hp"
  | "atk"
  | "def"
  | "spd"
  | "attack"
  | "defend"
  | "skill"
  | "flee"
  | "item"
  // classes
  | "sword"
  | "bow"
  | "chalice"
  | "shield"
  | "dagger"
  // enemy families
  | "bandit"
  | "troop"
  | "monster"
  | "boss"
  // houses
  | "house-ravensfell"
  | "house-goldmere"
  | "house-ironpact"
  | "house-sunmarch"
  | "house-thornwold"
  | "house-freeholds"
  // hero devices
  | "device-1"
  | "device-2"
  | "device-3"
  | "device-4"
  | "device-5"
  | "device-6"
  | "device-7"
  | "device-8";

const P: Record<IconName, React.ReactNode> = {
  day: <path d="M11 2a6 6 0 1 0 3 11A7 7 0 0 1 11 2z" />,
  gold: (
    <>
      <circle cx="8" cy="8" r="5.5" />
      <path d="M8 5v6M6 6.5h4M6 9.5h4" />
    </>
  ),
  renown: (
    <>
      <path d="M2 10V6l9-3v10l-9-3z" />
      <path d="M11 5.5h3M11 10.5h3" />
    </>
  ),
  honour: (
    <>
      <path d="M8 2 3 4v4c0 3 2.5 5 5 6 2.5-1 5-3 5-6V4L8 2z" />
      <path d="M6 8l1.5 1.5L10.5 6.5" />
    </>
  ),
  map: (
    <>
      <path d="M2 4l4-2 4 2 4-2v10l-4 2-4-2-4 2V4z" />
      <path d="M6 2v10M10 4v10" />
    </>
  ),
  party: (
    <>
      <path d="M8 2 3 4v4c0 3 2.5 5 5 6 2.5-1 5-3 5-6V4L8 2z" />
    </>
  ),
  quests: (
    <>
      <path d="M4 2h8v12H4z" />
      <path d="M6 5h4M6 8h4M6 11h2" />
    </>
  ),
  save: (
    <>
      <path d="M2.5 2.5h9L13.5 5v8.5h-11z" />
      <path d="M5 2.5v4h5v-4M5 13.5v-4h6" />
    </>
  ),
  settings: (
    <>
      <circle cx="8" cy="8" r="2.5" />
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3 3l1.5 1.5M11.5 11.5 13 13M13 3l-1.5 1.5M4.5 11.5 3 13" />
    </>
  ),
  menu: (
    // Crossed swords. Plain crossed lines read as a close button, so the blades
    // carry crossguards and pommels.
    <>
      <path d="M12.5 2.5 6 9M3.5 2.5 10 9" />
      <path d="M5 10.5 3 12.5M11 10.5 13 12.5" />
      <path d="M4 9.5 6.5 12M12 9.5 9.5 12" />
      <path d="M2.5 13.5h2M11.5 13.5h2" />
    </>
  ),
  realm: (
    <>
      <path d="M2 12V5l3 3 3-5 3 5 3-3v7z" />
      <path d="M2 12h12" />
    </>
  ),
  rest: <path d="M8 14c3 0 4.5-2 4.5-4.5C12.5 6 8 2 8 2S3.5 6 3.5 9.5C3.5 12 5 14 8 14z" />,
  travel: (
    // A road running to a gate: the thing you do, not the place you leave.
    <>
      <path d="M2 14l4-9M14 14l-4-9" />
      <path d="M7.5 12h1M7 9h1M6.5 6h1" />
      <path d="M5 4h6" />
    </>
  ),
  place: (
    <>
      <path d="M8 14s4.5-4.5 4.5-8A4.5 4.5 0 0 0 3.5 6c0 3.5 4.5 8 4.5 8z" />
      <circle cx="8" cy="6" r="1.5" />
    </>
  ),
  lore: (
    <>
      <path d="M2 3h5c.6 0 1 .4 1 1v9c0-.6-.4-1-1-1H2V3zM14 3H9c-.6 0-1 .4-1 1v9c0-.6.4-1 1-1h5V3z" />
    </>
  ),
  branch: (
    <>
      <path d="M4 2v12" />
      <path d="M4 3h8l-2 2.5L12 8H4" />
    </>
  ),
  resume: <path d="M4 2.5v11l9-5.5z" />,
  abandon: (
    <>
      <path d="M4 2v12" />
      <path d="M4 3h8v5H4" />
    </>
  ),
  "cloud-save": <path d="M4.5 12a3 3 0 0 1 .3-6 4 4 0 0 1 7.6 1.2A2.6 2.6 0 0 1 12 12H4.5z" />,
  "voice-on": (
    <>
      <path d="M3 6h2.5L9 3v10L5.5 10H3z" />
      <path d="M11.5 6a3 3 0 0 1 0 4" />
    </>
  ),
  "voice-off": (
    <>
      <path d="M3 6h2.5L9 3v10L5.5 10H3z" />
      <path d="M11 6.5 14 9.5M14 6.5 11 9.5" />
    </>
  ),
  ledger: (
    <>
      <path d="M3 2h10v12H3z" />
      <path d="M3 5.5h10M6 2v12M8 8h3M8 11h3" />
    </>
  ),

  clear: (
    <>
      <circle cx="8" cy="8" r="3" />
      <path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3 3l1 1M12 12l1 1M13 3l-1 1M4 12l-1 1" />
    </>
  ),
  overcast: <path d="M4.5 12a3 3 0 0 1 .3-6 4 4 0 0 1 7.6 1.2A2.6 2.6 0 0 1 12 12H4.5z" />,
  rain: (
    <>
      <path d="M4.5 9.5a2.8 2.8 0 0 1 .3-5.5 3.8 3.8 0 0 1 7.2 1.1A2.4 2.4 0 0 1 12 9.5H4.5z" />
      <path d="M5.5 11.5 4.5 14M8 11.5 7 14M10.5 11.5 9.5 14" />
    </>
  ),
  storm: (
    <>
      <path d="M4.5 9.5a2.8 2.8 0 0 1 .3-5.5 3.8 3.8 0 0 1 7.2 1.1A2.4 2.4 0 0 1 12 9.5H4.5z" />
      <path d="M8.5 10.5 6.5 13.5h3L7.5 16" />
    </>
  ),
  snow: (
    <>
      <path d="M4.5 9.5a2.8 2.8 0 0 1 .3-5.5 3.8 3.8 0 0 1 7.2 1.1A2.4 2.4 0 0 1 12 9.5H4.5z" />
      <path d="M5.5 12.5h1M8 12.5h1M10.5 12.5h1" />
    </>
  ),
  fog: <path d="M2 5h12M3 8h10M2 11h12" />,

  village: (
    <>
      <path d="M2 8l3-3 3 3v6H2z" />
      <path d="M9 10l2.5-2.5L14 10v4H9z" />
    </>
  ),
  castle: (
    <>
      <path d="M2 14V5h2V3h2v2h4V3h2v2h2v9z" />
      <path d="M6.5 14v-4h3v4" />
    </>
  ),
  dungeon: (
    <>
      <path d="M3 14V8a5 5 0 0 1 10 0v6" />
      <path d="M6.5 14V9.5a1.5 1.5 0 0 1 3 0V14" />
    </>
  ),
  ruin: (
    <>
      <path d="M3 14V6l2-2v4M7 14V4l2 2v3M11 14V7l2 2v5" />
      <path d="M2 14h12" />
    </>
  ),
  shrine: (
    <>
      <path d="M2 5h12M3.5 7.5h9" />
      <path d="M5 7.5V14M11 7.5V14M2 5l2-2h8l2 2" />
    </>
  ),
  camp: (
    <>
      <path d="M8 2 2.5 14h11z" />
      <path d="M8 8v6" />
    </>
  ),
  landmark: (
    <>
      <path d="M5 14V6a3 3 0 0 1 6 0v8z" />
      <path d="M4 14h8" />
    </>
  ),

  hp: (
    <path d="M8 13.5S2.5 10 2.5 6.2A2.9 2.9 0 0 1 8 4.8a2.9 2.9 0 0 1 5.5 1.4c0 3.8-5.5 7.3-5.5 7.3z" />
  ),
  atk: (
    <>
      <path d="M13 3 6.5 9.5" />
      <path d="M3 13l2.5-2.5M2.5 10.5 5.5 13.5" />
      <path d="M10.5 3H13v2.5" />
    </>
  ),
  def: <path d="M8 2 3 4v4c0 3 2.5 5 5 6 2.5-1 5-3 5-6V4L8 2z" />,
  spd: <path d="M9 1 4 8.5h3.5L6 15l5.5-7.5H8z" />,
  attack: (
    <>
      <path d="M13 3 6.5 9.5" />
      <path d="M3 13l2.5-2.5M2.5 10.5 5.5 13.5" />
      <path d="M10.5 3H13v2.5" />
    </>
  ),
  defend: <path d="M8 2 3 4v4c0 3 2.5 5 5 6 2.5-1 5-3 5-6V4L8 2z" />,
  skill: <path d="M8 1.5 9.6 6h4.4l-3.6 2.6 1.4 4.4L8 10.4 4.2 13l1.4-4.4L2 6h4.4z" />,
  flee: (
    <>
      <path d="M2 8h9" />
      <path d="M8 4.5 11.5 8 8 11.5" />
      <path d="M13.5 3v10" />
    </>
  ),
  item: (
    <>
      <path d="M4 6h8l-.7 8H4.7z" />
      <path d="M6 6V4a2 2 0 0 1 4 0v2" />
    </>
  ),

  sword: (
    <>
      <path d="M13 3 6.5 9.5" />
      <path d="M3 13l2.5-2.5M2.5 10.5 5.5 13.5" />
      <path d="M10.5 3H13v2.5" />
    </>
  ),
  bow: (
    <>
      <path d="M5 2a9 9 0 0 1 0 12" />
      <path d="M5 2 3 8l2 6" />
      <path d="M3 8h10M10.5 5.5 13.5 8l-3 2.5" />
    </>
  ),
  chalice: (
    <>
      <path d="M4.5 2h7l-.8 4.5A2.8 2.8 0 0 1 8 9a2.8 2.8 0 0 1-2.7-2.5z" />
      <path d="M8 9v4M5.5 13.5h5" />
    </>
  ),
  shield: <path d="M8 2 3 4v4c0 3 2.5 5 5 6 2.5-1 5-3 5-6V4L8 2z" />,
  dagger: (
    <>
      <path d="M8 1.5 9.5 8 8 11 6.5 8z" />
      <path d="M5.5 8h5M8 11v3.5" />
    </>
  ),

  bandit: (
    <>
      <path d="M3 6.5h10" />
      <path d="M4.5 4.5C6 3 10 3 11.5 4.5" />
      <path d="M5 9c1 2 5 2 6 0" />
    </>
  ),
  troop: (
    <>
      <path d="M4 14V7l4-4 4 4v7" />
      <path d="M8 3V1M6 14v-4h4v4" />
    </>
  ),
  monster: (
    <>
      <path d="M3 13V7a5 5 0 0 1 10 0v6l-2-1.5L9.5 13 8 11.5 6.5 13 5 11.5z" />
      <path d="M6 7.5h1M9 7.5h1" />
    </>
  ),
  boss: (
    <>
      <path d="M2 12V5l3 3 3-5 3 5 3-3v7z" />
      <path d="M2 12h12M5.5 9.5h5" />
    </>
  ),

  "house-ravensfell": (
    <>
      <path d="M2.5 6.5 8 3l5.5 3.5-2 1 2 1L8 12 2.5 8.5l2-1z" />
      <path d="M8 3v9" />
    </>
  ),
  "house-goldmere": (
    <>
      <circle cx="8" cy="8" r="5.5" />
      <path d="M8 4.5v7M6 6h4M6 10h4" />
    </>
  ),
  "house-ironpact": (
    <>
      <path d="M3 4.5h6v3H3z" />
      <path d="M6 7.5 8 14M9 6h4" />
    </>
  ),
  "house-sunmarch": (
    <>
      <circle cx="8" cy="8" r="3" />
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3 3l1.5 1.5M11.5 11.5 13 13M13 3l-1.5 1.5M4.5 11.5 3 13" />
    </>
  ),
  "house-thornwold": (
    <>
      <path d="M8 14V6" />
      <path d="M8 6C8 3 10.5 1.5 13 2c.5 2.5-1 5-5 4zM8 9C8 6.5 5.5 5.5 3 6c-.5 2.5 1 4 5 3z" />
    </>
  ),
  "house-freeholds": (
    <>
      <path d="M2.5 12.5h11" />
      <path d="M4.5 12.5V7l3.5-3 3.5 3v5.5" />
      <path d="M6.5 12.5V9h3v3.5" />
    </>
  ),

  "device-1": (
    <>
      <path d="M8 2 3 4v4c0 3 2.5 5 5 6 2.5-1 5-3 5-6V4L8 2z" />
      <path d="M8 5v6" />
    </>
  ),
  "device-2": (
    <>
      <circle cx="8" cy="8" r="5.5" />
      <path d="M8 2.5v11" />
    </>
  ),
  "device-3": (
    <>
      <path d="M8 1.5 9.6 6h4.4l-3.6 2.6 1.4 4.4L8 10.4 4.2 13l1.4-4.4L2 6h4.4z" />
    </>
  ),
  "device-4": (
    <>
      <path d="M2.5 8 8 2.5 13.5 8 8 13.5z" />
      <path d="M5.5 8 8 5.5 10.5 8 8 10.5z" />
    </>
  ),
  "device-5": (
    <>
      <path d="M3 13V6l5-4 5 4v7z" />
      <path d="M6.5 13V9h3v4" />
    </>
  ),
  "device-6": (
    <>
      <path d="M8 2v12M2 8h12" />
      <circle cx="8" cy="8" r="3" />
    </>
  ),
  "device-7": (
    <>
      <path d="M3 3h10v10H3z" />
      <path d="M3 3l10 10M13 3 3 13" />
    </>
  ),
  "device-8": (
    <>
      <path d="M8 14V5" />
      <path d="M8 5C8 2.5 10 1.5 12.5 2 13 4.5 11 6 8 5.5zM8 8C8 6 6 5 3.5 5.5 3 7.5 5 9 8 8.5z" />
    </>
  ),
};

/** Enemy and class sprites are stored as icon names; this keeps the mapping honest. */
export function isIconName(value: string): value is IconName {
  return value in P;
}

export function Icon({
  name,
  className,
  title,
  style,
}: {
  name: IconName | string;
  className?: string;
  title?: string;
  /** For callers that size a mark in pixels rather than in ems. */
  style?: React.CSSProperties;
}) {
  const body = P[name as IconName];
  if (!body) return null;
  return (
    <svg
      viewBox="0 0 16 16"
      className={cn("inline-block h-[1em] w-[1em] shrink-0", className)}
      style={style}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="square"
      strokeLinejoin="miter"
      shapeRendering="geometricPrecision"
      role={title ? "img" : "presentation"}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {title ? <title>{title}</title> : null}
      {body}
    </svg>
  );
}
