import React, { useEffect, useState } from 'react';
import { OrionState } from '../types';

interface OrionEyesProps {
  state: OrionState;
}

const OrionEyes: React.FC<OrionEyesProps> = ({ state }) => {
  const [isBlinking, setIsBlinking] = useState(false);
  
  // Organic blink loop
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const blink = () => {
      // Don't organic blink during specific animation states
      if (
        state === OrionState.SLEEPING || 
        state === OrionState.SQUINTING || 
        state === OrionState.PROCESSING || 
        state === OrionState.AWAITING_PERMISSION ||
        state === OrionState.SYSTEM_ALERT ||
        state === OrionState.SYSTEM_SUCCESS ||
        state === OrionState.OBSERVING
      ) return;
      
      const blinkDuration = state === OrionState.PRE_SLEEP ? 400 : 150;
      
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), blinkDuration);

      let nextBlink = 4000;
      
      if (state === OrionState.PRE_SLEEP) {
        nextBlink = 2000 + Math.random() * 2000;
      } else if (state === OrionState.FOCUSED || state === OrionState.FOCUSED_EMPTY) {
        nextBlink = 3000 + Math.random() * 5000;
      } else {
        nextBlink = 3000 + Math.random() * 4000;
      }

      timeoutId = setTimeout(blink, nextBlink);
    };

    timeoutId = setTimeout(blink, 1000);

    return () => clearTimeout(timeoutId);
  }, [state]);

  // Calculate styles based on state
  const getEyeStyles = () => {
    // Base eye style
    let baseStyle = "transition-all ease-in-out relative";
    
    // Light Mode: Dark Gray Eyes (Solid/Ink) | Dark Mode: White Eyes (Light/Energy)
    let bgClass = "bg-zinc-800 dark:bg-white"; 

    // Change eye color for specific states
    if (state === OrionState.AWAITING_PERMISSION) {
      bgClass = "bg-amber-600 dark:bg-amber-500 shadow-[0_0_50px_rgba(245,158,11,0.4)] dark:shadow-[0_0_50px_rgba(245,158,11,0.6)]";
    } else if (state === OrionState.SYSTEM_ALERT) {
      bgClass = "bg-red-600 dark:bg-red-500 shadow-[0_0_60px_rgba(239,68,68,0.5)] dark:shadow-[0_0_60px_rgba(239,68,68,0.8)]";
    } else if (state === OrionState.SYSTEM_SUCCESS) {
      bgClass = "bg-emerald-600 dark:bg-emerald-500 shadow-[0_0_60px_rgba(16,185,129,0.5)] dark:shadow-[0_0_60px_rgba(16,185,129,0.8)]";
    }

    const eyeBase = `${baseStyle} ${bgClass}`;
    
    // Shadow logic: Dark mode gets heavy glow, Light mode gets subtle ambient shadow
    const defaultShadow = "shadow-[0_0_20px_rgba(0,0,0,0.1)] dark:shadow-[0_0_20px_rgba(255,255,255,0.4)]";
    const processingShadow = "shadow-[0_0_40px_rgba(0,0,0,0.15)] dark:shadow-[0_0_40px_rgba(255,255,255,0.9)]";

    switch (state) {
      case OrionState.PROCESSING:
        return {
          container: "gap-8", 
          eye: `${eyeBase} w-20 h-20 rounded-2xl ${processingShadow} animate-jump-spin`,
        };
      case OrionState.AWAITING_PERMISSION:
        return {
          container: "gap-8",
          eye: `${eyeBase} w-24 h-24 rounded-lg animate-pulse-slow`,
        };
      case OrionState.SYSTEM_ALERT:
        return {
          container: "gap-12",
          eye: `${eyeBase} w-20 h-20 rounded-md animate-ping-slow opacity-90`,
        };
      case OrionState.SYSTEM_SUCCESS:
        return {
          container: "gap-8",
          eye: `${eyeBase} w-20 h-20 rounded-xl animate-pulse-slow opacity-90`,
        };
      case OrionState.LOOKING_AROUND:
        return {
          container: "gap-5 animate-look-around",
          eye: `${eyeBase} w-20 h-20 rounded-2xl ${defaultShadow}`,
        };
      case OrionState.OBSERVING:
        // Background Deep Dive Mode
        return {
          container: "gap-16 animate-approach-search opacity-30 dark:opacity-40",
          eye: `${eyeBase} w-32 h-32 rounded-[2rem] shadow-[0_0_80px_rgba(0,0,0,0.05)] dark:shadow-[0_0_80px_rgba(255,255,255,0.15)]`,
        };
      case OrionState.ACTIVE: 
        return {
          container: "gap-5",
          eye: `${eyeBase} w-22 h-22 rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.1)] dark:shadow-[0_0_30px_rgba(255,255,255,0.7)]`,
        };
      case OrionState.SQUINTING: 
        return {
          container: "gap-6",
          eye: `${eyeBase} w-24 h-1 rounded-sm opacity-60 shadow-[0_0_10px_rgba(0,0,0,0.1)] dark:shadow-[0_0_10px_rgba(255,255,255,0.2)] duration-[2500ms]`,
        };
      case OrionState.SLEEPING:
        return {
          container: "gap-4",
          eye: `${eyeBase} w-20 h-0.5 opacity-10 shadow-none duration-[2000ms]`,
        };
      case OrionState.PRE_SLEEP: 
        return {
           container: "gap-5",
           eye: `${eyeBase} w-20 h-20 rounded-2xl opacity-80 shadow-[0_0_15px_rgba(0,0,0,0.1)] dark:shadow-[0_0_15px_rgba(255,255,255,0.3)] duration-1000`,
        };
      case OrionState.FOCUSED: 
      case OrionState.FOCUSED_EMPTY:
      case OrionState.IDLE:
      default:
        return {
          container: "gap-5",
          eye: `${eyeBase} w-20 h-20 rounded-2xl ${defaultShadow} duration-500`,
        };
    }
  };

  const styles = getEyeStyles();
  const blinkClass = isBlinking ? '!h-1 !opacity-50 duration-200' : '';

  return (
    <div className={`flex flex-col items-center justify-center w-full select-none transition-all duration-1000 ${state === OrionState.OBSERVING ? 'h-full scale-125' : 'pt-4 pb-4'}`}>
      <style>{`
        @keyframes jump-spin {
          0% { transform: translateY(0) rotate(0deg); }
          20% { transform: translateY(-15px) rotate(180deg) scale(1.05); } 
          40% { transform: translateY(-5px) rotate(360deg) scale(1.0); }
          60% { transform: translateY(-2px) rotate(540deg); }
          100% { transform: translateY(0) rotate(720deg); }
        }
        @keyframes look-around {
          0% { transform: translateX(0); }
          10% { transform: translateX(-20px); } 
          30% { transform: translateX(-20px); }
          45% { transform: translateX(20px); }
          65% { transform: translateX(20px); }
          80% { transform: translateX(0); }
          100% { transform: translateX(0); }
        }
        @keyframes approach-search {
          0% { transform: scale(0.9) translateX(0); opacity: 0; }
          20% { transform: scale(1.0) translateX(-40px); opacity: 0.2; }
          50% { transform: scale(1.1) translateX(40px); opacity: 0.4; }
          80% { transform: scale(1.2) translateX(-20px); opacity: 0.3; }
          100% { transform: scale(1.25) translateX(0); opacity: 0.4; }
        }
        @keyframes ping-slow {
          0% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); opacity: 0.9; }
        }
        .animate-jump-spin {
          animation: jump-spin 2s ease-in-out infinite;
        }
        .animate-look-around {
          animation: look-around 4s ease-in-out infinite;
        }
        .animate-approach-search {
          animation: approach-search 8s ease-in-out infinite alternate;
        }
        .animate-pulse-slow {
           animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .animate-ping-slow {
           animation: ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
      `}</style>

      {/* Eyes Container */}
      <div className={`flex items-center justify-center transition-all ${styles.container}`}>
        <div className={`${styles.eye} ${blinkClass}`} />
        <div className={`${styles.eye} ${blinkClass}`} />
      </div>
    </div>
  );
};

export default OrionEyes;