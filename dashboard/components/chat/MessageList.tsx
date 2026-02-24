
import React, { useEffect, useRef } from 'react';
import { Loader2, RefreshCw, Cpu, Brain, Code, FileText, Save, Terminal, Zap, Clock, Layout, Palette, Type, Layers } from 'lucide-react';
import MessageItem from './MessageItem';
import { useLanguage } from '../../../i18n/LanguageContext';
import { BuilderPhase } from '../../../types';

interface MessageListProps {
  messages: any[];
  isGenerating: boolean;
  currentAction?: string | null;
  handleSend: (extraData?: string) => void;
  waitingForApproval?: boolean;
  phase: BuilderPhase;
}

const MessageList: React.FC<MessageListProps> = ({ messages, isGenerating, currentAction, handleSend, waitingForApproval, phase }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isGenerating, currentAction]);

  const getActionIcon = () => {
    if (!currentAction) return <RefreshCw className="animate-spin" size={16}/>;
    const action = currentAction.toLowerCase();
    if (action.includes('analyz') || action.includes('requir') || action.includes('thought')) return <Brain size={16} className="animate-pulse text-pink-400" />;
    if (action.includes('read') || action.includes('fetch')) return <FileText size={16} className="animate-bounce text-blue-400" />;
    if (action.includes('edit') || action.includes('patch') || action.includes('writ') || action.includes('generat')) return <Code size={16} className="animate-pulse text-emerald-400" />;
    if (action.includes('save') || action.includes('synthes') || action.includes('finaliz')) return <Save size={16} className="animate-bounce text-amber-400" />;
    if (action.includes('draft') || action.includes('answer')) return <Terminal size={16} className="animate-pulse text-indigo-400" />;
    return <Cpu size={16} className="animate-spin text-pink-500" />;
  };

  return (
    <div 
      ref={scrollRef}
      className="flex-1 p-4 md:p-6 overflow-y-auto space-y-10 pt-24 lg:pt-6 pb-20 md:pb-48 scroll-smooth custom-scrollbar relative"
    >
      {messages.map((m, idx) => (
        <MessageItem 
          key={m.id || idx} 
          message={m} 
          index={idx} 
          handleSend={handleSend} 
          isLatest={idx === messages.length - 1}
          waitingForApproval={waitingForApproval}
          phase={phase}
        />
      ))}
      
      {isGenerating && (
        <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-[380px]">
           <div className="p-5 bg-[#121214] border border-white/5 rounded-3xl shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 h-1 bg-pink-500/20 w-full overflow-hidden">
                 <div className="h-full bg-pink-500 w-[40%] animate-[loading-bar_2s_infinite]"></div>
              </div>
              
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-500">
                    {getActionIcon()}
                 </div>
                 <div className="flex flex-col flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-pink-500/80">
                        {phase === BuilderPhase.BUILDING ? 'Building Site' : 'Neural Core'}
                      </span>
                      <span className="text-[7px] font-black uppercase text-zinc-600 tracking-[0.1em]">
                        Google Cloud (Gemini)
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-white mt-0.5 animate-pulse">
                       {currentAction || 'Processing...'}
                    </span>
                 </div>
              </div>
           </div>
        </div>
      )}

      <style>{`
        @keyframes loading-bar { 0% { transform: translateX(-100%); } 100% { transform: translateX(250%); } }
      `}</style>
    </div>
  );
};

export default MessageList;
