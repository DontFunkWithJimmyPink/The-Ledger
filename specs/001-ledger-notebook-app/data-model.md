# Data Model: The Ledger — Digital Notebook App

**Phase**: 1 | **Feature**: `001-ledger-notebook-app` | **Date**: 2026-04-16

---

## Entity Overview

```
auth.users (Supabase-managed)
    │
    └── notebooks (1:1 per user, auto-created on signup)
            │
            ├── pages (1:many — individual notebook entries)
            │       ├── tasks      (1:many — checklist items within a page)
            │       ├── photos     (1:many — uploaded image metadata)
            │       └── drawings   (1:1 per page — Excalidraw canvas state)
            │
            └── labels (1:many per user — tags for pages)
                    └── page_labels (many:many join — pages ↔ labels)

reminders (1:many from tasks — scheduled notifications)
```

---

## Table Definitions

### `notebooks`

One notebook per user. Auto-created by a Supabase trigger when a new auth user is confirmed.

| Column       | Type          | Constraints                                              | Description        |
| ------------ | ------------- | -------------------------------------------------------- | ------------------ |
| `id`         | `uuid`        | PK, DEFAULT `gen_random_uuid()`                          | Unique notebook ID |
| `user_id`    | `uuid`        | NOT NULL, UNIQUE, FK → `auth.users.id` ON DELETE CASCADE | Owner              |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT `now()`                                | Creation timestamp |

**RLS Policies**: SELECT / UPDATE — `auth.uid() = user_id`.

---

### `pages`

An individual notebook entry. Can contain Tiptap rich text (which may include inline task lists
and photo embeds), a linked drawing, and associated standalone tasks.

| Column          | Type          | Constraints                                     | Description                                              |
| --------------- | ------------- | ----------------------------------------------- | -------------------------------------------------------- |
| `id`            | `uuid`        | PK, DEFAULT `gen_random_uuid()`                 | Unique page ID                                           |
| `notebook_id`   | `uuid`        | NOT NULL, FK → `notebooks.id` ON DELETE CASCADE | Parent notebook                                          |
| `title`         | `text`        | NOT NULL, DEFAULT `'Untitled'`                  | Page title (editable inline)                             |
| `content`       | `jsonb`       | NOT NULL, DEFAULT `'{}'`                        | Tiptap JSON (rich text + inline task lists + image refs) |
| `sort_order`    | `text`        | NOT NULL, DEFAULT `'a0'`                        | Fractional index for page ordering in the notebook list  |
| `created_at`    | `timestamptz` | NOT NULL, DEFAULT `now()`                       | Creation timestamp                                       |
| `updated_at`    | `timestamptz` | NOT NULL, DEFAULT `now()`                       | Last modified (updated by trigger)                       |
| `search_vector` | `tsvector`    | GENERATED (trigger-maintained)                  | Full-text search index over title + content text         |

**Indexes**:

- `GIN(search_vector)` — full-text keyword search (FR-013).
- `btree(notebook_id, sort_order)` — ordered page listing (FR-012).
- `btree(notebook_id, updated_at DESC)` — sort by last modified (FR-012).
- `btree(notebook_id, created_at DESC)` — sort by creation date (FR-012).

**RLS Policies**: All operations scoped via `notebook_id IN (SELECT id FROM notebooks WHERE user_id = auth.uid())`.

**Trigger**: `updated_at` auto-updated on every row change via a `BEFORE UPDATE` trigger.

**Trigger**: `search_vector` maintained via `tsvector_update_trigger` on `title`, plus a custom
`extract_tiptap_text(content)` function result, combined into a single `tsvector` on INSERT/UPDATE.

---

### `tasks`

Checklist items within a page. Tiptap `taskItem` nodes in `pages.content` are the authoritative
display state; this table provides queryable metadata for reminders, filtering, and ordering.

> **Sync Note**: The autosave handler extracts `taskItem` nodes from Tiptap JSON and upserts
> matching rows here (matching on `page_id` + `task_index`). Deletions are handled by comparing
> the current JSON set against existing DB rows and issuing DELETEs for orphaned rows.

