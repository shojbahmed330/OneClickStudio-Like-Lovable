
import React from 'react';
import { Search, LayoutGrid, List, Plus, Archive, HardDrive, Database, Zap } from 'lucide-react';

interface ProjectHeaderProps {
  projectsCount: number;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  onNewClick: () => void;
  onSaveClick: () => void;
}

const ProjectHeader: React.FC<ProjectHeaderProps> = ({
  projectsCount, searchQuery, onSearchChange, viewMode, onViewModeChange, onNewClick, onSaveClick
}) => {
  return (
    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 bg-[#0a0a0a] p-8 rounded-xl border border-white/5 shadow-2xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-pink-500/[0.02] blur-[100px] rounded-full -z-10"></div>
      
      <div className="flex items-center gap-6">
        <div className="w-16 h-16 bg-pink-500/10 rounded-lg border border-pink-500/20 flex items-center justify-center text-pink-500 shadow-[0_0_20px_rgba(236,72,153,0.1)]">
          <HardDrive size={32}/>
        </div>
        <div>
          <h2 className="text-3xl font-black tracking-tighter text-white uppercase leading-none">
            Project <span className="text-pink-500">Hub</span>
          </h2>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-2">
               <Database size={12} className="text-zinc-600"/>
               <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-500">{projectsCount} Nodes</span>
            </div>
            <div className="flex items-center gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse"></div>
               <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-600">Sync Active</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center bg-zinc-900/50 border border-white/5 rounded-lg px-4 py-3 focus-within:border-pink-500/30 transition-all min-w-[280px]">
          <Search className="text-zinc-700" size={16}/>
          <input 
            type="text" 
            placeholder="Search projects..." 
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            className="bg-transparent border-none outline-none text-[11px] text-white ml-3 w-full placeholder:text-zinc-800 font-mono uppercase tracking-widest"
          />
        </div>
        
        <div className="flex bg-zinc-900/50 p-1 rounded-lg border border-white/5">
           <button onClick={() => onViewModeChange('grid')} className={`p-2.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-pink-600 text-white shadow-lg' : 'text-zinc-600 hover:text-zinc-400'}`}><LayoutGrid size={18}/></button>
           <button onClick={() => onViewModeChange('list')} className={`p-2.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-pink-600 text-white shadow-lg' : 'text-zinc-600 hover:text-zinc-400'}`}><List size={18}/></button>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={onNewClick}
            className="px-6 py-3 bg-zinc-900 border border-white/5 rounded-lg font-black uppercase text-[9px] text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all flex items-center gap-2"
          >
            <Plus size={16}/> New Project
          </button>
          
          <button 
            onClick={onSaveClick}
            className="px-6 py-3 bg-pink-600 rounded-lg font-black uppercase text-[9px] text-white shadow-lg shadow-pink-600/20 hover:bg-pink-500 transition-all flex items-center gap-2"
          >
            <Archive size={16}/> Save Current
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectHeader;
