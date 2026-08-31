import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { createBattle, takeTurn, type PlayerAction } from "./engine";
import {
  addItem,
  applyBattleResult,
  advanceDays,
  sleepToMorning,
  pushLog,
  restParty,
  travelTo,
} from "./state";
import { completeQuest, finishDungeon, generateDungeon, type DungeonRoom } from "./progress";
import { resolveEnding } from "./story";
import type { Battle, GameState, SideQuest } from "./types";

export type Screen =
  "title" | "create" | "map" | "location" | "battle" | "story" | "ending" | "lore";

interface DungeonRun {
  locationId: string;
  rooms: DungeonRoom[];
  index: number;
  gold: number;
  loot: string[];
}

interface Ctx {
  game: GameState | null;
  screen: Screen;
  battle: Battle | null;
  run: DungeonRun | null;
  pendingQuest: SideQuest | null;
  setPendingQuest: (q: SideQuest | null) => void;
  notice: string | null;
  setNotice: (n: string | null) => void;
  setScreen: (s: Screen) => void;
  start: (g: GameState) => void;
  update: (fn: (g: GameState) => GameState) => void;
  load: (g: GameState) => void;
  quit: () => void;
  goTo: (locationId: string) => void;
  fight: (opts: {
    title: string;
    enemyIds: string[];
    tag: string;
    canFlee?: boolean;
    bonusGold?: number;
    loot?: string[];
  }) => void;
  act: (action: PlayerAction) => void;
  closeBattle: () => void;
  enterDungeon: (locationId: string) => void;
  nextRoom: () => void;
  leaveDungeon: () => void;
  finishGame: () => void;
}

const GameCtx = createContext<Ctx | null>(null);

