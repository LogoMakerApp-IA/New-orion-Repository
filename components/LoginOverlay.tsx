import React, { useState, useEffect } from 'react';

interface LoginOverlayProps {
  onLogin: (method: 'full' | 'guest', data?: any) => void;
}

const LoginOverlay: React.FC<LoginOverlayProps> = ({ onLogin }) => {
  const [view, setView] = useState<'selection' | 'login' | 'register'>('selection');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');

  const getRegisteredUsers = () => {
    const users = localStorage.getItem('ORION_REGISTERED_USERS');
    return users ? JSON.parse(users) : [];
  };

  const triggerBootSequence = (method: 'full' | 'guest', data?: any) => {
    setIsTransitioning(true);
    // Tempo para a animação de colapso visual antes de chamar o onLogin do App
    setTimeout(() => {
      onLogin(method, data);
    }, 1200);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const users = getRegisteredUsers();
    const user = users.find((u: any) => u.email === formData.email && u.password === formData.password);
    if (!user) {
      setError('CONTA NÃO ENCONTRADA OU CREDENCIAIS INVÁLIDAS.');
      return;
    }
    triggerBootSequence('full', { email: user.email });
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!formData.email || !formData.password || !formData.confirmPassword) {
      setError('CAMPOS OBRIGATÓRIOS AUSENTES.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('AS SENHAS NÃO COINCIDEM.');
      return;
    }
    const users = getRegisteredUsers();
    if (users.find((u: any) => u.email === formData.email)) {
      setError('ESTA IDENTIDADE JÁ ESTÁ VINCULADA.');
      return;
    }
    const newUser = { email: formData.email, password: formData.password };
    localStorage.setItem('ORION_REGISTERED_USERS', JSON.stringify([...users, newUser]));
    triggerBootSequence('full', { email: formData.email });
  };

  const resetForm = () => {
    setFormData({ email: '', password: '', confirmPassword: '' });
    setError('');
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
        <button 
          onClick={() => {
            if (view === 'login') setView('selection');
            else if (view === 'register') setView('login');
            resetForm();
          }}
          className={`p-2 transition-opacity duration-300 ${view !== 'selection' ? 'opacity-100 cursor-pointer' : 'opacity-0 cursor-default pointer-events-none'}`}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        
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

        {view === 'selection' ? (
          <div className="w-full space-y-8 animate-[fadeIn_0.5s_ease-out]">
            <button
              onClick={() => setView('login')}
              className="w-full py-4 border border-zinc-800 hover:border-zinc-400 text-zinc-400 hover:text-white font-mono text-xs tracking-[0.2em] transition-all duration-500 bg-transparent group relative overflow-hidden"
            >
              <span className="relative z-10">[ VINCULAR_IDENTIDADE_GOOGLE ]</span>
              <div className="absolute inset-0 bg-white/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
            </button>

            <button
              onClick={() => triggerBootSequence('guest')}
              className="w-full py-4 border border-zinc-900 hover:border-zinc-700 text-zinc-600 hover:text-zinc-400 font-mono text-[10px] tracking-[0.2em] transition-all duration-500 bg-transparent"
            >
              [ ACESSO_TEMPORAL_CONVIDADO ]
            </button>
          </div>
        ) : view === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="w-full space-y-12 animate-[slideUp_0.4s_ease-out]">
            <div className="space-y-10">
              <input 
                type="email"
                required
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                className="w-full bg-transparent border-b border-zinc-800 focus:border-white outline-none py-4 font-mono text-sm text-white transition-colors placeholder:text-zinc-700"
                placeholder="Email"
                autoComplete="off"
              />
              <input 
                type="password"
                required
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                className="w-full bg-transparent border-b border-zinc-800 focus:border-white outline-none py-4 font-mono text-sm text-white transition-colors placeholder:text-zinc-700"
                placeholder="Password"
              />
            </div>

            {error && <div className="text-red-500 font-mono text-[9px] text-center animate-pulse tracking-widest uppercase">{error}</div>}

            <button
              type="submit"
              className="w-full py-4 border border-white hover:bg-white hover:text-black text-white font-mono text-sm tracking-[0.3em] transition-all duration-300 relative group overflow-hidden"
            >
              <span className="relative z-10">LOGIN</span>
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 scale-0 group-hover:scale-150 transition-all duration-700 rounded-full"></div>
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit} className="w-full space-y-10 animate-[slideUp_0.4s_ease-out]">
            <div className="space-y-6">
              <input 
                type="email"
                required
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                className="w-full bg-transparent border-b border-zinc-800 focus:border-white outline-none py-3 font-mono text-sm text-white transition-colors placeholder:text-zinc-700"
                placeholder="Novo Email"
              />
              <input 
                type="password"
                required
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                className="w-full bg-transparent border-b border-zinc-800 focus:border-white outline-none py-3 font-mono text-sm text-white transition-colors placeholder:text-zinc-700"
                placeholder="Senha"
              />
              <input 
                type="password"
                required
                value={formData.confirmPassword}
                onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                className="w-full bg-transparent border-b border-zinc-800 focus:border-white outline-none py-3 font-mono text-sm text-white transition-colors placeholder:text-zinc-700"
                placeholder="Confirmar Senha"
              />
            </div>

            {error && <div className="text-red-500 font-mono text-[9px] text-center animate-pulse tracking-widest uppercase">{error}</div>}

            <button
              type="submit"
              className="w-full py-4 border border-white hover:bg-white hover:text-black text-white font-mono text-sm tracking-[0.3em] transition-all duration-300"
            >
              CREATE_ACCOUNT
            </button>
          </form>
        )}
      </div>

      {/* Footer Links */}
      <div className={`w-full max-w-md flex flex-col items-center space-y-5 pt-8 transition-all duration-700 ${isTransitioning ? 'opacity-0 translate-y-20' : ''}`}>
        {view === 'login' && (
          <>
            <button type="button" className="font-mono text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors tracking-wide">
              Forgot Password?
            </button>
            <div className="font-mono text-[10px] text-zinc-600 tracking-wide">
              New to Orion? <button type="button" onClick={() => { setView('register'); resetForm(); }} className="text-zinc-400 hover:text-white font-bold ml-1 transition-colors">Create Account</button>
            </div>
          </>
        )}

        {view === 'register' && (
           <div className="font-mono text-[10px] text-zinc-600 tracking-wide">
             Already has an account? <button type="button" onClick={() => { setView('login'); resetForm(); }} className="text-zinc-400 hover:text-white font-bold ml-1 transition-colors">Login</button>
           </div>
        )}
        
        <div className="w-32 h-[4px] bg-zinc-900 rounded-full mt-6"></div>
      </div>
    </div>
  );
};

export default LoginOverlay;