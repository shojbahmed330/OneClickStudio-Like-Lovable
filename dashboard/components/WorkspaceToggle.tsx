
import React from 'react';
import { Smartphone, Layout, ShieldCheck, Zap, Monitor } from 'lucide-react';
import { WorkspaceType } from '../../types';

interface WorkspaceToggleProps {
  active: WorkspaceType;
  onChange: (type: WorkspaceType) => void;
}

const WorkspaceToggle: React.FC<WorkspaceToggleProps> = ({ active, onChange }) => {
  return (
    <div className="bg-black/80 backdrop-blur-3xl border border-white/10 p-1.5 rounded-[1.5rem] flex items-center gap-1.5 shadow-2xl group ring-1 ring-white/5 animate-in slide-in-from-top-4 duration-1000">
      <button 
        onClick={() => onChange('app')}
        className={`flex-1 flex items-center justify-center gap-3 px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-700 relative overflow-hidden ${
          active === 'app' 
            ? 'bg-pink-600 text-white shadow-[0_10px_20px_rgba(236,72,153,0.3)] scale-100' 
            : 'text-zinc-600 hover:text-zinc-300 hover:bg-white/5'
        }`}
      >
        <Smartphone size={14} className={active === 'app' ? 'animate-pulse' : ''} />
        <span>Mobile App</span>
        {active === 'app' && <div className="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent opacity-50"></div>}
      </button>
      
      <button 
        onClick={() => onChange('admin')}
        className={`flex-1 flex items-center justify-center gap-3 px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-700 relative overflow-hidden ${
          active === 'admin' 
            ? 'bg-indigo-600 text-white shadow-[0_10px_20px_rgba(79,70,229,0.3)] scale-100' 
            : 'text-zinc-600 hover:text-zinc-300 hover:bg-white/5'
        }`}
      >
        <Monitor size={14} className={active === 'admin' ? 'animate-pulse' : ''} />
        <span>Admin Panel</span>
        {active === 'admin' && <div className="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent opacity-50"></div>}
      </button>
    </div>
  );
};

export default WorkspaceToggle;
