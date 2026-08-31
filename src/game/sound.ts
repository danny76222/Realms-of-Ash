/** Tiny synthesized UI sound kit (Web Audio, no asset files). */

export type Sfx = "hover" | "click" | "confirm" | "cancel" | "transition" | "hit" | "crit" | "heal" | "victory" | "defeat" | "battleStart";

let ctx: AudioContext | null = null;
let enabled = false;
let volume = 0.5;

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function configureSound(on: boolean, vol: number) {
  enabled = on;
  volume = Math.max(0, Math.min(1, vol));
}

interface Tone {
  freq: number;
  to?: number;
  dur: number;
  type?: OscillatorType;
  gain?: number;
  delay?: number;
}

const KIT: Record<Sfx, Tone[]> = {
  hover: [{ freq: 620, dur: 0.05, type: "triangle", gain: 0.1 }],
  click: [{ freq: 300, to: 190, dur: 0.09, type: "square", gain: 0.16 }],
  confirm: [
    { freq: 420, dur: 0.09, type: "triangle", gain: 0.18 },
    { freq: 640, dur: 0.13, type: "triangle", gain: 0.16, delay: 0.07 },
  ],
  cancel: [{ freq: 260, to: 140, dur: 0.14, type: "sawtooth", gain: 0.14 }],
  transition: [{ freq: 180, to: 420, dur: 0.22, type: "sine", gain: 0.1 }],
  hit: [{ freq: 150, to: 60, dur: 0.12, type: "square", gain: 0.2 }],
  crit: [
    { freq: 220, to: 70, dur: 0.16, type: "sawtooth", gain: 0.24 },
    { freq: 700, to: 300, dur: 0.12, type: "square", gain: 0.14, delay: 0.03 },
  ],
  heal: [
    { freq: 520, dur: 0.1, type: "sine", gain: 0.14 },
    { freq: 780, dur: 0.16, type: "sine", gain: 0.12, delay: 0.08 },
  ],
  victory: [
    { freq: 392, dur: 0.12, type: "triangle", gain: 0.16 },
    { freq: 523, dur: 0.12, type: "triangle", gain: 0.16, delay: 0.11 },
    { freq: 659, dur: 0.24, type: "triangle", gain: 0.16, delay: 0.22 },
  ],
  battleStart: [
    { freq: 110, dur: 0.28, type: "sawtooth", gain: 0.22 },
    { freq: 165, dur: 0.22, type: "square", gain: 0.16, delay: 0.24 },
    { freq: 220, to: 440, dur: 0.5, type: "triangle", gain: 0.2, delay: 0.46 },
  ],
  defeat: [
    { freq: 330, dur: 0.18, type: "sawtooth", gain: 0.14 },
    { freq: 180, to: 90, dur: 0.4, type: "sawtooth", gain: 0.14, delay: 0.16 },
  ],
};

export function playSfx(name: Sfx) {
  if (!enabled) return;
  const ac = audio();
  if (!ac) return;
  const now = ac.currentTime;
  for (const t of KIT[name]) {
    const osc = ac.createOscillator();
    const g = ac.createGain();
    const start = now + (t.delay ?? 0);
    osc.type = t.type ?? "square";
    osc.frequency.setValueAtTime(t.freq, start);
    if (t.to) osc.frequency.exponentialRampToValueAtTime(Math.max(20, t.to), start + t.dur);
    const peak = (t.gain ?? 0.15) * volume;
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), start + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, start + t.dur);
    osc.connect(g).connect(ac.destination);
    osc.start(start);
    osc.stop(start + t.dur + 0.03);
  }
}
