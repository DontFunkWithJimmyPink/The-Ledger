# Research: The Ledger — Technology Decisions

**Phase**: 0 | **Feature**: `001-ledger-notebook-app` | **Date**: 2026-04-16

All technology decisions confirmed by the user before this phase. This document records the
rationale, alternatives considered, and integration patterns for each key decision.

---

## 1. Frontend Framework — Next.js 14 (App Router)

**Decision**: Next.js 14 with the App Router (React Server Components + Client Components).

**Rationale**:
- App Router enables per-route server rendering, reducing JS bundle sent to the client for
  static/read-heavy screens (page list, reminder view).
- Built-in Route Handlers replace the need for a separate Express/Fastify API layer.
- Vercel deployment is trivial (zero-config) and optimises Next.js automatically.
- TypeScript first-class support aligns with Constitution Principle III.

**Alternatives Considered**:
- *Create React App / Vite SPA*: No SSR, worse SEO/performance, no built-in routing.
- *Remix*: Good alternative, but Next.js 14 has broader ecosystem support and Vercel native deployment.
- *SvelteKit*: Smaller ecosystem; less compatible with Tiptap/Excalidraw React wrappers.

**Integration Pattern**: Server Components fetch initial data (pages list) via Supabase server client;
Client Components (`"use client"`) handle interactive editing, autosave, polling, and DnD.

---

## 2. Backend / Database — Supabase (Managed)

**Decision**: Supabase hosted cloud (free/pro tier). No custom servers.

**Rationale**:
- Provides PostgreSQL 15, Authentication, Storage, and Edge Functions in one managed platform.
- Hosted on AWS infrastructure → satisfies FR-018 (AWS hosting) without managing EC2/RDS.
- Row Level Security (RLS) enforces per-user data isolation at the database level → Constitution II.
- Supabase JS client (`@supabase/supabase-js`) works seamlessly in both server and browser contexts.
- Zero operational overhead: no server provisioning, patching, or scaling to manage.

**Alternatives Considered**:
- *AWS RDS + custom Express API*: Significantly more operational complexity for a personal app.
- *PlanetScale + custom API*: No built-in auth or storage; extra dependencies.
- *Firebase*: NoSQL (less suitable for relational notebook data); no native SQL search.

**Key Integration Patterns**:
- `@supabase/ssr` package used for cookie-based auth in Next.js App Router (server + browser clients).
- RLS policies use `auth.uid() = user_id` pattern on every table.
- Supabase client is never created with the service-role key on the browser.

---

## 3. Authentication — Supabase Auth (Email + Password)

**Decision**: Supabase Auth with email/password sign-up, sign-in, and password recovery.

**Rationale**:
- Built into Supabase — no additional service needed.
- `auth.uid()` available in RLS policies, enabling automatic data isolation.
- Account recovery (password reset via email) satisfies the spec requirement out of the box.
- `@supabase/ssr` handles session persistence via HTTP-only cookies in Next.js, preventing
  token exposure in localStorage (Constitution II).

**Alternatives Considered**:
- *OAuth (Google/GitHub)*: Deferred to v2 per spec assumptions.
- *Auth.js (NextAuth)*: Adds complexity; Supabase Auth is already included in the stack.
- *Clerk*: Third-party service; unnecessary dependency given Supabase Auth capabilities.

**Auth Flow**:
1. User submits email + password on `/login` or `/register`.
2. Supabase Auth issues a session cookie (via `/api/auth/callback` Route Handler).
3. Middleware on the Next.js server validates the session cookie on every request to `(app)/` routes.
4. Unauthenticated requests redirect to `/login`.

---

## 4. Rich Text Editor — Tiptap v2

**Decision**: Tiptap v2 with `StarterKit`, `TaskList`, `TaskItem`, `Image`, and `Placeholder` extensions.

**Rationale**:
- ProseMirror-based, headless — full control over styling to match the warm earthy aesthetic.
- `TaskList` + `TaskItem` extensions provide checkbox to-do items natively within the editor
  (FR-002, FR-003), stored as JSON with a `checked` boolean attribute per item.
- `Image` extension allows inline photo embedding within journal text (FR-006, FR-007).
- JSON output format (`editor.getJSON()`) stores cleanly as PostgreSQL JSONB.
- Active maintenance, React 18 compatible, large extension ecosystem.

**Extensions Required**:
| Extension | Package | Purpose |
|-----------|---------|---------|
| StarterKit | `@tiptap/starter-kit` | Bold, italic, headings, lists, blockquote, code |
| TaskList | `@tiptap/extension-task-list` | Checkbox task list container |
| TaskItem | `@tiptap/extension-task-item` | Individual checklist items with `checked` attribute |
| Image | `@tiptap/extension-image` | Inline image embedding via Supabase Storage URLs |
| Placeholder | `@tiptap/extension-placeholder` | "Start writing…" empty-state prompt |

