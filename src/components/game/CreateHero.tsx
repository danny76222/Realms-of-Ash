import { useState } from "react";
import { Icon } from "./icons";
import { BACKGROUNDS, CLASSES, PORTRAITS, SKILLS } from "@/game/data";
import { newGame } from "@/game/state";
import { useGame } from "@/game/store";
import type { BackgroundId, ClassId } from "@/game/types";
import { Panel, PixelButton } from "./ui";

const NAMES = ["Rhosyn", "Talvace", "Edric", "Maerin", "Cadoc", "Sable", "Hetty Vane", "Ordo Rell"];

export function CreateHero() {
  const { start, setScreen } = useGame();
  const [name, setName] = useState("");
  const [classId, setClassId] = useState<ClassId>("warrior");
  const [background, setBackground] = useState<BackgroundId>("hedge_knight");
  const [portrait, setPortrait] = useState(PORTRAITS[0]!);

  const cls = CLASSES[classId];
  const bg = BACKGROUNDS[background];
  const stats = {
    maxHp: cls.base.maxHp + (bg.bonus.maxHp ?? 0),
    atk: cls.base.atk + (bg.bonus.atk ?? 0),
    def: cls.base.def + (bg.bonus.def ?? 0),
    spd: cls.base.spd + (bg.bonus.spd ?? 0),
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <h1 className="pixel-font mb-4 text-lg text-primary">Take a Name</h1>
      <div className="grid gap-3 md:grid-cols-2">
        <Panel title="Name & Face">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={NAMES[0]}
            aria-label="Hero name"
            className="w-full border-2 border-border bg-input px-2 py-2 text-base text-foreground outline-none focus:border-primary"
          />
          <div className="mt-2 flex flex-wrap gap-1">
            {PORTRAITS.map((p) => (
              <button
                key={p}
                onClick={() => setPortrait(p)}
                aria-label={`Device ${p.replace("device-", "")}`}
                className={`pixel-btn flex h-10 w-10 items-center justify-center text-lg ${portrait === p ? "bg-primary" : "bg-secondary"}`}
              >
                <Icon name={p} />
              </button>
            ))}
          </div>
          <PixelButton
            size="sm"
            variant="ghost"
            className="mt-2"
            onClick={() => setName(NAMES[Math.floor(Math.random() * NAMES.length)]!)}
          >
            Roll a name
          </PixelButton>
        </Panel>

        <Panel title="Calling">
          <div className="grid grid-cols-2 gap-1">
            {Object.values(CLASSES).map((c) => (
              <button
                key={c.id}
                onClick={() => setClassId(c.id)}
                className={`pixel-btn px-2 py-2 text-left text-sm ${classId === c.id ? "bg-primary text-primary-foreground" : "bg-secondary"}`}
              >
                <Icon name={c.sprite} className="mr-1" />
                <span className="pixel-font text-[10px]">{c.name}</span>
              </button>
            ))}
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{cls.blurb}</p>
          <p className="mt-1 text-sm">
            Starting skill: <span className="text-primary">{SKILLS[cls.startSkill]?.name}</span>.{" "}
            {SKILLS[cls.startSkill]?.desc}
          </p>
        </Panel>

        <Panel title="Where You Come From">
          <div className="grid gap-1">
            {Object.values(BACKGROUNDS).map((b) => (
              <button
                key={b.id}
                onClick={() => setBackground(b.id)}
                className={`pixel-btn px-2 py-1.5 text-left ${background === b.id ? "bg-primary text-primary-foreground" : "bg-secondary"}`}
              >
                <span className="pixel-font text-[10px]">{b.name}</span>
                <span className="block text-sm opacity-80">{b.blurb}</span>
              </button>
            ))}
          </div>
        </Panel>

        <Panel title="Muster Roll">
          <div className="flex items-center gap-3">
            <div className="pixel-frame flex h-16 w-16 items-center justify-center bg-background text-3xl">
              <Icon name={portrait} />
            </div>
            <div>
              <p className="pixel-font text-[11px] text-primary">{name.trim() || "Nameless"}</p>
              <p className="text-sm text-muted-foreground">
                {bg.name} · {cls.name}
              </p>
            </div>
          </div>
          <ul className="mt-3 grid grid-cols-2 gap-1 text-sm">
            <li>
              <Icon name="hp" /> HP {stats.maxHp}
            </li>
            <li>
              <Icon name="atk" /> Attack {stats.atk}
            </li>
            <li>
              <Icon name="def" /> Defence {stats.def}
            </li>
            <li>
              <Icon name="spd" /> Speed {stats.spd}
            </li>
            <li>
              <Icon name="gold" /> Gold {bg.gold}
            </li>
            <li>
              <Icon name="renown" /> Renown {bg.renown}
            </li>
          </ul>
          <div className="mt-3 flex gap-2">
            <PixelButton variant="ghost" onClick={() => setScreen("title")}>
              Back
            </PixelButton>
            <PixelButton
              onClick={() =>
                start(newGame({ heroName: name, heroClass: classId, background, portrait }))
              }
            >
              Ride Out
            </PixelButton>
          </div>
        </Panel>
      </div>
    </div>
  );
}
