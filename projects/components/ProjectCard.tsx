
import React, { useState } from 'react';
import { FileCode, Clock, Layers, Trash2, Edit3, Box, ShieldCheck, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { Project } from '../../types';

interface ProjectCardProps {
  project: Project;
  isActive: boolean;
  viewMode: 'grid' | 'list';
  isRenaming: boolean;
  renameValue: string;
  onRenameClick: (e: React.MouseEvent) => void;
  onRenameSubmit: (e: React.FormEvent) => void;
  onRenameChange: (val: string) => void;
  onRenameCancel: () => void;
  onDelete: () => void;
  onLoad: () => void;
  isDeleting: boolean;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  project, isActive, viewMode, isRenaming, renameValue, onRenameClick, onRenameSubmit, onRenameChange, onRenameCancel, onDelete, onLoad, isDeleting
}) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const fileCount = project.files ? Object.keys(project.files).length : 0;

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowConfirm(true);
  };

  const confirmDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete();
    setShowConfirm(false);
  };

  const cancelDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowConfirm(false);
  };

  if (viewMode === 'list') {
    return (
      <div className={`group flex items-center justify-between p-6 rounded-lg bg-[#0a0a0a] border transition-all ${isActive ? 'border-pink-500/30 bg-pink-500/[0.02]' : 'border-white/5 hover:border-white/10'} ${isDeleting ? 'opacity-30' : ''}`}>
        <div className="flex items-center gap-8">
          <div className={`w-12 h-12 rounded-md flex items-center justify-center transition-all ${isActive ? 'bg-pink-600 text-white shadow-lg' : 'bg-zinc-900 text-zinc-600 group-hover:text-pink-500'}`}>
            <FileCode size={20}/>
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-white text-lg group-hover:text-pink-400 transition-colors tracking-tight uppercase">{project.name}</h4>
            <div className="flex items-center gap-4">
              <span className="text-[9px] font-mono uppercase text-zinc-600 tracking-widest flex items-center gap-1.5"><Clock size={12}/> {new Date(project.updated_at).toLocaleDateString()}</span>
              <span className="text-[9px] font-mono uppercase text-zinc-600 tracking-widest flex items-center gap-1.5"><Layers size={12}/> {fileCount} Files</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {showConfirm ? (
            <div className="flex items-center gap-2 animate-in slide-in-from-right-2">
              <span className="text-[9px] font-black uppercase text-red-500 tracking-widest mr-2">Delete?</span>
              <button onClick={confirmDelete} className="px-4 py-2 bg-red-600 text-white rounded font-black uppercase text-[9px] tracking-widest hover:bg-red-500">Yes</button>
              <button onClick={cancelDelete} className="px-4 py-2 bg-zinc-800 text-zinc-400 rounded font-black uppercase text-[9px] tracking-widest hover:bg-zinc-700">No</button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button 
                disabled={isDeleting}
                onClick={handleDeleteClick} 
                className="p-3 bg-red-500/10 text-red-500 rounded-md transition-all lg:opacity-0 lg:group-hover:opacity-100 border border-red-500/20 hover:bg-red-600 hover:text-white"
              >
                {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16}/>}
              </button>
              <button onClick={onLoad} className={`px-6 py-3 rounded-md font-black uppercase text-[9px] tracking-widest transition-all ${isActive ? 'bg-pink-600 text-white shadow-lg' : 'bg-zinc-900 text-zinc-500 hover:text-white hover:bg-pink-600'}`}>
                {isActive ? 'Active' : 'Mount'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`group relative p-8 rounded-xl bg-[#0a0a0a] border transition-all duration-500 flex flex-col gap-8 overflow-hidden ${isActive ? 'border-pink-500/40 shadow-[0_0_30px_rgba(236,72,153,0.05)]' : 'border-white/5 hover:border-white/10 hover:bg-[#0c0c0c]'} ${isDeleting ? 'opacity-30 grayscale' : ''}`}>
      <div className="flex items-start justify-between relative z-10">
        <div className="space-y-4 flex-1">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-lg flex items-center justify-center transition-all ${isActive ? 'bg-pink-600 text-white shadow-xl' : 'bg-zinc-900 text-zinc-600 group-hover:text-pink-500 group-hover:bg-pink-500/5'}`}>
              <Box size={28}/>
            </div>
            {isActive && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-pink-500/10 rounded-md border border-pink-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse"></span>
                <span className="text-[9px] font-black text-pink-500 uppercase tracking-widest">Active Node</span>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            {isRenaming ? (
              <form onSubmit={onRenameSubmit} className="flex items-center gap-2">
                <input 
                  autoFocus 
                  value={renameValue} 
                  onChange={e => onRenameChange(e.target.value)} 
                  onBlur={onRenameCancel} 
                  className="bg-black border border-pink-500/40 rounded-lg px-4 py-3 text-sm text-white outline-none w-full font-bold" 
                />
              </form>
            ) : (
              <h4 className="text-2xl font-black text-white group-hover:text-pink-400 transition-colors line-clamp-1 tracking-tighter uppercase leading-tight">
                {project.name}
              </h4>
            )}
            <div className="flex items-center gap-3 text-[9px] font-mono text-zinc-600 uppercase tracking-widest">
              <Clock size={12} className="opacity-40"/> {new Date(project.updated_at).toLocaleDateString()}
            </div>
          </div>
        </div>
        
        <div className="flex flex-col gap-3 lg:opacity-0 lg:group-hover:opacity-100 transition-all transform lg:translate-x-4 lg:group-hover:translate-x-0 duration-300 relative z-20">
          <button onClick={onRenameClick} className="p-3 bg-zinc-900 hover:bg-pink-600 text-zinc-600 hover:text-white rounded-lg transition-all border border-white/5"><Edit3 size={16}/></button>
          <button 
            disabled={isDeleting}
            onClick={handleDeleteClick} 
            className="p-3 bg-red-500/10 hover:bg-red-600 text-red-500 hover:text-white rounded-lg transition-all border border-red-500/20"
          >
            {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16}/>}
          </button>
        </div>
      </div>

      {showConfirm && (
        <div className="absolute inset-0 bg-black/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-300">
           <AlertCircle size={40} className="text-red-500 mb-4"/>
           <h5 className="text-white font-black uppercase tracking-tighter text-xl mb-2">Delete Project?</h5>
           <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-6">This action is permanent and cannot be reversed.</p>
           <div className="flex gap-3 w-full max-w-[200px]">
              <button onClick={confirmDelete} className="flex-1 py-3 bg-red-600 text-white rounded-lg font-black uppercase text-[10px] tracking-widest hover:bg-red-500 transition-all">Delete</button>
              <button onClick={cancelDelete} className="flex-1 py-3 bg-zinc-800 text-zinc-400 rounded-lg font-black uppercase text-[10px] tracking-widest hover:bg-zinc-700 transition-all">Cancel</button>
           </div>
        </div>
      )}

      <div className="mt-auto space-y-6 relative z-10">
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-3">
              <Layers size={14} className="text-pink-500/50"/>
              <span className="text-[9px] font-mono uppercase text-zinc-500 tracking-widest">
                {fileCount} Files
              </span>
           </div>
           <div className="text-[9px] font-mono text-zinc-800">ID: {project.id.slice(0, 8)}</div>
        </div>
        
        <div className="h-1 w-full bg-zinc-900 rounded-full overflow-hidden">
          <div className={`h-full transition-all duration-[2s] ${isActive ? 'bg-pink-600 w-full shadow-[0_0_10px_#ec4899]' : 'bg-zinc-800 w-[40%]'}`}></div>
        </div>

        <button 
          onClick={onLoad}
          className={`w-full py-4 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 group/btn ${isActive ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/20' : 'bg-zinc-900 text-zinc-500 hover:text-white hover:bg-pink-600'}`}
        >
          {isActive ? <ShieldCheck size={18}/> : <ChevronRight size={18} className="group-hover/btn:translate-x-1 transition-transform"/>}
          {isActive ? 'Active' : 'Initialize'}
        </button>
      </div>
    </div>
  );
};

export default ProjectCard;
