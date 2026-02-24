
import React from 'react';
import { LogOut, Settings, Github, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { User as UserType, Transaction, GithubConfig, AppMode } from '../types.ts';
import { useLanguage } from '../i18n/LanguageContext.tsx';

// Component Imports
import ProfileHeader from './components/ProfileHeader.tsx';
import ProfileStats from './components/ProfileStats.tsx';
import TransactionHistory from './components/TransactionHistory.tsx';
import SecuritySettings from './components/SecuritySettings.tsx';

interface ProfileViewProps {
  user: UserType;
  userTransactions: Transaction[];
  oldPassword: string;
  setOldPassword: (p: string) => void;
  newPass: string;
  setNewPass: (p: string) => void;
  passError: string;
  isUpdatingPass: boolean;
  handlePasswordChange: () => void;
  handleLogout: () => void;
  handleAvatarUpload: () => void;
  githubConfig: GithubConfig;
  onSaveGithubConfig: (config: GithubConfig) => void;
  clearGithubConfig: () => void;
  navigateTo: (path: string, mode: AppMode) => void;
}

const ProfileView: React.FC<ProfileViewProps> = (props) => {
  const { t } = useLanguage();
  const isConnected = !!(props.githubConfig.token && props.githubConfig.owner);

  return (
    <div className="flex-1 p-6 md:p-10 overflow-y-auto scroll-smooth">
       <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 pb-20">
          
          {/* Header */}
          <ProfileHeader user={props.user} onAvatarUpload={props.handleAvatarUpload} />
          
          {/* GitHub Status Summary Card */}
          <div className="glass-tech p-6 md:p-8 rounded-[2.5rem] border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden group">
             {isConnected && (
                <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 blur-[60px] -z-10 rounded-full animate-pulse"></div>
             )}
             
             <div className="flex items-center gap-6">
                <div className={`p-5 rounded-3xl border transition-all ${isConnected ? 'bg-green-500/10 border-green-500/30 text-green-500 shadow-[0_0_20px_rgba(34,197,94,0.1)]' : 'bg-pink-500/10 border-pink-500/30 text-pink-500'}`}>
                   <Github size={32} className={isConnected ? "animate-pulse" : ""}/>
                </div>
                <div>
                   <h3 className="text-xl font-black text-white uppercase tracking-tight">{t('profile.github_infra')}</h3>
                   <div className="flex items-center gap-2 mt-1">
                      {isConnected ? (
                         <>
                            <CheckCircle2 size={12} className="text-green-500"/>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-green-500">{t('profile.connected')} @{props.githubConfig.owner}</span>
                         </>
                      ) : (
                         <>
                            <XCircle size={12} className="text-pink-500"/>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-pink-500/60">{t('profile.offline')}</span>
                         </>
                      )}
                   </div>
                </div>
             </div>

             <button 
                onClick={() => props.navigateTo('/dashboard', AppMode.SETTINGS)}
                className="px-8 py-4 bg-white/5 border border-white/10 hover:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-all flex items-center gap-3 active:scale-95"
             >
                <Settings size={14}/> {isConnected ? t('profile.manage_uplink') : t('profile.setup_link')} <ArrowRight size={14}/>
             </button>
          </div>

          {/* Stats, History & Security */}
          <ProfileStats user={props.user} />
          <TransactionHistory transactions={props.userTransactions} />
          
          <SecuritySettings 
            oldPassword={props.oldPassword} setOldPassword={props.setOldPassword}
            newPass={props.newPass} setNewPass={props.setNewPass}
            passError={props.passError} isUpdating={props.isUpdatingPass}
            onUpdate={props.handlePasswordChange}
          />

          <button onClick={props.handleLogout} className="w-full py-6 bg-red-600/10 border border-red-600/20 text-red-500 rounded-[2rem] font-black uppercase text-xs flex items-center justify-center gap-3 hover:bg-red-600 hover:text-white transition-all shadow-xl shadow-red-600/5">
             <LogOut size={20}/> {t('common.logout')}
          </button>
       </div>
    </div>
  );
};

export default ProfileView;
