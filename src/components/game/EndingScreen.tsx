import { ENDINGS } from "@/game/story";
import { FACTIONS, FACTION_IDS, NPCS } from "@/game/world";
import { useGame } from "@/game/store";
import { ART, ENDING_ART } from "@/game/art";
import { Panel, PixelButton, SceneArt } from "./ui";

export function EndingScreen() {
  const { game, quit } = useGame();
  if (!game) return null;
  const ending = ENDINGS.find((e) => e.id === game.endingId) ?? ENDINGS[0]!;
  const dead = Object.entries(game.npcs).filter(([, s]) => !s.alive);
  const friends = Object.entries(game.npcs).filter(([, s]) => s.affinity >= 40);

  return (
    <div className="mx-auto max-w-2xl px-3 pb-10">
      <Panel title="The Ledger Closes">
        <SceneArt src={ENDING_ART[ending.id] ?? ART.coronation} alt={ending.title} className="mb-3" height="h-44 sm:h-60" />
        <h1 className="display-font text-2xl text-primary">{ending.title}</h1>
        <p className="mt-3 text-lg leading-relaxed">{ending.body(game)}</p>

        <h2 className="heading-font mt-5 text-[10px] text-muted-foreground">What you decided</h2>
        <ul className="mt-1 space-y-0.5 text-sm">
          {game.choiceHistory.map((c, i) => (
            <li key={i}>
              Day {c.day} — {c.summary}
            </li>
          ))}
        </ul>

        <h2 className="heading-font mt-4 text-[10px] text-muted-foreground">The realm at the end</h2>
        <ul className="mt-1 grid gap-0.5 text-sm sm:grid-cols-2">
          {FACTION_IDS.map((id) => (
            <li key={id}>
              {FACTIONS[id].name}: standing {game.factions[id].rep}, strength {game.factions[id].strength}
            </li>
          ))}
        </ul>

        <p className="mt-3 text-sm text-muted-foreground">
          {game.marriedTo ? `Wed to ${NPCS[game.marriedTo]?.name}. ` : ""}
          {friends.length ? `${friends.length} people would still buy you a drink. ` : ""}
          {dead.length ? `${dead.length} did not survive your story.` : "Remarkably, everyone important survived."}
        </p>

        <PixelButton className="mt-4" onClick={quit}>
          Begin another tale
        </PixelButton>
      </Panel>
    </div>
  );
}
