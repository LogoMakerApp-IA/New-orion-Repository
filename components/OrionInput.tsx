
import React, { useRef, useEffect } from 'react';
import { OrionState, PendingAction } from '../types';

interface OrionInputProps {
  state: OrionState;
  inputValue: string;
  onInputChange: (value: string) => void;
  onInputSubmit: () => void;
  onInputFocus: () => void;
  onInputBlur: () => void;
  pendingAction?: PendingAction | null;
}

const OrionInput: React.FC<OrionInputProps> = ({ 
  state, 
  inputValue, 
  onInputChange, 
  onInputSubmit,
  onInputFocus,
  onInputBlur,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onInputSubmit();
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [inputValue]);

  return (
      <div className="w-full relative flex flex-col items-center">
        <style>{`
          .terminal-input {
            caret-color: #fff;
            scrollbar-width: none;
            text-shadow: 0 0 2px rgba(255,255,255,0.2);
          }
          .terminal-input::-webkit-scrollbar { display: none; }
          .terminal-input:focus {
            color: #fff;
          }
        `}</style>
        
        <textarea
          ref={textareaRef}
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onFocus={onInputFocus}
          onBlur={onInputBlur}
          onKeyDown={handleKeyDown}
          disabled={state === OrionState.PROCESSING || state === OrionState.BOOTING}
          rows={1}
          className="w-full bg-transparent border-none outline-none font-mono text-sm tracking-[0.2em] text-zinc-300 transition-colors py-4 resize-none terminal-input placeholder:text-zinc-800"
          autoComplete="off"
          placeholder="TYPE_COMMAND_"
        />
        
        <div className={`w-full h-[1px] transition-all duration-700 ${state === OrionState.FOCUSED ? 'bg-zinc-500 shadow-[0_0_10px_white]' : 'bg-zinc-900'}`} />
      </div>
  );
};

export default OrionInput;
