
import { useState, useRef, useEffect, useCallback } from 'react';
import { ChatMessage, BuilderPhase, BuilderStatus, WorkspaceType, ProjectConfig, User as UserType } from '../types';
import { AIController } from '../services/controller';
import { DatabaseService } from '../services/dbService';

export interface ChatLogic {
  messages: ChatMessage[];
  setMessages: (msgs: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => void;
  input: string;
  setInput: (s: string) => void;
  phase: BuilderPhase;
  setPhase: (p: BuilderPhase) => void;
  builderStatuses: BuilderStatus[];
  setBuilderStatuses: (s: BuilderStatus[] | ((prev: BuilderStatus[]) => BuilderStatus[])) => void;
  isGenerating: boolean;
  setIsGenerating: (b: boolean) => void;
  currentAction: string | null;
  setCurrentAction: (s: string | null) => void;
  executionQueue: string[];
  setExecutionQueue: (q: string[] | ((prev: string[]) => string[])) => void;
  lastThought: string;
  setLastThought: (s: string) => void;
  currentPlan: string[];
  setCurrentPlan: (p: string[] | ((prev: string[]) => string[])) => void;
  waitingForApproval: boolean;
  setWaitingForApproval: (b: boolean) => void;
  selectedImage: { data: string; mimeType: string; preview: string } | null;
  setSelectedImage: (img: { data: string; mimeType: string; preview: string } | null) => void;
  runtimeError: { message: string; line: number; source: string } | null;
  setRuntimeError: (err: { message: string; line: number; source: string } | null) => void;
  isRepairing: boolean;
  setIsRepairing: (b: boolean) => void;
  repairSuccess: boolean;
  setRepairSuccess: (b: boolean) => void;
  handleSend: (customPrompt?: string, isAuto?: boolean, overrideQueue?: string[]) => Promise<void>;
  handleStop: () => void;
  handleImageSelect: (file: File) => void;
  handleAutoFix: () => Promise<void>;
  runUnitTests: () => Promise<void>;
}

export const useChatLogic = (
  user: UserType | null,
  currentProjectId: string | null,
  projectFilesRef: React.MutableRefObject<Record<string, string>>,
  setProjectFiles: (files: Record<string, string>) => void,
  projectConfig: ProjectConfig,
  workspace: WorkspaceType,
  addToast: (msg: string, type?: any) => void,
  openFile: (path: string) => void,
  refreshHistory: () => void
): ChatLogic => {
  const [messages, setMessagesState] = useState<ChatMessage[]>([]);
  const messagesRef = useRef<ChatMessage[]>([]);
  const setMessages = useCallback((msgs: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => {
    if (typeof msgs === 'function') {
      setMessagesState(prev => {
        const next = msgs(prev);
        messagesRef.current = next;
        return next;
      });
    } else {
      setMessagesState(msgs);
      messagesRef.current = msgs;
    }
  }, []);
  const [input, setInput] = useState('');
  const [phase, setPhase] = useState<BuilderPhase>(BuilderPhase.EMPTY);
  const [builderStatuses, setBuilderStatuses] = useState<BuilderStatus[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentAction, setCurrentAction] = useState<string | null>(null);
  const [executionQueue, setExecutionQueue] = useState<string[]>([]);
  const [lastThought, setLastThought] = useState<string>('');
  const [currentPlan, setCurrentPlan] = useState<string[]>([]);
  const [waitingForApproval, setWaitingForApproval] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ data: string; mimeType: string; preview: string } | null>(null);
  
  const [runtimeError, setRuntimeError] = useState<{ message: string; line: number; source: string } | null>(null);
  const [isRepairing, setIsRepairing] = useState(false);
  const [repairSuccess, setRepairSuccess] = useState(false);
  
  const autoStepCountRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const controller = useRef(new AIController());
  const db = DatabaseService.getInstance();

  const handleStop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsGenerating(false);
      setCurrentAction(null);
      addToast("AI Output Terminated.", "info");
    }
  }, [addToast]);

  const handleImageSelect = useCallback((file: File) => {
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
  }, []);

  const handleSendRef = useRef<any>(null);

  const runUnitTests = useCallback(async () => {
    const testFiles = Object.keys(projectFilesRef.current).filter(path => path.startsWith('tests/'));
    if (testFiles.length === 0) return;

    addToast(`Running ${testFiles.length} unit tests...`, "info");
    const failures: string[] = [];

    for (const path of testFiles) {
      try {
        const content = projectFilesRef.current[path];
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
        if (handleSendRef.current) {
          handleSendRef.current(testFailureContext, true);
        }
      }, 1500);
    } else {
      addToast("All unit tests passed!", "success");
    }
  }, [addToast, projectFilesRef]);

  const handleSend: (customPrompt?: string, isAuto?: boolean, overrideQueue?: string[]) => Promise<void> = useCallback(async (customPrompt?: string, isAuto: boolean = false, overrideQueue?: string[]) => {
    if (isGenerating && !isAuto) return;
    const promptText = (customPrompt || input).trim();
    if (!promptText && !selectedImage) return;

    if (phase === BuilderPhase.EMPTY && !isAuto) {
      setPhase(BuilderPhase.PROMPT_SENT);
    }

    const activeQueue = overrideQueue !== undefined ? overrideQueue : executionQueue;
    const currentModel = projectConfig.selected_model || 'gemini-3-flash-preview';

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
    setBuilderStatuses([]);
    abortControllerRef.current = new AbortController();
    
    try {
      if (!isAuto) {
        autoStepCountRef.current = 0;
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
      const originalFiles = { ...projectFilesRef.current };
      
      setMessages(prev => [...prev, { 
        id: assistantId, 
        role: 'assistant', 
        content: '', 
        timestamp: Date.now(), 
        model: currentModel,
        validationErrors: [],
        originalFiles: originalFiles
      }]);

      const currentFiles = { ...projectFilesRef.current };
      
      // We need the messages for the stream. Since we are in a callback, we should use the latest state.
      // However, to avoid dependency on 'messages', we can't easily get it here without putting it in deps.
      // But we can use a ref or just accept the dependency.
      // Let's use a ref for messages to keep handleSend stable.
      const messagesSnapshot = [...messagesRef.current];
      if (!isAuto) {
        messagesSnapshot.push({ 
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
        messagesSnapshot, 
        workspace,
        currentModel
      );

      let finalRes: any = null;

      for await (const chunk of stream) {
        const lines = chunk.split('\n').filter(l => l.trim());
        for (const line of lines) {
          try {
            const update = JSON.parse(line);
            if (update.type === 'status') {
              setPhase(update.phase);
              setCurrentAction(update.message);
              setBuilderStatuses(prev => {
                const updated = prev.map(s => ({ ...s, isCompleted: true }));
                if (!updated.find(s => s.phase === update.phase && s.message === update.message)) {
                  return [...updated, { phase: update.phase, message: update.message, timestamp: Date.now(), isCompleted: false }];
                }
                return updated;
              });
            } else if (update.type === 'validation_errors') {
              setMessages(prev => prev.map(m => m.id === assistantId ? { 
                ...m, 
                validationErrors: [...(m.validationErrors || []), ...update.errors] 
              } : m));
            } else if (update.type === 'result') {
              finalRes = update;
            }
          } catch (e) {
            console.warn("Failed to parse stream chunk:", line);
          }
        }
      }

      if (!finalRes) throw new Error("No result received from AI.");
      const res = finalRes;
      if (res.thought) setLastThought(res.thought);

      if (!isAuto) {
        if (res.questions && res.questions.length > 0) {
          setPhase(BuilderPhase.QUESTIONING);
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

        if (currentProjectId) {
          db.createProjectSnapshot(currentProjectId, updatedFiles, res.answer.slice(0, 100))
            .then(() => refreshHistory())
            .catch(e => console.error("Snapshot failed:", e));
        }

        if (phase === BuilderPhase.BUILDING || phase === BuilderPhase.PROMPT_SENT) {
           setPhase(BuilderPhase.PREVIEW_READY);
        }
      }

      let nextPlan = res.plan || [];
      if (nextPlan.length > 0 && !isAuto) {
        setCurrentPlan(nextPlan);
        setExecutionQueue(nextPlan.slice(1));
      }

      const validQuestions = (res.questions || []).filter((q: any) => q && q.text && q.options && q.options.length > 0);

      const finalAssistantMsg: ChatMessage = { 
        id: assistantId, role: 'assistant', content: res.answer, 
        plan: isAuto ? currentPlan : (res.plan || []), questions: validQuestions,
        isApproval: false, model: currentModel, files: res.files, thought: res.thought, timestamp: Date.now()
      };

      setMessages(prev => {
        const updated = prev.map(m => m.id === assistantId ? finalAssistantMsg : m);
        if (!updated.find(m => m.id === assistantId)) {
          return [...updated, finalAssistantMsg];
        }
        return updated;
      });

      if (currentProjectId && user) {
        await db.updateProject(user.id, currentProjectId, updatedFiles, projectConfig);
        setMessages(current => {
          db.supabase.from('projects').update({ messages: current }).eq('id', currentProjectId);
          return current;
        });
      }

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
        
        setTimeout(() => {
          handleSend(`AUTONOMOUS EXECUTION: Proceeding with next step: ${nextStepName}`, true, newQueue);
        }, 1500);
      } else {
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
  }, [isGenerating, input, selectedImage, phase, executionQueue, projectConfig, waitingForApproval, projectFilesRef, workspace, currentProjectId, user, db, addToast, openFile, refreshHistory, currentPlan, runUnitTests, setProjectFiles]);

  useEffect(() => {
    handleSendRef.current = handleSend;
  }, [handleSend]);

  const handleAutoFix = useCallback(async () => {
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
      
      setTimeout(() => setRepairSuccess(false), 3000);
    } catch (e: any) {
      addToast("Self-Healing Failed: " + e.message, "error");
    } finally {
      setIsRepairing(false);
    }
  }, [runtimeError, addToast, handleSend]);

  return {
    messages, setMessages,
    input, setInput,
    phase, setPhase,
    builderStatuses, setBuilderStatuses,
    isGenerating, setIsGenerating,
    currentAction, setCurrentAction,
    executionQueue, setExecutionQueue,
    lastThought, setLastThought,
    currentPlan, setCurrentPlan,
    waitingForApproval, setWaitingForApproval,
    selectedImage, setSelectedImage,
    runtimeError, setRuntimeError,
    isRepairing, setIsRepairing,
    repairSuccess, setRepairSuccess,
    handleSend, handleStop, handleImageSelect, handleAutoFix, runUnitTests
  };
};
