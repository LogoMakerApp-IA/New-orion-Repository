import { MemoryEntry, Message } from '../types';
import { db } from '../lib/firebase';
import { collection, doc, query, orderBy, getDocs, setDoc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';

// We'll use a user's document to store their session info, and subcollections for memories and history.
const USERS_COLLECTION = 'users';

// --- Long Term Memory (Facts) ---

export const getMemory = async (uid: string): Promise<MemoryEntry[]> => {
  if (!uid) return [];
  try {
    const memoriesRef = collection(db, USERS_COLLECTION, uid, 'memories');
    const q = query(memoriesRef, orderBy('timestamp', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MemoryEntry));
  } catch (e) {
    console.error("Falha ao ler memória:", e);
    return [];
  }
};

export const saveMemory = async (uid: string, content: string): Promise<boolean> => {
  if (!uid) return false;
  try {
    const currentMemory = await getMemory(uid);
    const newContent = content.trim();
    
    // Simple deduplication based on exact content
    if (!currentMemory.some(m => m.content === newContent)) {
      const memoriesRef = collection(db, USERS_COLLECTION, uid, 'memories');
      await addDoc(memoriesRef, {
        content: newContent,
        timestamp: Date.now()
      });
      return true;
    }
    return false;
  } catch (e) {
    console.error("Falha ao gravar memória:", e);
    return false;
  }
};

export const clearMemory = async (uid: string) => {
  if (!uid) return;
  try {
    const memoriesRef = collection(db, USERS_COLLECTION, uid, 'memories');
    const snapshot = await getDocs(memoriesRef);
    const deletePromises = snapshot.docs.map(change => deleteDoc(change.ref));
    await Promise.all(deletePromises);
  } catch (e) {
    console.error("Falha ao limpar memória", e);
  }
};

export const getMemoryContextString = async (uid: string): Promise<string> => {
  const memories = await getMemory(uid);
  if (memories.length === 0) return "BANCO DE DADOS: Vazio.";
  
  return `BANCO DE DADOS (MEMÓRIA PERSISTENTE DO USUÁRIO):\n${memories.map(m => `- ${m.content}`).join('\n')}`;
};

// --- Session History (Context Preservation) ---

export const getHistory = async (uid: string): Promise<Message[]> => {
  if (!uid) return [];
  try {
    const historyRef = collection(db, USERS_COLLECTION, uid, 'history');
    const q = query(historyRef, orderBy('timestamp', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Message);
  } catch (e) {
    console.error("Falha ao ler histórico:", e);
    return [];
  }
};

export const saveHistory = async (uid: string, messages: Message[]) => {
  if (!uid) return;
  try {
    // Clear old
    await clearHistory(uid);
    
    const historyToSave = messages.slice(-50);
    const historyRef = collection(db, USERS_COLLECTION, uid, 'history');
    
    // Simplificado usando Promise.all (em prod, usar batch write)
    const addPromises = historyToSave.map(msg => setDoc(doc(historyRef, msg.id), msg));
    await Promise.all(addPromises);
  } catch (e) {
    console.error("Falha ao salvar histórico:", e);
  }
};

export const saveMessageToHistory = async (uid: string, message: Message) => {
  if (!uid) return;
  try {
    const historyRef = collection(db, USERS_COLLECTION, uid, 'history');
    await setDoc(doc(historyRef, message.id), message);
  } catch (error) {
    console.error("Falha ao salvar a mensagem", error);
  }
};

export const clearHistory = async (uid: string) => {
  if (!uid) return;
  try {
    const historyRef = collection(db, USERS_COLLECTION, uid, 'history');
    const snapshot = await getDocs(historyRef);
    const deletePromises = snapshot.docs.map(change => deleteDoc(change.ref));
    await Promise.all(deletePromises);
  } catch (e) {
    console.error("Falha ao limpar histórico", e);
  }
};
