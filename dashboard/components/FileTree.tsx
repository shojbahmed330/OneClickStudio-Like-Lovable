
import React, { useState, useMemo } from 'react';
import { 
  ChevronRight, ChevronDown, FileCode, Folder, 
  FolderOpen, FileText, Layout, Hash, FileJson,
  Plus, FilePlus, FolderPlus, Trash2, Edit2, MoreVertical, X
} from 'lucide-react';

interface TreeItem {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: TreeItem[];
}

interface FileTreeProps {
  files: Record<string, string>;
  selectedFile: string;
  onSelectFile: (path: string) => void;
  onAddFile: (path: string) => void;
  onDeleteFile: (path: string) => void;
  onRenameFile: (oldPath: string, newPath: string) => void;
}

const getFileIcon = (name: string, isSelected: boolean) => {
  const ext = name.split('.').pop()?.toLowerCase();
  
  switch(ext) {
    case 'html': return <Layout size={14} className={isSelected ? 'text-white' : 'text-orange-500'} />;
    case 'css': return <Hash size={14} className={isSelected ? 'text-white' : 'text-blue-500'} />;
    case 'js': case 'ts': case 'tsx': return <FileCode size={14} className={isSelected ? 'text-white' : 'text-yellow-500'} />;
    case 'json': return <FileJson size={14} className={isSelected ? 'text-white' : 'text-cyan-500'} />;
    default: return <FileText size={14} className={isSelected ? 'text-white' : 'text-zinc-500'} />;
  }
};

const FileTree: React.FC<FileTreeProps> = ({ 
  files, selectedFile, onSelectFile, onAddFile, onDeleteFile, onRenameFile 
}) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['root']));
  const [isCreating, setIsCreating] = useState<{ type: 'file' | 'folder', parent: string } | null>(null);
  const [newName, setNewName] = useState('');

  const tree = useMemo(() => {
    const root: TreeItem[] = [];
    Object.keys(files).forEach(path => {
      const parts = path.split('/');
      let currentLevel = root;
      let currentPath = '';

      parts.forEach((part, i) => {
        currentPath += (i === 0 ? '' : '/') + part;
        const isLast = i === parts.length - 1;
        let existing = currentLevel.find(item => item.name === part);

        if (!existing) {
          existing = {
            name: part,
            path: currentPath,
            type: isLast ? 'file' : 'folder',
            children: isLast ? undefined : []
          };
          currentLevel.push(existing);
        }
        if (existing.children) {
          currentLevel = existing.children;
        }
      });
    });

    const sortItems = (items: TreeItem[]) => {
      items.sort((a, b) => {
        if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
      items.forEach(item => item.children && sortItems(item.children));
    };
    sortItems(root);
    return root;
  }, [files]);

  const toggleFolder = (path: string) => {
    const next = new Set(expandedFolders);
    if (next.has(path)) next.delete(path);
    else next.add(path);
    setExpandedFolders(next);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !isCreating) return;
    const path = isCreating.parent ? `${isCreating.parent}/${newName}` : newName;
    onAddFile(path);
    setIsCreating(null);
    setNewName('');
    if (isCreating.parent) {
      setExpandedFolders(prev => new Set([...prev, isCreating.parent]));
    }
  };

  const renderItem = (item: TreeItem, depth: number = 0) => {
    const isExpanded = expandedFolders.has(item.path);
    const isSelected = selectedFile === item.path;

    if (item.type === 'folder') {
      return (
        <div key={item.path}>
          <div 
            className="w-full flex items-center justify-between group px-3 py-1 hover:bg-white/5 cursor-pointer text-[11px] font-bold text-zinc-400"
            style={{ paddingLeft: `${depth * 12 + 12}px` }}
            onClick={() => toggleFolder(item.path)}
          >
            <div className="flex items-center gap-2">
              {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              {isExpanded ? <FolderOpen size={14} className="text-pink-500/60" /> : <Folder size={14} className="text-zinc-600" />}
              <span className="truncate">{item.name}</span>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pr-2">
               <button onClick={(e) => { e.stopPropagation(); setIsCreating({ type: 'file', parent: item.path }); }} className="p-1 hover:text-white"><FilePlus size={12}/></button>
               <button onClick={(e) => { e.stopPropagation(); setIsCreating({ type: 'folder', parent: item.path }); }} className="p-1 hover:text-white"><FolderPlus size={12}/></button>
            </div>
          </div>
          {isExpanded && item.children?.map(child => renderItem(child, depth + 1))}
          {isExpanded && isCreating?.parent === item.path && (
             <form onSubmit={handleCreateSubmit} className="flex items-center gap-2 py-1" style={{ paddingLeft: `${(depth + 1) * 12 + 24}px` }}>
                {isCreating.type === 'file' ? <FileText size={12} className="text-zinc-600"/> : <Folder size={12} className="text-zinc-600"/>}
                <input autoFocus value={newName} onChange={e => setNewName(e.target.value)} onBlur={() => setIsCreating(null)} className="bg-black/40 border border-pink-500/30 rounded px-2 py-0.5 text-[10px] text-white outline-none w-full" placeholder={`New ${isCreating.type}...`} />
             </form>
          )}
        </div>
      );
    }

    return (
      <div 
        key={item.path}
        className={`w-full group flex items-center justify-between transition-all text-[11px] font-bold border-l-2 cursor-pointer ${isSelected ? 'bg-pink-600/10 text-white border-pink-500 shadow-inner' : 'text-zinc-500 border-transparent hover:bg-white/5'}`}
        style={{ paddingLeft: `${depth * 12 + 24}px` }}
        onClick={() => onSelectFile(item.path)}
      >
        <div className="flex items-center gap-2 py-1.5 flex-1 min-w-0">
          {getFileIcon(item.name, isSelected)}
          <span className="truncate">{item.name}</span>
        </div>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity pr-3">
           <button onClick={(e) => { e.stopPropagation(); if (window.confirm('Delete file?')) onDeleteFile(item.path); }} className="p-1 text-zinc-600 hover:text-red-500"><Trash2 size={12}/></button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto custom-scrollbar bg-[#09090b]">
      <div className="px-4 py-3 flex items-center justify-between border-b border-white/5 bg-black/40">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Explorer</h3>
        <div className="flex items-center gap-2">
           <button onClick={() => setIsCreating({ type: 'file', parent: '' })} className="p-1 hover:text-white transition-colors" title="New File"><FilePlus size={14}/></button>
           <button onClick={() => setIsCreating({ type: 'folder', parent: '' })} className="p-1 hover:text-white transition-colors" title="New Folder"><FolderPlus size={14}/></button>
        </div>
      </div>
      <div className="py-2">
        {tree.map(item => renderItem(item))}
        {isCreating?.parent === '' && (
           <form onSubmit={handleCreateSubmit} className="flex items-center gap-2 py-1 px-6">
              {isCreating.type === 'file' ? <FileText size={12} className="text-zinc-600"/> : <Folder size={12} className="text-zinc-600"/>}
              <input autoFocus value={newName} onChange={e => setNewName(e.target.value)} onBlur={() => setIsCreating(null)} className="bg-black/40 border border-pink-500/30 rounded px-2 py-0.5 text-[10px] text-white outline-none w-full" placeholder={`New ${isCreating.type}...`} />
           </form>
        )}
      </div>
    </div>
  );
};

export default FileTree;
