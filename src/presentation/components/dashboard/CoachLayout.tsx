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
    <div className="h-[100dvh] flex bg-[#F9FAFB] overflow-hidden">
      {/* Sidebar Latérale Fixe */}
      <aside className="w-64 shrink-0 bg-white border-r border-[#E5E7EB] flex flex-col shadow-sm">
        {/* Logo et Header */}
        <div className="h-20 shrink-0 flex items-center gap-3 px-6 border-b border-[#E5E7EB]">
          <HygieLogo size="small" />
          <div>
            <h1 className="font-bebas text-lg text-[#1F2937] tracking-wide">HYGIE</h1>
            <p className="text-[10px] font-medium text-[#6B7280] uppercase tracking-wider">Modérateur</p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => onViewChange(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    currentView === item.id
                      ? 'bg-[#007c89] text-white shadow-md'
                      : 'text-[#4B5563] hover:bg-[#F3F4F6] hover:text-[#1F2937]'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#E5E7EB] space-y-2">
          <button
            onClick={onLogout}
            className="w-full px-4 py-2.5 text-sm font-medium text-[#6B7280] hover:text-[#1F2937] hover:bg-[#F3F4F6] rounded-xl transition-all"
          >
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Contenu Principal */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header avec Actions */}
        <header className="h-16 shrink-0 bg-white border-b border-[#E5E7EB] flex items-center justify-between px-8 shadow-sm">
          <div className="flex items-center gap-2">
            <h2 className="font-bebas text-2xl text-[#1F2937]">
              {menuItems.find(m => m.id === currentView)?.label || 'Dashboard'}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {/* Actions d'export/import */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#F3F4F6] rounded-lg">
              <button
                onClick={onExportJSON}
                className="px-3 py-1.5 text-xs font-semibold text-[#007c89] hover:text-white hover:bg-[#007c89] rounded-md transition-all"
                title="Exporter en JSON"
              >
                JSON
              </button>
              <button
                onClick={onExportCSV}
                className="px-3 py-1.5 text-xs font-semibold text-[#007c89] hover:text-white hover:bg-[#007c89] rounded-md transition-all"
                title="Exporter en CSV"
              >
                CSV
              </button>
              <button
                onClick={onImport}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-[#007c89] hover:bg-[#006a75] rounded-md transition-all"
                title="Importer depuis JSON"
              >
                Import
              </button>
            </div>

            <div className="w-px h-6 bg-[#E5E7EB] mx-2"></div>

            <button
              onClick={onClearAll}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#EF4444] hover:bg-[#DC2626] rounded-lg transition-all shadow-sm hover:shadow-md"
            >
              Supprimer
            </button>
          </div>
        </header>

        {/* Zone de contenu avec whitespace */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#F9FAFB]">
          <div className="max-w-7xl mx-auto p-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

