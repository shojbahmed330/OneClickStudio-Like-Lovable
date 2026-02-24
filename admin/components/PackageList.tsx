
import React from 'react';
import { Package as PackageIcon, Trash2, Plus } from 'lucide-react';
import { Package } from '../../types';

interface PackageListProps {
  packages: Package[];
  setEditingPackage: (pkg: Package) => void;
  setShowEditPackageModal: (show: boolean) => void;
  handleDeletePackage: (id: string) => void;
  setShowPackageModal: (show: boolean) => void;
}

const PackageList: React.FC<PackageListProps> = ({ 
  packages, setEditingPackage, setShowEditPackageModal, handleDeletePackage, setShowPackageModal 
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {packages.map(p => (
        <div key={p.id} className="glass-tech p-10 rounded-[3rem] text-center relative border-white/5 group">
          <PackageIcon size={48} className="mx-auto text-pink-500 mb-6 group-hover:scale-125 transition-transform"/>
          <h3 className="text-2xl font-black text-white">{p.name}</h3>
          <div className="text-5xl font-black text-white my-6 tracking-tighter">{p.tokens} <span className="text-[10px] opacity-30 uppercase">UNITS</span></div>
          <div className="text-2xl font-black text-pink-500 mb-8">৳{p.price}</div>
          <div className="flex gap-2"><button onClick={() => { setEditingPackage(p); setShowEditPackageModal(true); }} className="flex-1 py-4 bg-white/5 rounded-2xl font-black text-xs hover:bg-white/10">Modify</button><button onClick={() => handleDeletePackage(p.id)} className="p-4 bg-red-600/20 text-red-500 rounded-2xl hover:bg-red-600"><Trash2 size={18}/></button></div>
        </div>
      ))}
      <button onClick={() => setShowPackageModal(true)} className="glass-tech p-10 rounded-[3rem] border-dashed border-2 border-white/10 flex flex-col items-center justify-center gap-4 hover:border-pink-500/50 transition-all group min-h-[400px]">
         <Plus size={48} className="text-slate-500 group-hover:text-pink-500"/><span className="text-xs font-black uppercase tracking-widest text-slate-500">Create New Package</span>
      </button>
    </div>
  );
};

export default PackageList;
