import { useEffect, useMemo, useState } from "react";
import { useGame } from "@/game/store";
import { FACTIONS, FACTION_IDS, LOCATIONS, LOCATION_IDS, NPCS } from "@/game/world";
import { relationOf } from "@/game/state";
import { generateSideQuests } from "@/game/progress";
import { GLYPH } from "@/game/art";
import { unitStats } from "@/game/engine";
import { currentBeat } from "@/game/story";
import { worldTone } from "@/game/tone";
import { timeOf, weatherOf } from "@/game/weather";
import { Panel, PixelButton, Stat } from "./ui";
import { SavesPanel } from "./SavesPanel";
import { SettingsPanel } from "./SettingsPanel";

/** Shield-shaped stat plate: the numbers a player checks at a glance. */
function Plate({ icon, value, title }: { icon: string; value: string | number; title: string }) {
  return (
    <span className="hud-plate" title={title}>
      <span aria-hidden className="text-xs">{icon}</span>
      <span className="pixel-font text-[9px] text-foreground">{value}</span>
    </span>
  );
}



type Menu = null | "saves" | "world" | "journal" | "settings" | "pause";

function MenuRow({ icon, label, hint, variant = "ghost", onClick }: { icon: string; label: string; hint: string; variant?: "default" | "ghost" | "danger"; onClick: () => void }) {
  return (
    <PixelButton variant={variant} onClick={onClick} className="w-full !normal-case">
      <span className="flex w-full items-center gap-3 text-left">
        <span aria-hidden className="text-base">{icon}</span>
        <span className="min-w-0 flex-1">
          <span className="pixel-font block text-[10px] uppercase tracking-wide">{label}</span>
          <span className="block text-xs normal-case opacity-80">{hint}</span>
        </span>
      </span>
    </PixelButton>
  );
}

