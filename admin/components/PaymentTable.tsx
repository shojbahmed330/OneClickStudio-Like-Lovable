
import React from 'react';
import { Search, View as ViewIcon, Check, X } from 'lucide-react';
import { Transaction } from '../../types';

interface PaymentTableProps {
  transactions: Transaction[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  setPreviewImage: (url: string | null) => void;
  handleApprove: (id: string) => void;
  handleReject: (id: string) => void;
}

const PaymentTable: React.FC<PaymentTableProps> = ({ 
  transactions, searchQuery, setSearchQuery, setPreviewImage, handleApprove, handleReject 
}) => {
  const filtered = transactions.filter(tx => 
    tx.trx_id?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    tx.user_email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="glass-tech rounded-2xl p-4 border-white/5 flex items-center gap-4">
        <Search className="text-slate-500" size={20}/>
        <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Filter by TrxID or User Email..." className="flex-1 bg-transparent outline-none text-sm" />
      </div>
      <div className="glass-tech rounded-[2.5rem] overflow-hidden border-white/5">
        <table className="w-full text-left text-xs">
          <thead className="bg-white/5 text-pink-500 font-black uppercase tracking-widest">
            <tr><th className="p-6">User/Email</th><th className="p-6">Amount</th><th className="p-6">Method/Trx</th><th className="p-6">Details</th><th className="p-6">Action</th></tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.map(tx => (
              <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                <td className="p-6 font-bold">{tx.user_email}</td>
                <td className="p-6 font-black text-white">৳{tx.amount}</td>
                <td className="p-6"><span className="text-pink-400 font-mono">{tx.payment_method}</span><br/><span className="opacity-50">{tx.trx_id}</span></td>
                <td className="p-6">
                  <div className="flex flex-col gap-3">
                    {tx.message && <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-[11px] text-slate-300 italic">"{tx.message}"</div>}
                    {tx.screenshot_url ? (
                      <div onClick={() => setPreviewImage(tx.screenshot_url!)} className="relative group w-24 h-16 overflow-hidden rounded-xl cursor-pointer border border-white/10 shadow-xl"><img src={tx.screenshot_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" /><div className="absolute inset-0 bg-pink-500/20 opacity-0 group-hover:opacity-100 flex items-center justify-center"><ViewIcon size={16} className="text-white"/></div></div>
                    ) : <div className="text-slate-600 text-[10px] font-black uppercase flex items-center gap-1">No Proof</div>}
                  </div>
                </td>
                <td className="p-6">
                  {tx.status === 'pending' ? (
                    <div className="flex gap-2"><button onClick={() => handleApprove(tx.id)} className="p-2 bg-green-500/20 text-green-400 rounded-lg"><Check size={16}/></button><button onClick={() => handleReject(tx.id)} className="p-2 bg-red-500/20 text-red-400 rounded-lg"><X size={16}/></button></div>
                  ) : <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${tx.status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{tx.status}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PaymentTable;
