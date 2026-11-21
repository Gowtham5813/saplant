ALTER POLICY "Profiles are viewable by everyone" ON public.profiles TO authenticated USING (auth.uid() IS NOT NULL);
ALTER POLICY "Likes are viewable by everyone" ON public.post_likes TO authenticated USING (auth.uid() IS NOT NULL);
ALTER POLICY "Comments are viewable by everyone" ON public.post_comments TO authenticated USING (auth.uid() IS NOT NULL);