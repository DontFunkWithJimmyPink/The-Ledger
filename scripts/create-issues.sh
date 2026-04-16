#!/usr/bin/env bash
# Create GitHub issues for The Ledger — Digital Notebook App
# Run from the repo root: bash scripts/create-issues.sh
# Requires: gh CLI authenticated with repo:write permission

set -euo pipefail
REPO="DontFunkWithJimmyPink/The-Ledger"

# Create labels first (idempotent — ignores error if label exists)
create_label() { gh label create --repo "$REPO" "$1" --color "$2" --description "$3" 2>/dev/null || true; }

# Create issue only if no open/closed issue with the same title already exists
create_issue_idempotent() {
  local title="$1"; shift
  if gh issue list --repo "$REPO" --search "\"$title\" in:title" --state all --json title --jq '.[].title' 2>/dev/null | grep -qF "$title"; then
    echo "  → already exists, skipping."
  else
    gh issue create --repo "$REPO" --title "$title" "$@"
  fi
}

echo "Creating labels..."
create_label "phase:setup"            "0075ca" "Phase 1: Project setup & tooling"
create_label "phase:foundation"       "e4e669" "Phase 2: Foundational infrastructure"
create_label "phase:us1-tasks"        "d93f0b" "Phase 3: US1 — Tasks & To-Do Lists (MVP)"
create_label "phase:us2-journal"      "0e8a16" "Phase 4: US2 — Journal & Notes"
create_label "phase:us3-reminders"    "b60205" "Phase 5: US3 — Reminders"
create_label "phase:us4-photos"       "5319e7" "Phase 6: US4 — Photos"
create_label "phase:us5-drawing"      "006b75" "Phase 7: US5 — Drawing"
create_label "phase:us6-search"       "1d76db" "Phase 8: US6 — Search & Sort"
create_label "phase:us7-cross-device" "0052cc" "Phase 9: US7 — Cross-device sync"
create_label "phase:polish"           "cccccc" "Phase 10: Polish & cross-cutting"
create_label "user-story:tasks"       "d93f0b" "User Story 1: Tasks & To-Do Lists"
create_label "user-story:journal"     "0e8a16" "User Story 2: Journal & Notes"
create_label "user-story:reminders"   "b60205" "User Story 3: Reminders"
create_label "user-story:photos"      "5319e7" "User Story 4: Photos"
create_label "user-story:drawing"     "006b75" "User Story 5: Drawing"
create_label "user-story:search"      "1d76db" "User Story 6: Search & Sort"
create_label "user-story:cross-device" "0052cc" "User Story 7: Cross-device"
create_label "parallel"              "bfd4f2" "Can run in parallel with other tasks"
create_label "priority:p1-mvp"       "d93f0b" "Priority 1 — MVP"

echo "Creating issues..."

echo 'Creating T001...'
create_issue_idempotent '[T001] Initialize Next.js 14 App Router project with TypeScript strict mode — configure' \
  --label 'phase:setup' \
  --body '## T001 — Phase 1: Setup (Project Initialization)

### Description
Initialize Next.js 14 App Router project with TypeScript strict mode — configure package.json with all dependencies from plan.md (next, @supabase/supabase-js, @supabase/ssr, @tiptap/react, @tiptap/starter-kit, @tiptap/extension-task-list, @tiptap/extension-task-item, @tiptap/extension-image, @tiptap/extension-placeholder, @excalidraw/excalidraw, @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities, fractional-indexing, react-hot-toast, tailwindcss, @fontsource/lora, @fontsource/inter)

### Reference
`specs/001-ledger-notebook-app/tasks.md`
'

echo 'Creating T002...'
create_issue_idempotent '[T002] [P] Configure TailwindCSS with warm-earthy custom theme tokens (leather-900/700/500/' \
  --label 'phase:setup,parallel' \
  --body '## T002 — Phase 1: Setup (Project Initialization)

### Description
Configure TailwindCSS with warm-earthy custom theme tokens (leather-900/700/500/300, cream-50/100/200, ink-900/500) in tailwind.config.ts and initialize PostCSS

> ⚡ **Parallel**: This task can run concurrently with other `[P]` tasks in this phase.

### Reference
`specs/001-ledger-notebook-app/tasks.md`
'

echo 'Creating T003...'
create_issue_idempotent '[T003] [P] Configure ESLint and Prettier — create .eslintrc.js (TypeScript rules, Next.js p' \
  --label 'phase:setup,parallel' \
  --body '## T003 — Phase 1: Setup (Project Initialization)

### Description
Configure ESLint and Prettier — create .eslintrc.js (TypeScript rules, Next.js plugin) and .prettierrc; add lint and format scripts to package.json

> ⚡ **Parallel**: This task can run concurrently with other `[P]` tasks in this phase.

### Reference
`specs/001-ledger-notebook-app/tasks.md`
'

echo 'Creating T004...'
create_issue_idempotent '[T004] [P] Configure Jest and React Testing Library — create jest.config.ts, jest.setup.ts;' \
  --label 'phase:setup,parallel' \
  --body '## T004 — Phase 1: Setup (Project Initialization)

### Description
Configure Jest and React Testing Library — create jest.config.ts, jest.setup.ts; add test, test:watch, and test:coverage scripts to package.json

> ⚡ **Parallel**: This task can run concurrently with other `[P]` tasks in this phase.

### Reference
`specs/001-ledger-notebook-app/tasks.md`
'

echo 'Creating T005...'
create_issue_idempotent '[T005] [P] Configure Playwright — create playwright.config.ts targeting localhost:3000; add' \
  --label 'phase:setup,parallel' \
  --body '## T005 — Phase 1: Setup (Project Initialization)

### Description
Configure Playwright — create playwright.config.ts targeting localhost:3000; add test:e2e script to package.json

> ⚡ **Parallel**: This task can run concurrently with other `[P]` tasks in this phase.

### Reference
`specs/001-ledger-notebook-app/tasks.md`
'

echo 'Creating T006...'
create_issue_idempotent '[T006] [P] Create .env.local.example documenting all required variables: NEXT_PUBLIC_SUPABA' \
  --label 'phase:setup,parallel' \
  --body '## T006 — Phase 1: Setup (Project Initialization)

### Description
Create .env.local.example documenting all required variables: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_APP_URL, NEXT_PUBLIC_POLL_INTERVAL_MS; add .env.local to .gitignore

> ⚡ **Parallel**: This task can run concurrently with other `[P]` tasks in this phase.

### Reference
`specs/001-ledger-notebook-app/tasks.md`
'

echo 'Creating T007...'
create_issue_idempotent '[T007] Create full src/ directory skeleton per plan.md: src/app/(auth)/, src/app/(app)/' \
  --label 'phase:setup' \
  --body '## T007 — Phase 1: Setup (Project Initialization)

### Description
Create full src/ directory skeleton per plan.md: src/app/(auth)/, src/app/(app)/, src/app/api/auth/callback/, src/components/ui/, src/components/editor/extensions/, src/components/drawing/, src/components/tasks/, src/components/photos/, src/components/reminders/, src/components/layout/, src/lib/supabase/, src/lib/hooks/, src/lib/utils/, src/types/, src/styles/, tests/unit/, tests/integration/, tests/e2e/

### Reference
`specs/001-ledger-notebook-app/tasks.md`
'

