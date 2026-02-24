
import React, { useRef } from 'react';
import { Upload, RefreshCw, Loader2 } from 'lucide-react';
import { Package } from '../../types';

interface PaymentFormProps {
  paymentMethod: string | null;
  selectedPkg: Package | null;
  paymentForm: { trxId: string; screenshot: string; message: string };
  setPaymentForm: (form: any) => void;
  paymentSubmitting: boolean;
  handlePaymentSubmit: () => void;
  handlePaymentScreenshotUpload: () => void; // This will now trigger the local ref
  setPaymentStep: (step: any) => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ 
  paymentMethod, selectedPkg, paymentForm, setPaymentForm, paymentSubmitting, 
  handlePaymentSubmit, setPaymentStep 
}) => {
  const localFileRef = useRef<HTMLInputElement>(null);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPaymentForm({ ...paymentForm, screenshot: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerUpload = () => {
    if (localFileRef.current) localFileRef.current.click();
  };

  return (
    <div className="max-w-md mx-auto glass-tech p-10 rounded-[3rem] animate-in zoom-in">
      <input 
        type="file" 
        ref={localFileRef} 
        className="hidden" 
        accept="image/*" 
        onChange={onFileChange} 
      />
      
      <h3 className="text-2xl font-black mb-2">{paymentMethod} <span className="text-pink-500">Gateway</span></h3>
      <div className="bg-pink-500/10 p-4 rounded-2xl border border-pink-500/20 mb-6">
        <p className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">Send Money To (Personal):</p>
        <p className="text-2xl font-black text-white tracking-widest">01721013902</p>
        <p className="text-[10px] text-pink-400/80 mt-1">Payable: <span className="font-black">৳{selectedPkg?.price}</span></p>
      </div>
      <div className="space-y-4">
        <div className="space-y-1">
           <label className="text-[10px] font-black uppercase text-slate-500 ml-2">Transaction ID (TrxID)</label>
           <input required value={paymentForm.trxId} onChange={e => setPaymentForm({...paymentForm, trxId: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white text-sm focus:border-pink-500/50 outline-none" placeholder="Enter TrxID here" />
        </div>
        <div className="space-y-1">
           <label className="text-[10px] font-black uppercase text-slate-500 ml-2">Upload Screenshot (Proof)</label>
           <div onClick={triggerUpload} className="w-full h-32 bg-black/40 border border-dashed border-white/20 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-black/60 transition-all overflow-hidden relative">
              {paymentForm.screenshot ? (
                <>
                   <img src={paymentForm.screenshot} className="w-full h-full object-cover opacity-40" />
                   <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                      <RefreshCw size={24} className="mb-2"/><span className="text-[10px] font-black uppercase">Tap to Change</span>
                   </div>
                </>
              ) : (
                <><Upload size={24} className="text-slate-500 mb-2" /><span className="text-[10px] font-black uppercase text-slate-500">Select Image File</span></>
              )}
           </div>
        </div>
        <div className="space-y-1">
           <label className="text-[10px] font-black uppercase text-slate-500 ml-2">Message (Optional)</label>
           <textarea value={paymentForm.message} onChange={e => setPaymentForm({...paymentForm, message: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white text-sm h-16 resize-none outline-none" placeholder="Notes for admin..." />
        </div>
        <button disabled={paymentSubmitting} onClick={handlePaymentSubmit} className="w-full py-5 bg-pink-600 rounded-2xl font-black uppercase text-sm shadow-xl active:scale-95 transition-all disabled:opacity-50">
           {paymentSubmitting ? <Loader2 className="animate-spin mx-auto"/> : 'Securely Send Proof'}
        </button>
        <button onClick={() => setPaymentStep('methods')} className="w-full py-2 text-slate-500 text-xs font-black uppercase">Back to Methods</button>
      </div>
    </div>
  );
};

export default PaymentForm;
