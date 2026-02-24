
import React from 'react';
import { Wallet, Calendar, ShieldCheck } from 'lucide-react';
import { User } from '../../types';
import { useLanguage } from '../../i18n/LanguageContext';

interface ProfileStatsProps {
  user: User;
}

const ProfileStats: React.FC<ProfileStatsProps> = ({ user }) => {
  const { t } = useLanguage();
  
  const stats = [
    { label: t('profile.stats.tokens'), value: user.tokens, icon: Wallet },
    { label: t('profile.stats.joined'), value: new Date(user.joinedAt).toLocaleDateString(), icon: Calendar },
    { label: t('profile.stats.role'), value: user.isAdmin ? t('profile.stats.admin') : t('profile.stats.developer'), icon: ShieldCheck }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {stats.map((s, idx) => (
        <div key={idx} className="glass-tech p-6 rounded-3xl border-pink-500/5 flex items-center gap-4">
          <div className="w-12 h-12 bg-pink-500/10 rounded-2xl flex items-center justify-center text-pink-500"><s.icon size={24}/></div>
          <div><div className="text-[10px] font-black text-slate-500 uppercase">{s.label}</div><div className="text-xl font-bold text-white">{s.value}</div></div>
        </div>
      ))}
    </div>
  );
};

export default ProfileStats;