echo 'Creating T008...'
create_issue_idempotent '[T008] Apply complete database schema to Supabase — run specs/001-ledger-notebook-app/c' \
  --label 'phase:foundation' \
  --body '## T008 — Phase 2: Foundational (Blocking Prerequisites)

### Description
Apply complete database schema to Supabase — run specs/001-ledger-notebook-app/contracts/database-schema.sql in SQL Editor: creates notebooks, pages, tasks, reminders, labels, page_labels, photos, drawings tables with RLS policies, indexes, triggers (updated_at, search_vector via extract_tiptap_text), and the on-signup notebook-creation trigger

### Reference
`specs/001-ledger-notebook-app/tasks.md`
'

echo 'Creating T009...'
create_issue_idempotent '[T009] Configure Supabase Storage — create private bucket `notebook-photos`; apply spec' \
  --label 'phase:foundation' \
  --body '## T009 — Phase 2: Foundational (Blocking Prerequisites)

### Description
Configure Supabase Storage — create private bucket `notebook-photos`; apply specs/001-ledger-notebook-app/contracts/storage-policies.sql (per-user folder RLS: `auth.uid() = foldername[1]`)

### Reference
`specs/001-ledger-notebook-app/tasks.md`
'

echo 'Creating T010...'
create_issue_idempotent '[T010] [P] Create Supabase browser client factory in src/lib/supabase/client.ts using `crea' \
  --label 'phase:foundation,parallel' \
  --body '## T010 — Phase 2: Foundational (Blocking Prerequisites)

### Description
Create Supabase browser client factory in src/lib/supabase/client.ts using `createBrowserClient` from @supabase/ssr; reads NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY

> ⚡ **Parallel**: This task can run concurrently with other `[P]` tasks in this phase.

### Reference
`specs/001-ledger-notebook-app/tasks.md`
'

echo 'Creating T011...'
create_issue_idempotent '[T011] [P] Create Supabase server client factory in src/lib/supabase/server.ts using `creat' \
  --label 'phase:foundation,parallel' \
  --body '## T011 — Phase 2: Foundational (Blocking Prerequisites)

### Description
Create Supabase server client factory in src/lib/supabase/server.ts using `createServerClient` from @supabase/ssr with cookie-based session handling for Next.js App Router Server Components and Route Handlers

> ⚡ **Parallel**: This task can run concurrently with other `[P]` tasks in this phase.

### Reference
`specs/001-ledger-notebook-app/tasks.md`
'

echo 'Creating T012...'
create_issue_idempotent '[T012] Create Next.js auth middleware in src/middleware.ts — validates session cookie o' \
  --label 'phase:foundation' \
  --body '## T012 — Phase 2: Foundational (Blocking Prerequisites)

### Description
Create Next.js auth middleware in src/middleware.ts — validates session cookie on every `(app)/` route request; redirects unauthenticated requests to /login using server Supabase client

### Reference
`specs/001-ledger-notebook-app/tasks.md`
'

echo 'Creating T013...'
create_issue_idempotent '[T013] Create auth callback Route Handler in src/app/api/auth/callback/route.ts — excha' \
  --label 'phase:foundation' \
  --body '## T013 — Phase 2: Foundational (Blocking Prerequisites)

### Description
Create auth callback Route Handler in src/app/api/auth/callback/route.ts — exchanges `code` query param for session cookie via `supabase.auth.exchangeCodeForSession(code)`; redirects to `next` path on success or `/login?error=auth_callback_failed` on failure

### Reference
`specs/001-ledger-notebook-app/tasks.md`
'

echo 'Creating T014...'
create_issue_idempotent '[T014] [P] Define all shared TypeScript interfaces in src/types/index.ts: Notebook, Page, T' \
  --label 'phase:foundation,parallel' \
  --body '## T014 — Phase 2: Foundational (Blocking Prerequisites)

### Description
Define all shared TypeScript interfaces in src/types/index.ts: Notebook, Page, Task, Reminder, Photo, Drawing, Label, PageLabel — matching the data-model.md schema column-for-column

> ⚡ **Parallel**: This task can run concurrently with other `[P]` tasks in this phase.

### Reference
`specs/001-ledger-notebook-app/tasks.md`
'

echo 'Creating T015...'
create_issue_idempotent '[T015] [P] Create CSS design tokens in src/styles/design-tokens.css (CSS custom properties ' \
  --label 'phase:foundation,parallel' \
  --body '## T015 — Phase 2: Foundational (Blocking Prerequisites)

### Description
Create CSS design tokens in src/styles/design-tokens.css (CSS custom properties for leather/cream/ink palette and Lora/Inter fonts); extend tailwind.config.ts with all named tokens from research.md §10

> ⚡ **Parallel**: This task can run concurrently with other `[P]` tasks in this phase.

### Reference
`specs/001-ledger-notebook-app/tasks.md`
'

echo 'Creating T016...'
create_issue_idempotent '[T016] Create root layout in src/app/layout.tsx — load @fontsource/lora and @fontsource' \
  --label 'phase:foundation' \
  --body '## T016 — Phase 2: Foundational (Blocking Prerequisites)

### Description
Create root layout in src/app/layout.tsx — load @fontsource/lora and @fontsource/inter via next/font; set HTML metadata; wrap children in `<Providers>` (Toaster from react-hot-toast); import globals.css

### Reference
`specs/001-ledger-notebook-app/tasks.md`
'

echo 'Creating T017...'
create_issue_idempotent '[T017] Create src/app/globals.css — Tailwind base directives + design token CSS variabl' \
  --label 'phase:foundation' \
  --body '## T017 — Phase 2: Foundational (Blocking Prerequisites)

### Description
Create src/app/globals.css — Tailwind base directives + design token CSS variable overrides from src/styles/design-tokens.css

### Reference
`specs/001-ledger-notebook-app/tasks.md`
'

echo 'Creating T018...'
create_issue_idempotent '[T018] [P] Create primitive UI components in src/components/ui/: Button.tsx (variants: prim' \
  --label 'phase:foundation,parallel' \
  --body '## T018 — Phase 2: Foundational (Blocking Prerequisites)

### Description
Create primitive UI components in src/components/ui/: Button.tsx (variants: primary/secondary/ghost), Input.tsx (label, error state), Modal.tsx (portal-based), Badge.tsx (color prop), Tooltip.tsx; export all from src/components/ui/index.ts

> ⚡ **Parallel**: This task can run concurrently with other `[P]` tasks in this phase.

### Reference
`specs/001-ledger-notebook-app/tasks.md`
'

echo 'Creating T019...'
create_issue_idempotent '[T019] [P] Create fractional indexing utility in src/lib/utils/fractional-index.ts — thin w' \
  --label 'phase:foundation,parallel' \
  --body '## T019 — Phase 2: Foundational (Blocking Prerequisites)

### Description
Create fractional indexing utility in src/lib/utils/fractional-index.ts — thin wrapper around the `fractional-indexing` npm package exposing `generateKeyBetween` for task and page sort_order updates

> ⚡ **Parallel**: This task can run concurrently with other `[P]` tasks in this phase.

### Reference
`specs/001-ledger-notebook-app/tasks.md`
'

echo 'Creating T020...'
create_issue_idempotent '[T020] [P] Create content utility in src/lib/utils/content.ts — implement `extractTiptapTex' \
  --label 'phase:foundation,parallel' \
  --body '## T020 — Phase 2: Foundational (Blocking Prerequisites)

