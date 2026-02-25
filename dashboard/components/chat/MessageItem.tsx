
import React, { useState } from 'react';
import { Sparkles, Zap, Database, Copy, Check, ListChecks, ArrowUpRight, CheckCircle2, XCircle, Cpu, Cloud, Brain, Terminal, ChevronDown, ChevronUp, Palette, Plus, Rocket, AlertCircle, FileCode } from 'lucide-react';
import Questionnaire from '../Questionnaire';
import DiffViewer from './DiffViewer';
import { useLanguage } from '../../../i18n/LanguageContext';
import { BuilderPhase } from '../../../types';

interface MessageItemProps {
  message: any;
  index: number;
  handleSend: (extraData?: string) => void;
  isLatest?: boolean;
  waitingForApproval?: boolean;
  phase?: BuilderPhase;
}

const ErrorSummaryPanel: React.FC<{ errors: string[] }> = ({ errors }) => {
  if (!errors || errors.length === 0) return null;

  return (
    <div className="my-4 bg-red-500/5 border border-red-500/20 rounded-2xl p-3 md:p-4 animate-in fade-in slide-in-from-top-2 duration-500">
      <div className="flex items-center gap-2 mb-2 md:mb-3 text-red-400">
        <AlertCircle size={14} />
        <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">AI identified issues</span>
      </div>
      <div className="space-y-1.5 md:space-y-2">
        {errors.map((err, i) => {
          let displayErr = err;
          if (err.includes('TS Syntax Error')) {
            const match = err.match(/TS Syntax Error in ([^:]+): (.*)/);
            if (match) displayErr = `Syntax error in ${match[1]}: ${match[2]}`;
          } else if (err.includes('Missing import target')) {
            const match = err.match(/Missing import target: "([^"]+)" in file "([^"]+)"/);
            if (match) displayErr = `Missing import "${match[1]}" in ${match[2]}`;
          }

          return (
            <div key={i} className="flex items-start gap-2 text-[10px] md:text-[11px] text-red-400/80 font-medium leading-tight">
              <span className="mt-1 w-1 h-1 rounded-full bg-red-500/40 shrink-0" />
              <span>{displayErr}</span>
            </div>
          );
        })}
      </div>
      <div className="mt-2 md:mt-3 pt-2 md:pt-3 border-t border-red-500/10 flex items-center gap-2">
        <div className="w-1 h-1 rounded-full bg-pink-500 animate-pulse" />
        <span className="text-[8px] md:text-[9px] font-bold text-pink-500/80 uppercase tracking-tighter italic">AI is automatically repairing these issues...</span>
      </div>
    </div>
  );
};

