
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { Question } from '../../types';

interface QuestionnaireProps { 
  questions: Question[]; 
  onComplete: (answers: string) => void;
  onSkip: () => void;
}

const Questionnaire: React.FC<QuestionnaireProps> = ({ questions, onComplete, onSkip }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [otherText, setOtherText] = useState('');

  // Reset internal state if questions change significantly
  useEffect(() => {
    setCurrentIdx(0);
    setAnswers({});
  }, [questions]);

  if (!questions || questions.length === 0) return null;

  const q = questions[currentIdx];
  // Validation: If question text or options are missing, skip this question or show error
  if (!q || !q.text || !q.options || q.options.length === 0) {
    return (
      <div className="w-full bg-[#121214] border border-white/5 rounded-3xl p-8 text-center my-4">
        <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-4">Invalid Question Data</p>
        <button onClick={onSkip} className="px-6 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase text-white">Skip this step</button>
      </div>
    );
  }
  
  const isLast = currentIdx === questions.length - 1;

  const toggleOption = (optId: string) => {
    setAnswers(prev => {
      if (q.type === 'single') {
        // If it's already selected, don't do anything (standard radio behavior)
        return { ...prev, [q.id]: optId };
      } else {
        const currentArr = Array.isArray(prev[q.id]) ? prev[q.id] : [];
        const next = currentArr.includes(optId) 
          ? currentArr.filter((id: string) => id !== optId) 
          : [...currentArr, optId];
        return { ...prev, [q.id]: next };
      }
    });
  };

  const handleNext = () => {
    // Basic validation: user must have selected something for single-choice questions
    if (q.type === 'single' && !answers[q.id]) {
      alert("Please select an option to proceed.");
      return;
    }

    if (isLast) {
      const formattedAnswers = questions.map(question => {
        const ans = answers[question.id];
        let text = "";
        if (question.type === 'single') {
          const opt = (question.options || []).find(o => o.id === ans);
          text = opt ? opt.label : (ans === 'other' ? `Other: ${otherText}` : 'Not specified');
        } else {
          text = (Array.isArray(ans) ? ans : []).map((id: string) => (question.options || []).find(o => o.id === id)?.label).filter(Boolean).join(', ') || 'None';
        }
        return `• ${question.text.replace('?', '')}: ${text}`;
      }).join('\n');
      onComplete(formattedAnswers);
    } else {
      setCurrentIdx(prev => prev + 1);
      setOtherText('');
    }
  };

  return (
    <div className="w-full bg-[#121214] border border-white/5 rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in duration-300 my-4 max-h-[450px] md:max-h-[600px] flex flex-col">
      <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between shrink-0">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-pink-500">System Clarification</span>
        <span className="text-[9px] font-bold text-zinc-600">Step {currentIdx + 1} of {questions.length}</span>
      </div>
      
      <div className="p-5 space-y-5 overflow-y-auto custom-scrollbar flex-1 min-h-0">
        <div className="flex flex-col gap-2">
          <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
            {q.type === 'single' ? 'Pick one option' : 'Multiple choices allowed'}
          </span>
          <div className="text-sm font-black text-white leading-snug tracking-tight">{q.text}</div>
        </div>

        <div className="space-y-2">
          {(q.options || []).map((opt, i) => {
            const isSelected = q.type === 'single' 
              ? answers[q.id] === opt.id 
              : Array.isArray(answers[q.id]) && answers[q.id].includes(opt.id);

            return (
              <button 
                key={`${opt.id}-${i}`}
                onClick={() => toggleOption(opt.id)}
                className={`w-full text-left p-4 rounded-2xl border transition-all flex items-start gap-4 group ${
                  isSelected 
                  ? 'bg-pink-600/10 border-pink-500/50 ring-1 ring-pink-500/20 shadow-[0_0_15px_rgba(236,72,153,0.05)]' 
                  : 'bg-white/5 border-white/5 hover:border-white/20 hover:bg-white/[0.08]'
                }`}
              >
                <div className={`w-5 h-5 rounded-full border shrink-0 mt-0.5 flex items-center justify-center transition-all ${
                  isSelected ? 'border-pink-500 bg-pink-500 shadow-[0_0_10px_#ec4899]' : 'border-zinc-700 bg-black/40'
                }`}>
                  {isSelected && <Check size={12} className="text-white" />}
                </div>
                <div className="flex-1">
                  <div className={`text-xs font-black uppercase tracking-wide transition-colors ${isSelected ? 'text-pink-500' : 'text-zinc-400'}`}>
                    {opt.label}
                  </div>
                  {opt.subLabel && <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed line-clamp-2">{opt.subLabel}</p>}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-4 bg-black/40 border-t border-white/5 flex items-center justify-between px-6 shrink-0">
        <div className="flex gap-1.5">
          <button 
            disabled={currentIdx === 0}
            onClick={() => setCurrentIdx(prev => prev - 1)}
            className="p-2 text-zinc-600 hover:text-white disabled:opacity-20 transition-colors bg-white/5 rounded-xl border border-white/5"
          >
            <ChevronLeft size={18}/>
          </button>
          <button 
            disabled={isLast || !answers[q.id]}
            onClick={() => setCurrentIdx(prev => prev + 1)}
            className="p-2 text-zinc-600 hover:text-white disabled:opacity-20 transition-colors bg-white/5 rounded-xl border border-white/5"
          >
            <ChevronRight size={18}/>
          </button>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={onSkip} className="text-[9px] font-black uppercase text-zinc-600 hover:text-white tracking-[0.2em]">Skip</button>
          <button 
            onClick={handleNext}
            className="px-8 py-3 bg-pink-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-pink-500 transition-all active:scale-95 shadow-lg shadow-pink-600/20"
          >
            {isLast ? 'Complete' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Questionnaire;
