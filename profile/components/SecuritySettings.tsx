
import React from 'react';
import { Lock, Save, Loader2 } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

interface SecuritySettingsProps {
  oldPassword: string;
  setOldPassword: (p: string) => void;
  newPass: string;
  setNewPass: (p: string) => void;
  passError: string;
  isUpdating: boolean;
  onUpdate: () => void;
}

const SecuritySettings: React.FC<SecuritySettingsProps> = ({
  oldPassword, setOldPassword, newPass, setNewPass, passError, isUpdating, onUpdate
}) => {
  const { t } = useLanguage();

  return (
    <div className="glass-tech p-8 md:p-10 rounded-[2.5rem] border-white/5 space-y-8 shadow-xl">
      <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
        <Lock className="text-pink-500"/> {t('profile.security').split(' ')[0]} <span className="text-pink-500">{t('profile.security').split(' ')[1]}</span>
      </h3>
      <div className="space-y-6">
        <input 
          type="password" 
          value={oldPassword} 
          onChange={e => setOldPassword(e.target.value)} 
          className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-pink-500/50" 
          placeholder={t('profile.old_pass')} 
        />
        <input 
          type="password" 
          value={newPass} 
          onChange={e => setNewPass(e.target.value)} 
          className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-pink-500/50" 
          placeholder={t('profile.new_pass')} 
        />
        {passError && <p className="text-xs text-red-500 font-bold bg-red-500/10 p-3 rounded-xl border border-red-500/20">{passError}</p>}
        <button disabled={isUpdating} onClick={onUpdate} className="w-full py-4 bg-pink-600 rounded-2xl font-black uppercase text-xs shadow-lg flex items-center justify-center gap-2 transition-all">
          {isUpdating ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>} {t('profile.update_pass')}
        </button>
      </div>
    </div>
  );
};

export default SecuritySettings;
