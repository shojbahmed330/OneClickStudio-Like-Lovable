
import React from 'react';
import { X } from 'lucide-react';
import { User, Package } from '../../types';

interface AdminModalsProps {
  previewImage: string | null;
  setPreviewImage: (u: string | null) => void;
  editingUser: User | null;
  setEditingUser: (u: User | null) => void;
  newTokenCount: number;
  setNewTokenCount: (n: number) => void;
  handleUpdateTokens: () => void;
  showPackageModal: boolean;
  setShowPackageModal: (b: boolean) => void;
  newPackage: { name: string; tokens: number; price: number };
  setNewPackage: (p: any) => void;
  handleCreatePackage: () => void;
  showEditPackageModal: boolean;
  setShowEditPackageModal: (b: boolean) => void;
  editingPackage: Package | null;
  setEditingPackage: (p: Package | null) => void;
  handleUpdatePackage: () => void;
}

const AdminModals: React.FC<AdminModalsProps> = (props) => {
  return (
    <>
      {props.previewImage && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in zoom-in duration-300">
           <button onClick={() => props.setPreviewImage(null)} className="absolute top-8 right-8 p-3 bg-white/10 hover:bg-pink-600 rounded-full text-white z-[210]"><X size={24}/></button>
           <img src={props.previewImage} className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl" />
        </div>
      )}

      {props.editingUser && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
           <div className="glass-tech p-10 rounded-[2.5rem] w-full max-w-sm border-pink-500/20 shadow-2xl animate-in zoom-in">
              <h3 className="text-xl font-black mb-6 text-white uppercase">Edit <span className="text-pink-500">Credits</span></h3>
              <p className="text-[10px] text-slate-500 uppercase font-bold mb-4">{props.editingUser.email}</p>
              <div className="space-y-4">
                 <input type="number" value={props.newTokenCount} onChange={e => props.setNewTokenCount(parseInt(e.target.value))} className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white text-xl font-black outline-none focus:border-pink-500/50" />
                 <div className="flex gap-2">
                    <button onClick={props.handleUpdateTokens} className="flex-1 py-3 bg-pink-600 rounded-xl font-black text-xs uppercase shadow-lg">Save</button>
                    <button onClick={() => props.setEditingUser(null)} className="px-6 py-3 bg-white/5 rounded-xl font-black text-xs uppercase">Cancel</button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {props.showEditPackageModal && props.editingPackage && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
           <div className="glass-tech p-10 rounded-[2.5rem] w-full max-w-md border-pink-500/20 animate-in zoom-in">
              <h3 className="text-xl font-black mb-6 text-white uppercase">Modify <span className="text-pink-500">Package</span></h3>
              <div className="space-y-4">
                 <input placeholder="Name" value={props.editingPackage.name} onChange={e => props.setEditingPackage({...props.editingPackage!, name: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm" />
                 <input type="number" placeholder="Tokens" value={props.editingPackage.tokens} onChange={e => props.setEditingPackage({...props.editingPackage!, tokens: parseInt(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm" />
                 <input type="number" placeholder="Price" value={props.editingPackage.price} onChange={e => props.setEditingPackage({...props.editingPackage!, price: parseInt(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm" />
                 <div className="flex gap-2 pt-4">
                    <button onClick={props.handleUpdatePackage} className="flex-1 py-4 bg-pink-600 rounded-xl font-black text-xs uppercase">Save</button>
                    <button onClick={() => props.setShowEditPackageModal(false)} className="px-6 py-4 bg-white/5 rounded-xl font-black text-xs uppercase">Close</button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {props.showPackageModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
           <div className="glass-tech p-10 rounded-[2.5rem] w-full max-w-md border-pink-500/20 animate-in zoom-in">
              <h3 className="text-xl font-black mb-6 text-white uppercase">New <span className="text-pink-500">Package</span></h3>
              <div className="space-y-4">
                 <input placeholder="Package Name" value={props.newPackage.name} onChange={e => props.setNewPackage({...props.newPackage, name: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm" />
                 <input type="number" placeholder="Token Count" value={props.newPackage.tokens} onChange={e => props.setNewPackage({...props.newPackage, tokens: parseInt(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm" />
                 <input type="number" placeholder="Price (BDT)" value={props.newPackage.price} onChange={e => props.setNewPackage({...props.newPackage, price: parseInt(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm" />
                 <div className="flex gap-2 pt-4">
                    <button onClick={props.handleCreatePackage} className="flex-1 py-4 bg-pink-600 rounded-xl font-black text-xs uppercase">Deploy</button>
                    <button onClick={() => props.setShowPackageModal(false)} className="px-6 py-4 bg-white/5 rounded-xl font-black text-xs uppercase">Close</button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </>
  );
};

export default AdminModals;
