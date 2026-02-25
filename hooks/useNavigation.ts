
import { useState, useEffect } from 'react';
import { AppMode } from '../types';

export const useNavigation = () => {
  const [path, setPath] = useState(window.location.pathname);
  const [mode, setMode] = useState<AppMode>(AppMode.PREVIEW);

  const navigateTo = (newPath: string, newMode?: AppMode) => {
    try { 
      if (window.location.pathname !== newPath) {
        window.history.pushState({}, '', newPath);
      }
    } catch (e) {}
    setPath(newPath);
    if (newMode) setMode(newMode);
  };

  useEffect(() => {
    const handlePopState = () => setPath(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return { path, setPath, mode, setMode, navigateTo };
};
