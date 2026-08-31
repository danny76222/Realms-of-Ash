import { useEffect, useState } from "react";
import { playSfx } from "@/game/sound";

/**
 * Pokémon-style encounter wipe: torch flare, pixel shutters closing over the
 * screen, then the encounter title stamps in before the arena fades up.
 */
export function BattleIntro({ title, enabled, onDone }: { title: string; enabled: boolean; onDone: () => void }) {
  const [gone, setGone] = useState(false);

  useEffect(() => {
    if (!enabled) {
      onDone();
      return;
    }
    playSfx("battleStart");
    const t = window.setTimeout(() => {
      setGone(true);
      onDone();
    }, 1150);
    return () => window.clearTimeout(t);
  }, [enabled, onDone]);

  if (!enabled || gone) return null;

  return (
    <div
      className="battle-intro fixed inset-0 z-50 flex items-center justify-center"
      role="presentation"
      onClick={() => {
        setGone(true);
        onDone();
      }}
    >
      <div className="battle-intro-flare absolute inset-0" />
      <div className="battle-intro-bars absolute inset-0">
        {Array.from({ length: 8 }).map((_, i) => (
          <span key={i} style={{ animationDelay: `${i * 45}ms` }} />
        ))}
      </div>
      <p className="battle-intro-title display-font relative px-6 text-center text-2xl text-primary drop-shadow-[3px_3px_0_rgba(0,0,0,0.7)] sm:text-4xl">
        {title}
      </p>
    </div>
  );
}
