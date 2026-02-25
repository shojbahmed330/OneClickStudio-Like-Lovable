
import { useState, useEffect } from 'react';
import { Project } from '../types';
import { DatabaseService } from '../services/dbService';

export const useLiveProject = (path: string) => {
  const [liveProject, setLiveProject] = useState<Project | null>(null);
  const [liveLoading, setLiveLoading] = useState(false);
  const db = DatabaseService.getInstance();

  useEffect(() => {
    if (path.startsWith('/preview/')) {
      const id = path.split('/').pop();
      if (id) {
        setLiveLoading(true);
        db.supabase.from('projects').select('*').eq('id', id).maybeSingle().then(({ data }) => {
          if (data) setLiveProject(data);
          setLiveLoading(false);
        });
      }
    }
  }, [path]);

  return { liveProject, liveLoading };
};
