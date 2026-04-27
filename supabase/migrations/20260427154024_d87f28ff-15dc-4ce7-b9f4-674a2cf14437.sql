-- POSTS TABLE
CREATE TABLE public.posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  image_path TEXT NOT NULL,
  caption TEXT,
  location TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_posts_created_at ON public.posts (created_at DESC);
CREATE INDEX idx_posts_user_id ON public.posts (user_id);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Posts are viewable by everyone"
  ON public.posts FOR SELECT USING (true);
CREATE POLICY "Users can insert their own posts"
  ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own posts"
  ON public.posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own posts"
  ON public.posts FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER posts_touch_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- LIKES TABLE
CREATE TABLE public.post_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, post_id)
);
CREATE INDEX idx_post_likes_post_id ON public.post_likes (post_id);

ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Likes are viewable by everyone"
  ON public.post_likes FOR SELECT USING (true);
CREATE POLICY "Users can like as themselves"
  ON public.post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike their own likes"
  ON public.post_likes FOR DELETE USING (auth.uid() = user_id);

-- COMMENTS TABLE
CREATE TABLE public.post_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  comment TEXT NOT NULL CHECK (length(comment) > 0 AND length(comment) <= 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_post_comments_post_id ON public.post_comments (post_id, created_at);

ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments are viewable by everyone"
  ON public.post_comments FOR SELECT USING (true);
CREATE POLICY "Users can comment as themselves"
  ON public.post_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own comments"
  ON public.post_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own comments"
  ON public.post_comments FOR DELETE USING (auth.uid() = user_id);

-- STORAGE BUCKET (public, 5MB limit, images only)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'post-images',
  'post-images',
  true,
  5242880,
  ARRAY['image/jpeg','image/png','image/webp','image/gif']
);

CREATE POLICY "Post images are publicly viewable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'post-images');

CREATE POLICY "Users can upload to their own folder in post-images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'post-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own post images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'post-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own post images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'post-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );