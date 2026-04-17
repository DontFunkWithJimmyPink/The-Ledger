# Database Scripts

This directory contains scripts for managing The Ledger database schema.

## Available Scripts

### `apply-database-schema.sh`

Bash script to apply the database schema using PostgreSQL command-line tools.

**Requirements:**
- `psql` PostgreSQL client installed
- Network access to Supabase

**Usage:**
```bash
SUPABASE_PASSWORD="your-password" ./scripts/apply-database-schema.sh
```

**Options:**
```bash
# Use a different Supabase URL
SUPABASE_URL="your-project.supabase.co" \
SUPABASE_PASSWORD="your-password" \
./scripts/apply-database-schema.sh
```

### `apply-schema.js`

Node.js script with instructions for applying the schema.

**Requirements:**
- Node.js installed

**Usage:**
```bash
SUPABASE_PASSWORD="your-password" node scripts/apply-schema.js
```

This script provides detailed instructions for applying the schema using various methods.

## Schema File Location

The database schema is located at:
```
specs/001-ledger-notebook-app/contracts/database-schema.sql
```

## Documentation

For detailed setup instructions, troubleshooting, and verification steps, see:
- [Database Setup Guide](../docs/database-setup.md)

## Task T008 Reference

This implements task T008 from `specs/001-ledger-notebook-app/tasks.md`:

> Apply complete database schema to Supabase — run specs/001-ledger-notebook-app/contracts/database-schema.sql in SQL Editor: creates notebooks, pages, tasks, reminders, labels, page_labels, photos, drawings tables with RLS policies, indexes, triggers (updated_at, search_vector via extract_tiptap_text), and the on-signup notebook-creation trigger

## Quick Start (Recommended Method)

The easiest way to apply the schema is via the Supabase web dashboard:

1. Go to https://app.supabase.com/project/YOUR_PROJECT_ID/sql
2. Click "New Query"
3. Copy the contents of `specs/001-ledger-notebook-app/contracts/database-schema.sql`
4. Paste into the editor
5. Click "Run"

See [Database Setup Guide](../docs/database-setup.md) for detailed instructions.
