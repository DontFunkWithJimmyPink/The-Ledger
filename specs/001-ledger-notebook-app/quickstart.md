# Quickstart: The Ledger — Local Development Setup

**Feature**: `001-ledger-notebook-app` | **Date**: 2026-04-16

---

## Prerequisites

| Tool                  | Version | Install                                          |
| --------------------- | ------- | ------------------------------------------------ |
| Node.js               | 20 LTS  | [nodejs.org](https://nodejs.org) or `nvm use 20` |
| npm                   | 10+     | Bundled with Node 20                             |
| Git                   | any     | Pre-installed on most systems                    |
| Supabase CLI          | latest  | `npm install -g supabase`                        |
| Vercel CLI (optional) | latest  | `npm install -g vercel`                          |

> **Windows PowerShell note:** If `npm` is blocked by execution policy, use `npm.cmd`
> instead (for example, `npm.cmd install` and `npm.cmd run dev`).

---

## 1 — Clone the Repository

```bash
git clone https://github.com/DontFunkWithJimmyPink/The-Ledger.git
cd The-Ledger
```

> The repository currently defaults to `main`. The previously referenced
> `001-ledger-notebook-app` branch does not exist.

---

## 2 — Install Dependencies

```bash
npm install
```

On Windows PowerShell, if `npm` fails with an execution policy error, use:

```powershell
npm.cmd install
```

`npm install` may display deprecation and audit warnings without indicating setup failed.

Key packages installed:

- `next` — Next.js 15 (App Router)
- `@supabase/supabase-js`, `@supabase/ssr` — Supabase client
- `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-task-list`, `@tiptap/extension-task-item`, `@tiptap/extension-image`, `@tiptap/extension-placeholder` — Rich text editor
- `@excalidraw/excalidraw` — Drawing canvas
- `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` — Drag-and-drop
- `fractional-indexing` — Stable sort order
- `react-hot-toast` — In-app notifications
- `tailwindcss` — Styling

---

## 3 — Set Up Supabase (Local or Hosted)

### Option A: Supabase Hosted (Recommended for Development)

1. Create a free project at [supabase.com](https://supabase.com).
2. In the current Supabase UI, you may need **Connect**, **Project Settings**, and
   **API Keys** to locate:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon key** (also labeled **publishable key** in newer Supabase dashboard
     versions; both refer to the same public credential) →
     `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. In **SQL Editor**, run the schema file:
   ```
   specs/001-ledger-notebook-app/contracts/database-schema.sql
   ```
4. In **Storage**, create a bucket named `notebook-photos` (set as **private**).
5. In **SQL Editor**, run the storage policies file:
   ```
   specs/001-ledger-notebook-app/contracts/storage-policies.sql
   ```
6. In **Authentication → URL Configuration**, set:
   - **Site URL**: `http://localhost:3000`
   - **Redirect URL**: `http://localhost:3000/api/auth/callback`

### Option B: Supabase Local (Docker)

```bash
# Start local Supabase stack
supabase start

# Apply migrations (once you've moved the schema to supabase/migrations/)
supabase db push
```

Local URLs will be printed by `supabase start`. Use those for your `.env.local`.

---

## 4 — Configure Environment Variables

Create a `.env.local` file in the project root (this file is git-ignored):

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-or-publishable-key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional: override polling interval (ms) for development
NEXT_PUBLIC_POLL_INTERVAL_MS=5000
```

> ⚠️ Never commit `.env.local` or your Supabase service-role key to source control.
> The app currently reads `NEXT_PUBLIC_SUPABASE_ANON_KEY`. If your dashboard only shows a
> **publishable key**, place that value in `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

---

## 5 — Run the Development Server

```bash
npm run dev
```

On Windows PowerShell, if needed:

```powershell
npm.cmd run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

The `/` route is currently a placeholder page. Use the following routes for the
main flow:

- `/register`
- `/login`
- `/notebook`
- `/reminders`

The first time you open the app:

1. Go to `/register` and sign up with an email + password.
2. Check your email for a confirmation link (in local Supabase, use the Inbucket UI at
   [http://localhost:54324](http://localhost:54324)).
3. After confirming, sign in and open `/notebook`.

---

## 6 — Run Tests

```bash
# Unit and integration tests (Jest + React Testing Library)
npm run test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# End-to-end tests (Playwright) — requires the dev server to be running
npm run test:e2e

# E2E in headed mode (for debugging)
npm run test:e2e -- --headed
```

---

## 7 — Lint and Format

```bash
# Lint (ESLint)
npm run lint

# Format (Prettier)
npm run format

# Type-check
npm run type-check
```

All three must pass before a PR can be merged (CI gate).

---

## 8 — Deploy to Vercel

### Via Vercel CLI

```bash
vercel --prod
```

### Via GitHub Integration (Recommended)

1. Push the branch to GitHub.
2. In Vercel, import the repository and select the branch you are deploying (typically
   `main`).
3. Add the same environment variables from `.env.local` in the **Vercel project settings**.
4. Set `NEXT_PUBLIC_APP_URL` to your Vercel deployment URL (e.g., `https://the-ledger.vercel.app`).
5. In your Supabase project, add the Vercel URL to **Auth → URL Configuration → Redirect URLs**.

---

## 9 — Available Scripts

| Script          | Command                 | Description                      |
| --------------- | ----------------------- | -------------------------------- |
| Dev server      | `npm run dev`           | Next.js with hot reload on :3000 |
| Build           | `npm run build`         | Production Next.js build         |
| Start           | `npm run start`         | Run the production build locally |
| Lint            | `npm run lint`          | ESLint check                     |
| Format          | `npm run format`        | Prettier write                   |
| Type-check      | `npm run type-check`    | `tsc --noEmit`                   |
| Test            | `npm run test`          | Jest unit + integration          |
| Test watch      | `npm run test:watch`    | Jest in watch mode               |
| Test coverage   | `npm run test:coverage` | Coverage report (target ≥ 80%)   |
| E2E tests       | `npm run test:e2e`      | Playwright E2E suite             |
| Bundle analysis | `npm run analyze`       | Next.js bundle analyser          |

---

## 10 — Key Directories

```
src/app/             → Next.js App Router pages and layouts
src/components/      → React components (ui/, editor/, drawing/, tasks/, photos/, layout/)
src/lib/supabase/    → Supabase client factory (server.ts + client.ts)
src/lib/hooks/       → Custom hooks (useAutosave, usePolling, useReminders)
src/types/           → Shared TypeScript types
tests/               → Jest (unit/, integration/) + Playwright (e2e/)
specs/001-ledger-notebook-app/   → This feature's design docs and contracts
```

---

## Troubleshooting

| Problem                                                             | Solution                                                                                                                                                |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| "Invalid API key" from Supabase                                     | Check `.env.local` values match the Supabase dashboard exactly.                                                                                         |
| Sign-up email not arriving (local)                                  | Open Inbucket at [http://localhost:54324](http://localhost:54324).                                                                                      |
| `database error saving new user` during sign-up                     | Recreate the `on_auth_user_created` trigger/function shown below so it inserts into `public.notebooks`.                                                 |
| `Authentication failed. Please try again.` after email confirmation | 1. Ensure `NEXT_PUBLIC_APP_URL` is set in your environment (e.g. `http://localhost:3000` locally or your Vercel URL in production). 2. In **Authentication → URL Configuration**, set Site URL to match `NEXT_PUBLIC_APP_URL` and add `<NEXT_PUBLIC_APP_URL>/api/auth/callback` as a redirect URL. |
| Excalidraw SSR error                                                | Ensure the `DrawingCanvas` component is wrapped in `next/dynamic` with `ssr: false`.                                                                    |
| Tiptap `window is not defined`                                      | Wrap any Tiptap usage in a `"use client"` component.                                                                                                    |
| Photos not uploading                                                | Check the `notebook-photos` bucket exists and is **private**, and storage policies are applied.                                                         |
| RLS blocking queries                                                | Confirm you are authenticated (`supabase.auth.getUser()`) and tables have RLS policies applied.                                                         |
| Port conflict on :3000                                              | `npm run dev -- --port 3001`                                                                                                                            |

If sign-up fails with `database error saving new user`, run this in Supabase SQL Editor:

```sql
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists create_notebook_for_user();

create or replace function create_notebook_for_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.notebooks (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function create_notebook_for_user();
```
