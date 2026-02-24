
import React from 'react';
import Header from './Header';
import MobileNav from './MobileNav';
import { User, AppMode } from '../types';

interface AuthenticatedLayoutProps {
  user: User;
  path: string;
  mode: AppMode;
  navigateTo: (path: string, mode: AppMode) => void;
  children: React.ReactNode;
}

const AuthenticatedLayout: React.FC<AuthenticatedLayoutProps> = ({ 
  user, path, mode, navigateTo, children 
}) => {
  return (
    <div className="h-[100dvh] flex flex-col text-slate-100 overflow-hidden">
      <Header user={user} path={path} mode={mode} navigateTo={navigateTo} />
      <main className="flex-1 flex overflow-hidden relative">
        {children}
      </main>
      <MobileNav path={path} mode={mode} user={user} navigateTo={navigateTo} />
    </div>
  );
};

export default AuthenticatedLayout;
