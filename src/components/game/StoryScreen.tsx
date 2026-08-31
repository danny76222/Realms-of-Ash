import { useState } from "react";
import { currentBeat, finalEnemies } from "@/game/story";
import { applyChoice } from "@/game/progress";
import { setFlags } from "@/game/state";
import { useGame } from "@/game/store";
import { BEAT_ART, NPC_ART } from "@/game/art";
import { FACTIONS, NPCS } from "@/game/world";
import { useSettings } from "@/game/settings";
import { playSfx } from "@/game/sound";
import type { StoryChoice } from "@/game/types";
import { DialogueBox, Panel, PixelButton, SceneArt } from "./ui";

const BRANCH_LABEL: Record<string, string> = {
  loyalist: "locks the loyalist road",
  usurper: "locks the usurper's road",
  independent: "locks the independent road",
};

/** Plain-language read on what a choice is likely to cost or win. */
function choiceHints(c: StoryChoice): { tone: "good" | "bad" | "warn"; text: string }[] {
  const out: { tone: "good" | "bad" | "warn"; text: string }[] = [];
  if (c.branch) out.push({ tone: "warn", text: BRANCH_LABEL[c.branch] ?? "locks a path" });
  for (const [f, v] of Object.entries(c.rep ?? {})) {
    if (!v) continue;
    out.push({ tone: v > 0 ? "good" : "bad", text: `${FACTIONS[f as keyof typeof FACTIONS]?.name ?? f} ${v > 0 ? "+" : ""}${v}` });
  }
  for (const n of c.npc ?? []) {
    const name = NPCS[n.npcId]?.name ?? n.npcId;
    if (n.kill) out.push({ tone: "bad", text: `${name} dies` });
    else if (n.recruit) out.push({ tone: "good", text: `${name} may join you` });
    else if (n.affinity) out.push({ tone: n.affinity > 0 ? "good" : "bad", text: `${name} ${n.affinity > 0 ? "+" : ""}${n.affinity} regard` });
  }
  for (const r of c.relations ?? []) {
    out.push({ tone: "warn", text: `${FACTIONS[r.a]?.name} / ${FACTIONS[r.b]?.name} → ${r.kind}` });
  }
  if (c.gold) out.push({ tone: c.gold > 0 ? "good" : "bad", text: `${c.gold > 0 ? "+" : ""}${c.gold} gold` });
  if (c.renown) out.push({ tone: c.renown > 0 ? "good" : "bad", text: `${c.renown > 0 ? "+" : ""}${c.renown} renown` });
  return out;
}

function Hints({ c }: { c: StoryChoice }) {
  const hints = choiceHints(c);
  if (!hints.length) return null;
  return (
    <span className="mt-1.5 flex flex-wrap gap-1">
      {hints.map((h, i) => (
        <span
          key={i}
          className={`pixel-font border px-1 py-0.5 text-[8px] ${
            h.tone === "good"
              ? "border-accent text-accent"
              : h.tone === "bad"
                ? "border-destructive text-destructive"
                : "border-border text-muted-foreground"
          }`}
        >
          {h.text}
        </span>
      ))}
    </span>
  );
}

export function StoryScreen() {
  const { game, update, setScreen, fight, finishGame } = useGame();
  const [outcome, setOutcome] = useState<string | null>(null);
  const { settings } = useSettings();
  if (!game) return null;
  const beat = currentBeat(game);
  if (!beat) {
    return (
      <div className="mx-auto max-w-2xl px-3">
        <Panel title="The Road Ahead">
          <p className="text-lg">The realm holds its breath. Nothing in the main tale waits on you today.</p>
          <PixelButton className="mt-2" onClick={() => setScreen("location")}>
            Back
          </PixelButton>
        </Panel>
      </div>
    );
  }

  const fought = !!game.storyFlags[`fought_${beat.id}`];
  const isFinal = beat.id === "b7_final";
  const battleSpec = isFinal ? { ...finalEnemies(game), boss: undefined } : beat.battle;

  if (outcome) {
    const last = game.beatIndex >= 8;
    return (
      <div className="mx-auto max-w-2xl px-3 pb-8">
        <Panel title={beat.title}>
          {settings.sceneArt && BEAT_ART[beat.id] ? (
            <SceneArt src={BEAT_ART[beat.id]!} alt={beat.title} className="mb-3" height="h-36 sm:h-48" />
          ) : null}
          <DialogueBox text={outcome} typewriter={settings.typewriter} />
          <PixelButton
            className="mt-3"
            sfx="confirm"
            onClick={() => {
              setOutcome(null);
              if (last) finishGame();
              else setScreen("location");
            }}
          >
            {last ? "See how it ends" : "Onward"}
          </PixelButton>
        </Panel>
      </div>
    );
  }

  const speakerId = (beat.choices.flatMap((c) => c.npc ?? []).find((n) => NPCS[n.npcId])?.npcId) ?? null;
  const speaker = speakerId ? NPCS[speakerId] : null;

  return (
    <div className="mx-auto max-w-2xl px-3 pb-8">
      <Panel title={`Chapter ${beat.chapter} — ${beat.title}`}>
        {settings.sceneArt && BEAT_ART[beat.id] ? (
          <SceneArt src={BEAT_ART[beat.id]!} alt={beat.title} className="mb-3" height="h-36 sm:h-48" />
        ) : null}
        <DialogueBox
          {...(speaker
            ? { speaker: speaker.name, portrait: settings.sceneArt ? NPC_ART[speaker.id] : undefined, glyph: speaker.portrait, voiceId: speaker.id }
            : {})}
          text={beat.intro(game)}
          typewriter={settings.typewriter}
        />

        {battleSpec && !fought ? (
          <div className="mt-3">
            <p className="pixel-font mb-2 text-[10px] text-destructive">There is fighting to be done first.</p>
            <PixelButton
              variant="danger"
              onClick={() => {
                update((g) => setFlags(g, { [`fought_${beat.id}`]: true }));
                fight({ title: battleSpec.title, enemyIds: battleSpec.enemyIds, tag: `story:${beat.id}`, canFlee: false });
              }}
            >
              Take the field
            </PixelButton>
            <PixelButton className="ml-2" variant="ghost" sfx="cancel" onClick={() => setScreen("location")}>
              Not yet
            </PixelButton>
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            <p className="pixel-font text-[9px] uppercase text-muted-foreground">Decide</p>
            {beat.choices
              .filter((c) => !c.requires || c.requires(game))
              .map((c) => (
                <button
                  key={c.id}
                  onMouseEnter={() => playSfx("hover")}
                  onClick={() => {
                    playSfx("confirm");
                    update((g) => applyChoice(g, beat, c));
                    setOutcome(c.outcome);
                  }}
                  className="pixel-btn block w-full bg-secondary px-3 py-2 text-left hover:bg-muted"
                >
                  <span className="pixel-font text-[10px] text-primary">{c.label}</span>
                  <span className="mt-1 block text-sm text-muted-foreground">{c.detail}</span>
                  <Hints c={c} />
                </button>
              ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
