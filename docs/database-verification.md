# Database Schema Verification Checklist

Use this checklist to verify that the database schema was applied successfully to your Supabase instance.

## ✅ Tables Created

Log into your Supabase Dashboard → Table Editor and verify these 8 tables exist:

- [ ] **notebooks** - User notebook containers
- [ ] **pages** - Individual notebook pages
- [ ] **tasks** - Task items within pages
- [ ] **reminders** - Task/page reminders
- [ ] **labels** - User-created labels
- [ ] **page_labels** - Many-to-many page↔label junction
- [ ] **photos** - Uploaded images metadata
- [ ] **drawings** - Excalidraw canvas data

## ✅ Row Level Security (RLS) Enabled

For each table above, verify RLS is enabled:

1. Go to Table Editor
2. Click on a table
3. Click the "RLS" tab
4. Verify: "Row Level Security: Enabled"

Expected policies per table:

### notebooks
- [ ] notebooks_select (FOR SELECT)
- [ ] notebooks_insert (FOR INSERT)
- [ ] notebooks_update (FOR UPDATE)
- [ ] notebooks_delete (FOR DELETE)

### pages
- [ ] pages_select (FOR SELECT)
- [ ] pages_insert (FOR INSERT)
- [ ] pages_update (FOR UPDATE)
- [ ] pages_delete (FOR DELETE)

### tasks
- [ ] tasks_select (FOR SELECT)
- [ ] tasks_insert (FOR INSERT)
- [ ] tasks_update (FOR UPDATE)
- [ ] tasks_delete (FOR DELETE)

### reminders
- [ ] reminders_select (FOR SELECT)
- [ ] reminders_insert (FOR INSERT)
- [ ] reminders_update (FOR UPDATE)
- [ ] reminders_delete (FOR DELETE)

### labels
- [ ] labels_select (FOR SELECT)
- [ ] labels_insert (FOR INSERT)
- [ ] labels_update (FOR UPDATE)
- [ ] labels_delete (FOR DELETE)

### page_labels
- [ ] page_labels_select (FOR SELECT)
- [ ] page_labels_insert (FOR INSERT)
- [ ] page_labels_delete (FOR DELETE)

### photos
- [ ] photos_select (FOR SELECT)
- [ ] photos_insert (FOR INSERT)
- [ ] photos_delete (FOR DELETE)

### drawings
- [ ] drawings_select (FOR SELECT)
- [ ] drawings_insert (FOR INSERT)
- [ ] drawings_update (FOR UPDATE)
- [ ] drawings_delete (FOR DELETE)

## ✅ Functions Created

Go to SQL Editor and run this query to verify functions exist:

```sql
SELECT
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'extract_tiptap_text',
    'set_updated_at',
    'create_notebook_for_user',
    'search_pages',
    'get_due_reminders'
  )
ORDER BY routine_name;
```

Expected results (5 rows):

- [ ] **create_notebook_for_user** - FUNCTION
- [ ] **extract_tiptap_text** - FUNCTION
- [ ] **get_due_reminders** - FUNCTION
- [ ] **search_pages** - FUNCTION
- [ ] **set_updated_at** - FUNCTION

## ✅ Triggers Created

Run this query to verify triggers exist:

```sql
SELECT
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY trigger_name;
```

Expected results:

- [ ] **drawings_set_updated_at** on `drawings` (BEFORE UPDATE)
- [ ] **on_auth_user_created** on `users` (AFTER INSERT)
- [ ] **pages_search_vector_trigger** on `pages` (BEFORE INSERT OR UPDATE)
- [ ] **pages_set_updated_at** on `pages` (BEFORE UPDATE)
- [ ] **tasks_set_updated_at** on `tasks` (BEFORE UPDATE)

## ✅ Indexes Created

Run this query to verify key indexes exist:

```sql
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN (
    'notebooks', 'pages', 'tasks', 'reminders',
    'labels', 'page_labels', 'photos', 'drawings'
  )
ORDER BY tablename, indexname;
```

Verify these critical indexes exist:

