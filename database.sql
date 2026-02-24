
-- ... (existing sql remains the same until migrations part)

-- FIX FOR PROJECTS TABLE: ADD MESSAGES COLUMN IF NOT EXISTS
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='messages') THEN
    ALTER TABLE public.projects ADD COLUMN messages JSONB DEFAULT '[]'::jsonb;
  END IF;
  
  -- Existing migrations continue...
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='config') THEN
    ALTER TABLE public.projects ADD COLUMN config JSONB DEFAULT '{}'::jsonb;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='files') THEN
    ALTER TABLE public.projects ADD COLUMN files JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;
