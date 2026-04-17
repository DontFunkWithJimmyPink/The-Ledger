# Supabase Storage Setup Guide

This guide explains how to configure Supabase Storage for The Ledger application.

## Overview

Task **T009** configures a private storage bucket named `notebook-photos` with Row Level Security (RLS) policies that enforce per-user folder isolation.

## Quick Start (Recommended)

### Option 1: Using Supabase Dashboard (Web UI)

#### Step 1: Create the Storage Bucket

1. **Login to Supabase Dashboard**
   - Navigate to: https://app.supabase.com/project/YOUR_PROJECT_ID
   - Or your project URL

2. **Open Storage**
   - From the left sidebar, click on **Storage**

3. **Create New Bucket**
   - Click **New bucket**
   - Bucket name: `notebook-photos`
   - **IMPORTANT**: Set as **Private** (uncheck "Public bucket")
   - Click **Create bucket**

#### Step 2: Apply Storage Policies

1. **Open SQL Editor**
   - From the left sidebar, click on **SQL Editor**
   - Click **New Query**

2. **Copy and Execute Storage Policies**
   - Open the file: `specs/001-ledger-notebook-app/contracts/storage-policies.sql`
   - Copy the entire contents
   - Paste into the SQL Editor
   - Click **Run** or press `Ctrl+Enter` (Windows/Linux) or `Cmd+Enter` (Mac)

3. **Verify Success**
   - You should see "Success. No rows returned" message
   - Navigate back to **Storage** → **Policies**
   - Verify 4 policies were created for `notebook-photos`:
     - `photos_upload_own_folder` (INSERT)
     - `photos_read_own_folder` (SELECT)
     - `photos_update_own_folder` (UPDATE)
     - `photos_delete_own_folder` (DELETE)

### Option 2: Using Supabase CLI

If you have the Supabase CLI installed:

```bash
# Create the private bucket
supabase storage create notebook-photos --no-public

# Apply the storage policies
supabase db execute < specs/001-ledger-notebook-app/contracts/storage-policies.sql
```

### Option 3: Using Helper Scripts

We provide bash scripts for automation:

```bash
# Create the bucket (requires manual confirmation in dashboard)
./scripts/create-storage-bucket.sh

# Apply the storage policies
./scripts/apply-storage-policies.sh
```

## What Gets Created

### Storage Bucket

- **Name**: `notebook-photos`
- **Visibility**: Private (not publicly accessible)
- **Purpose**: Store user-uploaded photos for notebook pages

### Folder Structure

Photos are organized by user and page:

```
notebook-photos/
  └── {user_id}/
      └── {page_id}/
          ├── 1713254400000_holiday.jpg
          ├── 1713254500000_receipt.png
          └── ...
```

**Format**: `{user_id}/{page_id}/{unix_ms}_{filename}`

### Storage Policies (RLS)

Four policies enforce per-user isolation:

| Policy                     | Operation | Purpose                                                     |
| -------------------------- | --------- | ----------------------------------------------------------- |
| `photos_upload_own_folder` | INSERT    | Users can only upload to their own folder (`{user_id}/...`) |
| `photos_read_own_folder`   | SELECT    | Users can only read photos from their own folder            |
| `photos_update_own_folder` | UPDATE    | Users can only replace their own photos                     |
| `photos_delete_own_folder` | DELETE    | Users can only delete their own photos                      |

### Key Security Features

1. **Per-user folder isolation**: `auth.uid() = foldername[1]`
   - Extracts the first folder segment (user ID) from the storage path
   - Compares it to the authenticated user's ID
   - Prevents cross-user access

2. **File type validation**:
   - Allowed extensions: jpg, jpeg, png, gif, webp, heic
   - Enforced at upload time via RLS policy

3. **Size limits**:
   - Maximum file size: 10 MB (10,485,760 bytes)
   - Enforced client-side before upload
   - Also validated via `photos.size_bytes` column constraint in database

4. **Private access**:
   - Bucket is not public
   - Access requires signed URLs generated server-side
   - URLs have short TTL (e.g., 1 hour) for security

## Verification

After applying the storage configuration, verify it worked:

### Check Bucket Exists

1. In Supabase Dashboard → Storage
2. You should see the `notebook-photos` bucket
3. Click on it to view (should be empty initially)
4. Verify it's marked as **Private**

### Check Policies Exist

1. In Supabase Dashboard → Storage → Policies
2. Filter by bucket: `notebook-photos`
3. You should see 4 policies:
   - `photos_upload_own_folder`
   - `photos_read_own_folder`
   - `photos_update_own_folder`
   - `photos_delete_own_folder`

