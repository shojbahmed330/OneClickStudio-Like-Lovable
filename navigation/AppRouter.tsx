
import React from 'react';
import { AppMode, Project, User } from '../types';
import LandingPage from '../landing/LandingPage';
import ScanPage from '../biometric/ScanPage';
import AuthPage from '../auth/AuthPage';
import AdminLoginPage from '../auth/AdminLoginPage';
import AdminPanel from '../admin/AdminPanel';
import ShopView from '../shop/ShopView';
import ProfileView from '../profile/ProfileView';
import DashboardView from '../dashboard/DashboardView';
import ProjectsView from '../projects/ProjectsView';
import GithubSettingsView from '../settings/GithubSettingsView';
import LivePreviewView from '../preview/LivePreviewView';
import HelpCenterView from '../help/HelpCenterView';
import AuthenticatedLayout from '../layout/AuthenticatedLayout';
import { DatabaseService } from '../services/dbService';

interface AppRouterProps {
  path: string;
  mode: AppMode;
  setMode: (m: AppMode) => void;
  user: User | null;
  setUser: (u: User | null) => void;
  showScan: boolean;
  setShowScan: (b: boolean) => void;
  handleLogout: () => void;
  logic: any;
  payment: any;
  liveProject: Project | null;
  liveLoading: boolean;
  navigateTo: (path: string, mode?: AppMode) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

const AppRouter: React.FC<AppRouterProps> = ({
  path, mode, setMode, user, setUser, showScan, setShowScan, handleLogout,
  logic, payment, liveProject, liveLoading, navigateTo, fileInputRef
}) => {
  const db = DatabaseService.getInstance();

  // 1. Live Preview Route
  if (path.startsWith('/preview/')) {
    return (
      <LivePreviewView 
        project={liveProject} 
        loading={liveLoading} 
        onReturnToTerminal={() => navigateTo('/login')} 
      />
    );
  }

  // 2. Admin Route
  if (path === '/admin') {
    if (!user || !user.isAdmin) {
      return <AdminLoginPage onLoginSuccess={(u) => { setUser(u); navigateTo('/admin', AppMode.ADMIN); }} />;
    }
    return (
      <AuthenticatedLayout user={user} path={path} mode={mode} navigateTo={navigateTo}>
        <AdminPanel 
          user={user} 
          onApprovePayment={payment.handleApprovePayment} 
          onRejectPayment={payment.handleRejectPayment} 
        />
      </AuthenticatedLayout>
    );
  }

  // 3. Unauthenticated Routes
  if (!user) {
    if (path === '/login') {
      return showScan ? (
        <ScanPage onFinish={() => setShowScan(false)} />
      ) : (
        <AuthPage onLoginSuccess={(u) => { setUser(u); navigateTo('/dashboard', AppMode.PREVIEW); }} />
      );
    }
    return <LandingPage onGetStarted={() => navigateTo('/login')} />;
  }

  // 4. Authenticated Application Shell
  return (
    <AuthenticatedLayout user={user} path={path} mode={mode} navigateTo={navigateTo}>
      {mode === AppMode.HELP ? (
        <HelpCenterView onBack={() => setMode(AppMode.PREVIEW)} />
      ) : mode === AppMode.SETTINGS ? (
        <GithubSettingsView 
          config={logic.githubConfig} 
          onSave={(c) => { logic.setGithubConfig(c); db.updateGithubConfig(user.id, c); }} 
          onBack={() => setMode(AppMode.PREVIEW)} 
          onDisconnect={async () => {
            if (window.confirm("গিটহাব ডিসকানেক্ট করতে চান?")) {
              await db.unlinkGithubIdentity();
              const empty = { token: '', owner: '', repo: '' };
              logic.setGithubConfig(empty);
              db.updateGithubConfig(user.id, empty);
            }
          }} 
        />
      ) : path === '/shop' ? (
        <ShopView {...payment} handlePaymentScreenshotUpload={() => fileInputRef.current?.click()} />
      ) : path === '/profile' ? (
        <ProfileView 
          user={user} userTransactions={payment.userTransactions} githubConfig={logic.githubConfig} 
          navigateTo={navigateTo} handleLogout={handleLogout}
          oldPassword={""} setOldPassword={() => {}} newPass={""} setNewPass={() => {}} passError={""} 
          isUpdatingPass={false} handlePasswordChange={() => {}} handleAvatarUpload={() => {}}
          onSaveGithubConfig={(c) => { logic.setGithubConfig(c); db.updateGithubConfig(user.id, c); }}
          clearGithubConfig={() => {}}
        />
      ) : path === '/projects' ? (
        <ProjectsView 
          userId={user.id} 
          currentFiles={logic.projectFiles} 
          onLoadProject={(p) => { logic.loadProject(p); navigateTo('/dashboard', AppMode.PREVIEW); }} 
          onSaveCurrent={(n) => db.saveProject(user.id, n, logic.projectFiles, logic.projectConfig)} 
          onCreateNew={(n) => db.saveProject(user.id, n, { 'index.html': '<h1>' + n + '</h1>' }, { appName: n, packageName: 'com.' + n.toLowerCase() })} 
        />
      ) : (
        <DashboardView 
          {...logic} mode={mode} setMode={setMode} 
          handleBuildAPK={() => { 
            logic.handleBuildAPK(() => navigateTo('/dashboard', AppMode.SETTINGS)); 
            if (logic.githubConfig.token.length > 10) setMode(AppMode.EDIT); 
          }} 
          projectId={logic.currentProjectId}
        />
      )}
    </AuthenticatedLayout>
  );
};

export default AppRouter;
