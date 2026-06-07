CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  user_agent TEXT,
  ip_hash TEXT
);

CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  project_name TEXT NOT NULL,
  project_url TEXT,
  project_context JSONB NOT NULL,
  overall_score INTEGER NOT NULL CHECK (overall_score BETWEEN 0 AND 100),
  score_tier TEXT NOT NULL CHECK (score_tier IN ('NOT_READY', 'GETTING_THERE', 'ALMOST', 'SHIP_IT')),
  answers JSONB NOT NULL,
  ai_feedback JSONB NOT NULL,
  section_scores JSONB NOT NULL,
  overall_insight TEXT NOT NULL,
  is_public BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS drop_off_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id),
  report_id UUID REFERENCES reports(id),
  question_index INTEGER NOT NULL,
  section_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  event_type TEXT NOT NULL CHECK (event_type IN ('exit', 'back', 'skip'))
);

CREATE TABLE IF NOT EXISTS feedback_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES reports(id),
  question_id TEXT NOT NULL,
  reaction TEXT NOT NULL CHECK (reaction IN ('helpful', 'not_helpful')),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public reports readable" ON reports;
CREATE POLICY "Public reports readable" ON reports FOR SELECT USING (is_public = true);
DROP POLICY IF EXISTS "Insert reports" ON reports;
CREATE POLICY "Insert reports" ON reports FOR INSERT WITH CHECK (true);

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Insert sessions" ON sessions;
CREATE POLICY "Insert sessions" ON sessions FOR INSERT WITH CHECK (true);

ALTER TABLE drop_off_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Insert drop_off" ON drop_off_events;
CREATE POLICY "Insert drop_off" ON drop_off_events FOR INSERT WITH CHECK (true);

ALTER TABLE feedback_reactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Manage reactions" ON feedback_reactions;
CREATE POLICY "Manage reactions" ON feedback_reactions FOR ALL USING (true);

GRANT USAGE ON SCHEMA public TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON sessions TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON reports TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON drop_off_events TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON feedback_reactions TO service_role;
