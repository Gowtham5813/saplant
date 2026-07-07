
-- Ensure the tamper-prevention trigger is actually attached to profiles.
DROP TRIGGER IF EXISTS prevent_profile_points_tampering_trg ON public.profiles;
CREATE TRIGGER prevent_profile_points_tampering_trg
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_profile_points_tampering();

-- Ensure updated_at is maintained on profile updates.
DROP TRIGGER IF EXISTS profiles_touch_updated_at ON public.profiles;
CREATE TRIGGER profiles_touch_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.touch_updated_at();

-- Ensure the award trigger is attached to plantings (safe if already present).
DROP TRIGGER IF EXISTS award_planting_points_trg ON public.plantings;
CREATE TRIGGER award_planting_points_trg
AFTER INSERT ON public.plantings
FOR EACH ROW
EXECUTE FUNCTION public.award_planting_points();
