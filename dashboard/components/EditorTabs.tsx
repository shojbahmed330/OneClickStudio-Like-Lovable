
import React from 'react';
import { X, Layout, FileCode, Hash, FileJson, FileText } from 'lucide-react';

interface EditorTabsProps {
  tabs: string[];
  activeTab: string;
  onSelect: (path: string) => void;
  onClose: (path: string, e: React.MouseEvent) => void;
}

const getTabIcon = (name: string, isActive: boolean) => {
  const ext = name.split('.').pop()?.toLowerCase();
  switch(ext) {
    case 'html': return <Layout size={12} className={isActive ? 'text-white' : 'text-orange-500'} />;
    case 'css': return <Hash size={12} className={isActive ? 'text-white' : 'text-blue-500'} />;
    case 'js': case 'ts': case 'tsx': return <FileCode size={12} className={isActive ? 'text-white' : 'text-yellow-500'} />;
    case 'json': return <FileJson size={12} className={isActive ? 'text-white' : 'text-cyan-500'} />;
    default: return <FileText size={12} className="text-zinc-500" />;
  }
};

const EditorTabs: React.FC<EditorTabsProps> = ({ tabs, activeTab, onSelect, onClose }) => {
  if (tabs.length === 0) return null;

  return (
    <div className="flex bg-[#09090b] border-b border-white/5 overflow-x-auto no-scrollbar scroll-smooth w-full flex-nowrap shrink-0">
      {(Array.from(new Set(tabs)) as string[]).map(tab => {
        const isActive = activeTab === tab;
        const fileName = tab.split('/').pop() || tab;
        
        return (
          <div 
            key={tab}
            onClick={() => onSelect(tab)}
            className={`
              flex items-center gap-2 px-4 py-2.5 cursor-pointer border-r border-white/5 transition-all min-w-[120px] max-w-[180px] shrink-0 group relative
              ${isActive ? 'bg-[#0c0c0e] text-white' : 'text-zinc-500 hover:bg-white/5'}
            `}
          >
            {isActive && <div className="absolute top-0 left-0 right-0 h-0.5 bg-pink-500"></div>}
            {getTabIcon(fileName, isActive)}
            <span className="text-[9px] font-black uppercase tracking-wider truncate flex-1">{fileName}</span>
            <button 
              onClick={(e) => { e.stopPropagation(); onClose(tab, e); }}
              className={`p-1 rounded-md opacity-0 group-hover:opacity-100 ${isActive ? 'opacity-100' : ''} hover:bg-white/10`}
            >
              <X size={10} />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default EditorTabs;
