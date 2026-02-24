
import React from 'react';
import { History, Clock, ArrowLeft, RefreshCw, Undo2, Zap, ShieldCheck, Trash2 } from 'lucide-react';
import { ProjectHistoryItem } from '../../services/dbService';

interface VersionHistoryProps {
  history: ProjectHistoryItem[];
  currentFiles: Record<string, string>;
  onRollback: (files: Record<string, string>, message: string) => void;
  onPreview: (files: Record<string, string> | null) => void;
  onClose: () => void;
  onRefresh?: () => void;
  onDelete?: (id: string) => void;
  loading?: boolean;
}

const VersionHistory: React.FC<VersionHistoryProps> = ({ 
  history, onRollback, onPreview, onClose, onRefresh, onDelete, loading 
}) => {
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  const handleSelectVersion = (item: ProjectHistoryItem) => {
    if (selectedId === item.id) {
      setSelectedId(null);
      onPreview(null);
    } else {
      setSelectedId(item.id);
      onPreview(item.files);
    }
  };

  const selectedItem = history.find(h => h.id === selectedId);

  return (
    <div className="flex-1 flex flex-col bg-[#09090b] h-full animate-in fade-in slide-in-from-right-10 duration-500 overflow-hidden">
      {/* Header Section */}
      <div className="p-6 md:p-8 border-b border-white/5 flex items-center justify-between bg-black/20 shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => { onPreview(null); onClose(); }} className="p-3 hover:bg-white/5 rounded-2xl transition-all">
            <ArrowLeft size={20} className="text-zinc-400" />
          </button>
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
              <History size={24} className="text-pink-500"/> Version <span className="text-pink-500">Timeline</span>
            </h2>
            <p className="text-[10px] font-black uppercase text-zinc-600 tracking-[0.4em] mt-1">Project Recovery Hub</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {onRefresh && (
            <button 
              onClick={onRefresh}
              disabled={loading}
              className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-zinc-400 hover:text-white transition-all border border-white/5 disabled:opacity-30"
              title="Refresh Timeline"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''}/>
            </button>
          )}

          {selectedItem && (
            <div className="flex items-center gap-4 animate-in slide-in-from-right-4">
               <button 
                  onClick={() => onRollback(selectedItem.files, selectedItem.message)}
                  className="px-6 py-3 bg-pink-600 hover:bg-pink-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-3 shadow-xl shadow-pink-600/30 transition-all active:scale-95 group"
                >
                  <Undo2 size={16} className="group-hover:-rotate-45 transition-transform"/> Restore Now
                </button>
            </div>
          )}
        </div>
      </div>

      {/* Info Banner when previewing */}
      {selectedId && (
        <div className="bg-pink-600/10 border-b border-pink-500/20 p-3 px-8 flex items-center justify-between animate-in slide-in-from-top-full">
           <div className="flex items-center gap-3">
              <Zap size={14} className="text-pink-500"/>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                Previewing Snapshot: <span className="text-white">"{selectedItem?.message || 'Untitled'}"</span>
              </p>
           </div>
           <button onClick={() => { setSelectedId(null); onPreview(null); }} className="text-[10px] font-black uppercase text-pink-500 hover:underline">Exit Preview</button>
        </div>
      )}

      {/* History List */}
      <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar space-y-6">
        {history.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-10">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 text-zinc-700">
               <Clock size={40} />
            </div>
            <h3 className="text-lg font-black text-zinc-500 uppercase tracking-widest">No Snapshots Detected</h3>
            <p className="text-xs text-zinc-600 max-w-[280px] mt-2 font-bold uppercase leading-relaxed">
              Snapshots are automatically created when AI generates code for an active project. (Limit: 10)
            </p>
            {onRefresh && (
              <button onClick={onRefresh} className="mt-8 px-8 py-3 bg-pink-500/10 border border-pink-500/20 text-pink-500 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-pink-500 hover:text-white transition-all">
                Try Refreshing
              </button>
            )}
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-8 relative">
            <div className="absolute left-6 top-0 bottom-0 w-px bg-white/5"></div>
            
            {history.map((item, idx) => {
              const isActive = selectedId === item.id;
              
              return (
                <div key={item.id} className="relative pl-14 group">
                  <div className={`absolute left-4 top-1 w-4 h-4 rounded-full border-2 z-10 transition-all duration-500 ${isActive ? 'bg-pink-500 border-pink-500 shadow-[0_0_15px_#ec4899]' : 'bg-zinc-900 border-zinc-700 group-hover:border-pink-500/50'}`}></div>
                  
                  <div className="flex gap-3">
                    <div 
                      onClick={() => handleSelectVersion(item)}
                      className={`flex-1 glass-tech p-6 rounded-[2rem] border transition-all cursor-pointer relative overflow-hidden ${isActive ? 'border-pink-500/40 bg-pink-500/5 ring-1 ring-pink-500/20' : 'border-white/5 hover:border-white/10'}`}
                    >
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                            <Clock size={12}/>
                            {new Date(item.created_at).toLocaleString()}
                          </div>
                          {idx === 0 && (
                            <span className="text-[9px] px-2 py-0.5 bg-green-500/10 border border-green-500/20 rounded-md text-green-500 font-black uppercase flex items-center gap-1">
                              <ShieldCheck size={10}/> Latest
                            </span>
                          )}
                        </div>
                        
                        <h3 className={`font-bold leading-relaxed pr-2 transition-colors ${isActive ? 'text-pink-400' : 'text-white'}`}>
                          {item.message || "Manual Snapshot"}
                        </h3>

                        <div className="flex items-center gap-2">
                          <span className="text-[9px] px-2 py-0.5 bg-white/5 border border-white/5 rounded-md text-zinc-600 font-black uppercase">
                            {Object.keys(item.files).length} Files
                          </span>
                          {isActive && (
                              <span className="text-[9px] text-pink-500 font-black uppercase tracking-widest animate-pulse">● Preview Active</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={(e) => { e.stopPropagation(); onDelete && onDelete(item.id); }}
                      className="p-4 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-500/20 rounded-2xl self-center transition-all opacity-0 group-hover:opacity-100"
                      title="Delete version"
                    >
                      <Trash2 size={18}/>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Footer Info */}
      <div className="p-4 bg-black/40 border-t border-white/5 text-center shrink-0">
          <p className="text-[9px] font-black uppercase text-zinc-700 tracking-[0.3em]">
             Select any version to preview it in the visual window before restoring.
          </p>
      </div>
    </div>
  );
};

export default VersionHistory;
