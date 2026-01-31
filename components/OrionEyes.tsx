
import React, { useEffect, useState, useRef } from 'react';
import { OrionState } from '../types';

interface OrionEyesProps {
  state: OrionState;
}

const OrionEyes: React.FC<OrionEyesProps> = ({ state }) => {
  const [isBlinking, setIsBlinking] = useState(false);
  const blinkTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  useEffect(() => {
    const blink = () => {
      if (state === OrionState.BOOTING || state === OrionState.AUTHENTICATING || state === OrionState.UNAUTHENTICATED) return;
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 200); 
      const nextBlink = 5000 + Math.random() * 7000;
      blinkTimeoutRef.current = setTimeout(blink, nextBlink);
    };
    blinkTimeoutRef.current = setTimeout(blink, 4000);
    return () => { if (blinkTimeoutRef.current) clearTimeout(blinkTimeoutRef.current); };
  }, [state]);

  const getStateConfig = () => {
    let config = {
      color: "bg-zinc-200",
      glow: "shadow-[0_0_40px_rgba(255,255,255,0.2)]",
      text: "SISTEMA_ESTÁVEL",
      animation: "animate-look-around",
      eyeScale: "scale-100",
      opacity: "opacity-100",
      brightness: "brightness-100"
    };

    switch (state) {
      case OrionState.IDLE:
        config.animation = "animate-look-around";
        break;
      case OrionState.FOCUSED_EMPTY:
      case OrionState.FOCUSED:
        config.text = state === OrionState.FOCUSED ? "FOCO_TOTAL" : "AGUARDANDO_INPUT";
        config.animation = "animate-attention-pulse";
        config.glow = "shadow-[0_0_50px_rgba(255,255,255,0.4)]";
        break;
      case OrionState.SYSTEM_SEARCHING:
        config.color = "bg-cyan-300";
        config.text = "ESCANEANDO_SUBSISTEMAS";
        config.animation = "animate-system-scan";
        config.glow = "shadow-[0_0_60px_rgba(103,232,249,0.7)]";
        break;
      case OrionState.SYSTEM_ALERT:
        config.color = "bg-red-500";
        config.text = "ANOMALIA_DETECTADA";
        config.animation = "animate-shake-critical";
        config.glow = "shadow-[0_0_70px_rgba(239,68,68,0.8)]";
        config.brightness = "brightness-150";
        break;
      case OrionState.PROCESSING:
        config.color = "bg-zinc-100";
        config.text = "PROCESSANDO...";
        config.animation = "animate-think-square";
        break;
      case OrionState.CHARGING:
        config.color = "bg-emerald-400";
        config.text = "ENERGIA_RESTAURADA";
        break;
      case OrionState.AUTHENTICATING:
      case OrionState.BOOTING:
        config.opacity = "opacity-30";
        config.animation = "animate-pulse";
        config.text = "INICIALIZANDO...";
        break;
      default:
        config.opacity = "opacity-50";
        break;
    }
    return config;
  };

  const config = getStateConfig();
  const blinkStyle = isBlinking ? 'scale-y-[0.05] opacity-0' : 'scale-y-100 opacity-100';

  return (
    <div className="flex flex-col items-center justify-center w-full select-none pointer-events-none">
      <style>{`
        .eye-core {
          width: 70px;
          height: 70px;
          border-radius: 20px;
          transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes look-around {
          0%, 100% { transform: translate(0, 0); }
          33% { transform: translate(4px, -2px); }
          66% { transform: translate(-4px, 2px); }
        }
        .animate-look-around { animation: look-around 12s ease-in-out infinite; }

        @keyframes system-scan {
          0%, 100% { transform: translateX(0); filter: brightness(1); }
          50% { transform: translateX(25px); filter: brightness(1.5); }
          51% { transform: translateX(-25px); }
        }
        .animate-system-scan { animation: system-scan 0.6s ease-in-out infinite; }

        @keyframes attention-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }
        .animate-attention-pulse { animation: attention-pulse 3s ease-in-out infinite; }

        @keyframes shake-critical {
          0%, 100% { transform: translate(0, 0); }
          10%, 90% { transform: translate(-3px, 0); }
          20%, 80% { transform: translate(3px, 0); }
          30%, 50%, 70% { transform: translate(-5px, 0); }
          40%, 60% { transform: translate(5px, 0); }
        }
        .animate-shake-critical { animation: shake-critical 0.2s cubic-bezier(.36,.07,.19,.97) both infinite; }

        @keyframes think-square {
          0%, 100% { transform: rotate(0deg) scale(0.95); }
          50% { transform: rotate(5deg) scale(1.05); }
        }
        .animate-think-square { animation: think-square 2s ease-in-out infinite; }
      `}</style>

      <div className={`flex gap-14 mb-10 transition-transform duration-1000 ${config.animation}`}>
        <div className={`eye-core ${config.color} ${config.glow} ${config.eyeScale} ${config.opacity} ${config.brightness} ${blinkStyle}`} />
        <div className={`eye-core ${config.color} ${config.glow} ${config.eyeScale} ${config.opacity} ${config.brightness} ${blinkStyle}`} />
      </div>

      <div className="flex flex-col items-center h-10">
        <span className="font-mono text-[8px] tracking-[0.8em] text-zinc-600 uppercase transition-all duration-500">
          {config.text}
        </span>
        <div className="w-40 h-[1px] bg-zinc-900 mt-3 relative overflow-hidden opacity-30">
           <div className="absolute inset-y-0 w-1/3 bg-white/40 blur-[1px] animate-[scan_4s_linear_infinite]" />
        </div>
      </div>
    </div>
  );
};

export default OrionEyes;
