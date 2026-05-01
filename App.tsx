
import React, { useState, useEffect, useCallback, useRef } from 'react';
import OrionEyes from './components/OrionEyes';
import OrionInput from './components/OrionInput';
import TerminalOutput from './components/TerminalOutput';
import LoginOverlay from './components/LoginOverlay';
import VoiceInterface from './components/VoiceInterface';
import OrionShell from './components/OrionShell';
import { Message, OrionState, UserSession } from './types';
import { sendMessageToOrion } from './services/geminiService';
import { saveMessageToHistory, getHistory } from './services/memoryService';
import { auth } from './lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

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

  // Persistência de Login via Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const isGuest = firebaseUser.isAnonymous;
        const userData: UserSession = { 
          uid: firebaseUser.uid, 
          name: firebaseUser.displayName || 'Visitante', 
          email: firebaseUser.email || '', 
          isGuest 
        };
        setUser(userData);
        const history = await getHistory(firebaseUser.uid);
        setMessages(history || []);
        if (orionState === OrionState.UNAUTHENTICATED || orionState === OrionState.AUTHENTICATING) {
          setOrionState(OrionState.BOOTING);
        }
      } else {
        setUser(null);
        setMessages([]);
        setOrionState(OrionState.UNAUTHENTICATED);
      }
    });

    return () => unsubscribe();
  }, [orionState]);

  const handleLogout = useCallback(() => {
    setOrionState(OrionState.AUTHENTICATING);
    setTimeout(async () => {
      await signOut(auth);
      // O onAuthStateChanged cuidará de limpar o estado
    }, 1500);
  }, []);

  const handleLogin = (method: 'full' | 'guest', data?: any) => {
    setOrionState(OrionState.AUTHENTICATING);
    // Aqui não precisamos setar localStorage, o onAuthStateChanged fará o trabalho
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || orionState === OrionState.PROCESSING || orionState === OrionState.SYSTEM_SEARCHING || !user) return;
    
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
    // Salvar async no Firebase
    await saveMessageToHistory(user.uid, userMsg);
    
    // Timeout de segurança (15s) para evitar travamento
    const safetyTimeout = setTimeout(() => {
      setOrionState(OrionState.IDLE);
      console.warn("Orion safety timeout acionado.");
    }, 15000);

    try {
      const response = await sendMessageToOrion(user.uid, updatedHistory, currentText, [], undefined, user.isGuest);
      
      // Interceptador de Protocolo de Logout
      if (response.includes('[[LOGOUT]]')) {
        const cleanResponse = response.replace('[[LOGOUT]]', '').trim();
        const modelLogoutMsg: Message = { id: 'logout-msg', role: 'model', content: cleanResponse, timestamp: Date.now() };
        setMessages(prev => [...prev, modelLogoutMsg]);
        await saveMessageToHistory(user.uid, modelLogoutMsg);
        setTimeout(handleLogout, 2500);
        return; // Retorna para não setar outras coisas
      }

      const modelMsg: Message = { id: Date.now().toString(), role: 'model', content: response, timestamp: Date.now() };
      setMessages(prev => [...prev, modelMsg]);
      await saveMessageToHistory(user.uid, modelMsg);
    } catch (error) { 
      console.error("Critical Failure:", error);
      setTemporaryState(OrionState.SYSTEM_ALERT, 4000);
    } finally {
      clearTimeout(safetyTimeout);
      setOrionState(prev => (prev === OrionState.AUTHENTICATING || prev === OrionState.SYSTEM_ALERT) ? prev : OrionState.IDLE);
    }
  };

  // Logs para fins de debug
  useEffect(() => {
    console.log("Estado atual:", orionState);
  }, [orionState]);

  useEffect(() => {
    if (orionState === OrionState.BOOTING && user) {
      const timer = setTimeout(() => setOrionState(OrionState.IDLE), 2500);
      return () => clearTimeout(timer);
    }
  }, [orionState, user]);

  return (
    <OrionShell state={orionState} isLoggedIn={!!user}>
      {orionState === OrionState.UNAUTHENTICATED && <LoginOverlay onLogin={handleLogin} />}
      {isVoiceMode && <VoiceInterface onClose={() => setIsVoiceMode(false)} isListening={true} />}

      {!user ? (
         <div className="flex-none flex items-center justify-center py-4 z-50 absolute top-4 inset-x-0">
           <div className="font-mono text-[10px] tracking-[1em] text-zinc-700 opacity-40">ORION_OS_v2.8_STABLE</div>
         </div>
      ) : null}

      <div className={`flex-none transition-all duration-700 flex items-center justify-center relative z-20 ${user ? 'h-[140px] md:h-[180px] shrink-0' : 'h-[180px] mt-20'}`}>
        <OrionEyes state={orionState} />
      </div>

      <div className="flex-1 min-h-0 w-full flex flex-col items-center relative z-10 md:px-8">
        <TerminalOutput messages={messages} state={orionState} />
      </div>

      <div className={`flex-none w-full z-30 transition-all duration-700 ${orionState === OrionState.UNAUTHENTICATED ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'}`}>
        <div className="bg-gradient-to-t from-black via-black/90 to-transparent pt-12 pb-6 md:pb-8">
          <div className="w-full max-w-3xl mx-auto px-4 md:px-8 flex items-end gap-4">
            <div className="flex-1 bg-black rounded-3xl border border-zinc-900/60 shadow-lg overflow-hidden px-5 py-1">
               <OrionInput 
                 state={orionState} 
                 inputValue={inputValue} 
                 onInputChange={setInputValue} 
                 onInputSubmit={handleSendMessage} 
                 onInputFocus={() => { if(orionState === OrionState.IDLE) setOrionState(OrionState.FOCUSED_EMPTY); }} 
                 onInputBlur={() => { if(orionState === OrionState.FOCUSED_EMPTY || orionState === OrionState.FOCUSED) setOrionState(OrionState.IDLE); }} 
               />
            </div>
            <button 
              onClick={() => setIsVoiceMode(true)} 
              className="flex-none h-14 w-14 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 hover:border-zinc-700 transition-all active:scale-95 shadow-lg"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
            </button>
          </div>
          {user && (
            <div className="text-center mt-4 opacity-30 select-none">
               <span className="font-mono text-[8px] tracking-[0.4em] text-zinc-500 uppercase">
                 CORE_SYNC: {user.uid.slice(0,8)} | STATE: {orionState}
               </span>
            </div>
          )}
        </div>
      </div>
    </OrionShell>
  );
};

export default App;

