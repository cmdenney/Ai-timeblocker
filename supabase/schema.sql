-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE event_category AS ENUM ('work', 'personal', 'meeting', 'break', 'focus', 'other');
CREATE TYPE event_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE message_role AS ENUM ('user', 'assistant', 'system');

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  timezone TEXT DEFAULT 'UTC',
  working_hours JSONB DEFAULT '{"start": 9, "end": 17, "days": [1,2,3,4,5]}',
  preferences JSONB DEFAULT '{"theme": "light", "notifications": true, "emailReminders": true}',
  google_access_token TEXT,
  google_refresh_token TEXT,
  google_calendar_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Calendar events table
CREATE TABLE calendar_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  is_all_day BOOLEAN DEFAULT FALSE,
  location TEXT,
  category event_category DEFAULT 'other',
  priority event_priority DEFAULT 'medium',
  color TEXT,
  recurrence_rule TEXT,
  recurrence_pattern TEXT,
  attendees JSONB,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat sessions table
CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  message_count INTEGER DEFAULT 0
);

-- Chat messages table
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role message_role NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat threads table
CREATE TABLE chat_threads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES chat_threads(id) ON DELETE CASCADE,
  title TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_collapsed BOOLEAN DEFAULT FALSE
);

-- NLP analyses table
CREATE TABLE nlp_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  input_text TEXT NOT NULL,
  analysis_result JSONB NOT NULL,
  confidence_score DECIMAL(3,2) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
  processing_time INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User patterns table
CREATE TABLE user_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pattern_type TEXT NOT NULL,
  pattern_data JSONB NOT NULL,
  confidence DECIMAL(3,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_calendar_events_user_id ON calendar_events(user_id);
CREATE INDEX idx_calendar_events_start_time ON calendar_events(start_time);
CREATE INDEX idx_calendar_events_category ON calendar_events(category);
CREATE INDEX idx_calendar_events_user_start ON calendar_events(user_id, start_time);

CREATE INDEX idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX idx_chat_sessions_last_message_at ON chat_sessions(last_message_at);

CREATE INDEX idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX idx_chat_messages_role ON chat_messages(role);

CREATE INDEX idx_chat_threads_session_id ON chat_threads(session_id);
CREATE INDEX idx_chat_threads_parent_id ON chat_threads(parent_id);

CREATE INDEX idx_nlp_analyses_user_id ON nlp_analyses(user_id);
CREATE INDEX idx_nlp_analyses_created_at ON nlp_analyses(created_at);

CREATE INDEX idx_user_patterns_user_id ON user_patterns(user_id);
CREATE INDEX idx_user_patterns_pattern_type ON user_patterns(pattern_type);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_events_updated_at BEFORE UPDATE ON calendar_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_sessions_updated_at BEFORE UPDATE ON chat_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_messages_updated_at BEFORE UPDATE ON chat_messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_threads_updated_at BEFORE UPDATE ON chat_threads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_patterns_updated_at BEFORE UPDATE ON user_patterns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to update message count
CREATE OR REPLACE FUNCTION update_message_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE chat_sessions 
    SET message_count = message_count + 1,
        last_message_at = NEW.created_at
    WHERE id = NEW.session_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE chat_sessions 
    SET message_count = message_count - 1
    WHERE id = OLD.session_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ language 'plpgsql';

-- Create trigger for message count
CREATE TRIGGER update_message_count_trigger
  AFTER INSERT OR DELETE ON chat_messages
  FOR EACH ROW EXECUTE FUNCTION update_message_count();

-- Create RLS (Row Level Security) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE nlp_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_patterns ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Calendar events policies
CREATE POLICY "Users can view own events" ON calendar_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own events" ON calendar_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own events" ON calendar_events
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own events" ON calendar_events
  FOR DELETE USING (auth.uid() = user_id);

-- Chat sessions policies
CREATE POLICY "Users can view own sessions" ON chat_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions" ON chat_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON chat_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions" ON chat_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- Chat messages policies
CREATE POLICY "Users can view own messages" ON chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chat_sessions 
      WHERE chat_sessions.id = chat_messages.session_id 
      AND chat_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own messages" ON chat_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_sessions 
      WHERE chat_sessions.id = chat_messages.session_id 
      AND chat_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own messages" ON chat_messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM chat_sessions 
      WHERE chat_sessions.id = chat_messages.session_id 
      AND chat_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own messages" ON chat_messages
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM chat_sessions 
      WHERE chat_sessions.id = chat_messages.session_id 
      AND chat_sessions.user_id = auth.uid()
    )
  );

