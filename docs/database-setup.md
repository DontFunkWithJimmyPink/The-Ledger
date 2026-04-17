# Database Schema Setup Guide

This guide explains how to apply the database schema to your Supabase instance for The Ledger application.

## Quick Start (Recommended)

### Option 1: Using Supabase SQL Editor (Web UI)

1. **Login to Supabase Dashboard**
   - Navigate to: https://fqnnpjnblesdubpjsbof.supabase.co/
   - Or your project URL: https://app.supabase.com/project/YOUR_PROJECT_ID

2. **Open SQL Editor**
   - From the left sidebar, click on **SQL Editor**
   - Click **New Query**

3. **Copy and Execute Schema**
   - Open the file: `specs/001-ledger-notebook-app/contracts/database-schema.sql`
   - Copy the entire contents
   - Paste into the SQL Editor
   - Click **Run** or press `Ctrl+Enter` (Windows/Linux) or `Cmd+Enter` (Mac)

4. **Verify Success**
   - You should see "Success. No rows returned" message
   - Check the **Table Editor** to verify tables were created:
     - notebooks
     - pages
     - tasks
     - reminders
     - labels
     - page_labels
     - photos
     - drawings

### Option 2: Using Command Line (psql)

If you have PostgreSQL client tools installed locally:

```bash
# Set your password as an environment variable
export SUPABASE_PASSWORD="20syPnkP76cRWS8H"

# Run the script
./scripts/apply-database-schema.sh
```

Alternatively, apply directly using `psql`:

```bash
PGPASSWORD="20syPnkP76cRWS8H" psql \
  -h db.fqnnpjnblesdubpjsbof.supabase.co \
  -p 5432 \
  -U postgres \
  -d postgres \
  -f specs/001-ledger-notebook-app/contracts/database-schema.sql
```

### Option 3: Using Supabase CLI

If you have the Supabase CLI installed:

```bash
# Link to your project (one-time setup)
supabase link --project-ref fqnnpjnblesdubpjsbof

# Apply the schema
supabase db push --db-url "postgresql://postgres:20syPnkP76cRWS8H@db.fqnnpjnblesdubpjsbof.supabase.co:5432/postgres" < specs/001-ledger-notebook-app/contracts/database-schema.sql
```

## What Gets Created

### Tables

| Table | Purpose | Key Features |
|-------|---------|--------------|
| **notebooks** | User's main notebook container | RLS enabled, auto-created on signup |
| **pages** | Individual notebook pages | Full-text search, sort ordering, RLS |
| **tasks** | Task items within pages | Checkbox state, due dates, RLS |
| **reminders** | Task/page reminders | Fire time, status tracking, RLS |
| **labels** | User-created labels | Color coding, RLS |
| **page_labels** | Many-to-many page↔label | RLS |
| **photos** | Uploaded images | 10MB size limit, RLS |
| **drawings** | Excalidraw canvas data | Page-linked, RLS |

### Functions

- `extract_tiptap_text(content JSONB)` - Extracts plain text from Tiptap JSON
- `set_updated_at()` - Auto-updates `updated_at` timestamps
- `create_notebook_for_user()` - Creates notebook on user signup
- `search_pages(search_query text)` - Full-text search with ranking
- `get_due_reminders()` - Fetches pending reminders for current user

### Triggers

- `on_auth_user_created` - Auto-creates notebook when user signs up
- `pages_set_updated_at` - Updates `updated_at` on page changes
- `pages_search_vector_trigger` - Maintains full-text search index
- `tasks_set_updated_at` - Updates `updated_at` on task changes
- `drawings_set_updated_at` - Updates `updated_at` on drawing changes

### Row Level Security (RLS)

All tables have RLS enabled with policies ensuring:
- Users can only access their own data
- Notebook-linked tables (pages, tasks, etc.) are scoped by notebook ownership
- Label assignments respect both page and label ownership

### Indexes

Optimized for:
- Page sorting (by `sort_order`, `created_at`, `updated_at`)
- Full-text search (GIN index on `search_vector`)
- Task due dates
- Reminder queries by user and fire time

## Verification

After applying the schema, verify it worked:

### Check Tables Exist

In Supabase Dashboard → Table Editor, you should see all 8 tables:
- notebooks
- pages
- tasks
- reminders
- labels
- page_labels
- photos
- drawings

### Check RLS is Enabled

In Supabase Dashboard → Table Editor → Select any table → Click "RLS" tab:
- Should show "Row Level Security: Enabled"
- Should show multiple policies (SELECT, INSERT, UPDATE, DELETE)

### Test the Trigger

The `on_auth_user_created` trigger should automatically create a notebook when a user signs up. You can test this by:

1. Creating a test user via Supabase Auth
2. Checking the `notebooks` table for a new row with that user's ID

### Test Search Function

Run this in SQL Editor to test the search function:

```sql
-- This should return an empty result set but not error
SELECT * FROM search_pages('test');
```

## Troubleshooting

### "relation already exists" errors

If you see errors about tables/functions already existing:
- The schema may have been partially applied
- You can either:
  1. Drop the existing objects manually
  2. Modify the schema file to use `CREATE OR REPLACE` / `DROP IF EXISTS`
  3. Create a fresh Supabase project

### Connection refused / timeout errors

- Verify your Supabase project is running
- Check that you're using the correct connection details
- Ensure your IP is not blocked (Supabase allows all IPs by default)

### Permission denied errors

- Ensure you're using the `postgres` user (not the service role key)
- Check that the password is correct

### RLS blocking all queries

If you can't query tables after applying the schema:
- RLS is working correctly! This is expected behavior
- Queries will only work when authenticated as a user
- The application will handle authentication via Supabase client

## Next Steps

After successfully applying the database schema:

1. ✅ **T008 Complete** - Database schema applied
2. 📦 **T009 Next** - Configure Supabase Storage bucket
3. 🔧 **T010-T024** - Implement application code that uses these tables

## Connection Details Reference

For your reference (keep these secure!):

```
Project URL: https://fqnnpjnblesdubpjsbof.supabase.co/
Database Host: db.fqnnpjnblesdubpjsbof.supabase.co
Port: 5432
Database: postgres
User: postgres
Password: 20syPnkP76cRWS8H
```

⚠️ **Security Note**: In production, use environment variables and never commit credentials to git!
