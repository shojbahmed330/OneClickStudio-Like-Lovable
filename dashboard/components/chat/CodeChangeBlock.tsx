
import React, { useState } from 'react';
import { FileCode, ChevronDown, ChevronUp } from 'lucide-react';
import DiffViewer from './DiffViewer';

interface CodeChangeBlockProps {
  files: Record<string, string>;
  originalFiles?: Record<string, string>;
}

const CodeChangeBlock: React.FC<CodeChangeBlockProps> = ({ files, originalFiles }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const filePaths = Object.keys(files);
  if (filePaths.length === 0) return null;

  return (
    <div className="my-6 bg-[#0d0d0f] rounded-2xl border border-white/10 overflow-hidden shadow-2xl animate-in fade-in slide-in-from-left-4 duration-700">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between px-4 md:px-5 py-3 md:py-4 cursor-pointer hover:bg-white/5 transition-all group"
      >
        <div className="flex items-center gap-3 md:gap-4">
          <div className="p-2 bg-pink-500/20 rounded-xl text-pink-500 group-hover:scale-110 transition-transform">
            <FileCode size={16} />
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-pink-500/80">Code Changes</span>
            <span className="text-[10px] md:text-[11px] font-bold text-white mt-0.5">
              Modified {filePaths.length} file{filePaths.length > 1 ? 's' : ''}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <div className="px-2 py-1 bg-white/5 rounded-md border border-white/10">
            <span className="text-[8px] md:text-[9px] font-black uppercase text-zinc-400">{isOpen ? 'Close' : 'Review'}</span>
          </div>
          {isOpen ? <ChevronUp size={14} className="text-zinc-400" /> : <ChevronDown size={14} className="text-zinc-400" />}
        </div>
      </div>
      
      {isOpen && (
        <div className="border-t border-white/5 flex flex-col md:flex-row h-[500px] md:h-[400px]">
          {/* File List */}
          <div className="w-full md:w-48 border-b md:border-b-0 md:border-r border-white/5 bg-black/20 flex md:flex-col overflow-x-auto md:overflow-y-auto custom-scrollbar no-scrollbar shrink-0">
            {filePaths.map((path) => (
              <button
                key={path}
                onClick={() => setSelectedFile(path)}
                className={`flex-1 md:flex-none text-left px-4 py-3 text-[10px] md:text-[11px] font-bold transition-all border-r md:border-r-0 md:border-b border-white/5 hover:bg-white/5 whitespace-nowrap md:whitespace-normal shrink-0 ${selectedFile === path ? 'bg-pink-500/10 text-pink-500 md:border-r-2 md:border-r-pink-500' : 'text-zinc-400'}`}
              >
                {path.split('/').pop()}
                <div className="hidden md:block text-[9px] font-medium text-zinc-600 truncate">{path}</div>
              </button>
            ))}
          </div>

          {/* Diff Viewer */}
          <div className="flex-1 p-4 md:p-6 bg-black/40 overflow-y-auto custom-scrollbar">
            {selectedFile ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-zinc-500 truncate max-w-[200px]">{selectedFile}</span>
                  <span className="text-[8px] md:text-[9px] font-bold text-emerald-500/60 uppercase shrink-0">Diff View</span>
                </div>
                <DiffViewer 
                  oldText={originalFiles?.[selectedFile] || ''} 
                  newText={files[selectedFile]} 
                />
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-zinc-600 gap-3 p-8">
                <FileCode size={32} strokeWidth={1} className="opacity-50" />
                <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-center">Select a file to review changes</span>
              </div>
            )}
          </div>
        </div>
      )}
      
      {!isOpen && (
        <div className="px-5 py-3 bg-black/20 border-t border-white/5 flex items-center gap-2 overflow-x-auto custom-scrollbar no-scrollbar">
          {filePaths.map(path => (
            <div key={path} className="px-2 py-1 bg-white/5 rounded-md border border-white/5 flex items-center gap-2 shrink-0">
              <span className="text-[9px] font-bold text-zinc-500">{path.split('/').pop()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CodeChangeBlock;
