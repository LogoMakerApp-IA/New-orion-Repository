
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Visualizer from './Visualizer';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { SYSTEM_INSTRUCTION } from '../constants';

interface VoiceInterfaceProps {
  onClose: () => void;
  isListening: boolean;
}

const VoiceInterface: React.FC<VoiceInterfaceProps> = ({ onClose, isListening }) => {
  const [status, setStatus] = useState<string>('Inicializando Áudio...');
  const [isActive, setIsActive] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sessionRef = useRef<any>(null);
  const nextPlayTimeRef = useRef<number>(0);

  const initAudio = useCallback(async () => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("API Key ausente.");
      
      const ai = new GoogleGenAI({ apiKey });
      const audioCtx = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = audioCtx;
      nextPlayTimeRef.current = audioCtx.currentTime;

      setStatus('Conectando ao Núcleo Orion...');

      const sessionPromise = ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction: SYSTEM_INSTRUCTION + " Use respostas curtas, como em uma ligação.",
        },
        callbacks: {
          onopen: async () => {
            setStatus('Orion Ativo. Pode Falar.');
            setIsActive(true);
            try {
              const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
              mediaStreamRef.current = stream;
              const source = audioCtx.createMediaStreamSource(stream);
              const processor = audioCtx.createScriptProcessor(4096, 1, 1);
              
              processor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                const pcm16 = new Int16Array(inputData.length);
                for (let i = 0; i < inputData.length; i++) {
                  pcm16[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32768));
                }
                const bytes = new Uint8Array(pcm16.buffer);
                let binary = '';
                for (let i = 0; i < bytes.byteLength; i++) {
                  binary += String.fromCharCode(bytes[i]);
                }
                const base64Data = btoa(binary);
                
                sessionPromise.then(session => {
                   session.sendRealtimeInput({
                     audio: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
                   });
                });
              };
              
              source.connect(processor);
              // Avoid connecting to destination to prevent feedback, just let it process
              processor.connect(audioCtx.destination);
              processorRef.current = processor;
              
              // Mute the processor output so we don't hear our own mic
              const gainNode = audioCtx.createGain();
              gainNode.gain.value = 0;
              processor.disconnect();
              processor.connect(gainNode);
              gainNode.connect(audioCtx.destination);
              
            } catch (err) {
              console.error("Microphone access denied:", err);
              setStatus('Acesso ao microfone negado.');
            }
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.interrupted) {
              nextPlayTimeRef.current = audioCtx.currentTime;
            }
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
              const binaryString = atob(base64Audio);
              const len = binaryString.length;
              const bytes = new Uint8Array(len);
              for (let i=0; i<len; i++) bytes[i] = binaryString.charCodeAt(i);
              const int16 = new Int16Array(bytes.buffer);
              const float32 = new Float32Array(int16.length);
              for (let i=0; i<int16.length; i++) float32[i] = int16[i] / 32768;
              
              // The model sends 24000 Hz by default
              const buffer = audioCtx.createBuffer(1, float32.length, 24000);
              buffer.getChannelData(0).set(float32);
              const source = audioCtx.createBufferSource();
              source.buffer = buffer;
              source.connect(audioCtx.destination);
              
              const startTime = Math.max(nextPlayTimeRef.current, audioCtx.currentTime);
              source.start(startTime);
              nextPlayTimeRef.current = startTime + buffer.duration;
            }
          },
          onerror: (err) => {
             console.error("Live API Error:", err);
             setStatus('Falha de Conexão.');
          },
          onclose: () => {
             setStatus('Conexão Encerrada.');
             setIsActive(false);
          }
        }
      });
      
      sessionRef.current = await sessionPromise;
      
    } catch (e) {
       console.error("Voice init failure", e);
       setStatus('Falha na inicialização.');
    }
  }, []);

  useEffect(() => {
    initAudio();
    return () => {
      if (sessionRef.current) sessionRef.current.close();
      if (processorRef.current) processorRef.current.disconnect();
      if (mediaStreamRef.current) mediaStreamRef.current.getTracks().forEach(t => t.stop());
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, [initAudio]);

  return (
    <div className="fixed inset-0 bg-black z-[150] flex flex-col items-center justify-between py-16 animate-[fadeIn_0.5s_ease-out]">
      {/* Top Header */}
      <div className="w-full flex justify-center pt-4">
        <h2 className="font-mono text-xl tracking-[0.4em] text-white opacity-90">ORION</h2>
      </div>

      {/* Central Content */}
      <div className="flex flex-col items-center space-y-12">
        <Visualizer isListening={isActive} />
        <div className="font-mono text-[10px] tracking-[0.5em] text-zinc-500 uppercase animate-pulse">
          {status}
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="w-full max-w-sm px-8 space-y-8">
        <div className="flex items-center justify-between text-white/80">
          <button className="p-4 hover:text-white transition-colors opacity-60">
             <span className="text-2xl font-mono">⌘</span>
          </button>
          
          <div className="relative">
             <div className={`absolute inset-0 bg-white/10 rounded-full blur-xl ${isActive ? 'animate-pulse' : ''}`}></div>
             <button className="relative p-4 text-white hover:text-red-400 transition-colors" onClick={onClose}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                  <line x1="12" y1="19" x2="12" y2="22"/>
                </svg>
             </button>
          </div>

          <button onClick={onClose} className="p-4 hover:text-white transition-colors opacity-60">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <div className="h-[1px] w-full bg-zinc-800"></div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
};

export default VoiceInterface;
