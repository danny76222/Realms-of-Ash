import { CLASSES, ITEMS, SKILLS } from "./data";
import { ENEMIES } from "./enemies";
import type { Battle, ClassId, Combatant, GameState, Skill, Unit, UnitStats } from "./types";

export const SAVE_VERSION = 4;

export const rid = () => Math.random().toString(36).slice(2, 10);
export const rnd = (min: number, max: number) => min + Math.random() * (max - min);
export const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]!;

export function xpForLevel(level: number): number {
  return Math.round(60 * Math.pow(level, 1.45));
}

export function unitStats(unit: Unit): UnitStats {
  const cls = CLASSES[unit.classId];
  const lv = unit.level - 1;
  const stats: UnitStats = {
    maxHp: unit.base.maxHp + cls.growth.maxHp * lv,
    atk: unit.base.atk + cls.growth.atk * lv,
    def: unit.base.def + cls.growth.def * lv,
    spd: unit.base.spd + cls.growth.spd * lv,
  };
  for (const slot of [unit.equipment.weapon, unit.equipment.armor]) {
    if (!slot) continue;
    const item = ITEMS[slot];
    if (!item) continue;
    stats.atk += item.atk ?? 0;
    stats.def += item.def ?? 0;
    stats.spd += item.spd ?? 0;
    stats.maxHp += item.hp ?? 0;
  }
  stats.spd = Math.max(1, stats.spd);
  return stats;
}

export function makeUnit(name: string, classId: ClassId, level = 1, isHero = false): Unit {
  const cls = CLASSES[classId];
  const unit: Unit = {
    id: rid(),
    name,
    classId,
    level,
    xp: 0,
    hp: 1,
    base: { ...cls.base },
    equipment: { weapon: null, armor: null },
    skills: [cls.startSkill],
    isHero,
  };
  unit.hp = unitStats(unit).maxHp;
  return unit;
}

export function partyPower(state: GameState): number {
  return Math.max(1, Math.round(state.party.reduce((n, u) => n + u.level, 0) / state.party.length));
}

/* ---------------- combatants ---------------- */

const blankFx = () => ({ atkMod: 0, defMod: 0, stunned: false });

function toCombatant(unit: Unit): Combatant {
  const s = unitStats(unit);
  return {
    id: unit.id,
    name: unit.name,
    side: "ally",
    classId: unit.classId,
    hp: Math.max(1, Math.min(unit.hp, s.maxHp)),
    maxHp: s.maxHp,
    atk: s.atk,
    def: s.def,
    spd: s.spd,
    focus: 2,
    maxFocus: 6,
    defending: false,
    guard: 0,
    fx: blankFx(),
    sprite: CLASSES[unit.classId].sprite,
    skills: unit.skills,
  };
}

export function enemyCombatant(templateId: string, level: number, index: number): Combatant {
  const t = ENEMIES[templateId]!;
  const scale = (t.boss ? 1.05 : 1) * (1 + Math.max(0, level - 1) * 0.1);
  return {
    id: `e_${templateId}_${index}_${rid()}`,
    name: t.name,
    side: "enemy",
    classId: t.classId,
    hp: Math.round(t.base.maxHp * scale),
    maxHp: Math.round(t.base.maxHp * scale),
    atk: Math.round(t.base.atk * scale),
    def: Math.round(t.base.def * scale),
    spd: t.base.spd,
    focus: t.boss ? 3 : 1,
    maxFocus: 6,
    defending: false,
    guard: 0,
    fx: blankFx(),
    sprite: t.sprite,
    skills: t.skills ?? [],
    ...(t.boss ? { boss: true } : {}),
  };
}

function buildOrder(combatants: Combatant[]): string[] {
  return [...combatants]
    .sort((a, b) => b.spd - a.spd || (a.side === "ally" ? -1 : 1))
    .map((c) => c.id);
}