### Description
Create content utility in src/lib/utils/content.ts — implement `extractTiptapText(content: JSON): string` that recursively walks Tiptap JSON and concatenates text nodes; implement `extractTaskItems(content: JSON): TaskItemData[]` that returns taskItem nodes with index, text, and checked state for autosave sync

> ⚡ **Parallel**: This task can run concurrently with other `[P]` tasks in this phase.

### Reference
`specs/001-ledger-notebook-app/tasks.md`
'

echo 'Creating T021...'
create_issue_idempotent '[T021] Create authentication pages: src/app/(auth)/login/page.tsx (email + password sig' \
  --label 'phase:foundation' \
  --body '## T021 — Phase 2: Foundational (Blocking Prerequisites)

### Description
Create authentication pages: src/app/(auth)/login/page.tsx (email + password sign-in form calling `supabase.auth.signInWithPassword`), src/app/(auth)/register/page.tsx (sign-up form calling `supabase.auth.signUp`), src/app/(auth)/recover/page.tsx (reset request + confirmation form calling `supabase.auth.resetPasswordForEmail` and `supabase.auth.updateUser`)

### Reference
`specs/001-ledger-notebook-app/tasks.md`
'

echo 'Creating T022...'
create_issue_idempotent '[T022] Create authenticated app shell: src/app/(app)/layout.tsx (flex layout with Sideb' \
  --label 'phase:foundation' \
  --body '## T022 — Phase 2: Foundational (Blocking Prerequisites)

### Description
Create authenticated app shell: src/app/(app)/layout.tsx (flex layout with Sidebar + main content area); src/components/layout/Sidebar.tsx (page list navigation + label filter placeholder); src/components/layout/TopBar.tsx (search bar + user menu + reminder bell placeholder); src/components/layout/PageListItem.tsx (single page row with title and updated_at)

### Reference
`specs/001-ledger-notebook-app/tasks.md`
'

echo 'Creating T023...'
create_issue_idempotent '[T023] [P] Create generic polling hook in src/lib/hooks/use-polling.ts — accepts a callback' \
  --label 'phase:foundation,parallel' \
  --body '## T023 — Phase 2: Foundational (Blocking Prerequisites)

### Description
Create generic polling hook in src/lib/hooks/use-polling.ts — accepts a callback and interval (default NEXT_PUBLIC_POLL_INTERVAL_MS || 30000), runs `setInterval`, pauses when `document.hidden`, cleans up on unmount

> ⚡ **Parallel**: This task can run concurrently with other `[P]` tasks in this phase.

### Reference
`specs/001-ledger-notebook-app/tasks.md`
'

echo 'Creating T024...'
create_issue_idempotent '[T024] [P] Create autosave hook in src/lib/hooks/use-autosave.ts — accepts a save callback ' \
  --label 'phase:foundation,parallel' \
  --body '## T024 — Phase 2: Foundational (Blocking Prerequisites)

### Description
Create autosave hook in src/lib/hooks/use-autosave.ts — accepts a save callback and 500 ms debounce delay; exposes `status: '\''idle'\'' | '\''saving'\'' | '\''saved'\'' | '\''error'\''`; retries once after 2 s on failure then emits error status for toast display

> ⚡ **Parallel**: This task can run concurrently with other `[P]` tasks in this phase.

### Reference
`specs/001-ledger-notebook-app/tasks.md`
'

echo 'Creating T025...'
create_issue_idempotent '[T025] [P] [US1] Create notebook home page in src/app/(app)/notebook/page.tsx — Server Component ' \
  --label 'phase:us1-tasks,user-story:tasks,parallel,priority:p1-mvp' \
  --body '## T025 — Phase 3: User Story 1 — Create and Manage Tasks & To-Do Lists (Priority: P1) 🎯 MVP

### Description
Create notebook home page in src/app/(app)/notebook/page.tsx — Server Component that fetches all pages for the user'\''s notebook (ordered by sort_order); renders list of PageListItem components; includes "New Page" button that calls `from('\''pages'\'').insert(...)` and redirects to the new page

**User Story**: US1

> ⚡ **Parallel**: This task can run concurrently with other `[P]` tasks in this phase.

### Reference
`specs/001-ledger-notebook-app/tasks.md`
'

echo 'Creating T026...'
create_issue_idempotent '[T026] [P] [US1] Create page editor route in src/app/(app)/notebook/[pageId]/page.tsx — Server Co' \
  --label 'phase:us1-tasks,user-story:tasks,parallel,priority:p1-mvp' \
  --body '## T026 — Phase 3: User Story 1 — Create and Manage Tasks & To-Do Lists (Priority: P1) 🎯 MVP

### Description
Create page editor route in src/app/(app)/notebook/[pageId]/page.tsx — Server Component fetches full page data via `from('\''pages'\'').select('\''*'\'').eq('\''id'\'', pageId).single()`; passes initial content to PageEditor client component; displays page title with inline editing

**User Story**: US1

> ⚡ **Parallel**: This task can run concurrently with other `[P]` tasks in this phase.

### Reference
`specs/001-ledger-notebook-app/tasks.md`
'

echo 'Creating T027...'
create_issue_idempotent '[T027] [P] [US1] Create CustomTaskItem Tiptap extension in src/components/editor/extensions/Custo' \
  --label 'phase:us1-tasks,user-story:tasks,parallel,priority:p1-mvp' \
  --body '## T027 — Phase 3: User Story 1 — Create and Manage Tasks & To-Do Lists (Priority: P1) 🎯 MVP

### Description
Create CustomTaskItem Tiptap extension in src/components/editor/extensions/CustomTaskItem.ts — extends `@tiptap/extension-task-item` to store and render a `dueDate` attribute alongside the standard `checked` attribute

**User Story**: US1

> ⚡ **Parallel**: This task can run concurrently with other `[P]` tasks in this phase.

### Reference
`specs/001-ledger-notebook-app/tasks.md`
'

echo 'Creating T028...'
create_issue_idempotent '[T028] [US1] Create PageEditor component in src/components/editor/PageEditor.tsx — `"use clie' \
  --label 'phase:us1-tasks,user-story:tasks,priority:p1-mvp' \
  --body '## T028 — Phase 3: User Story 1 — Create and Manage Tasks & To-Do Lists (Priority: P1) 🎯 MVP

### Description
Create PageEditor component in src/components/editor/PageEditor.tsx — `"use client"` component initialising Tiptap with StarterKit, TaskList, TaskItem (using CustomTaskItem), Placeholder; accepts `pageId` and `initialContent`; wires `onUpdate` to `useAutosave` → `from('\''pages'\'').update({ content })` + task upsert logic via `extractTaskItems`

**User Story**: US1

### Reference
`specs/001-ledger-notebook-app/tasks.md`
'

echo 'Creating T029...'
create_issue_idempotent '[T029] [US1] Create EditorToolbar in src/components/editor/EditorToolbar.tsx — renders Bold, ' \
  --label 'phase:us1-tasks,user-story:tasks,priority:p1-mvp' \
  --body '## T029 — Phase 3: User Story 1 — Create and Manage Tasks & To-Do Lists (Priority: P1) 🎯 MVP

### Description
Create EditorToolbar in src/components/editor/EditorToolbar.tsx — renders Bold, Italic, Heading 1/2, BulletList, TaskList toggle buttons using Tiptap `editor.chain()` commands; shows active state via `editor.isActive()`

