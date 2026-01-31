
import React, { useState, useEffect, useCallback, useRef } from 'react';
import OrionEyes from './components/OrionEyes';
import OrionInput from './components/OrionInput';
import TerminalOutput from './components/TerminalOutput';
import LoginOverlay from './components/LoginOverlay';
import VoiceInterface from './components/VoiceInterface';
import { Message, OrionState, UserSession } from './types';
import { sendMessageToOrion } from './services/geminiService';
import { saveHistory, getHistory } from './services/memoryService';

const App: React.FC = () => {
  const [orionState, setOrionState] = useState<OrionState>(OrionState.UNAUTHENTICATED);
  const [user, setUser] = useState<UserSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  
  const stateResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Função central para mudança de estado temporária (Busca ou Alerta)
  const setTemporaryState = useCallback((state: OrionState, duration: number = 3000) => {
    if (stateResetTimerRef.current) clearTimeout(stateResetTimerRef.current);
    setOrionState(state);
    stateResetTimerRef.current = setTimeout(() => {
      const isFocused = document.activeElement?.tagName === 'TEXTAREA';
      setOrionState(isFocused ? OrionState.FOCUSED : OrionState.IDLE);
    }, duration);
  }, []);

  // Monitor de Erros Globais (Anomalias de Interface/Sistema)
  useEffect(() => {
    const handleError = () => setTemporaryState(OrionState.SYSTEM_ALERT, 3000);
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleError);
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleError);
    };
  }, [setTemporaryState]);

  // Persistência de Login
  useEffect(() => {
    const savedUser = localStorage.getItem('ORION_USER_SESSION');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      setMessages(getHistory(parsedUser.uid));
      setOrionState(OrionState.BOOTING);
    }
  }, []);

  const handleLogout = useCallback(() => {
    setOrionState(OrionState.AUTHENTICATING);
    setTimeout(() => {
      localStorage.removeItem('ORION_USER_SESSION');
      setUser(null);
      setMessages([]);
      setOrionState(OrionState.UNAUTHENTICATED);
    }, 1500);
  }, []);

  const handleLogin = (method: 'full' | 'guest', data?: any) => {
    setOrionState(OrionState.AUTHENTICATING);
    setTimeout(() => {
      const isGuest = method === 'guest';
      const userData: UserSession = !isGuest
        ? { uid: 'u-' + btoa(data.email).substr(0, 10), name: data.email.split('@')[0], email: data.email, isGuest: false }
        : { uid: 'guest-' + Date.now(), name: 'Visitante', email: '', isGuest: true };
      
      localStorage.setItem('ORION_USER_SESSION', JSON.stringify(userData));
      setUser(userData);
      setMessages(getHistory(userData.uid));
      setOrionState(OrionState.BOOTING);
    }, 1500);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || orionState === OrionState.PROCESSING || !user) return;
    
    const currentText = inputValue.trim();
    const systemKeywords = ['bateria', 'cpu', 'hardware', 'sistema', 'memória', 'status', 'info'];
    const isSystemQuery = systemKeywords.some(kw => currentText.toLowerCase().includes(kw));

    setInputValue('');
    
    // Se for busca de sistema, animação especial primeiro
    if (isSystemQuery) {
      setOrionState(OrionState.SYSTEM_SEARCHING);
      await new Promise(r => setTimeout(r, 1800));
    }

    setOrionState(OrionState.PROCESSING);
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: currentText, timestamp: Date.now() };
    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    
    try {
      const response = await sendMessageToOrion(user.uid, updatedHistory, currentText, [], undefined, user.isGuest);
      
      // Interceptador de Protocolo de Logout
      if (response.includes('[[LOGOUT]]')) {
        const cleanResponse = response.replace('[[LOGOUT]]', '').trim();
        setMessages(prev => [...prev, { id: 'logout-msg', role: 'model', content: cleanResponse, timestamp: Date.now() }]);
        setTimeout(handleLogout, 2500);
        return;
      }

      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', content: response, timestamp: Date.now() }]);
      setOrionState(OrionState.IDLE);
      saveHistory(user.uid, [...updatedHistory, { id: Date.now().toString(), role: 'model', content: response, timestamp: Date.now() }]);
    } catch (error) { 
      console.error("Critical Failure:", error);
      setTemporaryState(OrionState.SYSTEM_ALERT, 4000);
    }
  };

  useEffect(() => {
    if (orionState === OrionState.BOOTING && user) {
      const timer = setTimeout(() => setOrionState(OrionState.IDLE), 2500);
      return () => clearTimeout(timer);
    }
  }, [orionState, user]);

  return (
    <div className="h-screen w-screen bg-black text-zinc-200 flex flex-col relative overflow-hidden font-inter select-none">
      {orionState === OrionState.UNAUTHENTICATED && <LoginOverlay onLogin={handleLogin} />}
      {isVoiceMode && <VoiceInterface onClose={() => setIsVoiceMode(false)} isListening={true} />}

      <div className="flex-none flex items-center justify-center py-4 z-50">
        <div className="font-mono text-[10px] tracking-[1em] text-zinc-700 opacity-40">ORION_OS_v2.8_STABLE</div>
      </div>

      <div className="flex-none h-[180px] flex items-center justify-center relative z-20">
        <OrionEyes state={orionState} />
      </div>

      <div className="flex-1 min-h-0 w-full overflow-hidden flex flex-col items-center relative z-10 px-4">
        <TerminalOutput messages={messages} state={orionState} />
      </div>

      <div className={`flex-none w-full z-30 transition-all duration-700 ${orionState === OrionState.UNAUTHENTICATED ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'}`}>
        <div className="bg-black/90 backdrop-blur-xl border-t border-zinc-900/40 pb-10 pt-4">
          <div className="w-full max-w-2xl mx-auto px-8 flex items-center gap-6">
            <div className="flex-1">
               <OrionInput 
                 state={orionState} 
                 inputValue={inputValue} 
                 onInputChange={setInputValue} 
                 onInputSubmit={handleSendMessage} 
                 onInputFocus={() => { if(orionState === OrionState.IDLE) setOrionState(OrionState.FOCUSED_EMPTY); }} 
                 onInputBlur={() => { if(orionState === OrionState.FOCUSED_EMPTY || orionState === OrionState.FOCUSED) setOrionState(OrionState.IDLE); }} 
               />
            </div>
            <button onClick={() => setIsVoiceMode(true)} className="p-3 text-zinc-700 hover:text-white transition-all active:scale-90">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
            </button>
          </div>
          {user && (
            <div className="text-center mt-4 opacity-20">
               <span className="font-mono text-[7px] tracking-[0.4em] text-zinc-800 uppercase">
                 CORE_SYNC: {user.uid.slice(0,8)} // STATE: {orionState}
               </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
