-- Profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT 'Planter',
  avatar_url TEXT,
  total_points INTEGER NOT NULL DEFAULT 0,
  total_saplings INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Plantings table
CREATE TABLE public.plantings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  species TEXT NOT NULL,
  location TEXT NOT NULL,
  notes TEXT,
  photo_url TEXT,
  points_earned INTEGER NOT NULL DEFAULT 10,
  shared BOOLEAN NOT NULL DEFAULT true,
  planted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.plantings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shared plantings are viewable by everyone"
  ON public.plantings FOR SELECT USING (shared = true OR auth.uid() = user_id);

CREATE POLICY "Users can insert their own plantings"
  ON public.plantings FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own plantings"
  ON public.plantings FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own plantings"
  ON public.plantings FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_plantings_user_id ON public.plantings(user_id);
CREATE INDEX idx_plantings_planted_at ON public.plantings(planted_at DESC);

-- Trigger function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1), 'Planter'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger function to award points on new planting
CREATE OR REPLACE FUNCTION public.award_planting_points()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET total_points = total_points + NEW.points_earned,
      total_saplings = total_saplings + 1,
      updated_at = now()
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_planting_created
  AFTER INSERT ON public.plantings
  FOR EACH ROW EXECUTE FUNCTION public.award_planting_points();

-- updated_at trigger for profiles
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER touch_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();