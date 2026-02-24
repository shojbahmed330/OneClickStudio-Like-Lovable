
import React, { useState, useEffect } from 'react';
import { Loader2, Terminal, Plus, Archive, Search, LayoutGrid, List as ListIcon } from 'lucide-react';
import { Project } from '../types';
import { DatabaseService } from '../services/dbService';
import { useLanguage } from '../i18n/LanguageContext';

// Sub-components
import ProjectHeader from './components/ProjectHeader';
import ProjectCard from './components/ProjectCard';
import ProjectModals from './components/ProjectModals';

interface ProjectsViewProps {
  userId: string;
  currentFiles: Record<string, string>;
  onLoadProject: (project: Project) => void;
  onSaveCurrent: (name: string) => Promise<any>;
  onCreateNew: (name: string) => Promise<any>;
}

const ProjectsView: React.FC<ProjectsViewProps> = ({ 
  userId, onLoadProject, onSaveCurrent, onCreateNew 
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { t } = useLanguage();
  
  const [showModal, setShowModal] = useState<'save' | 'new' | null>(null);
  const [projectNameInput, setProjectNameInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  const [isRenaming, setIsRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const db = DatabaseService.getInstance();

  const fetchProjects = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await db.getProjects(userId);
      setProjects(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Projects Fetch Error:", e);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [userId]);

  const handleAction = async () => {
    if (!projectNameInput.trim()) return;
    setIsProcessing(true);
    try {
      const cleanName = projectNameInput.trim();
      let newProj;
      if (showModal === 'save') {
        newProj = await onSaveCurrent(cleanName);
      } else {
        newProj = await onCreateNew(cleanName);
      }
      
      setShowModal(null);
      setProjectNameInput('');
      await fetchProjects();
      
      if (newProj) onLoadProject(newProj);
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!userId) {
      alert("Session expired. Please login again.");
      return;
    }
    
    setDeletingId(id);
    try {
      const success = await db.deleteProject(userId, id);
      if (success) {
        setProjects(prev => prev.filter(p => p.id !== id));
        if (localStorage.getItem('active_project_id') === id) {
          localStorage.removeItem('active_project_id');
        }
      }
    } catch (err: any) {
      alert("Delete Failed: " + (err.message || "Unknown error"));
      fetchProjects();
    } finally {
      setDeletingId(null);
    }
  };

  const handleRenameSubmit = async (e: React.FormEvent, id: string) => {
    e.preventDefault();
    if (!renameValue.trim()) return;
    try {
      await db.renameProject(userId, id, renameValue);
      setProjects(prev => prev.map(p => p.id === id ? { ...p, name: renameValue } : p));
      setIsRenaming(null);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const filteredProjects = projects.filter(p => p.name?.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="flex-1 p-4 md:p-8 overflow-y-auto bg-[#050505] custom-scrollbar text-zinc-100 selection:bg-pink-500/30">
      {/* Background Grid Pattern */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]" 
           style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>

      <div className="max-w-7xl mx-auto space-y-8 pb-32 animate-in fade-in duration-700 relative z-10">
        
        <ProjectHeader 
          projectsCount={projects.length}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onNewClick={() => setShowModal('new')}
          onSaveClick={() => setShowModal('save')}
        />

        {loading ? (
          <div className="h-[400px] flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-2 border-pink-500/20 border-t-pink-500 rounded-full animate-spin"></div>
            <span className="text-[10px] font-mono uppercase tracking-[0.4em] text-zinc-600">Syncing Cluster...</span>
          </div>
        ) : filteredProjects.length > 0 ? (
          <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
            {filteredProjects.map((project) => (
              <ProjectCard 
                key={project.id}
                project={project}
                viewMode={viewMode}
                isActive={localStorage.getItem('active_project_id') === project.id}
                isRenaming={isRenaming === project.id}
                renameValue={renameValue}
                onRenameClick={(e) => {
                  e.preventDefault(); e.stopPropagation();
                  setIsRenaming(project.id);
                  setRenameValue(project.name);
                }}
                onRenameChange={setRenameValue}
                onRenameCancel={() => setIsRenaming(null)}
                onRenameSubmit={(e) => handleRenameSubmit(e, project.id)}
                onDelete={() => handleDelete(project.id)}
                onLoad={() => onLoadProject(project)}
                isDeleting={deletingId === project.id}
              />
            ))}
          </div>
        ) : (
          <div className="border-2 border-dashed border-zinc-800 p-20 rounded-xl text-center max-w-2xl mx-auto space-y-8 bg-black/40 backdrop-blur-sm">
            <div className="w-24 h-24 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center mx-auto text-zinc-700">
              <Terminal size={48}/>
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-white uppercase tracking-tight">No Active Nodes</h3>
              <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Your cloud repository is currently empty.</p>
            </div>
            <button 
              onClick={() => setShowModal('new')}
              className="px-10 py-4 bg-pink-600 hover:bg-pink-500 text-white rounded-lg font-black uppercase text-[10px] tracking-[0.2em] transition-all shadow-lg shadow-pink-600/20"
            >
              Initialize First Node
            </button>
          </div>
        )}
      </div>

      <ProjectModals 
        showModal={showModal}
        onClose={() => setShowModal(null)}
        projectNameInput={projectNameInput}
        onInputChange={setProjectNameInput}
        isProcessing={isProcessing}
        onAction={handleAction}
      />
    </div>
  );
};

export default ProjectsView;
