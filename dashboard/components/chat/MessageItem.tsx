
import React, { useState } from 'react';
import { Database, Copy, Check, CheckCircle2, XCircle } from 'lucide-react';
import Questionnaire from '../Questionnaire';
import ReasoningBlock from './ReasoningBlock';
import PlanBlock from './PlanBlock';
import CodeChangeBlock from './CodeChangeBlock';
import ErrorSummaryPanel from './ErrorSummaryPanel';
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

const MessageItem: React.FC<MessageItemProps> = ({ message: m, index: idx, handleSend, isLatest, phase }) => {
  const { t } = useLanguage();
  const [copiedSql, setCopiedSql] = useState(false);
  const [selectionMade, setSelectionMade] = useState(false);

  const sqlFile = m.files && m.files['database.sql'];
  
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
            <ReasoningBlock thought={m.thought} />
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
                <PlanBlock plan={m.plan} isLocal={isLocal} />
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
                <CodeChangeBlock files={m.files} originalFiles={m.originalFiles} />
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