| Column       | Type          | Constraints                                 | Description                                                                 |
| ------------ | ------------- | ------------------------------------------- | --------------------------------------------------------------------------- |
| `id`         | `uuid`        | PK, DEFAULT `gen_random_uuid()`             | Unique task ID                                                              |
| `page_id`    | `uuid`        | NOT NULL, FK → `pages.id` ON DELETE CASCADE | Parent page                                                                 |
| `task_index` | `integer`     | NOT NULL                                    | Position index within the Tiptap `taskList` node (used for upsert matching) |
| `text`       | `text`        | NOT NULL                                    | Task text content (mirrored from Tiptap for querying)                       |
| `checked`    | `boolean`     | NOT NULL, DEFAULT `false`                   | Completion state                                                            |
| `due_at`     | `timestamptz` | NULLABLE                                    | Optional due date/time (FR-010)                                             |
| `sort_order` | `text`        | NOT NULL, DEFAULT `'a0'`                    | Fractional index for DnD reordering (FR-004)                                |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT `now()`                   | Creation timestamp                                                          |
| `updated_at` | `timestamptz` | NOT NULL, DEFAULT `now()`                   | Last modified                                                               |

**Indexes**:

- `btree(page_id, sort_order)` — ordered task listing within a page.
- `btree(due_at)` WHERE `due_at IS NOT NULL AND checked = false` — efficient reminder polling.

**RLS Policies**: All operations scoped via `page_id IN (SELECT id FROM pages WHERE notebook_id IN (SELECT id FROM notebooks WHERE user_id = auth.uid()))`.

---

### `reminders`

Scheduled notifications. A reminder can be attached to a task or directly to a page (e.g., a
"review this page by…" reminder).

| Column       | Type          | Constraints                                                                 | Description                       |
| ------------ | ------------- | --------------------------------------------------------------------------- | --------------------------------- |
| `id`         | `uuid`        | PK, DEFAULT `gen_random_uuid()`                                             | Unique reminder ID                |
| `user_id`    | `uuid`        | NOT NULL, FK → `auth.users.id` ON DELETE CASCADE                            | Owner (for fast polling query)    |
| `task_id`    | `uuid`        | NULLABLE, FK → `tasks.id` ON DELETE CASCADE                                 | Linked task (if task reminder)    |
| `page_id`    | `uuid`        | NULLABLE, FK → `pages.id` ON DELETE CASCADE                                 | Linked page (if page reminder)    |
| `fire_at`    | `timestamptz` | NOT NULL                                                                    | When the notification should fire |
| `status`     | `text`        | NOT NULL, DEFAULT `'pending'`, CHECK IN `('pending','dismissed','snoozed')` | Reminder state                    |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT `now()`                                                   | Creation timestamp                |

**Constraint**: `CHECK (task_id IS NOT NULL OR page_id IS NOT NULL)` — must be linked to something.

**Indexes**:

- `btree(user_id, fire_at)` WHERE `status = 'pending'` — used by the 30-second reminder poller.

**RLS Policies**: All operations — `auth.uid() = user_id`.

---

### `labels`

User-defined tags for organising pages.

| Column       | Type          | Constraints                                      | Description                                |
| ------------ | ------------- | ------------------------------------------------ | ------------------------------------------ |
| `id`         | `uuid`        | PK, DEFAULT `gen_random_uuid()`                  | Unique label ID                            |
| `user_id`    | `uuid`        | NOT NULL, FK → `auth.users.id` ON DELETE CASCADE | Owner                                      |
| `name`       | `text`        | NOT NULL                                         | Label display name (e.g., "Work", "Ideas") |
| `color`      | `text`        | NOT NULL, DEFAULT `'leather-300'`                | Tailwind token or hex colour for the badge |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT `now()`                        | Creation timestamp                         |

**Unique Constraint**: `UNIQUE(user_id, name)` — no duplicate label names per user.

**RLS Policies**: All operations — `auth.uid() = user_id`.

---

### `page_labels`

Many-to-many join between pages and labels (FR-014).

| Column     | Type   | Constraints                                  | Description |
| ---------- | ------ | -------------------------------------------- | ----------- |
| `page_id`  | `uuid` | NOT NULL, FK → `pages.id` ON DELETE CASCADE  |             |
| `label_id` | `uuid` | NOT NULL, FK → `labels.id` ON DELETE CASCADE |             |

**Primary Key**: `(page_id, label_id)`.

**RLS Policies**: SELECT — user owns the label or the page's notebook. INSERT/DELETE — user owns
both the label (`auth.uid() = labels.user_id`) and the page's notebook.

---

### `photos`

Metadata for uploaded images. The binary file lives in Supabase Storage; this table stores the
reference and display metadata.