**User Story**: US1

### Reference
`specs/001-ledger-notebook-app/tasks.md`
'

echo 'Creating T030...'
create_issue_idempotent '[T030] [P] [US1] Create standalone sortable TaskList container in src/components/tasks/TaskList.t' \
  --label 'phase:us1-tasks,user-story:tasks,parallel,priority:p1-mvp' \
  --body '## T030 — Phase 3: User Story 1 — Create and Manage Tasks & To-Do Lists (Priority: P1) 🎯 MVP

### Description
Create standalone sortable TaskList container in src/components/tasks/TaskList.tsx — wraps @dnd-kit `DndContext` + `SortableContext` for a vertical list of TaskItem components; on `onDragEnd` calls `generateKeyBetween` and `from('\''tasks'\'').update({ sort_order })`

**User Story**: US1

> ⚡ **Parallel**: This task can run concurrently with other `[P]` tasks in this phase.

### Reference
`specs/001-ledger-notebook-app/tasks.md`
'

echo 'Creating T031...'
create_issue_idempotent '[T031] [P] [US1] Create TaskItem component in src/components/tasks/TaskItem.tsx — renders checkbo' \
  --label 'phase:us1-tasks,user-story:tasks,parallel,priority:p1-mvp' \
  --body '## T031 — Phase 3: User Story 1 — Create and Manage Tasks & To-Do Lists (Priority: P1) 🎯 MVP

### Description
Create TaskItem component in src/components/tasks/TaskItem.tsx — renders checkbox (toggles `checked` via `from('\''tasks'\'').update({ checked })`), task text, and a due-date display area; uses `useSortable` from @dnd-kit/sortable for drag handle; visually distinguishes completed tasks (strikethrough + muted colour)

**User Story**: US1

> ⚡ **Parallel**: This task can run concurrently with other `[P]` tasks in this phase.

### Reference
`specs/001-ledger-notebook-app/tasks.md`
'

echo 'Creating T032...'
create_issue_idempotent '[T032] [US1] Wire full autosave cycle in src/components/editor/PageEditor.tsx — on every Tipt' \
  --label 'phase:us1-tasks,user-story:tasks,priority:p1-mvp' \
  --body '## T032 — Phase 3: User Story 1 — Create and Manage Tasks & To-Do Lists (Priority: P1) 🎯 MVP

### Description
Wire full autosave cycle in src/components/editor/PageEditor.tsx — on every Tiptap `onUpdate`: (1) debounce-save `pages.content`, (2) call `extractTaskItems`, (3) upsert all task rows via `from('\''tasks'\'').upsert(...)`, (4) delete orphaned task rows via `from('\''tasks'\'').delete().not('\''task_index'\'', '\''in'\'', activeIndexes)`

**User Story**: US1

### Reference
`specs/001-ledger-notebook-app/tasks.md`
'

echo 'Creating T033...'
create_issue_idempotent '[T033] [US1] Implement page reordering in src/app/(app)/notebook/page.tsx — wrap page list in' \
  --label 'phase:us1-tasks,user-story:tasks,priority:p1-mvp' \
  --body '## T033 — Phase 3: User Story 1 — Create and Manage Tasks & To-Do Lists (Priority: P1) 🎯 MVP

### Description
Implement page reordering in src/app/(app)/notebook/page.tsx — wrap page list in @dnd-kit DndContext; on drag end use `generateKeyBetween` for new `sort_order` and call `from('\''pages'\'').update({ sort_order })`

**User Story**: US1

### Reference
`specs/001-ledger-notebook-app/tasks.md`
'

echo 'Creating T034...'
create_issue_idempotent '[T034] [US1] Add save status indicator in src/components/editor/PageEditor.tsx — display "Sav' \
  --label 'phase:us1-tasks,user-story:tasks,priority:p1-mvp' \
  --body '## T034 — Phase 3: User Story 1 — Create and Manage Tasks & To-Do Lists (Priority: P1) 🎯 MVP

### Description
Add save status indicator in src/components/editor/PageEditor.tsx — display "Saving…" / "Saved" / "Save failed — retrying" badge below the toolbar based on `useAutosave` status; show react-hot-toast on persistent error

**User Story**: US1

### Reference
`specs/001-ledger-notebook-app/tasks.md`
'

echo 'Creating T035...'
create_issue_idempotent '[T035] [P] [US2] Extend PageEditor StarterKit configuration in src/components/editor/PageEditor.t' \
  --label 'phase:us2-journal,user-story:journal,parallel' \
  --body '## T035 — Phase 4: User Story 2 — Write Journal Entries and Notes (Priority: P2)

### Description
Extend PageEditor StarterKit configuration in src/components/editor/PageEditor.tsx — ensure StarterKit enables heading (levels 1–3), bold, italic, blockquote, bulletList, orderedList, hardBreak, horizontalRule; configure Placeholder extension with "Start writing…" prompt

**User Story**: US2

> ⚡ **Parallel**: This task can run concurrently with other `[P]` tasks in this phase.

### Reference
`specs/001-ledger-notebook-app/tasks.md`
'

echo 'Creating T036...'
create_issue_idempotent '[T036] [P] [US2] Add Heading, BulletList, OrderedList, and BlockQuote buttons to src/components/e' \
  --label 'phase:us2-journal,user-story:journal,parallel' \
  --body '## T036 — Phase 4: User Story 2 — Write Journal Entries and Notes (Priority: P2)

### Description
Add Heading, BulletList, OrderedList, and BlockQuote buttons to src/components/editor/EditorToolbar.tsx; show active state; add keyboard shortcut hints as Tooltip content

**User Story**: US2

> ⚡ **Parallel**: This task can run concurrently with other `[P]` tasks in this phase.

### Reference
`specs/001-ledger-notebook-app/tasks.md`
'

echo 'Creating T037...'
create_issue_idempotent '[T037] [US2] Implement inline page title editing in src/app/(app)/notebook/[pageId]/page.tsx ' \
  --label 'phase:us2-journal,user-story:journal' \
  --body '## T037 — Phase 4: User Story 2 — Write Journal Entries and Notes (Priority: P2)

### Description
Implement inline page title editing in src/app/(app)/notebook/[pageId]/page.tsx — render title as a contenteditable `<h1>` (or controlled input); debounce title changes with 500 ms delay and call `from('\''pages'\'').update({ title })`; reflect updated title in the browser tab

**User Story**: US2

### Reference
`specs/001-ledger-notebook-app/tasks.md`
'

echo 'Creating T038...'
create_issue_idempotent '[T038] [US2] Verify autosave for rich-text content in src/lib/hooks/use-autosave.ts — ensure ' \
  --label 'phase:us2-journal,user-story:journal' \
  --body '## T038 — Phase 4: User Story 2 — Write Journal Entries and Notes (Priority: P2)

### Description
Verify autosave for rich-text content in src/lib/hooks/use-autosave.ts — ensure debounce fires correctly for both text and structural changes; add jitter to prevent request storms when multiple pages are open

**User Story**: US2

### Reference
`specs/001-ledger-notebook-app/tasks.md`
'

