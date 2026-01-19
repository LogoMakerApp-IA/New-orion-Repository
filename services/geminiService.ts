import { GoogleGenAI, Content, Part } from "@google/genai";
import { SYSTEM_INSTRUCTION, MODEL_NAME } from "../constants";
import { Message, SysNotification } from "../types";
import { getMemoryContextString } from "./memoryService";

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

const getSystemContext = async (activeNotifications: SysNotification[]): Promise<string> => {
  const now = new Date();
  const battery = await getBatteryInfo();
  const memoryContext = getMemoryContextString();
  const unread = activeNotifications.filter(n => !n.read);
  
  return `
[TELEMETRIA DO SISTEMA]
HORA: ${now.toLocaleTimeString()}
DATA: ${now.toLocaleDateString()}
BATERIA: ${battery}
REDE: ${navigator.onLine ? "Online" : "Offline"}
NOTIFICAÇÕES: ${unread.length} pendentes.

${memoryContext}
`;
};

export const sendMessageToOrion = async (
  history: Message[],
  userMessage: string,
  notifications: SysNotification[],
  imagePart?: string 
): Promise<string> => {
  try {
    // Re-initialize to ensure fresh key context from process.env.API_KEY
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const systemContextString = await getSystemContext(notifications);
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

    const finalPrompt = `
${systemContextString}
USER: ${userMessage}
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
        temperature: 0.8,
        maxOutputTokens: 800,
      },
    });

    return response.text || "Falha na resposta do núcleo.";
  } catch (error: any) {
    console.error("Orion System Error:", error);
    if (error.message?.includes('403')) {
      return "ERRO DE ACESSO (403): Subsistema de linguagem restrito.";
    }
    return "Instabilidade nos subsistemas de resposta."; 
  }
};