export function TopBar() {
  const { game, screen, setScreen, quit, load } = useGame();
  const [menu, setMenu] = useState<Menu>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setMenu((m) => (m === null ? "pause" : null));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const journal = useMemo(() => {
    if (!game) return [];
    const want = new Set(game.activeSide);
    const out: { id: string; name: string; desc: string; target: string }[] = [];
    for (const lid of LOCATION_IDS) {
      for (const q of generateSideQuests(game, lid)) {
        if (want.has(q.id) && !out.some((o) => o.id === q.id)) out.push(q);
      }
    }
    return out;
  }, [game]);

  if (!game) return null;
  const loc = LOCATIONS[game.locationId];
  const tone = worldTone(game);
  const beatHere = currentBeat(game);
  const objective = beatHere?.title ?? journal[0]?.name ?? "No pressing business";
  const objectiveWhere = beatHere ? loc?.name : journal[0] ? LOCATIONS[journal[0].target]?.name : null;

  return (
    <>
      <header className="hud-bar sticky top-0 z-20 mb-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2">
          {/* who and where */}
          <span className="min-w-0">
            <span className="heading-font block truncate text-xs text-primary">{game.heroName}</span>
            <span className="pixel-font block text-[8px] uppercase text-muted-foreground">
              {GLYPH.place} {loc?.name ?? "—"} · {timeOf(game).label}
            </span>
          </span>

          {/* shield plates: the numbers you check at a glance */}
          <span className="flex flex-wrap items-center gap-1">
            <Plate icon={GLYPH.day} value={`Day ${game.day}`} title="World clock" />
            <Plate
              icon={weatherOf(game).glyph}
              value={`${String(timeOf(game).hour).padStart(2, "0")}:00`}
              title={`${weatherOf(game).name} — ${weatherOf(game).line}`}
            />
            <Plate icon={GLYPH.gold} value={game.gold} title="Gold in purse" />
            <Plate icon={GLYPH.renown} value={game.renown} title="Renown across the realm" />
            {game.branch ? <Plate icon="🏳" value={game.branch} title="Story branch you are walking" /> : null}
          </span>

          {/* party health, readable mid-fight */}
          <span className="flex items-center gap-2">
            {game.party.map((u) => {
              const s = unitStats(u);
              const pct = Math.max(0, Math.round((u.hp / s.maxHp) * 100));
              return (
                <span key={u.id} className="w-16" title={`${u.name} — ${u.hp}/${s.maxHp} hp`}>
                  <span className="pixel-font block truncate text-[8px] uppercase text-muted-foreground">{u.name.split(" ")[0]}</span>
                  <span className="mt-0.5 block h-2 w-full border border-border bg-background">
                    <span
                      className="block h-full"
                      style={{
                        width: `${pct}%`,
                        background: pct > 50 ? "var(--accent)" : pct > 20 ? "var(--primary)" : "var(--destructive)",
                      }}
                    />
                  </span>
                </span>
              );
            })}
          </span>

          <span className="ml-auto flex flex-wrap gap-1">
            {screen !== "map" && screen !== "battle" ? (
              <PixelButton size="sm" variant="ghost" title="Open the world map" onClick={() => setScreen("map")}>
                {GLYPH.map} Map
              </PixelButton>
            ) : null}
            {screen === "map" ? (
              <PixelButton size="sm" variant="ghost" title="Return to where you stand" onClick={() => setScreen("location")}>
                {GLYPH.place} Here
              </PixelButton>
            ) : null}
            <PixelButton size="sm" variant="ghost" title="Quests and decisions" onClick={() => setMenu(menu === "journal" ? null : "journal")}>
              {GLYPH.quests} Journal
            </PixelButton>
            <PixelButton size="sm" title="Pause menu (Esc)" onClick={() => setMenu(menu === null ? "pause" : null)}>
              {GLYPH.menu} Menu
            </PixelButton>
          </span>
        </div>

        {/* one clear objective, plus the realm's temper in the banner colours */}
        <div className="objective mx-2 mb-2 flex flex-wrap items-center gap-2 px-2 py-1">
          <span className="pixel-font text-[8px] uppercase text-muted-foreground">Objective</span>
          <span className="heading-font text-[10px] text-primary">{objective}</span>
          {objectiveWhere ? <span className="text-sm text-muted-foreground">— {objectiveWhere}</span> : null}
          <span className="ml-auto pixel-font text-[8px] uppercase" style={{ color: tone.allegiance?.color ?? "var(--muted-foreground)" }}>
            {tone.allegiance ? `${tone.allegiance.name} · ` : ""}
            {tone.label}
          </span>
        </div>
        <span
          aria-hidden
          className="banner-strip block"
          style={{ ["--banner-color" as string]: tone.allegiance?.color ?? (tone.mood === "war" ? "var(--destructive)" : "var(--primary)") }}
        />
      </header>

      {menu === "pause" ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm" onClick={() => setMenu(null)}>
          <div className="w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <Panel title="Paused" className="surface-wood">
              <div className="flex flex-col gap-2">
                <MenuRow icon="▶" label="Resume" variant="default" hint="Back to the game (Esc)" onClick={() => setMenu(null)} />
                <MenuRow icon={GLYPH.quests} label="Quest Journal" hint="Work in hand and past decisions" onClick={() => setMenu("journal")} />
                <MenuRow icon="📖" label="World Lore" hint="History, the usurper, and each house's goals" onClick={() => { setMenu(null); setScreen("lore"); }} />
                <MenuRow icon={GLYPH.realm} label="State of the Realm" hint="Houses, wars and recent word" onClick={() => setMenu("world")} />
                <MenuRow icon={GLYPH.save} label="Save / Load" hint="Manage your save slots" onClick={() => setMenu("saves")} />
                <MenuRow icon={GLYPH.settings} label="Settings" hint="Display, text and audio options" onClick={() => setMenu("settings")} />
                <div className="rule-ornate my-1" />
                <MenuRow icon="⚑" label="Abandon to Title" variant="danger" hint="Unsaved progress is lost" onClick={quit} />
              </div>
            </Panel>
          </div>
        </div>
      ) : null}

      {menu === "settings" ? <SettingsPanel className="mb-3" onClose={() => setMenu(null)} /> : null}

      {menu === "journal" ? (
        <Panel
          title="Quest Journal"
          className="scroll-panel mb-3"
          right={
            <PixelButton size="sm" variant="ghost" onClick={() => setMenu(null)}>
              Close
            </PixelButton>
          }
        >
          <ul className="space-y-1 text-sm">
            {journal.map((q) => (
              <li key={q.id} className="border border-border bg-background/40 px-2 py-1">
                <span className="heading-font text-[10px] text-primary">{q.name}</span>
                <span className="block text-muted-foreground">
                  {q.desc} → {LOCATIONS[q.target]?.name ?? "unknown"}
                </span>
              </li>
            ))}
            {journal.length === 0 ? <li className="text-muted-foreground">No work in hand. Ask in a village or castle.</li> : null}
          </ul>

          <h3 className="heading-font mb-1 mt-4 text-[10px] text-primary">What you have already decided</h3>
          <ul className="max-h-56 space-y-1 overflow-y-auto text-sm">
            {[...game.choiceHistory].reverse().map((c, i) => (
              <li key={`${c.beatId}${c.choiceId}${i}`} className="border-l-2 border-accent bg-background/40 px-2 py-1 text-muted-foreground">
                <span className="pixel-font mr-1 text-[8px] text-muted-foreground">Day {c.day}</span>
                {c.summary}
              </li>
            ))}
            {game.choiceHistory.length === 0 ? (
              <li className="text-muted-foreground">Nothing yet. The realm is still waiting to find out who you are.</li>
            ) : null}
          </ul>
          {game.branch ? (
            <p className="pixel-font mt-2 text-[9px] text-primary">Path taken: {game.branch}</p>
          ) : null}
          {game.marriedTo ? (
            <p className="pixel-font mt-1 text-[9px] text-accent">Wed to {NPCS[game.marriedTo]?.name ?? game.marriedTo}.</p>
          ) : null}
        </Panel>
      ) : null}


      {menu === "saves" ? (
        <div className="mb-3">
          <SavesPanel current={game} onClose={() => setMenu(null)} onLoad={(g) => { load(g); setMenu(null); }} />
        </div>
      ) : null}

      {menu === "world" ? (
        <Panel
          title="State of the Realm"
          className="mb-3"
          right={<PixelButton size="sm" variant="ghost" onClick={() => setMenu(null)}>Close</PixelButton>}
        >
          <div className="grid gap-2 md:grid-cols-2">
            <ul className="space-y-1 text-sm">
              {FACTION_IDS.map((id) => {
                const f = FACTIONS[id];
                const r = game.factions[id];
                return (
                  <li key={id} className="flex items-center gap-2 border border-border bg-background/40 px-2 py-1">
                    <span aria-hidden>{f.banner}</span>
                    <span className="flex-1">{f.name}</span>
                    <span className="pixel-font text-[9px] text-muted-foreground">
                      str {r.strength} · coin {r.treasury} · you {r.rep > 0 ? `+${r.rep}` : r.rep}
                    </span>
                  </li>
                );
              })}
            </ul>
            <div>
              <h3 className="heading-font mb-1 text-[10px] text-primary">Standing between houses</h3>
              <ul className="space-y-0.5 text-sm">
                {FACTION_IDS.flatMap((a, i) =>
                  FACTION_IDS.slice(i + 1).map((b) => {
                    const kind = relationOf(game, a, b);
                    if (kind === "peace") return null;
                    return (
                      <li key={`${a}${b}`} className={kind === "war" ? "text-destructive" : "text-accent"}>
                        {FACTIONS[a].name} — {kind} — {FACTIONS[b].name}
                      </li>
                    );
                  }),
                )}
              </ul>
              <h3 className="heading-font mb-1 mt-3 text-[10px] text-primary">Recent word</h3>
              <ul className="space-y-0.5 text-sm text-muted-foreground">
                {game.worldEvents.slice(0, 6).map((e, i) => (
                  <li key={i}>
                    Day {e.day}: {e.text}
                  </li>
                ))}
                {game.worldEvents.length === 0 ? <li>The realm is, for now, quiet.</li> : null}
              </ul>
            </div>
          </div>
        </Panel>
      ) : null}
    </>
  );
}
