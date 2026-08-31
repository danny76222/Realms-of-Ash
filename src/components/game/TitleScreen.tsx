import { useState } from "react";
import { Icon } from "./icons";
import { useGame } from "@/game/store";
import { localSaves, migrate } from "@/game/saves";
import { ART, GLYPH } from "@/game/art";
import { Panel, PixelButton } from "./ui";
import { SavesPanel } from "./SavesPanel";
import { SettingsPanel } from "./SettingsPanel";

function MenuRow({
  icon,
  label,
  hint,
  variant = "ghost",
  disabled,
  onClick,
}: {
  icon: string;
  label: string;
  hint: string;
  variant?: "default" | "ghost" | "accent";
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <PixelButton
      variant={variant}
      disabled={disabled}
      onClick={onClick}
      className="w-full !normal-case"
    >
      <span className="flex w-full items-center gap-3 text-left">
        <Icon name={icon} className="text-base" />
        <span className="min-w-0 flex-1">
          <span className="pixel-font block text-[10px] uppercase tracking-wide">{label}</span>
          <span className="block font-[var(--font-body)] text-xs normal-case opacity-80">
            {hint}
          </span>
        </span>
      </span>
    </PixelButton>
  );
}

export function TitleScreen() {
  const { setScreen, load } = useGame();
  const [view, setView] = useState<null | "saves" | "settings">(null);
  const latest =
    typeof window !== "undefined"
      ? localSaves().sort((a, b) => b.updated.localeCompare(a.updated))[0]
      : undefined;

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <img
        src={ART.title}
        alt="A dark castle above a burning realm at dusk"
        width={1280}
        height={640}
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-45 [image-rendering:pixelated]"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/70 via-background/60 to-background" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center gap-6 px-4 py-10">
        {/* heraldic banner: the title hangs like cloth in a castle hall */}
        <div className="title-heraldry text-center">
          <p className="heading-font text-[11px] tracking-widest text-muted-foreground">
            A low-fantasy campaign
          </p>
          <h1 className="display-font mt-3 text-4xl leading-tight text-primary drop-shadow-[3px_3px_0_rgba(0,0,0,0.6)] sm:text-6xl">
            Realm of Ash
          </h1>
          <div className="rule-ornate mx-auto mt-4 w-64" />
          <p className="mx-auto mt-5 max-w-xl text-lg italic text-muted-foreground">
            Six houses, one usurper, and a great many people who would simply like the roads to be
            safe again.
          </p>
        </div>

        {view === "saves" ? (
          <SavesPanel current={null} onClose={() => setView(null)} onLoad={(g) => load(g)} />
        ) : view === "settings" ? (
          <SettingsPanel className="w-full max-w-md" onClose={() => setView(null)} />
        ) : (
          <Panel className="w-full max-w-md surface-wood">
            <div className="flex flex-col gap-2">
              <MenuRow
                icon={GLYPH.travel}
                label="Continue"
                variant={latest ? "default" : "ghost"}
                disabled={!latest}
                hint={latest ? `${latest.heroName}, day ${latest.day}` : "No saved campaign yet"}
                onClick={() => {
                  if (!latest) return;
                  const g = migrate(latest.state);
                  if (g) load(g);
                }}
              />
              <MenuRow
                icon={GLYPH.menu}
                label="New Game"
                variant={latest ? "ghost" : "default"}
                hint="Name a hero, pick a class, ride out"
                onClick={() => setScreen("create")}
              />
              <MenuRow
                icon={GLYPH.save}
                label="Load Game"
                hint="Choose from your save slots"
                onClick={() => setView("saves")}
              />
              <MenuRow
                icon="lore"
                label="World Lore"
                hint="Read the realm's history before you ride"
                onClick={() => setScreen("lore")}
              />
              <MenuRow
                icon={GLYPH.settings}
                label="Settings"
                hint="Display, text and audio options"
                onClick={() => setView("settings")}
              />
              <div className="rule-ornate my-1" />
              <a
                href="/auth"
                className="heading-font text-center text-[10px] text-muted-foreground underline"
              >
                Sign in for cloud saves
              </a>
            </div>
          </Panel>
        )}
      </div>
    </div>
  );
}
