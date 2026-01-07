import React, { useRef } from 'react';
import { UserProfile } from '../types';

interface CoachDashboardViewProps {
  clients: UserProfile[];
  onSelectClient: (client: UserProfile, mode: 'DASHBOARD' | 'DAILY_CHECK') => void;
  onFileSelect: (file: File) => Promise<void>;
  onCreateClientClick: () => void;
  onAssessmentClick: (client: UserProfile) => void;
  onClearAllClients: () => void;
  onLogout: () => void;
}

export const CoachDashboardView: React.FC<CoachDashboardViewProps> = ({
  clients,
  onSelectClient,
  onFileSelect,
  onCreateClientClick,
  onAssessmentClick,
  onClearAllClients,
  onLogout
}) => {
  const dashboardFileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await onFileSelect(e.target.files[0]);
      e.target.value = '';
    }
  };

  return (
    <div className="h-[100dvh] flex flex-col bg-[#0d0d0d] overflow-hidden">
      <header className="h-20 shrink-0 border-b border-gray-900 flex items-center justify-between px-8 bg-black/40 backdrop-blur-3xl z-50">
        <h1 className="font-bebas text-2xl tracking-widest text-white">COMMAND CENTER</h1>
        <div className="flex gap-4 items-center">
          <button
            onClick={onClearAllClients}
            className="text-xs font-mono text-red-500 hover:text-red-400 uppercase border border-red-900/50 px-3 py-1 rounded hover:border-red-700"
          >
            SUPPRIMER TOUS
          </button>
          <button
            onClick={onLogout}
            className="text-xs font-mono text-gray-500 hover:text-white uppercase"
          >
            LOGOUT
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto custom-scrollbar p-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
          {/* Carte Nouveau Client (Import Rapide) */}
          <div
            onClick={() => dashboardFileInputRef.current?.click()}
            className="hud-card p-6 rounded-3xl bg-[#161616]/50 border-gray-800 border-dashed hover:border-[var(--elite-yellow)] cursor-pointer flex flex-col items-center justify-center gap-4 min-h-[300px] group relative overflow-hidden"
          >
            <input
              type="file"
              ref={dashboardFileInputRef}
              className="hidden"
              accept="image/*,.pdf"
              onChange={handleFileChange}
            />
            <div className="text-4xl text-gray-600 group-hover:text-[var(--elite-yellow)]">⇪</div>
            <h3 className="font-bebas text-2xl text-gray-500 group-hover:text-white">IMPORT RAPIDE</h3>
            <p className="text-[10px] text-gray-600 uppercase text-center">Glisser Bilan ou Clic</p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCreateClientClick();
              }}
              className="absolute bottom-6 text-[9px] font-mono text-gray-700 hover:text-[var(--elite-yellow)] uppercase z-10"
            >
              Ou Création Manuelle
            </button>
          </div>

          {/* Liste des Clients */}
          {clients.map(client => (
            <div key={client.id} className="hud-card p-6 rounded-3xl bg-[#161616] border-gray-800 hover:border-[var(--elite-yellow)] transition-all group">
              <div className="flex items-center gap-4 mb-6">
                <img src={client.avatar} alt={client.nom} className="w-16 h-16 rounded-full object-cover" />
                <div>
                  <h3 className="font-bebas text-2xl text-white">{client.nom}</h3>
                  <p className="text-[10px] font-mono text-gray-500 uppercase">
                    {client.activeGoal?.currentValue}% Complete
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onSelectClient(client, 'DASHBOARD')}
                  className="flex-1 py-3 bg-gray-800 text-white font-bebas rounded-xl hover:bg-[var(--elite-yellow)] hover:text-black uppercase text-sm"
                >
                  OUVRIR
                </button>
                <button
                  onClick={() => onAssessmentClick(client)}
                  className="w-12 flex items-center justify-center bg-gray-900 border border-gray-700 text-[var(--elite-yellow)] rounded-xl"
                >
                  ✚
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};





