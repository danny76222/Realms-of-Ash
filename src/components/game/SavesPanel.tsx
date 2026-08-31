import { useCallback, useEffect, useState } from "react";
import { Icon } from "./icons";
import { supabase } from "@/integrations/supabase/client";
import { deleteSave, listSaves, writeSave } from "@/lib/saves.functions";
import {
  localDelete,
  localSaves,
  localWrite,
  metaOf,
  migrate,
  SLOTS,
  type SaveMeta,
} from "@/game/saves";
import { LOCATIONS } from "@/game/world";
import type { GameState } from "@/game/types";
import { Panel, PixelButton } from "./ui";

interface Row extends SaveMeta {
  state?: GameState;
}

export function SavesPanel({
  current,
  onLoad,
  onClose,
}: {
  current: GameState | null;
  onLoad: (g: GameState) => void;
  onClose: () => void;
}) {
  const [signedIn, setSignedIn] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const local: Row[] = localSaves();
    let cloud: Row[] = [];
    const { data } = await supabase.auth.getSession();
    const authed = !!data.session;
    setSignedIn(authed);
    if (authed) {
      try {
        const saves = await listSaves();
        cloud = saves.map((r) => ({
          slot: r.slot_index,
          name: r.name,
          heroName: r.hero_name,
          heroClass: r.hero_class,
          level: r.level,
          day: r.day,
          locationId: r.location_id,
          updated: r.updated_at,
          cloud: true,
          state: JSON.parse(r.state) as GameState,
        }));
      } catch {
        setMsg("Could not reach cloud saves.");
      }
    }
    const bySlot = new Map<number, Row>();
    for (const r of local) bySlot.set(r.slot, r);
    for (const r of cloud) bySlot.set(r.slot, r);
    setRows([...bySlot.values()].sort((a, b) => a.slot - b.slot));
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const save = async (slot: number) => {
    if (!current) return;
    setBusy(true);
    const name = `${current.heroName}, Day ${current.day}`;
    localWrite(slot, name, current);
    if (signedIn) {
      try {
        const m = metaOf(current, slot, name, true);
        await writeSave({
          data: {
            slot_index: slot,
            name,
            hero_name: m.heroName,
            hero_class: m.heroClass,
            level: m.level,
            day: m.day,
            location_id: m.locationId,
            state: JSON.stringify(current),
          },
        });
      } catch {
        setMsg("Saved locally; cloud write failed.");
      }
    }
    setBusy(false);
    await refresh();
    setMsg(`Saved to slot ${slot + 1}.`);
  };

  const remove = async (slot: number) => {
    setBusy(true);
    localDelete(slot);
    if (signedIn) {
      try {
        await deleteSave({ data: { slot_index: slot } });
      } catch {
        /* ignore */
      }
    }
    setBusy(false);
    await refresh();
  };

  const load = (row: Row) => {
    if (!row.state) return;
    const g = migrate(row.state);
    if (!g) {
      setMsg("That save was made by an older version of the game.");
      return;
    }
    onLoad(g);
  };

  return (
    <Panel
      title="Save Slots"
      className="w-full max-w-2xl"
      right={
        <PixelButton size="sm" variant="ghost" onClick={onClose}>
          Close
        </PixelButton>
      }
    >
      <p className="mb-2 text-sm text-muted-foreground">
        {signedIn
          ? "Signed in. Saves are stored in the cloud and mirrored on this device."
          : "Playing as a guest: saves stay on this device. Sign in to keep them in the cloud."}
      </p>
      <ul className="space-y-1">
        {SLOTS.map((slot) => {
          const row = rows.find((r) => r.slot === slot);
          return (
            <li
              key={slot}
              className="flex flex-wrap items-center gap-2 border border-border bg-background/50 px-2 py-1.5"
            >
              <span className="pixel-font w-14 text-[10px] text-primary">Slot {slot + 1}</span>
              <span className="min-w-0 flex-1 truncate text-sm">
                {row ? (
                  <>
                    {row.heroName}, level {row.level}, day {row.day},{" "}
                    {LOCATIONS[row.locationId]?.name ?? row.locationId}
                    {row.cloud ? (
                      <Icon name="cloud-save" className="ml-1" title="Saved to the cloud" />
                    ) : null}
                  </>
                ) : (
                  <span className="text-muted-foreground">empty</span>
                )}
              </span>
              <span className="flex gap-1">
                {row?.state ? (
                  <PixelButton size="sm" variant="accent" onClick={() => load(row)} disabled={busy}>
                    Load
                  </PixelButton>
                ) : null}
                {current ? (
                  <PixelButton size="sm" onClick={() => void save(slot)} disabled={busy}>
                    {row ? "Overwrite" : "Save"}
                  </PixelButton>
                ) : null}
                {row ? (
                  <PixelButton
                    size="sm"
                    variant="danger"
                    onClick={() => void remove(slot)}
                    disabled={busy}
                  >
                    Delete
                  </PixelButton>
                ) : null}
              </span>
            </li>
          );
        })}
      </ul>
      {msg ? <p className="pixel-font mt-2 text-[10px] text-accent">{msg}</p> : null}
      {!signedIn ? (
        <p className="mt-2 text-sm">
          <a className="text-primary underline" href="/auth">
            Sign in for cloud saves →
          </a>
        </p>
      ) : null}
    </Panel>
  );
}
