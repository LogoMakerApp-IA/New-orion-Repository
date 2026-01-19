import { MemoryEntry, Message } from '../types';

const MEMORY_KEY = 'ORION_LONG_TERM_MEMORY';
const HISTORY_KEY = 'ORION_CHAT_HISTORY';

// --- Long Term Memory (Facts) ---

export const getMemory = (): MemoryEntry[] => {
  try {
    const stored = localStorage.getItem(MEMORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error("Falha ao ler memória:", e);
    return [];
  }
};

export const saveMemory = (content: string): boolean => {
  try {
    const currentMemory = getMemory();
    const newEntry: MemoryEntry = {
      id: Date.now().toString(),
      content: content.trim(),
      timestamp: Date.now()
    };
    
    // Simple deduplication based on exact content content
    if (!currentMemory.some(m => m.content === newEntry.content)) {
      const updatedMemory = [...currentMemory, newEntry];
      localStorage.setItem(MEMORY_KEY, JSON.stringify(updatedMemory));
      return true;
    }
    return false;
  } catch (e) {
    console.error("Falha ao gravar memória:", e);
    return false;
  }
};

export const clearMemory = () => {
  localStorage.removeItem(MEMORY_KEY);
};

export const getMemoryContextString = (): string => {
  const memories = getMemory();
  if (memories.length === 0) return "BANCO DE DADOS: Vazio.";
  
  return `BANCO DE DADOS (MEMÓRIA PERSISTENTE):\n${memories.map(m => `- ${m.content}`).join('\n')}`;
};

// --- Session History (Context Preservation) ---

export const getHistory = (): Message[] => {
  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error("Falha ao ler histórico:", e);
    return [];
  }
};

export const saveHistory = (messages: Message[]) => {
  try {
    // Limit to last 50 messages to prevent storage overflow over time
    const historyToSave = messages.slice(-50);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(historyToSave));
  } catch (e) {
    console.error("Falha ao salvar histórico:", e);
  }
};

export const clearHistory = () => {
  localStorage.removeItem(HISTORY_KEY);
};