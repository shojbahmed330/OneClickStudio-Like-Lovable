
import React from 'react';
import { History, CreditCard } from 'lucide-react';
import { Transaction } from '../../types';
import { useLanguage } from '../../i18n/LanguageContext';

interface TransactionHistoryProps {
  transactions: Transaction[];
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({ transactions }) => {
  const { t } = useLanguage();

  return (
    <div className="glass-tech p-8 md:p-10 rounded-[2.5rem] border-white/5 space-y-6 shadow-xl">
      <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
        <History className="text-pink-500"/> {t('profile.history').split(' ')[0]} <span className="text-pink-500">{t('profile.history').split(' ')[1]}</span>
      </h3>
      <div className="space-y-4">
        {transactions.length > 0 ? transactions.slice(0, 3).map(tx => (
          <div key={tx.id} className="flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/10 group hover:bg-white/[0.08] transition-all">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${tx.status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}><CreditCard size={20} /></div>
              <div>
                <div className="font-black text-white text-sm uppercase">৳{tx.amount} • {tx.payment_method}</div>
                <div className="text-[10px] text-slate-500 font-mono tracking-wider">TrxID: {tx.trx_id}</div>
              </div>
            </div>
            <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] ${tx.status === 'completed' ? 'bg-green-600/20 text-green-400 border border-green-500/20' : 'bg-yellow-600/20 text-yellow-400 border border-yellow-500/20'}`}>{tx.status}</span>
          </div>
        )) : <div className="text-center py-10 text-slate-600 font-black uppercase tracking-[0.3em]">{t('profile.no_records')}</div>}
      </div>
    </div>
  );
};

export default TransactionHistory;
