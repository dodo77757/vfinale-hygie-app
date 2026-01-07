import React, { ReactNode } from 'react';
import { HygieLogo } from '../../../components/HygieLogo';

export type ClientView = 'home' | 'calendar' | 'stats' | 'profile';

interface ClientLayoutProps {
  currentView: ClientView;
  onViewChange: (view: ClientView) => void;
  children: ReactNode;
  onLogout: () => void;
  profileName?: string;
  // Focus Mode: cache la navigation pendant les séances
  isFocusMode?: boolean;
}

export const ClientLayout: React.FC<ClientLayoutProps> = ({
  currentView,
  onViewChange,
  children,
  onLogout,
  profileName,
  isFocusMode = false
}) => {
  const menuItems: { id: ClientView; label: string; icon: string }[] = [
    { id: 'home', label: 'Accueil', icon: '🏠' },
    { id: 'calendar', label: 'Calendrier', icon: '📅' },
    { id: 'stats', label: 'Progression', icon: '📈' },
    { id: 'profile', label: 'Profil', icon: '👤' }
  ];

  // En Focus Mode (séance active), on cache complètement la navigation
  if (isFocusMode) {
    return <div className="h-[100dvh] overflow-hidden">{children}</div>;
  }

  return (
    <div className="h-[100dvh] flex flex-col bg-white overflow-hidden" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
      {/* Header - Design Moderne et Épuré */}
      <header className="h-16 shrink-0 border-b border-[#E5E7EB]/50 flex items-center justify-between px-6 bg-white/95 backdrop-blur-sm shadow-[0_1px_3px_rgba(0,0,0,0.05)] z-40">
        <div className="flex items-center gap-3">
          <HygieLogo size="small" />
          <div>
            <h1 className="text-lg font-bold text-[#1F2937] tracking-tight">HYGIE</h1>
            {profileName && (
              <p className="text-[10px] font-medium text-[#6B7280] uppercase tracking-wider">{profileName}</p>
            )}
          </div>
        </div>
        <button
          onClick={onLogout}
          className="px-4 py-2 text-xs font-semibold text-[#6B7280] hover:text-[#1F2937] hover:bg-[#F9FAFB] rounded-full transition-all duration-200"
        >
          Déconnexion
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto custom-scrollbar pb-20 bg-white">
        {children}
      </main>

      {/* Bottom Navigation Bar - Glassmorphism Moderne */}
      <nav className="fixed bottom-0 left-0 right-0 h-20 bg-white/90 backdrop-blur-xl border-t border-[#E5E7EB]/50 shadow-[0_-10px_30px_-10px_rgba(0,0,0,0.05)] z-50">
        <div className="h-full flex items-center justify-around px-2 max-w-2xl mx-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`relative flex flex-col items-center justify-center gap-1.5 px-4 py-2 rounded-2xl transition-all duration-200 min-w-[70px] ${
                currentView === item.id
                  ? 'text-[#007c89]'
                  : 'text-[#6B7280] hover:text-[#1F2937]'
              }`}
            >
              <span className={`text-2xl transition-transform duration-200 ${currentView === item.id ? 'scale-110' : ''}`}>
                {item.icon}
              </span>
              <span className={`text-[10px] font-semibold uppercase tracking-wider ${currentView === item.id ? 'text-[#007c89]' : ''}`}>
                {item.label}
              </span>
              {currentView === item.id && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-10 h-1 bg-gradient-to-r from-[#F97316] to-[#EC4899] rounded-full"></div>
              )}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

