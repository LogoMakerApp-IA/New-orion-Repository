import React, { useState } from 'react';
import { auth } from '../lib/firebase';
import { signInWithPopup, GoogleAuthProvider, signInAnonymously } from 'firebase/auth';

interface LoginOverlayProps {
  onLogin: (method: 'full' | 'guest', data?: any) => void;
}

const LoginOverlay: React.FC<LoginOverlayProps> = ({ onLogin }) => {
  const [view, setView] = useState<'selection'>('selection');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [error, setError] = useState('');

  const triggerBootSequence = (method: 'full' | 'guest', data?: any) => {
    setIsTransitioning(true);
    setTimeout(() => {
      onLogin(method, data);
    }, 1200);
  };

  const handleGoogleLogin = async () => {
    setError('');
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      const result = await signInWithPopup(auth, provider);
      triggerBootSequence('full', { email: result.user.email, uid: result.user.uid, name: result.user.displayName });
    } catch (err: any) {
      console.error("Login failure:", err);
      setError('FALHA DE AUTENTICAÇÃO: ' + err.message);
    }
  };

  const handleGuestLogin = async () => {
    setError('');
    try {
      const result = await signInAnonymously(auth);
      triggerBootSequence('guest', { uid: result.user.uid });
    } catch (err: any) {
      console.error("Guest login failure:", err);
      setError('FALHA NO ACESSO TEMPORÁRIO: ' + err.message);
    }
  };

  return (
    <div className={`fixed inset-0 z-[100] bg-black flex flex-col items-center justify-between py-12 px-8 transition-all duration-1000 ${isTransitioning ? 'scale-110 blur-2xl opacity-0' : 'opacity-100'}`}>
      <style>{`
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        @keyframes glitch-flicker {
          0% { opacity: 1; transform: scaleY(1); }
          5% { opacity: 0.5; transform: scaleY(1.1); }
          10% { opacity: 1; transform: scaleY(1); }
          15% { opacity: 0.8; transform: scaleY(0.9); }
          20% { opacity: 1; transform: scaleY(1); }
        }
        .quantum-collapse {
          animation: glitch-flicker 0.4s ease-in-out forwards;
        }
        .scanline-effect {
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, transparent, rgba(255,255,255,0.05), transparent);
          height: 10px;
          width: 100%;
          pointer-events: none;
          animation: scanline 4s linear infinite;
        }
      `}</style>

      <div className="scanline-effect" />

      {/* Header Navigation */}
      <div className={`w-full flex justify-between items-center max-w-md transition-all duration-700 ${isTransitioning ? 'opacity-0 -translate-y-20' : ''}`}>
        <div className="w-10"></div>
        <div className="font-mono text-[10px] tracking-[0.4em] text-white/60 uppercase">ORION_OS</div>
        <div className="w-10"></div>
      </div>

      {/* Central Visual Element */}
      <div className={`flex flex-col items-center flex-1 justify-center w-full max-w-md transition-all duration-1000 ${isTransitioning ? 'scale-0 rotate-180 opacity-0' : ''}`}>
        <div className="flex gap-10 mb-20 relative">
          <div className="w-12 h-[1px] bg-white/40 shadow-[0_0_10px_white]"></div>
          <div className="w-12 h-[1px] bg-white/40 shadow-[0_0_10px_white]"></div>
          {isTransitioning && <div className="absolute inset-0 bg-white blur-xl animate-ping"></div>}
        </div>

        <div className="w-full space-y-8 animate-[fadeIn_0.5s_ease-out]">
          <button
            onClick={handleGoogleLogin}
            className="w-full py-4 border border-zinc-800 hover:border-zinc-400 text-zinc-400 hover:text-white font-mono text-xs tracking-[0.2em] transition-all duration-500 bg-transparent group relative overflow-hidden"
          >
            <span className="relative z-10">[ VINCULAR_IDENTIDADE_GOOGLE ]</span>
            <div className="absolute inset-0 bg-white/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
          </button>

          <button
            onClick={handleGuestLogin}
            className="w-full py-4 border border-zinc-900 hover:border-zinc-700 text-zinc-600 hover:text-zinc-400 font-mono text-[10px] tracking-[0.2em] transition-all duration-500 bg-transparent"
          >
            [ ACESSO_TEMPORAL_CONVIDADO ]
          </button>
          
          {error && <div className="text-red-500 font-mono text-[9px] text-center animate-pulse tracking-widest uppercase mt-4">{error}</div>}
        </div>
      </div>

      {/* Footer Links */}
      <div className={`w-full max-w-md flex flex-col items-center space-y-5 pt-8 transition-all duration-700 ${isTransitioning ? 'opacity-0 translate-y-20' : ''}`}>
        <div className="w-32 h-[4px] bg-zinc-900 rounded-full mt-6"></div>
      </div>
    </div>
  );
};

export default LoginOverlay;