
import React from 'react';
import { useLanguage } from '../../../i18n/LanguageContext';
import { Sparkles, Zap } from 'lucide-react';

interface ChatEmptyStateProps {
  onTemplateClick?: (prompt: string) => void;
}

const ChatEmptyState: React.FC<ChatEmptyStateProps> = ({ onTemplateClick }) => {
  const { t } = useLanguage();
  
  return (
    <div className="h-full flex flex-col items-center justify-center text-center p-6 md:p-10 space-y-12 animate-in fade-in duration-700">
      <div className="space-y-6">
        <div className="w-20 h-20 bg-pink-500/10 rounded-[2rem] border border-pink-500/20 flex items-center justify-center mx-auto text-pink-500 relative group transition-all duration-500 hover:scale-110">
          <div className="absolute inset-0 bg-pink-500/20 blur-2xl rounded-full animate-pulse"></div>
          <Sparkles size={40} className="relative z-10" />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter">
            {t('chat.empty_title')}
          </h3>
          <div className="flex items-center justify-center gap-2">
            <Zap size={12} className="text-pink-500 fill-pink-500" />
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">{t('chat.secure_uplink')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatEmptyState;