-- Chat threads policies
CREATE POLICY "Users can view own threads" ON chat_threads
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chat_sessions 
      WHERE chat_sessions.id = chat_threads.session_id 
      AND chat_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own threads" ON chat_threads
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_sessions 
      WHERE chat_sessions.id = chat_threads.session_id 
      AND chat_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own threads" ON chat_threads
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM chat_sessions 
      WHERE chat_sessions.id = chat_threads.session_id 
      AND chat_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own threads" ON chat_threads
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM chat_sessions 
      WHERE chat_sessions.id = chat_threads.session_id 
      AND chat_sessions.user_id = auth.uid()
    )
  );

-- NLP analyses policies
CREATE POLICY "Users can view own analyses" ON nlp_analyses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analyses" ON nlp_analyses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User patterns policies
CREATE POLICY "Users can view own patterns" ON user_patterns
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own patterns" ON user_patterns
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own patterns" ON user_patterns
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own patterns" ON user_patterns
  FOR DELETE USING (auth.uid() = user_id);

-- Create views for common queries
CREATE VIEW user_activity_summary AS
SELECT 
  u.id as user_id,
  u.email,
  u.full_name,
  COUNT(DISTINCT ce.id) as total_events,
  COUNT(DISTINCT cs.id) as total_sessions,
  COUNT(DISTINCT cm.id) as total_messages,
  MAX(ce.created_at) as last_event_created,
  MAX(cs.last_message_at) as last_session_activity
FROM users u
LEFT JOIN calendar_events ce ON u.id = ce.user_id
LEFT JOIN chat_sessions cs ON u.id = cs.user_id
LEFT JOIN chat_messages cm ON cs.id = cm.session_id
GROUP BY u.id, u.email, u.full_name;

-- Create function to get user dashboard data
CREATE OR REPLACE FUNCTION get_user_dashboard_data(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'user', (SELECT row_to_json(u) FROM users u WHERE u.id = user_uuid),
    'stats', (
      SELECT json_build_object(
        'total_events', COUNT(ce.id),
        'total_sessions', COUNT(cs.id),
        'total_messages', COUNT(cm.id),
        'events_this_week', COUNT(CASE WHEN ce.created_at >= NOW() - INTERVAL '7 days' THEN 1 END),
        'sessions_this_week', COUNT(CASE WHEN cs.created_at >= NOW() - INTERVAL '7 days' THEN 1 END)
      )
      FROM users u
      LEFT JOIN calendar_events ce ON u.id = ce.user_id
      LEFT JOIN chat_sessions cs ON u.id = cs.user_id
      LEFT JOIN chat_messages cm ON cs.id = cm.session_id
      WHERE u.id = user_uuid
    ),
    'recent_events', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'id', ce.id,
          'title', ce.title,
          'start_time', ce.start_time,
          'end_time', ce.end_time,
          'category', ce.category
        )
        ORDER BY ce.start_time DESC
      ), '[]'::json)
      FROM calendar_events ce
      WHERE ce.user_id = user_uuid
      AND ce.start_time >= NOW() - INTERVAL '7 days'
      LIMIT 10
    ),
    'recent_sessions', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'id', cs.id,
          'title', cs.title,
          'last_message_at', cs.last_message_at,
          'message_count', cs.message_count
        )
        ORDER BY cs.last_message_at DESC
      ), '[]'::json)
      FROM chat_sessions cs
      WHERE cs.user_id = user_uuid
      ORDER BY cs.last_message_at DESC
      LIMIT 5
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_user_dashboard_data(UUID) TO authenticated;
