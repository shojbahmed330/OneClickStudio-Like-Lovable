
import React from 'react';
import { Loader2, RefreshCw, Smartphone } from 'lucide-react';
import { Project } from '../types';
import { buildFinalHtml } from '../utils/previewBuilder';

interface LivePreviewViewProps {
  project: Project | null;
  loading: boolean;
  onReturnToTerminal: () => void;
}

const LivePreviewView: React.FC<LivePreviewViewProps> = ({ project, loading, onReturnToTerminal }) => {
  if (loading) {
    return (
      <div className="h-[100dvh] w-full bg-[#09090b] flex flex-col items-center justify-center gap-6">
        <Loader2 className="animate-spin text-pink-500" size={40}/>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">Initializing Uplink...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="h-[100dvh] w-full bg-[#09090b] flex flex-col items-center justify-center gap-4 p-10 text-center">
        <h1 className="text-2xl font-black text-white uppercase">Project Offline</h1>
        <p className="text-zinc-600 text-xs uppercase font-bold">The developer has not authorized this uplink or it has been terminated.</p>
        <button onClick={onReturnToTerminal} className="mt-6 px-10 py-4 bg-pink-600 rounded-2xl font-black uppercase text-[10px]">Return to Terminal</button>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] w-full bg-[#09090b] flex flex-col relative">
      <div className="flex-1 w-full relative h-full">
        <iframe 
          srcDoc={buildFinalHtml(project.files)} 
          className="w-full h-full border-none"
          title="live-preview"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
        />
        <div className="fixed bottom-10 right-10 flex flex-col gap-4">
           <button onClick={() => window.location.reload()} className="p-4 bg-pink-600 text-white rounded-2xl shadow-2xl active:scale-90 transition-all">
             <RefreshCw size={20}/>
           </button>
           <button onClick={onReturnToTerminal} className="p-4 bg-white/10 backdrop-blur-xl border border-white/10 text-white rounded-2xl shadow-2xl active:scale-90 transition-all">
             <Smartphone size={20}/>
           </button>
        </div>
      </div>
    </div>
  );
};

export default LivePreviewView;
