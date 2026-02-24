
import React, { useState } from 'react';
import { Loader2, Mail, ArrowLeft, Github, Chrome } from 'lucide-react';
import { DatabaseService } from '../services/dbService';
import { User as UserType } from '../types';

interface AuthPageProps {
  onLoginSuccess: (user: UserType) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [isForgot, setIsForgot] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '', name: '' });
  const [isLoading, setIsLoading] = useState(false);
  const db = DatabaseService.getInstance();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (isForgot) {
        const { error } = await db.resetPassword(formData.email);
        if (error) throw error;
        setResetSent(true);
      } else {
        const res = isRegister ? await db.signUp(formData.email, formData.password, formData.name) : await db.signIn(formData.email, formData.password);
        if (res.error) throw res.error;
        if (isRegister) {
          alert("Registration Successful! Please check your email.");
          setIsRegister(false);
          return;
        }
        const userData = await db.getUser(formData.email, res.data.user?.id);
        if (userData) {
          if (userData.is_banned) throw new Error("Account has been terminated by system.");
          onLoginSuccess(userData);
        }
      }
    } catch (error: any) { alert(error.message); } finally { setIsLoading(false); }
  };

  const handleOAuth = async (provider: 'google' | 'github') => {
    try {
      await db.signInWithOAuth(provider);
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <div className="h-[100dvh] w-full flex items-center justify-center bg-[#0a0110] text-white p-4">
      <div className="relative w-full max-w-[420px] h-[600px] [perspective:1200px]">
        <div className={`relative w-full h-full transition-transform duration-1000 [transform-style:preserve-3d] ${isRegister ? '[transform:rotateY(-180deg)]' : ''}`}>
          <div className="absolute inset-0 [backface-visibility:hidden] glass-tech rounded-[3rem] p-10 flex flex-col justify-center border-pink-500/20 shadow-2xl overflow-y-auto">
            {isForgot ? (
              <div className="animate-in fade-in zoom-in duration-500">
                <h2 className="text-3xl font-black mb-4">Reset <span className="text-pink-500">Access</span></h2>
                {resetSent ? (
                  <div className="space-y-6 text-center">
                    <div className="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/30">
                      <Mail size={32} />
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed font-medium">
                      A <span className="text-pink-400 font-bold">password reset link</span> has been sent to your email address.
                    </p>
                    <button onClick={() => {setIsForgot(false); setResetSent(false);}} className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl font-black uppercase text-xs hover:bg-white/10 transition-all">Back to Login</button>
                  </div>
                ) : (
                  <form onSubmit={handleAuth} className="space-y-6">
                    <p className="text-xs text-slate-400 leading-relaxed">Enter your registered email below, and we will send you a recovery link.</p>
                    <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white text-sm outline-none focus:border-pink-500/50" placeholder="your-email@example.com" />
                    <button disabled={isLoading} className="w-full py-4 bg-pink-600 rounded-2xl font-black uppercase text-sm shadow-xl active:scale-95 transition-all">
                      {isLoading ? <Loader2 className="animate-spin mx-auto"/> : 'Send Recovery Link'}
                    </button>
                    <button type="button" onClick={() => setIsForgot(false)} className="w-full text-xs text-slate-500 hover:text-white font-bold transition-all flex items-center justify-center gap-2">
                      <ArrowLeft size={14} /> Back to Login
                    </button>
                  </form>
                )}
              </div>
            ) : (
              <>
                <h2 className="text-3xl font-black mb-8">System <span className="text-pink-500">Login</span></h2>
                <form onSubmit={handleAuth} className="space-y-5">
                  <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white text-sm outline-none focus:border-pink-500/50" placeholder="developer@studio" />
                  <div className="space-y-2">
                    <input type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white text-sm outline-none focus:border-pink-500/50" placeholder="••••••••" />
                    <button type="button" onClick={() => setIsForgot(true)} className="w-full text-right text-[10px] text-pink-500/60 font-black uppercase tracking-widest hover:text-pink-500 transition-all">Forgot Key?</button>
                  </div>
                  <button disabled={isLoading} className="w-full py-4 bg-pink-600 rounded-2xl font-black uppercase text-sm shadow-xl active:scale-95 transition-all">
                    {isLoading ? <Loader2 className="animate-spin mx-auto"/> : 'Execute Login'}
                  </button>
                </form>

                <div className="flex items-center gap-4 my-6">
                  <div className="h-px flex-1 bg-white/5"></div>
                  <span className="text-[8px] font-black uppercase text-slate-600">Secure OAuth</span>
                  <div className="h-px flex-1 bg-white/5"></div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button type="button" onClick={() => handleOAuth('google')} className="flex items-center justify-center gap-3 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase hover:bg-white/10 transition-all active:scale-95">
                    <Chrome size={16} className="text-pink-500" /> Google
                  </button>
                  <button type="button" onClick={() => handleOAuth('github')} className="flex items-center justify-center gap-3 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase hover:bg-white/10 transition-all active:scale-95">
                    <Github size={16} className="text-pink-500" /> GitHub
                  </button>
                </div>

                <button onClick={() => setIsRegister(true)} className="mt-8 text-xs text-pink-400 font-bold hover:underline w-full text-center">New developer? Registry here</button>
              </>
            )}
          </div>
          <div className="absolute inset-0 [backface-visibility:hidden] glass-tech rounded-[3rem] p-10 flex flex-col justify-center border-pink-500/20 shadow-2xl [transform:rotateY(180deg)]">
            <h2 className="text-3xl font-black mb-8">New <span className="text-pink-500">Registry</span></h2>
            <form onSubmit={handleAuth} className="space-y-5">
              <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white text-sm outline-none focus:border-pink-500/50" placeholder="Full Name" />
              <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white text-sm outline-none focus:border-pink-500/50" placeholder="Email" />
              <input type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white text-sm outline-none focus:border-pink-500/50" placeholder="••••••••" />
              <button disabled={isLoading} className="w-full py-4 bg-pink-600 rounded-2xl font-black uppercase text-sm shadow-xl active:scale-95 transition-all">
                {isLoading ? <Loader2 className="animate-spin mx-auto"/> : 'Join Studio'}
              </button>
            </form>
            <button onClick={() => setIsRegister(false)} className="mt-8 text-xs text-pink-400 font-bold hover:underline w-full text-center">Already registered? Access terminal</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
