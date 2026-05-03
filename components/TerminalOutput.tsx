
import React, { useEffect, useRef, useState } from 'react';
import { Message, OrionState } from '../types';

interface TerminalOutputProps {
  messages: Message[];
  state: OrionState;
  onPlayAudio?: (text: string) => Promise<void>;
}

const TerminalOutput: React.FC<TerminalOutputProps> = ({ messages, state, onPlayAudio }) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const [loadingMessageId, setLoadingMessageId] = useState<string | null>(null);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = (id: string) => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
    }
    setHoveredMessageId(id);
  };

  const handleMouseLeave = () => {
    hoverTimerRef.current = setTimeout(() => {
      setHoveredMessageId(null);
    }, 2000); // 2 second delay
  };

  const handlePlayAudio = async (id: string, text: string) => {
    if (!onPlayAudio) return;
    setLoadingMessageId(id);
    try {
      await onPlayAudio(text);
    } finally {
      setLoadingMessageId(null);
    }
  };

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, state]);

  const formatContent = (content: string) => {
    if (content.includes('[NÚCLEO DE TELEMETRIA') || content.includes('REPORT') || content.includes('::')) {
      return (
        <div className="bg-zinc-900/40 p-3 rounded border-l-2 border-zinc-500/30 font-mono text-[13px]">
          {content.split('\n').map((line, i) => (
            <div key={i} className={line.startsWith('-') ? 'pl-4 text-zinc-500' : 'text-zinc-300'}>
              {line}
            </div>
          ))}
        </div>
      );
    }
    return content;
  };

  return (
    <div 
      ref={containerRef}
      className="h-full w-full max-w-2xl overflow-y-auto px-6 py-4 space-y-6 scroll-smooth scrollbar-hide"
    >
      {messages.map((msg) => (
        <div 
          key={msg.id} 
          className={`flex flex-col ${msg.role === 'user' ? 'items-end' : msg.role === 'system' ? 'items-center my-2' : 'items-start'} opacity-0 animate-[fadeIn_0.4s_ease-out_forwards]`}
        >
          <div 
            className={`group relative max-w-[85%] font-mono text-sm leading-relaxed whitespace-pre-wrap ${
              msg.role === 'user' 
                ? 'text-zinc-500 text-right italic' 
                : msg.role === 'system'
                ? 'text-emerald-500/50 text-[10px] uppercase tracking-[0.2em] select-none border border-emerald-900/30 px-2 py-1 rounded bg-emerald-950/10'
                : 'text-zinc-300 text-left'
            }`}
             onMouseEnter={() => handleMouseEnter(msg.id)}
             onMouseLeave={handleMouseLeave}
          >
             {msg.role === 'model' && <span className="mr-2 text-zinc-600 select-none font-bold">::</span>}
             {formatContent(msg.content)}
             
             {msg.role === 'model' && (hoveredMessageId === msg.id || loadingMessageId === msg.id) && onPlayAudio && (
               <button
                 onClick={() => handlePlayAudio(msg.id, msg.content)}
                 disabled={loadingMessageId === msg.id}
                 className={`absolute -right-10 top-0 p-1.5 rounded transition-all shadow border ${
                   loadingMessageId === msg.id 
                     ? 'bg-zinc-800 text-zinc-300 border-zinc-500 cursor-not-allowed'
                     : 'bg-zinc-800/50 text-zinc-400 hover:text-white hover:bg-zinc-700/80 border-zinc-700/50'
                 }`}
                 title="Ouvir Resposta"
               >
                 {loadingMessageId === msg.id ? (
                   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
                     <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
                   </svg>
                 ) : (
                   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                     <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                     <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                     <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                   </svg>
                 )}
               </button>
             )}
          </div>
        </div>
      ))}

      {state === OrionState.PROCESSING && (
        <div className="flex flex-col items-start animate-pulse mb-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-white/5 border border-white/5">
            <div className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" />
            <span className="font-mono text-[10px] tracking-[0.2em] text-zinc-500 uppercase">Analizando_Fluxo...</span>
          </div>
        </div>
      )}
      
      <div ref={bottomRef} className="h-4 flex-none" />
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default TerminalOutput;
