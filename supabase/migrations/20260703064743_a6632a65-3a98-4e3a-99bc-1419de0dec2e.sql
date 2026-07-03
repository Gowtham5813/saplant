
CREATE OR REPLACE FUNCTION public.prevent_profile_points_tampering()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- pg_trigger_depth() = 1 means this UPDATE was issued directly (e.g. from the client),
  -- not as a cascade from another trigger such as award_planting_points.
  IF pg_trigger_depth() = 1 THEN
    NEW.total_points := OLD.total_points;
    NEW.total_saplings := OLD.total_saplings;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_profile_points_tampering ON public.profiles;
CREATE TRIGGER prevent_profile_points_tampering
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_points_tampering();