echo 'Creating T039...'
create_issue_idempotent '[T039] [US2] Display page list with titles and formatted dates in src/app/(app)/notebook/page' \
  --label 'phase:us2-journal,user-story:journal' \
  --body '## T039 — Phase 4: User Story 2 — Write Journal Entries and Notes (Priority: P2)

### Description
Display page list with titles and formatted dates in src/app/(app)/notebook/page.tsx and src/components/layout/PageListItem.tsx — show title (fallback "Untitled"), relative updated_at date, and a truncated content preview extracted via `extractTiptapText`

**User Story**: US2

### Reference
`specs/001-ledger-notebook-app/tasks.md`
'

echo 'Creating T040...'
create_issue_idempotent '[T040] [US2] Handle page deletion in src/app/(app)/notebook/[pageId]/page.tsx — add Delete bu' \
  --label 'phase:us2-journal,user-story:journal' \
  --body '## T040 — Phase 4: User Story 2 — Write Journal Entries and Notes (Priority: P2)

### Description
Handle page deletion in src/app/(app)/notebook/[pageId]/page.tsx — add Delete button (confirmation Modal); call `from('\''pages'\'').delete().eq('\''id'\'', pageId)`; redirect to /notebook after deletion; CASCADE in schema handles tasks/drawings/photos

**User Story**: US2

### Reference
`specs/001-ledger-notebook-app/tasks.md`
'

echo 'Creating T041...'
create_issue_idempotent '[T041] [P] [US3] Create TaskDueDatePicker component in src/components/tasks/TaskDueDatePicker.tsx' \
  --label 'phase:us3-reminders,user-story:reminders,parallel' \
  --body '## T041 — Phase 5: User Story 3 — Set Reminders and Track Completion (Priority: P3)

### Description
Create TaskDueDatePicker component in src/components/tasks/TaskDueDatePicker.tsx — inline date+time picker (HTML `<input type="datetime-local">` wrapped in a Tooltip popover); on confirm calls `from('\''tasks'\'').update({ due_at })` and `from('\''reminders'\'').insert({ user_id, task_id, fire_at })`

**User Story**: US3

> ⚡ **Parallel**: This task can run concurrently with other `[P]` tasks in this phase.

### Reference
`specs/001-ledger-notebook-app/tasks.md`
'

echo 'Creating T042...'
create_issue_idempotent '[T042] [P] [US3] Create useReminders hook in src/lib/hooks/use-reminders.ts — uses `usePolling` a' \
  --label 'phase:us3-reminders,user-story:reminders,parallel' \
  --body '## T042 — Phase 5: User Story 3 — Set Reminders and Track Completion (Priority: P3)

### Description
Create useReminders hook in src/lib/hooks/use-reminders.ts — uses `usePolling` at 30-second interval to call `rpc('\''get_due_reminders'\'')`; for each result fires a `react-hot-toast` notification with task text and a "Dismiss" action; on dismiss calls `from('\''reminders'\'').update({ status: '\''dismissed'\'' })`

**User Story**: US3

> ⚡ **Parallel**: This task can run concurrently with other `[P]` tasks in this phase.

### Reference
`specs/001-ledger-notebook-app/tasks.md`
'

echo 'Creating T043...'
create_issue_idempotent '[T043] [US3] Create ReminderBell component in src/components/reminders/ReminderBell.tsx — sho' \
  --label 'phase:us3-reminders,user-story:reminders' \
  --body '## T043 — Phase 5: User Story 3 — Set Reminders and Track Completion (Priority: P3)

### Description
Create ReminderBell component in src/components/reminders/ReminderBell.tsx — shows a bell icon in TopBar with a Badge count of pending reminders fetched via `from('\''reminders'\'').select(...).eq('\''status'\'','\''pending'\'')`; clicking navigates to /reminders

**User Story**: US3

### Reference
`specs/001-ledger-notebook-app/tasks.md`
'

echo 'Creating T044...'
create_issue_idempotent '[T044] [US3] Create ReminderPoller client component in src/components/reminders/ReminderPolle' \
  --label 'phase:us3-reminders,user-story:reminders' \
  --body '## T044 — Phase 5: User Story 3 — Set Reminders and Track Completion (Priority: P3)

### Description
Create ReminderPoller client component in src/components/reminders/ReminderPoller.tsx — `"use client"` component that mounts `useReminders` hook; rendered inside `(app)/layout.tsx` so it polls app-wide while the user is authenticated

**User Story**: US3

### Reference
`specs/001-ledger-notebook-app/tasks.md`
'

echo 'Creating T045...'
create_issue_idempotent '[T045] [US3] Create Reminders view page in src/app/(app)/reminders/page.tsx — Server Componen' \
  --label 'phase:us3-reminders,user-story:reminders' \
  --body '## T045 — Phase 5: User Story 3 — Set Reminders and Track Completion (Priority: P3)

### Description
Create Reminders view page in src/app/(app)/reminders/page.tsx — Server Component fetches all pending reminders ordered by fire_at; groups into "Upcoming" and "Overdue" (fire_at < now); renders task text, linked page title, fire_at time, and a Dismiss button per item

**User Story**: US3

### Reference
`specs/001-ledger-notebook-app/tasks.md`
'

echo 'Creating T046...'
create_issue_idempotent '[T046] [US3] Implement overdue task visual highlighting in src/components/tasks/TaskItem.tsx ' \
  --label 'phase:us3-reminders,user-story:reminders' \
  --body '## T046 — Phase 5: User Story 3 — Set Reminders and Track Completion (Priority: P3)

### Description
Implement overdue task visual highlighting in src/components/tasks/TaskItem.tsx — compare `due_at` to current time; apply amber/red accent class when `due_at < now && !checked`

**User Story**: US3

### Reference
`specs/001-ledger-notebook-app/tasks.md`
'

echo 'Creating T047...'
create_issue_idempotent '[T047] [US3] Auto-dismiss reminder on task completion in src/components/tasks/TaskItem.tsx — ' \
  --label 'phase:us3-reminders,user-story:reminders' \
  --body '## T047 — Phase 5: User Story 3 — Set Reminders and Track Completion (Priority: P3)

### Description
Auto-dismiss reminder on task completion in src/components/tasks/TaskItem.tsx — when checkbox is checked call `from('\''reminders'\'').update({ status: '\''dismissed'\'' }).eq('\''task_id'\'', taskId).eq('\''status'\'', '\''pending'\'')` immediately after the tasks update

**User Story**: US3

### Reference
`specs/001-ledger-notebook-app/tasks.md`
'

echo 'Creating T048...'
create_issue_idempotent '[T048] [US3] Integrate ReminderPoller and ReminderBell into app shell in src/app/(app)/layout' \
  --label 'phase:us3-reminders,user-story:reminders' \
  --body '## T048 — Phase 5: User Story 3 — Set Reminders and Track Completion (Priority: P3)

### Description
Integrate ReminderPoller and ReminderBell into app shell in src/app/(app)/layout.tsx and src/components/layout/TopBar.tsx — mount ReminderPoller once; pass pending count to ReminderBell via server-fetched initial count

**User Story**: US3

### Reference
`specs/001-ledger-notebook-app/tasks.md`
'

echo 'Creating T049...'
create_issue_idempotent '[T049] [P] [US4] Create PhotoUploadButton component in src/components/photos/PhotoUploadButton.ts' \
  --label 'phase:us4-photos,user-story:photos,parallel' \
  --body '## T049 — Phase 6: User Story 4 — Attach and View Photos (Priority: P4)

