
import React from 'react';
import { Files, Search, Settings, History, Code2, Sparkles, Brain, Terminal } from 'lucide-react';

export type SidebarView = 'explorer' | 'search' | 'history' | 'config' | 'thinking' | 'terminal';

interface ActivityBarProps {
  activeView: SidebarView;
  onViewChange: (view: SidebarView) => void;
}

const ActivityBar: React.FC<ActivityBarProps> = ({ activeView, onViewChange }) => {
  const items = [
    { id: 'explorer', icon: Files, label: 'Explorer', short: 'Files' },
    { id: 'search', icon: Search, label: 'Search', short: 'Search' },
    { id: 'thinking', icon: Brain, label: 'Neural Insights', short: 'Brain' },
    { id: 'history', icon: History, label: 'Version Timeline', short: 'History' },
  ];

  return (
    <div className="w-20 bg-[#09090b] border-r border-white/5 flex flex-col items-center py-6 gap-2 shrink-0 z-20 overflow-y-auto no-scrollbar">
      <div className="mb-8 text-pink-500 hover:scale-110 transition-transform cursor-pointer">
        <Sparkles size={28} className="animate-pulse shadow-[0_0_20px_rgba(236,72,153,0.3)]" />
      </div>
      
      <div className="flex-1 flex flex-col gap-2 w-full px-2">
        {items.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id as SidebarView)}
              className={`w-full flex flex-col items-center justify-center py-4 rounded-2xl transition-all relative group ${isActive ? 'text-white bg-white/5 shadow-inner' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}`}
            >
              {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-pink-500 rounded-r-full shadow-[0_0_15px_#ec4899]"></div>}
              <item.icon size={22} className={isActive ? 'drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]' : ''} />
              <span className={`text-[8px] font-black uppercase tracking-tighter mt-2 ${isActive ? 'text-white' : 'text-zinc-600 opacity-60'}`}>{item.short}</span>
              
              {/* Tooltip on Hover */}
              <div className="absolute left-full ml-4 px-3 py-2 bg-zinc-900 border border-white/10 text-[9px] text-white font-black uppercase tracking-widest rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all scale-95 group-hover:scale-100 whitespace-nowrap z-50 shadow-2xl">
                 {item.label}
              </div>
            </button>
          );
        })}
      </div>

      {/* Replaced bottom section with simple decorative element or branding if needed, 
          Redundant Settings button removed as it's now in the Top Header. */}
      <div className="mt-auto flex flex-col gap-2 w-full px-2 pt-4 border-t border-white/5 opacity-20 hover:opacity-100 transition-opacity">
        <div className="w-full flex flex-col items-center justify-center py-4">
          <Terminal size={18} className="text-zinc-700" />
          <span className="text-[7px] font-black uppercase tracking-tighter mt-2 text-zinc-800">v2.5</span>
        </div>
      </div>
    </div>
  );
};

export default ActivityBar;
