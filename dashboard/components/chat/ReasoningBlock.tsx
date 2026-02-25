
import React from 'react';
import { Brain } from 'lucide-react';

interface ReasoningBlockProps {
  thought: string;
}

const ReasoningBlock: React.FC<ReasoningBlockProps> = ({ thought }) => {
  return (
    <div className="mb-4 ml-2 animate-in fade-in slide-in-from-top-2 duration-700">
      <div className="flex items-center gap-2 mb-2 text-zinc-600">
        <Brain size={12}/>
        <span className="text-[9px] font-black uppercase tracking-widest">Internal Reasoning Phase</span>
      </div>
      <p className="text-[11px] font-medium text-zinc-500 bg-white/5 border border-white/5 rounded-2xl p-4 italic border-l-2 border-l-pink-500/50 max-w-[90%]">
        {thought}
      </p>
    </div>
  );
};

export default ReasoningBlock;
