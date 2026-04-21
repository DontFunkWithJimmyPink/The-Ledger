/**
 * The Ledger — Shared TypeScript Interfaces
 *
 * These interfaces match the database schema defined in:
 * specs/001-ledger-notebook-app/contracts/database-schema.sql
 * specs/001-ledger-notebook-app/data-model.md
 *
 * All interfaces map column-for-column to their corresponding database tables.
 */

import type { ExcalidrawElement } from '@excalidraw/excalidraw/types/element/types';
import type { AppState } from '@excalidraw/excalidraw/types/types';

/**
 * Notebook
 *
 * One notebook per user. Auto-created by a Supabase trigger when a new auth user is confirmed.
 */
export interface Notebook {
  id: string; // uuid
  user_id: string; // uuid, FK → auth.users.id
  created_at: string; // timestamptz (ISO 8601 string)
}

/**
 * Page
 *
 * An individual notebook entry. Can contain Tiptap rich text (which may include inline task lists
 * and photo embeds), a linked drawing, and associated standalone tasks.
 */
export interface Page {
  id: string; // uuid
  notebook_id: string; // uuid, FK → notebooks.id
  title: string; // text, default 'Untitled'
  content: Record<string, any>; // jsonb - Tiptap JSON (ProseMirror format)
  sort_order: string; // text - fractional index for ordering
  created_at: string; // timestamptz (ISO 8601 string)
  updated_at: string; // timestamptz (ISO 8601 string)
  search_vector?: string; // tsvector - generated, not typically returned in queries
}

/**
 * Task
 *
 * Checklist items within a page. Tiptap `taskItem` nodes in `pages.content` are the authoritative
 * display state; this table provides queryable metadata for reminders, filtering, and ordering.
 */
export interface Task {
  id: string; // uuid
  page_id: string; // uuid, FK → pages.id
  task_index: number; // integer - position within Tiptap taskList
  text: string; // text - task content
  checked: boolean; // boolean, default false
  due_at: string | null; // timestamptz (ISO 8601 string) or null
  sort_order: string; // text - fractional index for DnD reordering
  created_at: string; // timestamptz (ISO 8601 string)
  updated_at: string; // timestamptz (ISO 8601 string)
}

/**
 * Reminder
 *
 * Scheduled notifications. A reminder can be attached to a task or directly to a page
 * (e.g., a "review this page by…" reminder).
 */
export interface Reminder {
  id: string; // uuid
  user_id: string; // uuid, FK → auth.users.id
  task_id: string | null; // uuid, FK → tasks.id or null
  page_id: string | null; // uuid, FK → pages.id or null
  fire_at: string; // timestamptz (ISO 8601 string)
  status: 'pending' | 'dismissed' | 'snoozed'; // text with CHECK constraint
  created_at: string; // timestamptz (ISO 8601 string)
}

/**
 * Label
 *
 * User-defined tags for organising pages.
 */
export interface Label {
  id: string; // uuid
  user_id: string; // uuid, FK → auth.users.id
  name: string; // text
  color: string; // text, default 'leather-300' (Tailwind token or hex colour)
  created_at: string; // timestamptz (ISO 8601 string)
}

/**
 * PageLabel
 *
 * Many-to-many join between pages and labels.
 */
export interface PageLabel {
  page_id: string; // uuid, FK → pages.id (composite PK)
  label_id: string; // uuid, FK → labels.id (composite PK)
}

/**
 * Photo
 *
 * Metadata for uploaded images. The binary file lives in Supabase Storage; this table stores
 * the reference and display metadata.
 */
export interface Photo {
  id: string; // uuid
  page_id: string; // uuid, FK → pages.id
  user_id: string; // uuid, FK → auth.users.id
  storage_path: string; // text - Supabase Storage path
  filename: string; // text - original filename
  mime_type: string; // text - e.g., 'image/jpeg', 'image/png'
  size_bytes: number; // integer - file size (max 10485760 = 10 MB)
  created_at: string; // timestamptz (ISO 8601 string)
}

/**
 * Drawing
 *
 * Excalidraw canvas state for a page. One drawing canvas per page (v1 scope).
 */
export interface Drawing {
  id: string; // uuid
  page_id: string; // uuid, FK → pages.id (UNIQUE - 1:1 relationship)
  elements: ExcalidrawElement[]; // jsonb - array of Excalidraw element objects
  app_state: Partial<AppState>; // jsonb - Excalidraw AppState (zoom, scroll, theme)
  created_at: string; // timestamptz (ISO 8601 string)
  updated_at: string; // timestamptz (ISO 8601 string)
}
