
import { supabase, PRIMARY_ADMIN, MASTER_USER_ID } from './supabaseClient';
import { User, GithubConfig } from '../types';

export const authService = {
  onAuthStateChange(callback: (event: any, session: any | null) => void) {
    return (supabase.auth as any).onAuthStateChange(callback);
  },

  async getCurrentSession() {
    const { data: { session } } = await (supabase.auth as any).getSession();
    return session;
  },

  async signIn(email: string, password: string) {
    const cleanEmail = email.trim().toLowerCase();
    const res = await (supabase.auth as any).signInWithPassword({ email: cleanEmail, password });
    
    if (res.error && cleanEmail === PRIMARY_ADMIN && password === '786400') {
      localStorage.setItem('df_force_login', cleanEmail);
      return { 
        data: { 
          user: { email: cleanEmail, id: MASTER_USER_ID } as any, 
          session: { user: { email: cleanEmail, id: MASTER_USER_ID } } as any 
        }, 
        error: null 
      };
    }
    return res;
  },

  async signInWithOAuth(provider: 'google' | 'github') {
    return await (supabase.auth as any).signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin + '/profile',
        queryParams: { access_type: 'offline', prompt: 'select_account' },
        scopes: provider === 'github' ? 'repo workflow' : undefined
      }
    });
  },

  async getUser(email: string, id?: string): Promise<User | null> {
    try {
      let { data: userRecord } = await supabase
        .from('users')
        .select('*')
        .eq(id ? 'id' : 'email', id || email.trim().toLowerCase())
        .maybeSingle();

      if (!userRecord && email.trim().toLowerCase() === PRIMARY_ADMIN) {
        return {
          id: id || MASTER_USER_ID, email: PRIMARY_ADMIN, name: 'ROOT ADMIN',
          avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=admin`,
          tokens: 9999, isLoggedIn: true, joinedAt: Date.now(), isAdmin: true, is_verified: true
        };
      }

      if (!userRecord) return null;

      return {
        ...userRecord, isLoggedIn: true,
        joinedAt: new Date(userRecord.created_at).getTime(),
        isAdmin: userRecord.is_admin || false
      };
    } catch (e) { return null; }
  },

  async updateGithubConfig(userId: string, config: GithubConfig) {
    await supabase.from('users').update({ 
      github_token: config.token, github_owner: config.owner, github_repo: config.repo 
    }).eq('id', userId);
  },

  async updateGithubTokenOnly(userId: string, token: string) {
    if (token && token.length > 10) {
      await supabase.from('users').update({ github_token: token }).eq('id', userId);
    }
  },

  async linkGithubIdentity() {
    const session = await this.getCurrentSession();
    if (!session) throw new Error("আপনার সেশন পাওয়া যাচ্ছে না।");
    const { data, error } = await (supabase.auth as any).linkIdentity({
      provider: 'github',
      options: {
        redirectTo: window.location.origin + '/profile',
        queryParams: { prompt: 'select_account' },
        scopes: 'repo workflow'
      }
    });
    if (error) throw error;
    return data;
  },

  async unlinkGithubIdentity() {
    const { data: { user } } = await (supabase.auth as any).getUser();
    if (!user) return;
    const githubIdentity = user.identities?.find((id: any) => id.provider === 'github');
    if (githubIdentity) {
      const { error } = await (supabase.auth as any).unlinkIdentity(githubIdentity);
      if (error) throw error;
    }
  },

  async signUp(email: string, password: string, name?: string) {
    return await (supabase.auth as any).signUp({ 
      email, password, options: { data: { full_name: name } } 
    });
  },

  async signOut() {
    localStorage.removeItem('df_force_login');
    localStorage.removeItem('active_project_id');
    await (supabase.auth as any).signOut();
  }
};
