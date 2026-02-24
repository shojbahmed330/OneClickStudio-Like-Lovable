
import React, { useState } from 'react';
import { Languages, ChevronDown } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { Language } from '../i18n/translations';

const LanguageSelector: React.FC = () => {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const langs: { id: Language, label: string, flag: string }[] = [
    { id: 'en', label: 'English', flag: '🇺🇸' },
    { id: 'bn', label: 'বাংলা', flag: '🇧🇩' },
    { id: 'hi', label: 'हिन्दी', flag: '🇮🇳' }
  ];

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all active:scale-95 group"
      >
        <Languages size={14} className="text-pink-500 group-hover:rotate-12 transition-transform"/>
        <span className="text-[10px] font-black uppercase text-zinc-400">
          {langs.find(l => l.id === language)?.label}
        </span>
        <ChevronDown size={12} className={`text-zinc-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[100]" onClick={() => setIsOpen(false)}></div>
          <div className="absolute right-0 mt-2 w-32 glass-tech border-white/10 rounded-2xl overflow-hidden z-[110] shadow-2xl animate-in fade-in zoom-in duration-200">
            {langs.map(l => (
              <button
                key={l.id}
                onClick={() => {
                  setLanguage(l.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-3 text-[10px] font-black uppercase transition-all ${language === l.id ? 'bg-pink-600 text-white' : 'text-zinc-400 hover:bg-white/5 hover:text-white'}`}
              >
                <span>{l.label}</span>
                <span>{l.flag}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default LanguageSelector;
