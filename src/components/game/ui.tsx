import { useEffect, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Icon } from "./icons";
import { cn } from "@/lib/utils";
import { playSfx, type Sfx } from "@/game/sound";
import { speakLine, stopSpeech, stripForSpeech, voiceSupported } from "@/game/voice";
import { voiceOf } from "@/game/characters";
import { useSettings } from "@/game/settings";

export function Panel({
  title,
  children,
  className,
  right,
}: {
  title?: ReactNode;
  children: ReactNode;
  className?: string;
  right?: ReactNode;
}) {
  return (
    <section
      className={cn(
        "ornate surface-parchment screen-in bg-card/85 p-3 backdrop-blur-[1px]",
        className,
      )}
    >
      {title ? (
        <header className="mb-2 flex items-center justify-between gap-2 border-b border-border pb-1">
          <h2 className="heading-font text-sm text-primary">{title}</h2>
          {right}
        </header>
      ) : null}
      {children}
    </section>
  );
}

export function SceneArt({
  src,
  alt,
  className,
  height = "h-32 sm:h-40",
  filter,
  tint,
  bannerColor,
  weather,
}: {
  src: string;
  alt: string;
  className?: string;
  height?: string;
  /** Per-place light shift, so two villages never look identical. */
  filter?: string;
  /** Day-phase grading class, e.g. "tint-dusk". */
  tint?: string;
  /** Heraldic colour flown along the top of the frame. */
  bannerColor?: string;
  /** Falling weather overlay: "rain" | "storm" | "snow" | "fog". */
  weather?: string;
}) {
  return (
    <div
      className={cn(
        "art-frame art-in banner-vignette relative w-full overflow-hidden",
        height,
        tint,
        className,
      )}
      key={src}
    >
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className="h-full w-full object-cover"
        style={filter ? { filter } : undefined}
      />
      {bannerColor ? (
        <span
          aria-hidden
          className="banner-strip absolute inset-x-0 top-0 z-[1]"
          style={{ ["--banner-color" as string]: bannerColor }}
        />
      ) : null}
      {weather && weather !== "none" ? (
        <span aria-hidden className={`wx wx-${weather} pointer-events-none absolute inset-0`} />
      ) : null}
      <div className="art-grain pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/85 via-transparent to-background/30" />
    </div>
  );
}

export function Portrait({
  src,
  glyph,
  alt,
  size = "h-14 w-14",
  className,
  mood,
}: {
  src?: string | undefined;
  glyph: string;
  alt: string;
  size?: string;
  className?: string;
  /** Colour grading that stands in for expression: hostile, cold, warm, devoted. */
  mood?: string;
}) {
  return (
    <span
      className={cn(
        "ornate surface-stone flex shrink-0 items-center justify-center overflow-hidden bg-background",
        size,
        mood ? `mood-${mood}` : null,
        className,
      )}
    >
      {src ? (
        <img
          key={src}
          src={src}
          alt={alt}
          loading="lazy"
          className="portrait-fade h-full w-full object-cover"
        />
      ) : (
        <Icon name={glyph} className="text-xl opacity-70" />
      )}
    </span>
  );
}

export function PixelButton({
  className,
  variant = "default",
  size = "md",
  sfx = "click",
  onClick,
  onMouseEnter,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "ghost" | "danger" | "accent";
  size?: "sm" | "md";
  sfx?: Sfx;
}) {
  return (
    <button
      {...props}
      onMouseEnter={(e) => {
        if (!props.disabled) playSfx("hover");
        onMouseEnter?.(e);
      }}
      onClick={(e) => {
        playSfx(sfx);
        onClick?.(e);
      }}
      className={cn(
        "pixel-btn pixel-font uppercase tracking-wide disabled:cursor-not-allowed disabled:opacity-40",
        size === "sm" ? "px-2 py-1 text-[9px]" : "px-3 py-2 text-[10px]",
        variant === "default" && "bg-primary text-primary-foreground hover:brightness-110",
        variant === "ghost" && "bg-secondary text-secondary-foreground hover:bg-muted",
        variant === "accent" && "bg-accent text-accent-foreground hover:brightness-110",
        variant === "danger" && "bg-destructive text-destructive-foreground hover:brightness-110",
        className,
      )}
    />
  );
}

export function Bar({
  value,
  max,
  tone = "hp",
  label,
}: {
  value: number;
  max: number;
  tone?: "hp" | "focus" | "xp" | "rep";
  label?: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / Math.max(1, max)) * 100));
  const color =
    tone === "hp"
      ? "bg-destructive"
      : tone === "focus"
        ? "bg-primary"
        : tone === "xp"
          ? "bg-accent"
          : "bg-muted-foreground";
  return (
    <div className="w-full">
      <div className="hp-bar h-2 w-full border border-border bg-background">
        <div
          className={cn("h-full transition-[width] duration-300", color)}
          style={{ width: `${pct}%` }}
        />
      </div>
      {label ? (
        <div className="pixel-font mt-0.5 text-[8px] text-muted-foreground">{label}</div>
      ) : null}
    </div>
  );
}

export function Stat({ icon, value, title }: { icon: string; value: ReactNode; title?: string }) {
  return (
    <span
      title={title}
      className="pixel-font inline-flex items-center gap-1 text-[10px] text-foreground"
    >
      <Icon name={icon} />
      {value}
    </span>
  );
}

export function Divider() {
  return <div className="my-2 h-px w-full bg-border" />;
}

