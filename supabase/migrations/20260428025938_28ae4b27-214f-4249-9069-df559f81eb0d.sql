DROP POLICY IF EXISTS "Post images are publicly viewable" ON storage.objects;

CREATE POLICY "Owners can list their post images"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'post-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);