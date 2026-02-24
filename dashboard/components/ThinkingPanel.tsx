
import React from 'react';
import { Brain, Sparkles, Zap, ShieldCheck, PenTool, Code2, Layers, Briefcase } from 'lucide-react';

interface ThinkingPanelProps {
  thought?: string;
  isGenerating: boolean;
}

const ThinkingPanel: React.FC<ThinkingPanelProps> = ({ thought, isGenerating }) => {
  // Parse the thought string to highlight active agents
  const activeAgent = isGenerating ? (
    !thought ? 'Planner' :
    thought.includes('[DEV]') ? 'Developer' :
    thought.includes('[DESIGNER]') ? 'Designer' :
    thought.includes('[PM]') ? 'Planner' : 'Orchestrator'
  ) : 'Idle';

  return (
    <div className="flex-1 flex flex-col p-4 space-y-6 overflow-hidden">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Agent Swarm</h3>
        {isGenerating && (
           <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-ping"></span>
              <span className="text-[8px] font-black text-pink-500 uppercase tracking-widest">{activeAgent} Active</span>
           </div>
        )}
      </div>

      {/* Agents Status Grid */}
      <div className="grid grid-cols-3 gap-2">
        <div className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${activeAgent === 'Planner' ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' : 'bg-white/5 border-white/5 text-zinc-600'}`}>
           <Briefcase size={16} className={activeAgent === 'Planner' ? 'animate-bounce' : ''}/>
           <span className="text-[8px] font-black uppercase">Planner</span>
        </div>
        <div className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${activeAgent === 'Designer' ? 'bg-purple-500/20 border-purple-500/50 text-purple-400' : 'bg-white/5 border-white/5 text-zinc-600'}`}>
           <PenTool size={16} className={activeAgent === 'Designer' ? 'animate-pulse' : ''}/>
           <span className="text-[8px] font-black uppercase">Designer</span>
        </div>
        <div className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${activeAgent === 'Developer' ? 'bg-green-500/20 border-green-500/50 text-green-400' : 'bg-white/5 border-white/5 text-zinc-600'}`}>
           <Code2 size={16} className={activeAgent === 'Developer' ? 'animate-pulse' : ''}/>
           <span className="text-[8px] font-black uppercase">Developer</span>
        </div>
      </div>

      <div className="flex-1 bg-black/40 border border-white/5 rounded-2xl p-5 overflow-y-auto custom-scrollbar relative group">
        {!thought && !isGenerating ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-20 gap-4">
             <Layers size={40}/>
             <p className="text-[10px] font-black uppercase tracking-[0.3em] max-w-[140px]">Swarm Idle. Awaiting Directive.</p>
          </div>
        ) : (
          <div className="space-y-6">
             <div className="flex items-start gap-4">
                <div className="p-2 bg-pink-500/10 rounded-lg text-pink-500 mt-1"><Sparkles size={14}/></div>
                <div className="space-y-3">
                   <h4 className="text-[11px] font-black text-white uppercase tracking-widest underline decoration-pink-500/40 underline-offset-4">Internal Dialogue</h4>
                   <p className="text-[11px] text-zinc-400 font-medium leading-relaxed font-mono">
                      {thought || "Initializing Multi-Agent Protocol..."}
                   </p>
                </div>
             </div>

             <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-3">
                <div className="flex items-center gap-2">
                   <Zap size={10} className="text-pink-500"/>
                   <span className="text-[9px] font-black text-pink-500 uppercase tracking-widest">Protocol Check</span>
                </div>
                <div className="space-y-2">
                   <div className={`flex items-center gap-2 text-[10px] font-bold uppercase ${isGenerating ? 'text-zinc-500' : 'text-green-500'}`}>
                      <ShieldCheck size={10}/> 1. Requirement Analysis
                   </div>
                   <div className={`flex items-center gap-2 text-[10px] font-bold uppercase ${isGenerating ? 'text-zinc-500' : 'text-green-500'}`}>
                      <ShieldCheck size={10}/> 2. UI/UX System Design
                   </div>
                   <div className={`flex items-center gap-2 text-[10px] font-bold uppercase ${isGenerating ? 'text-zinc-500' : 'text-green-500'}`}>
                      <ShieldCheck size={10}/> 3. Implementation
                   </div>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ThinkingPanel;
