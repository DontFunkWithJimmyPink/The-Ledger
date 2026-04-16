-- =============================================================================
-- The Ledger — Database Schema
-- Supabase PostgreSQL 15
-- Feature: 001-ledger-notebook-app
-- =============================================================================

-- ---------------------------------------------------------------------------
-- EXTENSIONS
-- ---------------------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pg_trgm";    -- optional: future trigram search

-- ---------------------------------------------------------------------------
-- HELPER FUNCTIONS
-- ---------------------------------------------------------------------------

-- Extracts plain text from a Tiptap JSON document (ProseMirror format)
-- Used by the search_vector trigger on pages.
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
  IF content->'content' IS NOT NULL THEN
    FOR node IN SELECT jsonb_array_elements(content->'content') LOOP
      result := result || ' ' || extract_tiptap_text(node);
    END LOOP;
  END IF;
  RETURN result;
END;
$$;

-- Auto-update updated_at timestamp on any row modification
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- NOTEBOOKS
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS notebooks (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE notebooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notebooks_select" ON notebooks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "notebooks_insert" ON notebooks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "notebooks_update" ON notebooks
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "notebooks_delete" ON notebooks
  FOR DELETE USING (auth.uid() = user_id);

-- Auto-create a notebook for every new confirmed user
CREATE OR REPLACE FUNCTION create_notebook_for_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO notebooks (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_notebook_for_user();

-- ---------------------------------------------------------------------------
-- PAGES
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS pages (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  notebook_id    uuid        NOT NULL REFERENCES notebooks(id) ON DELETE CASCADE,
  title          text        NOT NULL DEFAULT 'Untitled',
  content        jsonb       NOT NULL DEFAULT '{}',
  sort_order     text        NOT NULL DEFAULT 'a0',
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  search_vector  tsvector
);

-- Indexes for sorting and searching
CREATE INDEX IF NOT EXISTS idx_pages_notebook_sort
  ON pages (notebook_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_pages_notebook_updated
  ON pages (notebook_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_pages_notebook_created
  ON pages (notebook_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_pages_search_vector
  ON pages USING GIN (search_vector);

-- Maintain updated_at
CREATE TRIGGER pages_set_updated_at
  BEFORE UPDATE ON pages
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Maintain search_vector from title + Tiptap content
CREATE OR REPLACE FUNCTION pages_search_vector_update()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('pg_catalog.english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('pg_catalog.english', coalesce(extract_tiptap_text(NEW.content), '')), 'B');
  RETURN NEW;
END;
$$;

CREATE TRIGGER pages_search_vector_trigger
  BEFORE INSERT OR UPDATE ON pages
  FOR EACH ROW EXECUTE FUNCTION pages_search_vector_update();

ALTER TABLE pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pages_select" ON pages FOR SELECT
  USING (notebook_id IN (SELECT id FROM notebooks WHERE user_id = auth.uid()));

CREATE POLICY "pages_insert" ON pages FOR INSERT
  WITH CHECK (notebook_id IN (SELECT id FROM notebooks WHERE user_id = auth.uid()));

CREATE POLICY "pages_update" ON pages FOR UPDATE
  USING (notebook_id IN (SELECT id FROM notebooks WHERE user_id = auth.uid()))
  WITH CHECK (notebook_id IN (SELECT id FROM notebooks WHERE user_id = auth.uid()));

CREATE POLICY "pages_delete" ON pages FOR DELETE
  USING (notebook_id IN (SELECT id FROM notebooks WHERE user_id = auth.uid()));

-- RPC: Full-text search returning ranked results
CREATE OR REPLACE FUNCTION search_pages(search_query text)
RETURNS TABLE (
  id          uuid,
  title       text,
  content     jsonb,
  updated_at  timestamptz,
  rank        real
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.title,
    p.content,
    p.updated_at,
    ts_rank(p.search_vector, plainto_tsquery('pg_catalog.english', search_query)) AS rank
  FROM pages p
  JOIN notebooks n ON n.id = p.notebook_id
  WHERE n.user_id = auth.uid()
    AND p.search_vector @@ plainto_tsquery('pg_catalog.english', search_query)
  ORDER BY rank DESC;
END;
$$;

-- ---------------------------------------------------------------------------
-- TASKS
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tasks (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id     uuid        NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  task_index  integer     NOT NULL,
  text        text        NOT NULL DEFAULT '',
  checked     boolean     NOT NULL DEFAULT false,
  due_at      timestamptz,
  sort_order  text        NOT NULL DEFAULT 'a0',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (page_id, task_index)
);

CREATE INDEX IF NOT EXISTS idx_tasks_page_sort
  ON tasks (page_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_tasks_due
  ON tasks (due_at)
  WHERE due_at IS NOT NULL AND checked = false;

CREATE TRIGGER tasks_set_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tasks_select" ON tasks FOR SELECT
  USING (page_id IN (
    SELECT id FROM pages WHERE notebook_id IN (
      SELECT id FROM notebooks WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "tasks_insert" ON tasks FOR INSERT
  WITH CHECK (page_id IN (
    SELECT id FROM pages WHERE notebook_id IN (
      SELECT id FROM notebooks WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "tasks_update" ON tasks FOR UPDATE
  USING (page_id IN (
    SELECT id FROM pages WHERE notebook_id IN (
      SELECT id FROM notebooks WHERE user_id = auth.uid()
    )
  ))
  WITH CHECK (page_id IN (
    SELECT id FROM pages WHERE notebook_id IN (
      SELECT id FROM notebooks WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "tasks_delete" ON tasks FOR DELETE
  USING (page_id IN (
    SELECT id FROM pages WHERE notebook_id IN (
      SELECT id FROM notebooks WHERE user_id = auth.uid()
    )
  ));

-- ---------------------------------------------------------------------------
-- REMINDERS
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS reminders (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id    uuid        REFERENCES tasks(id) ON DELETE CASCADE,
  page_id    uuid        REFERENCES pages(id) ON DELETE CASCADE,
  fire_at    timestamptz NOT NULL,
  status     text        NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending', 'dismissed', 'snoozed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT reminder_must_have_parent CHECK (task_id IS NOT NULL OR page_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_reminders_user_fire
  ON reminders (user_id, fire_at)
  WHERE status = 'pending';

ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reminders_select" ON reminders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "reminders_insert" ON reminders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "reminders_update" ON reminders FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "reminders_delete" ON reminders FOR DELETE
  USING (auth.uid() = user_id);

-- RPC: Fetch due reminders for the current user (used by client polling)
CREATE OR REPLACE FUNCTION get_due_reminders()
RETURNS TABLE (
  id       uuid,
  task_id  uuid,
  page_id  uuid,
  fire_at  timestamptz,
  task_text text,
  page_title text
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id,
    r.task_id,
    r.page_id,
    r.fire_at,
    t.text  AS task_text,
    p.title AS page_title
  FROM reminders r
  LEFT JOIN tasks t  ON t.id = r.task_id
  LEFT JOIN pages p  ON p.id = COALESCE(r.page_id, t.page_id)
  WHERE r.user_id = auth.uid()
    AND r.status  = 'pending'
    AND r.fire_at <= now()
  ORDER BY r.fire_at ASC;
END;
$$;

-- ---------------------------------------------------------------------------
-- LABELS
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS labels (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       text        NOT NULL,
  color      text        NOT NULL DEFAULT 'leather-300',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, name)
);

ALTER TABLE labels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "labels_select" ON labels FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "labels_insert" ON labels FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "labels_update" ON labels FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "labels_delete" ON labels FOR DELETE
  USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- PAGE_LABELS (many-to-many)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS page_labels (
  page_id   uuid NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  label_id  uuid NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
  PRIMARY KEY (page_id, label_id)
);

ALTER TABLE page_labels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "page_labels_select" ON page_labels FOR SELECT
  USING (
    page_id IN (
      SELECT id FROM pages WHERE notebook_id IN (
        SELECT id FROM notebooks WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "page_labels_insert" ON page_labels FOR INSERT
  WITH CHECK (
    page_id IN (
      SELECT id FROM pages WHERE notebook_id IN (
        SELECT id FROM notebooks WHERE user_id = auth.uid()
      )
    )
    AND label_id IN (SELECT id FROM labels WHERE user_id = auth.uid())
  );

CREATE POLICY "page_labels_delete" ON page_labels FOR DELETE
  USING (
    page_id IN (
      SELECT id FROM pages WHERE notebook_id IN (
        SELECT id FROM notebooks WHERE user_id = auth.uid()
      )
    )
  );

-- ---------------------------------------------------------------------------
-- PHOTOS
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS photos (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id       uuid        NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  user_id       uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_path  text        NOT NULL,
  filename      text        NOT NULL,
  mime_type     text        NOT NULL,
  size_bytes    integer     NOT NULL CHECK (size_bytes <= 10485760),  -- 10 MB max (FR-019)
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "photos_select" ON photos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "photos_insert" ON photos FOR INSERT
  WITH CHECK (auth.uid() = user_id
    AND page_id IN (
      SELECT id FROM pages WHERE notebook_id IN (
        SELECT id FROM notebooks WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "photos_delete" ON photos FOR DELETE
  USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- DRAWINGS
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS drawings (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id     uuid        NOT NULL UNIQUE REFERENCES pages(id) ON DELETE CASCADE,
  elements    jsonb       NOT NULL DEFAULT '[]',
  app_state   jsonb       NOT NULL DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER drawings_set_updated_at
  BEFORE UPDATE ON drawings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE drawings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "drawings_select" ON drawings FOR SELECT
  USING (page_id IN (
    SELECT id FROM pages WHERE notebook_id IN (
      SELECT id FROM notebooks WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "drawings_insert" ON drawings FOR INSERT
  WITH CHECK (page_id IN (
    SELECT id FROM pages WHERE notebook_id IN (
      SELECT id FROM notebooks WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "drawings_update" ON drawings FOR UPDATE
  USING (page_id IN (
    SELECT id FROM pages WHERE notebook_id IN (
      SELECT id FROM notebooks WHERE user_id = auth.uid()
    )
  ))
  WITH CHECK (page_id IN (
    SELECT id FROM pages WHERE notebook_id IN (
      SELECT id FROM notebooks WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "drawings_delete" ON drawings FOR DELETE
  USING (page_id IN (
    SELECT id FROM pages WHERE notebook_id IN (
      SELECT id FROM notebooks WHERE user_id = auth.uid()
    )
  ));