### Description
Create PhotoUploadButton component in src/components/photos/PhotoUploadButton.tsx — renders a file `<input accept="image/*">`; validates file size ≤ 10485760 bytes (shows react-hot-toast error if exceeded — FR-019); uploads to `supabase.storage.from('\''notebook-photos'\'').upload(\`${userId}/${pageId}/${Date.now()}_${filename}\`, file)`; inserts row in `photos` table; returns signed URL via `createSignedUrl` for Tiptap image insertion

**User Story**: US4

> ⚡ **Parallel**: This task can run concurrently with other `[P]` tasks in this phase.

### Reference
`specs/001-ledger-notebook-app/tasks.md`
'

echo 'Creating T050...'
create_issue_idempotent '[T050] [P] [US4] Create PhotoLightbox component in src/components/photos/PhotoLightbox.tsx — Moda' \
  --label 'phase:us4-photos,user-story:photos,parallel' \
  --body '## T050 — Phase 6: User Story 4 — Attach and View Photos (Priority: P4)

### Description
Create PhotoLightbox component in src/components/photos/PhotoLightbox.tsx — Modal-based full-screen image viewer; accepts `src` and `alt`; triggered on click of inline Tiptap image node; includes close button and keyboard Escape handler

**User Story**: US4

> ⚡ **Parallel**: This task can run concurrently with other `[P]` tasks in this phase.

### Reference
`specs/001-ledger-notebook-app/tasks.md`
'

echo 'Creating T051...'
create_issue_idempotent '[T051] [US4] Add Tiptap Image extension to PageEditor in src/components/editor/PageEditor.tsx' \
  --label 'phase:us4-photos,user-story:photos' \
  --body '## T051 — Phase 6: User Story 4 — Attach and View Photos (Priority: P4)

### Description
Add Tiptap Image extension to PageEditor in src/components/editor/PageEditor.tsx — configure `@tiptap/extension-image` with `inline: true`; register click handler on image nodes to open PhotoLightbox

**User Story**: US4

### Reference
`specs/001-ledger-notebook-app/tasks.md`
'

echo 'Creating T052...'
create_issue_idempotent '[T052] [US4] Add photo upload button to EditorToolbar in src/components/editor/EditorToolbar.' \
  --label 'phase:us4-photos,user-story:photos' \
  --body '## T052 — Phase 6: User Story 4 — Attach and View Photos (Priority: P4)

### Description
Add photo upload button to EditorToolbar in src/components/editor/EditorToolbar.tsx — renders a camera/image icon button; on click opens PhotoUploadButton file chooser; on successful upload inserts signed URL into editor via `editor.chain().focus().setImage({ src: signedUrl }).run()`

**User Story**: US4

### Reference
`specs/001-ledger-notebook-app/tasks.md`
'

echo 'Creating T053...'
create_issue_idempotent '[T053] [US4] Implement photo deletion in src/components/photos/PhotoUploadButton.tsx and src/' \
  --label 'phase:us4-photos,user-story:photos' \
  --body '## T053 — Phase 6: User Story 4 — Attach and View Photos (Priority: P4)

### Description
Implement photo deletion in src/components/photos/PhotoUploadButton.tsx and src/app/(app)/notebook/[pageId]/page.tsx — on remove: call `supabase.storage.from('\''notebook-photos'\'').remove([storagePath])` then `from('\''photos'\'').delete().eq('\''id'\'', photoId)`; remove the image node from Tiptap content and trigger autosave

**User Story**: US4

### Reference
`specs/001-ledger-notebook-app/tasks.md`
'

echo 'Creating T054...'
create_issue_idempotent '[T054] [US4] Handle photo upload errors and size limit in src/components/photos/PhotoUploadBu' \
  --label 'phase:us4-photos,user-story:photos' \
  --body '## T054 — Phase 6: User Story 4 — Attach and View Photos (Priority: P4)

### Description
Handle photo upload errors and size limit in src/components/photos/PhotoUploadButton.tsx — show "Photo must be under 10 MB" toast on oversized file; show "Upload failed" toast on network error; do not insert image node into editor on failure

**User Story**: US4

### Reference
`specs/001-ledger-notebook-app/tasks.md`
'

echo 'Creating T055...'
create_issue_idempotent '[T055] [P] [US5] Create DrawingCanvas component in src/components/drawing/DrawingCanvas.tsx — `"u' \
  --label 'phase:us5-drawing,user-story:drawing,parallel' \
  --body '## T055 — Phase 7: User Story 5 — Draw and Sketch Ideas (Priority: P5)

### Description
Create DrawingCanvas component in src/components/drawing/DrawingCanvas.tsx — `"use client"` component dynamically imported with `next/dynamic` (`ssr: false`); renders the `<Excalidraw>` component with `initialData={{ elements, appState }}` from props; wires `onChange` to `useAutosave` debounce → `from('\''drawings'\'').upsert({ page_id, elements, app_state }, { onConflict: '\''page_id'\'' })`; shows `<SkeletonCanvas />` while loading

**User Story**: US5

> ⚡ **Parallel**: This task can run concurrently with other `[P]` tasks in this phase.

### Reference
`specs/001-ledger-notebook-app/tasks.md`
'

echo 'Creating T056...'
create_issue_idempotent '[T056] [US5] Integrate DrawingCanvas into page editor in src/app/(app)/notebook/[pageId]/page' \
  --label 'phase:us5-drawing,user-story:drawing' \
  --body '## T056 — Phase 7: User Story 5 — Draw and Sketch Ideas (Priority: P5)

### Description
Integrate DrawingCanvas into page editor in src/app/(app)/notebook/[pageId]/page.tsx — add "Add Drawing" toggle button; load initial drawing data via `from('\''drawings'\'').select('\''*'\'').eq('\''page_id'\'', pageId).maybeSingle()`; conditionally render DrawingCanvas with fetched elements/appState (empty arrays/objects if null)

**User Story**: US5

### Reference
`specs/001-ledger-notebook-app/tasks.md`
'

echo 'Creating T057...'
create_issue_idempotent '[T057] [US5] Implement drawing autosave in src/components/drawing/DrawingCanvas.tsx — confirm' \
  --label 'phase:us5-drawing,user-story:drawing' \
  --body '## T057 — Phase 7: User Story 5 — Draw and Sketch Ideas (Priority: P5)

### Description
Implement drawing autosave in src/components/drawing/DrawingCanvas.tsx — confirm debounce fires correctly on `onChange` (elements or appState change); show save status indicator matching the editor'\''s pattern; log autosave errors to console (never expose raw error to user)

**User Story**: US5

### Reference
`specs/001-ledger-notebook-app/tasks.md`
'

echo 'Creating T058...'
create_issue_idempotent '[T058] [US5] Load persisted drawing data on canvas mount in src/components/drawing/DrawingCan' \
  --label 'phase:us5-drawing,user-story:drawing' \
  --body '## T058 — Phase 7: User Story 5 — Draw and Sketch Ideas (Priority: P5)

### Description
Load persisted drawing data on canvas mount in src/components/drawing/DrawingCanvas.tsx — accept `initialElements: ExcalidrawElement[]` and `initialAppState: AppState` props (passed from server-fetched data); pass to Excalidraw `initialData` so strokes render immediately without a loading flash

**User Story**: US5

