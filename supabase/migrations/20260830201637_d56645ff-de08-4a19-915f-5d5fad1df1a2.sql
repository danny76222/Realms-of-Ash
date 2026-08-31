CREATE TABLE public.save_slots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  slot_index INTEGER NOT NULL,
  name TEXT NOT NULL DEFAULT 'New Save',
  hero_name TEXT NOT NULL DEFAULT 'Hero',
  hero_class TEXT NOT NULL DEFAULT 'warrior',
  level INTEGER NOT NULL DEFAULT 1,
  day INTEGER NOT NULL DEFAULT 1,
  location_id TEXT NOT NULL DEFAULT 'oakhollow',
  state JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, slot_index)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.save_slots TO authenticated;
GRANT ALL ON public.save_slots TO service_role;

ALTER TABLE public.save_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players manage their own saves"
  ON public.save_slots FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_save_slots_updated_at
BEFORE UPDATE ON public.save_slots
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();