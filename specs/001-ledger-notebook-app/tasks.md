# Tasks: The Ledger — Digital Notebook App

**Input**: Design documents from `/specs/001-ledger-notebook-app/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Stack**: Next.js 14 (App Router) · TypeScript 5.x · Supabase (Auth, PostgreSQL 15, Storage) · Tiptap v2 · Excalidraw · TailwindCSS · @dnd-kit · fractional-indexing · react-hot-toast

**Organization**: Tasks grouped by user story — each story is independently implementable, testable, and deployable.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no blocking dependency)
- **[Story]**: Which user story this task serves (US1–US7)
- Exact file paths included in every task description

---

## Phase 1: Setup (Project Initialization)

**Purpose**: Bootstrap the Next.js project, install all dependencies, and configure tooling.

- [ ] T001 Initialize Next.js 14 App Router project with TypeScript strict mode — configure package.json with all dependencies from plan.md (next, @supabase/supabase-js, @supabase/ssr, @tiptap/react, @tiptap/starter-kit, @tiptap/extension-task-list, @tiptap/extension-task-item, @tiptap/extension-image, @tiptap/extension-placeholder, @excalidraw/excalidraw, @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities, fractional-indexing, react-hot-toast, tailwindcss, @fontsource/lora, @fontsource/inter)
- [ ] T002 [P] Configure TailwindCSS with warm-earthy custom theme tokens (leather-900/700/500/300, cream-50/100/200, ink-900/500) in tailwind.config.ts and initialize PostCSS
- [ ] T003 [P] Configure ESLint and Prettier — create .eslintrc.js (TypeScript rules, Next.js plugin) and .prettierrc; add lint and format scripts to package.json
- [ ] T004 [P] Configure Jest and React Testing Library — create jest.config.ts, jest.setup.ts; add test, test:watch, and test:coverage scripts to package.json
- [ ] T005 [P] Configure Playwright — create playwright.config.ts targeting localhost:3000; add test:e2e script to package.json
- [ ] T006 [P] Create .env.local.example documenting all required variables: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_APP_URL, NEXT_PUBLIC_POLL_INTERVAL_MS; add .env.local to .gitignore
- [ ] T007 Create full src/ directory skeleton per plan.md: src/app/(auth)/, src/app/(app)/, src/app/api/auth/callback/, src/components/ui/, src/components/editor/extensions/, src/components/drawing/, src/components/tasks/, src/components/photos/, src/components/reminders/, src/components/layout/, src/lib/supabase/, src/lib/hooks/, src/lib/utils/, src/types/, src/styles/, tests/unit/, tests/integration/, tests/e2e/

**Checkpoint**: `npm install` succeeds, `npm run lint` and `npm run type-check` pass on an empty project.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that ALL user stories depend on — Supabase schema, auth, shared types, design system, and utility hooks.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T008 Apply complete database schema to Supabase — run specs/001-ledger-notebook-app/contracts/database-schema.sql in SQL Editor: creates notebooks, pages, tasks, reminders, labels, page_labels, photos, drawings tables with RLS policies, indexes, triggers (updated_at, search_vector via extract_tiptap_text), and the on-signup notebook-creation trigger
- [ ] T009 Configure Supabase Storage — create private bucket `notebook-photos`; apply specs/001-ledger-notebook-app/contracts/storage-policies.sql (per-user folder RLS: `auth.uid() = foldername[1]`)
- [ ] T010 [P] Create Supabase browser client factory in src/lib/supabase/client.ts using `createBrowserClient` from @supabase/ssr; reads NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
- [ ] T011 [P] Create Supabase server client factory in src/lib/supabase/server.ts using `createServerClient` from @supabase/ssr with cookie-based session handling for Next.js App Router Server Components and Route Handlers
- [ ] T012 Create Next.js auth middleware in src/middleware.ts — validates session cookie on every `(app)/` route request; redirects unauthenticated requests to /login using server Supabase client
- [ ] T013 Create auth callback Route Handler in src/app/api/auth/callback/route.ts — exchanges `code` query param for session cookie via `supabase.auth.exchangeCodeForSession(code)`; redirects to `next` path on success or `/login?error=auth_callback_failed` on failure
- [ ] T014 [P] Define all shared TypeScript interfaces in src/types/index.ts: Notebook, Page, Task, Reminder, Photo, Drawing, Label, PageLabel — matching the data-model.md schema column-for-column
- [ ] T015 [P] Create CSS design tokens in src/styles/design-tokens.css (CSS custom properties for leather/cream/ink palette and Lora/Inter fonts); extend tailwind.config.ts with all named tokens from research.md §10
- [ ] T016 Create root layout in src/app/layout.tsx — load @fontsource/lora and @fontsource/inter via next/font; set HTML metadata; wrap children in `<Providers>` (Toaster from react-hot-toast); import globals.css
- [ ] T017 Create src/app/globals.css — Tailwind base directives + design token CSS variable overrides from src/styles/design-tokens.css
- [ ] T018 [P] Create primitive UI components in src/components/ui/: Button.tsx (variants: primary/secondary/ghost), Input.tsx (label, error state), Modal.tsx (portal-based), Badge.tsx (color prop), Tooltip.tsx; export all from src/components/ui/index.ts
- [ ] T019 [P] Create fractional indexing utility in src/lib/utils/fractional-index.ts — thin wrapper around the `fractional-indexing` npm package exposing `generateKeyBetween` for task and page sort_order updates
- [ ] T020 [P] Create content utility in src/lib/utils/content.ts — implement `extractTiptapText(content: JSON): string` that recursively walks Tiptap JSON and concatenates text nodes; implement `extractTaskItems(content: JSON): TaskItemData[]` that returns taskItem nodes with index, text, and checked state for autosave sync
- [ ] T021 Create authentication pages: src/app/(auth)/login/page.tsx (email + password sign-in form calling `supabase.auth.signInWithPassword`), src/app/(auth)/register/page.tsx (sign-up form calling `supabase.auth.signUp`), src/app/(auth)/recover/page.tsx (reset request + confirmation form calling `supabase.auth.resetPasswordForEmail` and `supabase.auth.updateUser`)
- [ ] T022 Create authenticated app shell: src/app/(app)/layout.tsx (flex layout with Sidebar + main content area); src/components/layout/Sidebar.tsx (page list navigation + label filter placeholder); src/components/layout/TopBar.tsx (search bar + user menu + reminder bell placeholder); src/components/layout/PageListItem.tsx (single page row with title and updated_at)
- [ ] T023 [P] Create generic polling hook in src/lib/hooks/use-polling.ts — accepts a callback and interval (default NEXT_PUBLIC_POLL_INTERVAL_MS || 30000), runs `setInterval`, pauses when `document.hidden`, cleans up on unmount
- [ ] T024 [P] Create autosave hook in src/lib/hooks/use-autosave.ts — accepts a save callback and 500 ms debounce delay; exposes `status: 'idle' | 'saving' | 'saved' | 'error'`; retries once after 2 s on failure then emits error status for toast display

**Checkpoint**: Foundation complete — Supabase schema applied, auth flow works (sign-up → email confirm → redirect → /notebook), shared types compile, all UI primitives render.

---

## Phase 3: User Story 1 — Create and Manage Tasks & To-Do Lists (Priority: P1) 🎯 MVP

**Goal**: Users can create a notebook page, add checklist tasks via the Tiptap editor, check/uncheck tasks, reorder them via drag-and-drop, and return later to see their saved state.

**Independent Test**: Create a new page, add 3 tasks ("Buy milk", "Call dentist", "Read a book"), check off the second task, drag the third above the first — refresh the page and confirm order and checked state are preserved.

### Implementation for User Story 1

- [ ] T025 [P] [US1] Create notebook home page in src/app/(app)/notebook/page.tsx — Server Component that fetches all pages for the user's notebook (ordered by sort_order); renders list of PageListItem components; includes "New Page" button that calls `from('pages').insert(...)` and redirects to the new page
- [ ] T026 [P] [US1] Create page editor route in src/app/(app)/notebook/[pageId]/page.tsx — Server Component fetches full page data via `from('pages').select('*').eq('id', pageId).single()`; passes initial content to PageEditor client component; displays page title with inline editing
- [ ] T027 [P] [US1] Create CustomTaskItem Tiptap extension in src/components/editor/extensions/CustomTaskItem.ts — extends `@tiptap/extension-task-item` to store and render a `dueDate` attribute alongside the standard `checked` attribute
- [ ] T028 [US1] Create PageEditor component in src/components/editor/PageEditor.tsx — `"use client"` component initialising Tiptap with StarterKit, TaskList, TaskItem (using CustomTaskItem), Placeholder; accepts `pageId` and `initialContent`; wires `onUpdate` to `useAutosave` → `from('pages').update({ content })` + task upsert logic via `extractTaskItems`
- [ ] T029 [US1] Create EditorToolbar in src/components/editor/EditorToolbar.tsx — renders Bold, Italic, Heading 1/2, BulletList, TaskList toggle buttons using Tiptap `editor.chain()` commands; shows active state via `editor.isActive()`
- [ ] T030 [P] [US1] Create standalone sortable TaskList container in src/components/tasks/TaskList.tsx — wraps @dnd-kit `DndContext` + `SortableContext` for a vertical list of TaskItem components; on `onDragEnd` calls `generateKeyBetween` and `from('tasks').update({ sort_order })`
- [ ] T031 [P] [US1] Create TaskItem component in src/components/tasks/TaskItem.tsx — renders checkbox (toggles `checked` via `from('tasks').update({ checked })`), task text, and a due-date display area; uses `useSortable` from @dnd-kit/sortable for drag handle; visually distinguishes completed tasks (strikethrough + muted colour)
- [ ] T032 [US1] Wire full autosave cycle in src/components/editor/PageEditor.tsx — on every Tiptap `onUpdate`: (1) debounce-save `pages.content`, (2) call `extractTaskItems`, (3) upsert all task rows via `from('tasks').upsert(...)`, (4) delete orphaned task rows via `from('tasks').delete().not('task_index', 'in', activeIndexes)`
- [ ] T033 [US1] Implement page reordering in src/app/(app)/notebook/page.tsx — wrap page list in @dnd-kit DndContext; on drag end use `generateKeyBetween` for new `sort_order` and call `from('pages').update({ sort_order })`
- [ ] T034 [US1] Add save status indicator in src/components/editor/PageEditor.tsx — display "Saving…" / "Saved" / "Save failed — retrying" badge below the toolbar based on `useAutosave` status; show react-hot-toast on persistent error

**Checkpoint**: User Story 1 fully functional — pages can be created, tasks added/checked/reordered, and state persists on refresh. Deployable as MVP.

---

## Phase 4: User Story 2 — Write Journal Entries and Notes (Priority: P2)

**Goal**: Users can open a blank page, write multi-paragraph rich-text entries (headings, bold, italic, lists), and have content auto-saved within 2 seconds. On return, the full entry is displayed.

**Independent Test**: Create a page, type three paragraphs with a heading and bullet list, navigate to the notebook home, click back into the page — confirm every paragraph, heading, and list item is intact.

### Implementation for User Story 2

- [ ] T035 [P] [US2] Extend PageEditor StarterKit configuration in src/components/editor/PageEditor.tsx — ensure StarterKit enables heading (levels 1–3), bold, italic, blockquote, bulletList, orderedList, hardBreak, horizontalRule; configure Placeholder extension with "Start writing…" prompt
- [ ] T036 [P] [US2] Add Heading, BulletList, OrderedList, and BlockQuote buttons to src/components/editor/EditorToolbar.tsx; show active state; add keyboard shortcut hints as Tooltip content
- [ ] T037 [US2] Implement inline page title editing in src/app/(app)/notebook/[pageId]/page.tsx — render title as a contenteditable `<h1>` (or controlled input); debounce title changes with 500 ms delay and call `from('pages').update({ title })`; reflect updated title in the browser tab
- [ ] T038 [US2] Verify autosave for rich-text content in src/lib/hooks/use-autosave.ts — ensure debounce fires correctly for both text and structural changes; add jitter to prevent request storms when multiple pages are open
- [ ] T039 [US2] Display page list with titles and formatted dates in src/app/(app)/notebook/page.tsx and src/components/layout/PageListItem.tsx — show title (fallback "Untitled"), relative updated_at date, and a truncated content preview extracted via `extractTiptapText`
- [ ] T040 [US2] Handle page deletion in src/app/(app)/notebook/[pageId]/page.tsx — add Delete button (confirmation Modal); call `from('pages').delete().eq('id', pageId)`; redirect to /notebook after deletion; CASCADE in schema handles tasks/drawings/photos

**Checkpoint**: User Story 2 fully functional — rich-text journal entries auto-save, display correctly on return, and pages can be titled and deleted.

---

## Phase 5: User Story 3 — Set Reminders and Track Completion (Priority: P3)

**Goal**: Users can attach a due date/reminder to a task, receive an in-app toast at the scheduled time, view all upcoming/overdue reminders in one screen, and auto-dismiss reminders when tasks are marked complete.

**Independent Test**: Set a task reminder 60 seconds in the future, wait — confirm a toast fires within 60 seconds. Open the Reminders view and confirm the item appears in chronological order.

### Implementation for User Story 3

- [ ] T041 [P] [US3] Create TaskDueDatePicker component in src/components/tasks/TaskDueDatePicker.tsx — inline date+time picker (HTML `<input type="datetime-local">` wrapped in a Tooltip popover); on confirm calls `from('tasks').update({ due_at })` and `from('reminders').insert({ user_id, task_id, fire_at })`
- [ ] T042 [P] [US3] Create useReminders hook in src/lib/hooks/use-reminders.ts — uses `usePolling` at 30-second interval to call `rpc('get_due_reminders')`; for each result fires a `react-hot-toast` notification with task text and a "Dismiss" action; on dismiss calls `from('reminders').update({ status: 'dismissed' })`
- [ ] T043 [US3] Create ReminderBell component in src/components/reminders/ReminderBell.tsx — shows a bell icon in TopBar with a Badge count of pending reminders fetched via `from('reminders').select(...).eq('status','pending')`; clicking navigates to /reminders
- [ ] T044 [US3] Create ReminderPoller client component in src/components/reminders/ReminderPoller.tsx — `"use client"` component that mounts `useReminders` hook; rendered inside `(app)/layout.tsx` so it polls app-wide while the user is authenticated
- [ ] T045 [US3] Create Reminders view page in src/app/(app)/reminders/page.tsx — Server Component fetches all pending reminders ordered by fire_at; groups into "Upcoming" and "Overdue" (fire_at < now); renders task text, linked page title, fire_at time, and a Dismiss button per item
- [ ] T046 [US3] Implement overdue task visual highlighting in src/components/tasks/TaskItem.tsx — compare `due_at` to current time; apply amber/red accent class when `due_at < now && !checked`
- [ ] T047 [US3] Auto-dismiss reminder on task completion in src/components/tasks/TaskItem.tsx — when checkbox is checked call `from('reminders').update({ status: 'dismissed' }).eq('task_id', taskId).eq('status', 'pending')` immediately after the tasks update
- [ ] T048 [US3] Integrate ReminderPoller and ReminderBell into app shell in src/app/(app)/layout.tsx and src/components/layout/TopBar.tsx — mount ReminderPoller once; pass pending count to ReminderBell via server-fetched initial count

**Checkpoint**: User Story 3 fully functional — due dates can be set on tasks, overdue items are highlighted, toast notifications fire on schedule, and the Reminders view lists all items in order.

---

## Phase 6: User Story 4 — Attach and View Photos (Priority: P4)

**Goal**: Users can upload a photo (≤ 10 MB) from their device to any page, see it inline in the editor, tap for a full-screen lightbox view, and remove it.

**Independent Test**: Open a page, upload a JPEG under 10 MB, confirm it appears inline in the editor, click it to open the lightbox, then delete it and confirm it disappears.

### Implementation for User Story 4

- [ ] T049 [P] [US4] Create PhotoUploadButton component in src/components/photos/PhotoUploadButton.tsx — renders a file `<input accept="image/*">`; validates file size ≤ 10485760 bytes (shows react-hot-toast error if exceeded — FR-019); uploads to `supabase.storage.from('notebook-photos').upload(\`${userId}/${pageId}/${Date.now()}_${filename}\`, file)`; inserts row in `photos`table; returns signed URL via`createSignedUrl` for Tiptap image insertion
- [ ] T050 [P] [US4] Create PhotoLightbox component in src/components/photos/PhotoLightbox.tsx — Modal-based full-screen image viewer; accepts `src` and `alt`; triggered on click of inline Tiptap image node; includes close button and keyboard Escape handler
- [ ] T051 [US4] Add Tiptap Image extension to PageEditor in src/components/editor/PageEditor.tsx — configure `@tiptap/extension-image` with `inline: true`; register click handler on image nodes to open PhotoLightbox
- [ ] T052 [US4] Add photo upload button to EditorToolbar in src/components/editor/EditorToolbar.tsx — renders a camera/image icon button; on click opens PhotoUploadButton file chooser; on successful upload inserts signed URL into editor via `editor.chain().focus().setImage({ src: signedUrl }).run()`
- [ ] T053 [US4] Implement photo deletion in src/components/photos/PhotoUploadButton.tsx and src/app/(app)/notebook/[pageId]/page.tsx — on remove: call `supabase.storage.from('notebook-photos').remove([storagePath])` then `from('photos').delete().eq('id', photoId)`; remove the image node from Tiptap content and trigger autosave
- [ ] T054 [US4] Handle photo upload errors and size limit in src/components/photos/PhotoUploadButton.tsx — show "Photo must be under 10 MB" toast on oversized file; show "Upload failed" toast on network error; do not insert image node into editor on failure

**Checkpoint**: User Story 4 fully functional — photos upload (with size gate), appear inline, open in lightbox on click, and are fully deleted from Storage and DB on remove.

---

## Phase 7: User Story 5 — Draw and Sketch Ideas (Priority: P5)

**Goal**: Users can add a freehand drawing canvas to any page, draw with mouse or touch, have the canvas state auto-saved (500 ms debounce), and return to see the drawing intact.

**Independent Test**: Add a drawing canvas to a page, draw three freehand strokes, navigate away, return — confirm all strokes are still present and tools (eraser, undo, colour) work correctly.

### Implementation for User Story 5

- [ ] T055 [P] [US5] Create DrawingCanvas component in src/components/drawing/DrawingCanvas.tsx — `"use client"` component dynamically imported with `next/dynamic` (`ssr: false`); renders the `<Excalidraw>` component with `initialData={{ elements, appState }}` from props; wires `onChange` to `useAutosave` debounce → `from('drawings').upsert({ page_id, elements, app_state }, { onConflict: 'page_id' })`; shows `<SkeletonCanvas />` while loading
- [ ] T056 [US5] Integrate DrawingCanvas into page editor in src/app/(app)/notebook/[pageId]/page.tsx — add "Add Drawing" toggle button; load initial drawing data via `from('drawings').select('*').eq('page_id', pageId).maybeSingle()`; conditionally render DrawingCanvas with fetched elements/appState (empty arrays/objects if null)
- [ ] T057 [US5] Implement drawing autosave in src/components/drawing/DrawingCanvas.tsx — confirm debounce fires correctly on `onChange` (elements or appState change); show save status indicator matching the editor's pattern; log autosave errors to console (never expose raw error to user)
- [ ] T058 [US5] Load persisted drawing data on canvas mount in src/components/drawing/DrawingCanvas.tsx — accept `initialElements: ExcalidrawElement[]` and `initialAppState: AppState` props (passed from server-fetched data); pass to Excalidraw `initialData` so strokes render immediately without a loading flash
- [ ] T059 [US5] Add SkeletonCanvas loading placeholder in src/components/drawing/DrawingCanvas.tsx — render a fixed-height rounded rectangle with an earthy pulsing animation while the Excalidraw bundle loads (dynamic import loading state)

**Checkpoint**: User Story 5 fully functional — drawing canvas loads, strokes are drawn and auto-saved, canvas state persists on page reload.

---

## Phase 8: User Story 6 — Organise, Sort, and Search Content (Priority: P6)

**Goal**: Users can sort their pages by date (newest first / oldest first) or title (A–Z), filter by label, search by keyword (full-text), and receive a clear "no results" message.

**Independent Test**: Create 5 pages with distinct titles and text. Sort by title A–Z and confirm order. Type a keyword from only one page into search and confirm only that page appears. Create a label, assign it to two pages, filter — confirm only those two appear.

### Implementation for User Story 6

- [ ] T060 [P] [US6] Add sort controls to src/app/(app)/notebook/page.tsx — client-side state for `sortBy: 'sort_order' | 'created_at' | 'updated_at' | 'title'` and `direction: 'asc' | 'desc'`; refetch pages with appropriate `.order()` clause; render sort dropdown using UI primitives
- [ ] T061 [P] [US6] Implement keyword search in src/app/(app)/notebook/page.tsx — controlled search input in TopBar that calls `rpc('search_pages', { search_query: q })` on input (debounced 300 ms); updates displayed page list; shows inline "No pages found for '{query}'" empty state when results are empty (FR-013)
- [ ] T062 [P] [US6] Implement label CRUD in src/components/layout/Sidebar.tsx — "New Label" button opens Modal with name + colour picker; calls `from('labels').insert(...)` on save; render existing labels as clickable filter chips with delete (×) button calling `from('labels').delete()`
- [ ] T063 [US6] Implement label filter in src/components/layout/Sidebar.tsx — on label chip click set active `labelId` filter state; pass to notebook page query as a `page_labels` join filter: `from('pages').select('*, page_labels!inner(label_id)').eq('page_labels.label_id', labelId)`
- [ ] T064 [US6] Implement label assignment to pages in src/app/(app)/notebook/[pageId]/page.tsx — render assigned labels as removable Badge components; add "Add Label" dropdown showing all user labels; on select call `from('page_labels').insert({ page_id, label_id })`; on remove call `from('page_labels').delete()`
- [ ] T065 [US6] Handle empty search state in src/app/(app)/notebook/page.tsx — render a clear "No pages found for '{query}'" message (with search term interpolated) when result set is empty; render "Your notebook is empty — create your first page" when notebook has no pages at all
- [ ] T066 [US6] Implement manual page reorder (DnD) in src/app/(app)/notebook/page.tsx and src/components/layout/Sidebar.tsx — extend existing @dnd-kit integration from Phase 3 (T033); ensure reorder persists via `from('pages').update({ sort_order })` using fractional index

**Checkpoint**: User Story 6 fully functional — pages sort by date/title, keyword search returns filtered results, labels can be created/assigned/filtered, empty states render correctly.

---

## Phase 9: User Story 7 — Access from Any Device (Priority: P7)

**Goal**: Content created on one device is visible on another device within 30 seconds. The layout is fully usable with touch input on mobile and tablet, adapting cleanly to all screen sizes.

**Independent Test**: Log in on two browsers (different windows/profiles). Create a page on Browser A, wait up to 30 seconds — confirm it appears in Browser B's notebook list without any manual refresh.

### Implementation for User Story 7

- [ ] T067 [P] [US7] Implement 30-second page-list polling in src/app/(app)/notebook/page.tsx — mount `usePolling` hook with 30 s interval; on each tick refetch pages metadata (`id, title, sort_order, updated_at`) and merge with local state; only trigger re-render when data has changed (compare `updated_at`)
- [ ] T068 [P] [US7] Implement editor content polling in src/app/(app)/notebook/[pageId]/page.tsx — mount `usePolling` at 30 s interval; pause polling when the editor is focused (user is actively typing); on each unfocused tick refetch full page content and update editor if `updated_at` is newer than local state
- [ ] T069 [US7] Responsive layout audit in src/app/(app)/layout.tsx, src/components/layout/Sidebar.tsx, src/components/layout/TopBar.tsx — apply Tailwind responsive breakpoints (sm/md/lg); Sidebar collapses to a slide-over drawer on mobile; TopBar search expands full-width on small screens; test at 375 px, 768 px, and 1280 px viewports
- [ ] T070 [US7] Touch input verification in src/components/tasks/TaskList.tsx and src/components/drawing/DrawingCanvas.tsx — confirm @dnd-kit DnD works with touch events (PointerSensor with activation constraint); confirm Excalidraw touch drawing works on a mobile viewport; add `touch-action: none` CSS where needed to prevent scroll conflict during DnD
- [ ] T071 [US7] Cross-device smoke test — document manual test steps in tests/e2e/cross-device.md: sign in on two browsers, create content on one, verify visible on the other within 30 s (poll interval); verify Playwright can simulate this with two browser contexts

**Checkpoint**: User Story 7 complete — content syncs within 30 s across sessions, app is usable on 375 px mobile screens, touch DnD and drawing work correctly.

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Accessibility, error handling, performance, and final validation across all user stories.

- [ ] T072 [P] Accessibility audit (WCAG 2.1 AA) across all core screens — add aria-labels to all icon buttons, ensure all form inputs have associated `<label>` elements, verify colour contrast ratios for leather/cream palette using axe-core; fix any violations in src/components/ui/ and src/components/layout/
- [ ] T073 [P] Keyboard navigation in src/components/tasks/TaskList.tsx and src/components/editor/EditorToolbar.tsx — ensure all interactive elements are reachable via Tab key; add visible focus rings (Tailwind `focus-visible:ring`); confirm modal close on Escape key in src/components/ui/Modal.tsx
- [ ] T074 Performance audit — run `npm run analyze` (Next.js bundle analyser); verify @excalidraw/excalidraw is only loaded via dynamic import (not in initial bundle); verify Tiptap extensions are tree-shaken; ensure initial page load < 3 s (SC-005)
- [ ] T075 [P] Add React error boundaries in src/app/(app)/notebook/[pageId]/page.tsx — wrap PageEditor and DrawingCanvas in separate ErrorBoundary components; on error show "Something went wrong — your content is safe" message with a retry button
- [ ] T076 [P] Handle auth session expiry gracefully in src/middleware.ts and src/components/editor/PageEditor.tsx — on 401/403 from Supabase during autosave, store editor JSON content in `sessionStorage` keyed by pageId; redirect to /login; on successful re-login, restore content from sessionStorage and resume autosave
- [ ] T077 [P] Harden autosave retry logic in src/lib/hooks/use-autosave.ts — confirm single retry after 2 s delay on save failure; after second failure set status to 'error' and fire react-hot-toast "Save failed — check your connection" with manual retry button; clear error on next successful save
- [ ] T078 Run full quickstart validation — follow specs/001-ledger-notebook-app/quickstart.md from scratch: `npm install`, configure .env.local, `npm run dev`, sign up, create page, add task, check off task; run `npm run test`, `npm run test:e2e`, `npm run lint`, `npm run type-check`; all must pass clean

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup)
    └──▶ Phase 2 (Foundational)  ← BLOCKS all user stories
              ├──▶ Phase 3 (US1 — Tasks)         [P1 — MVP]
              ├──▶ Phase 4 (US2 — Journal)        [P2]
              ├──▶ Phase 5 (US3 — Reminders)      [P3] — builds on US1 tasks
              ├──▶ Phase 6 (US4 — Photos)         [P4]
              ├──▶ Phase 7 (US5 — Drawing)        [P5]
              ├──▶ Phase 8 (US6 — Search/Sort)    [P6]
              └──▶ Phase 9 (US7 — Cross-device)   [P7]
                        └──▶ Phase 10 (Polish)
