
import React from 'react';
import { CheckCircle2, Circle, Loader2, Brain, Code, FileText, Zap, Layout, ShieldCheck } from 'lucide-react';
import { BuilderPhase, BuilderStatus } from '../../../types';

interface PhaseTimelineProps {
  statuses: BuilderStatus[];
  currentPhase: BuilderPhase;
}

const PhaseTimeline: React.FC<PhaseTimelineProps> = ({ statuses, currentPhase }) => {
  const phases = [
    { id: BuilderPhase.PLANNING, label: 'Planning', icon: Brain },
    { id: BuilderPhase.CODING, label: 'Coding', icon: Code },
    { id: BuilderPhase.REVIEW, label: 'Review & Validation', icon: FileText },
    { id: BuilderPhase.SECURITY, label: 'Security Audit', icon: ShieldCheck },
    { id: BuilderPhase.PERFORMANCE, label: 'Performance Audit', icon: Zap },
    { id: BuilderPhase.UIUX, label: 'UI/UX Polish', icon: Layout },
    { id: BuilderPhase.FIXING, label: 'Fixing Errors', icon: Zap },
    { id: BuilderPhase.BUILDING, label: 'Building Application', icon: Loader2 }
  ];

  const phaseOrder = [
    BuilderPhase.PLANNING,
    BuilderPhase.CODING,
    BuilderPhase.REVIEW,
    BuilderPhase.SECURITY,
    BuilderPhase.PERFORMANCE,
    BuilderPhase.UIUX,
    BuilderPhase.FIXING,
    BuilderPhase.BUILDING,
    BuilderPhase.PREVIEW_READY
  ];

  return (
    <div className="flex flex-col gap-2 p-4 md:p-5 bg-[#121214] border border-white/5 rounded-2xl md:rounded-3xl mb-6 md:mb-8 shadow-2xl relative overflow-hidden group">
      <div className="absolute top-0 left-0 h-[2px] bg-gradient-to-r from-pink-500 to-violet-500 w-full opacity-50"></div>
      
      <div className="flex items-center justify-between mb-3 md:mb-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 md:w-5 md:h-5 rounded-lg bg-pink-500/10 flex items-center justify-center">
            <Loader2 size={10} className="text-pink-500 animate-spin" />
          </div>
          <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Build Progress</span>
        </div>
        <div className="px-1.5 md:px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1 md:gap-1.5">
          <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-[7px] md:text-[8px] font-black text-emerald-500 uppercase tracking-wider">Live Engine</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-3 md:gap-4">
        {phases.map((p, idx) => {
          const status = statuses.find(s => s.phase === p.id);
          const isActive = currentPhase === p.id;
          
          // A phase is completed if we have a status marked as completed, 
          // or if the current phase is further down the order.
          const isCompleted = status?.isCompleted || (phaseOrder.indexOf(currentPhase) > phaseOrder.indexOf(p.id));

          return (
            <div key={p.id} className={`flex items-center gap-4 transition-all duration-500 ${isActive ? 'translate-x-1' : ''}`}>
              <div className="relative flex flex-col items-center">
                <div className={`w-6 h-6 rounded-xl flex items-center justify-center border transition-all duration-500 ${
                  isCompleted ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                  isActive ? 'bg-pink-500/10 border-pink-500/20 text-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.2)]' :
                  'bg-zinc-900 border-white/5 text-zinc-600'
                }`}>
                  {isCompleted ? (
                    <CheckCircle2 size={12} />
                  ) : isActive ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <p.icon size={12} />
                  )}
                </div>
                {idx < phases.length - 1 && (
                  <div className={`w-[1px] h-4 mt-1 transition-colors duration-500 ${isCompleted ? 'bg-emerald-500/30' : 'bg-white/5'}`}></div>
                )}
              </div>
              
              <div className="flex flex-col">
                <span className={`text-[11px] font-bold tracking-tight transition-colors duration-500 ${
                  isActive ? 'text-white' : isCompleted ? 'text-zinc-400' : 'text-zinc-600'
                }`}>
                  {p.label}
                </span>
                {isActive && (
                  <span className="text-[9px] text-pink-500/70 font-medium animate-pulse">
                    Processing...
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PhaseTimeline;
