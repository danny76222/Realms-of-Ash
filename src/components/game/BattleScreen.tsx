import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "./icons";
import { activeCombatant } from "@/game/engine";
import { ITEMS, SKILLS } from "@/game/data";
import { useGame } from "@/game/store";
import { LOCATION_ART, NPC_ART, enemyArt, unitArt } from "@/game/art";
import { LOCATIONS } from "@/game/world";
import { useSettings } from "@/game/settings";
import { playSfx } from "@/game/sound";
import type { Combatant } from "@/game/types";
import { Bar, Panel, PixelButton, Portrait } from "./ui";
import { BattleIntro } from "./BattleIntro";

interface Pop {
  key: number;
  text: string;
  tone: "dmg" | "crit" | "heal";
}

function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "good" | "bad";
}) {
  return (
    <span
      className={`pixel-font border px-1 text-[8px] ${
        tone === "good"
          ? "border-accent text-accent"
          : tone === "bad"
            ? "border-destructive text-destructive"
            : "border-border text-muted-foreground"
      }`}
    >
      {children}
    </span>
  );
}

/** Corner status plate, in the classic handheld-RPG style. */
function StatusPlate({
  c,
  active,
  align,
}: {
  c: Combatant;
  active: boolean;
  align: "left" | "right";
}) {
  return (
    <div
      className={`pixel-frame w-full bg-card/90 px-2 py-1 ${align === "right" ? "text-right" : "text-left"} ${
        active ? "fx-active" : ""
      } ${c.hp <= 0 ? "opacity-50" : ""}`}
    >
      <div className="pixel-font truncate text-[9px] text-foreground">
        {c.boss ? "★ " : ""}
        {c.name}
      </div>
      <Bar value={c.hp} max={c.maxHp} tone="hp" />
      <div
        className={`mt-1 flex items-center gap-2 ${align === "right" ? "flex-row-reverse" : ""}`}
      >
        <div className="w-14">
          <Bar value={c.focus} max={c.maxFocus} tone="focus" />
        </div>
        <span className="pixel-font text-[8px] text-muted-foreground">
          {c.hp}/{c.maxHp}
        </span>
      </div>
      <div className={`mt-1 flex flex-wrap gap-1 ${align === "right" ? "justify-end" : ""}`}>
        {c.defending ? <Badge>guard</Badge> : null}
        {c.guard > 0 ? <Badge>ward {c.guard}</Badge> : null}
        {c.fx.stunned ? <Badge tone="bad">stunned</Badge> : null}
        {c.fx.atkMod ? (
          <Badge tone={c.fx.atkMod > 0 ? "good" : "bad"}>
            atk {c.fx.atkMod > 0 ? "+" : ""}
            {c.fx.atkMod}
          </Badge>
        ) : null}
        {c.fx.defMod ? (
          <Badge tone={c.fx.defMod > 0 ? "good" : "bad"}>
            def {c.fx.defMod > 0 ? "+" : ""}
            {c.fx.defMod}
          </Badge>
        ) : null}
      </div>
    </div>
  );
}

/** Sprite standing on its platform in the arena. */
function Fighter({
  c,
  art,
  side,
  index,
  selectable,
  targeting,
  onClick,
  fx,
  pop,
}: {
  c: Combatant;
  art?: string | undefined;
  side: "ally" | "enemy";
  index: number;
  selectable: boolean;
  targeting: boolean;
  onClick: () => void;
  fx?: string | undefined;
  pop?: Pop | undefined;
}) {
  const dead = c.hp <= 0;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!selectable || dead}
      aria-label={`${c.name}, ${c.hp} of ${c.maxHp} health`}
      style={{ animationDelay: `${index * 90}ms` }}
      className={`fighter relative ${side === "enemy" ? "fighter-in-right" : "fighter-in-left"} ${dead ? "fx-down" : ""} ${
        fx ?? ""
      } ${selectable && !dead ? "cursor-pointer" : "cursor-default"}`}
    >
      {pop ? (
        <span
          key={pop.key}
          className={`float-num pixel-font text-[12px] ${
            pop.tone === "heal"
              ? "text-accent"
              : pop.tone === "crit"
                ? "text-destructive"
                : "text-foreground"
          }`}
        >
          {pop.text}
        </span>
      ) : null}
      <Portrait
        src={art}
        glyph={c.sprite}
        alt={c.name}
        size={side === "ally" ? "h-20 w-20 sm:h-24 sm:w-24" : "h-16 w-16 sm:h-20 sm:w-20"}
        className={targeting && selectable && !dead ? "target-glow" : ""}
      />
      <span className="fighter-shadow" aria-hidden />
      {targeting && selectable && !dead ? (
        <span className="target-marker pixel-font text-[10px] text-primary" aria-hidden>
          ▼
        </span>
      ) : null}
    </button>
  );
}

