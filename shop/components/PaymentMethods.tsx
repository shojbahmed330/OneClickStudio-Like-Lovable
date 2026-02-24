
import React from 'react';

interface PaymentMethodsProps {
  setPaymentMethod: (method: any) => void;
  setPaymentStep: (step: any) => void;
}

const PaymentMethods: React.FC<PaymentMethodsProps> = ({ setPaymentMethod, setPaymentStep }) => {
  const methods = [
    { id: 'Bkash', color: 'bg-[#e2136e]' },
    { id: 'Nagad', color: 'bg-[#f6921e]' },
    { id: 'Rocket', color: 'bg-[#8c3494]' }
  ];

  return (
    <div className="max-w-md mx-auto glass-tech p-10 rounded-[3rem] animate-in zoom-in">
      <h3 className="text-2xl font-black mb-8 text-center">Select <span className="text-pink-500">Method</span></h3>
      <div className="space-y-4">
        {methods.map(m => (
          <button key={m.id} onClick={() => { setPaymentMethod(m.id as any); setPaymentStep('form'); }} className={`w-full p-6 ${m.color} rounded-2xl flex items-center justify-between shadow-xl active:scale-95 transition-transform`}>
            <span className="font-black uppercase">{m.id}</span>
            <span className="text-xs opacity-90 font-mono tracking-widest">01721013902</span>
          </button>
        ))}
        <button onClick={() => setPaymentStep('idle')} className="w-full py-4 text-slate-500 text-xs font-black uppercase">Cancel</button>
      </div>
    </div>
  );
};

export default PaymentMethods;
