import React, { ReactNode, memo } from 'react';

interface CoachClientViewProps {
  children: ReactNode;
  userRole: 'COACH' | 'CLIENT' | null;
}

export const CoachClientView: React.FC<CoachClientViewProps> = memo(({ children, userRole }) => {
  if (userRole !== 'COACH') {
    return <>{children}</>;
  }

  return (
    <div className="relative min-h-screen">
      {/* Bordure distinctive pour le mode supervision - Style Hygie */}
      <div className="fixed inset-0 border-4 border-[#007c89] pointer-events-none z-[90] opacity-30" />
      <div className="fixed top-0 left-0 bg-[#007c89] text-white px-6 py-2 rounded-br-lg z-[91] shadow-lg" role="banner" aria-label="Mode supervision actif">
        <p className="text-xs font-bebas uppercase tracking-widest font-bold">MODE SUPERVISION</p>
      </div>
      {/* Indicateur visuel supplémentaire - Style Hygie */}
      <div className="fixed top-0 right-0 bg-[#007c89]/10 backdrop-blur-sm px-4 py-2 rounded-bl-lg z-[91] border-l-2 border-b-2 border-[#007c89]">
        <p className="text-xs font-semibold text-[#007c89] uppercase">ÉDITION ACTIVE</p>
      </div>
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
});

CoachClientView.displayName = 'CoachClientView';