```

### User Story Dependencies

| Story              | Depends On                          | Notes                                                                   |
| ------------------ | ----------------------------------- | ----------------------------------------------------------------------- |
| US1 (Tasks)        | Phase 2 complete                    | No story dependencies — can start immediately after foundation          |
| US2 (Journal)      | Phase 2 complete                    | Shares PageEditor with US1; independently testable without tasks        |
| US3 (Reminders)    | Phase 2 + US1 tasks table populated | Requires `tasks.due_at` and `reminders` table; depends on task entities |
| US4 (Photos)       | Phase 2 complete                    | Requires Supabase Storage bucket from T009; independent of tasks        |
| US5 (Drawing)      | Phase 2 complete                    | Requires `drawings` table from T008; independent of tasks/photos        |
| US6 (Search/Sort)  | Phase 2 + US1 pages exist           | Requires `pages.search_vector` from schema; labels work independently   |
| US7 (Cross-device) | All stories complete                | Validates sync of all content types; responsive audit applies to all    |

### Within Each User Story

1. Shared/parallel utilities first (marked [P])
2. Data components before UI components
3. Core implementation before integration with other stories
4. Each story complete before the next begins (for single-developer sequential work)

### Parallel Opportunities

- **Phase 1**: T002, T003, T004, T005, T006 all run in parallel (different config files)
- **Phase 2**: T010, T011, T014, T015, T018, T019, T020, T023, T024 all run in parallel (different files)
- **US1**: T025, T026, T027, T030, T031 run in parallel; T028 starts after T027
- **US2**: T035, T036 run in parallel; T037, T039, T040 run in parallel
- **US3**: T041, T042 run in parallel; T043, T044 run in parallel
- **US4**: T049, T050 run in parallel; T051, T052, T053, T054 run in parallel
- **US5**: T055, T058, T059 run in parallel; T057 follows T055
- **US6**: T060, T061, T062 run in parallel; T063, T064, T065, T066 run in parallel
- **US7**: T067, T068 run in parallel; T069, T070 run in parallel
- **Phase 10**: T072, T073, T075, T076, T077 all run in parallel

---

## Parallel Example: User Story 1

```bash
# Step 1 — after Phase 2 completes, launch in parallel:
Task A: "T025 Create notebook home page in src/app/(app)/notebook/page.tsx"
Task B: "T026 Create page editor route in src/app/(app)/notebook/[pageId]/page.tsx"
Task C: "T027 Create CustomTaskItem extension in src/components/editor/extensions/CustomTaskItem.ts"
Task D: "T030 Create TaskList DnD container in src/components/tasks/TaskList.tsx"
Task E: "T031 Create TaskItem component in src/components/tasks/TaskItem.tsx"

