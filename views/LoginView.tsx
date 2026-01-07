import React from 'react';
import { PerformanceBackground } from '../components/shared/PerformanceBackground';

interface LoginViewProps {
  onLogin: (role: 'COACH' | 'CLIENT') => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  return (
    <div className="h-[100dvh] flex flex-col items-center justify-center bg-[#0d0d0d] p-6 relative overflow-hidden">
      <PerformanceBackground />
      <div className="z-10 text-center space-y-12 w-full max-w-lg">
        <div>
          <h1 className="font-bebas text-6xl md:text-8xl tracking-widest text-white leading-none">
            HYGIE <span className="text-[var(--elite-yellow)]">ELITE</span>
          </h1>
          <p className="text-[10px] font-mono text-gray-500 tracking-[0.8em] uppercase mt-2">
            Neural Coaching Interface v20.0
          </p>
        </div>
        <div className="space-y-4">
          <button
            onClick={() => onLogin('COACH')}
            className="w-full py-6 border border-gray-700 hover:border-[var(--elite-yellow)] text-white hover:text-[var(--elite-yellow)] rounded-2xl font-bebas text-3xl tracking-wide transition-all uppercase"
            aria-label="Accéder au mode modérateur"
          >
            ACCÈS MODÉRATEUR
          </button>
          <button
            onClick={() => onLogin('CLIENT')}
            className="w-full py-6 bg-[var(--elite-yellow)] text-black rounded-2xl font-bebas text-3xl tracking-wide hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,215,0,0.2)] uppercase"
            aria-label="Accéder à l'espace client"
          >
            ESPACE CLIENT
          </button>
        </div>
      </div>
    </div>
  );
};

