import React, { ReactNode } from 'react';
import { HygieLogo } from '../../../../components/HygieLogo';

export type CoachView = 'cockpit' | 'clients' | 'calendar' | 'library' | 'settings';

interface CoachLayoutProps {
  currentView: CoachView;
  onViewChange: (view: CoachView) => void;
  children: ReactNode;
  onLogout: () => void;
  onExportJSON: () => void;
  onExportCSV: () => void;
  onImport: () => void;
  onClearAll: () => void;
}

export const CoachLayout: React.FC<CoachLayoutProps> = ({
  currentView,
  onViewChange,
  children,
  onLogout,
  onExportJSON,
  onExportCSV,
  onImport,
  onClearAll
}) => {
  const menuItems: { id: CoachView; label: string; icon: string }[] = [
    { id: 'cockpit', label: 'Vue d\'ensemble', icon: '📊' },
    { id: 'clients', label: 'Clients', icon: '👥' },
    { id: 'calendar', label: 'Calendrier', icon: '📅' },
    { id: 'library', label: 'Bibliothèque', icon: '📚' },
    { id: 'settings', label: 'Paramètres', icon: '⚙️' }
  ];

  return (
    <div className="h-[100dvh] flex bg-white overflow-hidden" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
      {/* Sidebar Latérale Fixe - Design Moderne */}
      <aside className="w-72 shrink-0 bg-white border-r border-[#E5E7EB]/50 flex flex-col shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        {/* Logo et Header */}
        <div className="h-20 shrink-0 flex items-center gap-3 px-6 border-b border-[#E5E7EB]/50">
          <HygieLogo size="small" />
          <div>
            <h1 className="text-lg font-bold text-[#1F2937] tracking-tight">HYGIE</h1>
            <p className="text-[10px] font-medium text-[#6B7280] uppercase tracking-wider">Modérateur</p>
          </div>
        </div>

        {/* Navigation Menu - Design Moderne */}
        <nav className="flex-1 overflow-y-auto py-6 px-4">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => onViewChange(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-semibold transition-all duration-200 ${
                    currentView === item.id
                      ? 'bg-gradient-to-r from-[#F97316] to-[#EC4899] text-white shadow-md'
                      : 'text-[#6B7280] hover:bg-[#F9FAFB] hover:text-[#1F2937]'
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#E5E7EB]/50 space-y-2">
          <button
            onClick={onLogout}
            className="w-full px-4 py-3 text-sm font-semibold text-[#6B7280] hover:text-[#1F2937] hover:bg-[#F9FAFB] rounded-2xl transition-all duration-200"
          >
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Contenu Principal */}
      <main className="flex-1 flex flex-col overflow-hidden bg-white">
        {/* Header avec Actions - Design Moderne */}
        <header className="h-16 shrink-0 bg-white/95 backdrop-blur-sm border-b border-[#E5E7EB]/50 flex items-center justify-between px-8 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-[#1F2937] tracking-tight">
              {menuItems.find(m => m.id === currentView)?.label || 'Dashboard'}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Actions d'export/import */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#F9FAFB] rounded-full border border-[#E5E7EB]/50">
              <button
                onClick={onExportJSON}
                className="px-3 py-1.5 text-xs font-semibold text-[#6B7280] hover:text-[#007c89] hover:bg-white rounded-full transition-all duration-200"
                title="Exporter en JSON"
              >
                JSON
              </button>
              <button
                onClick={onExportCSV}
                className="px-3 py-1.5 text-xs font-semibold text-[#6B7280] hover:text-[#007c89] hover:bg-white rounded-full transition-all duration-200"
                title="Exporter en CSV"
              >
                CSV
              </button>
              <button
                onClick={onImport}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-[#F97316] to-[#EC4899] hover:shadow-md rounded-full transition-all duration-200"
                title="Importer depuis JSON"
              >
                Import
              </button>
            </div>

            <div className="w-px h-6 bg-[#E5E7EB]"></div>

            <button
              onClick={onClearAll}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#EF4444] hover:bg-[#DC2626] rounded-full transition-all duration-200 shadow-sm hover:shadow-md"
            >
              Supprimer
            </button>
          </div>
        </header>

        {/* Zone de contenu avec whitespace */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
          <div className="max-w-7xl mx-auto p-8 md:p-12">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};
