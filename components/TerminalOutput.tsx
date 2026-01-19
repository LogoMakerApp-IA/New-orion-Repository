import React, { useEffect, useRef } from 'react';
import { Message } from '../types';

interface TerminalOutputProps {
  messages: Message[];
}

const TerminalOutput: React.FC<TerminalOutputProps> = ({ messages }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) return null;

  return (
    <div className="flex-1 w-full max-w-2xl overflow-y-auto px-6 py-4 space-y-6 mask-image-linear-gradient scroll-smooth">
      {messages.map((msg) => (
        <div 
          key={msg.id} 
          className={`flex flex-col ${msg.role === 'user' ? 'items-end' : msg.role === 'system' ? 'items-center my-2' : 'items-start'} opacity-0 animate-[fadeIn_0.5s_ease-out_forwards]`}
          style={{ animationFillMode: 'forwards' }}
        >
          <div 
            className={`max-w-[85%] font-mono text-sm leading-relaxed ${
              msg.role === 'user' 
                ? 'text-zinc-500 dark:text-zinc-500 text-right' 
                : msg.role === 'system'
                ? 'text-emerald-600/60 dark:text-emerald-500/50 text-[10px] uppercase tracking-[0.2em] select-none border border-emerald-900/10 dark:border-emerald-900/30 px-2 py-1 rounded bg-emerald-500/5 dark:bg-emerald-950/10'
                : 'text-zinc-800 dark:text-zinc-300 text-left'
            }`}
          >
             {msg.role === 'model' && <span className="mr-2 text-zinc-400 dark:text-zinc-600 select-none">::</span>}
             {msg.content}
          </div>
        </div>
      ))}
      <div ref={bottomRef} className="h-8" />
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .mask-image-linear-gradient {
          mask-image: linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%);
          -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 5%, black 95%, transparent 100%);
        }
      `}</style>
    </div>
  );
};

export default TerminalOutput;