
import React from 'react';
import { Github, Link2, Search, XCircle, Code, CheckCircle2, Loader2, ShieldCheck, Zap, AlertCircle } from 'lucide-react';
import { GithubConfig } from '../../types';

interface GithubConnectorProps {
  githubConfig: GithubConfig;
  isConnected: boolean;
  repoLoading: boolean;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filteredRepos: any[];
  onConnect: () => void;
  onDisconnect: () => void;
  onSelectRepo: (name: string) => void;
}

const GithubConnector: React.FC<GithubConnectorProps> = ({
  githubConfig, isConnected, repoLoading, searchQuery, setSearchQuery, 
  filteredRepos, onConnect, onDisconnect, onSelectRepo
}) => {
  const isBuildReady = isConnected && githubConfig.token.length > 10;

  return (
    <div className="glass-tech p-8 md:p-10 rounded-[2.5rem] border-white/5 space-y-8 shadow-xl relative overflow-hidden">
      {isConnected && (
        <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 blur-[100px] -z-10 rounded-full animate-pulse"></div>
      )}
      
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
            <Github className={isConnected ? "text-green-500" : "text-pink-500"}/> 
            GitHub <span className={isConnected ? "text-green-500" : "text-pink-500"}>Link Status</span>
          </h3>
          {isConnected && (
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck size={12} className="text-green-500"/> Verified Uplink Established
            </p>
          )}
        </div>

        {isConnected ? (
          <button onClick={onDisconnect} className="flex items-center gap-2 px-4 py-2 bg-red-500/10 rounded-2xl border border-red-500/20 hover:bg-red-500/20 transition-all group">
            <XCircle size={14} className="text-red-400 group-hover:rotate-90 transition-transform"/>
            <span className="text-[10px] font-black uppercase text-red-400">Disconnect</span>
          </button>
        ) : (
          <div className="flex items-center gap-2 px-4 py-2 bg-zinc-800 rounded-2xl border border-white/5">
            <div className="w-2 h-2 rounded-full bg-zinc-600 animate-pulse"></div>
            <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Offline</span>
          </div>
        )}
      </div>

      {!isConnected ? (
        <div className="bg-pink-600/5 border border-pink-500/10 p-12 rounded-[3rem] text-center border-dashed relative group overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="w-20 h-20 bg-pink-500/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(236,72,153,0.1)] group-hover:scale-110 transition-transform">
            <Github size={40} className="text-pink-500"/>
          </div>
          <p className="text-sm text-slate-400 font-bold mb-8 max-w-[280px] mx-auto leading-relaxed">Connect your GitHub account to enable automatic cloud builds and APK generation.</p>
          <button onClick={onConnect} className="px-12 py-5 bg-pink-600 rounded-[2rem] font-black uppercase text-[11px] shadow-2xl flex items-center gap-3 mx-auto hover:bg-pink-500 hover:shadow-pink-500/20 transition-all active:scale-95 tracking-widest">
            <Link2 size={20}/> Link Account Now
          </button>
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in duration-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="p-6 bg-white/5 rounded-3xl border border-white/5 flex items-center gap-5">
                <div className="w-14 h-14 bg-green-500/10 rounded-2xl flex items-center justify-center text-green-500 shadow-inner">
                   <ShieldCheck size={28}/>
                </div>
                <div>
                   <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Linked User</div>
                   <div className="text-lg font-black text-white">@{githubConfig.owner}</div>
                </div>
             </div>

             <div className={`p-6 rounded-3xl border flex items-center gap-5 transition-all ${isBuildReady ? 'bg-green-500/10 border-green-500/20' : 'bg-yellow-500/10 border-yellow-500/20'}`}>
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${isBuildReady ? 'bg-green-500 text-white' : 'bg-yellow-500 text-white'}`}>
                   {isBuildReady ? <Zap size={28}/> : <AlertCircle size={28}/>}
                </div>
                <div>
                   <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Build Engine</div>
                   <div className={`text-lg font-black ${isBuildReady ? 'text-green-400' : 'text-yellow-400'}`}>
                      {isBuildReady ? 'Engine Ready' : 'Setup Required'}
                   </div>
                </div>
             </div>
          </div>

          <div className="space-y-4">
             <div className="flex items-center justify-between px-2">
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Repository Workspace</h4>
                <span className="text-[9px] font-bold text-zinc-600 uppercase bg-white/5 px-2 py-1 rounded-lg">Syncing Live</span>
             </div>
             <div className="relative">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={18}/>
                <input type="text" placeholder="Filter your repositories..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-[1.5rem] py-5 pl-14 pr-6 text-sm text-white outline-none focus:border-green-500/30 transition-all placeholder:text-zinc-700 font-medium" />
             </div>
             <div className="max-h-[260px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                {repoLoading ? (
                  <div className="flex flex-col items-center py-16 text-green-500 gap-4">
                    <Loader2 className="animate-spin" size={32}/>
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Mapping Cloud Repos...</span>
                  </div>
                ) : filteredRepos.length > 0 ? filteredRepos.map((repo: any) => (
                  <div key={repo.id} onClick={() => onSelectRepo(repo.name)} className={`p-5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between group ${githubConfig.repo === repo.name ? 'bg-green-600/10 border-green-500/50 shadow-lg shadow-green-500/5' : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/[0.08]'}`}>
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl transition-all ${githubConfig.repo === repo.name ? 'bg-green-500 text-white' : 'bg-white/10 text-slate-400 group-hover:text-white'}`}><Code size={18}/></div>
                      <div className="flex flex-col">
                        <span className={`text-xs font-black uppercase tracking-wide transition-colors ${githubConfig.repo === repo.name ? 'text-green-500' : 'text-zinc-400 group-hover:text-zinc-200'}`}>{repo.name}</span>
                        <span className="text-[9px] text-zinc-600 font-bold uppercase mt-0.5">Public Repository</span>
                      </div>
                    </div>
                    {githubConfig.repo === repo.name && (
                      <div className="flex items-center gap-2 bg-green-500/20 px-3 py-1 rounded-full border border-green-500/30">
                        <span className="text-[9px] font-black text-green-500 uppercase">Active</span>
                        <CheckCircle2 size={14} className="text-green-500"/>
                      </div>
                    )}
                  </div>
                )) : (
                  <div className="py-20 text-center opacity-30">
                    <Github size={40} className="mx-auto mb-4"/>
                    <p className="text-[10px] font-black uppercase tracking-widest">No repositories found</p>
                  </div>
                )}
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GithubConnector;
