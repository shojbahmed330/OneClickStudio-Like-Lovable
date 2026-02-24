
import React from 'react';
import { Check } from 'lucide-react';
import { Package } from '../types';
import { useLanguage } from '../i18n/LanguageContext';

// Sub-components
import PackageGrid from './components/PackageGrid';
import PaymentMethods from './components/PaymentMethods';
import PaymentForm from './components/PaymentForm';

interface ShopViewProps {
  packages: Package[];
  paymentStep: 'methods' | 'form' | 'success' | 'idle';
  setPaymentStep: (step: 'methods' | 'form' | 'success' | 'idle') => void;
  selectedPkg: Package | null;
  setSelectedPkg: (pkg: Package | null) => void;
  paymentMethod: 'Bkash' | 'Nagad' | 'Rocket' | null;
  setPaymentMethod: (method: 'Bkash' | 'Nagad' | 'Rocket' | null) => void;
  paymentForm: { trxId: string; screenshot: string; message: string };
  setPaymentForm: (form: any) => void;
  paymentSubmitting: boolean;
  handlePaymentSubmit: () => void;
  handlePaymentScreenshotUpload: () => void;
}

const ShopView: React.FC<ShopViewProps> = ({ 
  packages, paymentStep, setPaymentStep, selectedPkg, setSelectedPkg, 
  paymentMethod, setPaymentMethod, paymentForm, setPaymentForm, 
  paymentSubmitting, handlePaymentSubmit, handlePaymentScreenshotUpload 
}) => {
  const { t } = useLanguage();

  return (
    <div className="flex-1 p-6 md:p-20 overflow-y-auto">
       {paymentStep === 'idle' ? (
         <PackageGrid 
            packages={packages} setSelectedPkg={setSelectedPkg} 
            setPaymentStep={setPaymentStep} 
          />
       ) : paymentStep === 'methods' ? (
         <PaymentMethods 
            setPaymentMethod={setPaymentMethod} 
            setPaymentStep={setPaymentStep} 
          />
       ) : paymentStep === 'form' ? (
         <PaymentForm 
            paymentMethod={paymentMethod} selectedPkg={selectedPkg} 
            paymentForm={paymentForm} setPaymentForm={setPaymentForm} 
            paymentSubmitting={paymentSubmitting} handlePaymentSubmit={handlePaymentSubmit} 
            handlePaymentScreenshotUpload={handlePaymentScreenshotUpload} 
            setPaymentStep={setPaymentStep} 
          />
       ) : (
         <div className="max-w-md mx-auto glass-tech p-16 rounded-[3rem] text-center animate-in zoom-in">
            <div className="w-20 h-20 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(34,197,94,0.3)]"><Check size={40}/></div>
            <h3 className="text-3xl font-black mb-4 text-white uppercase tracking-tighter">{t('shop.request_sent')}</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-8">{t('shop.verify_desc')}</p>
            <button onClick={() => setPaymentStep('idle')} className="px-10 py-4 bg-pink-600 rounded-2xl font-black uppercase text-xs shadow-lg active:scale-95">{t('shop.complete_process')}</button>
         </div>
       )}
    </div>
  );
};

export default ShopView;