const CommandBlock: React.FC<{ files: Record<string, string>, originalFiles?: Record<string, string> }> = ({ files, originalFiles }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const filePaths = Object.keys(files);
  if (filePaths.length === 0) return null;

  return (
    <div className="my-6 bg-[#0d0d0f] rounded-2xl border border-white/10 overflow-hidden shadow-2xl animate-in fade-in slide-in-from-left-4 duration-700">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between px-4 md:px-5 py-3 md:py-4 cursor-pointer hover:bg-white/5 transition-all group"
      >
        <div className="flex items-center gap-3 md:gap-4">
          <div className="p-2 bg-pink-500/20 rounded-xl text-pink-500 group-hover:scale-110 transition-transform">
            <FileCode size={16} />
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-pink-500/80">Code Changes</span>
            <span className="text-[10px] md:text-[11px] font-bold text-white mt-0.5">
              Modified {filePaths.length} file{filePaths.length > 1 ? 's' : ''}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <div className="px-2 py-1 bg-white/5 rounded-md border border-white/10">
            <span className="text-[8px] md:text-[9px] font-black uppercase text-zinc-400">{isOpen ? 'Close' : 'Review'}</span>
          </div>
          {isOpen ? <ChevronUp size={14} className="text-zinc-400" /> : <ChevronDown size={14} className="text-zinc-400" />}
        </div>
      </div>
      
      {isOpen && (
        <div className="border-t border-white/5 flex flex-col md:flex-row h-[500px] md:h-[400px]">
          {/* File List - Horizontal on mobile, Vertical on desktop */}
          <div className="w-full md:w-48 border-b md:border-b-0 md:border-r border-white/5 bg-black/20 flex md:flex-col overflow-x-auto md:overflow-y-auto custom-scrollbar no-scrollbar shrink-0">
            {filePaths.map((path) => (
              <button
                key={path}
                onClick={() => setSelectedFile(path)}
                className={`flex-1 md:flex-none text-left px-4 py-3 text-[10px] md:text-[11px] font-bold transition-all border-r md:border-r-0 md:border-b border-white/5 hover:bg-white/5 whitespace-nowrap md:whitespace-normal shrink-0 ${selectedFile === path ? 'bg-pink-500/10 text-pink-500 md:border-r-2 md:border-r-pink-500' : 'text-zinc-400'}`}
              >
                {path.split('/').pop()}
                <div className="hidden md:block text-[9px] font-medium text-zinc-600 truncate">{path}</div>
              </button>
            ))}
          </div>

          {/* Diff Viewer */}
          <div className="flex-1 p-4 md:p-6 bg-black/40 overflow-y-auto custom-scrollbar">
            {selectedFile ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-zinc-500 truncate max-w-[200px]">{selectedFile}</span>
                  <span className="text-[8px] md:text-[9px] font-bold text-emerald-500/60 uppercase shrink-0">Diff View</span>
                </div>
                <DiffViewer 
                  oldText={originalFiles?.[selectedFile] || ''} 
                  newText={files[selectedFile]} 
                />
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-zinc-600 gap-3 p-8">
                <FileCode size={32} strokeWidth={1} className="opacity-50" />
                <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-center">Select a file to review changes</span>
              </div>
            )}
          </div>
        </div>
      )}
      
      {!isOpen && (
        <div className="px-5 py-3 bg-black/20 border-t border-white/5 flex items-center gap-2 overflow-x-auto custom-scrollbar no-scrollbar">
          {filePaths.map(path => (
            <div key={path} className="px-2 py-1 bg-white/5 rounded-md border border-white/5 flex items-center gap-2 shrink-0">
              <span className="text-[9px] font-bold text-zinc-500">{path.split('/').pop()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const MessageItem: React.FC<MessageItemProps> = ({ message: m, index: idx, handleSend, isLatest, phase }) => {
  const { t } = useLanguage();
  const [copiedSql, setCopiedSql] = useState(false);
  const [selectionMade, setSelectionMade] = useState(false);

  const sqlFile = m.files && m.files['database.sql'];
  
  // Refined check for local models
  const isLocal = m.role === 'assistant' && (
    m.model?.toLowerCase().includes('local') || 
    m.model?.toLowerCase().includes('llama') || 
    m.model?.toLowerCase().includes('qwen') ||
    m.model?.toLowerCase().includes('coder')
  );

  const copySql = () => {
    if (sqlFile) {
      navigator.clipboard.writeText(sqlFile);
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2000);
    }
  };

  const onApprovalClick = (choice: 'Yes' | 'No') => {
    if (selectionMade) return;
    setSelectionMade(true);
    handleSend(choice);
  };
  
  const hasContent = m.content || m.image || (m.plan && m.plan.length > 0) || (m.files && Object.keys(m.files).length > 0) || (m.isApproval && isLatest && !selectionMade) || (m.questions && m.questions.length > 0) || (m.role === 'assistant' && m.thought);

  if (!hasContent && m.role === 'assistant') return null;

  return (
    <div 
      className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} group animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both w-full`}
      style={{ animationDelay: `${idx * 50}ms` }}
    >
      <div className="flex flex-col items-start w-full max-w-full">
        <div className="w-full">
          {m.role === 'assistant' && m.thought && (
            <div className="mb-4 ml-2 animate-in fade-in slide-in-from-top-2 duration-700">
               <div className="flex items-center gap-2 mb-2 text-zinc-600">
                  <Brain size={12}/>
                  <span className="text-[9px] font-black uppercase tracking-widest">Internal Reasoning Phase</span>
               </div>
               <p className="text-[11px] font-medium text-zinc-500 bg-white/5 border border-white/5 rounded-2xl p-4 italic border-l-2 border-l-pink-500/50 max-w-[90%]">
                 {m.thought}
               </p>
            </div>
          )}

          {m.role === 'assistant' && m.validationErrors && m.validationErrors.length > 0 && (
            <ErrorSummaryPanel errors={m.validationErrors} />
          )}

          {(m.content || m.image || (m.plan && m.plan.length > 0) || (m.files && Object.keys(m.files).length > 0) || (m.isApproval && isLatest && !selectionMade) || (m.questions && m.questions.length > 0)) && (
            <div className={`
              max-w-[95%] md:max-w-[92%] p-5 rounded-3xl text-[13px] leading-relaxed transition-all relative break-words overflow-hidden w-full
              ${m.role === 'user' 
                ? 'bg-pink-600 text-white rounded-tr-sm self-end shadow-lg ml-auto' 
                : 'bg-white/5 border border-white/10 rounded-tl-sm self-start text-zinc-300'}
            `}>
              {m.image && (
                <div className="mb-4 rounded-2xl overflow-hidden border border-white/10 shadow-xl">
                  <img src={m.image} className="w-full max-h-[300px] object-cover" alt="Uploaded" />
                </div>
              )}

              {m.plan && m.plan.length > 0 && m.role === 'assistant' && (
                <div className="mb-6 bg-black/40 border border-white/5 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                     <ListChecks size={16} className={isLocal ? 'text-amber-500' : 'text-pink-500'} />
                     <span className="text-[10px] font-black uppercase tracking-widest text-white">Execution Plan</span>
                  </div>
                  <div className="space-y-3">
                    {m.plan.map((step: string, i: number) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 border ${isLocal ? 'bg-amber-500/10 border-amber-500/30' : 'bg-pink-500/10 border-pink-500/30'}`}>
                           <span className={`text-[9px] font-black ${isLocal ? 'text-amber-500' : 'text-pink-500'}`}>{i + 1}</span>
                        </div>
                        <span className="text-[11px] font-bold text-zinc-400 leading-snug">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {m.content && (
                <div className="relative z-10 whitespace-pre-wrap font-medium">
                  {m.content.split(/(\*\*.*?\*\*)/g).map((part: string, i: number) => 
                    part.startsWith('**') && part.endsWith('**') 
                    ? <strong key={i} className={m.role === 'user' ? 'text-white' : (isLocal ? 'text-amber-500' : 'text-pink-400')} style={{fontWeight: 900}}>{part.slice(2, -2)}</strong> 
                    : part
                  )}
                </div>
              )}

              {/* Render file operations as commands */}
              {m.files && Object.keys(m.files).length > 0 && m.role === 'assistant' && (
                <CommandBlock files={m.files} originalFiles={m.originalFiles} />
              )}

              {/* Only show approval if NO questions are present */}
              {m.isApproval && isLatest && !selectionMade && (!m.questions || m.questions.length === 0) && (
                <div className="mt-8 flex flex-col sm:flex-row gap-3 animate-in slide-in-from-top-6 duration-700">
                   <button 
                      onClick={() => onApprovalClick('Yes')}
                      className="flex-1 flex items-center justify-center gap-3 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all active:scale-95 shadow-[0_0_20px_rgba(16,185,129,0.2)] border border-emerald-400/20"
                   >
                      <CheckCircle2 size={16} />
                      Yes, Proceed
                   </button>
                   <button 
                      onClick={() => onApprovalClick('No')}
                      className="flex-1 flex items-center justify-center gap-3 py-4 bg-white/5 border border-white/10 hover:bg-red-600/10 hover:border-red-500/40 text-zinc-400 hover:text-red-500 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all active:scale-95"
                   >
                      <XCircle size={16} />
                      No, Stop
                   </button>
                </div>
              )}

              {sqlFile && m.role === 'assistant' && (
                <div className="mt-5 p-5 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                       <div className="p-2 bg-indigo-500 rounded-xl text-white shadow-lg"><Database size={16}/></div>
                       <div className="text-[10px] font-black uppercase text-white">Database Schema</div>
                    </div>
                    <button onClick={copySql} className={`p-2 rounded-lg transition-all ${copiedSql ? 'bg-green-500 text-white' : 'bg-white/5 text-indigo-400'}`}>
                      {copiedSql ? <Check size={14}/> : <Copy size={14}/>}
                    </button>
                  </div>
                </div>
              )}

              {m.questions && m.questions.length > 0 && !m.answersSummary && (
                <Questionnaire 
                  questions={m.questions} 
                  onComplete={(answers) => handleSend(answers)}
                  onSkip={() => handleSend("Proceed with defaults.")}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageItem;
