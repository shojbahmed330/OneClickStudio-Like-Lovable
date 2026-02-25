
import { useState, useRef, useEffect, useCallback } from 'react';
import { Project, ProjectConfig, WorkspaceType, User as UserType } from '../types';
import { DatabaseService } from '../services/dbService';

export interface ProjectManager {
  currentProjectId: string | null;
  setCurrentProjectId: (id: string | null) => void;
  workspace: WorkspaceType;
  setWorkspace: (w: WorkspaceType) => void;
  projectFiles: Record<string, string>;
  setProjectFiles: (files: Record<string, string>) => void;
  projectFilesRef: React.MutableRefObject<Record<string, string>>;
  projectConfig: ProjectConfig;
  setProjectConfig: (config: ProjectConfig) => void;
  selectedFile: string;
  setSelectedFile: (path: string) => void;
  openTabs: string[];
  setOpenTabs: (tabs: string[] | ((prev: string[]) => string[])) => void;
  history: any[];
  setHistory: (h: any[]) => void;
  isHistoryLoading: boolean;
  setIsHistoryLoading: (b: boolean) => void;
  showHistory: boolean;
  setShowHistory: (b: boolean) => void;
  previewOverride: Record<string, string> | null;
  setPreviewOverride: (files: Record<string, string> | null) => void;
  openFile: (path: string) => void;
  closeFile: (path: string, e?: React.MouseEvent) => void;
  addFile: (path: string) => void;
  deleteFile: (path: string) => void;
  renameFile: (oldPath: string, newPath: string) => void;
  refreshHistory: () => Promise<void>;
  handleDeleteSnapshot: (id: string) => Promise<void>;
  handleRollback: (files: Record<string, string>, message: string) => Promise<void>;
  loadProject: (project: Project) => void;
}

export const useProjectManager = (user: UserType | null, addToast: (msg: string, type?: any) => void): ProjectManager => {
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(localStorage.getItem('active_project_id'));
  const [workspace, setWorkspaceState] = useState<WorkspaceType>('app');
  const [projectFiles, setProjectFiles] = useState<Record<string, string>>({});
  const projectFilesRef = useRef<Record<string, string>>({});
  const [projectConfig, setProjectConfig] = useState<ProjectConfig>({ 
    appName: 'OneClickApp', 
    packageName: 'com.oneclick.studio',
    selected_model: 'gemini-3-flash-preview'
  });
  const [selectedFile, setSelectedFile] = useState('app/index.html');
  const [openTabs, setOpenTabs] = useState<string[]>(['app/index.html']);
  const [history, setHistory] = useState<any[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [previewOverride, setPreviewOverride] = useState<Record<string, string> | null>(null);
  
  const db = DatabaseService.getInstance();

  useEffect(() => {
    projectFilesRef.current = projectFiles;
    if (selectedFile && !projectFiles[selectedFile]) {
      const keys = Object.keys(projectFiles);
      if (keys.length > 0) setSelectedFile(keys[0]);
    }
  }, [projectFiles, selectedFile]);

  const openFile = useCallback((path: string) => {
    setSelectedFile(path);
    setOpenTabs(prev => prev.includes(path) ? prev : [...prev, path]);
  }, []);

  const setWorkspace = useCallback((w: WorkspaceType) => {
    setWorkspaceState(w);
    const files = Object.keys(projectFilesRef.current);
    let target = '';
    if (w === 'app') {
      target = files.find(f => f === 'app/index.html' || f === 'index.html' || f === 'app/main.html') || '';
    } else {
      target = files.find(f => f === 'admin/index.html' || f === 'admin.html' || f === 'admin/main.html') || '';
    }
    if (target && projectFilesRef.current[target]) {
      openFile(target);
    }
  }, [openFile]);

  const closeFile = useCallback((path: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setOpenTabs(prev => {
      const newTabs = prev.filter(t => t !== path);
      if (selectedFile === path) {
        if (newTabs.length > 0) setSelectedFile(newTabs[newTabs.length - 1]);
        else setSelectedFile('');
      }
      return newTabs;
    });
  }, [selectedFile]);

  const addFile = useCallback((path: string) => {
    if (projectFilesRef.current[path]) return;
    setProjectFiles(prev => ({ ...prev, [path]: '' }));
    openFile(path);
  }, [openFile]);

  const deleteFile = useCallback((path: string) => {
    setProjectFiles(prev => {
      const newFiles = { ...prev };
      delete newFiles[path];
      return newFiles;
    });
    closeFile(path);
  }, [closeFile]);

  const renameFile = useCallback((oldPath: string, newPath: string) => {
    setProjectFiles(prev => {
      if (prev[newPath]) return prev;
      const content = prev[oldPath];
      const newFiles = { ...prev };
      delete newFiles[oldPath];
      newFiles[newPath] = content;
      return newFiles;
    });
    setOpenTabs(prev => {
      const updated = prev.map(t => t === oldPath ? newPath : t);
      return Array.from(new Set(updated));
    });
    if (selectedFile === oldPath) setSelectedFile(newPath);
  }, [selectedFile]);

  const refreshHistory = useCallback(async () => {
    if (!currentProjectId) return;
    setIsHistoryLoading(true);
    try {
      const data = await db.getProjectHistory(currentProjectId);
      setHistory(data);
    } catch (e: any) {
      addToast("Failed to load history: " + e.message, "error");
    } finally {
      setIsHistoryLoading(false);
    }
  }, [currentProjectId, db, addToast]);

  const handleDeleteSnapshot = useCallback(async (id: string) => {
    try {
      await db.deleteProjectSnapshot(id);
      setHistory(prev => prev.filter(h => h.id !== id));
      addToast("Snapshot deleted", "success");
    } catch (e: any) {
      addToast("Delete failed: " + e.message, "error");
    }
  }, [db, addToast]);

  const handleRollback = useCallback(async (files: Record<string, string>, message: string) => {
    if (!currentProjectId || !user) return;
    try {
      setProjectFiles(files);
      projectFilesRef.current = files;
      await db.updateProject(user.id, currentProjectId, files, projectConfig);
      addToast(`Restored to: ${message}`, "success");
      setPreviewOverride(null);
      setShowHistory(false);
    } catch (e: any) {
      addToast("Rollback failed: " + e.message, "error");
    }
  }, [currentProjectId, user, db, projectConfig, addToast]);

  const loadProject = useCallback((project: Project) => {
    setCurrentProjectId(project.id);
    localStorage.setItem('active_project_id', project.id);
    setProjectFiles(project.files || {});
    projectFilesRef.current = project.files || {};
    setProjectConfig(project.config || { appName: 'OneClickApp', packageName: 'com.oneclick.studio', selected_model: 'gemini-3-flash-preview' });
    const keys = Object.keys(project.files || {});
    if (keys.length > 0) { 
      setSelectedFile(keys[0]); 
      setOpenTabs([keys[0]]); 
    }
    // refreshHistory is called via useEffect in useAppLogic when showHistory changes
  }, []);

  return {
    currentProjectId, setCurrentProjectId,
    workspace, setWorkspace,
    projectFiles, setProjectFiles, projectFilesRef,
    projectConfig, setProjectConfig,
    selectedFile, setSelectedFile,
    openTabs, setOpenTabs,
    history, setHistory,
    isHistoryLoading, setIsHistoryLoading,
    showHistory, setShowHistory,
    previewOverride, setPreviewOverride,
    openFile, closeFile, addFile, deleteFile, renameFile,
    refreshHistory, handleDeleteSnapshot, handleRollback, loadProject
  };
};
