
import React, { useRef } from 'react';
import { Image as ImageIcon, Send, X, Loader2, Square } from 'lucide-react';
import { useLanguage } from '../../../i18n/LanguageContext';

interface ChatInputProps {
  input: string;
  setInput: (s: string) => void;
  isGenerating: boolean;
  handleSend: () => void;
  handleStop?: () => void;
  selectedImage: { data: string; mimeType: string; preview: string } | null;
  setSelectedImage: (img: any) => void;
  handleImageSelect: (file: File) => void;
  executionQueue: string[];
}

const ChatInput: React.FC<ChatInputProps> = ({
  input, setInput, isGenerating, handleSend, handleStop, selectedImage, setSelectedImage, handleImageSelect, executionQueue
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useLanguage();

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageSelect(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const isQueued = executionQueue && executionQueue.length > 0;

  return (
    <div className="p-4 md:p-6 pb-28 md:pb-6 border-t border-white/5 bg-black/60 backdrop-blur-2xl">
      {selectedImage && (
        <div className="mb-4 relative w-20 h-20 rounded-xl overflow-hidden border border-pink-500/50 group animate-in zoom-in">
          <img src={selectedImage.preview} className="w-full h-full object-cover" alt="Selected" />
          <button onClick={() => setSelectedImage(null)} className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <X size={16} className="text-white"/>
          </button>
        </div>
      )}

      <div className={`
        flex items-center gap-3 md:gap-4 bg-white/5 border rounded-2xl p-1.5 md:p-2 transition-all
        ${isGenerating ? 'border-pink-500/40' : 'border-white/10 focus-within:border-pink-500/40'}
      `}>
         <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={onFileChange} />
         <button 
           disabled={isGenerating}
           onClick={() => fileInputRef.current?.click()} 
           className="p-2.5 md:p-3 text-zinc-500 hover:text-white transition-colors disabled:opacity-20"
         >
           <ImageIcon size={18}/>
         </button>

         <textarea 
           disabled={isGenerating}
           value={input} 
           onChange={e => setInput(e.target.value)} 
           onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())} 
           placeholder={isGenerating ? "Neural Core is processing..." : (isQueued ? "Waiting for next step..." : t('chat.placeholder'))} 
           className="flex-1 bg-transparent py-2.5 text-[13px] md:text-sm outline-none text-white resize-none max-h-32" 
           rows={1}
         />

         {isGenerating ? (
           <button 
             onClick={handleStop}
             className="p-3.5 md:p-4 bg-red-600 text-white rounded-xl active:scale-95 transition-all shadow-lg animate-in zoom-in"
             title="Stop Generation"
           >
             <Square size={16} fill="currentColor"/>
           </button>
         ) : (
           <button 
             onClick={handleSend} 
             disabled={!input.trim() && !selectedImage} 
             className="p-3.5 md:p-4 bg-pink-600 text-white rounded-xl active:scale-95 disabled:bg-zinc-800 disabled:text-zinc-600 transition-all shadow-lg"
           >
             <Send size={16}/>
           </button>
         )}
      </div>
    </div>
  );
};

export default ChatInput;