### Check RLS is Enabled

In Supabase Dashboard → SQL Editor, run:

```sql
-- Verify RLS is enabled on storage.objects
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'storage' AND tablename = 'objects';
```

Expected result: `rowsecurity` should be `true`

### Test Policy (Optional)

You can test the policies work correctly by:

1. Creating a test user via Supabase Auth
2. Attempting to upload a file via the Supabase client (in browser console)
3. Verifying the file appears in the correct folder structure

## Troubleshooting

### "Bucket already exists" error

If you see this error when creating the bucket:

- The bucket may have been created previously
- Check the Storage section in the dashboard
- You can skip bucket creation and proceed to applying policies

### "Policy already exists" errors

If you see errors about policies already existing:

- The policies may have been applied previously
- You can use `DROP POLICY IF EXISTS` before creating them
- Or skip policy creation if they already exist and are correct

### Connection refused / timeout errors

- Verify your Supabase project is running
- Check that you're using the correct connection details
- Ensure your IP is not blocked

### Permission denied errors

- Ensure you're using the correct credentials
- Check that you have admin access to the Supabase project
- Verify the SQL is being run with proper privileges

### Files not uploading

If users can't upload files after applying policies:

- Check that the bucket is created and policies are applied
- Verify the file path follows the correct format: `{user_id}/{page_id}/{timestamp}_{filename}`
- Check that the file extension is in the allowed list
- Verify the user is authenticated and `auth.uid()` returns their ID
- Check browser console for specific error messages

### Files not accessible

If users can't access their uploaded files:

- Ensure signed URLs are being generated server-side
- Check the URL TTL hasn't expired
- Verify the user ID in the path matches the authenticated user
- Check RLS policies are applied correctly

## Integration with Application

### Photo Upload Flow

The application will use this storage bucket as follows:

1. **Upload** (Client → Storage):

   ```typescript
   // In PhotoUploadButton.tsx (T049)
   const path = `${userId}/${pageId}/${Date.now()}_${filename}`;
   const { data, error } = await supabase.storage
     .from('notebook-photos')
     .upload(path, file);
   ```

2. **Store metadata** (Client → Database):

   ```typescript
   // After successful upload
   await supabase.from('photos').insert({
     page_id: pageId,
     user_id: userId,
     storage_path: path,
     size_bytes: file.size,
   });
   ```

3. **Generate signed URL** (Server):

   ```typescript
   // For displaying images
   const { data } = await supabase.storage
     .from('notebook-photos')
     .createSignedUrl(storagePath, 3600); // 1 hour TTL
   ```

4. **Delete** (Client → Storage & Database):

   ```typescript
   // Remove from storage
   await supabase.storage.from('notebook-photos').remove([storagePath]);

   // Remove metadata
   await supabase.from('photos').delete().eq('id', photoId);
   ```

### File Size Validation

Client-side validation (required):

```typescript
const MAX_FILE_SIZE = 10485760; // 10 MB

if (file.size > MAX_FILE_SIZE) {
  toast.error('Photo must be under 10 MB');
  return;
}
```

### File Type Validation

Client-side validation (recommended):

```typescript
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/heic',
];

if (!ALLOWED_TYPES.includes(file.type)) {
  toast.error('Please upload a valid image file');
  return;
}
```

## Next Steps

After successfully configuring Supabase Storage:

1. ✅ **T008 Complete** - Database schema applied
2. ✅ **T009 Complete** - Storage bucket and policies configured
3. 🔧 **T010-T011 Next** - Implement Supabase client factories
4. 📸 **T049-T054 Later** - Implement photo upload components (Phase 6)

## Security Best Practices

1. **Never expose service role key** in client-side code
2. **Always validate file size** client-side before upload
3. **Use signed URLs** with short TTL for accessing private files
4. **Follow folder naming convention** strictly: `{user_id}/{page_id}/{timestamp}_{filename}`
5. **Clean up orphaned files** when pages or users are deleted
6. **Monitor storage usage** to prevent abuse
7. **Implement rate limiting** on upload endpoints if needed

## Reference

For more details, see:

- Storage policies SQL: `specs/001-ledger-notebook-app/contracts/storage-policies.sql`
- Photo upload task: T049 in `specs/001-ledger-notebook-app/tasks.md`
- Database schema: `specs/001-ledger-notebook-app/contracts/database-schema.sql`
