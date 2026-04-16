# Implementation Plan: The Ledger — Digital Notebook App

**Branch**: `001-ledger-notebook-app` | **Date**: 2026-04-16 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/001-ledger-notebook-app/spec.md`

---

## Summary

The Ledger is a cozy, personal digital notebook web app that allows an authenticated user to create
and manage pages containing any combination of rich-text journal entries, checkbox task lists,
embedded photos, and freehand drawings — all auto-saved and accessible from any device.

The implementation uses **Next.js 14 (App Router)** on the frontend, **Supabase** for authentication,
database, and file storage, **Tiptap** for the rich-text and task-list editor, and **Excalidraw** for
the freehand drawing canvas. Deployment is **Vercel** (frontend) + **Supabase cloud** (backend),
with Supabase hosted on AWS infrastructure to satisfy the FR-018 AWS hosting requirement. Content
synchronisation between devices is achieved via lightweight polling (15–30 second intervals), keeping
the architecture simple and WebSocket-free for v1.

---

## Technical Context

**Language/Version**: TypeScript 5.x / Node.js 20 LTS  
**Primary Dependencies**: Next.js 14 (App Router), @supabase/ssr, @supabase/supabase-js, Tiptap v2
(`@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-task-list`, `@tiptap/extension-image`,
`@tiptap/extension-placeholder`), Excalidraw (`@excalidraw/excalidraw`), TailwindCSS, @dnd-kit/core +
@dnd-kit/sortable, fractional-indexing  
**Storage**: Supabase PostgreSQL 15 (relational content + tsvector full-text search), Supabase Storage
(photo blobs)  
**Testing**: Jest + React Testing Library (unit/component), Playwright (E2E), MSW for API mocking  
**Target Platform**: Evergreen web browsers (Chrome, Firefox, Safari, Edge) on desktop, tablet, and
mobile — no native app installation required  
**Project Type**: Web application (SaaS, single-user personal tool, v1)  
**Performance Goals**: <3 s initial load (SC-005), <200 ms p95 API response (Constitution VI), <2 s
autosave latency (FR-005 / SC-002), <5 s photo upload for 10 MB files (SC-010), in-app reminders fire
within 60 s of scheduled time (SC-008)  
**Constraints**: Online-only (no offline mode in v1); single user per notebook; no real-time
collaboration; photo max 10 MB per file (FR-019)  
**Scale/Scope**: Personal single-user app; Supabase free/pro tier initially; architecture supports
horizontal scale via Supabase managed infra; ~50 pages, ~500 tasks per typical notebook

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked post-Phase 1 design.*

| Principle | Assessment | Notes |
|-----------|------------|-------|
| **I — Simplicity First** | ✅ PASS | Managed Supabase eliminates custom server/infra. Polling replaces WebSocket complexity. No BFF layer — Next.js Route Handlers only where Supabase client cannot reach (auth callback). Excalidraw and Tiptap are purpose-built components, not custom-built. |
| **II — User Security** | ✅ PASS | Supabase Row Level Security enforced on every table — queries are automatically filtered to the authenticated user's data. Storage bucket policies enforce per-user folder paths. `@supabase/ssr` cookie-based auth handles tokens securely; no tokens in localStorage. All inputs validated on the client and RLS-enforced on the server. |
| **III — Code Quality** | ✅ PASS | TypeScript strict mode; ESLint + Prettier configured and enforced in CI. Named constants for polling intervals, file-size limits, debounce timing. Functions scoped to single responsibility. |
| **IV — Testing Standards** | ✅ PASS | Jest + RTL for unit/component coverage ≥80%; Playwright for E2E critical user journeys (sign-up, create page, add task, upload photo, draw). CI gate: tests must pass before merge. |
| **V — UX Consistency** | ✅ PASS | Single design system: TailwindCSS with a custom warm-earthy theme (leather browns, cream, warm serifs). All components drawn from the same `components/ui/` primitives. WCAG 2.1 AA validated on every new screen. |
| **VI — Performance** | ✅ PASS | Supabase Edge Functions / CDN for DB queries; GIN index on `search_vector`; fractional indexing avoids bulk re-writes on reorder; photo size capped at 10 MB with client-side pre-validation; bundle size monitored via Next.js bundle analyser in CI. |

**No complexity violations to log.** All decisions are straightforward applications of the chosen
technology stack.

---

## Project Structure

### Documentation (this feature)

```text
specs/001-ledger-notebook-app/
├── plan.md              ← This file
├── research.md          ← Phase 0 output (technology decisions + rationale)
├── data-model.md        ← Phase 1 output (entity schema + relationships)
├── quickstart.md        ← Phase 1 output (local dev setup)
├── contracts/
│   ├── database-schema.sql    ← Supabase PostgreSQL DDL + RLS policies
│   ├── storage-policies.sql   ← Supabase Storage bucket policies
│   └── api-routes.md          ← Next.js Route Handler contracts
└── tasks.md             ← Phase 2 output (generated by /speckit.tasks — NOT this command)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── (auth)/                          # Unauthenticated route group
│   │   ├── login/
│   │   │   └── page.tsx                 # Email + password login form
│   │   ├── register/
│   │   │   └── page.tsx                 # Account creation form
│   │   └── recover/
│   │       └── page.tsx                 # Password recovery request + confirmation
│   ├── (app)/                           # Authenticated route group
│   │   ├── layout.tsx                   # App shell: sidebar + top bar
│   │   ├── notebook/
│   │   │   ├── page.tsx                 # Page list (sort, filter, search)
│   │   │   └── [pageId]/
│   │   │       └── page.tsx             # Page editor (Tiptap + tasks + drawing + photos)
│   │   └── reminders/
│   │       └── page.tsx                 # All upcoming + overdue reminders
│   ├── api/
│   │   └── auth/
│   │       └── callback/
│   │           └── route.ts             # Supabase OAuth/magic-link callback handler
│   ├── layout.tsx                       # Root layout (font, metadata, providers)
│   └── globals.css                      # Tailwind base + design token overrides
│
├── components/
│   ├── ui/                              # Primitive design-system components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   ├── Badge.tsx
│   │   ├── Tooltip.tsx
│   │   └── index.ts
│   ├── editor/                          # Tiptap rich-text editor
│   │   ├── PageEditor.tsx               # Top-level editor wrapper with autosave
│   │   ├── EditorToolbar.tsx            # Bold/italic/heading/image toolbar
│   │   └── extensions/
│   │       └── CustomTaskItem.ts        # Extended TaskItem (due-date support)
│   ├── drawing/                         # Excalidraw canvas wrapper
│   │   └── DrawingCanvas.tsx            # Dynamic-imported, client-only canvas
│   ├── tasks/                           # Standalone task block (when not in Tiptap)
│   │   ├── TaskList.tsx                 # DnD-sortable task list container
│   │   ├── TaskItem.tsx                 # Individual task row with checkbox + due date
│   │   └── TaskDueDatePicker.tsx        # Inline date/time picker for tasks
│   ├── photos/
│   │   ├── PhotoUploadButton.tsx        # File input → Supabase Storage upload
│   │   └── PhotoLightbox.tsx            # Full-screen photo viewer
│   ├── reminders/
│   │   ├── ReminderBell.tsx             # Top-bar notification bell with badge count
│   │   └── ReminderPoller.tsx           # Client component: 30 s polling → toast
│   └── layout/
│       ├── Sidebar.tsx                  # Page list navigation + label filters
│       ├── TopBar.tsx                   # Search bar + reminder bell + user menu
│       └── PageListItem.tsx             # Single row in notebook page list
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                    # createBrowserClient (client components)
│   │   └── server.ts                    # createServerClient (server components/actions)
│   ├── hooks/
│   │   ├── use-autosave.ts              # Debounced save (500 ms) on content change
│   │   ├── use-polling.ts               # Generic setInterval-based polling hook
│   │   └── use-reminders.ts             # Polls for due reminders; triggers toasts
│   └── utils/
│       ├── fractional-index.ts          # Wrapper around fractional-indexing library
│       └── content.ts                   # Helpers: extract text from Tiptap JSON
│
├── types/
│   └── index.ts                         # Shared TypeScript interfaces (Page, Task, etc.)
│
└── styles/
    └── design-tokens.css                # CSS custom properties: earthy palette + fonts

tests/
├── unit/                                # Jest + RTL: hooks, utils, components
├── integration/                         # Jest + MSW: editor autosave, task CRUD
└── e2e/                                 # Playwright: sign-up, create page, task flow
```

**Structure Decision**: Web application layout (Option 2 variant) with a single Next.js monorepo —
no separate `backend/` or `frontend/` directories because Supabase replaces the custom backend.
All backend logic lives in Supabase (DB, Auth, Storage) with Next.js Route Handlers only for the
auth callback. Source code lives under `src/` following Next.js App Router conventions.

---

## Complexity Tracking

> No constitution violations identified. Table left intentionally empty.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| — | — | — |
