/** Procedural low-key medieval soundtrack + ambience (Web Audio, no asset files). */

type Mood = "travel" | "battle" | "quiet";

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let timer: number | null = null;
let enabled = false;
let baseVolume = 0.35;
let mood: Mood = "quiet";
let step = 0;

// A dorian-flavoured mode, pleasant and vaguely medieval.
const SCALE = [0, 2, 3, 5, 7, 9, 10, 12];
const ROOT = 196; // G3

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function note(freq: number, dur: number, gain: number, type: OscillatorType = "triangle", delay = 0) {
  const ac = ctx;
  if (!ac || !master) return;
  const t = ac.currentTime + delay;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(master);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

function pitch(degree: number, octave = 0) {
  const s = SCALE[((degree % SCALE.length) + SCALE.length) % SCALE.length]!;
  return ROOT * Math.pow(2, (s + octave * 12) / 12);
}

/** One bar of plucked lute + drone, plus soft ambience. */
function tick() {
  if (!ctx || !enabled) return;
  const bar = step % 8;

  // Drone every other bar: open fifth, like a hurdy-gurdy.
  if (bar % 4 === 0) {
    note(ROOT / 2, 3.4, 0.05, "sawtooth");
    note((ROOT / 2) * Math.pow(2, 7 / 12), 3.4, 0.035, "sawtooth");
  }

  const phrase = [0, 4, 2, 5, 3, 6, 4, 1];
  const d = phrase[bar]!;
  note(pitch(d, 1), 0.7, 0.075, "triangle");
  note(pitch(d + 2, 1), 0.55, 0.04, "triangle", 0.42);
  if (bar % 2 === 1) note(pitch(d - 1, 0), 0.5, 0.03, "sine", 0.21);

  // Ambience: distant wind / crickets while travelling.
  if (mood === "travel" && bar % 4 === 2) {
    note(1100 + Math.random() * 400, 0.12, 0.012, "sine", 0.3);
    note(90 + Math.random() * 30, 1.6, 0.02, "sine", 0.1);
  }

  step++;
}

function fade(to: number, seconds: number) {
  if (!ctx || !master) return;
  const t = ctx.currentTime;
  master.gain.cancelScheduledValues(t);
  master.gain.setValueAtTime(Math.max(0.0001, master.gain.value), t);
  master.gain.linearRampToValueAtTime(Math.max(0.0001, to), t + seconds);
}

function ensureLoop() {
  if (timer !== null) return;
  tick();
  timer = window.setInterval(tick, 1700);
}

function stopLoop() {
  if (timer !== null) {
    window.clearInterval(timer);
    timer = null;
  }
}

export function configureMusic(on: boolean, vol: number) {
  enabled = on;
  baseVolume = Math.max(0, Math.min(1, vol));
  if (!on) {
    fade(0, 0.6);
    window.setTimeout(stopLoop, 700);
    return;
  }
  if (!audio()) return;
  ensureLoop();
  setMood(mood);
}

/** Travel plays at full level; combat ducks the score; quiet screens sit between. */
export function setMood(next: Mood) {
  mood = next;
  if (!enabled) return;
  if (!audio()) return;
  ensureLoop();
  const level = next === "battle" ? baseVolume * 0.12 : next === "travel" ? baseVolume * 0.5 : baseVolume * 0.3;
  fade(level, next === "battle" ? 1.2 : 2);
}

export function stopMusic() {
  fade(0, 0.5);
  window.setTimeout(stopLoop, 600);
}
