# API Route Contracts: The Ledger

**Feature**: `001-ledger-notebook-app` | **Date**: 2026-04-16

The Ledger uses Supabase as its backend. **The vast majority of data operations are performed
directly via the Supabase JS client** — there is no custom REST API. Next.js Route Handlers are
used only where the Supabase browser client cannot reach (auth callback).

---

## Next.js Route Handlers

### `GET /api/auth/callback`

**Purpose**: Handles the Supabase email confirmation and password-reset redirect URL. Supabase
Auth redirects the user to this endpoint after clicking an email link; the handler exchanges the
`code` query parameter for a session cookie.

**Request**:

```
GET /api/auth/callback?code={auth_code}&next={redirect_path}
```

| Parameter | Type     | Required | Description                                                |
| --------- | -------- | -------- | ---------------------------------------------------------- |
| `code`    | `string` | Yes      | One-time authorisation code from Supabase Auth             |
| `next`    | `string` | No       | Redirect path after successful auth (default: `/notebook`) |

**Response**:

- `302 Redirect` → `next` path on success, with session cookie set.
- `302 Redirect` → `/login?error=auth_callback_failed` on failure.

**Implementation**: Uses `createServerClient` from `@supabase/ssr` to exchange the code via
`supabase.auth.exchangeCodeForSession(code)`.

---

## Supabase Client Operations (Direct — No Route Handler Required)

These are the Supabase queries used by the frontend. RLS policies enforce all access control;
no custom API validation layer is needed.

### Authentication

| Operation         | Method                                                       | Description                                  |
| ----------------- | ------------------------------------------------------------ | -------------------------------------------- |
| Sign up           | `supabase.auth.signUp({ email, password })`                  | Creates account + triggers notebook creation |
| Sign in           | `supabase.auth.signInWithPassword({ email, password })`      | Issues session cookie                        |
| Sign out          | `supabase.auth.signOut()`                                    | Invalidates session                          |
| Password recovery | `supabase.auth.resetPasswordForEmail(email, { redirectTo })` | Sends reset email                            |
| Update password   | `supabase.auth.updateUser({ password })`                     | Used on the recovery confirmation page       |
| Get session       | `supabase.auth.getUser()`                                    | Returns current authenticated user           |

---

### Pages

| Operation         | Supabase Query                                                                                                | Notes                                |
| ----------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| List pages        | `from('pages').select('id,title,sort_order,updated_at,created_at').eq('notebook_id', id).order('sort_order')` | Used by notebook home + sidebar      |
| Get page          | `from('pages').select('*').eq('id', pageId).single()`                                                         | Full content fetch on page open      |
| Create page       | `from('pages').insert({ notebook_id, title, content: {}, sort_order })`                                       | Returns new page ID                  |
| Update content    | `from('pages').update({ content, updated_at: new Date() }).eq('id', pageId)`                                  | Called by autosave (500 ms debounce) |
| Update title      | `from('pages').update({ title }).eq('id', pageId)`                                                            | Inline title edit                    |
| Update sort_order | `from('pages').update({ sort_order }).eq('id', pageId)`                                                       | After DnD reorder                    |
| Delete page       | `from('pages').delete().eq('id', pageId)`                                                                     | Cascades to tasks, drawings, photos  |
| Search pages      | `rpc('search_pages', { search_query: q })`                                                                    | Full-text search RPC                 |

---

### Tasks

| Operation           | Supabase Query                                                                                                           | Notes                                    |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------- |
| List tasks          | `from('tasks').select('*').eq('page_id', pageId).order('sort_order')`                                                    |                                          |
| Upsert task         | `from('tasks').upsert({ page_id, task_index, text, checked, due_at, sort_order }, { onConflict: 'page_id,task_index' })` | Called on every autosave                 |
| Delete orphan tasks | `from('tasks').delete().eq('page_id', pageId).not('task_index', 'in', activeIndexes)`                                    | Cleans up deleted task items             |
| Update checked      | `from('tasks').update({ checked }).eq('id', taskId)`                                                                     | Checkbox toggle (immediate, no debounce) |
| Update sort_order   | `from('tasks').update({ sort_order }).eq('id', taskId)`                                                                  | After DnD reorder                        |
| Set due date        | `from('tasks').update({ due_at }).eq('id', taskId)`                                                                      | From TaskDueDatePicker                   |

---

### Reminders

| Operation         | Supabase Query                                                                                                 | Notes                                    |
| ----------------- | -------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| Get due reminders | `rpc('get_due_reminders')`                                                                                     | Called every 30 s by `useReminders` hook |
| List upcoming     | `from('reminders').select('*').eq('user_id', uid).eq('status','pending').gte('fire_at', now).order('fire_at')` | Reminders view                           |
| Create reminder   | `from('reminders').insert({ user_id, task_id, fire_at })`                                                      | From TaskDueDatePicker                   |
| Dismiss reminder  | `from('reminders').update({ status: 'dismissed' }).eq('id', reminderId)`                                       | On notification dismiss or task complete |

---

### Labels

| Operation       | Supabase Query                                                               | Notes                          |
| --------------- | ---------------------------------------------------------------------------- | ------------------------------ |
| List labels     | `from('labels').select('*').eq('user_id', uid).order('name')`                |                                |
| Create label    | `from('labels').insert({ user_id, name, color })`                            |                                |
| Delete label    | `from('labels').delete().eq('id', labelId)`                                  | Cascades page_labels join rows |
| Assign label    | `from('page_labels').insert({ page_id, label_id })`                          |                                |
| Remove label    | `from('page_labels').delete().eq('page_id', pageId).eq('label_id', labelId)` |                                |
| Filter by label | `from('pages').select('*').eq('notebook_id', nbId).in('id', subquery)`       | Via `page_labels` join         |

---

### Photos

| Operation        | Supabase Query / Method                                                                                 | Notes                                             |
| ---------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| Upload photo     | `supabase.storage.from('notebook-photos').upload(path, file)`                                           | Client validates size ≤ 10 MB first (FR-019)      |
| Get signed URL   | `supabase.storage.from('notebook-photos').createSignedUrl(path, 3600)`                                  | 1-hour TTL; URL inserted into Tiptap `<img>` node |
| Delete photo     | `supabase.storage.from('notebook-photos').remove([path])` + `from('photos').delete().eq('id', photoId)` | Both storage file and metadata row                |
| List page photos | `from('photos').select('*').eq('page_id', pageId)`                                                      |                                                   |

---

### Drawings

| Operation      | Supabase Query                                                                         | Notes                                             |
| -------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------- |
| Get drawing    | `from('drawings').select('*').eq('page_id', pageId).maybeSingle()`                     | Returns `null` if no canvas yet                   |
| Upsert drawing | `from('drawings').upsert({ page_id, elements, app_state }, { onConflict: 'page_id' })` | Called on Excalidraw `onChange` (500 ms debounce) |

---

## Error Handling Conventions

| Scenario                      | Behaviour                                                                                                       |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Network error during autosave | Retry once after 2 s; show persistent "Save failed" toast after second failure                                  |
| Photo > 10 MB                 | Rejected client-side before upload; toast: "Photo must be under 10 MB" (FR-019)                                 |
| Auth session expired          | Middleware redirects to `/login`; unsaved content in editor state is preserved in `sessionStorage` for recovery |
| Supabase RLS rejection (403)  | Log to console (never expose to user); show generic "Something went wrong" toast                                |
| Empty search results          | Display "No pages found for '{query}'" message inline (FR-013)                                                  |
| Duplicate label name          | Supabase UNIQUE constraint violation caught; toast: "You already have a label called '{name}'"                  |
