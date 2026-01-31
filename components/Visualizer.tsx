
import React from 'react';

interface VisualizerProps {
  isListening: boolean;
}

const Visualizer: React.FC<VisualizerProps> = ({ isListening }) => {
  // Criamos um array de alturas fixas para simular o formato de diamante/onda da imagem
  const barCounts = [10, 20, 30, 45, 60, 80, 100, 110, 100, 80, 60, 45, 30, 20, 10];

  return (
    <div className="flex items-center justify-center gap-[4px] h-[150px]">
      {barCounts.map((height, i) => (
        <div
          key={i}
          className={`w-[4px] bg-white rounded-full transition-all duration-300 ${isListening ? 'animate-pulse' : 'opacity-40'}`}
          style={{ 
            height: `${height}px`,
            animationDelay: `${i * 0.1}s`,
            animationDuration: isListening ? '0.8s' : '2s'
          }}
        />
      ))}
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scaleY(1); opacity: 0.8; }
          50% { transform: scaleY(1.3); opacity: 1; }
        }
        .animate-pulse {
          animation: pulse infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default Visualizer;
