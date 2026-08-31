/**
 * The Ledger: everything the realm, the houses and the villages think of you.
 *
 * Direction ruling 7: the player gets a visible screen carrying all reputation
 * and standing, rather than inferring it from behaviour alone. The ruling also
 * carries a warning, which this panel is built around: the world must still
 * show standing through what it DOES. The ledger is where you check a number
 * you already suspected, not the only place the game tells you.
 *
 * So every reading here says what it means in words as well as digits, and the
 * bottom half is the world's own record of what it did about you.
 */
import { FACTIONS, FACTION_IDS, LOCATIONS } from "@/game/world";
import { REPUTATION, fameTier, honourTier, standingTier, houseOfPlace } from "@/game/reputation";
import type { GameState } from "@/game/types";
import { Panel, PixelButton } from "./ui";
import { Icon } from "./icons";

/** A number with the sentence that explains what it currently means. */
function Reading({
  icon,
  label,
  value,
  tier,
  meaning,
}: {
  icon: string;
  label: string;
  value: number;
  tier: string;
  meaning: string;
}) {
  return (
    <div className="border border-border bg-background/40 px-3 py-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className="pixel-font flex items-center gap-2 text-[10px] uppercase text-muted-foreground">
          <Icon name={icon} />
          {label}
        </span>
        <span className="pixel-font text-sm text-primary tabular-nums">{value}</span>
      </div>
      <p className="pixel-font mt-1 text-[9px] uppercase tracking-wide text-foreground">{tier}</p>
      <p className="mt-1 text-xs leading-snug text-muted-foreground">{meaning}</p>
    </div>
  );
}

/** A standing bar that reads from a glance, negative left of centre. */
function StandingBar({ value }: { value: number }) {
  const pct = ((value - REPUTATION.min) / (REPUTATION.max - REPUTATION.min)) * 100;
  const good = value >= 0;
  return (
    <span className="relative block h-2 w-full border border-border bg-background">
      <span aria-hidden className="absolute left-1/2 top-0 h-full w-px bg-border" />
      <span
        className={
          good ? "absolute top-0 h-full bg-primary" : "absolute top-0 h-full bg-destructive"
        }
        style={
          good
            ? { left: "50%", width: `${Math.max(1, pct - 50)}%` }
            : { left: `${pct}%`, width: `${Math.max(1, 50 - pct)}%` }
        }
      />
    </span>
  );
}

export function LedgerPanel({ game, onClose }: { game: GameState; onClose: () => void }) {
  const here = game.locationId;
  const hereHouse = houseOfPlace(game, here);

  // Places that have formed an opinion, worst first. A page of zeroes would
  // tell the player nothing, so somewhere nobody has met you simply is absent.
  const places = Object.entries(game.standing)
    .filter(([, v]) => v !== 0)
    .sort((a, b) => a[1] - b[1]);

  const aimedAtYou = game.worldEvents.filter((e) => e.aboutYou).slice(0, 6);

  const hero = game.party[0];

  return (
    <Panel
      title="The Ledger"
      className="mb-3"
      right={
        <PixelButton size="sm" variant="ghost" onClick={onClose}>
          Close
        </PixelButton>
      }
    >
      <div className="grid gap-3 md:grid-cols-2">
        {/* ---- who you are ---- */}
        <div className="space-y-2">
          <p className="pixel-font text-[10px] uppercase tracking-wide text-primary">Your name</p>

          <Reading
            icon="renown"
            label="Fame"
            value={game.fame}
            tier={fameTier(game.fame)}
            meaning="How big your name is. It grows on any deed, whether or not it was a good one."
          />

          <Reading
            icon="honour"
            label="Honour"
            value={game.honour}
            tier={honourTier(game.honour)}
            meaning="What colour that name is. It moves on how you got there, and the realm keeps a longer memory of it than you would like."
          />

          <div className="border border-border bg-background/40 px-3 py-2">
            <p className="pixel-font text-[10px] uppercase text-muted-foreground">The company</p>
            <p className="mt-1 text-xs text-foreground">
              {hero ? `${hero.name}, level ${hero.level}` : "No one yet"}
              {game.party.length > 1 ? ` and ${game.party.length - 1} sworn` : ", riding alone"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground tabular-nums">
              Day {game.day} · {game.gold} gold
              {game.branch ? ` · walking the ${game.branch} road` : ""}
            </p>
          </div>
        </div>

        {/* ---- the six houses ---- */}
        <div className="space-y-2">
          <p className="pixel-font text-[10px] uppercase tracking-wide text-primary">The houses</p>
          <ul className="space-y-1">
            {[...FACTION_IDS]
              .sort((a, b) => game.factions[b].rep - game.factions[a].rep)
              .map((id) => {
                const f = FACTIONS[id];
                const rep = Math.round(game.factions[id].rep);
                return (
                  <li key={id} className="border border-border bg-background/40 px-2 py-1.5">
                    <div className="flex items-center gap-2">
                      <Icon name={f.banner} className="text-sm" />
                      <span className="pixel-font flex-1 text-[10px] uppercase">{f.name}</span>
                      <span className="pixel-font text-[10px] tabular-nums text-muted-foreground">
                        {rep > 0 ? "+" : ""}
                        {rep}
                      </span>
                    </div>
                    <div className="mt-1">
                      <StandingBar value={rep} />
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {standingTier(rep)}
                      {id === hereHouse ? ", and this is their ground" : ""}
                    </p>
                  </li>
                );
              })}
          </ul>
        </div>
      </div>

      {/* ---- where you are known ---- */}
      <div className="mt-3 border-t border-border pt-3">
        <p className="pixel-font text-[10px] uppercase tracking-wide text-primary">
          Where you are known
        </p>
        {places.length === 0 ? (
          <p className="mt-1 text-xs text-muted-foreground">
            No village has formed a view of you yet. Do something for one, or to one.
          </p>
        ) : (
          <ul className="mt-2 grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
            {places.map(([id, value]) => (
              <li
                key={id}
                className="flex items-center gap-2 border border-border bg-background/40 px-2 py-1"
              >
                <Icon name={id === here ? "place" : "village"} className="text-xs" />
                <span className="flex-1 truncate text-xs">{LOCATIONS[id]?.name ?? id}</span>
                <span className="pixel-font text-[9px] uppercase text-muted-foreground">
                  {standingTier(value)}
                </span>
                <span className="pixel-font text-[10px] tabular-nums text-primary">
                  {value > 0 ? "+" : ""}
                  {Math.round(value)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ---- what the world did about it ---- */}
      <div className="mt-3 border-t border-border pt-3">
        <p className="pixel-font text-[10px] uppercase tracking-wide text-primary">
          What the realm did about you
        </p>
        {aimedAtYou.length === 0 ? (
          <p className="mt-1 text-xs text-muted-foreground">
            Nobody has moved against you or toward you yet. That is its own kind of news.
          </p>
        ) : (
          <ul className="mt-2 space-y-1">
            {aimedAtYou.map((e, i) => (
              <li
                key={`${e.day}-${i}`}
                className="border-l-2 border-primary bg-background/40 px-2 py-1 text-xs"
              >
                <span className="pixel-font mr-2 text-[9px] uppercase text-muted-foreground">
                  Day {e.day} · {e.kind}
                </span>
                {e.text}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Panel>
  );
}
