
import React, { useRef } from 'react';
import { LanguageProvider } from './i18n/LanguageContext.tsx';

// Hook Imports
import { useAppAuth } from './hooks/useAppAuth.ts';
import { useAppLogic } from './hooks/useAppLogic.ts';
import { usePaymentLogic } from './hooks/usePaymentLogic.ts';
import { useNavigation } from './hooks/useNavigation.ts';
import { useOnboarding } from './hooks/useOnboarding.ts';
import { useLiveProject } from './hooks/useLiveProject.ts';

// Navigation & Layout Imports
import AppRouter from './navigation/AppRouter.tsx';
import OnboardingOverlay from './onboarding/OnboardingOverlay.tsx';
import Toast from './dashboard/components/Toast.tsx';

const AppContent: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { path, mode, setMode, navigateTo } = useNavigation();
  const { user, setUser, authLoading, showScan, setShowScan, handleLogout } = useAppAuth(navigateTo);
  const { showOnboarding, handleOnboardingComplete } = useOnboarding(user);
  const { liveProject, liveLoading } = useLiveProject(path);
  
  const logic = useAppLogic(user, setUser);
  const payment = usePaymentLogic(user);

  if (authLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#09090b]">
        <div className="w-12 h-12 border-4 border-pink-500/20 border-t-pink-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      {showOnboarding && <OnboardingOverlay onComplete={handleOnboardingComplete} />}
      
      {/* Global Toast Container */}
      <div className="fixed top-24 right-6 z-[2000] flex flex-col gap-3 pointer-events-none">
        {logic.toasts.map(toast => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast {...toast} onClose={logic.removeToast} />
          </div>
        ))}
      </div>

      <input 
        type="file" ref={fileInputRef} className="hidden" accept="image/*" 
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onloadend = () => payment.setPaymentForm((p: any) => ({ ...p, screenshot: reader.result as string }));
            reader.readAsDataURL(file);
          }
        }} 
      />

      <AppRouter 
        path={path} mode={mode} setMode={setMode}
        user={user} setUser={setUser}
        showScan={showScan} setShowScan={setShowScan}
        handleLogout={handleLogout}
        logic={logic} payment={payment}
        liveProject={liveProject} liveLoading={liveLoading}
        navigateTo={navigateTo}
        fileInputRef={fileInputRef}
      />
    </>
  );
};

const App: React.FC = () => (
  <LanguageProvider>
    <AppContent />
  </LanguageProvider>
);

export default App;
