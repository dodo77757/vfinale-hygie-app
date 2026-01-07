import React, { memo, useMemo } from 'react';

export const PerformanceBackground: React.FC = memo(() => {
  // Générer les styles une seule fois avec useMemo
  const flowLines = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const width = 20 + Math.random() * 30;
      const duration = 4 + Math.random() * 4;
      const delay = Math.random() * 5;
      return {
        key: i,
        top: `${15 + i * 15}%`,
        width: `${width}%`,
        animation: `flow-lines ${duration}s linear infinite`,
        animationDelay: `${delay}s`
      };
    });
  }, []); // Vide car on veut générer une seule fois

  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      <div className="performance-aura" />
      {flowLines.map((line) => (
        <div 
          key={line.key} 
          className="flow-line" 
          style={{ 
            top: line.top,
            width: line.width,
            animation: line.animation,
            animationDelay: line.animationDelay
          }} 
        />
      ))}
    </div>
  );
});

PerformanceBackground.displayName = 'PerformanceBackground';