export function BattleScreen() {
  const { battle, game, act, closeBattle } = useGame();
  const { settings } = useSettings();
  const [mode, setMode] = useState<
    | null
    | { kind: "attack" }
    | { kind: "skill"; skillId: string }
    | { kind: "item"; itemId: string }
  >(null);
  const [panel, setPanel] = useState<null | "skill" | "item">(null);
  const [showLog, setShowLog] = useState(false);
  const [fx, setFx] = useState<Record<string, string>>({});
  const [pops, setPops] = useState<Record<string, Pop>>({});
  const [shake, setShake] = useState(false);
  const [intro, setIntro] = useState(true);
  const prevHp = useRef<Record<string, number>>({});
  const prevStatus = useRef<string | null>(null);
  const battleKey = battle
    ? `${battle.title}|${battle.returnTo}|${battle.combatants.map((c) => c.id).join(",")}`
    : "";
  const actor = useMemo(() => (battle ? activeCombatant(battle) : null), [battle]);

  // Fresh encounter → replay the intro wipe.
  useEffect(() => {
    if (!battleKey) return;
    setIntro(true);
    setMode(null);
    setPanel(null);
  }, [battleKey]);

  // Diff HP between turns to drive hit / crit / heal feedback.
  useEffect(() => {
    if (!battle) return;
    const nextFx: Record<string, string> = {};
    const nextPops: Record<string, Pop> = {};
    const stamp = Date.now();
    let crits = false;
    for (const c of battle.combatants) {
      const before = prevHp.current[c.id];
      prevHp.current[c.id] = c.hp;
      if (before === undefined || before === c.hp) continue;
      const delta = c.hp - before;
      if (delta < 0) {
        const crit = Math.abs(delta) >= Math.round(c.maxHp * 0.28);
        crits ||= crit;
        nextFx[c.id] = crit ? "fx-crit" : "fx-hit";
        nextPops[c.id] = {
          key: stamp + c.id.length,
          text: `${delta}`,
          tone: crit ? "crit" : "dmg",
        };
        playSfx(crit ? "crit" : "hit");
      } else {
        nextFx[c.id] = "fx-heal";
        nextPops[c.id] = { key: stamp + c.id.length, text: `+${delta}`, tone: "heal" };
        playSfx("heal");
      }
    }
    if (!Object.keys(nextFx).length) return;
    setFx(nextFx);
    setPops(nextPops);
    if (crits) {
      setShake(true);
      window.setTimeout(() => setShake(false), 420);
    }
    const t = window.setTimeout(() => {
      setFx({});
      setPops({});
    }, 900);
    return () => window.clearTimeout(t);
  }, [battle]);

  useEffect(() => {
    if (!battle) return;
    if (battle.status !== prevStatus.current) {
      prevStatus.current = battle.status;
      if (battle.status === "won") playSfx("victory");
      else if (battle.status === "lost") playSfx("defeat");
    }
  }, [battle?.status]);

  const introDone = useCallback(() => setIntro(false), []);

  if (!battle || !game) return null;

  const allies = battle.combatants.filter((c) => c.side === "ally");
  const foes = battle.combatants.filter((c) => c.side === "enemy");
  const myTurn = battle.status === "active" && actor?.side === "ally";
  const potions = Object.keys(game.inventory).filter(
    (id) => ITEMS[id]?.kind === "potion" && (game.inventory[id] ?? 0) > 0,
  );
  const backdrop = settings.sceneArt
    ? LOCATION_ART[LOCATIONS[battle.returnTo]?.kind ?? "landmark"]
    : undefined;

  const allyArt = (c: Combatant) => {
    if (!settings.sceneArt) return undefined;
    const unit = game.party.find((u) => u.name === c.name);
    if (unit?.npcId && NPC_ART[unit.npcId]) return NPC_ART[unit.npcId];
    return unitArt({ classId: c.classId, unitId: unit?.id ?? c.id, name: c.name });
  };
  const foeArt = (c: Combatant) =>
    settings.sceneArt ? enemyArt({ name: c.name, classId: c.classId, boss: c.boss }) : undefined;

  const healingSkill = mode?.kind === "skill" && SKILLS[mode.skillId]?.effect.type === "heal";
  const allySelectable = !!mode && (mode.kind === "item" || healingSkill);
  const foeSelectable = !!mode && mode.kind !== "item" && !healingSkill;

  const pickTarget = (id: string) => {
    if (!mode) return;
    if (mode.kind === "attack") act({ kind: "attack", targetId: id });
    else if (mode.kind === "skill") act({ kind: "skill", skillId: mode.skillId, targetId: id });
    else act({ kind: "item", itemId: mode.itemId, targetId: id });
    setMode(null);
    setPanel(null);
  };

  const latestLine = battle.log[0];

  return (
    <div className={`mx-auto w-full max-w-5xl px-3 pb-8 ${shake ? "screen-shake" : ""}`}>
      <BattleIntro title={battle.title} enabled={intro && settings.animations} onDone={introDone} />

      <Panel
        title={battle.title}
        right={
          <span className="pixel-font text-[9px] text-muted-foreground">Round {battle.round}</span>
        }
      >
        {/* ── Arena ─────────────────────────────────────────── */}
        <div className="battle-arena relative overflow-hidden border-2 border-border">
          {backdrop ? (
            <img
              src={backdrop}
              alt=""
              aria-hidden
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover opacity-35 [image-rendering:pixelated]"
            />
          ) : null}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/55 via-background/25 to-background/85" />

          {/* enemies: upper right */}
          <div className="relative flex items-start justify-between gap-2 p-3">
            <div className="w-40 space-y-1 sm:w-52">
              {foes.map((c) => (
                <StatusPlate
                  key={c.id}
                  c={c}
                  align="left"
                  active={actor?.id === c.id && battle.status === "active"}
                />
              ))}
            </div>
            <div className="flex flex-wrap items-end justify-end gap-2">
              {foes.map((c, i) => (
                <Fighter
                  key={c.id}
                  c={c}
                  index={i}
                  side="enemy"
                  art={foeArt(c)}
                  selectable={foeSelectable}
                  targeting={!!mode}
                  onClick={() => pickTarget(c.id)}
                  fx={fx[c.id]}
                  pop={pops[c.id]}
                />
              ))}
            </div>
          </div>

          {/* allies: lower left */}
          <div className="relative mt-2 flex items-end justify-between gap-2 p-3">
            <div className="flex flex-wrap items-end gap-2">
              {allies.map((c, i) => (
                <Fighter
                  key={c.id}
                  c={c}
                  index={i}
                  side="ally"
                  art={allyArt(c)}
                  selectable={allySelectable}
                  targeting={!!mode}
                  onClick={() => pickTarget(c.id)}
                  fx={fx[c.id]}
                  pop={pops[c.id]}
                />
              ))}
            </div>
            <div className="w-40 space-y-1 sm:w-52">
              {allies.map((c) => (
                <StatusPlate
                  key={c.id}
                  c={c}
                  align="right"
                  active={actor?.id === c.id && battle.status === "active"}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ── Turn order ────────────────────────────────────── */}
        <div className="mt-2 flex flex-wrap items-center gap-1">
          <span className="pixel-font mr-1 text-[8px] uppercase text-muted-foreground">
            Turn order
          </span>
          {battle.order.map((id, i) => {
            const c = battle.combatants.find((x) => x.id === id);
            if (!c) return null;
            const now = i === battle.turn && battle.status === "active";
            return (
              <span
                key={`${id}${i}`}
                title={`${c.name} · speed ${c.spd}`}
                className={`pixel-font border px-1 py-0.5 text-[8px] uppercase ${
                  c.hp <= 0
                    ? "border-border text-muted-foreground line-through opacity-50"
                    : now
                      ? "border-primary bg-primary/20 text-primary"
                      : c.side === "ally"
                        ? "border-accent/60 text-accent"
                        : "border-destructive/60 text-destructive"
                }`}
              >
                {now ? "▶ " : ""}
                {c.name}
              </span>
            );
          })}
        </div>

        {/* ── Command box ───────────────────────────────────── */}
        <div className="command-box mt-3 border-2 border-border bg-background/80 p-3">
          {latestLine ? (
            <p className="mb-2 text-lg leading-snug text-foreground">{latestLine}</p>
          ) : null}

          {battle.status === "active" ? (
            myTurn && actor ? (
              <>
                <p className="pixel-font mb-2 text-[10px] text-primary">
                  {actor.name}'s turn{mode ? ": pick a target" : panel ? ": choose" : ""}
                </p>

                {mode ? (
                  <PixelButton size="sm" variant="ghost" sfx="cancel" onClick={() => setMode(null)}>
                    ← Back
                  </PixelButton>
                ) : panel === "skill" ? (
                  <div className="flex flex-wrap gap-1">
                    {actor.skills.map((sid) => {
                      const sk = SKILLS[sid];
                      if (!sk) return null;
                      const canUse = actor.focus >= sk.cost;
                      const selfTarget =
                        sk.effect.type === "heal" ||
                        sk.effect.type === "guard" ||
                        sk.effect.type === "buffAtk" ||
                        sk.effect.type === "focus";
                      return (
                        <PixelButton
                          key={sid}
                          size="sm"
                          variant="accent"
                          disabled={!canUse}
                          title={`${sk.desc}. ${sk.cost} focus${canUse ? "" : " (not enough focus)"}`}
                          onClick={() => {
                            if (selfTarget) {
                              act({ kind: "skill", skillId: sid });
                              setPanel(null);
                            } else {
                              setMode({ kind: "skill", skillId: sid });
                            }
                          }}
                        >
                          {sk.name} · {sk.cost} focus
                        </PixelButton>
                      );
                    })}
                    <PixelButton
                      size="sm"
                      variant="ghost"
                      sfx="cancel"
                      onClick={() => setPanel(null)}
                    >
                      ← Back
                    </PixelButton>
                  </div>
                ) : panel === "item" ? (
                  <div className="flex flex-wrap gap-1">
                    {potions.length ? (
                      potions.map((id) => (
                        <PixelButton
                          key={id}
                          size="sm"
                          variant="ghost"
                          onClick={() => setMode({ kind: "item", itemId: id })}
                        >
                          {ITEMS[id]!.name} ×{game.inventory[id]}
                        </PixelButton>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">Your packs are empty.</span>
                    )}
                    <PixelButton
                      size="sm"
                      variant="ghost"
                      sfx="cancel"
                      onClick={() => setPanel(null)}
                    >
                      ← Back
                    </PixelButton>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 sm:max-w-md">
                    <PixelButton
                      className="justify-center py-3"
                      onClick={() => setMode({ kind: "attack" })}
                    >
                      <Icon name="attack" /> Attack
                    </PixelButton>
                    <PixelButton
                      className="justify-center py-3"
                      variant="ghost"
                      onClick={() => act({ kind: "defend" })}
                    >
                      <Icon name="defend" /> Defend
                    </PixelButton>
                    <PixelButton
                      className="justify-center py-3"
                      variant="accent"
                      disabled={!actor.skills.length}
                      onClick={() => setPanel("skill")}
                    >
                      <Icon name="skill" /> Skill
                    </PixelButton>
                    {battle.canFlee ? (
                      <PixelButton
                        className="justify-center py-3"
                        variant="danger"
                        sfx="cancel"
                        onClick={() => act({ kind: "flee" })}
                      >
                        <Icon name="flee" /> Flee
                      </PixelButton>
                    ) : (
                      <PixelButton
                        className="justify-center py-3"
                        variant="ghost"
                        disabled
                        title="No way out of this one"
                      >
                        <Icon name="flee" /> Flee
                      </PixelButton>
                    )}
                    <PixelButton
                      className="col-span-2 justify-center"
                      size="sm"
                      variant="ghost"
                      onClick={() => setPanel("item")}
                    >
                      <Icon name="item" /> Item{potions.length ? ` (${potions.length})` : ""}
                    </PixelButton>
                  </div>
                )}
              </>
            ) : (
              <p className="pixel-font text-[10px] text-muted-foreground">The enemy moves…</p>
            )
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <p className="pixel-font text-[11px] text-primary">
                {battle.status === "won"
                  ? "Victory."
                  : battle.status === "lost"
                    ? "Defeated."
                    : "You broke away."}
              </p>
              {battle.status === "won" ? (
                <span className="text-sm text-muted-foreground">
                  +{battle.reward.gold} gold, +{battle.reward.xp} xp
                  {battle.reward.loot.length
                    ? `, ${battle.reward.loot.map((l) => ITEMS[l]?.name ?? l).join(", ")}`
                    : ""}
                </span>
              ) : null}
              <PixelButton size="sm" sfx="confirm" onClick={closeBattle}>
                Continue
              </PixelButton>
            </div>
          )}

          <div className="mt-2 border-t border-border pt-2">
            <PixelButton size="sm" variant="ghost" onClick={() => setShowLog((v) => !v)}>
              {showLog ? "Hide field log" : "Field log"}
            </PixelButton>
            {showLog ? (
              <ul className="mt-2 max-h-40 space-y-0.5 overflow-y-auto text-sm text-muted-foreground">
                {battle.log.map((l, i) => (
                  <li key={i} className={i === 0 ? "text-foreground" : undefined}>
                    {l}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </Panel>
    </div>
  );
}
