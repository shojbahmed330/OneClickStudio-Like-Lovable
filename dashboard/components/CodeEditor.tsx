
import React, { useState, useEffect, useRef } from 'react';
import { Rocket, Settings, History, Code2, Terminal, PlusCircle, Search as SearchIcon, Brain, Files, X } from 'lucide-react';
import FileTree from './FileTree';
import EditorTabs from './EditorTabs';
import ActivityBar, { SidebarView } from './ActivityBar';
import SearchPanel from './SearchPanel';
import ThinkingPanel from './ThinkingPanel';

interface CodeEditorProps {
  projectFiles: Record<string, string>;
  setProjectFiles: (files: any) => void;
  selectedFile: string;
  setSelectedFile: (file: string) => void;
  handleBuildAPK: () => void;
  onOpenConfig?: () => void;
  onOpenHistory?: () => void;
  openTabs: string[];
  openFile: (path: string) => void;
  closeFile: (path: string, e?: React.MouseEvent) => void;
  addFile?: (path: string) => void;
  deleteFile?: (path: string) => void;
  renameFile?: (old: string, next: string) => void;
  lastThought?: string;
  isGenerating?: boolean;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ 
  projectFiles, setProjectFiles, selectedFile, setSelectedFile, 
  handleBuildAPK, onOpenConfig, onOpenHistory,
  openTabs, openFile, closeFile, addFile, deleteFile, renameFile,
  lastThought, isGenerating
}) => {
  const [activeView, setActiveView] = useState<SidebarView>('explorer');
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [logs, setLogs] = useState<{msg: string, type: 'info' | 'success' | 'warn'}[]>([]);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  const addLog = (msg: string, type: 'info' | 'success' | 'warn' = 'info') => {
    setLogs(prev => [...prev.slice(-49), { msg: `[${new Date().toLocaleTimeString()}] ${msg}`, type }]);
  };

  useEffect(() => {
    addLog(`Workspace Ready. ${Object.keys(projectFiles).length} files loaded.`, 'success');
  }, []);

  useEffect(() => {
    if (selectedFile) addLog(`Opened ${selectedFile}`);
  }, [selectedFile]);

  useEffect(() => {
    if (isGenerating) addLog(`Neural Engine: Processing Request...`, 'info');
    else if (lastThought) addLog(`Code Refactored Successfully.`, 'success');
  }, [isGenerating, lastThought]);

  // ENHANCED SYNC SCROLL: Ensures line numbers match code line height exactly
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  const handleViewChange = (view: SidebarView) => {
    if (view === 'history' && onOpenHistory) onOpenHistory();
    else if (view === 'config' && onOpenConfig) onOpenConfig();
    else {
      setActiveView(view);
      if (window.innerWidth < 1024) setShowMobileSidebar(true);
    }
  };

  const code = projectFiles[selectedFile] || '';
  const lines = code.split('\n');
  const lineCount = Math.max(lines.length, 100);

  return (
    <div className="flex-1 flex overflow-hidden w-full max-w-full relative bg-[#09090b]">
      <div className="hidden lg:flex">
        <ActivityBar activeView={activeView} onViewChange={handleViewChange} />
      </div>

      {showMobileSidebar && (
        <div className="lg:hidden fixed inset-0 z-[600] flex">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowMobileSidebar(false)}></div>
          <aside className="w-[300px] h-full bg-[#09090b] border-r border-white/10 relative z-10 flex flex-col animate-in slide-in-from-left duration-300">
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/40">
               <h3 className="text-[10px] font-black uppercase tracking-widest text-pink-500">{activeView}</h3>
               <button onClick={() => setShowMobileSidebar(false)} className="p-2 bg-white/5 rounded-xl text-zinc-500"><X size={16}/></button>
            </div>
            <div className="flex-1 overflow-hidden flex flex-col">
              {activeView === 'explorer' && (
                <FileTree 
                  files={projectFiles} 
                  selectedFile={selectedFile} 
                  onSelectFile={(path) => { openFile(path); setShowMobileSidebar(false); }}
                  onAddFile={addFile || (() => {})}
                  onDeleteFile={deleteFile || (() => {})}
                  onRenameFile={renameFile || (() => {})}
                />
              )}
              {activeView === 'search' && <SearchPanel files={projectFiles} onSelectFile={(p) => { openFile(p); setShowMobileSidebar(false); }} />}
              {activeView === 'thinking' && <ThinkingPanel thought={lastThought} isGenerating={isGenerating || false} />}
            </div>
          </aside>
        </div>
      )}

      <aside className={`w-72 border-r border-white/5 bg-[#09090b] hidden lg:flex flex-col shrink-0 overflow-hidden`}>
         {activeView === 'explorer' && (
           <FileTree 
             files={projectFiles} 
             selectedFile={selectedFile} 
             onSelectFile={openFile}
             onAddFile={addFile || (() => {})}
             onDeleteFile={deleteFile || (() => {})}
             onRenameFile={renameFile || (() => {})}
           />
         )}
         {activeView === 'search' && <SearchPanel files={projectFiles} onSelectFile={openFile} />}
         {activeView === 'thinking' && <ThinkingPanel thought={lastThought} isGenerating={isGenerating || false} />}
         
         <div className="mt-auto p-4 border-t border-white/5 bg-black/20 max-h-40 overflow-y-auto custom-scrollbar">
            <div className="flex items-center gap-2 mb-2">
               <Terminal size={12} className="text-pink-500"/>
               <span className="text-[9px] font-black uppercase text-zinc-500 tracking-widest">Console Output</span>
            </div>
            <div className="space-y-1">
               {logs.map((log, i) => (
                  <div key={i} className={`text-[9px] font-mono leading-tight break-words ${log.type === 'success' ? 'text-green-500/60' : log.type === 'warn' ? 'text-yellow-500/60' : 'text-zinc-600'}`}>
                     {log.msg}
                  </div>
               ))}
            </div>
         </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 bg-[#0c0c0e] overflow-hidden w-full relative pb-20 lg:pb-0">
         <div className="w-full overflow-hidden flex items-center bg-[#09090b]">
            <button 
              onClick={() => { setActiveView('explorer'); setShowMobileSidebar(true); }}
              className="lg:hidden p-4 border-r border-white/5 text-zinc-500 hover:text-white transition-colors"
            >
              <Files size={20}/>
            </button>
            <div className="flex-1 overflow-hidden">
               <EditorTabs 
                   tabs={openTabs} 
                   activeTab={selectedFile} 
                   onSelect={setSelectedFile} 
                   onClose={closeFile} 
               />
            </div>
         </div>
         
         <div className="flex-1 flex flex-col p-2 md:p-4 overflow-hidden w-full">
            <div className="flex-1 w-full bg-black/60 border border-white/5 rounded-[1.5rem] md:rounded-[2rem] overflow-hidden shadow-2xl relative flex group">
               {selectedFile ? (
                 <div className="flex-1 flex w-full h-full relative overflow-hidden">
                    {/* FIXED LINE NUMBERS: Match font-size and line-height of textarea */}
                    <div ref={lineNumbersRef} className="w-10 md:w-12 bg-black/40 border-r border-white/5 py-4 md:py-8 text-right pr-3 font-mono text-[11px] md:text-[13px] text-zinc-700 select-none shrink-0 overflow-hidden">
                       {Array.from({ length: lineCount }).map((_, i) => (
                         <div key={i} className="h-[20px] leading-[20px]">{i + 1}</div>
                       ))}
                    </div>
                    {/* Textarea with handleScroll */}
                    <textarea 
                       ref={editorRef}
                       value={code} 
                       onChange={e => setProjectFiles(prev => ({...prev, [selectedFile]: e.target.value}))} 
                       onScroll={handleScroll}
                       className="flex-1 w-full bg-transparent py-4 md:py-8 px-4 font-mono text-[11px] md:text-[13px] text-zinc-300 outline-none resize-none custom-scrollbar leading-[20px] whitespace-pre tab-size-2 overflow-x-auto overflow-y-auto" 
                       spellCheck={false}
                       autoCapitalize="none"
                       autoComplete="off"
                       wrap="off"
                    />
                 </div>
               ) : (
                 <div className="flex-1 flex flex-col items-center justify-center text-zinc-700 space-y-4">
                    <Code2 size={24} />
                    <p className="text-[9px] font-black uppercase tracking-widest">Select file to edit</p>
                 </div>
               )}
            </div>
         </div>
      </main>
    </div>
  );
};

export default CodeEditor;