- [ ] **idx_pages_notebook_sort** on pages(notebook_id, sort_order)
- [ ] **idx_pages_notebook_updated** on pages(notebook_id, updated_at DESC)
- [ ] **idx_pages_notebook_created** on pages(notebook_id, created_at DESC)
- [ ] **idx_pages_search_vector** on pages using GIN (search_vector)
- [ ] **idx_tasks_page_sort** on tasks(page_id, sort_order)
- [ ] **idx_tasks_due** on tasks(due_at) WHERE due_at IS NOT NULL AND checked = false
- [ ] **idx_reminders_user_fire** on reminders(user_id, fire_at) WHERE status = 'pending'

## ✅ Functional Tests

### Test 1: Search Function

Run this in SQL Editor:

```sql
SELECT * FROM search_pages('test');
```

- [ ] Query executes without error
- [ ] Returns empty result set (no error about missing function)

### Test 2: Reminders Function

Run this in SQL Editor:

```sql
SELECT * FROM get_due_reminders();
```

- [ ] Query executes without error
- [ ] Returns empty result set (no error about missing function)

### Test 3: Tiptap Text Extraction

Run this in SQL Editor:

```sql
SELECT extract_tiptap_text('{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Hello World"}]}]}'::jsonb);
```

- [ ] Query executes without error
- [ ] Returns: " Hello World"

### Test 4: Auto-Create Notebook Trigger

This will be tested automatically when a user signs up. For now, verify the trigger exists:

```sql
SELECT
  trigger_name,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
```

- [ ] Returns 1 row with trigger on `auth.users` table
- [ ] Action statement includes `create_notebook_for_user()`

## ✅ Table Structure Validation

### notebooks table

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'notebooks'
ORDER BY ordinal_position;
```

Expected columns:
- [ ] id (uuid, NOT NULL, gen_random_uuid())
- [ ] user_id (uuid, NOT NULL)
- [ ] created_at (timestamp with time zone, NOT NULL, now())

### pages table

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'pages'
ORDER BY ordinal_position;
```

Expected columns:
- [ ] id, notebook_id, title, content, sort_order, created_at, updated_at, search_vector

### tasks table

Expected columns:
- [ ] id, page_id, task_index, text, checked, due_at, sort_order, created_at, updated_at

### reminders table

Expected columns:
- [ ] id, user_id, task_id, page_id, fire_at, status, created_at

### labels table

Expected columns:
- [ ] id, user_id, name, color, created_at

### page_labels table

Expected columns:
- [ ] page_id, label_id

### photos table

Expected columns:
- [ ] id, page_id, user_id, storage_path, filename, mime_type, size_bytes, created_at

### drawings table

Expected columns:
- [ ] id, page_id, elements, app_state, created_at, updated_at

## ✅ Constraints Validation

Run this to check constraints:

```sql
SELECT
  tc.constraint_name,
  tc.table_name,
  tc.constraint_type,
  kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
WHERE tc.table_schema = 'public'
  AND tc.table_name IN (
    'notebooks', 'pages', 'tasks', 'reminders',
    'labels', 'page_labels', 'photos', 'drawings'
  )
ORDER BY tc.table_name, tc.constraint_type;
```

Verify key constraints exist:

- [ ] notebooks: user_id UNIQUE constraint
- [ ] tasks: (page_id, task_index) UNIQUE constraint
- [ ] labels: (user_id, name) UNIQUE constraint
- [ ] page_labels: (page_id, label_id) PRIMARY KEY
- [ ] photos: size_bytes CHECK constraint (≤ 10485760)
- [ ] reminders: status CHECK constraint (in 'pending', 'dismissed', 'snoozed')
- [ ] reminders: reminder_must_have_parent CHECK constraint

## Final Verification

If all checkboxes above are checked ✅, the database schema has been successfully applied!

## Troubleshooting

If any items are missing:

1. **Functions/Triggers missing**: Re-run the schema SQL
2. **RLS not enabled**: For each table, run:
   ```sql
   ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
   ```
3. **Policies missing**: Re-run the schema SQL
4. **Indexes missing**: Re-run the schema SQL

## Next Steps

After verification is complete:

1. ✅ Mark T008 as complete
2. 📦 Move to T009: Configure Supabase Storage bucket
3. 🔧 Continue with Phase 2 foundational tasks (T010-T024)

See `specs/001-ledger-notebook-app/tasks.md` for the complete task list.