| Column         | Type          | Constraints                                      | Description                                                         |
| -------------- | ------------- | ------------------------------------------------ | ------------------------------------------------------------------- |
| `id`           | `uuid`        | PK, DEFAULT `gen_random_uuid()`                  | Unique photo ID                                                     |
| `page_id`      | `uuid`        | NOT NULL, FK → `pages.id` ON DELETE CASCADE      | Parent page                                                         |
| `user_id`      | `uuid`        | NOT NULL, FK → `auth.users.id` ON DELETE CASCADE | Owner (for storage path construction)                               |
| `storage_path` | `text`        | NOT NULL                                         | Supabase Storage path: `{user_id}/{page_id}/{timestamp}_{filename}` |
| `filename`     | `text`        | NOT NULL                                         | Original filename                                                   |
| `mime_type`    | `text`        | NOT NULL                                         | e.g., `image/jpeg`, `image/png`                                     |
| `size_bytes`   | `integer`     | NOT NULL, CHECK `size_bytes <= 10485760`         | File size (max 10 MB — FR-019)                                      |
| `created_at`   | `timestamptz` | NOT NULL, DEFAULT `now()`                        | Upload timestamp                                                    |

**RLS Policies**: SELECT/DELETE scoped via `page_id IN (...)` chain up to `notebooks.user_id = auth.uid()`.

---

### `drawings`

Excalidraw canvas state for a page. One drawing canvas per page (v1 scope).

| Column       | Type          | Constraints                                         | Description                                 |
| ------------ | ------------- | --------------------------------------------------- | ------------------------------------------- |
| `id`         | `uuid`        | PK, DEFAULT `gen_random_uuid()`                     | Unique drawing ID                           |
| `page_id`    | `uuid`        | NOT NULL, UNIQUE, FK → `pages.id` ON DELETE CASCADE | Parent page (1:1)                           |
| `elements`   | `jsonb`       | NOT NULL, DEFAULT `'[]'`                            | Array of Excalidraw element objects         |
| `app_state`  | `jsonb`       | NOT NULL, DEFAULT `'{}'`                            | Excalidraw `AppState` (zoom, scroll, theme) |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT `now()`                           | Creation timestamp                          |
| `updated_at` | `timestamptz` | NOT NULL, DEFAULT `now()`                           | Last modified                               |

**RLS Policies**: All operations scoped via `page_id IN (...)` chain up to `notebooks.user_id = auth.uid()`.

---

## State Transitions

### Task Completion State

```
pending ──[user checks]──▶ completed
    ▲                          │
    └──[user unchecks]─────────┘
```

### Reminder Status

```
pending ──[fire_at reached + app open]──▶ [notification shown]
    │                                             │
    │                                   [user dismisses]
    │                                             ▼
    │                                         dismissed
    │
    └──[task marked complete]──▶ dismissed  (auto-dismiss on task completion)
```

---

## Supabase Helper Function

### `extract_tiptap_text(content JSONB) RETURNS text`

Used in the `search_vector` trigger to convert Tiptap JSON content to a plain-text string for
`tsvector` indexing. Recursively traverses the ProseMirror document tree and concatenates all
`text` node values.

```sql
CREATE OR REPLACE FUNCTION extract_tiptap_text(content JSONB)
RETURNS text LANGUAGE plpgsql AS $$
DECLARE
  result text := '';
  node   JSONB;
BEGIN
  IF content IS NULL THEN RETURN ''; END IF;
  IF content->>'type' = 'text' THEN
    RETURN coalesce(content->>'text', '');
  END IF;
  FOR node IN SELECT jsonb_array_elements(content->'content') LOOP
    result := result || ' ' || extract_tiptap_text(node);
  END LOOP;
  RETURN result;
END;
$$;
```

---

## Entity–Relationship Summary

```
auth.users
  id (PK)

notebooks
  id (PK)
  user_id → auth.users.id

pages
  id (PK)
  notebook_id → notebooks.id
  content (JSONB — Tiptap JSON)
  search_vector (tsvector)

tasks
  id (PK)
  page_id → pages.id
  due_at (nullable)
  sort_order (fractional index text)

reminders
  id (PK)
  user_id → auth.users.id
  task_id → tasks.id (nullable)
  page_id → pages.id (nullable)
  fire_at

labels
  id (PK)
  user_id → auth.users.id
  name, color

page_labels
  page_id → pages.id
  label_id → labels.id

photos
  id (PK)
  page_id → pages.id
  user_id → auth.users.id
  storage_path, size_bytes

drawings
  id (PK)
  page_id → pages.id (UNIQUE)
  elements (JSONB)
  app_state (JSONB)
```
