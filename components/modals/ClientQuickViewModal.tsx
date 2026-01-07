import React from 'react';
import { UserProfile } from '../../types';
import { EnhancedAreaChart, EnhancedLineChart } from '../ui/EnhancedChart';

interface ClientQuickViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: UserProfile | null;
}

export const ClientQuickViewModal: React.FC<ClientQuickViewModalProps> = ({
  isOpen,
  onClose,
  client
}) => {
  if (!isOpen || !client) return null;

  const sessionCount = client.sessionRecords?.length || 0;
  const lastSession = client.sessionRecords && client.sessionRecords.length > 0
    ? client.sessionRecords[client.sessionRecords.length - 1]
    : null;
  const lastSessionDate = lastSession ? new Date(lastSession.date) : null;
  const daysSinceLastSession = lastSessionDate 
    ? Math.floor((Date.now() - lastSessionDate.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const programProgress = client.activeProgram
    ? ((client.activeProgram.currentWeek - 1) * client.activeProgram.sessionsPerWeek + client.activeProgram.currentSession) / (client.activeProgram.duration * client.activeProgram.sessionsPerWeek) * 100
    : null;

  const weeklySleep = client.weeklySleepAverage || (client.sleepQuality === 'Excellente' ? 9 : client.sleepQuality === 'Moyenne' ? 7 : 5);

  // Préparer les données pour les graphiques
  const volumeData = (client.historique_dates || []).map((date, i) => ({
    date,
    v: (client.historique_volume || [])[i] || 0
  }));

  const goalData = (client.activeGoal?.history || []).map(entry => ({
    date: entry.date,
    value: entry.value
  }));

  return (
    <div className="fixed inset-0 z-[1000] bg-[#181818]/80 flex items-center justify-center p-4 backdrop-blur-md" onClick={onClose}>
      <div 
        className="bg-white border border-[#007c89]/20 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar p-6 space-y-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Style Hygie */}
        <div className="flex items-center justify-between border-b border-[#007c89]/20 pb-4">
          <div className="flex items-center gap-4">
            <img src={client.avatar} alt={client.nom} className="w-16 h-16 rounded-full border-2 border-[#007c89]/30 object-cover" />
            <div>
              <h2 className="font-bebas text-3xl text-[#181818]">{client.nom}</h2>
              <p className="text-sm font-semibold text-[#007c89] uppercase">{client.objectifPrincipal || 'Aucun objectif'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#6B7280] hover:text-[#181818] text-2xl transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Statistiques rapides - Style Hygie */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-white border border-[#007c89]/20 shadow-sm">
            <div className="text-xs font-semibold text-[#007c89] uppercase mb-1 tracking-wider">SESSIONS</div>
            <div className="font-bebas text-2xl text-[#181818]">{sessionCount}</div>
          </div>
          <div className="p-4 rounded-lg bg-white border border-[#007c89]/20 shadow-sm">
            <div className="text-xs font-semibold text-[#007c89] uppercase mb-1 tracking-wider">DERNIÈRE SESSION</div>
            <div className="font-bebas text-xl text-[#181818]">
              {lastSessionDate 
                ? (daysSinceLastSession === 0 ? "AUJOURD'HUI" : daysSinceLastSession === 1 ? "HIER" : `IL Y A ${daysSinceLastSession}J`)
                : "JAMAIS"}
            </div>
          </div>
          <div className="p-4 rounded-lg bg-white border border-[#007c89]/20 shadow-sm">
            <div className="text-xs font-semibold text-[#007c89] uppercase mb-1 tracking-wider">PROGRESSION</div>
            <div className="font-bebas text-2xl text-[#181818]">
              {client.activeGoal?.currentValue ? `${Math.round(client.activeGoal.currentValue)}%` : 'N/A'}
            </div>
          </div>
          <div className="p-4 rounded-lg bg-white border border-[#007c89]/20 shadow-sm">
            <div className="text-xs font-semibold text-[#007c89] uppercase mb-1 tracking-wider">SOMMEIL</div>
            <div className="font-bebas text-2xl text-[#181818]">{weeklySleep.toFixed(1)}H</div>
          </div>
        </div>

        {/* Red Flags - Style Hygie */}
        {(client.lastPainReport || client.sleepQuality === 'Mauvaise' || (client.blessures_actives && client.blessures_actives.length > 0)) && (
          <div className="p-4 rounded-lg bg-[#FEE2E2] border-2 border-[#EF4444]">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">⚠️</span>
              <p className="text-xs font-bebas text-[#DC2626] uppercase tracking-wider font-bold">RED FLAGS</p>
            </div>
            <div className="space-y-2">
              {client.lastPainReport && (
                <div className="bg-white/80 rounded-md p-3 border border-[#EF4444]/30">
                  <p className="text-[#DC2626] font-bebas text-sm mb-1">📍 {client.lastPainReport.location}</p>
                  <div className="flex items-center gap-4">
                    <p className="text-[#6B7280] text-xs">Intensité: <span className="text-[#DC2626] font-bold">{client.lastPainReport.intensity}/10</span></p>
                    <p className="text-[#6B7280] text-[10px]">{client.lastPainReport.date}</p>
                  </div>
                </div>
              )}
              {client.sleepQuality === 'Mauvaise' && (
                <div className="bg-white/80 rounded-md p-3 border border-[#EF4444]/30">
                  <p className="text-[#DC2626] font-bebas text-sm">⚠️ Sommeil insuffisant - Risque de récupération altérée</p>
                </div>
              )}
              {client.blessures_actives && client.blessures_actives.length > 0 && (
                <div className="bg-white/80 rounded-md p-3 border border-[#EF4444]/30">
                  <p className="text-[#DC2626] font-bebas text-sm">⚠️ BLESSURES ACTIVES: {client.blessures_actives.join(', ').toUpperCase()}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Programme actif - Style Hygie */}
        {client.activeProgram && (
          <div className="p-4 rounded-lg bg-white border border-[#007c89]/20 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <p className="text-xs font-bebas text-[#007c89] uppercase tracking-wider">PROGRAMME ACTIF</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-base text-[#181818] font-bebas">{client.activeProgram.name || 'Programme actif'}</span>
                <span className="text-xs font-semibold text-[#6B7280]">
                  Semaine {client.activeProgram.currentWeek} / {client.activeProgram.duration}
                </span>
              </div>
              <div className="w-full bg-[#E5E7EB] rounded-full h-3 shadow-inner">
                <div 
                  className="bg-[#007c89] h-3 rounded-full transition-all"
                  style={{ width: `${Math.min(programProgress || 0, 100)}%` }}
                />
              </div>
              <p className="text-xs font-semibold text-[#6B7280] text-right">{Math.round(programProgress || 0)}% complété</p>
            </div>
          </div>
        )}

        {/* Graphiques - Style Hygie */}
        {volumeData.length > 0 && (
          <div className="p-4 rounded-lg bg-white border border-[#007c89]/20 shadow-sm">
            <p className="text-xs font-bebas text-[#007c89] uppercase tracking-wider mb-3">ÉVOLUTION DU VOLUME</p>
            <div className="h-48">
              <EnhancedAreaChart data={volumeData} title="" />
            </div>
          </div>
        )}

        {goalData.length > 0 && (
          <div className="p-4 rounded-lg bg-white border border-[#007c89]/20 shadow-sm">
            <p className="text-xs font-bebas text-[#007c89] uppercase tracking-wider mb-3">PROGRESSION DE L'OBJECTIF</p>
            <div className="h-48">
              <EnhancedLineChart data={goalData} title="" />
            </div>
          </div>
        )}

        {/* Notes privées - Style Hygie */}
        {client.private_notes && (
          <div className="p-4 rounded-lg bg-white border border-[#007c89]/20 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <p className="text-xs font-bebas text-[#007c89] uppercase tracking-wider">NOTES PRIVÉES</p>
            </div>
            <p className="text-sm text-[#181818] whitespace-pre-wrap">{client.private_notes}</p>
          </div>
        )}

        {/* Dernières sessions - Style Hygie */}
        {client.sessionRecords && client.sessionRecords.length > 0 && (
          <div className="p-4 rounded-lg bg-white border border-[#007c89]/20 shadow-sm">
            <p className="text-xs font-bebas text-[#007c89] uppercase tracking-wider mb-3">DERNIÈRES SESSIONS</p>
            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
              {client.sessionRecords.slice(-5).reverse().map((session, idx) => (
                <div key={idx} className="bg-[#f3efe5] rounded-md p-3 border border-[#007c89]/20">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bebas text-[#181818]">{new Date(session.date).toLocaleDateString('fr-FR')}</span>
                    <span className="text-[10px] font-semibold text-[#6B7280]">{session.tonnage}kg total</span>
                  </div>
                  {session.debrief && (
                    <p className="text-xs text-[#6B7280] line-clamp-2">{session.debrief}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer - Style Hygie */}
        <div className="flex justify-end gap-3 pt-4 border-t border-[#007c89]/20">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-[#007c89] text-white rounded-md text-sm font-bebas uppercase hover:bg-[#006a75] transition-all shadow-sm hover:shadow-md"
          >
            FERMER
          </button>
        </div>
      </div>
    </div>
  );
};

