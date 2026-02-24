
import React from 'react';
import MessageList from './chat/MessageList';
import ChatInput from './chat/ChatInput';
import ChatEmptyState from './chat/ChatEmptyState';
import { BuilderPhase } from '../../types';

interface ChatBoxProps {
  messages: any[];
  input: string;
  setInput: (s: string) => void;
  isGenerating: boolean;
  currentAction?: string | null;
  handleSend: (extraData?: string) => void;
  handleStop?: () => void;
  mobileTab: 'chat' | 'preview';
  selectedImage: { data: string; mimeType: string; preview: string } | null;
  setSelectedImage: (img: any) => void;
  handleImageSelect: (file: File) => void;
  executionQueue: string[];
  waitingForApproval?: boolean;
  phase: BuilderPhase;
}

const ChatBox: React.FC<ChatBoxProps> = ({ 
  messages, input, setInput, isGenerating, currentAction, handleSend, handleStop, mobileTab,
  selectedImage, setSelectedImage, handleImageSelect, executionQueue,
  waitingForApproval, phase
}) => {
  return (
    <section className={`w-full lg:w-[500px] xl:w-[560px] border-r border-white/5 flex flex-col bg-[#09090b] h-full relative transition-all duration-700 ${mobileTab === 'preview' ? 'hidden lg:flex' : 'flex'}`}>
      <div className="flex-1 flex flex-col overflow-hidden relative shadow-[30px_0_60px_rgba(0,0,0,0.4)] z-10">
        {messages.length > 0 ? (
          <MessageList 
            messages={messages} 
            isGenerating={isGenerating} 
            currentAction={currentAction}
            handleSend={handleSend} 
            waitingForApproval={waitingForApproval}
            phase={phase}
          />
        ) : (
          <div className="flex-1 overflow-y-auto">
            <ChatEmptyState onTemplateClick={(prompt) => {
              setInput(prompt);
              // Wait for state to settle then send
              setTimeout(() => handleSend(), 100);
            }} />
          </div>
        )}
      </div>

      <ChatInput 
        input={input}
        setInput={setInput}
        isGenerating={isGenerating}
        handleSend={() => handleSend()}
        handleStop={handleStop}
        selectedImage={selectedImage}
        setSelectedImage={setSelectedImage}
        handleImageSelect={handleImageSelect}
        executionQueue={executionQueue}
      />
    </section>
  );
};

export default ChatBox;