/** Typewriter subtitle reveal. Click anywhere on it to skip to the full text. */
export function Typewriter({
  text,
  className,
  enabled = true,
  speed = 18,
  onDone,
}: {
  text: string;
  className?: string;
  enabled?: boolean;
  speed?: number;
  onDone?: () => void;
}) {
  const [shown, setShown] = useState(enabled ? "" : text);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    if (!enabled) {
      setShown(text);
      doneRef.current?.();
      return;
    }
    setShown("");
    let i = 0;
    const id = window.setInterval(() => {
      i += 2;
      if (i >= text.length) {
        window.clearInterval(id);
        setShown(text);
        doneRef.current?.();
      } else {
        setShown(text.slice(0, i));
      }
    }, speed);
    return () => window.clearInterval(id);
  }, [text, enabled, speed]);

  const complete = shown.length >= text.length;
  return (
    <p
      className={cn("whitespace-pre-wrap", className)}
      onClick={() => {
        if (!complete) {
          setShown(text);
          doneRef.current?.();
        }
      }}
    >
      {shown}
      {complete ? null : <span className="caret" aria-hidden />}
    </p>
  );
}

/**
 * Speaks a line with the active speech provider and reports how far the
 * voice has got, so subtitles can highlight in sync. Silent no-op when voice
 * is off or unsupported. The written line is always the source of truth.
 */
function useSpokenLine(text: string, voiceId: string | undefined, active: boolean) {
  const [spokenChars, setSpokenChars] = useState(0);
  const [speaking, setSpeaking] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setSpokenChars(0);
    setFailed(false);
    if (!active || !text) return;
    const clean = stripForSpeech(text);
    const scale = clean.length ? text.length / clean.length : 1;
    const started = speakLine(clean, voiceOf(voiceId, text), {
      onStart: () => setSpeaking(true),
      onProgress: (i) => setSpokenChars(Math.round(i * scale)),
      onEnd: () => {
        setSpeaking(false);
        setSpokenChars(text.length);
      },
      onError: () => {
        setSpeaking(false);
        setFailed(true);
      },
    });
    if (!started) return;
    return () => {
      stopSpeech();
      setSpeaking(false);
    };
  }, [text, voiceId, active]);

  return { spokenChars, speaking, failed };
}

/** Consistent dialogue frame used by story beats, NPC talk, weddings and endings. */
export function DialogueBox({
  speaker,
  portrait,
  glyph = "device-1",
  text,
  typewriter = true,
  voiceId,
  mood,
  children,
  className,
}: {
  speaker?: string;
  portrait?: string | undefined;
  glyph?: string;
  text: string;
  typewriter?: boolean;
  /** Disposition-driven expression grading for the portrait. */
  mood?: string;
  /** NPC id used to pick a distinct voice profile. */
  voiceId?: string | undefined;
  children?: ReactNode;
  className?: string;
}) {
  const { settings, set } = useSettings();
  const [supported, setSupported] = useState(true);
  useEffect(() => setSupported(voiceSupported()), []);
  const voiceOn = settings.voice && supported;
  const { spokenChars, speaking, failed } = useSpokenLine(text, voiceId, voiceOn);

  return (
    <div
      className={cn(
        "dialogue-box relative flex gap-3 border border-border bg-background/70 p-3",
        className,
      )}
    >
      {speaker ? (
        <Portrait
          src={portrait}
          glyph={glyph}
          alt={speaker}
          size="h-16 w-16"
          {...(mood ? { mood } : {})}
        />
      ) : null}
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-start gap-2">
          {speaker ? (
            <p className="heading-font flex-1 text-sm text-primary">{speaker}</p>
          ) : (
            <span className="flex-1" />
          )}
          {supported ? (
            <button
              type="button"
              onClick={() => set({ voice: !settings.voice })}
              aria-pressed={settings.voice}
              title={settings.voice ? "Mute spoken dialogue" : "Speak dialogue aloud"}
              className="pixel-font border border-border px-1 py-0.5 text-[8px] uppercase text-muted-foreground hover:border-primary hover:text-primary"
            >
              <>
                <Icon name={settings.voice ? "voice-on" : "voice-off"} />{" "}
                {settings.voice ? (speaking ? "speaking" : "voice") : "voice"}
              </>
            </button>
          ) : null}
        </div>
        <Typewriter
          text={text}
          enabled={typewriter}
          className="text-lg leading-relaxed text-foreground"
        />
        {voiceOn ? (
          <p className="subtitle-band mt-2 border-t border-border pt-1 text-sm">
            <span className="text-primary">{text.slice(0, spokenChars)}</span>
            <span className="text-muted-foreground">{text.slice(spokenChars)}</span>
            {failed ? (
              <span className="pixel-font ml-2 text-[8px] uppercase text-muted-foreground">
                voice unavailable, text only
              </span>
            ) : null}
          </p>
        ) : null}
        {children}
      </div>
    </div>
  );
}

/** Labelled meter with named tiers, used for courtship regard. */
export function Meter({
  value,
  max = 100,
  label,
  tone = "accent",
}: {
  value: number;
  max?: number;
  label?: string;
  tone?: "accent" | "hp";
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="w-full">
      <div className="hp-bar h-2.5 w-full border border-border bg-background">
        <div
          className={cn(
            "h-full transition-[width] duration-500",
            tone === "accent" ? "bg-accent" : "bg-destructive",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      {label ? (
        <div className="pixel-font mt-0.5 text-[8px] text-muted-foreground">{label}</div>
      ) : null}
    </div>
  );
}
