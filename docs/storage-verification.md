# Storage Verification Checklist

This document provides a comprehensive checklist to verify that Supabase Storage has been correctly configured for The Ledger application.

## Overview

Task **T009** configures:
- Private storage bucket: `notebook-photos`
- Row Level Security (RLS) policies for per-user folder isolation

## Quick Verification

Run through this checklist to confirm everything is working:

### 1. ✅ Bucket Exists

**Location**: Supabase Dashboard → Storage

- [ ] Bucket `notebook-photos` is visible in the storage list
- [ ] Bucket is marked as **Private** (not public)
- [ ] Bucket is empty (or contains only test files)

### 2. ✅ RLS is Enabled

**Location**: Supabase Dashboard → SQL Editor

Run this query:

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'storage' AND tablename = 'objects';
```

**Expected result**:
```
tablename | rowsecurity
----------+-------------
objects   | true
```

- [ ] Query returns `rowsecurity = true`

### 3. ✅ Storage Policies Exist

**Location**: Supabase Dashboard → Storage → Policies

Filter by bucket: `notebook-photos`

You should see exactly **4 policies**:

#### Policy 1: photos_upload_own_folder
- [ ] **Operation**: INSERT
- [ ] **WITH CHECK clause**: Contains `auth.uid()::text = (storage.foldername(name))[1]`
- [ ] **Extension check**: Validates file extensions (jpg, jpeg, png, gif, webp, heic)

#### Policy 2: photos_read_own_folder
- [ ] **Operation**: SELECT
- [ ] **USING clause**: Contains `auth.uid()::text = (storage.foldername(name))[1]`

#### Policy 3: photos_update_own_folder
- [ ] **Operation**: UPDATE
- [ ] **USING clause**: Contains `auth.uid()::text = (storage.foldername(name))[1]`
- [ ] **WITH CHECK clause**: Contains `auth.uid()::text = (storage.foldername(name))[1]`

#### Policy 4: photos_delete_own_folder
- [ ] **Operation**: DELETE
- [ ] **USING clause**: Contains `auth.uid()::text = (storage.foldername(name))[1]`

### 4. ✅ Policy Details

**Location**: Supabase Dashboard → SQL Editor

Run this query to inspect all policies:

```sql
SELECT
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE 'photos_%'
ORDER BY policyname;
```

**Expected result**: 4 rows with policy details

- [ ] All 4 policies are returned
- [ ] Each policy has appropriate `qual` and/or `with_check` clauses

## Detailed Verification

### Test 1: Policy Enforcement (Manual)

**Objective**: Verify that RLS policies correctly isolate user folders

**Prerequisites**:
- Two test users created in Supabase Auth
- Supabase client configured in browser console or test script

**Steps**:

1. **Create test users** (if not already created):
   - User A: `test-user-a@example.com`
   - User B: `test-user-b@example.com`

2. **Authenticate as User A**:
   ```javascript
   const { data: { user } } = await supabase.auth.getUser();
   console.log('User A ID:', user.id);
   ```

3. **Upload a file as User A**:
   ```javascript
   const testFile = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });
   const path = `${user.id}/test-page-id/test.jpg`;

   const { data, error } = await supabase.storage
     .from('notebook-photos')
     .upload(path, testFile);

   console.log('Upload result:', data, error);
   ```

   - [ ] Upload succeeds (`data` is not null, `error` is null)
   - [ ] File appears in storage at the correct path

4. **Try to read the file as User A**:
   ```javascript
   const { data, error } = await supabase.storage
     .from('notebook-photos')
     .list(user.id);

   console.log('List result:', data, error);
   ```

   - [ ] List succeeds and shows the uploaded file

5. **Sign out and authenticate as User B**:
   ```javascript
   await supabase.auth.signOut();
   // Sign in as User B
   const { data: { user: userB } } = await supabase.auth.getUser();
   console.log('User B ID:', userB.id);
   ```

6. **Try to read User A's folder as User B**:
   ```javascript
   // Try to list User A's files
   const { data, error } = await supabase.storage
     .from('notebook-photos')
     .list(userAId); // Use User A's ID

   console.log('Cross-user list result:', data, error);
   ```

   - [ ] List returns empty array or error (User B should not see User A's files)

7. **Try to upload to User A's folder as User B**:
   ```javascript
   const testFile = new File(['malicious'], 'hack.jpg', { type: 'image/jpeg' });
   const path = `${userAId}/test-page-id/hack.jpg`; // User A's folder

   const { data, error } = await supabase.storage
     .from('notebook-photos')
     .upload(path, testFile);

   console.log('Cross-user upload result:', data, error);
   ```

   - [ ] Upload fails with permission error (User B cannot write to User A's folder)

8. **Clean up**:
   - Delete test files
   - Optionally delete test users

**Result**:
- [ ] ✅ Users can only access their own folders
- [ ] ✅ Cross-user access is blocked by RLS policies

### Test 2: File Type Validation

**Objective**: Verify that only allowed file types can be uploaded

**Steps**:

1. **Authenticate as test user**

2. **Try to upload an allowed file type (JPEG)**:
   ```javascript
   const jpgFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
   const path = `${userId}/page-id/${Date.now()}_test.jpg`;

   const { data, error } = await supabase.storage
     .from('notebook-photos')
     .upload(path, jpgFile);
   ```

   - [ ] Upload succeeds

3. **Try to upload a disallowed file type (PDF)**:
   ```javascript
   const pdfFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
   const path = `${userId}/page-id/${Date.now()}_test.pdf`;

   const { data, error } = await supabase.storage
     .from('notebook-photos')
     .upload(path, pdfFile);
   ```

   - [ ] Upload fails (extension not in allowed list)

4. **Try other allowed types**:
   - [ ] PNG: succeeds
   - [ ] GIF: succeeds
   - [ ] WebP: succeeds

**Result**:
- [ ] ✅ Only allowed image types can be uploaded
- [ ] ✅ Disallowed file types are rejected

### Test 3: Folder Structure Enforcement

**Objective**: Verify that the folder structure convention is enforced

**Steps**:

1. **Authenticate as test user**

2. **Try to upload with correct folder structure**:
   ```javascript
   const path = `${userId}/page-id-123/${Date.now()}_photo.jpg`;
   // Upload succeeds (verified in Test 1)
   ```

   - [ ] Upload succeeds

3. **Try to upload without user ID folder**:
   ```javascript
   const path = `page-id-123/${Date.now()}_photo.jpg`;
   const { data, error } = await supabase.storage
     .from('notebook-photos')
     .upload(path, testFile);
   ```

   - [ ] Upload fails (no user ID in path)

4. **Try to upload to root**:
   ```javascript
   const path = `photo.jpg`;
   const { data, error } = await supabase.storage
     .from('notebook-photos')
     .upload(path, testFile);
   ```

   - [ ] Upload fails (no folder structure)

**Result**:
- [ ] ✅ Folder structure `{userId}/{pageId}/{filename}` is required
- [ ] ✅ Invalid paths are rejected

## Automated Verification (SQL)

Run these queries in the SQL Editor to verify configuration:

### Query 1: Count Storage Policies

```sql
SELECT COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE 'photos_%';
```

**Expected result**: `policy_count = 4`

### Query 2: Check Policy Coverage

```sql
SELECT
    cmd,
    COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE 'photos_%'