export function createBattle(opts: {
  state: GameState;
  title: string;
  enemyIds: string[];
  returnTo: string;
  tag?: string | null;
  canFlee?: boolean;
  bonusGold?: number;
  loot?: string[];
  levelOverride?: number;
}): Battle {
  const level = opts.levelOverride ?? partyPower(opts.state);
  const allies = opts.state.party.map(toCombatant);
  const enemies = opts.enemyIds.map((id, i) => enemyCombatant(id, level, i));
  const combatants = [...allies, ...enemies];
  const reward = opts.enemyIds.reduce(
    (acc, id) => {
      const t = ENEMIES[id]!;
      acc.gold += Math.round(t.gold * rnd(0.85, 1.2));
      acc.xp += t.xp;
      if (t.loot && Math.random() < 0.4) acc.loot.push(pick(t.loot));
      return acc;
    },
    { gold: opts.bonusGold ?? 0, xp: 0, loot: [...(opts.loot ?? [])] as string[] },
  );
  const boss = enemies.find((e) => e.boss);
  const bossLine = boss ? ENEMIES[opts.enemyIds.find((id) => ENEMIES[id]?.boss) ?? ""]?.taunt : null;
  return {
    title: opts.title,
    combatants,
    order: buildOrder(combatants),
    turn: 0,
    round: 1,
    log: bossLine ? [bossLine, `${opts.title} — the line forms.`] : [`${opts.title} — the line forms.`],
    status: "active",
    reward,
    returnTo: opts.returnTo,
    tag: opts.tag ?? null,
    canFlee: opts.canFlee ?? true,
  };
}

/* ---------------- turn resolution ---------------- */

const alive = (c: Combatant) => c.hp > 0;

export function activeCombatant(b: Battle): Combatant | null {
  const id = b.order[b.turn % b.order.length];
  return b.combatants.find((c) => c.id === id) ?? null;
}

function eff(c: Combatant) {
  return { atk: Math.max(1, c.atk + c.fx.atkMod), def: Math.max(0, c.def + c.fx.defMod) };
}

function damage(att: Combatant, def: Combatant, mult: number, pierce = false): number {
  const armour = pierce ? 0 : eff(def).def * (def.defending ? 1.6 : 0.8);
  const raw = eff(att).atk * mult * rnd(0.88, 1.14) - armour;
  return Math.max(1, Math.round(raw));
}

function checkEnd(b: Battle): Battle {
  const allies = b.combatants.filter((c) => c.side === "ally");
  const foes = b.combatants.filter((c) => c.side === "enemy");
  if (!foes.some(alive)) return { ...b, status: "won", log: ["The field is yours.", ...b.log] };
  if (!allies.some(alive)) return { ...b, status: "lost", log: ["Your banner falls.", ...b.log] };
  return b;
}

function advance(b: Battle): Battle {
  if (b.status !== "active") return b;
  let turn = b.turn;
  let round = b.round;
  let combatants = b.combatants;
  for (let i = 0; i < 60; i++) {
    turn += 1;
    if (turn % b.order.length === 0) round += 1;
    const id = b.order[turn % b.order.length];
    const c = combatants.find((x) => x.id === id);
    if (!c || !alive(c)) continue;
    if (c.fx.stunned) {
      combatants = combatants.map((x) => (x.id === c.id ? { ...x, fx: { ...x.fx, stunned: false } } : x));
      continue;
    }
    break;
  }
  const activeId = b.order[turn % b.order.length];
  combatants = combatants.map((c) =>
    c.id === activeId ? { ...c, defending: false, focus: Math.min(c.maxFocus, c.focus + 1) } : c,
  );
  return { ...b, turn, round, combatants };
}

function withLog(b: Battle, ...lines: string[]): Battle {
  return { ...b, log: [...lines, ...b.log].slice(0, 40) };
}

function applyDamage(b: Battle, targetId: string, amount: number): Battle {
  return {
    ...b,
    combatants: b.combatants.map((c) => {
      if (c.id !== targetId) return c;
      const absorbed = Math.min(c.guard, amount);
      return { ...c, guard: c.guard - absorbed, hp: Math.max(0, c.hp - (amount - absorbed)) };
    }),
  };
}

