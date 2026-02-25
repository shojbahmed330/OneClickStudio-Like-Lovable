
import React, { useState, useEffect, useCallback } from 'react';
import { User as UserType, Project, BuilderPhase } from '../types';
import { useProjectManager } from './useProjectManager';
import { useBuildManager } from './useBuildManager';
import { useChatLogic } from './useChatLogic';
import { DatabaseService } from '../services/dbService';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'healing';
}

export const useAppLogic = (user: UserType | null, setUser: (u: UserType | null) => void) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [mobileTab, setMobileTab] = useState<'chat' | 'preview'>('chat');

  const addToast = useCallback((message: string, type: ToastMessage['type'] = 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // 1. Project Management
  const projectManager = useProjectManager(user, addToast);

  const handleTokenDeduct = useCallback(async () => {
    if (!user) return true;
    if (user.tokens <= 0) return false;

    const previousTokens = user.tokens;
    setUser({ ...user, tokens: user.tokens - 1 });

    try {
      const updatedUser = await DatabaseService.getInstance().useToken(user.id, user.email);
      if (updatedUser) {
        setUser(updatedUser);
        return true;
      } else {
        setUser({ ...user, tokens: previousTokens });
        return false;
      }
    } catch (e) {
      setUser({ ...user, tokens: previousTokens });
      return false;
    }
  }, [user, setUser]);

  // 2. Chat & AI Logic
  const chatLogic = useChatLogic(
    user,
    projectManager.currentProjectId,
    projectManager.projectFilesRef,
    projectManager.setProjectFiles,
    projectManager.projectConfig,
    projectManager.workspace,
    addToast,
    projectManager.openFile,
    projectManager.refreshHistory,
    handleTokenDeduct
  );

  // 3. Build Management
  const buildManager = useBuildManager(
    user,
    projectManager.projectFilesRef,
    projectManager.projectConfig,
    addToast,
    chatLogic.handleSend
  );

  // Sync project messages when project loads
  const { loadProject: originalLoadProject } = projectManager;
  const loadProject = useCallback((project: Project) => {
    originalLoadProject(project);
    chatLogic.setMessages(project.messages || []);
  }, [originalLoadProject, chatLogic.setMessages]);

  // Sync history refresh
  useEffect(() => {
    if (projectManager.showHistory) projectManager.refreshHistory();
  }, [projectManager.showHistory, projectManager.refreshHistory]);

  // Listen for Runtime Errors from Preview Iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'RUNTIME_ERROR') {
        const error = event.data.error;
        chatLogic.setRuntimeError(error);
        addToast(`Runtime Error: ${error.message}`, 'error');
        
        setTimeout(() => {
          if (!chatLogic.isGenerating && !chatLogic.isRepairing) {
            chatLogic.handleAutoFix();
          }
        }, 1000);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [addToast, chatLogic.isGenerating, chatLogic.isRepairing, chatLogic.handleAutoFix, chatLogic.setRuntimeError]);

  return {
    // Project State
    currentProjectId: projectManager.currentProjectId,
    workspace: projectManager.workspace,
    setWorkspace: projectManager.setWorkspace,
    projectFiles: projectManager.projectFiles,
    setProjectFiles: projectManager.setProjectFiles,
    projectConfig: projectManager.projectConfig,
    setProjectConfig: projectManager.setProjectConfig,
    selectedFile: projectManager.selectedFile,
    setSelectedFile: projectManager.setSelectedFile,
    openTabs: projectManager.openTabs,
    history: projectManager.history,
    isHistoryLoading: projectManager.isHistoryLoading,
    showHistory: projectManager.showHistory,
    setShowHistory: projectManager.setShowHistory,
    previewOverride: projectManager.previewOverride,
    setPreviewOverride: projectManager.setPreviewOverride,
    
    // Project Methods
    loadProject,
    addFile: projectManager.addFile,
    deleteFile: projectManager.deleteFile,
    renameFile: projectManager.renameFile,
    openFile: projectManager.openFile,
    closeFile: projectManager.closeFile,
    refreshHistory: projectManager.refreshHistory,
    handleDeleteSnapshot: projectManager.handleDeleteSnapshot,
    handleRollback: projectManager.handleRollback,

    // Chat State
    messages: chatLogic.messages,
    input: chatLogic.input,
    setInput: chatLogic.setInput,
    isGenerating: chatLogic.isGenerating,
    currentAction: chatLogic.currentAction,
    executionQueue: chatLogic.executionQueue,
    lastThought: chatLogic.lastThought,
    currentPlan: chatLogic.currentPlan,
    phase: chatLogic.phase,
    setPhase: chatLogic.setPhase,
    builderStatuses: chatLogic.builderStatuses,
    selectedImage: chatLogic.selectedImage,
    setSelectedImage: chatLogic.setSelectedImage,
    waitingForApproval: chatLogic.waitingForApproval,
    runtimeError: chatLogic.runtimeError,
    isRepairing: chatLogic.isRepairing,
    repairSuccess: chatLogic.repairSuccess,

    // Chat Methods
    handleSend: chatLogic.handleSend,
    handleStop: chatLogic.handleStop,
    handleImageSelect: chatLogic.handleImageSelect,
    handleAutoFix: chatLogic.handleAutoFix,

    // Build State
    buildStatus: buildManager.buildStatus,
    setBuildStatus: buildManager.setBuildStatus,
    buildSteps: buildManager.buildSteps,
    isDownloading: buildManager.isDownloading,
    githubConfig: buildManager.githubConfig,
    setGithubConfig: buildManager.setGithubConfig,

    // Build Methods
    handleBuildAPK: buildManager.handleBuildAPK,
    handleSecureDownload: buildManager.handleSecureDownload,

    // UI State
    mobileTab,
    setMobileTab,
    toasts,
    addToast,
    removeToast
  };
};
