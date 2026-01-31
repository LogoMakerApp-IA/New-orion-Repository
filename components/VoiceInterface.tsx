
import React from 'react';
import Visualizer from './Visualizer';

interface VoiceInterfaceProps {
  onClose: () => void;
  isListening: boolean;
}

const VoiceInterface: React.FC<VoiceInterfaceProps> = ({ onClose, isListening }) => {
  return (
    <div className="fixed inset-0 bg-black z-[150] flex flex-col items-center justify-between py-16 animate-[fadeIn_0.5s_ease-out]">
      {/* Top Header */}
      <div className="w-full flex justify-center pt-4">
        <h2 className="font-mono text-xl tracking-[0.4em] text-white opacity-90">ORION</h2>
      </div>

      {/* Central Content */}
      <div className="flex flex-col items-center space-y-12">
        <Visualizer isListening={isListening} />
        <div className="font-mono text-[10px] tracking-[0.5em] text-zinc-500 uppercase animate-pulse">
          {isListening ? 'LISTENING...' : 'Sincronizando Núcleo...'}
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="w-full max-w-sm px-8 space-y-8">
        <div className="flex items-center justify-between text-white/80">
          <button className="p-4 hover:text-white transition-colors opacity-60">
             <span className="text-2xl font-mono">⌘</span>
          </button>
          
          <div className="relative">
             <div className="absolute inset-0 bg-white/10 rounded-full blur-xl animate-pulse"></div>
             <button className="relative p-4 text-white">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                  <line x1="12" y1="19" x2="12" y2="22"/>
                </svg>
             </button>
          </div>

          <button onClick={onClose} className="p-4 hover:text-white transition-colors opacity-60">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <div className="h-[1px] w-full bg-zinc-800"></div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
};

export default VoiceInterface;
