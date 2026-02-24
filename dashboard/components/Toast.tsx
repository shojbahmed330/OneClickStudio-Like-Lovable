
import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X, ShieldCheck } from 'lucide-react';

export interface ToastProps {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'healing';
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ id, message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => onClose(id), 5000);
    return () => clearTimeout(timer);
  }, [id, onClose]);

  const icons = {
    success: <CheckCircle2 className="text-green-500" size={18} />,
    error: <AlertCircle className="text-red-500" size={18} />,
    info: <Info className="text-blue-500" size={18} />,
    healing: <ShieldCheck className="text-pink-500 animate-pulse" size={18} />
  };

  const bgColors = {
    success: 'bg-green-500/10 border-green-500/20',
    error: 'bg-red-500/10 border-red-500/20',
    info: 'bg-blue-500/10 border-blue-500/20',
    healing: 'bg-pink-500/10 border-pink-500/20'
  };

  return (
    <div className={`flex items-center gap-4 px-6 py-4 rounded-2xl border backdrop-blur-2xl shadow-2xl animate-in slide-in-from-right-10 duration-500 ${bgColors[type]}`}>
      <div className="shrink-0">{icons[type]}</div>
      <p className="text-[11px] font-black uppercase tracking-widest text-white flex-1">{message}</p>
      <button onClick={() => onClose(id)} className="p-1 hover:bg-white/5 rounded-lg text-zinc-500 transition-colors">
        <X size={14} />
      </button>
    </div>
  );
};

export default Toast;