### Reference
`specs/001-ledger-notebook-app/tasks.md`
'

echo 'Creating T059...'
create_issue_idempotent '[T059] [US5] Add SkeletonCanvas loading placeholder in src/components/drawing/DrawingCanvas.t' \
  --label 'phase:us5-drawing,user-story:drawing' \
  --body '## T059 — Phase 7: User Story 5 — Draw and Sketch Ideas (Priority: P5)

### Description
Add SkeletonCanvas loading placeholder in src/components/drawing/DrawingCanvas.tsx — render a fixed-height rounded rectangle with an earthy pulsing animation while the Excalidraw bundle loads (dynamic import loading state)

**User Story**: US5

### Reference
`specs/001-ledger-notebook-app/tasks.md`
'

echo 'Creating T060...'
create_issue_idempotent '[T060] [P] [US6] Add sort controls to src/app/(app)/notebook/page.tsx — client-side state for `so' \
  --label 'phase:us6-search,user-story:search,parallel' \
  --body '## T060 — Phase 8: User Story 6 — Organise, Sort, and Search Content (Priority: P6)

### Description
Add sort controls to src/app/(app)/notebook/page.tsx — client-side state for `sortBy: '\''sort_order'\'' | '\''created_at'\'' | '\''updated_at'\'' | '\''title'\''` and `direction: '\''asc'\'' | '\''desc'\''`; refetch pages with appropriate `.order()` clause; render sort dropdown using UI primitives

**User Story**: US6

> ⚡ **Parallel**: This task can run concurrently with other `[P]` tasks in this phase.

### Reference
`specs/001-ledger-notebook-app/tasks.md`
'

echo 'Creating T061...'
create_issue_idempotent '[T061] [P] [US6] Implement keyword search in src/app/(app)/notebook/page.tsx — controlled search ' \
  --label 'phase:us6-search,user-story:search,parallel' \
  --body '## T061 — Phase 8: User Story 6 — Organise, Sort, and Search Content (Priority: P6)

### Description
Implement keyword search in src/app/(app)/notebook/page.tsx — controlled search input in TopBar that calls `rpc('\''search_pages'\'', { search_query: q })` on input (debounced 300 ms); updates displayed page list; shows inline "No pages found for '\''{query}'\''" empty state when results are empty (FR-013)

**User Story**: US6

> ⚡ **Parallel**: This task can run concurrently with other `[P]` tasks in this phase.

### Reference
`specs/001-ledger-notebook-app/tasks.md`
'

echo 'Creating T062...'
create_issue_idempotent '[T062] [P] [US6] Implement label CRUD in src/components/layout/Sidebar.tsx — "New Label" button o' \
  --label 'phase:us6-search,user-story:search,parallel' \
  --body '## T062 — Phase 8: User Story 6 — Organise, Sort, and Search Content (Priority: P6)

### Description
Implement label CRUD in src/components/layout/Sidebar.tsx — "New Label" button opens Modal with name + colour picker; calls `from('\''labels'\'').insert(...)` on save; render existing labels as clickable filter chips with delete (×) button calling `from('\''labels'\'').delete()`

**User Story**: US6

> ⚡ **Parallel**: This task can run concurrently with other `[P]` tasks in this phase.

### Reference
`specs/001-ledger-notebook-app/tasks.md`
'

echo 'Creating T063...'
create_issue_idempotent '[T063] [US6] Implement label filter in src/components/layout/Sidebar.tsx — on label chip clic' \
  --label 'phase:us6-search,user-story:search' \
  --body '## T063 — Phase 8: User Story 6 — Organise, Sort, and Search Content (Priority: P6)

### Description
Implement label filter in src/components/layout/Sidebar.tsx — on label chip click set active `labelId` filter state; pass to notebook page query as a `page_labels` join filter: `from('\''pages'\'').select('\''*, page_labels!inner(label_id)'\'').eq('\''page_labels.label_id'\'', labelId)`

**User Story**: US6

### Reference
`specs/001-ledger-notebook-app/tasks.md`
'

echo 'Creating T064...'
create_issue_idempotent '[T064] [US6] Implement label assignment to pages in src/app/(app)/notebook/[pageId]/page.tsx ' \
  --label 'phase:us6-search,user-story:search' \
  --body '## T064 — Phase 8: User Story 6 — Organise, Sort, and Search Content (Priority: P6)

### Description
Implement label assignment to pages in src/app/(app)/notebook/[pageId]/page.tsx — render assigned labels as removable Badge components; add "Add Label" dropdown showing all user labels; on select call `from('\''page_labels'\'').insert({ page_id, label_id })`; on remove call `from('\''page_labels'\'').delete()`

**User Story**: US6

### Reference
`specs/001-ledger-notebook-app/tasks.md`
'

echo 'Creating T065...'
create_issue_idempotent '[T065] [US6] Handle empty search state in src/app/(app)/notebook/page.tsx — render a clear "N' \
  --label 'phase:us6-search,user-story:search' \
  --body '## T065 — Phase 8: User Story 6 — Organise, Sort, and Search Content (Priority: P6)

### Description
Handle empty search state in src/app/(app)/notebook/page.tsx — render a clear "No pages found for '\''{query}'\''" message (with search term interpolated) when result set is empty; render "Your notebook is empty — create your first page" when notebook has no pages at all

**User Story**: US6

### Reference
`specs/001-ledger-notebook-app/tasks.md`
'

echo 'Creating T066...'
create_issue_idempotent '[T066] [US6] Implement manual page reorder (DnD) in src/app/(app)/notebook/page.tsx and src/c' \
  --label 'phase:us6-search,user-story:search' \
  --body '## T066 — Phase 8: User Story 6 — Organise, Sort, and Search Content (Priority: P6)

### Description
Implement manual page reorder (DnD) in src/app/(app)/notebook/page.tsx and src/components/layout/Sidebar.tsx — extend existing @dnd-kit integration from Phase 3 (T033); ensure reorder persists via `from('\''pages'\'').update({ sort_order })` using fractional index

**User Story**: US6

### Reference
`specs/001-ledger-notebook-app/tasks.md`
'

echo 'Creating T067...'
create_issue_idempotent '[T067] [P] [US7] Implement 30-second page-list polling in src/app/(app)/notebook/page.tsx — mount' \
  --label 'phase:us7-cross-device,user-story:cross-device,parallel' \
  --body '## T067 — Phase 9: User Story 7 — Access from Any Device (Priority: P7)

### Description
Implement 30-second page-list polling in src/app/(app)/notebook/page.tsx — mount `usePolling` hook with 30 s interval; on each tick refetch pages metadata (`id, title, sort_order, updated_at`) and merge with local state; only trigger re-render when data has changed (compare `updated_at`)

**User Story**: US7

> ⚡ **Parallel**: This task can run concurrently with other `[P]` tasks in this phase.

### Reference
`specs/001-ledger-notebook-app/tasks.md`
'

echo 'Creating T068...'
create_issue_idempotent '[T068] [P] [US7] Implement editor content polling in src/app/(app)/notebook/[pageId]/page.tsx — m' \
  --label 'phase:us7-cross-device,user-story:cross-device,parallel' \
  --body '## T068 — Phase 9: User Story 7 — Access from Any Device (Priority: P7)

### Description
Implement editor content polling in src/app/(app)/notebook/[pageId]/page.tsx — mount `usePolling` at 30 s interval; pause polling when the editor is focused (user is actively typing); on each unfocused tick refetch full page content and update editor if `updated_at` is newer than local state

