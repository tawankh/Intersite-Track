-- Complete schema gaps for deployed Intersite Track app
-- Adds missing premium feature tables and Trello sync payload columns.

CREATE TABLE IF NOT EXISTS public.task_comments (
    id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_task_comments_task_id_created_at
    ON public.task_comments(task_id, created_at);

CREATE TABLE IF NOT EXISTS public.task_audit_logs (
    id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_task_audit_logs_task_id_created_at
    ON public.task_audit_logs(task_id, created_at);

ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_audit_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'task_comments'
          AND policyname = 'task_comments_authenticated_select'
    ) THEN
        CREATE POLICY task_comments_authenticated_select
            ON public.task_comments
            FOR SELECT
            TO authenticated
            USING (true);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'task_audit_logs'
          AND policyname = 'task_audit_logs_authenticated_select'
    ) THEN
        CREATE POLICY task_audit_logs_authenticated_select
            ON public.task_audit_logs
            FOR SELECT
            TO authenticated
            USING (true);
    END IF;
END $$;

ALTER TABLE public.trello_sync_logs
    ADD COLUMN IF NOT EXISTS request_payload JSONB,
    ADD COLUMN IF NOT EXISTS response_payload JSONB;

CREATE INDEX IF NOT EXISTS idx_trello_sync_logs_task_id_created_at
    ON public.trello_sync_logs(task_id, created_at DESC);

