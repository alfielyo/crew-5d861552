
-- Add structured location columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN location_city TEXT,
  ADD COLUMN location_country TEXT,
  ADD COLUMN location_area TEXT;
