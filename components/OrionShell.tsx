import React from 'react';
import { OrionState } from '../types';

interface OrionShellProps {
  children: React.ReactNode;
  state: OrionState;
  isLoggedIn: boolean;
}

const OrionShell: React.FC<OrionShellProps> = ({ children, state, isLoggedIn }) => {
  return (
    <div className="h-screen w-screen bg-[#050505] text-zinc-200 flex justify-center items-center font-inter select-none overflow-hidden relative">
      {/* Background ambient effect based on state */}
      <div 
        className={`absolute inset-0 transition-opacity duration-1000 pointer-events-none ${
          state === OrionState.PROCESSING || state === OrionState.SYSTEM_SEARCHING 
            ? 'opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-800 via-transparent to-transparent' 
            : 'opacity-0'
        }`}
      />

      <div className={`
        relative w-full h-full 
        md:h-[95vh] md:w-[95vw] md:max-w-5xl md:border md:border-zinc-900/50 md:rounded-3xl md:shadow-2xl md:shadow-black/50
        flex flex-col overflow-hidden bg-black
        transition-all duration-700 ease-in-out
      `}>
        {/* Navigation/Header Bar for Desktop feel */}
        {isLoggedIn && (
           <header className="flex-none h-14 border-b border-zinc-900/40 flex items-center justify-between px-6 z-40 bg-black/50 backdrop-blur-md">
             <div className="flex items-center gap-3">
               <div className={`w-2 h-2 rounded-full ${state === OrionState.SYSTEM_ALERT ? 'bg-red-500 animate-pulse' : state === OrionState.PROCESSING ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-600'}`} />
               <span className="font-mono text-[10px] tracking-[0.3em] text-zinc-500 uppercase">Orion_Web_Core</span>
             </div>
             <div className="font-mono text-[10px] tracking-widest text-zinc-700">STATUS: {state.replace('_', ' ')}</div>
           </header>
        )}

        {/* Main Content Area */}
        <main className="flex-1 relative flex flex-col min-h-0">
          {children}
        </main>

      </div>
    </div>
  );
};

export default OrionShell;
