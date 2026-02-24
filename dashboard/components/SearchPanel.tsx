import React, { useState, useMemo } from 'react';
import { Search, FileText, ChevronRight, Hash } from 'lucide-react';

interface SearchPanelProps {
  files: Record<string, string>;
  onSelectFile: (path: string) => void;
}

const SearchPanel: React.FC<SearchPanelProps> = ({ files, onSelectFile }) => {
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    if (query.length < 2) return [];
    const found: { path: string, line: number, text: string }[] = [];
    
    Object.entries(files).forEach(([path, content]) => {
      // Explicitly check that content is a string to satisfy TypeScript compiler
      if (typeof content === 'string') {
        const lines = content.split('\n');
        lines.forEach((line, index) => {
          if (line.toLowerCase().includes(query.toLowerCase())) {
            found.push({ path, line: index + 1, text: line.trim() });
          }
        });
      }
    });
    return found;
  }, [query, files]);

  return (
    <div className="flex-1 flex flex-col p-4 space-y-6 overflow-hidden">
      <div className="space-y-4">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Global Search</h3>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
          <input 
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-[11px] text-white outline-none focus:border-pink-500/30 transition-all placeholder:text-zinc-800" 
            placeholder="Search symbols or text..." 
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4">
        {results.length > 0 ? (
          <div className="space-y-2">
            <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest px-1">{results.length} Occurrences</p>
            {results.map((res, i) => (
              <button 
                key={i}
                onClick={() => onSelectFile(res.path)}
                className="w-full text-left p-3 rounded-xl bg-white/5 border border-white/5 hover:border-pink-500/20 transition-all group"
              >
                <div className="flex items-center gap-2 mb-1">
                  <FileText size={10} className="text-zinc-500"/>
                  <span className="text-[9px] font-black text-zinc-400 uppercase tracking-tighter truncate flex-1">{res.path}</span>
                  <span className="text-[8px] font-mono text-pink-500/60 bg-pink-500/5 px-1.5 rounded">L{res.line}</span>
                </div>
                <p className="text-[10px] text-zinc-500 line-clamp-1 italic font-medium">
                  {res.text.length > 40 ? '...' + res.text.slice(0, 40) : res.text}
                </p>
              </button>
            ))}
          </div>
        ) : query.length >= 2 ? (
          <div className="flex flex-col items-center justify-center h-40 opacity-20 gap-3">
             <Search size={32}/>
             <span className="text-[10px] font-black uppercase tracking-widest">No matches found</span>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-40 opacity-10 gap-3">
             <Hash size={32}/>
             <span className="text-[9px] font-black uppercase tracking-widest text-center px-6">Type at least 2 characters to scan workspace</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPanel;