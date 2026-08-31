import { useState } from "react";
import { useGame } from "@/game/store";
import { FACTIONS, FACTION_IDS, LOCATIONS, NPCS } from "@/game/world";
import { FACTION_LORE, LORE_TERMS, REALM_HISTORY, USURPER_RISE } from "@/game/lore";
import { ART, GLYPH, NPC_ART } from "@/game/art";
import { Panel, PixelButton, SceneArt } from "./ui";
import { Portrait } from "./ui";

type Tab = "history" | "usurper" | "houses" | "terms";

const TABS: { id: Tab; label: string; hint: string }[] = [
  { id: "history", label: "The Realm", hint: "How six houses ended up with no king" },
  { id: "usurper", label: "The Usurper", hint: "Corvus Draeven, step by step" },
  { id: "houses", label: "The Houses", hint: "What each faction actually wants" },
  { id: "terms", label: "Common Terms", hint: "Words the realm uses without explaining" },
];

function Entry({ year, title, text }: { year: string; title: string; text: string }) {
  return (
    <li className="relative border-l-2 border-accent/70 pl-3">
      <span className="pixel-font block text-[9px] uppercase tracking-wide text-accent">{year}</span>
      <span className="heading-font block text-[11px] text-primary">{title}</span>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{text}</p>
    </li>
  );
}

export function LoreScreen() {
  const { game, setScreen } = useGame();
  const [tab, setTab] = useState<Tab>("history");

  const art = tab === "usurper" ? ART.burning : tab === "houses" ? ART.council : ART.throne;

  return (
    <div className={game ? "" : "torchlit min-h-screen px-2 py-4"}>
      <div className="mx-auto w-full max-w-4xl">
        <Panel
          title="Chronicle of the Realm"
          right={
            <PixelButton size="sm" variant="ghost" onClick={() => setScreen(game ? "map" : "title")}>
              {game ? "Back to the map" : "Back to title"}
            </PixelButton>
          }
        >
          <SceneArt src={art} alt="A painted scene from the realm's history" height="h-28 sm:h-36" className="mb-3" />

          <nav className="mb-3 flex flex-wrap gap-1">
            {TABS.map((t) => (
              <PixelButton
                key={t.id}
                size="sm"
                variant={tab === t.id ? "default" : "ghost"}
                title={t.hint}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </PixelButton>
            ))}
          </nav>
          <p className="mb-3 text-xs italic text-muted-foreground">{TABS.find((t) => t.id === tab)?.hint}</p>

          {tab === "history" ? (
            <ul className="space-y-3">
              {REALM_HISTORY.map((e) => (
                <Entry key={e.title} {...e} />
              ))}
            </ul>
          ) : null}

          {tab === "usurper" ? (
            <div className="grid gap-3 md:grid-cols-[auto_1fr]">
              <div className="flex flex-col items-center gap-1">
                <Portrait src={NPC_ART["lord_draeven"]} glyph="👺" alt="Corvus Draeven" size="h-28 w-24" />
                <span className="heading-font text-[10px] text-primary">Corvus Draeven</span>
                <span className="pixel-font text-[8px] text-muted-foreground">Hammer of the Iron Pact</span>
              </div>
              <ul className="space-y-3">
                {USURPER_RISE.map((e) => (
                  <Entry key={e.title} {...e} />
                ))}
              </ul>
            </div>
          ) : null}

          {tab === "houses" ? (
            <div className="grid gap-3 md:grid-cols-2">
              {FACTION_IDS.map((id) => {
                const f = FACTIONS[id];
                const l = FACTION_LORE[id];
                const lord = NPCS[f.lordId];
                const rep = game?.factions[id]?.rep;
                return (
                  <article key={id} className="ornate surface-stone bg-background/40 p-2">
                    <header className="mb-2 flex items-center gap-2">
                      <Portrait src={lord ? NPC_ART[lord.id] : undefined} glyph={f.banner} alt={lord?.name ?? f.name} size="h-14 w-14" />
                      <div className="min-w-0">
                        <h3 className="heading-font text-[11px]" style={{ color: f.color }}>
                          {f.name} · {f.house}
                        </h3>
                        <p className="pixel-font text-[8px] text-muted-foreground">
                          {lord?.name ?? "—"} · seat: {LOCATIONS[f.capital]?.name ?? "—"}
                        </p>
                        <p className="text-xs italic text-muted-foreground">{l.motto}</p>
                      </div>
                    </header>
                    <p className="mb-2 text-sm text-muted-foreground">{l.history}</p>
                    <p className="mb-2 text-sm text-muted-foreground">{l.lineage}</p>
                    <div className="mb-2 border border-border bg-background/40 p-2">
                      <p className="pixel-font mb-1 text-[8px] uppercase text-primary">The court</p>
                      <ul className="space-y-1">
                        {l.court.map((c) => (
                          <li key={c.name} className="text-sm text-muted-foreground">
                            <span className="text-foreground">{c.name}</span>
                            <span className="pixel-font text-[8px] uppercase"> · {c.role}</span>
                            <span className="block text-xs italic">{c.note}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <dl className="space-y-1 text-sm">
                      <div>
                        <dt className="pixel-font inline text-[8px] uppercase text-primary">Goal · </dt>
                        <dd className="inline text-muted-foreground">{l.goal}</dd>
                      </div>
                      <div>
                        <dt className="pixel-font inline text-[8px] uppercase text-primary">Wants from you · </dt>
                        <dd className="inline text-muted-foreground">{l.wants}</dd>
                      </div>
                      <div>
                        <dt className="pixel-font inline text-[8px] uppercase text-primary">Fears · </dt>
                        <dd className="inline text-muted-foreground">{l.fears}</dd>
                      </div>
                      <div>
                        <dt className="pixel-font inline text-[8px] uppercase text-accent">In the war · </dt>
                        <dd className="inline text-muted-foreground">{l.stance}</dd>
                      </div>
                      <div>
                        <dt className="pixel-font inline text-[8px] uppercase text-destructive">Faultline · </dt>
                        <dd className="inline text-muted-foreground">{l.faultline}</dd>
                      </div>
                    </dl>
                    <footer className="pixel-font mt-2 flex flex-wrap gap-x-3 text-[8px] text-muted-foreground">
                      <span>str {game?.factions[id]?.strength ?? f.strength}</span>
                      <span>coin {game?.factions[id]?.treasury ?? f.treasury}</span>
                      {rep !== undefined ? <span>you {rep > 0 ? `+${rep}` : rep}</span> : null}
                    </footer>
                  </article>
                );
              })}
            </div>
          ) : null}

          {tab === "terms" ? (
            <dl className="space-y-2">
              {LORE_TERMS.map((t) => (
                <div key={t.term} className="border-l-2 border-border pl-3">
                  <dt className="heading-font text-[11px] text-primary">{t.term}</dt>
                  <dd className="text-sm text-muted-foreground">{t.text}</dd>
                </div>
              ))}
            </dl>
          ) : null}

          <p className="pixel-font mt-4 text-[8px] text-muted-foreground">
            {GLYPH.quests} Chronicles are written by survivors, who are rarely impartial.
          </p>
        </Panel>
      </div>
    </div>
  );
}
