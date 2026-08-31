import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const slotSchema = z.object({
  slot_index: z.number().int().min(0).max(5),
  name: z.string().min(1).max(60),
  hero_name: z.string().min(1).max(40),
  hero_class: z.string().min(1).max(20),
  level: z.number().int().min(1).max(99),
  day: z.number().int().min(1),
  location_id: z.string().min(1).max(60),
  state: z.string().min(2).max(400000),
});

export interface SaveRow {
  slot_index: number;
  name: string;
  hero_name: string;
  hero_class: string;
  level: number;
  day: number;
  location_id: string;
  state: string;
  updated_at: string;
}

export const listSaves = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SaveRow[]> => {
    const { data, error } = await context.supabase
      .from("save_slots")
      .select("slot_index, name, hero_name, hero_class, level, day, location_id, state, updated_at")
      .order("slot_index", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => ({
      slot_index: r.slot_index,
      name: r.name,
      hero_name: r.hero_name,
      hero_class: r.hero_class,
      level: r.level,
      day: r.day,
      location_id: r.location_id,
      state: typeof r.state === "string" ? r.state : JSON.stringify(r.state),
      updated_at: r.updated_at,
    }));
  });

export const writeSave = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => slotSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("save_slots").upsert(
      {
        user_id: context.userId,
        slot_index: data.slot_index,
        name: data.name,
        hero_name: data.hero_name,
        hero_class: data.hero_class,
        level: data.level,
        day: data.day,
        location_id: data.location_id,
        state: data.state,
      },
      { onConflict: "user_id,slot_index" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteSave = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ slot_index: z.number().int().min(0).max(5) }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("save_slots").delete().eq("slot_index", data.slot_index);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
