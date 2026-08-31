import { useSettings } from "@/game/settings";
import type { Settings } from "@/game/settings";
import { Panel, PixelButton } from "./ui";

type Row = { key: keyof Settings; label: string; hint: string };

const GROUPS: { title: string; rows: Row[] }[] = [
  {
    title: "Display",
    rows: [
      { key: "animations", label: "Screen transitions", hint: "Fades, wipes and battle intros." },
      { key: "scanlines", label: "CRT scanlines", hint: "Old-screen overlay across everything." },
      { key: "bigText", label: "Larger text", hint: "Increases body text size." },
      { key: "sceneArt", label: "Scene & banner art", hint: "Painted portraits and location banners." },
    ],
  },
  {
    title: "Text",
    rows: [
      { key: "typewriter", label: "Typewriter dialogue", hint: "Reveal speech letter by letter." },
      { key: "voice", label: "Spoken dialogue", hint: "Reads lines aloud with your browser's voices. Subtitles stay on." },
    ],
  },
  {
    title: "Audio",
    rows: [
      { key: "sound", label: "UI sound effects", hint: "Clicks, confirmations and combat hits." },
      { key: "music", label: "Ambient soundtrack", hint: "Low lute score while you travel." },
    ],
  },
];

/** One settings panel used by both the title screen and the pause menu. */
export function SettingsPanel({ onClose, className = "" }: { onClose: () => void; className?: string }) {
  const { settings, set } = useSettings();
  const audioOff = !settings.sound && !settings.music;

  return (
    <Panel
      title="Settings"
      className={className}
      right={
        <PixelButton size="sm" variant="ghost" sfx="cancel" onClick={onClose}>
          Close
        </PixelButton>
      }
    >
      <div className="space-y-3">
        {GROUPS.map((group) => (
          <section key={group.title}>
            <h3 className="heading-font mb-1 text-[10px] text-muted-foreground">{group.title}</h3>
            <ul className="space-y-1.5">
              {group.rows.map((row) => {
                const on = Boolean(settings[row.key]);
                return (
                  <li key={row.key} className="flex items-center gap-3 border border-border bg-background/40 px-2 py-1.5">
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm text-foreground">{row.label}</span>
                      <span className="block text-xs text-muted-foreground">{row.hint}</span>
                    </span>
                    <PixelButton
                      size="sm"
                      variant={on ? "accent" : "ghost"}
                      aria-pressed={on}
                      onClick={() => set({ [row.key]: !on })}
                    >
                      {on ? "On" : "Off"}
                    </PixelButton>
                  </li>
                );
              })}
              {group.title === "Text" ? (
                <li className="flex items-center gap-3 border border-border bg-background/40 px-2 py-1.5">
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm text-foreground">Voice speed</span>
                    <span className="block text-xs text-muted-foreground">
                      {settings.voice ? `${settings.voiceRate.toFixed(2)}x speaking rate` : "Turn on spoken dialogue first."}
                    </span>
                  </span>
                  <input
                    type="range"
                    min={60}
                    max={140}
                    disabled={!settings.voice}
                    value={Math.round(settings.voiceRate * 100)}
                    onChange={(e) => set({ voiceRate: Number(e.target.value) / 100 })}
                    className="w-32 accent-[var(--primary)] disabled:opacity-40"
                    aria-label="Voice speed"
                  />
                </li>
              ) : null}
              {group.title === "Text" ? (
                <li className="flex items-center gap-3 border border-border bg-background/40 px-2 py-1.5">
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm text-foreground">Voice quality</span>
                    <span className="block text-xs text-muted-foreground">
                      {settings.voiceEngine === "studio"
                        ? "Natural studio voices, the same in every browser."
                        : "Your browser's built-in speech engine. Free, but rough."}
                    </span>
                  </span>
                  <PixelButton
                    size="sm"
                    variant={settings.voiceEngine === "studio" ? "accent" : "ghost"}
                    disabled={!settings.voice}
                    onClick={() => set({ voiceEngine: settings.voiceEngine === "studio" ? "browser" : "studio" })}
                  >
                    {settings.voiceEngine === "studio" ? "Studio" : "Browser"}
                  </PixelButton>
                </li>
              ) : null}
              {group.title === "Audio" ? (
                <li className="flex items-center gap-3 border border-border bg-background/40 px-2 py-1.5">
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm text-foreground">Volume</span>
                    <span className="block text-xs text-muted-foreground">
                      {audioOff ? "Turn on sound or music first." : `${Math.round(settings.volume * 100)}%`}
                    </span>
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    disabled={audioOff}
                    value={Math.round(settings.volume * 100)}
                    onChange={(e) => set({ volume: Number(e.target.value) / 100 })}
                    className="w-32 accent-[var(--primary)] disabled:opacity-40"
                    aria-label="Volume"
                  />
                </li>
              ) : null}
            </ul>
          </section>
        ))}
      </div>
    </Panel>
  );
}
