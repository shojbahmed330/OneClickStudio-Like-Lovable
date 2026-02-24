
import React, { useRef, useState, useEffect } from 'react';
import { ArrowLeft, Box, Image as ImageIcon, Smartphone, Save, Globe, ShieldAlert, Database, Key as KeyIcon, Zap, ShieldCheck, Lock, Eye, EyeOff, FileKey, AlertTriangle, BookOpen, Terminal, Copy, Check, Wand2, Download, Cpu, TerminalSquare, HelpCircle } from 'lucide-react';
import { ProjectConfig } from '../../types';
import { KeystoreService } from '../../services/keystoreService';

interface AppConfigViewProps {
  config: ProjectConfig;
  onUpdate: (config: ProjectConfig) => void;
  onBack: () => void;
}

const AppConfigView: React.FC<AppConfigViewProps> = ({ config, onUpdate, onBack }) => {
  const iconInputRef = useRef<HTMLInputElement>(null);
  const splashInputRef = useRef<HTMLInputElement>(null);
  const keystoreInputRef = useRef<HTMLInputElement>(null);
  const [showPasswords, setShowPasswords] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showTroubleshoot, setShowTroubleshoot] = useState(false);

  useEffect(() => {
    if (!config.key_alias && config.appName) {
       onUpdate({ ...config, key_alias: KeystoreService.generateCleanAlias(config.appName) });
    }
  }, [config.appName]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'icon' | 'splash' | 'keystore_base64') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => onUpdate({ ...config, [type]: reader.result as string });
    reader.readAsDataURL(file);
  };

  const sanitizePackageName = (val: string) => val.toLowerCase().replace(/\s+/g, '').replace(/-/g, '_').replace(/[^a-z0-9._]/g, '');
  const isSigned = !!config.keystore_base64;

  const handleInstantGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      const newKeys = KeystoreService.generateInstantKeystore(config.appName || 'My_App');
      onUpdate({ ...config, ...newKeys });
      setGenerating(false);
    }, 1500);
  };

  const aiModels = [
    { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash (Cloud)' },
    { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro (Cloud)' },
    { id: 'qwen3-coder:480b-cloud', name: 'Qwen3 Coder 480B (Local)' },
    { id: 'codellama:7b-instruct-q4_0', name: 'CodeLlama 7B (Local)' },
    { id: 'llama3-local', name: 'Llama 3 (Local)' }
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-12 bg-black animate-in fade-in slide-in-from-bottom-4 duration-700 pb-32 md:pb-12">
      <div className="max-w-4xl mx-auto space-y-10">
        
        <div className="flex items-center justify-between border-b border-white/5 pb-8">
          <div className="flex items-center gap-6">
            <button onClick={onBack} className="p-4 bg-white/5 hover:bg-white/10 rounded-3xl text-zinc-400 transition-all active:scale-95">
              <ArrowLeft size={24}/>
            </button>
            <div>
              <h2 className="text-3xl font-black text-white uppercase tracking-tight">Project <span className="text-pink-600">Config</span></h2>
              <p className="text-[10px] font-black uppercase text-zinc-600 tracking-[0.4em] mt-1">Native Assets & Deployment Keys</p>
            </div>
          </div>
          <button onClick={onBack} className="px-8 py-4 bg-pink-600 rounded-3xl font-black uppercase text-[10px] tracking-widest text-white shadow-xl shadow-pink-600/20 active:scale-95 transition-all">
            Apply Changes
          </button>
        </div>

        {/* AI MODEL SELECTOR */}
        <div className="glass-tech p-8 rounded-[3rem] border-pink-500/20 bg-gradient-to-br from-pink-600/5 to-transparent space-y-6">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-pink-500/10 text-pink-500 rounded-2xl"><Cpu size={24}/></div>
                <div>
                   <h3 className="text-xl font-black uppercase tracking-tight text-white">AI Neural Engine</h3>
                   <p className="text-[10px] font-black uppercase text-pink-500 tracking-[0.3em]">Select target intelligence core</p>
                </div>
              </div>
              <button 
                onClick={() => setShowTroubleshoot(!showTroubleshoot)}
                className="p-3 bg-white/5 rounded-2xl text-zinc-500 hover:text-white transition-all flex items-center gap-2"
              >
                <HelpCircle size={18}/>
                <span className="text-[9px] font-black uppercase tracking-widest hidden sm:inline">Troubleshoot Local</span>
              </button>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {aiModels.map(model => (
                <button 
                  key={model.id}
                  onClick={() => onUpdate({ ...config, selected_model: model.id })}
                  className={`p-5 rounded-2xl border text-left transition-all relative overflow-hidden group ${config.selected_model === model.id ? 'bg-pink-600 border-pink-500 text-white shadow-lg' : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10'}`}
                >
                  <div className="text-xs font-black uppercase tracking-widest relative z-10">{model.name}</div>
                  {(model.id.includes('local') || model.id.includes('qwen') || model.id.includes('cloud')) && !model.id.startsWith('gemini') && <div className="text-[8px] mt-1 opacity-60 font-bold relative z-10">OLLAMA HOST</div>}
                  {config.selected_model === model.id && (
                     <div className="absolute -right-2 -bottom-2 opacity-20 transform rotate-12">
                        <Check size={48}/>
                     </div>
                  )}
                </button>
              ))}
           </div>

           {showTroubleshoot && (
              <div className="p-8 bg-blue-500/5 border border-blue-500/20 rounded-[2.5rem] space-y-6 animate-in slide-in-from-top-4">
                 <div className="flex items-center gap-3">
                    <ShieldAlert size={20} className="text-blue-400"/>
                    <span className="text-xs font-black text-white uppercase tracking-widest">লোকাল কানেকশন সমস্যার সমাধান:</span>
                 </div>
                 <div className="space-y-4 text-[11px] font-bold text-zinc-400 leading-loose uppercase">
                    <div className="flex gap-4">
                       <div className="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">১</div>
                       <p>ব্রাউজারের অ্যাড্রেস বারের বাঁদিকের 🔒 আইকনে ক্লিক করুন &rarr; Site Settings &rarr; <span className="text-white">Insecure Content / Mixed Content</span> অপশনটি 'Allow' করে দিন।</p>
                    </div>
                    <div className="flex gap-4">
                       <div className="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">২</div>
                       <p>আপনার ওলামা সার্ভারে এই মডেলটি সচল আছে কিনা নিশ্চিত করুন।</p>
                    </div>
                    <div className="flex gap-4">
                       <div className="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">৩</div>
                       <p>Ollama বন্ধ করে CMD-তে <code className="text-blue-400">set OLLAMA_ORIGINS=*</code> লিখে তারপর আবার Ollama চালু করুন (এটি CORS সমস্যা সমাধান করে)।</p>
                    </div>
                 </div>
              </div>
           )}

           {config.selected_model && (config.selected_model.includes('local') || config.selected_model.includes('qwen')) && !showTroubleshoot && (
              <div className="p-6 bg-amber-500/5 border border-amber-500/20 rounded-[2rem] space-y-4">
                 <div className="flex items-center gap-3">
                    <TerminalSquare size={18} className="text-amber-500"/>
                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Local Engine Active</span>
                 </div>
                 <div className="space-y-3">
                    <p className="text-[9px] text-zinc-500 font-bold uppercase">পিসির Ollama সার্ভারে নিচের মডেলটি সচল থাকতে হবে:</p>
                    <div className="bg-black/40 p-4 rounded-xl font-mono text-xs text-amber-400 border border-white/5 flex items-center justify-between">
                       <code>{config.selected_model}</code>
                       <button onClick={() => navigator.clipboard.writeText(config.selected_model || '')} className="p-2 hover:bg-white/5 rounded-lg transition-all"><Copy size={14}/></button>
                    </div>
                 </div>
              </div>
           )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="glass-tech p-8 rounded-[3rem] border-white/5 space-y-8 flex flex-col">
             <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-2xl"><Globe size={20}/></div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-white">Native Identity</h3>
                </div>
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-zinc-600 ml-4 tracking-widest">App Display Name</label>
                    <input value={config.appName} onChange={e => onUpdate({...config, appName: e.target.value})} placeholder="e.g. My Awesome App" className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm text-white focus:border-pink-500/40 outline-none transition-all"/>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-zinc-600 ml-4 tracking-widest">Package Identifier</label>
                    <input value={config.packageName} onChange={e => onUpdate({...config, packageName: sanitizePackageName(e.target.value)})} placeholder="com.company.project" className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm font-mono text-pink-400 focus:border-pink-500/40 outline-none transition-all"/>
                  </div>
                </div>
             </div>
          </div>

          <div className="glass-tech p-8 rounded-[3rem] border-white/5 space-y-8 flex flex-col">
             <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-2xl"><Database size={20}/></div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-white">Database Bridge</h3>
                </div>
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-zinc-600 ml-4 tracking-widest">Supabase URL</label>
                    <input value={config.supabase_url || ''} onChange={e => onUpdate({...config, supabase_url: e.target.value.trim()})} placeholder="https://xyz.supabase.co" className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm font-mono text-zinc-300 focus:border-cyan-500/40 outline-none transition-all"/>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-zinc-600 ml-4 tracking-widest">Anon Key</label>
                    <input type="password" value={config.supabase_key || ''} onChange={e => onUpdate({...config, supabase_key: e.target.value.trim()})} placeholder="eyJhbGciOiJIUzI..." className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm font-mono text-zinc-300 focus:border-cyan-500/40 outline-none transition-all"/>
                  </div>
                </div>
             </div>
          </div>
        </div>

        <div className="md:col-span-2 glass-tech p-10 rounded-[4rem] border-amber-500/10 bg-gradient-to-br from-amber-600/5 to-transparent relative overflow-hidden group">
           <div className="flex flex-col md:flex-row items-start gap-10">
              <div className="space-y-6 flex-1">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl shadow-inner"><FileKey size={24}/></div>
                      <div>
                         <h3 className="text-xl font-black uppercase tracking-tight text-white">Production App Signing</h3>
                         <p className="text-[10px] font-black uppercase text-amber-500 tracking-[0.3em]">Google Play Store Readiness</p>
                      </div>
                    </div>
                    <button onClick={handleInstantGenerate} disabled={generating} className="flex items-center gap-2 px-4 py-2 bg-pink-600 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all">
                      <Wand2 size={14} className={generating ? 'animate-spin' : ''}/> {generating ? 'Generating...' : 'Instant Generate'}
                    </button>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <input type={showPasswords ? 'text' : 'password'} value={config.keystore_password || ''} onChange={e => onUpdate({...config, keystore_password: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm text-white" placeholder="Store Password"/>
                    <input value={config.key_alias || ''} onChange={e => onUpdate({...config, key_alias: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm text-amber-500 font-bold" placeholder="Key Alias"/>
                    <input type={showPasswords ? 'text' : 'password'} value={config.key_password || ''} onChange={e => onUpdate({...config, key_password: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm text-white" placeholder="Key Password"/>
                    <div className="flex items-center gap-4">
                       <button onClick={() => setShowPasswords(!showPasswords)} className="text-[10px] font-black uppercase text-zinc-500">{showPasswords ? 'Hide' : 'Show'} Passwords</button>
                    </div>
                 </div>
              </div>
              <div onClick={() => keystoreInputRef.current?.click()} className={`w-full md:w-64 aspect-square rounded-[3rem] border-4 border-dashed transition-all flex flex-col items-center justify-center cursor-pointer ${isSigned ? 'bg-amber-500/10 border-amber-500/40 text-amber-500' : 'bg-black border-white/5 text-zinc-700 hover:border-amber-500/20'}`}>
                 <input type="file" ref={keystoreInputRef} className="hidden" onChange={e => handleImageUpload(e, 'keystore_base64')} />
                 {isSigned ? <ShieldCheck size={48}/> : <FileKey size={48}/>}
                 <span className="text-[10px] font-black uppercase mt-4 tracking-widest">{isSigned ? 'Signed & Ready' : 'Upload .JKS'}</span>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="glass-tech p-8 rounded-[3rem] border-white/5 flex items-center justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-4"><div className="p-3 bg-pink-500/10 text-pink-500 rounded-2xl"><Box size={20}/></div><h3 className="text-sm font-black uppercase tracking-widest text-white">App Icon</h3></div>
              <input type="file" ref={iconInputRef} className="hidden" accept="image/*" onChange={e => handleImageUpload(e, 'icon')} />
              <button onClick={() => iconInputRef.current?.click()} className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-pink-600 transition-all">Upload PNG</button>
            </div>
            <div className="w-24 h-24 bg-black border-4 border-white/10 rounded-3xl overflow-hidden shadow-2xl relative">
              {config.icon ? <img src={config.icon} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-zinc-800"><ImageIcon size={30}/></div>}
            </div>
          </div>

          <div className="glass-tech p-8 rounded-[3rem] border-white/5 flex items-center justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-4"><div className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl"><Smartphone size={20}/></div><h3 className="text-sm font-black uppercase tracking-widest text-white">Splash Screen</h3></div>
              <input type="file" ref={splashInputRef} className="hidden" accept="image/*" onChange={e => handleImageUpload(e, 'splash')} />
              <button onClick={() => splashInputRef.current?.click()} className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-amber-600 transition-all">Upload PNG</button>
            </div>
            <div className="w-20 h-32 bg-black border-4 border-white/10 rounded-2xl overflow-hidden shadow-2xl relative">
              {config.splash ? <img src={config.splash} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-zinc-800"><ImageIcon size={24}/></div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppConfigView;
