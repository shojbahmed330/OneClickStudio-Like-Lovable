
import React from 'react';
import { Search, Coins, ShieldCheck, ShieldAlert } from 'lucide-react';
import { User as UserType } from '../../types';

interface UserTableProps {
  users: UserType[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  setEditingUser: (user: UserType) => void;
  setNewTokenCount: (count: number) => void;
  handleBanToggle: (uid: string, email: string, status: boolean) => void;
  onAdminToggle?: (uid: string, currentStatus: boolean) => void;
}

const UserTable: React.FC<UserTableProps> = ({ 
  users, searchQuery, setSearchQuery, setEditingUser, setNewTokenCount, handleBanToggle, onAdminToggle 
}) => {
  const filtered = users.filter(u => u.email.toLowerCase().includes(searchQuery.toLowerCase()) || (u.name || '').toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="glass-tech rounded-2xl p-4 border-white/5 flex items-center gap-4">
        <Search className="text-slate-500" size={20}/>
        <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search members..." className="flex-1 bg-transparent outline-none text-sm" />
      </div>
      <div className="glass-tech rounded-[2.5rem] overflow-hidden border-white/5">
        <table className="w-full text-left text-xs">
          <thead className="bg-white/5 text-pink-500 font-black uppercase">
            <tr>
              <th className="p-6">Member</th>
              <th className="p-6">Credits</th>
              <th className="p-6">Role</th>
              <th className="p-6">Control</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.map(u => (
              <tr key={u.id} className="hover:bg-white/5">
                <td className="p-6">
                  <div className="flex items-center gap-3">
                    <img src={u.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.email}`} className="w-10 h-10 rounded-xl" />
                    <div>
                      <div className="font-black text-white flex items-center gap-2">
                        {u.name} 
                        {u.isAdmin && <ShieldCheck size={12} className="text-pink-500" />}
                      </div>
                      <div className="opacity-50 text-[10px]">{u.email}</div>
                    </div>
                  </div>
                </td>
                <td className="p-6">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-pink-400 font-black text-lg">{u.tokens}</span>
                    <button onClick={() => { setEditingUser(u); setNewTokenCount(u.tokens); }} className="p-2 bg-white/5 rounded-lg text-pink-400 hover:bg-pink-500 hover:text-white transition-all"><Coins size={14}/></button>
                  </div>
                </td>
                <td className="p-6">
                    <button 
                        onClick={() => onAdminToggle?.(u.id, u.isAdmin || false)}
                        className={`px-3 py-1 rounded-lg font-black uppercase text-[9px] transition-all flex items-center gap-2 ${u.isAdmin ? 'bg-pink-500/20 text-pink-500 border border-pink-500/20' : 'bg-white/5 text-slate-500 hover:text-white'}`}
                    >
                        {u.isAdmin ? <><ShieldCheck size={12}/> Admin</> : <><ShieldAlert size={12}/> User</>}
                    </button>
                </td>
                <td className="p-6">
                    <button 
                        onClick={() => handleBanToggle(u.id, u.email, u.is_banned || false)} 
                        className={`px-4 py-2 rounded-xl font-black uppercase text-[10px] transition-all ${u.is_banned ? 'bg-green-600 text-white' : 'bg-red-600/10 text-red-500 border border-red-500/20 hover:bg-red-600 hover:text-white'}`}
                    >
                        {u.is_banned ? 'Unsuspend' : 'Terminate'}
                    </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserTable;