GROUP BY cmd
ORDER BY cmd;
```

**Expected result**:
```
cmd    | policy_count
-------+--------------
DELETE | 1
INSERT | 1
SELECT | 1
UPDATE | 1
```

### Query 3: Verify Bucket Configuration

```sql
-- Note: This query may not work on all Supabase versions
-- Use the dashboard Storage section to verify bucket configuration
SELECT
    name,
    public
FROM storage.buckets
WHERE name = 'notebook-photos';
```

**Expected result**:
```
name             | public
-----------------+--------
notebook-photos  | false
```

## Integration Verification

Once the application code is implemented (T049-T054), verify:

### Frontend Integration

- [ ] Photo upload button renders correctly
- [ ] File picker opens when clicking upload button
- [ ] File size validation (10 MB) works client-side
- [ ] File type validation works client-side
- [ ] Upload progress indicator shows during upload
- [ ] Success toast appears after successful upload
- [ ] Error toast appears after failed upload
- [ ] Uploaded photo appears inline in the editor
- [ ] Photo lightbox opens on click
- [ ] Photo deletion works (removes from storage and DB)

### Backend Integration

- [ ] Signed URLs are generated with correct TTL
- [ ] Signed URLs provide access to private files
- [ ] Expired signed URLs return 403 Forbidden
- [ ] Storage path matches database `photos.storage_path`
- [ ] Photo metadata is stored in `photos` table
- [ ] Cascade delete removes photos when page is deleted

### Security Verification

- [ ] Unauthenticated users cannot upload files
- [ ] Unauthenticated users cannot access files (even with direct URL)
- [ ] Users cannot access other users' files
- [ ] Users cannot upload to other users' folders
- [ ] File type restrictions are enforced
- [ ] Service role key is not exposed in client code

## Troubleshooting

### Issue: "Bucket not found"

**Cause**: The bucket hasn't been created yet

**Solution**:
1. Run `./scripts/create-storage-bucket.sh`
2. Or create manually via dashboard: Storage → New bucket

### Issue: "New row violates row-level security policy"

**Cause**: RLS policies are blocking the operation

**Check**:
1. User is authenticated: `auth.uid()` returns the user's ID
2. Storage path starts with user's ID: `{userId}/...`
3. File extension is in allowed list

**Solution**: Verify the upload path format and authentication state

### Issue: "Permission denied for table objects"

**Cause**: RLS is enabled but policies are missing

**Solution**:
1. Run `./scripts/apply-storage-policies.sh`
2. Or apply manually via SQL Editor

### Issue: Policies exist but uploads still fail

**Cause**: Policy logic may be incorrect

**Check**:
1. Inspect policy `qual` and `with_check` clauses in SQL
2. Verify `storage.foldername()` function is working correctly
3. Test with SQL: `SELECT storage.foldername('user-id/page-id/file.jpg');`

**Expected**: Returns `{user-id, page-id}`

## Completion Checklist

Before marking T009 as complete:

- [ ] Storage bucket `notebook-photos` created and set to private
- [ ] RLS enabled on `storage.objects` table
- [ ] All 4 storage policies created and active
- [ ] Policies correctly enforce per-user folder isolation
- [ ] File type restrictions work as expected
- [ ] Documentation created: `docs/storage-setup.md`
- [ ] Helper scripts created: `scripts/create-storage-bucket.sh`, `scripts/apply-storage-policies.sh`
- [ ] Verification guide created: `docs/storage-verification.md`
- [ ] README updated with storage setup reference

## Next Steps

After completing T009:

1. ✅ **T008 Complete** - Database schema applied
2. ✅ **T009 Complete** - Storage configured
3. 🔧 **T010 Next** - Create Supabase browser client factory
4. 🔧 **T011 Next** - Create Supabase server client factory

---

**Last Updated**: 2026-04-17
**Task**: T009 — Configure Supabase Storage
