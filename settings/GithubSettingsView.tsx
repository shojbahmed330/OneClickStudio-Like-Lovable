
import React, { useState } from 'react';
import { Github, Key, User, Folder, Save, ArrowLeft, ShieldCheck, Zap, Info, AlertCircle, XCircle } from 'lucide-react';
import { GithubConfig } from '../types';
import { DatabaseService } from '../services/dbService';

interface GithubSettingsViewProps {
  config: GithubConfig;
  onSave: (config: GithubConfig) => void;
  onBack: () => void;
  onDisconnect: () => void;
}

const GithubSettingsView: React.FC<GithubSettingsViewProps> = ({ config, onSave, onBack, onDisconnect }) => {
  const [localConfig, setLocalConfig] = useState<GithubConfig>({ ...config });
  const [isSaving, setIsSaving] = useState(false);
  const [linkingError, setLinkingError] = useState(false);
  const db = DatabaseService.getInstance();

  const handleOAuthConnect = async () => {
    try {
      setLinkingError(false);
      await db.linkGithubIdentity();
    } catch (e: any) {
      if (e.message.includes('Manual linking')) {
        setLinkingError(true);
      } else {
        alert(e.message);
      }
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(localConfig);
      setTimeout(() => {
        setIsSaving(false);
        onBack();
      }, 800);
    } catch (e) {
      setIsSaving(false);
    }
  };

  const isConnected = !!(config.token && config.owner);

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-12 bg-black animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="max-w-2xl mx-auto space-y-10 pb-20">
        
        {/* Header */}
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="p-4 bg-white/5 hover:bg-white/10 rounded-3xl text-zinc-400 transition-all active:scale-95">
            <ArrowLeft size={24}/>
          </button>
          <div>
            <h2 className="text-3xl font-black text-white uppercase tracking-tight">Build <span className="text-pink-600">Engine</span></h2>
            <p className="text-[10px] font-black uppercase text-zinc-600 tracking-[0.4em] mt-1">Managed Cloud Infrastructure</p>
          </div>
        </div>

        {/* Managed Connection Card */}
        <div className="glass-tech p-10 rounded-[3rem] border-pink-500/20 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/5 blur-[100px] -z-10 rounded-full animate-pulse"></div>
          
          <div className="text-center space-y-6">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 border-2 transition-all ${isConnected ? 'bg-green-500/10 border-green-500/50 text-green-500' : 'bg-pink-500/10 border-pink-500/50 text-pink-500'}`}>
              <Github size={48} className={isConnected ? "animate-pulse" : ""}/>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-white uppercase">
                {isConnected ? 'Neural Link Established' : 'Neural Link Required'}
              </h3>
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">
                {isConnected ? `Uplink Active: @${config.owner}` : 'Connect GitHub to enable automated builds'}
              </p>
            </div>

            {linkingError && (
              <div className="p-6 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center gap-4 text-left animate-in slide-in-from-top-4">
                <AlertCircle size={20} className="text-amber-500 shrink-0"/>
                <div className="text-[10px] font-bold text-amber-500 uppercase leading-relaxed">
                  আপনার সুপাবেজ প্রজেক্টে "Manual Linking" অপশনটি বন্ধ করা আছে। দয়া করে নিচের বক্সে ম্যানুয়ালি টোকেন বসান।
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <button 
                onClick={handleOAuthConnect}
                className={`w-full py-5 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl ${isConnected ? 'bg-white/5 border border-white/10 text-white hover:bg-white/10' : 'bg-pink-600 text-white hover:bg-pink-500 shadow-pink-600/20'}`}
              >
                <Zap size={18}/> {isConnected ? 'Refresh Access Link' : 'Connect with GitHub'}
              </button>

              {isConnected && (
                <button 
                  onClick={onDisconnect}
                  className="w-full py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] text-red-500 hover:bg-red-500/10 transition-all flex items-center justify-center gap-2"
                >
                  <XCircle size={14}/> Terminate Connection
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Advanced/Manual Sync */}
        <div className="glass-tech p-8 md:p-10 rounded-[3rem] border-white/5 space-y-8">
          <div className="flex items-center gap-3">
             <Key className="text-pink-500" size={16}/>
             <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Manual Token Entry (Recommended)</h4>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-pink-500/5 border border-pink-500/10 rounded-2xl">
              <p className="text-[9px] font-black text-pink-500 uppercase leading-relaxed">
                ১. GitHub &rarr; Settings &rarr; Developer Settings &rarr; Personal Access Tokens (Classic) এ যান।<br/>
                ২. "repo" এবং "workflow" পারমিশন দিয়ে টোকেন তৈরি করুন।<br/>
                ৩. সেই টোকেনটি নিচের বক্সে পেস্ট করে সেভ করুন।
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-zinc-600 ml-4 tracking-widest flex items-center gap-2">
                <Key size={12}/> GitHub Classic Token
              </label>
              <input 
                type="password"
                value={localConfig.token} 
                onChange={e => setLocalConfig({...localConfig, token: e.target.value})}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxx" 
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm text-pink-400 font-mono focus:border-pink-500/40 outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-zinc-600 ml-4 tracking-widest flex items-center gap-2">
                <User size={12}/> Owner Username
              </label>
              <input 
                value={localConfig.owner} 
                onChange={e => setLocalConfig({...localConfig, owner: e.target.value})}
                placeholder="Your GitHub Username" 
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm text-white focus:border-pink-500/40 outline-none transition-all placeholder:text-zinc-800"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-zinc-600 ml-4 tracking-widest flex items-center gap-2">
                <Folder size={12}/> Active Repo Name
              </label>
              <input 
                value={localConfig.repo} 
                onChange={e => setLocalConfig({...localConfig, repo: e.target.value})}
                placeholder="Managed Repository" 
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm text-white focus:border-pink-500/40 outline-none transition-all placeholder:text-zinc-800"
              />
            </div>
          </div>

          <button 
            onClick={handleSave} 
            disabled={isSaving}
            className="w-full py-5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-2xl font-black uppercase text-[10px] tracking-widest text-zinc-500 hover:text-white transition-all flex items-center justify-center gap-3"
          >
            {isSaving ? 'Updating...' : <><Save size={18}/> Save Workspace Changes</>}
          </button>
        </div>

      </div>
    </div>
  );
};

export default GithubSettingsView;
