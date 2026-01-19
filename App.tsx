import React, { useState, useEffect, useCallback, useRef } from 'react';
import OrionEyes from './components/OrionEyes';
import OrionInput from './components/OrionInput';
import TerminalOutput from './components/TerminalOutput';
import { Message, OrionState, PendingAction, SysNotification } from './types';
import { sendMessageToOrion } from './services/geminiService';
import { saveMemory, saveHistory, getHistory, clearHistory } from './services/memoryService';

const App: React.FC = () => {
  const [orionState, setOrionState] = useState<OrionState>(OrionState.IDLE);
  const [messages, setMessages] = useState<Message[]>([]);
  const [filterSystemLogs, setFilterSystemLogs] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [notifications] = useState<SysNotification[]>([]);

  const sleepSequenceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startupSequenceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isUserInactive, setIsUserInactive] = useState(false);

  const stateRef = useRef(orionState);
  useEffect(() => {
    stateRef.current = orionState;
  }, [orionState]);

  useEffect(() => {
    const savedMessages = getHistory();
    if (savedMessages && savedMessages.length > 0) {
      setMessages(savedMessages);
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      saveHistory(messages);
    }
  }, [messages]);

  const isDeepDiveMode = messages.length > 4;

  const resetInactivity = useCallback(() => {
    setIsUserInactive(false);
    if (stateRef.current === OrionState.OBSERVING) {
       setOrionState(OrionState.IDLE);
    }
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    if (isDeepDiveMode) {
      inactivityTimer.current = setTimeout(() => {
        setIsUserInactive(true);
        if (stateRef.current !== OrionState.PROCESSING && 
            stateRef.current !== OrionState.FOCUSED && 
            stateRef.current !== OrionState.FOCUSED_EMPTY) {
            setOrionState(OrionState.OBSERVING);
        }
      }, 5000);
    }
  }, [isDeepDiveMode]);

  useEffect(() => {
    window.addEventListener('mousemove', resetInactivity);
    window.addEventListener('keydown', resetInactivity);
    window.addEventListener('scroll', resetInactivity);
    resetInactivity();
    return () => {
      window.removeEventListener('mousemove', resetInactivity);
      window.removeEventListener('keydown', resetInactivity);
      window.removeEventListener('scroll', resetInactivity);
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    };
  }, [resetInactivity]);

  const startSleepSequence = useCallback(() => {
    if (isDeepDiveMode) return;
    if (stateRef.current === OrionState.AWAITING_PERMISSION || 
        stateRef.current === OrionState.PROCESSING ||
        stateRef.current === OrionState.SYSTEM_ALERT ||
        stateRef.current === OrionState.SYSTEM_SUCCESS) return;
    setOrionState(OrionState.PRE_SLEEP);
    if (sleepSequenceTimer.current) clearTimeout(sleepSequenceTimer.current);
    sleepSequenceTimer.current = setTimeout(() => {
      if (stateRef.current === OrionState.AWAITING_PERMISSION || 
          stateRef.current === OrionState.PROCESSING ||
          stateRef.current === OrionState.SYSTEM_ALERT ||
          stateRef.current === OrionState.SYSTEM_SUCCESS) return;
      setOrionState(OrionState.SQUINTING);
      sleepSequenceTimer.current = setTimeout(() => {
        if (stateRef.current === OrionState.AWAITING_PERMISSION || 
            stateRef.current === OrionState.PROCESSING ||
            stateRef.current === OrionState.SYSTEM_ALERT ||
            stateRef.current === OrionState.SYSTEM_SUCCESS) return;
        setOrionState(OrionState.SLEEPING);
      }, 3000); 
    }, 4000); 
  }, [isDeepDiveMode]);

  const cancelSleepSequence = useCallback(() => {
    if (sleepSequenceTimer.current) {
      clearTimeout(sleepSequenceTimer.current);
      sleepSequenceTimer.current = null;
    }
  }, []);

  const handleInputFocus = () => {
    resetInactivity();
    if (startupSequenceTimer.current) clearTimeout(startupSequenceTimer.current);
    cancelSleepSequence();
    if (orionState === OrionState.AWAITING_PERMISSION || orionState === OrionState.SYSTEM_ALERT || orionState === OrionState.SYSTEM_SUCCESS) return;
    setOrionState(inputValue.length === 0 ? OrionState.FOCUSED_EMPTY : OrionState.FOCUSED);
  };

  const handleInputBlur = () => {
    if (orionState !== OrionState.PROCESSING && orionState !== OrionState.AWAITING_PERMISSION && orionState !== OrionState.SYSTEM_ALERT && orionState !== OrionState.SYSTEM_SUCCESS) {
        startSleepSequence();
    }
  };

  const handleInputChange = (val: string) => {
    resetInactivity();
    setInputValue(val);
    if (orionState !== OrionState.PROCESSING && orionState !== OrionState.AWAITING_PERMISSION && orionState !== OrionState.SYSTEM_ALERT && orionState !== OrionState.SYSTEM_SUCCESS) {
        setOrionState(val.length === 0 ? OrionState.FOCUSED_EMPTY : OrionState.FOCUSED);
    }
  };

  const processOrionResponse = (responseText: string) => {
    let cleanText = responseText;

    // Process Memory FIRST
    const memoryRegex = /\[\[MEMORY_WRITE:\s*(.*?)\]\]/g;
    let match;
    while ((match = memoryRegex.exec(cleanText)) !== null) {
      const contentToSave = match[1];
      saveMemory(contentToSave);
      setOrionState(OrionState.SYSTEM_SUCCESS);
    }
    cleanText = cleanText.replace(memoryRegex, '').trim();

    // Handle Reset Signal
    if (cleanText.includes('[[SESSION_RESET]]')) {
      cleanText = cleanText.replace('[[SESSION_RESET]]', '').trim();
      setOrionState(OrionState.SYSTEM_SUCCESS);
      // Wait for user to read the message before wiping
      setTimeout(() => {
        setMessages([]);
        clearHistory();
        setOrionState(OrionState.IDLE);
      }, 3000);
    }

    const permissionRegex = /\[\[REQUEST_PERMISSION:\s*(.*?)\]\]/;
    const permMatch = cleanText.match(permissionRegex);
    if (permMatch) {
      const actionDescription = permMatch[1];
      cleanText = cleanText.replace(permissionRegex, '').trim();
      setPendingAction({ description: actionDescription, originalResponse: cleanText });
    }

    return cleanText;
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || orionState === OrionState.PROCESSING || orionState === OrionState.AWAITING_PERMISSION) return;
    resetInactivity();
    const currentText = inputValue;
    setInputValue('');
    cancelSleepSequence();
    setOrionState(OrionState.PROCESSING);
    
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: currentText, timestamp: Date.now() };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);

    try {
      const rawResponse = await sendMessageToOrion(newHistory, currentText, notifications);
      const cleanResponse = processOrionResponse(rawResponse);
      
      const systemMsg: Message = { id: (Date.now() + 1).toString(), role: 'model', content: cleanResponse, timestamp: Date.now() };
      
      // If session was reset, the message will still show briefly because of the delay in processOrionResponse
      setMessages(prev => prev.length > 0 ? [...prev, systemMsg] : [systemMsg]);
      
      if (rawResponse.includes('[[REQUEST_PERMISSION:')) {
         setOrionState(OrionState.AWAITING_PERMISSION);
      } else if (stateRef.current !== OrionState.SYSTEM_SUCCESS) {
         setOrionState(OrionState.ACTIVE);
         setTimeout(() => { if (stateRef.current === OrionState.ACTIVE) setOrionState(OrionState.IDLE); }, 1500);
      } else {
        // Success state usually goes to idle after a bit
        setTimeout(() => { if (stateRef.current === OrionState.SYSTEM_SUCCESS) setOrionState(OrionState.IDLE); }, 2000);
      }
    } catch (error) {
      console.error(error);
      setOrionState(OrionState.IDLE);
      startSleepSequence();
    }
  };

  const handlePermissionDecision = (allowed: boolean) => {
    if (!pendingAction) return;
    resetInactivity();
    const decisionText = allowed ? `[AUTORIZADO]: ${pendingAction.description}` : `[NEGADO]: ${pendingAction.description}`;
    setPendingAction(null);
    setOrionState(OrionState.PROCESSING);
    const decisionMsg: Message = { id: Date.now().toString(), role: 'user', content: decisionText, timestamp: Date.now() };
    const newHistory = [...messages, decisionMsg];
    setMessages(newHistory);
    sendMessageToOrion(newHistory, decisionText, notifications).then(rawResponse => {
       const cleanResponse = processOrionResponse(rawResponse);
       setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', content: cleanResponse, timestamp: Date.now() }]);
       if (rawResponse.includes('[[REQUEST_PERMISSION:')) {
           setOrionState(OrionState.AWAITING_PERMISSION);
       } else {
           setOrionState(OrionState.ACTIVE);
           setTimeout(() => { if (stateRef.current === OrionState.ACTIVE) setOrionState(OrionState.IDLE); }, 1500);
       }
    });
  };

  const handleToggleFilter = () => setFilterSystemLogs(!filterSystemLogs);
  const visibleMessages = filterSystemLogs ? messages.filter(m => m.role !== 'system') : messages;

  return (
    <div className={`min-h-screen bg-[#f3f4f6] dark:bg-[#050505] text-gray-800 dark:text-gray-200 flex flex-col items-center relative overflow-hidden transition-all duration-1000 ease-in-out`}>
      <div className={`flex justify-center transition-all duration-1000 ease-in-out z-0 ${isDeepDiveMode ? 'fixed inset-0 items-center pointer-events-none opacity-20' : 'flex-none w-full relative z-20 pt-10'} ${isDeepDiveMode && isUserInactive ? '!opacity-80' : ''}`}>
        <OrionEyes state={orionState} />
      </div>
      {messages.length > 0 && (
        <div className={`flex-1 w-full flex flex-col items-center justify-start overflow-hidden my-4 animate-[fadeIn_0.8s_ease-out] transition-all duration-1000 z-10 ${isDeepDiveMode ? 'h-full' : ''} ${isDeepDiveMode && isUserInactive ? 'backdrop-blur-sm' : ''}`}>
            <TerminalOutput messages={visibleMessages} />
        </div>
      )}
      <div className="flex-none w-full z-20 flex justify-center pb-6 bg-gradient-to-t from-[#f3f4f6] dark:from-[#050505] to-transparent pt-10">
        <OrionInput 
            state={orionState}
            inputValue={inputValue}
            onInputChange={handleInputChange}
            onInputSubmit={handleSendMessage}
            onInputFocus={handleInputFocus}
            onInputBlur={handleInputBlur}
            pendingAction={pendingAction}
            onPermissionDecide={handlePermissionDecision}
            onToggleFilter={handleToggleFilter}
            isFilterActive={filterSystemLogs}
        />
      </div>
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-[-1] invert dark:invert-0 transition-all duration-1000" 
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
      </div>
    </div>
  );
};

export default App;