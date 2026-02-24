
import React from 'react';
import { Sparkles, Crown, Settings, HelpCircle, User } from 'lucide-react';
import { AppMode, User as UserType } from '../types';
import LanguageSelector from './LanguageSelector.tsx';
import { useLanguage } from '../i18n/LanguageContext.tsx';

interface HeaderProps {
  user: UserType;
  path: string;
  mode: AppMode;
  navigateTo: (path: string, mode: AppMode) => void;
}

const Header: React.FC<HeaderProps> = ({ user, path, mode, navigateTo }) => {
  const { t } = useLanguage();
  
  const navItems = [
    { label: t('nav.preview'), mode: AppMode.PREVIEW, path: '/dashboard' },
    { label: t('nav.edit'), mode: AppMode.EDIT, path: '/dashboard' },
    { label: t('nav.projects'), mode: AppMode.PROJECTS, path: '/projects' },
    { label: t('nav.shop'), mode: AppMode.SHOP, path: '/shop' },
    { label: t('nav.profile'), mode: AppMode.PROFILE, path: '/profile' },
    { label: t('nav.settings'), mode: AppMode.CONFIG, path: '/dashboard' },
  ];

  return (
    <header className="h-14 md:h-16 border-b border-white/5 bg-black/60 backdrop-blur-2xl flex items-center justify-between px-4 md:px-8 z-50 shrink-0 sticky top-0 ring-1 ring-white/5">
      <div className="flex items-center gap-2 cursor-pointer group" onClick={() => navigateTo('/dashboard', AppMode.PREVIEW)}>
        <div className="relative">
          <Sparkles className="text-pink-500 group-hover:scale-110 transition-transform" size={20}/>
          <div className="absolute inset-0 bg-pink-500/30 blur-xl rounded-full animate-pulse"></div>
        </div>
        <span className="font-black text-[10px] md:text-sm uppercase tracking-[0.2em] leading-none transition-all group-hover:tracking-[0.3em]">
          <span className="text-white">OneClick</span>
          <span className="text-pink-500 ml-1">Studio</span>
        </span>
      </div>
      
      {/* Desktop Nav */}
      <nav className="hidden lg:flex bg-black/40 rounded-2xl p-1 items-center gap-1 border border-white/5 shadow-2xl overflow-x-auto no-scrollbar">
        {navItems.map((m) => {
          const isActive = (path === m.path && mode === m.mode);
          return (
            <button 
              key={m.label} 
              onClick={() => navigateTo(m.path, m.mode)} 
              className={`px-5 py-2 text-[9px] font-black uppercase rounded-xl transition-all duration-500 whitespace-nowrap relative group/nav ${isActive ? 'bg-pink-600 text-white shadow-[0_5px_15px_rgba(236,72,153,0.3)]' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
            >
              {m.label}
              {!isActive && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-pink-500 group-hover/nav:w-4 transition-all"></div>}
            </button>
          );
        })}
        {user.isAdmin && (
          <button 
            onClick={() => navigateTo('/admin', AppMode.ADMIN)} 
            className={`px-5 py-2 text-[9px] font-black uppercase rounded-xl transition-all flex items-center gap-2 border-l border-white/10 ml-2 whitespace-nowrap ${path === '/admin' ? 'bg-pink-600 text-white shadow-[0_5px_15px_rgba(236,72,153,0.3)]' : 'text-pink-500 hover:bg-pink-500/5'}`}
          >
            <Crown size={12}/> 
            {t('nav.admin')}
          </button>
        )}
      </nav>
      
      <div className="flex items-center gap-2 md:gap-6">
        <div className="hidden sm:block">
          <LanguageSelector />
        </div>
        <div className="flex items-center gap-2 bg-pink-600/10 border border-pink-500/20 rounded-full px-3 py-1.5 md:px-5 md:py-2 shadow-inner group cursor-help" title="Neural Credits">
          <div className="w-1.5 h-1.5 rounded-full bg-pink-500 shadow-[0_0_10px_#ec4899] group-hover:animate-ping"></div>
          <span className="text-[10px] md:text-[11px] font-black text-pink-500 uppercase tracking-widest">{user.tokens}</span>
        </div>
        <button 
          onClick={() => navigateTo('/profile', AppMode.PROFILE)}
          className="lg:w-10 lg:h-10 w-8 h-8 rounded-2xl border border-white/10 overflow-hidden bg-zinc-900 hover:border-pink-500/50 transition-all active:scale-95 shadow-xl"
        >
          <img src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} className="w-full h-full object-cover" alt="Profile"/>
        </button>
      </div>
    </header>
  );
};

export default Header;
