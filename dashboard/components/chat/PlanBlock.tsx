
import React from 'react';
import { ListChecks } from 'lucide-react';

interface PlanBlockProps {
  plan: string[];
  isLocal?: boolean;
}

const PlanBlock: React.FC<PlanBlockProps> = ({ plan, isLocal }) => {
  if (!plan || plan.length === 0) return null;

  return (
    <div className="mb-6 bg-black/40 border border-white/5 rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-3 border-b border-white/5 pb-3">
        <ListChecks size={16} className={isLocal ? 'text-amber-500' : 'text-pink-500'} />
        <span className="text-[10px] font-black uppercase tracking-widest text-white">Execution Plan</span>
      </div>
      <div className="space-y-3">
        {plan.map((step, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 border ${isLocal ? 'bg-amber-500/10 border-amber-500/30' : 'bg-pink-500/10 border-pink-500/30'}`}>
              <span className={`text-[9px] font-black ${isLocal ? 'text-amber-500' : 'text-pink-500'}`}>{i + 1}</span>
            </div>
            <span className="text-[11px] font-bold text-zinc-400 leading-snug">{step}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlanBlock;
