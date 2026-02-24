
import React from 'react';
import { Upload, ShieldCheck } from 'lucide-react';
import { User } from '../../types';

interface ProfileHeaderProps {
  user: User;
  onAvatarUpload: () => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ user, onAvatarUpload }) => {
  return (
    <div className="glass-tech p-8 md:p-12 rounded-[2.5rem] md:rounded-[3rem] border-pink-500/10 flex flex-col md:flex-row items-center gap-8 shadow-2xl relative overflow-hidden">
      <div className="relative group cursor-pointer" onClick={onAvatarUpload}>
        <div className="w-32 h-32 md:w-40 md:h-40 rounded-[2.5rem] border-4 border-pink-500/20 p-1.5 shadow-2xl overflow-hidden bg-slate-800">
          <img src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} className="w-full h-full object-cover rounded-[2rem]" alt="Profile"/>
        </div>
        <div className="absolute inset-0 bg-black/60 rounded-[2.5rem] opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
          <Upload size={24} className="text-white"/>
        </div>
      </div>
      <div className="text-center md:text-left space-y-2">
        <h2 className="text-3xl md:text-5xl font-black text-white">{user.name}</h2>
        <div className="flex items-center gap-2 justify-center md:justify-start">
          <span className="text-pink-400 font-bold text-xs bg-pink-500/5 px-3 py-1 rounded-lg border border-pink-500/10">{user.email}</span>
          {user.is_verified && <div className="text-blue-400 bg-blue-500/10 p-1.5 rounded-full"><ShieldCheck size={14}/></div>}
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
