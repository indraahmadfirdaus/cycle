CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  display_name TEXT,
  gender TEXT CHECK (gender IN ('woman', 'man', 'other')),
  avg_cycle_length INT DEFAULT 28,
  avg_period_duration INT DEFAULT 5,
  tracking_mode TEXT CHECK (tracking_mode IN ('cycle', 'rhythm', 'partner')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, gender, tracking_mode)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    'other',
    'cycle'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE cycle_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE,
  cycle_length INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE daily_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  flow_intensity TEXT CHECK (flow_intensity IN ('none','spotting','light','medium','heavy')),
  symptoms JSONB,
  mood TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, log_date)
);

CREATE TABLE rhythm_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  energy_level INT CHECK (energy_level BETWEEN 1 AND 5),
  mood TEXT,
  sleep_quality INT CHECK (sleep_quality BETWEEN 1 AND 5),
  symptoms JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, log_date)
);

CREATE TABLE partner_pairs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  primary_user_id UUID REFERENCES profiles(id),
  partner_user_id UUID REFERENCES profiles(id),
  invite_token TEXT UNIQUE,
  status TEXT CHECK (status IN ('pending','active','disconnected')),
  visibility_settings JSONB DEFAULT '{"phase": true, "period_date": true, "mood": true, "symptoms": false}'::jsonb,
  connected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ai_chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  messages JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  insight_date DATE NOT NULL,
  content TEXT NOT NULL,
  phase TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, insight_date)
);

CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  subscription JSONB NOT NULL,
  events JSONB DEFAULT '{}'::jsonb,
  delivery_time TEXT DEFAULT '09:00',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cycle_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE rhythm_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_pairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own profile" ON profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users manage own cycle logs" ON cycle_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own daily logs" ON daily_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own rhythm logs" ON rhythm_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own chat" ON ai_chat_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own insights" ON ai_insights FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own push subscriptions" ON push_subscriptions FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users create partner invites" ON partner_pairs
  FOR INSERT WITH CHECK (auth.uid() = primary_user_id);

CREATE POLICY "Primary users manage partner visibility" ON partner_pairs
  FOR UPDATE USING (auth.uid() = primary_user_id)
  WITH CHECK (auth.uid() = primary_user_id);

CREATE POLICY "Partners accept pending codes" ON partner_pairs
  FOR UPDATE USING (
    status = 'pending'
    AND partner_user_id IS NULL
    AND auth.uid() <> primary_user_id
  )
  WITH CHECK (partner_user_id = auth.uid());

CREATE POLICY "Partners read shared daily logs" ON daily_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM partner_pairs
      WHERE primary_user_id = daily_logs.user_id
        AND partner_user_id = auth.uid()
        AND status = 'active'
        AND (visibility_settings->>'symptoms')::boolean = true
    )
  );

CREATE POLICY "Pair members read their connection" ON partner_pairs
  FOR SELECT USING (auth.uid() = primary_user_id OR auth.uid() = partner_user_id);

CREATE INDEX partner_pairs_invite_token_idx ON partner_pairs(invite_token);
CREATE INDEX cycle_logs_user_period_start_idx ON cycle_logs(user_id, period_start DESC);
CREATE INDEX daily_logs_user_log_date_idx ON daily_logs(user_id, log_date DESC);
CREATE INDEX rhythm_logs_user_log_date_idx ON rhythm_logs(user_id, log_date DESC);
CREATE INDEX ai_insights_user_date_idx ON ai_insights(user_id, insight_date DESC);
