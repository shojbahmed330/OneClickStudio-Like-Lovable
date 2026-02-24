
import { useState, useEffect } from 'react';
import { User as UserType, AppMode } from '../types';
import { DatabaseService } from '../services/dbService';

const ADMIN_EMAILS = ['rajshahi.jibon@gmail.com', 'rajshahi.shojib@gmail.com', 'rajshahi.sumi@gmail.com'];

export const useAppAuth = (navigateTo: (path: string, mode?: AppMode) => void) => {
  const [user, setUser] = useState<UserType | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showScan, setShowScan] = useState(true);
  const db = DatabaseService.getInstance();

  useEffect(() => {
    // Detect errors in URL (e.g., identity_already_exists)
    const params = new URLSearchParams(window.location.search);
    const error = params.get('error_description') || params.get('error');
    const errorCode = params.get('error_code');

    if (error || errorCode) {
      let msg = "গিটহাব লিঙ্ক করতে সমস্যা হয়েছে।";
      if (errorCode === 'identity_already_exists' || error.includes('already_linked')) {
        msg = "এই গিটহাব অ্যাকাউন্টটি ইতিমধ্যে আমাদের সিস্টেমের অন্য একটি প্রোফাইলে যুক্ত আছে। দয়া করে অন্য একটি গিটহাব অ্যাকাউন্ট ব্যবহার করুন অথবা ম্যানুয়াল টোকেন বসান।";
      } else {
        msg = `ত্রুটি: ${error}`;
      }
      alert(msg);
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    const handleSession = async (session: any) => {
      const forced = localStorage.getItem('df_force_login');
      
      if (!session?.user) {
        if (forced && ADMIN_EMAILS.includes(forced)) {
          const userData = await db.getUser(forced);
          if (userData) {
            setUser(userData);
            setShowScan(false);
            setAuthLoading(false);
            return;
          }
        }
        setAuthLoading(false);
        return;
      }

      try {
        const providerToken = session.provider_token;
        const identities = session.user.identities || [];
        const isGithubIdentity = identities.some((id: any) => id.provider === 'github');

        const currentUserId = user?.id || session.user.id;

        // Sync token if available from session
        if (providerToken && (session.user.app_metadata?.provider === 'github' || isGithubIdentity)) {
          try {
            const githubUserRes = await fetch('https://api.github.com/user', {
              headers: { 'Authorization': `token ${providerToken}` }
            });
            if (githubUserRes.ok) {
              const githubUserData = await githubUserRes.json();
              const username = githubUserData.login;
              
              await db.updateGithubConfig(currentUserId, {
                token: providerToken,
                owner: username,
                repo: user?.github_repo || '' 
              });
            } else {
              await db.updateGithubTokenOnly(currentUserId, providerToken);
            }
          } catch (e) {
            await db.updateGithubTokenOnly(currentUserId, providerToken);
          }
        }

        const userData = await db.getUser(session.user.email || '', session.user.id);
        
        if (userData) { 
          setUser(userData); 
          setShowScan(false);
          // Changed redirect from /profile to /dashboard for a better user flow
          if (window.location.pathname === '/' || window.location.pathname === '/login') {
             navigateTo('/dashboard', AppMode.PREVIEW);
          }
        }
      } catch (e) { 
        console.error("Auth process error:", e); 
      } finally { 
        setAuthLoading(false); 
      }
    };

    // Fix: Cast db.supabase.auth to any to access getSession method
    (db.supabase.auth as any).getSession().then(({ data: { session } }: any) => {
      handleSession(session);
    });

    const { data: { subscription } } = db.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        handleSession(session);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setAuthLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [user?.id]);

  const handleLogout = async () => { 
    try { await db.signOut(); } catch (e) {}
    setUser(null); 
    setShowScan(true); 
    navigateTo('/login', AppMode.PREVIEW); 
  };

  return { user, setUser, authLoading, setAuthLoading, showScan, setShowScan, handleLogout };
};
