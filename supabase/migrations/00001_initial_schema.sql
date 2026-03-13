-- Create Sources Table
CREATE TABLE sources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL, -- References auth.users(id) in a real Supabase setup
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('text', 'markdown', 'url', 'pdf')),
  url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Editor Docs Table
CREATE TABLE editor_docs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies (Row Level Security)
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE editor_docs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own sources"
  ON sources FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own docs"
  ON editor_docs FOR ALL
  USING (auth.uid() = user_id);
