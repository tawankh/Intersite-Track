-- Migration for Premium Features: Task Comments and Audit Logs

-- 1. Create task_comments table
CREATE TABLE IF NOT EXISTS public.task_comments (
    id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for faster retrieval by task
CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON public.task_comments(task_id, created_at);

-- 2. Create task_audit_logs table
CREATE TABLE IF NOT EXISTS public.task_audit_logs (
    id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for faster retrieval of task history
CREATE INDEX IF NOT EXISTS idx_task_audit_logs_task_id ON public.task_audit_logs(task_id, created_at);

-- Set up Row Level Security (RLS) policies if using Supabase client securely
-- (If relying entirely on the Express backend with a Service Role key, RLS is bypassed.
-- However, enabling them provides defense in depth).

ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated internal roles/functions
CREATE POLICY "Enable read access for all authenticated users" ON public.task_comments FOR SELECT USING (true);
CREATE POLICY "Enable read access for all authenticated users" ON public.task_audit_logs FOR SELECT USING (true);
