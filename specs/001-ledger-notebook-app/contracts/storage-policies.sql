-- =============================================================================
-- The Ledger — Supabase Storage Bucket Policies
-- Feature: 001-ledger-notebook-app
-- =============================================================================
--
-- Storage bucket: notebook-photos
-- Folder convention: {user_id}/{page_id}/{timestamp}_{filename}
-- Per-user isolation enforced via storage.foldername(name)[1] = auth.uid()::text
-- =============================================================================

-- Run from Supabase SQL Editor after creating the bucket via the dashboard
-- (or via Supabase CLI: supabase storage create notebook-photos --no-public)

-- Enable RLS on the storage.objects table (may already be enabled on hosted Supabase)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Bucket: notebook-photos
-- ---------------------------------------------------------------------------

-- Users may upload to their own folder only
CREATE POLICY "photos_upload_own_folder"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'notebook-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
    AND (storage.extension(name) IN ('jpg', 'jpeg', 'png', 'gif', 'webp', 'heic'))
  );

-- Users may read their own photos
CREATE POLICY "photos_read_own_folder"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'notebook-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users may update (replace) their own photos
CREATE POLICY "photos_update_own_folder"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'notebook-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'notebook-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users may delete their own photos
CREATE POLICY "photos_delete_own_folder"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'notebook-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ---------------------------------------------------------------------------
-- Notes
-- ---------------------------------------------------------------------------
-- 1. The bucket should be created as PRIVATE (not public) — access URLs are
--    generated server-side using createSignedUrl() with a short TTL (e.g. 1 hour).
--    This prevents unauthenticated access to uploaded photos.
--
-- 2. File size limits (10 MB) are enforced client-side before upload (FR-019)
--    and are validated again via the photos.size_bytes column constraint in the DB.
--    Supabase Storage does not natively enforce per-file size in bucket policies,
--    so the double-validation approach covers both paths.
--
-- 3. Allowed MIME types: image/jpeg, image/png, image/gif, image/webp, image/heic.
--    The extension check in the policy is a secondary guard; the primary check is
--    performed client-side before the upload is initiated.
--
-- 4. Folder path format: {user_id}/{page_id}/{unix_ms}_{sanitized_filename}
--    e.g.: "a1b2c3d4-…/e5f6g7h8-…/1713254400000_holiday.jpg"
