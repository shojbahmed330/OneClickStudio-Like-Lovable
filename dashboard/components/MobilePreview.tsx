
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Sparkles, Loader2, Cpu, QrCode, X, Copy, Check, AlertCircle, Wrench, ShieldCheck, Zap, RefreshCw } from 'lucide-react';
import { AppMode, ProjectConfig, WorkspaceType } from '../../types';
import { buildFinalHtml } from '../../utils/previewBuilder';
import { useLanguage } from '../../i18n/LanguageContext';
import WorkspaceToggle from './WorkspaceToggle';
import PreviewFrame from './PreviewFrame';

interface MobilePreviewProps {
  projectFiles: Record<string, string>;
  workspace: WorkspaceType;
  setWorkspace: (w: WorkspaceType) => void;
  setMode: (m: AppMode) => void;
  handleBuildAPK: () => void;
  mobileTab: 'chat' | 'preview';
  isGenerating?: boolean;
  isRepairing?: boolean;
  repairSuccess?: boolean;
  projectConfig?: ProjectConfig;
  projectId?: string | null;
  runtimeError?: { message: string; line: number; source: string } | null;
  onAutoFix?: () => void;
}

const MobilePreview: React.FC<MobilePreviewProps> = ({ 
  projectFiles, workspace, setWorkspace, setMode, handleBuildAPK, mobileTab, isGenerating, isRepairing, repairSuccess, projectConfig, projectId,
  runtimeError, onAutoFix
}) => {
  const [showSplash, setShowSplash] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);
  const [renderVersion, setRenderVersion] = useState(0);
  const { t } = useLanguage();
  
  const intendedPath = workspace === 'app' ? 'app/index.html' : 'admin/index.html';
  const entryPath = useMemo(() => {
    const files = Object.keys(projectFiles);
    if (workspace === 'app') {
      return files.find(f => f === 'app/index.html') || 
             files.find(f => f === 'index.html') || 
             files.find(f => f === 'app/main.html') ||
             files.find(f => f.startsWith('app/') && f.endsWith('.html')) ||
             'app/index.html';
    } else {
      return files.find(f => f === 'admin/index.html') || 
             files.find(f => f === 'admin.html') || 
             files.find(f => f === 'admin/main.html') ||
             files.find(f => f.startsWith('admin/') && f.endsWith('.html')) ||
             'admin/index.html';
    }
  }, [workspace, projectFiles]);

  const finalHtml = useMemo(() => buildFinalHtml(projectFiles, entryPath, projectConfig), [projectFiles, entryPath, projectConfig]);
  
  const fileCount = Object.keys(projectFiles).length;
  const hasFiles = !!projectFiles[entryPath];
  const isInitialLoad = fileCount === 0; 

  const previewUrl = projectId ? `${window.location.origin}/preview/${projectId}?workspace=${workspace}` : null;

  useEffect(() => {
    if (!isGenerating && hasFiles) {
      setRenderVersion(v => v + 1);
    }
  }, [isGenerating, hasFiles]);

  useEffect(() => {
    if (hasFiles && !isGenerating) {
      setShowSplash(true);
      const timer = setTimeout(() => setShowSplash(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [hasFiles, isGenerating, workspace]);

  return (
    <section className={`flex-1 flex flex-col items-center ${workspace === 'admin' ? 'lg:items-stretch lg:px-6' : 'lg:items-start lg:pl-40'} lg:justify-center relative h-full transition-all duration-1000 ${mobileTab === 'chat' ? 'hidden lg:flex' : 'flex'}`}>
      
      <div className={`w-[320px] mb-8 hidden lg:block transition-all duration-700 z-40 ${workspace === 'admin' ? 'mx-auto' : ''} ${isGenerating && isInitialLoad ? 'opacity-0 pointer-events-none -translate-y-6' : 'opacity-100 translate-y-0'}`}>
        <WorkspaceToggle active={workspace} onChange={setWorkspace} />
      </div>

      <div className={`w-full h-full lg:h-auto lg:flex-1 flex flex-col ${workspace === 'admin' ? 'lg:items-stretch' : 'lg:items-start'} justify-center p-0 lg:p-4`}>
          <div className={`relative group/preview-container transition-all duration-700 hover:scale-[1.01] ${workspace === 'admin' ? 'w-full h-full' : ''}`}>
             {/* Dynamic Glow Background */}
             <div className={`absolute -inset-4 blur-[40px] opacity-0 group-hover/preview-container:opacity-20 transition-opacity duration-700 rounded-[4rem] -z-10 ${workspace === 'admin' ? 'bg-indigo-500' : 'bg-pink-500'}`}></div>
             
             <PreviewFrame workspace={workspace} appName={projectConfig?.appName}>
               <div className="w-full h-full bg-[#09090b] relative flex flex-col items-center justify-center overflow-hidden">
                 {hasFiles ? (
                   <div className="w-full h-full relative">
                     <iframe 
                       srcDoc={finalHtml} 
                       className="w-full h-full border-none bg-[#09090b]" 
                       title="preview" 
                       key={`${renderVersion}-${repairSuccess}`} 
                       sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals" 
                     />
                     
                     {isGenerating && !isInitialLoad && (
                       <div className="absolute top-4 right-4 z-[250] flex items-center gap-2 px-3 py-1.5 bg-black/60 backdrop-blur-md border border-pink-500/30 rounded-full animate-in fade-in slide-in-from-top-2">
                          <RefreshCw size={10} className="text-pink-500 animate-spin"/>
                          <span className="text-[8px] font-black uppercase text-pink-400 tracking-widest">Syncing...</span>
                       </div>
                     )}

                     {(runtimeError || isRepairing || repairSuccess) && !isGenerating && (
                       <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-[250] flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
                         {repairSuccess ? (
                           <div className="space-y-6 flex flex-col items-center animate-in zoom-in duration-500">
                             <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center border border-green-500/30 shadow-[0_0_40px_rgba(34,197,94,0.3)]">
                                <ShieldCheck size={40} className="text-green-500" />
                             </div>
                             <div>
                               <h3 className="text-lg font-black text-white uppercase mb-1">System Healthy</h3>
                               <p className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Code Repaired</p>
                             </div>
                           </div>
                         ) : isRepairing ? (
                           <div className="space-y-6 flex flex-col items-center">
                             <div className="w-20 h-20 bg-pink-500/10 rounded-full flex items-center justify-center border border-pink-500/30 relative">
                                <Zap size={32} className="text-pink-500 animate-pulse" />
                                <div className="absolute inset-0 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
                             </div>
                             <div>
                               <h3 className="text-lg font-black text-white uppercase mb-1">Healing...</h3>
                             </div>
                           </div>
                         ) : (
                           <>
                             <div className="w-16 h-16 bg-red-600/20 rounded-full flex items-center justify-center text-red-500 mb-6 border border-red-500/30"><AlertCircle size={32}/></div>
                             <h3 className="text-lg font-black text-white uppercase mb-2">Error Detected</h3>
                             <button onClick={onAutoFix} className="px-8 py-4 bg-pink-600 rounded-2xl font-black uppercase text-[10px] flex items-center gap-3 transition-all active:scale-95"><Wrench size={14}/> Fix Now</button>
                           </>
                         )}
                       </div>
                     )}
                     
                     {showSplash && (
                       <div className="absolute inset-0 bg-[#09090b] z-[200] flex flex-col items-center justify-center p-8 animate-in fade-in duration-300 fade-out slide-out-to-top-full fill-mode-forwards delay-1000">
                         <div className="relative z-10 flex flex-col items-center gap-6 text-center">
                            <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex items-center justify-center bg-black">
                               {workspace === 'admin' ? (
                                 <div className="p-4 bg-indigo-500/10 rounded-2xl text-indigo-500"><ShieldCheck size={32}/></div>
                               ) : (
                                 projectConfig?.icon ? <img src={projectConfig.icon} className="w-full h-full object-cover" /> : <Sparkles size={24} className="text-pink-500"/>
                               )}
                            </div>
                            <h1 className="text-lg font-black text-white uppercase tracking-widest">{workspace === 'admin' ? 'Admin' : (projectConfig?.appName || 'App')}</h1>
                            <div className="w-4 h-4 border-2 border-white/5 rounded-full animate-spin border-t-pink-500"></div>
                         </div>
                       </div>
                     )}
                   </div>
                 ) : (
                   <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-[#09090b] text-center space-y-8 animate-in fade-in duration-500">
                      <div className="relative">
                        <div className="absolute inset-0 bg-pink-500/10 blur-[60px] rounded-full animate-pulse"></div>
                        <Cpu size={60} className="text-zinc-800 relative z-10 animate-float" />
                      </div>
                      <div className="space-y-3">
                        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em]">Awaiting instructions...</p>
                      </div>
                   </div>
                 )}

                 {isGenerating && isInitialLoad && (
                   <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl z-[300] flex flex-col items-center justify-center text-center p-8">
                      <div className="w-16 h-16 border border-white/5 rounded-2xl flex items-center justify-center relative overflow-hidden bg-black mb-10"><Loader2 className="animate-spin text-pink-500" size={24}/></div>
                      <div className="space-y-2">
                         <h3 className="text-lg font-black text-white uppercase shimmer-text">Compiling Node</h3>
                         <p className="text-[8px] font-black uppercase text-zinc-600 tracking-[0.4em]">OneClick Cloud Build</p>
                      </div>
                      <div className="w-full max-w-[140px] h-0.5 bg-white/5 rounded-full overflow-hidden mt-10"><div className="h-full bg-pink-500 w-full animate-[loading-bar_1.5s_infinite]"></div></div>
                   </div>
                 )}
               </div>
             </PreviewFrame>
          </div>
      </div>

      <style>{`
        @keyframes loading-bar { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        .shimmer-text { background: linear-gradient(to right, #fff 20%, #ec4899 40%, #fff 60%, #fff 80%); background-size: 200% auto; background-clip: text; -webkit-background-clip: text; -webkit-text-fill-color: transparent; animation: shine 2s linear infinite; }
        @keyframes shine { to { background-position: 200% center; } }
      `}</style>
    </section>
  );
};

export default MobilePreview;
