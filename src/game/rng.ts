/**
 * Seeded, serialisable pseudo-random number generator.
 *
 * Why not Math.random: it cannot be seeded, so a bug is never reproducible and
 * a campaign never replays. `GameState.seed` already existed and was only used
 * by the weather and the dungeon generator; everything else drew from
 * Math.random, so the same seed produced a different campaign every time.
 *
 * Every random decision in the game rules now comes from here, and the
 * generator's whole state is four integers, so it saves and restores with the
 * rest of the world.
 *
 * Algorithm is sfc32 (small fast counter, 32-bit), seeded through splitmix32 so
 * that adjacent seeds like 1 and 2 produce completely unrelated streams. sfc32
 * passes PractRand and is roughly as fast as Math.random.
 *
 * Ported from the Isles codebase, where it is the foundation the whole
 * simulation and its automated playtest harness stand on.
 */

export interface RngState {
  a: number;
  b: number;
  c: number;
  d: number;
}

export class Rng {
  private a: number;
  private b: number;
  private c: number;
  private d: number;

  constructor(seed: number) {
    // splitmix32 expansion: turns one seed into four well-mixed words.
    let x = seed | 0;
    const next = (): number => {
      x = (x + 0x9e3779b9) | 0;
      let z = x;
      z = Math.imul(z ^ (z >>> 16), 0x21f0aaad);
      z = Math.imul(z ^ (z >>> 15), 0x735a2d97);
      return (z ^ (z >>> 15)) >>> 0;
    };
    this.a = next();
    this.b = next();
    this.c = next();
    this.d = next();
  }

  /** Uniform in [0, 1). */
  next(): number {
    const t = (this.a + this.b) | 0;
    this.a = this.b ^ (this.b >>> 9);
    this.b = (this.c + (this.c << 3)) | 0;
    this.c = (this.c << 21) | (this.c >>> 11);
    this.d = (this.d + 1) | 0;
    const u = (t + this.d) | 0;
    this.c = (this.c + u) | 0;
    return (u >>> 0) / 4294967296;
  }

  /** Uniform float in [min, max). */
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  /** Uniform integer in [min, max] inclusive. */
  int(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }

  /** True with the given probability. */
  chance(p: number): boolean {
    return this.next() < p;
  }

  /** Uniformly picks one element. Throws on an empty list rather than returning undefined. */
  pick<T>(items: readonly T[]): T {
    if (items.length === 0) throw new Error("Rng.pick called with an empty list");
    return items[this.int(0, items.length - 1)]!;
  }

  /**
   * Picks one element with the given weights. Weights need not sum to 1.
   * This is the one the reputation work needs: which house an event lands on
   * should be weighted by the player's standing with it, not picked flat.
   */
  weighted<T>(items: readonly T[], weights: readonly number[]): T {
    if (items.length === 0) throw new Error("Rng.weighted called with an empty list");
    if (items.length !== weights.length) {
      throw new Error(
        `Rng.weighted length mismatch: ${items.length} items, ${weights.length} weights`,
      );
    }
    let total = 0;
    for (const w of weights) {
      if (w < 0) throw new Error("Rng.weighted received a negative weight");
      total += w;
    }
    if (total <= 0) throw new Error("Rng.weighted requires at least one positive weight");

    let roll = this.next() * total;
    for (let i = 0; i < items.length; i++) {
      roll -= weights[i]!;
      if (roll < 0) return items[i]!;
    }
    return items[items.length - 1]!; // float slack
  }

  /** A short opaque id. Replaces the Math.random-based rid. */
  id(): string {
    const n = Math.floor(this.next() * 0xffffffff);
    return n.toString(36).padStart(7, "0").slice(0, 8);
  }

  /** In-place Fisher-Yates. Deterministic given the same state. */
  shuffle<T>(items: T[]): T[] {
    for (let i = items.length - 1; i > 0; i--) {
      const j = this.int(0, i);
      const tmp = items[i]!;
      items[i] = items[j]!;
      items[j] = tmp;
    }
    return items;
  }

  save(): RngState {
    return { a: this.a, b: this.b, c: this.c, d: this.d };
  }

  static restore(state: RngState): Rng {
    const rng = new Rng(0);
    rng.a = state.a;
    rng.b = state.b;
    rng.c = state.c;
    rng.d = state.d;
    return rng;
  }
}

/**
 * Run `fn` against the stream carried by `holder`, and hand back both the
 * result and the advanced stream state. Keeps every caller immutable: nothing
 * here mutates the state it was given.
 *
 *   const [ambush, rng] = draw(state, (r) => r.pick(pool));
 *   return { ...state, rng };
 */
export function draw<T>(holder: { rng: RngState }, fn: (r: Rng) => T): [T, RngState] {
  const r = Rng.restore(holder.rng);
  const value = fn(r);
  return [value, r.save()];
}

/**
 * A stable 32-bit seed from any mix of strings and numbers (FNV-1a).
 *
 * For streams that should be a pure function of what they describe rather than
 * of when they were asked for: a dungeon's layout depends on the place, the
 * campaign seed and the day, so walking back into it the same day finds the
 * same rooms instead of rerolling them.
 */
export function hashSeed(...parts: (string | number)[]): number {
  let h = 0x811c9dc5;
  for (const part of parts) {
    const text = String(part);
    for (let i = 0; i < text.length; i++) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    h ^= 0x2f;
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}
