
import React from 'react';
import { LayoutDashboard, Code2, FolderKanban, ShoppingCart, User as UserIcon, Settings, Layers } from 'lucide-react';
import { AppMode, User } from '../types';

interface MobileNavProps {
  path: string;
  mode: AppMode;
  user?: User;
  navigateTo: (path: string, mode: AppMode) => void;
}

const MobileNav: React.FC<MobileNavProps> = ({ path, mode, user, navigateTo }) => {
  return (
    <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-[500] pointer-events-none w-full max-w-[400px] px-4">
      <div className="bg-black/60 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] flex items-center justify-around p-2 pointer-events-auto shadow-[0_20px_50px_rgba(0,0,0,0.5)] ring-1 ring-white/5">
        <button 
          onClick={() => navigateTo('/dashboard', AppMode.PREVIEW)} 
          className={`relative p-3 transition-all rounded-full ${path === '/dashboard' && mode === AppMode.PREVIEW ? 'text-white' : 'text-zinc-600'}`}
        >
          {path === '/dashboard' && mode === AppMode.PREVIEW && <div className="absolute inset-0 bg-pink-600 rounded-full blur-md opacity-40"></div>}
          <LayoutDashboard size={20} className="relative z-10"/>
        </button>
        
        <button 
          onClick={() => navigateTo('/dashboard', AppMode.EDIT)} 
          className={`relative p-3 transition-all rounded-full ${path === '/dashboard' && mode === AppMode.EDIT ? 'text-white' : 'text-zinc-600'}`}
        >
          {path === '/dashboard' && mode === AppMode.EDIT && <div className="absolute inset-0 bg-pink-600 rounded-full blur-md opacity-40"></div>}
          <Code2 size={20} className="relative z-10"/>
        </button>

        <button 
          onClick={() => navigateTo('/projects', AppMode.PROJECTS)} 
          className={`relative p-3 transition-all rounded-full ${path === '/projects' ? 'text-white' : 'text-zinc-600'}`}
        >
          {path === '/projects' && <div className="absolute inset-0 bg-pink-600 rounded-full blur-md opacity-40"></div>}
          <FolderKanban size={20} className="relative z-10"/>
        </button>

        <button 
          onClick={() => navigateTo('/shop', AppMode.SHOP)} 
          className={`relative p-3 transition-all rounded-full ${path === '/shop' ? 'text-white' : 'text-zinc-600'}`}
        >
          {path === '/shop' && <div className="absolute inset-0 bg-pink-600 rounded-full blur-md opacity-40"></div>}
          <ShoppingCart size={20} className="relative z-10"/>
        </button>

        <button 
          onClick={() => navigateTo('/dashboard', AppMode.CONFIG)} 
          className={`relative p-3 transition-all rounded-full ${path === '/dashboard' && mode === AppMode.CONFIG ? 'text-white' : 'text-zinc-600'}`}
        >
          {path === '/dashboard' && mode === AppMode.CONFIG && <div className="absolute inset-0 bg-pink-600 rounded-full blur-md opacity-40"></div>}
          <Settings size={20} className="relative z-10"/>
        </button>

        <button 
          onClick={() => navigateTo('/profile', AppMode.PROFILE)} 
          className={`relative p-3 transition-all rounded-full ${path === '/profile' ? 'text-white' : 'text-zinc-600'}`}
        >
          {path === '/profile' && <div className="absolute inset-0 bg-pink-600 rounded-full blur-md opacity-40"></div>}
          <UserIcon size={20} className="relative z-10"/>
        </button>
      </div>
    </div>
  );
};

export default MobileNav;
