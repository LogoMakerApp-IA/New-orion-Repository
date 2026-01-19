import React, { useRef } from 'react';
import { OrionState, PendingAction } from '../types';

interface OrionInputProps {
  state: OrionState;
  inputValue: string;
  onInputChange: (value: string) => void;
  onInputSubmit: () => void;
  onInputFocus: () => void;
  onInputBlur: () => void;
  pendingAction?: PendingAction | null;
  onPermissionDecide?: (allowed: boolean) => void;
  onToggleFilter?: () => void;
  isFilterActive?: boolean;
}

const OrionInput: React.FC<OrionInputProps> = ({ 
  state, 
  inputValue, 
  onInputChange, 
  onInputSubmit,
  onInputFocus,
  onInputBlur,
  pendingAction,
  onPermissionDecide,
  onToggleFilter,
  isFilterActive
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onInputSubmit();
    }
  };

  return (
      <div className="w-full max-w-2xl flex flex-col items-center justify-center relative group min-h-[60px] px-4 transition-all duration-500">
        <style>{`
          @keyframes cursor-blink-terminal {
            0%, 100% { opacity: 1; }
            50% { opacity: 0; }
          }
          .animate-cursor-terminal {
            animation: cursor-blink-terminal 1.2s steps(2, start) infinite;
          }
        `}</style>
        
        {state === OrionState.AWAITING_PERMISSION && pendingAction ? (
           <div className="flex flex-col items-center w-full animate-[fadeIn_0.3s_ease-out]">
              <div className="text-amber-600 dark:text-amber-500 font-mono text-xs tracking-widest mb-4 uppercase text-center max-w-xs">
                 Permissão Requerida: {pendingAction.description}
              </div>
              <div className="flex gap-4">
                 <button 
                   onClick={() => onPermissionDecide && onPermissionDecide(false)}
                   className="px-6 py-2 border border-red-500/30 dark:border-red-900/50 text-red-600/80 dark:text-red-500/80 hover:bg-red-500/10 dark:hover:bg-red-900/20 hover:text-red-500 dark:hover:text-red-400 font-mono text-xs tracking-wider transition-all rounded"
                 >
                    NEGAR
                 </button>
                 <button 
                   onClick={() => onPermissionDecide && onPermissionDecide(true)}
                   className="px-6 py-2 bg-amber-500/10 dark:bg-amber-600/10 border border-amber-500/40 dark:border-amber-600/50 text-amber-600 dark:text-amber-500 hover:bg-amber-500/20 dark:hover:bg-amber-600/20 hover:text-amber-500 dark:hover:text-amber-400 font-mono text-xs tracking-wider transition-all rounded shadow-[0_0_15px_rgba(245,158,11,0.1)] dark:shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                 >
                    AUTORIZAR
                 </button>
              </div>
           </div>
        ) : (
          <>
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => onInputChange(e.target.value)}
              onFocus={onInputFocus}
              onBlur={onInputBlur}
              onKeyDown={handleKeyDown}
              disabled={state === OrionState.PROCESSING}
              className="absolute inset-0 w-full h-full opacity-0 cursor-text z-20"
              autoComplete="off"
            />

            {/* Linha de status/input */}
            <div 
              className={`
                h-[1px] transition-all duration-700 ease-in-out relative
                ${state === OrionState.SLEEPING ? 'w-16 opacity-20 bg-zinc-400 dark:bg-zinc-700' : 'w-24 opacity-60 bg-zinc-500 dark:bg-zinc-600'}
                ${state === OrionState.FOCUSED || state === OrionState.FOCUSED_EMPTY ? '!w-full max-w-[600px] !opacity-100 !bg-zinc-800 dark:!bg-zinc-400 shadow-[0_0_10px_rgba(0,0,0,0.1)] dark:shadow-[0_0_10px_rgba(255,255,255,0.15)]' : ''}
                ${state === OrionState.PROCESSING ? 'w-12 opacity-50 bg-zinc-900 dark:bg-white animate-pulse' : ''}
                ${state === OrionState.SYSTEM_ALERT ? 'w-full max-w-[200px] bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)]' : ''}
              `}
            />
            
            <div className="flex items-center justify-between w-full max-w-[600px] mt-4 relative">
                {/* Texto Input com cursor personalizado */}
                <div className={`
                  font-mono text-sm tracking-widest text-zinc-800 dark:text-zinc-300 transition-opacity duration-300 flex-1 overflow-hidden
                  ${state === OrionState.FOCUSED || state === OrionState.FOCUSED_EMPTY ? 'opacity-100' : 'opacity-0'}
                `}>
                  <span className="text-zinc-400 dark:text-zinc-600 mr-2">{'>'}</span>
                  {inputValue}
                  <span className="animate-cursor-terminal inline-block w-2.5 h-4 bg-zinc-800 dark:bg-zinc-400 align-middle ml-0.5"></span>
                </div>

                {/* Botão de Filtro Discreto */}
                <button 
                  onClick={onToggleFilter}
                  className={`
                    ml-4 p-1 rounded transition-all duration-300 z-30
                    ${isFilterActive ? 'text-zinc-600 dark:text-zinc-400 bg-zinc-200 dark:bg-zinc-800/50' : 'text-zinc-400 dark:text-zinc-700 hover:text-zinc-600 dark:hover:text-zinc-500'}
                    ${state === OrionState.FOCUSED || state === OrionState.FOCUSED_EMPTY ? 'opacity-100' : 'opacity-0 pointer-events-none'}
                  `}
                  title="Filtrar Notificações de Sistema"
                >
                   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                     <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                   </svg>
                </button>
            </div>
          </>
        )}
      </div>
  );
};

export default OrionInput;