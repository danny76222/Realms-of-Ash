import { useMemo, useState } from "react";
import { Icon } from "./icons";
import { CLASSES, ITEMS, SKILLS } from "@/game/data";
import {
  addItem,
  hireRecruit,
  advanceDays,
  sleepToMorning,
  buyItem,
  pushLog,
  restParty,
  shiftAffinity,
} from "@/game/state";
import {
  acceptQuest,
  canPropose,
  completeQuest,
  generateSideQuests,
  giveGift,
  marry,
  questEnemies,
} from "@/game/progress";
import { currentBeat } from "@/game/story";
import { useGame } from "@/game/store";
import { FACTIONS, LOCATIONS, NPCS } from "@/game/world";
import type { SideQuest } from "@/game/types";
import { ART, LOCATION_ART, NPC_ART, ambientLine, locationLook } from "@/game/art";
import { sceneFilter, tintClass, timeOf, weatherOf } from "@/game/weather";
import { useSettings } from "@/game/settings";
import { DialogueBox, Meter, Panel, PixelButton, Portrait, SceneArt } from "./ui";
import { DISPOSITION_LABEL, characterLine, characterOf, dispositionOf } from "@/game/characters";
import { PartyPanel } from "./PartyPanel";

const KIND_LABEL: Record<string, string> = {
  village: "Village",
  castle: "Castle",
  dungeon: "Dungeon",
  ruin: "Ruin",
  shrine: "Shrine",
  camp: "Camp",
  landmark: "Landmark",
};

function regardTier(v: number): string {
  if (v < 0) return "cold";
  if (v < 20) return "wary";
  if (v < 40) return "cordial";
  if (v < 60) return "warm";
  if (v < 80) return "devoted";
  return "besotted";
}

const COURT_LINES: {
  id: string;
  label: string;
  detail: string;
  amount: number;
  log: (n: string) => string;
}[] = [
  {
    id: "flatter",
    label: "Flatter them",
    detail: "Cheap, and it shows.",
    amount: 1,
    log: (n) => `You praise ${n}'s judgement. They pretend not to enjoy it.`,
  },
  {
    id: "honest",
    label: "Speak plainly",
    detail: "Risky, but it lands.",
    amount: 4,
    log: (n) => `You tell ${n} the truth about the war. Something in them settles.`,
  },
  {
    id: "walk",
    label: "Walk the walls",
    detail: "An hour of nothing in particular.",
    amount: 3,
    log: (n) => `You and ${n} walk until the torches are lit. Neither of you mentions politics.`,
  },
];

/** Expression grading standing in for portrait variants. */
function npcMood(affinity: number) {
  if (affinity <= -20) return "hostile";
  if (affinity < 15) return "cold";
  if (affinity >= 60) return "devoted";
  return "warm";
}

