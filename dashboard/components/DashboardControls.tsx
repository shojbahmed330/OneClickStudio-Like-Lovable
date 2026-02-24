
import React, { useState } from 'react';
import { MessageSquare, Smartphone, Rocket, Zap, Settings, HelpCircle, History, X, SlidersHorizontal, LayoutGrid, Menu, Monitor, ChevronRight } from 'lucide-react';
import { WorkspaceType, AppMode } from '../../types';

interface DashboardControlsProps {
  mobileTab: 'chat' | 'preview';
  setMobileTab: (t: 'chat' | 'preview') => void;
  workspace: WorkspaceType;
  setWorkspace: (w: WorkspaceType) => void;
  handleBuildAPK: () => void;
  onOpenConfig: () => void;
  onOpenHistory: () => void;
  onOpenHelp: () => void;
  isGenerating?: boolean;
}

export const MobileControls: React.FC<DashboardControlsProps> = ({ 
  mobileTab, setMobileTab, workspace, setWorkspace, handleBuildAPK, 
  onOpenConfig, onOpenHistory, onOpenHelp, isGenerating 
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* MOBILE HUD - Clean and Ergonomic */}
      <div className={`lg:hidden fixed top-16 left-0 right-0 z-[450] px-4 pointer-events-none flex flex-col gap-4 transition-opacity duration-300 ${isGenerating ? 'opacity-0' : 'opacity-100'}`}>
        {/* Main View Switcher */}
        <div className="flex justify-center w-full">
            <div className="bg-black/80 backdrop-blur-2xl p-1 rounded-full border border-white/10 flex gap-1 shadow-2xl pointer-events-auto ring-1 ring-white/5 w-[240px]">
              <button 
                onClick={() => setMobileTab('chat')} 
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-[10px] font-black uppercase transition-all duration-300 ${mobileTab === 'chat' ? 'bg-pink-600 text-white shadow-lg' : 'text-zinc-500'}`}
              >
                <MessageSquare size={14}/> <span>Chat</span>
              </button>
              <button 
                onClick={() => setMobileTab('preview')} 
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-[10px] font-black uppercase transition-all duration-300 ${mobileTab === 'preview' ? 'bg-pink-600 text-white shadow-lg' : 'text-zinc-500'}`}
              >
                <Smartphone size={14}/> <span>Visual</span>
              </button>
            </div>
        </div>

        {/* Floating Quick Actions (Always on Right) */}
        <div className="fixed right-4 bottom-24 flex flex-col items-end gap-3 pointer-events-auto">
          {isOpen && (
            <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <button onClick={() => { onOpenHistory(); setIsOpen(false); }} className="w-12 h-12 bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center text-zinc-400 shadow-2xl active:scale-90 transition-all">
                <History size={18} />
              </button>
              <button onClick={() => { onOpenConfig(); setIsOpen(false); }} className="w-12 h-12 bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center text-zinc-400 shadow-2xl active:scale-90 transition-all">
                <SlidersHorizontal size={18} />
              </button>
              <button onClick={() => { handleBuildAPK(); setIsOpen(false); }} className="w-12 h-12 bg-pink-600 border border-white/20 rounded-2xl flex items-center justify-center text-white shadow-[0_10px_30px_rgba(236,72,153,0.3)] active:scale-90 transition-all">
                <Rocket size={18} />
              </button>
            </div>
          )}
          
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white transition-all duration-500 shadow-2xl border border-white/10 active:scale-95 ${isOpen ? 'bg-zinc-800 rotate-90 border-pink-500/50' : 'bg-pink-600 shadow-pink-600/20 ring-4 ring-pink-500/10'}`}
          >
            {isOpen ? <X size={24}/> : <LayoutGrid size={24}/>}
          </button>
        </div>
      </div>

      {/* CONTEXTUAL WORKSPACE TOGGLE (Only in Preview Mode) */}
      {mobileTab === 'preview' && (
        <div className={`lg:hidden fixed bottom-24 left-6 z-[440] pointer-events-none transition-opacity duration-300 ${isGenerating ? 'opacity-0' : 'opacity-100'}`}>
          <div className="bg-zinc-900/95 backdrop-blur-2xl p-1 rounded-2xl border border-white/5 flex flex-col gap-1 shadow-xl pointer-events-auto">
            <button 
              onClick={() => setWorkspace('app')}
              className={`p-3 rounded-xl transition-all ${workspace === 'app' ? 'bg-pink-500/10 text-pink-500 border border-pink-500/20' : 'text-zinc-600'}`}
              title="Mobile View"
            >
              <Smartphone size={20}/>
            </button>
            <button 
              onClick={() => setWorkspace('admin')}
              className={`p-3 rounded-xl transition-all ${workspace === 'admin' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'text-zinc-600'}`}
              title="Admin View"
            >
              <Monitor size={20}/>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export const DesktopBuildButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <div className="hidden lg:block fixed bottom-12 right-12 z-[200] animate-in slide-in-from-right-10 duration-1000">
    <button 
      onClick={onClick} 
      className="group relative flex items-center gap-6 px-12 py-6 bg-gradient-to-r from-pink-600 via-pink-500 to-pink-600 bg-[length:200%_auto] hover:bg-right rounded-3xl font-black uppercase text-[12px] tracking-[0.25em] text-white shadow-[0_20px_50px_rgba(236,72,153,0.4)] hover:scale-105 active:scale-95 transition-all duration-700 ring-2 ring-white/10"
    >
      <div className="relative z-10 flex items-center gap-4">
        <div className="p-3 bg-white/10 rounded-2xl group-hover:bg-white/20 transition-colors">
          <Rocket size={24} className="group-hover:animate-bounce" />
        </div>
        <div className="flex flex-col items-start text-left">
          <span className="leading-tight">Execute Build</span>
          <span className="text-[8px] opacity-60 font-bold tracking-[0.1em] mt-1">GENERATE PRODUCTION APK</span>
        </div>
        <ChevronRight size={20} className="text-white/40 group-hover:translate-x-1 transition-transform" />
      </div>
      
      {/* Decorative Glow */}
      <div className="absolute inset-0 bg-pink-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
    </button>
  </div>
);
