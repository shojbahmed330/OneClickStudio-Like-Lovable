
import React from 'react';
import { Package as PackageIcon } from 'lucide-react';
import { Package } from '../../types';

interface PackageGridProps {
  packages: Package[];
  setSelectedPkg: (pkg: Package) => void;
  setPaymentStep: (step: any) => void;
}

const PackageGrid: React.FC<PackageGridProps> = ({ packages, setSelectedPkg, setPaymentStep }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto py-10">
      {packages.map((p, i) => (
        <div key={i} className="glass-tech p-10 rounded-[3rem] text-center group hover:border-pink-500/60 transition-all border-pink-500/10 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/5 blur-3xl rounded-full group-hover:bg-pink-500/10 transition-colors"></div>
           <PackageIcon size={48} className="mx-auto text-pink-500 mb-6 group-hover:scale-125 transition-transform drop-shadow-[0_0_10px_rgba(255,45,117,0.4)]"/>
           <h3 className="text-2xl font-black mb-2 text-white">{p.name}</h3>
           <div className="text-5xl font-black text-white my-6 tracking-tighter">{p.tokens} <span className="text-[10px] opacity-40 uppercase">Units</span></div>
           <button 
             onClick={() => { setSelectedPkg(p); setPaymentStep('methods'); }} 
             className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl font-black hover:bg-pink-600 hover:text-white transition-all text-pink-400 active:scale-95 shadow-lg"
           >
             ৳ {p.price}
           </button>
        </div>
      ))}
    </div>
  );
};

export default PackageGrid;
