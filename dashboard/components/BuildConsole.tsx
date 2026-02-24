
import React from 'react';
import { CheckCircle2, Circle, Clock, XCircle, Loader2 } from 'lucide-react';
import { BuildStep } from '../../types';

interface BuildConsoleProps {
  buildSteps: BuildStep[];
}

const BuildConsole: React.FC<BuildConsoleProps> = ({ buildSteps = [] }) => {
  return (
    <div className="w-full max-w-xl mx-auto bg-black/40 border border-white/5 rounded-2xl overflow-hidden mt-4 animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col h-full max-h-[250px] md:max-h-[300px]">
      <div className="bg-white/5 px-4 py-2 border-b border-white/5 flex items-center justify-between shrink-0">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/50"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/50"></div>
        </div>
        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Live Build Console</span>
      </div>
      
      <div className="flex-1 p-4 space-y-3 overflow-y-auto custom-scrollbar bg-black/20">
        {buildSteps && buildSteps.length > 0 ? (
          buildSteps.map((step, idx) => (
            <div key={idx} className="flex items-center justify-between group">
              <div className="flex items-center gap-3">
                {step.status === 'completed' ? (
                  step.conclusion === 'success' ? (
                    <CheckCircle2 size={14} className="text-green-500" />
                  ) : (
                    <XCircle size={14} className="text-red-500" />
                  )
                ) : step.status === 'in_progress' ? (
                  <Loader2 size={14} className="text-pink-500 animate-spin" />
                ) : (
                  <Circle size={14} className="text-slate-700" />
                )}
                
                <span className={`text-[11px] font-medium transition-colors ${
                  step.status === 'in_progress' ? 'text-pink-400' : 
                  step.status === 'completed' ? 'text-slate-300' : 'text-slate-600'
                }`}>
                  {step.name}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                {step.status === 'completed' && step.conclusion === 'success' && (
                  <span className="text-[8px] font-black uppercase text-green-500/40 tracking-tighter">Verified</span>
                )}
                {step.status === 'in_progress' && (
                  <span className="flex h-1 w-1 rounded-full bg-pink-500 animate-ping"></span>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="py-10 text-center">
            <Loader2 className="animate-spin text-pink-500/20 mx-auto mb-2" size={20} />
            <p className="text-[10px] font-black uppercase text-slate-700 tracking-[0.2em]">Waiting for terminal output...</p>
          </div>
        )}
      </div>
      
      <div className="bg-black/40 p-3 flex items-center gap-2 border-t border-white/5 shrink-0">
        <span className="text-green-500 font-mono text-[10px]">$</span>
        <div className="h-3 w-1.5 bg-green-500/50 animate-pulse"></div>
        <span className="text-[9px] font-mono text-slate-600">listening_to_server_port_8080...</span>
      </div>
    </div>
  );
};

export default BuildConsole;
