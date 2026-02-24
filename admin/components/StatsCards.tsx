
import React from 'react';
import { Wallet, User as UserIcon, Trophy, ShoppingCart } from 'lucide-react';

interface StatsCardsProps {
  stats: {
    totalRevenue: number;
    usersToday: number;
    topPackage: string;
    salesCount: number;
  };
}

const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  const cards = [
    { label: 'Total Revenue', value: `৳${stats.totalRevenue}`, icon: Wallet, color: 'text-green-400' },
    { label: 'New Users Today', value: stats.usersToday, icon: UserIcon, color: 'text-blue-400' },
    { label: 'Top Package', value: stats.topPackage, icon: Trophy, color: 'text-yellow-400' },
    { label: 'Total Sales', value: stats.salesCount, icon: ShoppingCart, color: 'text-pink-400' }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {cards.map((s, i) => (
        <div key={i} className="glass-tech p-8 rounded-[2rem] border-white/5">
          <s.icon className={`${s.color} mb-4`} size={24} />
          <div className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{s.label}</div>
          <div className="text-3xl font-black text-white mt-2 tracking-tighter">{s.value}</div>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;