**Alternatives Considered**:
- *Quill*: Older, less flexible styling, no task-list support out of the box.
- *Slate.js*: Lower-level, requires more custom extension work for task lists.
- *Lexical (Meta)*: Newer, strong alternative — Tiptap preferred for richer extension ecosystem.

**Auto-Save Pattern**: `onUpdate` callback → 500 ms `useAutosave` debounce → `supabase.from('pages').update({ content: editor.getJSON() })`. Saving indicator shown during in-flight request.

**Task Storage**: Tasks embedded in Tiptap JSON as `taskItem` nodes. Due-date/reminder data stored
in the separate `tasks` table (linked by `page_id` + `task_index`). On every autosave, the handler
extracts `taskItem` nodes from JSON and upserts matching rows in `tasks` for reminder tracking.

---

## 5. Drawing Canvas — Excalidraw

**Decision**: `@excalidraw/excalidraw` embedded as a dynamic-imported, SSR-disabled client component.

**Rationale**:
- Purpose-built vector/freehand drawing tool for the web; supports mouse and touch input (FR-008).
- Exports JSON state (`elements`, `appState`) that stores cleanly as PostgreSQL JSONB.
- `onChange` callback enables autosave of drawing state using the same debounce pattern as Tiptap.
- React 18 + Next.js 14 compatible when loaded via `next/dynamic` with `ssr: false`.

**SSR Handling**: Excalidraw is client-only (Canvas API, IndexedDB). Wrapped with:
```ts
const DrawingCanvas = dynamic(() => import('@/components/drawing/DrawingCanvas'), {
  loading: () => <SkeletonCanvas />,
  ssr: false,
})
```

**Persistence Pattern**: `{ elements: ExcalidrawElement[], appState: AppState }` stored as JSONB in
the `drawings` table. Initialised from the database via the `initialData` prop.

**Alternatives Considered**:
- *Fabric.js*: More of a general canvas library; requires more custom work for freehand drawing.
- *TLDraw*: Strong alternative; Excalidraw preferred for simpler integration and JSON schema.
- *Canvas 2D API (custom)*: Would require building from scratch; violates Simplicity First.

---

## 6. Drag-and-Drop Reordering — @dnd-kit

**Decision**: `@dnd-kit/core` + `@dnd-kit/sortable` for task and page reordering.

**Rationale**:
- React 18 Concurrent Mode compatible (react-beautiful-dnd is abandoned and breaks in Strict Mode).
- `@dnd-kit/sortable` provides the `SortableContext` + `useSortable` hook pattern with minimal
  boilerplate for vertical list reordering (FR-004).
- Modular: ~15 KB vs ~38 KB for react-beautiful-dnd.

**Order Persistence**: Fractional indexing (`fractional-indexing` npm package) — each item stores a
`sort_order TEXT` column. On drop, only the moved item's `sort_order` is updated (no bulk rewrite),
preventing N+1 update problems even with large lists. Pattern used by Figma and Linear.

**Alternatives Considered**:
- *react-beautiful-dnd*: Abandoned, React 18 incompatible.
- *Integer position*: Requires rewriting all subsequent items on every move — O(n) DB writes.

---

## 7. Full-Text Search — PostgreSQL tsvector

**Decision**: PostgreSQL `tsvector` column on `pages` with a `GIN` index, queried via Supabase
`.textSearch()` method.

**Rationale**:
- Already included in Supabase PostgreSQL — no additional search service needed (Simplicity First).
- `GIN` index on `tsvector` provides fast, ranked full-text search.
- A DB trigger auto-updates `search_vector` from `title` + extracted text from Tiptap JSON content
  on every insert/update.

**Extraction Pattern**: A PostgreSQL function `extract_tiptap_text(content JSONB)` recursively
walks the Tiptap JSON tree and concatenates text node values into a plain-text string used to build
the `tsvector`.

**Alternatives Considered**:
- *ILIKE search*: Simpler but no ranking, no stemming, no stop-word handling, slow at scale.
- *Algolia / Typesense*: External service; unnecessary complexity for personal-scale search.
- *Supabase Vector / pgvector*: Semantic search is overkill for keyword search in v1.

---

## 8. Content Sync — Polling

**Decision**: 30-second client-side polling via a `usePolling` hook (`setInterval` + Supabase query).

