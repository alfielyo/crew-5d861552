
-- MATCHING FLOW MIGRATION

-- 0. Add date_of_birth to profiles (needed by matching algorithm)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS date_of_birth DATE;

-- 1. Add approval status to run_groups
ALTER TABLE public.run_groups
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id);

-- 2. Routes table — one route per run_date
CREATE TABLE public.routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_date_id UUID NOT NULL REFERENCES public.run_dates(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Battersea 5k Loop',
  distance_km NUMERIC(4,2) NOT NULL DEFAULT 5.0,
  meeting_point TEXT NOT NULL DEFAULT 'The Bandstand, Battersea Park',
  post_run_cafe TEXT NOT NULL DEFAULT 'Mahali & Co, Battersea Park',
  map_image_url TEXT,
  waypoints JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(run_date_id)
);

-- 3. Group messages table (in-app chat)
CREATE TABLE public.group_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_group_id UUID NOT NULL REFERENCES public.run_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) <= 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Matching job log — idempotency guard
CREATE TABLE public.matching_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_date_id UUID NOT NULL REFERENCES public.run_dates(id) ON DELETE CASCADE,
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'completed',
  groups_created INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  UNIQUE(run_date_id)
);

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- Routes: any authenticated user can read
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view routes"
  ON public.routes FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can manage routes"
  ON public.routes FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Group messages: members of the group can read/write
ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Group members can read messages"
  ON public.group_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.run_group_members
      WHERE run_group_id = group_messages.run_group_id
        AND user_id = auth.uid()
    )
  );

CREATE POLICY "Group members can insert messages"
  ON public.group_messages FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.run_group_members
      WHERE run_group_id = group_messages.run_group_id
        AND user_id = auth.uid()
    )
  );

-- Matching runs: admins only
ALTER TABLE public.matching_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view matching runs"
  ON public.matching_runs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- REALTIME — enable for group_messages
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_messages;

-- ============================================================
-- DEFAULT ROUTE for existing run_dates
-- ============================================================
INSERT INTO public.routes (run_date_id, name, distance_km, meeting_point, post_run_cafe, waypoints)
SELECT
  id,
  'Battersea Park 5k Loop',
  5.0,
  'The Bandstand, Battersea Park',
  'Mahali & Co, Battersea Park',
  '[
    {"order":1,"label":"Start — The Bandstand","lat":51.4796,"lng":-0.1572},
    {"order":2,"label":"Carriage Drive North","lat":51.4837,"lng":-0.1590},
    {"order":3,"label":"Chelsea Bridge Gate","lat":51.4873,"lng":-0.1536},
    {"order":4,"label":"Carriage Drive East","lat":51.4842,"lng":-0.1493},
    {"order":5,"label":"Battersea Park Station Gate","lat":51.4761,"lng":-0.1500},
    {"order":6,"label":"Carriage Drive South","lat":51.4733,"lng":-0.1557},
    {"order":7,"label":"Winter Garden Corner","lat":51.4726,"lng":-0.1619},
    {"order":8,"label":"Finish — The Bandstand","lat":51.4796,"lng":-0.1572}
  ]'::jsonb
FROM public.run_dates
ON CONFLICT (run_date_id) DO NOTHING;
