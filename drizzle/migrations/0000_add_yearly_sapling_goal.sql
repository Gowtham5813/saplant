ALTER TABLE public.profiles
ADD COLUMN yearly_sapling_goal integer;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_yearly_sapling_goal_positive
CHECK (yearly_sapling_goal IS NULL OR yearly_sapling_goal > 0);

COMMENT ON COLUMN public.profiles.yearly_sapling_goal IS 'Optional per-user target for saplings planted during the current calendar year.';