**Rationale**:
- Satisfies SC-006 (content visible on second device within 30 seconds of saving).
- Zero server-side infrastructure: no WebSocket server, no Supabase Realtime channels.
- Aligns with Constitution Principle I (Simplicity First).
- 30-second interval is imperceptible for a personal notebook and negligible on Supabase free tier.

**Polling Scope**: The `usePolling` hook on the page-list screen refetches `pages` metadata (title,
`updated_at`, sort order) every 30 seconds. On the page editor, a separate poll refetches full content
every 30 seconds when the tab is not in focus (paused when in focus, since autosave handles writes).

**Alternatives Considered**:
- *Supabase Realtime (WebSocket)*: More complex; not needed for a single-user personal app.
- *Server-Sent Events*: Still requires a persistent connection; complexity without benefit for v1.

---

## 9. Photo Storage — Supabase Storage

**Decision**: Supabase Storage bucket (`notebook-photos`) with per-user folder paths.

**Rationale**:
- Built into the Supabase stack — no S3 setup, IAM roles, or presigned URL server needed.
- Storage bucket RLS policies enforce `auth.uid() = foldername[1]` → per-user isolation.
- Direct browser upload to Supabase Storage (no proxying through Next.js server).
- 10 MB client-side validation before upload prevents wasted bandwidth (FR-019).

**Upload Flow**:
1. User selects file → client validates size ≤ 10 MB (error toast if exceeded).
2. `supabase.storage.from('notebook-photos').upload(\`${userId}/${pageId}/${timestamp}_${filename}\`, file)`.
3. Supabase returns `path` → stored in `photos` table.
4. A signed URL (1-hour TTL) or public URL is inserted into Tiptap content as an `<img>` node.

**Alternatives Considered**:
- *AWS S3 direct*: Requires custom presigned-URL backend; more infrastructure to manage.
- *Base64 in DB*: Bloats DB size; poor performance for large images.
- *Cloudinary*: Additional third-party service; cost and complexity not justified for v1.

---

## 10. Design System — Warm Earthy Palette

**Decision**: TailwindCSS with a custom theme extension (leather browns, cream, warm serif fonts).

**Rationale**:
- Tailwind provides utility-first styling that keeps component CSS co-located and consistent.
- Custom `tailwind.config.ts` theme extension defines the earthy colour palette and typography
  as named tokens — prevents magic hex values in components (Constitution III).
- `@fontsource/lora` (warm serif) + `@fontsource/inter` (clean sans-serif UI) loaded via
  `next/font` for performance.

**Colour Palette (Design Tokens)**:
| Token | Value | Use |
|-------|-------|-----|
| `leather-900` | `#3B1F0A` | Deep background accents, sidebar |
| `leather-700` | `#6B3A1F` | Primary button, active states |
| `leather-500` | `#A0522D` | Borders, dividers |
| `leather-300` | `#C8956C` | Hover states, icons |
| `cream-50` | `#FEFAEF` | Page background |
| `cream-100` | `#F5EDD8` | Card surfaces |
| `cream-200` | `#EDD9B8` | Input backgrounds |
| `ink-900` | `#1A1008` | Primary text |
| `ink-500` | `#4A3728` | Secondary text |

**Typography**: Body and editor text → `Lora` (serif, evokes a written notebook). UI labels,
navigation, metadata → `Inter` (neutral, legible at small sizes).

**Alternatives Considered**:
- *Custom CSS / CSS Modules*: More verbose; harder to enforce consistency across contributors.
- *Chakra UI / shadcn/ui*: Pre-built component libraries; earthy theme would require heavy
  overriding. Lighter to build primitives on top of Tailwind instead.

---

## 11. In-App Reminders — Client-Side Polling

**Decision**: `useReminders` hook polls Supabase for tasks where `fire_at <= NOW() AND status = 'pending'`
every 30 seconds while the app tab is open. Triggers a toast notification when found.

**Rationale**:
- Satisfies FR-011 (in-app notifications while app is open in a browser tab) and SC-008 (fires
  within 60 seconds).
- No push notification infrastructure required for v1.
- Simple: a single Supabase query, a toast library (`react-hot-toast`), and a `setInterval`.

**Edge Case — Tab Closed**: If the browser tab is closed, no notification fires. Spec assumption:
"In-app browser notifications are the primary reminder delivery mechanism; email or push notification
support is deferred to a future version." Overdue reminders are visually highlighted when the user
returns.

**Alternatives Considered**:
- *Web Push Notifications*: Requires service worker + push subscription; deferred to v2.
- *Supabase Edge Function cron*: Adds server-side complexity unnecessary for in-tab notifications.
