
import React, { useState } from 'react';
import { Loader2, ShieldAlert } from 'lucide-react';
import { DatabaseService } from '../services/dbService';
import { User as UserType } from '../types';

interface AdminLoginPageProps {
  onLoginSuccess: (user: UserType) => void;
}

const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onLoginSuccess }) => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const db = DatabaseService.getInstance();

  const handleAdminAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await db.signIn(formData.email, formData.password);
      if (res.error) throw res.error;
      const userData = await db.getUser(formData.email, res.data.user?.id);
      if (userData && userData.isAdmin) {
        onLoginSuccess(userData);
      } else {
        throw new Error("Access Denied: Non-admin terminal access attempt.");
      }
    } catch (error: any) { alert(error.message); } finally { setIsLoading(false); }
  };

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-[#0a0110] text-white p-4">
      <div className="glass-tech p-10 rounded-[3rem] w-full max-w-md border-pink-500/20 shadow-2xl">
        <div className="text-center mb-10">
          <ShieldAlert size={48} className="mx-auto text-pink-500 mb-4" />
          <h2 className="text-3xl font-black tracking-tight">Admin <span className="text-pink-500">Terminal</span></h2>
        </div>
        <form onSubmit={handleAdminAuth} className="space-y-6">
          <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-sm" placeholder="Admin ID" />
          <input type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-sm" placeholder="Master Key" />
          <button disabled={isLoading} className="w-full py-4 bg-pink-600 rounded-2xl font-black uppercase text-sm shadow-xl active:scale-95">
            {isLoading ? <Loader2 className="animate-spin mx-auto" /> : 'Authorize Access'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLoginPage;