export function LocationScreen() {
  const {
    game,
    update,
    setScreen,
    fight,
    enterDungeon,
    run,
    nextRoom,
    leaveDungeon,
    setPendingQuest,
    notice,
    setNotice,
  } = useGame();
  const [talking, setTalking] = useState<string | null>(null);
  const [wedding, setWedding] = useState<string | null>(null);
  const { settings } = useSettings();

  if (!game) return null;
  const loc = LOCATIONS[game.locationId]!;
  const faction = loc.faction ? FACTIONS[loc.faction] : null;
  const look = locationLook(loc.id, loc.kind);
  const beat = currentBeat(game);
  const beatHere =
    beat && (beat.location === null || beat.location === game.locationId) ? beat : null;

  const offered = useMemo(
    () => generateSideQuests(game, game.locationId),
    [game.locationId, game.day, game.seed],
  );
  const active: SideQuest[] = useMemo(
    () =>
      game.activeSide
        .map((id) => offered.find((q) => q.id === id) ?? null)
        .filter(Boolean) as SideQuest[],
    [game.activeSide, offered],
  );
  const activeAll = useMemo(() => {
    // keep accepted quests visible even away from their giver
    const map = new Map<string, SideQuest>();
    for (const q of offered) map.set(q.id, q);
    for (const q of active) map.set(q.id, q);
    return [...map.values()].filter((q) => game.activeSide.includes(q.id));
  }, [offered, active, game.activeSide]);

  const npcsHere = (loc.npcs ?? []).filter((id) => NPCS[id] && game.npcs[id]?.alive);
  const recruits = loc.recruits ?? [];
  const heroLevel = game.party[0]?.level ?? 1;

  const resolveQuest = (q: SideQuest) => {
    if (q.kind === "bandit" || q.kind === "rescue" || q.kind === "investigate") {
      setPendingQuest(q);
      fight({ title: q.name, enemyIds: questEnemies(q, heroLevel), tag: `quest:${q.id}` });
    } else if (q.kind === "escort") {
      if ((game.quests[q.id]?.progress ?? 0) < q.need) {
        setNotice("Your passenger is still talking, and still not there yet. Travel more.");
        return;
      }
      update((g) => completeQuest(g, q));
    } else {
      update((g) => completeQuest(g, q));
    }
  };

  if (wedding) {
    const spouse = NPCS[wedding];
    const house = spouse?.faction ? FACTIONS[spouse.faction] : null;
    return (
      <div className="mx-auto max-w-2xl px-3 pb-10">
        <Panel title="A Match Is Made">
          {settings.sceneArt ? (
            <SceneArt
              src={ART.wedding}
              alt="A wedding in a stone hall"
              className="mb-3"
              height="h-40 sm:h-52"
            />
          ) : null}
          <DialogueBox
            {...(spouse
              ? {
                  speaker: spouse.name,
                  portrait: settings.sceneArt ? NPC_ART[wedding] : undefined,
                  glyph: spouse.portrait,
                  voiceId: wedding,
                }
              : {})}
            text={`The hall is cold, the wine is worse, and half the guests came to count your soldiers. None of that matters when ${
              spouse?.name ?? "they"
            } takes your hand. ${
              house
                ? `${house.name} now counts your fate with theirs. Their friends will call on you, and so will their enemies.`
                : "Whatever comes for them now comes for you as well."
            }`}
            typewriter={settings.typewriter}
          />
          <PixelButton className="mt-3" sfx="confirm" onClick={() => setWedding(null)}>
            Face the morning
          </PixelButton>
        </Panel>
      </div>
    );
  }

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-3 px-3 pb-10 lg:grid-cols-[1fr_20rem]">
      <div className="space-y-3">
        {notice ? (
          <Panel className="border-primary">
            <div className="flex items-center gap-2">
              <p className="flex-1 text-sm text-primary">{notice}</p>
              <PixelButton size="sm" variant="ghost" onClick={() => setNotice(null)}>
                Ok
              </PixelButton>
            </div>
          </Panel>
        ) : null}

        <Panel
          title={`${loc.name}, ${KIND_LABEL[loc.kind]}${faction ? ` of ${faction.name}` : ""}`}
          right={
            <PixelButton size="sm" variant="ghost" onClick={() => setScreen("map")}>
              Travel
            </PixelButton>
          }
        >
          {settings.sceneArt && look.src ? (
            <SceneArt
              src={look.src}
              alt={`${loc.name}, a ${(KIND_LABEL[loc.kind] ?? "place").toLowerCase()}`}
              className="mb-2"
              filter={`${look.filter} ${weatherOf(game).filter}`}
              tint={tintClass(timeOf(game).phase)}
              weather={weatherOf(game).fx}
              {...(faction ? { bannerColor: faction.color } : {})}
            />
          ) : null}
          <p className="text-lg italic leading-relaxed text-muted-foreground">{loc.blurb}</p>
          <p className="mt-1 text-sm italic text-muted-foreground">
            {ambientLine(loc.kind, game.day + game.locationId.length)}
          </p>
          <p className="pixel-font mt-1 text-[9px] uppercase text-muted-foreground">
            <Icon name={weatherOf(game).glyph} /> {weatherOf(game).name} · {timeOf(game).label}
          </p>
          <p className="mt-1 text-sm italic text-muted-foreground">{weatherOf(game).line}</p>
          <div className="mt-3 flex flex-wrap gap-1">
            <PixelButton
              size="sm"
              variant="ghost"
              onClick={() =>
                update((g) =>
                  pushLog(
                    restParty(sleepToMorning(g), 0.6),
                    "You rest the night through. The world does not.",
                  ),
                )
              }
            >
              Rest till morning
            </PixelButton>
            {loc.kind === "dungeon" || loc.kind === "ruin" || loc.kind === "camp" ? (
              <PixelButton
                size="sm"
                variant="danger"
                disabled={!!run}
                onClick={() => enterDungeon(loc.id)}
              >
                Go in
              </PixelButton>
            ) : null}
            {loc.kind === "shrine" ? (
              <PixelButton
                size="sm"
                variant="accent"
                onClick={() =>
                  update((g) =>
                    pushLog(
                      restParty(sleepToMorning(g), 1),
                      "The keeper says the old words over your company. Everyone is whole again.",
                    ),
                  )
                }
              >
                Take the rites
              </PixelButton>
            ) : null}
            {beatHere ? (
              <PixelButton size="sm" onClick={() => setScreen("story")}>
                ★ {beatHere.title}
              </PixelButton>
            ) : beat?.location ? (
              <span className="pixel-font self-center text-[9px] text-muted-foreground">
                The tale waits at {LOCATIONS[beat.location]?.name}.
              </span>
            ) : null}
          </div>
        </Panel>

        {run ? (
          <Panel title={`In the Depths: ${loc.name}`}>
            {settings.sceneArt && look.src ? (
              <SceneArt
                src={look.src}
                alt={`${loc.name} depths`}
                className="mb-2"
                height="h-24 sm:h-28"
                filter={look.filter}
              />
            ) : null}
            <div className="mb-2 flex flex-wrap gap-1">
              {run.rooms.map((r, i) => (
                <span
                  key={i}
                  className={`pixel-font border px-1 py-0.5 text-[8px] ${
                    i < run.index
                      ? "border-accent text-accent"
                      : i === run.index
                        ? "border-primary text-primary"
                        : "border-border text-muted-foreground"
                  }`}
                >
                  {i < run.index ? "✓" : i + 1}
                  {i === run.rooms.length - 1 ? " ★" : ""}
                </span>
              ))}
            </div>
            <p className="text-lg italic leading-relaxed text-muted-foreground">
              {run.index >= run.rooms.length
                ? "Every chamber is quiet. Whatever lived down here has stopped objecting."
                : `Ahead of you: ${run.rooms[run.index]?.name}.`}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Haul so far: {run.gold} gold
              {run.loot.length
                ? `, ${run.loot.map((l) => ITEMS[l]?.name ?? l).join(", ")}`
                : ", nothing worth carrying yet"}
              .
            </p>
            <div className="mt-2 flex gap-2">
              {run.index < run.rooms.length ? (
                <PixelButton size="sm" variant="danger" onClick={nextRoom}>
                  Press deeper
                </PixelButton>
              ) : null}
              <PixelButton
                size="sm"
                variant="ghost"
                sfx={run.index >= run.rooms.length ? "confirm" : "cancel"}
                onClick={leaveDungeon}
              >
                {run.index >= run.rooms.length ? "Claim the hoard" : "Withdraw with half"}
              </PixelButton>
            </div>
          </Panel>
        ) : null}

        {npcsHere.length ? (
          <Panel title="People Here">
            <ul className="space-y-2">
              {npcsHere.map((id) => {
                const npc = NPCS[id]!;
                const st = game.npcs[id]!;
                const line = characterLine(game, id);
                const chr = characterOf(id);
                const gifts = Object.keys(game.inventory).filter((i) => ITEMS[i]?.kind === "gift");
                const courting = !!npc.eligible && !game.marriedTo;
                const wed = game.marriedTo === id;
                return (
                  <li key={id} className="border border-border bg-background/40 p-2">
                    <div className="flex items-center gap-2">
                      <Portrait
                        src={settings.sceneArt ? NPC_ART[id] : undefined}
                        glyph={npc.portrait}
                        alt={npc.name}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="pixel-font text-[10px] text-primary">
                          {npc.name}
                          {wed ? " · your spouse" : ""}
                        </p>
                        <p className="text-sm text-muted-foreground">{npc.title}</p>
                      </div>
                      <PixelButton
                        size="sm"
                        variant="ghost"
                        onClick={() => setTalking(talking === id ? null : id)}
                      >
                        {talking === id ? "Leave" : "Speak"}
                      </PixelButton>
                    </div>
                    {talking === id ? (
                      <div className="mt-2 border-t border-border pt-2">
                        <DialogueBox
                          speaker={npc.name}
                          portrait={settings.sceneArt ? NPC_ART[id] : undefined}
                          glyph={npc.portrait}
                          text={line}
                          typewriter={settings.typewriter}
                          voiceId={id}
                          mood={npcMood(st.affinity)}
                        />
                        {chr ? (
                          <div className="mt-1 space-y-1">
                            <div className="flex flex-wrap gap-1">
                              {chr.traits.map((t) => (
                                <span
                                  key={t}
                                  className="pixel-font border border-border px-1 py-0.5 text-[8px] uppercase text-muted-foreground"
                                >
                                  {t}
                                </span>
                              ))}
                              <span className="pixel-font border border-accent/60 px-1 py-0.5 text-[8px] uppercase text-accent">
                                {DISPOSITION_LABEL[dispositionOf(st.affinity)]}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">{chr.backstory}</p>
                            <p className="text-sm italic text-muted-foreground">
                              Voice: {chr.speech}
                            </p>
                          </div>
                        ) : (
                          <p className="mt-1 text-sm italic text-muted-foreground">
                            {npc.personality}
                          </p>
                        )}

                        <div className="mt-2">
                          <Meter
                            value={Math.max(0, st.affinity)}
                            label={`Regard ${st.affinity}, ${regardTier(st.affinity)}`}
                          />
                        </div>

                        <div className="mt-2 flex flex-wrap gap-1">
                          <PixelButton
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              update((g) =>
                                pushLog(
                                  shiftAffinity(g, id, 2),
                                  `You spend an hour listening to ${npc.name}. It counts for something.`,
                                ),
                              )
                            }
                          >
                            Talk a while
                          </PixelButton>
                          {courting || wed
                            ? COURT_LINES.map((cl) => (
                                <PixelButton
                                  key={cl.id}
                                  size="sm"
                                  variant="ghost"
                                  title={cl.detail}
                                  onClick={() =>
                                    update((g) =>
                                      pushLog(shiftAffinity(g, id, cl.amount), cl.log(npc.name)),
                                    )
                                  }
                                >
                                  {cl.label}
                                </PixelButton>
                              ))
                            : null}
                          {gifts.map((gi) => (
                            <PixelButton
                              key={gi}
                              size="sm"
                              variant="accent"
                              sfx="confirm"
                              onClick={() => update((g) => giveGift(g, id, gi))}
                            >
                              Gift: {ITEMS[gi]!.name}
                            </PixelButton>
                          ))}
                          {courting ? (
                            <PixelButton
                              size="sm"
                              sfx="confirm"
                              disabled={!canPropose(game, id)}
                              onClick={() => {
                                update((g) => marry(g, id));
                                setWedding(id);
                              }}
                            >
                              {canPropose(game, id)
                                ? "Propose marriage"
                                : `Propose (regard ${st.affinity}/60, fame ${game.fame}/30)`}
                            </PixelButton>
                          ) : null}
                        </div>
                        {courting ? (
                          <p className="mt-1 text-sm text-muted-foreground">
                            A match here would bind you to{" "}
                            {npc.faction ? FACTIONS[npc.faction].name : "their house"}, their wars
                            would become yours.
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </Panel>
        ) : null}

        {(loc.kind === "village" || loc.kind === "castle") && offered.length ? (
          <Panel title={loc.kind === "castle" ? "Petitions & Commissions" : "Rumours & Work"}>
            <ul className="space-y-1">
              {offered.map((q) => {
                const accepted = game.activeSide.includes(q.id);
                const done = game.quests[q.id]?.status === "done";
                return (
                  <li key={q.id} className="border border-border bg-background/40 px-2 py-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="min-w-0 flex-1">
                        <span className="pixel-font text-[10px] text-primary">{q.name}</span>
                        <span className="block text-sm text-muted-foreground">
                          {q.desc} → {LOCATIONS[q.target]?.name}.
                        </span>
                      </span>
                      {done ? (
                        <span className="pixel-font text-[9px] text-accent">done</span>
                      ) : accepted ? (
                        <span className="pixel-font text-[9px] text-muted-foreground">
                          {game.quests[q.id]?.motive === "favour"
                            ? "taken as a favour"
                            : "accepted"}
                        </span>
                      ) : null}
                    </div>

                    {/* Ruling 18: taking work is a choice, not a button. The
                        giver says something different depending on which way
                        you are leaning, and the two pay in different coin. */}
                    {!done && !accepted ? (
                      <div className="mt-2 grid gap-1 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={() => update((g) => acceptQuest(g, q, "coin"))}
                          className="border border-border bg-background/60 px-2 py-1.5 text-left hover:border-primary"
                        >
                          <span className="pixel-font block text-[9px] uppercase text-primary">
                            For coin
                          </span>
                          <span className="mt-0.5 block text-xs italic text-muted-foreground">
                            {q.ask.coin}
                          </span>
                          <span className="pixel-font mt-1 block text-[9px] text-muted-foreground">
                            {q.rewardGold} gold · {q.rewardFame} fame
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => update((g) => acceptQuest(g, q, "favour"))}
                          className="border border-border bg-background/60 px-2 py-1.5 text-left hover:border-primary"
                        >
                          <span className="pixel-font block text-[9px] uppercase text-primary">
                            As a favour
                          </span>
                          <span className="mt-0.5 block text-xs italic text-muted-foreground">
                            {q.ask.favour}
                          </span>
                          <span className="pixel-font mt-1 block text-[9px] text-muted-foreground">
                            no gold · {q.rewardFame} fame · honour · they remember
                          </span>
                        </button>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </Panel>
        ) : null}

        {activeAll.length ? (
          <Panel title="Work in Hand">
            <ul className="space-y-1">
              {activeAll.map((q) => (
                <li
                  key={q.id}
                  className="flex flex-wrap items-center gap-2 border border-border bg-background/40 px-2 py-1.5"
                >
                  <span className="min-w-0 flex-1 text-sm">
                    {q.name}, target {LOCATIONS[q.target]?.name}
                    {q.kind === "escort"
                      ? ` (${game.quests[q.id]?.progress ?? 0}/${q.need} legs)`
                      : ""}
                  </span>
                  {q.target === game.locationId || q.kind === "escort" ? (
                    <PixelButton size="sm" variant="accent" onClick={() => resolveQuest(q)}>
                      Resolve
                    </PixelButton>
                  ) : null}
                </li>
              ))}
            </ul>
          </Panel>
        ) : null}

        {loc.shop?.length ? (
          <Panel title="Market Stalls">
            <ul className="grid gap-1 sm:grid-cols-2">
              {loc.shop.map((id) => {
                const item = ITEMS[id];
                if (!item) return null;
                return (
                  <li
                    key={id}
                    className="flex items-center gap-2 border border-border bg-background/40 px-2 py-1"
                  >
                    <span className="min-w-0 flex-1 text-sm">
                      <span className="text-foreground">{item.name}</span>
                      <span className="block text-muted-foreground">{item.desc}</span>
                    </span>
                    <PixelButton
                      size="sm"
                      disabled={game.gold < item.price}
                      onClick={() => update((g) => buyItem(g, id))}
                    >
                      {item.price} gold
                    </PixelButton>
                  </li>
                );
              })}
            </ul>
          </Panel>
        ) : null}

        {recruits.length && game.party.length < 4 ? (
          <Panel title="Hiring Sword-Hands">
            <ul className="grid gap-1 sm:grid-cols-2">
              {recruits.map((cid, i) => {
                const cls = CLASSES[cid];
                const cost = 80 + heroLevel * 40;
                return (
                  <li
                    key={`${cid}${i}`}
                    className="flex items-center gap-2 border border-border bg-background/40 px-2 py-1"
                  >
                    <span className="min-w-0 flex-1 text-sm">
                      <span className="pixel-font text-[10px] text-primary">
                        <>
                          <Icon name={cls.sprite} /> {cls.name}
                        </>
                      </span>
                      <span className="block text-muted-foreground">
                        {cls.blurb} Knows {SKILLS[cls.startSkill]?.name}.
                      </span>
                    </span>
                    <PixelButton
                      size="sm"
                      disabled={game.gold < cost}
                      onClick={() =>
                        update((g) => hireRecruit(g, cid, cost, Math.max(1, heroLevel - 1)))
                      }
                    >
                      {cost} gold
                    </PixelButton>
                  </li>
                );
              })}
            </ul>
          </Panel>
        ) : null}

        {loc.kind === "landmark" ? (
          <Panel title="Curiosity">
            <PixelButton
              size="sm"
              variant="accent"
              onClick={() =>
                update((g) => {
                  const find = Math.random() < 0.5 ? "old_coin" : "relic_shard";
                  return pushLog(
                    addItem(advanceDays(g, 1), find, 1),
                    `You spend a day poking about and turn up a ${ITEMS[find]!.name}.`,
                  );
                })
              }
            >
              Search the site
            </PixelButton>
          </Panel>
        ) : null}
      </div>

      <PartyPanel />
    </div>
  );
}
