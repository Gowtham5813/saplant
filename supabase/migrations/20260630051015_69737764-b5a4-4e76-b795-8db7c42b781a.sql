
-- Fix 1: Prevent points_earned inflation by hardcoding in trigger and adding CHECK constraint
ALTER TABLE public.plantings ADD CONSTRAINT plantings_points_earned_fixed CHECK (points_earned = 10);

CREATE OR REPLACE FUNCTION public.award_planting_points()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.profiles
  SET total_points = total_points + 10,
      total_saplings = total_saplings + 1,
      updated_at = now()
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$function$;

-- Fix 2: Restrict storage SELECT policy to authenticated owners only (drop broad public role)
DROP POLICY IF EXISTS "Owners can list their post images" ON storage.objects;
CREATE POLICY "Owners can list their post images"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'post-images' AND (auth.uid())::text = (storage.foldername(name))[1]);
