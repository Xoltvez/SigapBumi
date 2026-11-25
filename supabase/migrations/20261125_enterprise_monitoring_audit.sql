-- Non-destructive Enterprise Monitoring, Audit Trail & Security Center Migration
-- SigapBumi Command Center

-- 1. Indeks tambahan pada tabel audit_logs existing
CREATE INDEX IF NOT EXISTS audit_logs_action_idx ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS audit_logs_actor_idx ON public.audit_logs(actor_id);

-- 2. Tabel Sesi & Heartbeat Petugas (User Monitoring)
CREATE TABLE IF NOT EXISTS public.admin_user_sessions (
  session_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  role TEXT NOT NULL,
  unit TEXT NOT NULL,
  unit_name TEXT NOT NULL,
  ip_address TEXT,
  device_meta TEXT,
  current_path TEXT,
  status TEXT NOT NULL DEFAULT 'online',
  login_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  logout_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS admin_user_sessions_user_idx ON public.admin_user_sessions(user_id);
CREATE INDEX IF NOT EXISTS admin_user_sessions_last_active_idx ON public.admin_user_sessions(last_active_at DESC);

-- 3. Tabel Security Events (Security Center)
CREATE TABLE IF NOT EXISTS public.security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  severity TEXT NOT NULL DEFAULT 'medium',
  event_type TEXT NOT NULL,
  actor_id TEXT,
  actor_name TEXT,
  unit TEXT,
  ip_address TEXT,
  summary TEXT NOT NULL,
  meta JSONB,
  resolved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS security_events_created_idx ON public.security_events(created_at DESC);
CREATE INDEX IF NOT EXISTS security_events_type_idx ON public.security_events(event_type);

-- 4. Tabel Web Analytics Publik (Terpisah dari aktivitas petugas)
CREATE TABLE IF NOT EXISTS public.web_analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  session_id TEXT NOT NULL,
  visitor_id TEXT NOT NULL,
  path TEXT NOT NULL,
  label TEXT,
  device TEXT,
  referrer TEXT,
  region TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS web_analytics_created_idx ON public.web_analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS web_analytics_path_idx ON public.web_analytics_events(path);