**User Story**: US7

> ⚡ **Parallel**: This task can run concurrently with other `[P]` tasks in this phase.

### Reference
`specs/001-ledger-notebook-app/tasks.md`
'

echo 'Creating T069...'
create_issue_idempotent '[T069] [US7] Responsive layout audit in src/app/(app)/layout.tsx, src/components/layout/Sideb' \
  --label 'phase:us7-cross-device,user-story:cross-device' \
  --body '## T069 — Phase 9: User Story 7 — Access from Any Device (Priority: P7)

### Description
Responsive layout audit in src/app/(app)/layout.tsx, src/components/layout/Sidebar.tsx, src/components/layout/TopBar.tsx — apply Tailwind responsive breakpoints (sm/md/lg); Sidebar collapses to a slide-over drawer on mobile; TopBar search expands full-width on small screens; test at 375 px, 768 px, and 1280 px viewports

**User Story**: US7

### Reference
`specs/001-ledger-notebook-app/tasks.md`
'

echo 'Creating T070...'
create_issue_idempotent '[T070] [US7] Touch input verification in src/components/tasks/TaskList.tsx and src/components' \
  --label 'phase:us7-cross-device,user-story:cross-device' \
  --body '## T070 — Phase 9: User Story 7 — Access from Any Device (Priority: P7)

### Description
Touch input verification in src/components/tasks/TaskList.tsx and src/components/drawing/DrawingCanvas.tsx — confirm @dnd-kit DnD works with touch events (PointerSensor with activation constraint); confirm Excalidraw touch drawing works on a mobile viewport; add `touch-action: none` CSS where needed to prevent scroll conflict during DnD

**User Story**: US7

### Reference
`specs/001-ledger-notebook-app/tasks.md`
'

echo 'Creating T071...'
create_issue_idempotent '[T071] [US7] Cross-device smoke test — document manual test steps in tests/e2e/cross-device.m' \
  --label 'phase:us7-cross-device,user-story:cross-device' \
  --body '## T071 — Phase 9: User Story 7 — Access from Any Device (Priority: P7)

### Description
Cross-device smoke test — document manual test steps in tests/e2e/cross-device.md: sign in on two browsers, create content on one, verify visible on the other within 30 s (poll interval); verify Playwright can simulate this with two browser contexts

**User Story**: US7

### Reference
`specs/001-ledger-notebook-app/tasks.md`
'

echo 'Creating T072...'
create_issue_idempotent '[T072] [P] Accessibility audit (WCAG 2.1 AA) across all core screens — add aria-labels to a' \
  --label 'phase:polish,parallel' \
  --body '## T072 — Phase 10: Polish & Cross-Cutting Concerns

### Description
Accessibility audit (WCAG 2.1 AA) across all core screens — add aria-labels to all icon buttons, ensure all form inputs have associated `<label>` elements, verify colour contrast ratios for leather/cream palette using axe-core; fix any violations in src/components/ui/ and src/components/layout/

> ⚡ **Parallel**: This task can run concurrently with other `[P]` tasks in this phase.

### Reference
`specs/001-ledger-notebook-app/tasks.md`
'

echo 'Creating T073...'
create_issue_idempotent '[T073] [P] Keyboard navigation in src/components/tasks/TaskList.tsx and src/components/edit' \
  --label 'phase:polish,parallel' \
  --body '## T073 — Phase 10: Polish & Cross-Cutting Concerns

### Description
Keyboard navigation in src/components/tasks/TaskList.tsx and src/components/editor/EditorToolbar.tsx — ensure all interactive elements are reachable via Tab key; add visible focus rings (Tailwind `focus-visible:ring`); confirm modal close on Escape key in src/components/ui/Modal.tsx

> ⚡ **Parallel**: This task can run concurrently with other `[P]` tasks in this phase.

### Reference
`specs/001-ledger-notebook-app/tasks.md`
'

echo 'Creating T074...'
create_issue_idempotent '[T074] Performance audit — run `npm run analyze` (Next.js bundle analyser); verify @exc' \
  --label 'phase:polish' \
  --body '## T074 — Phase 10: Polish & Cross-Cutting Concerns

### Description
Performance audit — run `npm run analyze` (Next.js bundle analyser); verify @excalidraw/excalidraw is only loaded via dynamic import (not in initial bundle); verify Tiptap extensions are tree-shaken; ensure initial page load < 3 s (SC-005)

### Reference
`specs/001-ledger-notebook-app/tasks.md`
'

echo 'Creating T075...'
create_issue_idempotent '[T075] [P] Add React error boundaries in src/app/(app)/notebook/[pageId]/page.tsx — wrap Pa' \
  --label 'phase:polish,parallel' \
  --body '## T075 — Phase 10: Polish & Cross-Cutting Concerns

### Description
Add React error boundaries in src/app/(app)/notebook/[pageId]/page.tsx — wrap PageEditor and DrawingCanvas in separate ErrorBoundary components; on error show "Something went wrong — your content is safe" message with a retry button

> ⚡ **Parallel**: This task can run concurrently with other `[P]` tasks in this phase.

### Reference
`specs/001-ledger-notebook-app/tasks.md`
'

echo 'Creating T076...'
create_issue_idempotent '[T076] [P] Handle auth session expiry gracefully in src/middleware.ts and src/components/ed' \
  --label 'phase:polish,parallel' \
  --body '## T076 — Phase 10: Polish & Cross-Cutting Concerns

### Description
Handle auth session expiry gracefully in src/middleware.ts and src/components/editor/PageEditor.tsx — on 401/403 from Supabase during autosave, store editor JSON content in `sessionStorage` keyed by pageId; redirect to /login; on successful re-login, restore content from sessionStorage and resume autosave

> ⚡ **Parallel**: This task can run concurrently with other `[P]` tasks in this phase.

### Reference
`specs/001-ledger-notebook-app/tasks.md`
'

echo 'Creating T077...'
create_issue_idempotent '[T077] [P] Harden autosave retry logic in src/lib/hooks/use-autosave.ts — confirm single re' \
  --label 'phase:polish,parallel' \
  --body '## T077 — Phase 10: Polish & Cross-Cutting Concerns

### Description
Harden autosave retry logic in src/lib/hooks/use-autosave.ts — confirm single retry after 2 s delay on save failure; after second failure set status to '\''error'\'' and fire react-hot-toast "Save failed — check your connection" with manual retry button; clear error on next successful save

> ⚡ **Parallel**: This task can run concurrently with other `[P]` tasks in this phase.

### Reference
`specs/001-ledger-notebook-app/tasks.md`
'

echo 'Creating T078...'
create_issue_idempotent '[T078] Run full quickstart validation — follow specs/001-ledger-notebook-app/quickstart' \
  --label 'phase:polish' \
  --body '## T078 — Phase 10: Polish & Cross-Cutting Concerns

### Description
Run full quickstart validation — follow specs/001-ledger-notebook-app/quickstart.md from scratch: `npm install`, configure .env.local, `npm run dev`, sign up, create page, add task, check off task; run `npm run test`, `npm run test:e2e`, `npm run lint`, `npm run type-check`; all must pass clean

### Reference
`specs/001-ledger-notebook-app/tasks.md`
'

echo "Done! All issues created."