
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { User as UserType, ProjectConfig, Project, WorkspaceType, BuildStep, GithubConfig, ChatMessage, AIModel, BuilderPhase } from '../types';
import { AIController } from '../services/controller';
import { DatabaseService } from '../services/dbService';
import { GithubService } from '../services/githubService';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'healing';
}

export const useAppLogic = (user: UserType | null, setUser: (u: UserType | null) => void) => {
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(localStorage.getItem('active_project_id'));
  const [workspace, setWorkspaceState] = useState<WorkspaceType>('app');
  
  const setWorkspace = (w: WorkspaceType) => {
    setWorkspaceState(w);
    // Auto-switch editor to relevant entry point
    const files = Object.keys(projectFilesRef.current);
    let target = '';
    if (w === 'app') {
      target = files.find(f => f === 'app/index.html' || f === 'index.html' || f === 'app/main.html') || '';
    } else {
      target = files.find(f => f === 'admin/index.html' || f === 'admin.html' || f === 'admin/main.html') || '';
    }
    if (target && projectFilesRef.current[target]) {
      setSelectedFile(target);
      setOpenTabs(prev => prev.includes(target) ? prev : [...prev, target]);
    }
  };
  const [mobileTab, setMobileTab] = useState<'chat' | 'preview'>('chat');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [phase, setPhase] = useState<BuilderPhase>(BuilderPhase.EMPTY);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentAction, setCurrentAction] = useState<string | null>(null);
  const [executionQueue, setExecutionQueue] = useState<string[]>([]);
  const [projectFiles, setProjectFiles] = useState<Record<string, string>>({});
  const projectFilesRef = useRef<Record<string, string>>({});
  
  const [projectConfig, setProjectConfig] = useState<ProjectConfig>({ 
    appName: 'OneClickApp', 
    packageName: 'com.oneclick.studio',
    selected_model: 'gemini-3-flash-preview'
  });
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const [selectedFile, setSelectedFile] = useState('app/index.html');
  const [openTabs, setOpenTabs] = useState<string[]>(['app/index.html']);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [lastThought, setLastThought] = useState<string>('');
  const [currentPlan, setCurrentPlan] = useState<string[]>([]);
  const [waitingForApproval, setWaitingForApproval] = useState(false);
  const autoStepCountRef = useRef(0);

  const [buildStatus, setBuildStatus] = useState<{status: string; message: string; apkUrl: string; webUrl: string; runUrl: string}>({ 
    status: 'idle', message: '', apkUrl: '', webUrl: '', runUrl: '' 
  });
  const [buildSteps, setBuildSteps] = useState<BuildStep[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ data: string; mimeType: string; preview: string } | null>(null);
  
  // Self-Healing States
  const [runtimeError, setRuntimeError] = useState<{ message: string; line: number; source: string } | null>(null);
  const [isRepairing, setIsRepairing] = useState(false);
  const [repairSuccess, setRepairSuccess] = useState(false);
  
  const [history, setHistory] = useState<any[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [previewOverride, setPreviewOverride] = useState<Record<string, string> | null>(null);
  
  // Persisted Config with LocalStorage Fallback
  const [githubConfig, setGithubConfigState] = useState<GithubConfig>(() => {
    const cached = localStorage.getItem('gh_config_cache');
    if (cached) return JSON.parse(cached);
    return { token: '', owner: '', repo: '' };
  });

  const setGithubConfig = (config: GithubConfig) => {
    setGithubConfigState(config);
    localStorage.setItem('gh_config_cache', JSON.stringify(config));
  };

  // Sync state when user object loads or changes
  useEffect(() => {
    if (user) {
      const dbConfig = { 
        token: user.github_token || githubConfig.token || '', 
        owner: user.github_owner || githubConfig.owner || '', 
        repo: user.github_repo || githubConfig.repo || '' 
      };
      setGithubConfigState(dbConfig);
      localStorage.setItem('gh_config_cache', JSON.stringify(dbConfig));
    }
  }, [user]);

  const controller = useRef(new AIController());
  const github = useRef(new GithubService());
  const db = DatabaseService.getInstance();

  useEffect(() => {
    projectFilesRef.current = projectFiles;
    if (selectedFile && !projectFiles[selectedFile]) {
      const keys = Object.keys(projectFiles);
      if (keys.length > 0) setSelectedFile(keys[0]);
    }
  }, [projectFiles]);

  const addToast = useCallback((message: string, type: ToastMessage['type'] = 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsGenerating(false);
      setCurrentAction(null);
      addToast("AI Output Terminated.", "info");
    }
  };

  const handleImageSelect = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setSelectedImage({
        data: base64.split(',')[1],
        mimeType: file.type,
        preview: base64
      });
    };
    reader.readAsDataURL(file);
  };

  const openFile = (path: string) => {
    setSelectedFile(path);
    setOpenTabs(prev => prev.includes(path) ? prev : [...prev, path]);
  };

  const closeFile = (path: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const newTabs = openTabs.filter(t => t !== path);
    setOpenTabs(newTabs);
    if (selectedFile === path && newTabs.length > 0) {
      setSelectedFile(newTabs[newTabs.length - 1]);
    } else if (newTabs.length === 0) {
      setSelectedFile('');
    }
  };

  const addFile = (path: string) => {
    if (projectFiles[path]) return;
    setProjectFiles(prev => ({ ...prev, [path]: '' }));
    openFile(path);
  };

  const deleteFile = (path: string) => {
    const newFiles = { ...projectFiles };
    delete newFiles[path];
    setProjectFiles(newFiles);
    closeFile(path);
  };

  const renameFile = (oldPath: string, newPath: string) => {
    if (projectFiles[newPath]) return;
    const content = projectFiles[oldPath];
    const newFiles = { ...projectFiles };
    delete newFiles[oldPath];
    newFiles[newPath] = content;
    setProjectFiles(newFiles);
    setOpenTabs(prev => {
      const updated = prev.map(t => t === oldPath ? newPath : t);
      return Array.from(new Set(updated));
    });
    if (selectedFile === oldPath) setSelectedFile(newPath);
  };

  const handleSend = async (customPrompt?: string, isAuto: boolean = false, overrideQueue?: string[]) => {
    if (isGenerating && !isAuto) return;
    const promptText = (customPrompt || input).trim();
    if (!promptText && !selectedImage) return;

    // Phase Transitions
    if (phase === BuilderPhase.EMPTY && !isAuto) {
      setPhase(BuilderPhase.PROMPT_SENT);
    }

    const activeQueue = overrideQueue !== undefined ? overrideQueue : executionQueue;
    const currentModel = projectConfig.selected_model || 'gemini-3-flash-preview';

    // Handle Approval
    if (waitingForApproval && !isAuto) {
      const lowerInput = promptText.toLowerCase();
      if (['yes', 'ha', 'proceed', 'y', 'correct'].includes(lowerInput)) {
        setWaitingForApproval(false);
        const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: "Yes, proceed.", timestamp: Date.now() };
        setMessages(prev => [...prev, userMsg]);
        const nextTask = activeQueue[0];
        const newQueue = activeQueue.slice(1);
        setExecutionQueue(newQueue);
        handleSend(`DECISION: User confirmed. Execute the plan: ${nextTask}`, true, newQueue);
        return;
      }
    }

    setIsGenerating(true);
    setCurrentAction("Engineering Node...");
    abortControllerRef.current = new AbortController();
    
    try {
      const currentImage = selectedImage ? { data: selectedImage.data, mimeType: selectedImage.mimeType } : undefined;
      
      if (!isAuto) {
        autoStepCountRef.current = 0; // Reset on manual user input
        const userMsg: ChatMessage = { 
          id: Date.now().toString(), 
          role: 'user', 
          content: promptText, 
          image: selectedImage?.preview, 
          timestamp: Date.now() 
        };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setSelectedImage(null);
      }

      const assistantId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '', timestamp: Date.now(), model: currentModel }]);

      let fullJsonString = '';
      let streamedAnswer = '';
      
      // Capture current state of files for the stream
      const currentFiles = { ...projectFilesRef.current };
      // Capture current messages for the stream (including the one we just added if not auto)
      let messagesForStream = [...messages];
      if (!isAuto) {
        messagesForStream.push({ 
          id: Date.now().toString(), 
          role: 'user', 
          content: promptText, 
          image: selectedImage?.preview, 
          timestamp: Date.now() 
        });
      }

      const stream = controller.current.processRequestStream(
        promptText, 
        currentFiles, 
        messagesForStream, 
        workspace,
        currentModel
      );

      for await (const chunk of stream) {
        fullJsonString += chunk;
        
        // Extract thought for real-time status
        const thoughtMatch = fullJsonString.match(/"thought":\s*"([^"]*)"/);
        if (thoughtMatch && thoughtMatch[1]) {
          const currentThought = thoughtMatch[1].replace(/\\n/g, '\n');
          setCurrentAction(currentThought);
          setLastThought(currentThought);
        }

        // Extract answer for real-time message content
        const answerMatch = fullJsonString.match(/"answer":\s*"([^"]*)"/);
        if (answerMatch && answerMatch[1]) {
          const currentAnswerPart = answerMatch[1].replace(/\\n/g, '\n');
          if (currentAnswerPart !== streamedAnswer) {
            streamedAnswer = currentAnswerPart;
            setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: streamedAnswer } : m));
          }
        }

        // Fallback status updates if thought is not yet available
        if (!thoughtMatch) {
          if (fullJsonString.includes('"answer":')) setCurrentAction("Drafting Implementation...");
          else if (fullJsonString.includes('"files":')) setCurrentAction("Writing Production Code...");
          else if (fullJsonString.includes('"questions":')) setCurrentAction("Analyzing Requirements...");
        }
      }

      const res = JSON.parse(fullJsonString);
      if (res.thought) setLastThought(res.thought);

      // Phase Logic based on AI response
      if (!isAuto) {
        if (res.questions && res.questions.length > 0) {
          setPhase(BuilderPhase.QUESTIONING);
        } else if (res.files && Object.keys(res.files).length > 0) {
          setPhase(BuilderPhase.BUILDING);
        }
      }
      
      let updatedFiles = { ...projectFilesRef.current };
      if (res.files && Object.keys(res.files).length > 0) {
        updatedFiles = { ...updatedFiles, ...res.files };
        setProjectFiles(updatedFiles);
        projectFilesRef.current = updatedFiles;
        const fileKeys = Object.keys(res.files);
        const priorityFile = fileKeys.find(k => k.includes('index.html')) || fileKeys[0];
        if (priorityFile) openFile(priorityFile);
        addToast("Files implemented successfully!", "success");

        // Create a snapshot for history
        if (currentProjectId) {
          db.createProjectSnapshot(currentProjectId, updatedFiles, res.answer.slice(0, 100))
            .then(() => refreshHistory())
            .catch(e => console.error("Snapshot failed:", e));
        }

        // Transition to PREVIEW_READY after building
        if (phase === BuilderPhase.BUILDING || phase === BuilderPhase.PROMPT_SENT) {
           setPhase(BuilderPhase.PREVIEW_READY);
        }
      }

      let nextPlan = res.plan || [];
      if (nextPlan.length > 0 && !isAuto) {
        setCurrentPlan(nextPlan);
        setExecutionQueue(nextPlan.slice(1));
      }

      // Filter out invalid questions
      const validQuestions = (res.questions || []).filter((q: any) => q && q.text && q.options && q.options.length > 0);

      const finalAssistantMsg: ChatMessage = { 
        id: assistantId, role: 'assistant', content: res.answer, 
        plan: isAuto ? currentPlan : (res.plan || []), questions: validQuestions,
        isApproval: false, model: currentModel, files: res.files, thought: res.thought, timestamp: Date.now()
      };

      setMessages(prev => {
        // Find the assistant message we were streaming and update it with final data
        const updated = prev.map(m => m.id === assistantId ? finalAssistantMsg : m);
        // If for some reason it's not there, add it (shouldn't happen)
        if (!updated.find(m => m.id === assistantId)) {
          return [...updated, finalAssistantMsg];
        }
        return updated;
      });

      if (currentProjectId && user) {
        await db.updateProject(user.id, currentProjectId, updatedFiles, projectConfig);
        // We need the latest messages to save to DB
        setMessages(current => {
          db.supabase.from('projects').update({ messages: current }).eq('id', currentProjectId);
          return current;
        });
      }

      // Autonomous Execution: If there are more steps in the plan, trigger the next one automatically
      const hasMoreSteps = (isAuto && activeQueue.length > 0) || (!isAuto && nextPlan.length > 1);
      
      if (hasMoreSteps) {
        if (autoStepCountRef.current >= 10) {
          addToast("Autonomous execution limit reached to prevent loops.", "info");
          setIsGenerating(false);
          return;
        }

        autoStepCountRef.current++;
        const nextStepName = isAuto ? activeQueue[0] : nextPlan[1];
        const newQueue = isAuto ? activeQueue.slice(1) : nextPlan.slice(2);
        setExecutionQueue(newQueue);
        
        // Small delay to let the UI update and avoid hitting rate limits too fast
        setTimeout(() => {
          handleSend(`AUTONOMOUS EXECUTION: Proceeding with next step: ${nextStepName}`, true, newQueue);
        }, 1500);
      } else {
        // Run unit tests after the final step
        runUnitTests();
      }
    } catch (err: any) {
      if (err.name === 'AbortError') console.log("Generation aborted");
      else addToast(err.message, 'error');
    } finally {
      setIsGenerating(false);
      setCurrentAction(null);
      abortControllerRef.current = null;
    }
  };

  const handleBuildAPK = async (onRedirect?: () => void) => {
    if (!githubConfig.token || !githubConfig.owner || !githubConfig.repo) {
      addToast("GitHub Infrastructure is not configured. Please setup in settings.", "error");
      onRedirect?.();
      return;
    }

    setBuildStatus({ status: 'pushing', message: 'Uplinking source code...', apkUrl: '', webUrl: '', runUrl: '' });
    setBuildSteps([{ name: 'Source Analysis', status: 'completed', conclusion: 'success' }, { name: 'Cloud Sync', status: 'in_progress', conclusion: null }]);

    try {
      // 1. Ensure Repo & Secrets are synced
      await github.current.createRepo(githubConfig.token, githubConfig.repo);
      
      if (projectConfig.supabase_url && projectConfig.supabase_key) {
        setBuildStatus(prev => ({ ...prev, message: 'Syncing Database Secrets...' }));
        await github.current.setRepoSecret(githubConfig, 'SUPABASE_URL', projectConfig.supabase_url);
        await github.current.setRepoSecret(githubConfig, 'SUPABASE_KEY', projectConfig.supabase_key);
      }

      await github.current.pushToGithub(githubConfig, projectFilesRef.current, projectConfig);
      setBuildSteps(prev => prev.map(s => s.name === 'Cloud Sync' ? { ...s, status: 'completed', conclusion: 'success' } : s).concat([{ name: 'Build Engine Trigger', status: 'in_progress', conclusion: null }]));
      
      setBuildStatus(prev => ({ ...prev, status: 'building', message: 'Build Engine Initialized. Polling status...' }));
      
      let attempts = 0;
      const interval = setInterval(async () => {
        attempts++;
        const details = await github.current.getRunDetails(githubConfig);
        if (details) {
          const { run, jobs } = details;
          const mappedSteps: BuildStep[] = jobs.flatMap((j: any) => (j.steps || []).map((s: any) => ({
            name: s.name,
            status: s.status === 'completed' ? 'completed' : s.status === 'in_progress' ? 'in_progress' : 'queued',
            conclusion: s.conclusion as any
          })));
          setBuildSteps(mappedSteps);

          if (run.status === 'completed') {
            clearInterval(interval);
            if (run.conclusion === 'success') {
              const apk = await github.current.getLatestApk(githubConfig);
              setBuildStatus({ status: 'success', message: 'Compilation successful!', apkUrl: apk?.downloadUrl || '', webUrl: apk?.webUrl || '', runUrl: apk?.runUrl || '' });
              addToast("Build engine completed successfully!", "success");
            } else {
              setBuildStatus({ status: 'error', message: 'Build failed. Analyzing logs for auto-repair...', apkUrl: '', webUrl: '', runUrl: run.html_url });
              addToast("Build failed. Analyzing logs...", "error");
              
              // Build Feedback Loop: Fetch logs and trigger repair
              const failedJob = jobs.find((j: any) => j.conclusion === 'failure');
              if (failedJob) {
                const logs = await github.current.getJobLogs(githubConfig, failedJob.id);
                if (logs) {
                  const buildErrorContext = `BUILD FAILURE DETECTED ON GITHUB ACTIONS:
Job: ${failedJob.name}
Logs Snippet:
${logs.slice(-2000)}

INSTRUCTION: Analyze the build logs above. Identify the cause of the failure (e.g., missing dependencies, syntax errors, configuration issues) and fix it. Update the necessary files and explain the fix.`;
                  
                  setTimeout(() => {
                    addToast("Build Feedback Loop: Triggering auto-repair...", "healing");
                    handleSend(buildErrorContext, true);
                  }, 2000);
                }
              }
            }
          }
        }
        if (attempts > 120) { clearInterval(interval); setBuildStatus({ status: 'error', message: 'Timeout polling build status.', apkUrl: '', webUrl: '', runUrl: '' }); }
      }, 10000);
    } catch (e: any) {
      setBuildStatus({ status: 'error', message: e.message, apkUrl: '', webUrl: '', runUrl: '' });
      addToast(e.message, "error");
    }
  };

  const handleSecureDownload = async () => {
    if (!buildStatus.apkUrl) return;
    setIsDownloading(true);
    try {
      const blob = await github.current.downloadArtifact(githubConfig, buildStatus.apkUrl);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${projectConfig.appName || 'app'}-build.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      addToast("Secure download failed: " + e.message, "error");
    } finally {
      setIsDownloading(false);
    }
  };

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

  const handleDeleteSnapshot = async (id: string) => {
    try {
      await db.deleteProjectSnapshot(id);
      setHistory(prev => prev.filter(h => h.id !== id));
      addToast("Snapshot deleted", "success");
    } catch (e: any) {
      addToast("Delete failed: " + e.message, "error");
    }
  };

  const handleRollback = async (files: Record<string, string>, message: string) => {
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
  };

  useEffect(() => {
    if (showHistory) refreshHistory();
  }, [showHistory, refreshHistory]);

  // Listen for Runtime Errors from Preview Iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'RUNTIME_ERROR') {
        const error = event.data.error;
        setRuntimeError(error);
        addToast(`Runtime Error: ${error.message}`, 'error');
        
        // Fully Autonomous Self-Healing: Trigger fix automatically
        // We use a small delay to ensure states are updated
        setTimeout(() => {
          if (!isGenerating && !isRepairing) {
            handleAutoFix();
          }
        }, 1000);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [addToast, isGenerating, isRepairing]); // Dependencies updated to include isGenerating and isRepairing

  const handleAutoFix = async () => {
    if (!runtimeError) return;
    
    setIsRepairing(true);
    setRepairSuccess(false);
    addToast("Self-Healing Node: Analyzing error...", "healing");

    const errorContext = `RUNTIME ERROR DETECTED:
Message: ${runtimeError.message}
File: ${runtimeError.source}
Line: ${runtimeError.line}

INSTRUCTION: Fix this error immediately. Analyze the code in ${runtimeError.source} and provide a corrected version. Ensure the fix is robust.`;

    try {
      await handleSend(errorContext, true);
      setRepairSuccess(true);
      setRuntimeError(null);
      addToast("Self-Healing Complete: Error resolved.", "success");
      
      // Clear success state after 3 seconds
      setTimeout(() => setRepairSuccess(false), 3000);
    } catch (e: any) {
      addToast("Self-Healing Failed: " + e.message, "error");
    } finally {
      setIsRepairing(false);
    }
  };

  const runUnitTests = async () => {
    const testFiles = Object.keys(projectFilesRef.current).filter(path => path.startsWith('tests/'));
    if (testFiles.length === 0) return;

    addToast(`Running ${testFiles.length} unit tests...`, "info");
    const failures: string[] = [];

    for (const path of testFiles) {
      try {
        const content = projectFilesRef.current[path];
        // Basic execution of the test content
        // In a real environment, we'd use a proper test runner
        // Here we simulate it by evaluating the logic
        const testFn = new Function(content);
        testFn();
      } catch (e: any) {
        failures.push(`Test Failed: ${path}\nError: ${e.message}`);
      }
    }

    if (failures.length > 0) {
      addToast(`${failures.length} tests failed. Triggering auto-repair...`, "error");
      const testFailureContext = `UNIT TEST FAILURES DETECTED:
${failures.join('\n\n')}

INSTRUCTION: Analyze the test failures above. Fix the logic in the corresponding files to ensure all tests pass. Update the tests if necessary.`;
      
      setTimeout(() => {
        handleSend(testFailureContext, true);
      }, 1500);
    } else {
      addToast("All unit tests passed!", "success");
    }
  };

  const loadProject = (project: Project) => {
    setCurrentProjectId(project.id);
    localStorage.setItem('active_project_id', project.id);
    setProjectFiles(project.files || {});
    projectFilesRef.current = project.files || {};
    setMessages(project.messages || []);
    setProjectConfig(project.config || { appName: 'OneClickApp', packageName: 'com.oneclick.studio', selected_model: 'gemini-3-flash-preview' });
    const keys = Object.keys(project.files || {});
    if (keys.length > 0) { setSelectedFile(keys[0]); setOpenTabs([keys[0]]); }
    refreshHistory();
  };

  return {
    currentProjectId, workspace, setWorkspace, mobileTab, setMobileTab,
    messages, input, setInput, isGenerating, currentAction, executionQueue, 
    projectFiles, setProjectFiles, 
    projectConfig, setProjectConfig, selectedFile, setSelectedFile,
    openTabs, toasts, addToast, removeToast: (id: string) => setToasts(prev => prev.filter(t => t.id !== id)),
    lastThought, currentPlan, phase, setPhase,
    buildStatus, setBuildStatus, buildSteps, isDownloading, selectedImage,
    setSelectedImage, handleImageSelect, history, isHistoryLoading, showHistory,
    setShowHistory, handleRollback, previewOverride, setPreviewOverride,
    githubConfig, setGithubConfig, handleSend, handleStop, handleBuildAPK,
    handleSecureDownload, loadProject, addFile, deleteFile, renameFile, 
    openFile, closeFile, waitingForApproval,
    refreshHistory, handleDeleteSnapshot,
    runtimeError, isRepairing, repairSuccess, handleAutoFix
  };
};
