import { ITEMS, SKILLS, skillsAvailableAt } from "@/game/data";
import { unitArt } from "@/game/art";
import { useSettings } from "@/game/settings";
import { unitStats } from "@/game/engine";
import { equipItem, learnSkill, sellItem, useItemOutOfBattle } from "@/game/state";
import { useGame } from "@/game/store";
import { Bar, Panel, PixelButton, Portrait } from "./ui";

export function PartyPanel() {
  const { game, update } = useGame();
  const { settings } = useSettings();

  if (!game) return null;
  const hero = game.party[0]!;
  const learnable = skillsAvailableAt(hero.level, hero.skills);

  return (
    <div className="space-y-3">
      <Panel title="Company">
        <ul className="space-y-2">
          {game.party.map((u) => {
            const s = unitStats(u);
            return (
              <li key={u.id} className="border border-border bg-background/40 p-2">
                <div className="flex items-center gap-2">
                  <Portrait
                    src={settings.sceneArt ? unitArt({ npcId: u.npcId, classId: u.classId, unitId: u.id, name: u.name }) : undefined}
                    glyph={u.isHero ? game.portrait : "🗡"}
                    alt={u.name}
                    size="h-10 w-10"
                  />
                  <span className="pixel-font flex-1 text-[10px] text-primary">{u.name}</span>
                  <span className="pixel-font text-[9px] text-muted-foreground">Lv {u.level}</span>
                </div>
                <Bar value={u.hp} max={s.maxHp} tone="hp" label={`${u.hp}/${s.maxHp} hp · ⚔${s.atk} 🛡${s.def} 👢${s.spd}`} />

                <div className="mt-1 flex flex-wrap gap-1">
                  {u.skills.map((sid) => (
                    <span key={sid} className="pixel-font border border-border px-1 text-[8px] text-muted-foreground">
                      {SKILLS[sid]?.name}
                    </span>
                  ))}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {u.equipment.weapon ? ITEMS[u.equipment.weapon]?.name : "bare hands"} ·{" "}
                  {u.equipment.armor ? ITEMS[u.equipment.armor]?.name : "no armour"}
                </div>
              </li>
            );
          })}
        </ul>
      </Panel>

      {game.skillPoints > 0 ? (
        <Panel title={`Skill to learn (${game.skillPoints})`}>
          <div className="flex flex-wrap gap-1">
            {learnable.map((sk) => (
              <PixelButton
                key={sk.id}
                size="sm"
                variant="accent"
                title={sk.desc}
                onClick={() => update((g) => learnSkill(g, sk.id))}
              >
                {sk.name} · {sk.category}
              </PixelButton>
            ))}
          </div>
        </Panel>
      ) : null}

      <Panel title="Baggage">
        {Object.keys(game.inventory).length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing but lint.</p>
        ) : (
          <ul className="space-y-1">
            {Object.entries(game.inventory).map(([id, qty]) => {
              const item = ITEMS[id];
              if (!item) return null;
              return (
                <li key={id} className="flex flex-wrap items-center gap-1 border border-border bg-background/40 px-2 py-1">
                  <span className="min-w-0 flex-1 truncate text-sm">
                    {item.name} ×{qty}
                  </span>
                  {item.kind === "weapon" || item.kind === "armor" ? (
                    <PixelButton size="sm" variant="ghost" onClick={() => update((g) => equipItem(g, hero.id, id))}>
                      Equip
                    </PixelButton>
                  ) : null}
                  {item.kind === "potion" ? (
                    <PixelButton size="sm" variant="accent" onClick={() => update((g) => useItemOutOfBattle(g, id, hero.id))}>
                      Use
                    </PixelButton>
                  ) : null}
                  <PixelButton size="sm" variant="danger" onClick={() => update((g) => sellItem(g, id))}>
                    Sell {Math.round(item.price * 0.5)}
                  </PixelButton>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      <Panel title="Chronicle">
        <ul className="max-h-56 space-y-0.5 overflow-y-auto text-sm text-muted-foreground">
          {game.log.slice(0, 25).map((l, i) => (
            <li key={i} className={i === 0 ? "text-foreground" : undefined}>
              {l}
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