# Step 2 — once T027 completes:
Task F: "T028 Create PageEditor with Tiptap + TaskList in src/components/editor/PageEditor.tsx"
Task G: "T029 Create EditorToolbar in src/components/editor/EditorToolbar.tsx"

# Step 3 — once T028 + T029 complete:
Task H: "T032 Wire full autosave cycle in src/components/editor/PageEditor.tsx"
Task I: "T033 Implement page reordering DnD in src/app/(app)/notebook/page.tsx"
Task J: "T034 Add save status indicator in src/components/editor/PageEditor.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T007)
2. Complete Phase 2: Foundational (T008–T024) — **CRITICAL: blocks all stories**
3. Complete Phase 3: User Story 1 (T025–T034)
4. **STOP and VALIDATE**: Create a page, add tasks, check off, reorder — refresh and confirm persistence
5. Deploy to Vercel with Supabase cloud — working MVP is live

### Incremental Delivery

| Step | Phases          | Milestone                               |
| ---- | --------------- | --------------------------------------- |
| 1    | Phase 1 + 2     | Foundation ready, auth works            |
| 2    | + Phase 3 (US1) | Task management MVP — deployable        |
| 3    | + Phase 4 (US2) | Journal writing added                   |
| 4    | + Phase 5 (US3) | Reminders added — productivity complete |
| 5    | + Phase 6 (US4) | Photos added                            |
| 6    | + Phase 7 (US5) | Drawing added                           |
| 7    | + Phase 8 (US6) | Search/sort/labels — full organisation  |
| 8    | + Phase 9 (US7) | Cross-device sync validated             |
| 9    | + Phase 10      | Polished, accessible, production-ready  |

### Parallel Team Strategy

With multiple developers (after Phase 2 completes):

- **Developer A**: US1 (Tasks) → US3 (Reminders)
- **Developer B**: US2 (Journal) → US6 (Search/Sort)
- **Developer C**: US4 (Photos) → US5 (Drawing)
- **Developer D**: US7 (Cross-device) → Phase 10 (Polish/Accessibility)

---

## Notes

- `[P]` tasks write to different files with no blocking dependencies — safe to run in parallel
- `[Story]` labels map each task to its user story for traceability and independent testing
- Each user story phase produces a fully testable, independently deployable increment
- Commit after each logical task group; open a draft PR after Phase 3 (MVP) is complete
- The Supabase schema (T008) must be applied before any Supabase client operations are tested
- Excalidraw is **client-only** — always use `next/dynamic` with `ssr: false` (T055)
- Never expose the Supabase `service_role` key in any client-side code
- Photo size gate (T049/T054) must be validated client-side **before** the upload call (FR-019)
