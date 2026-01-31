import { MemoryEntry, Message } from '../types';

const MEMORY_PREFIX = 'ORION_MEM_';
const HISTORY_PREFIX = 'ORION_HIST_';

// --- Long Term Memory (Facts) ---

export const getMemory = (uid: string): MemoryEntry[] => {
  if (!uid) return [];
  try {
    const stored = localStorage.getItem(`${MEMORY_PREFIX}${uid}`);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error("Falha ao ler memória:", e);
    return [];
  }
};

export const saveMemory = (uid: string, content: string): boolean => {
  if (!uid) return false;
  try {
    const currentMemory = getMemory(uid);
    const newEntry: MemoryEntry = {
      id: Date.now().toString(),
      content: content.trim(),
      timestamp: Date.now()
    };
    
    // Simple deduplication based on exact content
    if (!currentMemory.some(m => m.content === newEntry.content)) {
      const updatedMemory = [...currentMemory, newEntry];
      localStorage.setItem(`${MEMORY_PREFIX}${uid}`, JSON.stringify(updatedMemory));
      return true;
    }
    return false;
  } catch (e) {
    console.error("Falha ao gravar memória:", e);
    return false;
  }
};

export const clearMemory = (uid: string) => {
  if (!uid) return;
  localStorage.removeItem(`${MEMORY_PREFIX}${uid}`);
};

export const getMemoryContextString = (uid: string): string => {
  const memories = getMemory(uid);
  if (memories.length === 0) return "BANCO DE DADOS: Vazio.";
  
  return `BANCO DE DADOS (MEMÓRIA PERSISTENTE DO USUÁRIO):\n${memories.map(m => `- ${m.content}`).join('\n')}`;
};

// --- Session History (Context Preservation) ---

export const getHistory = (uid: string): Message[] => {
  if (!uid) return [];
  try {
    const stored = localStorage.getItem(`${HISTORY_PREFIX}${uid}`);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error("Falha ao ler histórico:", e);
    return [];
  }
};

export const saveHistory = (uid: string, messages: Message[]) => {
  if (!uid) return;
  try {
    // Limit to last 50 messages to prevent storage overflow over time
    const historyToSave = messages.slice(-50);
    localStorage.setItem(`${HISTORY_PREFIX}${uid}`, JSON.stringify(historyToSave));
  } catch (e) {
    console.error("Falha ao salvar histórico:", e);
  }
};

export const clearHistory = (uid: string) => {
  if (!uid) return;
  localStorage.removeItem(`${HISTORY_PREFIX}${uid}`);
};