
import React, { useState, useEffect, useCallback, useRef } from 'react';
import OrionEyes from './components/OrionEyes';
import OrionInput from './components/OrionInput';
import TerminalOutput from './components/TerminalOutput';
import LoginOverlay from './components/LoginOverlay';
import VoiceInterface from './components/VoiceInterface';
import OrionShell from './components/OrionShell';
import { Message, OrionState, UserSession } from './types';
import { sendMessageToOrion, generateOrionSpeech } from './services/geminiService';
import { saveMessageToHistory, getHistory, saveHistory } from './services/memoryService';
import { auth } from './lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

const App: React.FC = () => {
  const [orionState, setOrionState] = useState<OrionState>(OrionState.UNAUTHENTICATED);
  const [user, setUser] = useState<UserSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTtsEnabled, setIsTtsEnabled] = useState(false);
  
  const stateResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const playOrionVoice = async (text: string) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const base64Audio = await generateOrionSpeech(text);
      if (!base64Audio) return;
      
      const binaryString = atob(base64Audio);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i=0; i<len; i++) bytes[i] = binaryString.charCodeAt(i);
      const int16 = new Int16Array(bytes.buffer);
      const float32 = new Float32Array(int16.length);
      for (let i=0; i<int16.length; i++) float32[i] = int16[i] / 32768;
      
      const buffer = audioCtx.createBuffer(1, float32.length, 24000);
      buffer.getChannelData(0).set(float32);
      const source = audioCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(audioCtx.destination);
      source.start(0);
    } catch (e) {
      console.error("TTS Error", e);
    }
  };

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
        const history = await getHistory(userData.uid);
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
    }, 1500);
  }, []);

  const handleLogin = (method: 'full' | 'guest', data?: any) => {
    setOrionState(OrionState.AUTHENTICATING);
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
    saveMessageToHistory(user.uid, userMsg);
    
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
        saveMessageToHistory(user.uid, modelLogoutMsg);
        setTimeout(handleLogout, 2500);
        return; // Retorna para não setar outras coisas
      }

      // Interceptador de Protocolo de CLEAR (Limpar Chat)
      if (response.includes('[[CLEAR]]')) {
        const cleanResponse = response.replace('[[CLEAR]]', '').trim();
        const modelClearMsg: Message = { id: Date.now().toString(), role: 'model', content: cleanResponse, timestamp: Date.now() };
        
        // Limpa a tela deixando apenas a confirmação
        setMessages([modelClearMsg]); 
        saveHistory(user.uid, [modelClearMsg]);

        if (isTtsEnabled) playOrionVoice(cleanResponse);

        setOrionState(OrionState.ACTIVE);
        setTimeout(() => {
          setOrionState(prev => prev === OrionState.ACTIVE ? OrionState.IDLE : prev);
        }, isTtsEnabled ? 6000 : 3000);
        return;
      }

      const modelMsg: Message = { id: Date.now().toString(), role: 'model', content: response, timestamp: Date.now() };
      setMessages(prev => [...prev, modelMsg]);
      saveMessageToHistory(user.uid, modelMsg);

      if (isTtsEnabled) {
         playOrionVoice(response);
      }
      
      setOrionState(OrionState.ACTIVE);
      setTimeout(() => {
        setOrionState(prev => prev === OrionState.ACTIVE ? OrionState.IDLE : prev);
      }, isTtsEnabled ? 6000 : 3000); // Fica ativo mais tempo se estiver falando

    } catch (error) { 
      console.error("Critical Failure:", error);
      setTemporaryState(OrionState.SYSTEM_ALERT, 4000);
    } finally {
      clearTimeout(safetyTimeout);
      setOrionState(prev => (prev === OrionState.AUTHENTICATING || prev === OrionState.SYSTEM_ALERT || prev === OrionState.ACTIVE) ? prev : OrionState.IDLE);
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

      {!user ? (
         <div className="flex-none flex items-center justify-center py-4 z-50 absolute top-4 inset-x-0">
           <div className="font-mono text-[10px] tracking-[1em] text-zinc-700 opacity-40">ORION_OS_v2.8_STABLE</div>
         </div>
      ) : null}

      <div className={`flex-none transition-all duration-700 flex items-center justify-center relative z-20 ${user ? 'h-[140px] md:h-[180px] shrink-0' : 'h-[180px] mt-20'}`}>
        <OrionEyes state={orionState} />
      </div>

      <div className="flex-1 min-h-0 w-full flex flex-col items-center relative z-10 md:px-8">
        <TerminalOutput messages={messages} state={orionState} onPlayAudio={playOrionVoice} />
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
              onClick={() => setIsTtsEnabled(!isTtsEnabled)} 
              className={`flex-none h-14 w-14 rounded-full flex items-center justify-center border transition-all active:scale-95 shadow-lg ${isTtsEnabled ? 'bg-zinc-800 border-zinc-500 text-white shadow-[0_0_15px_rgba(255,255,255,0.2)]' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 hover:border-zinc-700'}`}
              title={isTtsEnabled ? "Desativar Voz" : "Ativar Voz Escrita"}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {isTtsEnabled ? (
                   <>
                     <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
                     <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                     <line x1="12" y1="19" x2="12" y2="22"/>
                   </>
                ) : (
                   <>
                     <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
                     <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                     <line x1="12" y1="19" x2="12" y2="22"/>
                     <line x1="4" y1="4" x2="20" y2="20" />
                   </>
                )}
              </svg>
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

