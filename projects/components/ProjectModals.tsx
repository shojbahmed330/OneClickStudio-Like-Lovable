
import React from 'react';
import { X, Archive, Plus, Loader2, ChevronRight } from 'lucide-react';

interface ProjectModalsProps {
  showModal: 'save' | 'new' | null;
  onClose: () => void;
  projectNameInput: string;
  onInputChange: (val: string) => void;
  isProcessing: boolean;
  onAction: () => void;
}

const ProjectModals: React.FC<ProjectModalsProps> = ({
  showModal, onClose, projectNameInput, onInputChange, isProcessing, onAction
}) => {
  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/90 backdrop-blur-md p-6 animate-in fade-in duration-300">
       <div className="bg-[#0a0a0a] border border-white/10 p-10 rounded-xl w-full max-w-md shadow-2xl relative animate-in zoom-in duration-500">
          <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-white/5 rounded-lg text-zinc-600 hover:text-white transition-all"><X size={20}/></button>
          
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-pink-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-pink-500 border border-pink-500/20 shadow-[0_0_20px_rgba(236,72,153,0.1)]">
              {showModal === 'save' ? <Archive size={32}/> : <Plus size={32}/>}
            </div>
            <h3 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">
              {showModal === 'save' ? 'Archive' : 'New'} <span className="text-pink-500">Node</span>
            </h3>
            <p className="text-[9px] font-mono uppercase tracking-[0.3em] text-zinc-600 mt-4">Initialize cloud resource metadata</p>
          </div>

          <div className="space-y-8">
            <div className="space-y-3">
              <label className="text-[9px] font-mono uppercase text-zinc-500 tracking-widest ml-1">Project Identifier</label>
              <input 
                autoFocus 
                value={projectNameInput} 
                onChange={e => onInputChange(e.target.value)} 
                onKeyDown={e => e.key === 'Enter' && onAction()} 
                placeholder="Enter project name..." 
                className="w-full bg-zinc-900/50 border border-white/5 rounded-lg p-5 text-white text-sm outline-none focus:border-pink-500/30 transition-all font-bold placeholder:text-zinc-800" 
              />
            </div>
            
            <button 
              disabled={isProcessing || !projectNameInput.trim()} 
              onClick={onAction} 
              className="w-full py-5 bg-pink-600 hover:bg-pink-500 text-white rounded-lg font-black uppercase text-[10px] tracking-[0.2em] shadow-lg shadow-pink-600/20 active:scale-95 transition-all flex items-center justify-center gap-3 group"
            >
              {isProcessing ? (
                <Loader2 className="animate-spin" size={20}/>
              ) : (
                <>Initialize System <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform"/></>
              )}
            </button>
          </div>
       </div>
    </div>
  );
};

export default ProjectModals;