function healCombatant(b: Battle, id: string, amount: number): Battle {
  return {
    ...b,
    combatants: b.combatants.map((c) => (c.id === id ? { ...c, hp: Math.min(c.maxHp, c.hp + amount) } : c)),
  };
}

export type PlayerAction =
  | { kind: "attack"; targetId: string }
  | { kind: "defend" }
  | { kind: "skill"; skillId: string; targetId?: string }
  | { kind: "item"; itemId: string; targetId: string }
  | { kind: "flee" };

export function takeTurn(battle: Battle, action: PlayerAction): { battle: Battle; usedItem?: string | undefined } {
  let b = battle;
  const actor = activeCombatant(b);
  if (!actor || b.status !== "active") return { battle: b };
  let usedItem: string | undefined;

  if (action.kind === "attack") {
    const target = b.combatants.find((c) => c.id === action.targetId);
    if (!target || !alive(target)) return { battle: b };
    const dmg = damage(actor, target, 1);
    b = applyDamage(b, target.id, dmg);
    b = withLog(b, `${actor.name} strikes ${target.name} for ${dmg}.`);
  } else if (action.kind === "defend") {
    b = {
      ...b,
      combatants: b.combatants.map((c) =>
        c.id === actor.id ? { ...c, defending: true, focus: Math.min(c.maxFocus, c.focus + 2) } : c,
      ),
    };
    b = withLog(b, `${actor.name} raises guard.`);
  } else if (action.kind === "skill") {
    const skill = SKILLS[action.skillId];
    if (!skill || !actor.skills.includes(skill.id)) return { battle: b };
    if (actor.focus < skill.cost) return { battle: withLog(b, `${actor.name} lacks focus.`) };
    b = { ...b, combatants: b.combatants.map((c) => (c.id === actor.id ? { ...c, focus: c.focus - skill.cost } : c)) };
    b = resolveSkill(b, actor, skill, action.targetId);
  } else if (action.kind === "item") {
    const item = ITEMS[action.itemId];
    const target = b.combatants.find((c) => c.id === action.targetId);
    if (!item || !target) return { battle: b };
    const heal = item.hp ?? 0;
    b = healCombatant(b, target.id, heal);
    b = withLog(b, `${actor.name} uses ${item.name} on ${target.name} (+${heal} HP).`);
    usedItem = item.id;
  } else if (action.kind === "flee") {
    if (!b.canFlee) return { battle: withLog(b, "There is no way out of this one.") };
    const fastest = Math.max(...b.combatants.filter((c) => c.side === "enemy" && alive(c)).map((c) => c.spd));
    const chance = Math.min(0.9, 0.35 + (actor.spd - fastest) * 0.06);
    if (Math.random() < chance) return { battle: { ...b, status: "fled", log: ["You break away.", ...b.log] } };
    b = withLog(b, `${actor.name} fails to break away.`);
  }

  b = checkEnd(b);
  if (b.status !== "active") return { battle: b, usedItem };
  b = advance(b);
  b = runEnemyTurns(b);
  return { battle: b, usedItem };
}

