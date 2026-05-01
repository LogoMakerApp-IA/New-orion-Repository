import { GoogleGenAI, Content, Part } from "@google/genai";
import { SYSTEM_INSTRUCTION, MODEL_NAME } from "../constants";
import { Message, SysNotification } from "../types";
import { getMemoryContextString, saveMemory } from "./memoryService";

const getBatteryInfo = async () => {
  try {
    // @ts-ignore
    if (navigator.getBattery) {
      // @ts-ignore
      const battery = await navigator.getBattery();
      return `${Math.round(battery.level * 100)}%${battery.charging ? ' (Carregando)' : ''}`;
    }
  } catch (e) {
    return "Indisponível";
  }
  return "AC Power";
};

const getHardwareInfo = async () => {
  const info: any = {
    ram: (navigator as any).deviceMemory ? `${(navigator as any).deviceMemory}GB` : "Detectando...",
    storage: "Calculando...",
    cores: navigator.hardwareConcurrency ? `${navigator.hardwareConcurrency} Threads` : "N/A"
  };

  try {
    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      const usedGB = (estimate.usage || 0) / (1024 ** 3);
      const quotaGB = (estimate.quota || 0) / (1024 ** 3);
      info.storage = `${usedGB.toFixed(2)}GB usados de ${quotaGB.toFixed(0)}GB disponíveis (Estimativa de Partição)`;
    }
  } catch (e) {
    info.storage = "Acesso restrito ao sistema de arquivos.";
  }

  return info;
};

const getSystemContext = async (uid: string, activeNotifications: SysNotification[], isGuest: boolean = false): Promise<string> => {
  const now = new Date();
  
  if (isGuest) {
    return `
[PROTOCOLO DE CONVIDADO ATIVO]
SISTEMA: MODO ASSISTENTE DE CHAT
DATA: ${now.toLocaleDateString()}
ESTADO: Subsistemas de hardware ocultos por segurança.
DIRETRIZ: Atuar como um parceiro conversacional analítico e prestativo, mas mantendo a persona inteligente e sci-fi de ORION.
`;
  }

  const battery = await getBatteryInfo();
  const hardware = await getHardwareInfo();
  const memoryContext = await getMemoryContextString(uid);
  
  return `
[NÚCLEO DE TELEMETRIA ORION - ACESSO TOTAL]
USUÁRIO_ID: ${uid}
HORA/DATA: ${now.toLocaleTimeString()} | ${now.toLocaleDateString()}
HARDWARE:
- RAM: ${hardware.ram} (Alocada para Interface)
- CPU: ${hardware.cores}
- STORAGE: ${hardware.storage}
- ENERGIA: ${battery}
REDE: ${navigator.onLine ? "ESTÁVEL (Online)" : "DESCONECTADO (Offline)"}

[PROCESSOS EM SEGUNDO PLANO]
- IA Kernel (Orion-Flash-Core): ATIVO
- Memory Service: MONITORANDO
- Storage Listener: ATIVO
- Interface Renderer: ESTÁVEL

${memoryContext}
`;
};

export const sendMessageToOrion = async (
  uid: string,
  history: Message[],
  userMessage: string,
  notifications: SysNotification[],
  imagePart?: string,
  isGuest: boolean = false
): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const systemContextString = await getSystemContext(uid, notifications, isGuest);
    const recentHistory = history.slice(-12);

    let contents: Content[] = recentHistory
      .filter((msg) => msg.role !== 'system')
      .map((msg) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content } as Part],
      }));

    if (contents.length > 0 && contents[0].role === 'model') {
       contents.shift();
    }

    const guestRestriction = isGuest ? "\nVocê está em MODO CONVIDADO. Não execute comandos de sistema nem acesse memórias persistentes." : "";

    const finalPrompt = `
${systemContextString}${guestRestriction}
COMANDO DO USUÁRIO: ${userMessage}
`;

    const newParts: Part[] = [];
    if (imagePart) {
      newParts.push({
        inlineData: { mimeType: 'image/jpeg', data: imagePart },
      });
    }
    newParts.push({ text: finalPrompt });

    contents.push({ role: 'user', parts: newParts });

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
        maxOutputTokens: 1000,
      },
    });

    let textResponse = response.text || "Falha na resposta do núcleo.";

    // Interceptar [[MEMORY_WRITE: ...]]
    const memoryMatch = textResponse.match(/\[\[MEMORY_WRITE:\s*(.*?)\]\]/);
    if (memoryMatch && memoryMatch[1] && !isGuest) {
      await saveMemory(uid, memoryMatch[1]);
      textResponse = textResponse.replace(memoryMatch[0], '').trim();
    }

    return textResponse;
  } catch (error: any) {
    console.error("Orion System Error:", error);
    return "Instabilidade nos subsistemas de hardware detectada. Tente reiniciar o ciclo."; 
  }
};