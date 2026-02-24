
import React, { useState } from 'react';
import { Fingerprint } from 'lucide-react';

interface ScanPageProps {
  onFinish: () => void;
}

const ScanPage: React.FC<ScanPageProps> = ({ onFinish }) => {
  const [isScanning, setIsScanning] = useState(false);
  
  const handleStartAuth = () => {
    setIsScanning(true);
    setTimeout(() => onFinish(), 2000);
  };

  return (
    <div className="h-[100dvh] w-full flex flex-col items-center justify-center bg-[#0a0110] text-white relative overflow-hidden p-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,45,117,0.15)_0%,_transparent_70%)] opacity-50"></div>
      <div className="flex flex-col items-center text-center animate-in fade-in zoom-in duration-700">
        <div className="mb-12 space-y-2">
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-white via-pink-400 to-pink-600 drop-shadow-[0_0_20px_rgba(255,45,117,0.4)]">
            OneClick Studio
          </h1>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-pink-500/60">
            Secure Uplink System • AI Core
          </p>
        </div>
        <div onClick={!isScanning ? handleStartAuth : undefined} className={`relative w-40 h-40 md:w-48 md:h-48 flex items-center justify-center cursor-pointer transition-transform active:scale-95 group mb-12`}>
          <div className={`absolute inset-0 bg-pink-500/10 rounded-full blur-3xl group-hover:bg-pink-500/20 transition-all ${!isScanning ? 'animate-pulse' : ''}`}></div>
          <Fingerprint size={isScanning ? 80 : 70} className={`${isScanning ? 'text-pink-400 scale-110' : 'text-pink-600'} transition-all duration-500 relative z-10 drop-shadow-[0_0_25px_rgba(255,45,117,0.6)] ${!isScanning ? 'animate-[float_3s_ease-in-out_infinite]' : 'animate-pulse'}`} />
          {isScanning && <div className="absolute top-0 left-0 w-full h-1 bg-pink-400 shadow-[0_0_25px_#ff2d75] rounded-full animate-[scanning_1.5s_infinite] z-20"></div>}
        </div>
        <h2 className={`text-sm md:text-xl font-bold tracking-widest uppercase transition-colors duration-500 ${isScanning ? 'text-pink-400' : 'text-slate-500'}`}>
          {isScanning ? 'Identity Scanning...' : 'Touch sensor to initiate login'}
        </h2>
      </div>
      <style>{`
        @keyframes scanning { 0% { top: 0; } 50% { top: 100%; } 100% { top: 0; } }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-15px); } }
      `}</style>
    </div>
  );
};

export default ScanPage;