function resolveSkill(b: Battle, actor: Combatant, skill: Skill, targetId?: string): Battle {
  const enemySide = actor.side === "ally" ? "enemy" : "ally";
  const foes = b.combatants.filter((c) => c.side === enemySide && alive(c));
  const friends = b.combatants.filter((c) => c.side === actor.side && alive(c));
  const target = b.combatants.find((c) => c.id === targetId && alive(c)) ?? foes[0];
  const fx = skill.effect;
  const tag = `${actor.name} — ${skill.name}!`;

  switch (fx.type) {
    case "strike": {
      if (!target) return b;
      const d = damage(actor, target, fx.mult, fx.pierce);
      return withLog(applyDamage(b, target.id, d), `${tag} ${target.name} takes ${d}.`);
    }
    case "stun": {
      if (!target) return b;
      const d = damage(actor, target, fx.mult);
      let nb = applyDamage(b, target.id, d);
      nb = {
        ...nb,
        combatants: nb.combatants.map((c) =>
          c.id === target.id ? { ...c, fx: { ...c.fx, stunned: true } } : c.id === actor.id ? { ...c, defending: true } : c,
        ),
      };
      return withLog(nb, `${tag} ${target.name} takes ${d} and reels.`);
    }
    case "cleave": {
      let nb = b;
      let total = 0;
      for (const f of foes) {
        const d = damage(actor, f, fx.mult);
        total += d;
        nb = applyDamage(nb, f.id, d);
      }
      return withLog(nb, `${tag} ${total} damage across the line.`);
    }
    case "drain": {
      if (!target) return b;
      const d = damage(actor, target, fx.mult);
      let nb = applyDamage(b, target.id, d);
      const heal = Math.round(d / 2);
      nb = healCombatant(nb, actor.id, heal);
      return withLog(nb, `${tag} ${d} damage, ${actor.name} recovers ${heal}.`);
    }
    case "heal": {
      const wounded = [...friends].sort((a, x) => a.hp / a.maxHp - x.hp / x.maxHp)[0];
      if (!wounded) return b;
      const heal = Math.round(wounded.maxHp * fx.pct);
      return withLog(healCombatant(b, wounded.id, heal), `${tag} ${wounded.name} recovers ${heal} HP.`);
    }
    case "guard": {
      return withLog(
        { ...b, combatants: b.combatants.map((c) => (c.id === actor.id ? { ...c, guard: c.guard + fx.reduce } : c)) },
        `${tag} ${actor.name} braces behind ${fx.reduce} points of guard.`,
      );
    }
    case "buffAtk": {
      return withLog(
        {
          ...b,
          combatants: b.combatants.map((c) =>
            c.side === actor.side ? { ...c, fx: { ...c.fx, atkMod: c.fx.atkMod + fx.amount } } : c,
          ),
        },
        `${tag} the line steadies (+${fx.amount} attack).`,
      );
    }
    case "debuffDef": {
      if (!target) return b;
      return withLog(
        {
          ...b,
          combatants: b.combatants.map((c) =>
            c.id === target.id ? { ...c, fx: { ...c.fx, defMod: c.fx.defMod - fx.amount } } : c,
          ),
        },
        `${tag} ${target.name}'s armour splits (-${fx.amount} defence).`,
      );
    }
    case "focus": {
      return withLog(
        {
          ...b,
          combatants: b.combatants.map((c) =>
            c.id === actor.id ? { ...c, focus: Math.min(c.maxFocus, c.focus + fx.amount) } : c,
          ),
        },
        `${tag} ${actor.name} reads the field (+${fx.amount} focus).`,
      );
    }
    default:
      return b;
  }
}

function runEnemyTurns(b: Battle): Battle {
  let guard = 0;
  while (b.status === "active" && guard++ < 24) {
    const actor = activeCombatant(b);
    if (!actor || actor.side === "ally") break;
    const targets = b.combatants.filter((c) => c.side === "ally" && alive(c));
    if (targets.length === 0) break;
    const weakest = [...targets].sort((a, x) => a.hp - x.hp)[0]!;
    const target = Math.random() < 0.55 ? weakest : pick(targets);
    const usable = actor.skills.map((id) => SKILLS[id]).filter((s): s is Skill => !!s && s.cost <= actor.focus);
    if (usable.length > 0 && Math.random() < (actor.boss ? 0.7 : 0.45)) {
      const skill = pick(usable);
      b = { ...b, combatants: b.combatants.map((c) => (c.id === actor.id ? { ...c, focus: c.focus - skill.cost } : c)) };
      b = resolveSkill(b, actor, skill, target.id);
    } else {
      const d = damage(actor, target, 1);
      b = applyDamage(b, target.id, d);
      b = withLog(b, `${actor.name} hits ${target.name} for ${d}.`);
    }
    b = checkEnd(b);
    if (b.status !== "active") break;
    b = advance(b);
  }
  return b;
}