export function useGame(): Ctx {
  const ctx = useContext(GameCtx);
  if (!ctx) throw new Error("useGame outside provider");
  return ctx;
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [game, setGame] = useState<GameState | null>(null);
  const [screen, setScreen] = useState<Screen>("title");
  const [battle, setBattle] = useState<Battle | null>(null);
  const [run, setRun] = useState<DungeonRun | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pendingQuest, setPendingQuest] = useState<SideQuest | null>(null);

  const update = useCallback((fn: (g: GameState) => GameState) => {
    setGame((g) => (g ? fn(g) : g));
  }, []);

  const start = useCallback((g: GameState) => {
    setGame(g);
    setBattle(null);
    setRun(null);
    setScreen("location");
  }, []);

  const load = useCallback((g: GameState) => {
    setGame(g);
    setBattle(null);
    setRun(null);
    setScreen(g.endingId ? "ending" : "location");
  }, []);

  const quit = useCallback(() => {
    setGame(null);
    setBattle(null);
    setRun(null);
    setScreen("title");
  }, []);

  const fight = useCallback(
    (opts: {
      title: string;
      enemyIds: string[];
      tag: string;
      canFlee?: boolean;
      bonusGold?: number;
      loot?: string[];
    }) => {
      setGame((g) => {
        if (!g) return g;
        const { battle, rng } = createBattle({
          state: g,
          title: opts.title,
          enemyIds: opts.enemyIds,
          returnTo: g.locationId,
          tag: opts.tag,
          ...(opts.canFlee === undefined ? {} : { canFlee: opts.canFlee }),
          ...(opts.bonusGold === undefined ? {} : { bonusGold: opts.bonusGold }),
          ...(opts.loot === undefined ? {} : { loot: opts.loot }),
        });
        setBattle(battle);
        setScreen("battle");
        return { ...g, rng };
      });
    },
    [],
  );

  const goTo = useCallback((locationId: string) => {
    setGame((g) => {
      if (!g) return g;
      const { state, ambush } = travelTo(g, locationId);
      if (ambush) {
        const { battle, rng } = createBattle({
          state,
          title: "Ambush on the road",
          enemyIds: ambush,
          returnTo: locationId,
          tag: "ambush",
        });
        setBattle(battle);
        setScreen("battle");
        return { ...state, rng };
      } else {
        setScreen("location");
      }
      return state;
    });
  }, []);

  const act = useCallback(
    (action: PlayerAction) => {
      setBattle((b) => {
        if (!b || b.status !== "active") return b;
        const { battle: nb, usedItem } = takeTurn(b, action);
        if (usedItem) update((g) => addItem(g, usedItem, -1));
        return nb;
      });
    },
    [update],
  );

  const closeBattle = useCallback(() => {
    setBattle((b) => {
      if (!b) return null;
      setGame((g) => {
        if (!g) return g;
        const { state, levelUps } = applyBattleResult(g, b);
        let s = state;
        for (const l of levelUps) s = pushLog(s, l);
        if (levelUps.length) setNotice(levelUps.join(" "));
        return s;
      });
      if (b.tag?.startsWith("quest") && b.status === "won") {
        setPendingQuest((q) => {
          if (q) setGame((g) => (g ? completeQuest(g, q) : g));
          return null;
        });
      }
      // dungeon flow
      if (b.tag?.startsWith("dungeon") && b.status === "won") {
        setRun((r) => {
          if (!r) return r;
          const room = r.rooms[r.index];
          const next = {
            ...r,
            index: r.index + 1,
            gold: r.gold + (room?.gold ?? 0),
            loot: [...r.loot, ...(room?.loot ?? [])],
          };
          return next;
        });
      }
      if (b.tag?.startsWith("story") && b.status === "won") {
        setScreen("story");
        return null;
      }
      setScreen("location");
      return null;
    });
  }, []);

  const enterDungeon = useCallback((locationId: string) => {
    setGame((g) => {
      if (!g) return g;
      const rooms = generateDungeon(g, locationId);
      setRun({ locationId, rooms, index: 0, gold: 0, loot: [] });
      const first = rooms[0]!;
      const { battle, rng } = createBattle({
        state: g,
        title: `${first.name}`,
        enemyIds: first.enemies,
        returnTo: locationId,
        tag: `dungeon:${locationId}:0`,
      });
      setBattle(battle);
      setScreen("battle");
      return { ...g, rng };
    });
  }, []);

  const nextRoom = useCallback(() => {
    setRun((r) => {
      if (!r) return r;
      const room = r.rooms[r.index];
      if (!room) return r;
      setGame((g) => {
        if (!g) return g;
        const { battle, rng } = createBattle({
          state: g,
          title: room.name,
          enemyIds: room.enemies,
          returnTo: r.locationId,
          tag: `dungeon:${r.locationId}:${r.index}`,
          canFlee: false,
        });
        setBattle(battle);
        return { ...g, rng };
      });
      setScreen("battle");
      return r;
    });
  }, []);

  const leaveDungeon = useCallback(() => {
    setRun((r) => {
      if (!r) return null;
      const cleared = r.index >= r.rooms.length;
      setGame((g) => {
        if (!g) return g;
        let s = restParty(sleepToMorning(g), 0.25);
        if (cleared) s = finishDungeon(s, r.locationId, r.gold, r.loot);
        else {
          s = { ...s, gold: s.gold + Math.round(r.gold * 0.5) };
          for (const l of r.loot) s = addItem(s, l, 1);
          s = pushLog(s, `You withdraw from the depths with what you can carry.`);
        }
        return s;
      });
      setScreen("location");
      return null;
    });
  }, []);

  const finishGame = useCallback(() => {
    setGame((g) => {
      if (!g) return g;
      const ending = resolveEnding(g);
      setScreen("ending");
      return { ...g, endingId: ending.id };
    });
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      game,
      screen,
      battle,
      run,
      notice,
      setNotice,
      pendingQuest,
      setPendingQuest,
      setScreen,
      start,
      update,
      load,
      quit,
      goTo,
      fight,
      act,
      closeBattle,
      enterDungeon,
      nextRoom,
      leaveDungeon,
      finishGame,
    }),
    [
      game,
      screen,
      battle,
      run,
      notice,
      pendingQuest,
      start,
      update,
      load,
      quit,
      goTo,
      fight,
      act,
      closeBattle,
      enterDungeon,
      nextRoom,
      leaveDungeon,
      finishGame,
    ],
  );

  return <GameCtx.Provider value={value}>{children}</GameCtx.Provider>;
}
