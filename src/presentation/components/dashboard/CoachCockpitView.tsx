import React, { useMemo } from 'react';
import { UserProfile, PlannedSession, SessionRecord } from '../../../../types';

interface CoachCockpitViewProps {
  clients: UserProfile[];
  onClientClick: (client: UserProfile) => void;
}

export const CoachCockpitView: React.FC<CoachCockpitViewProps> = ({
  clients,
  onClientClick
}) => {
  // Calculer les séances prévues aujourd'hui
  const todaySessions = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const sessions: Array<{ client: UserProfile; session: PlannedSession }> = [];
    
    clients.forEach(client => {
      client.plannedSessions?.forEach(ps => {
        const psDate = new Date(ps.date);
        psDate.setHours(0, 0, 0, 0);
        if (psDate.getTime() === today.getTime() && ps.status !== 'completed') {
          sessions.push({ client, session: ps });
        }
      });
    });
    
    return sessions.sort((a, b) => 
      new Date(a.session.date).getTime() - new Date(b.session.date).getTime()
    );
  }, [clients]);

  // Calculer les urgences
  const urgentClients = useMemo(() => {
    return clients.filter(client => {
      // Douleurs élevées
      const hasHighPain = client.lastPainReport && client.lastPainReport.intensity >= 5;
      
      // Sommeil de mauvaise qualité
      const hasBadSleep = client.sleepQuality === 'Mauvaise';
      
      // Feedback négatif récent
      const hasNegativeFeedback = client.sessionRecords?.some(sr => {
        const sessionDate = new Date(sr.date);
        const daysSince = Math.floor((Date.now() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));
        return daysSince <= 7 && (sr.mood === 'Mauvais' || sr.mood === 'Très mauvais');
      });
      
      // Blessures actives
      const hasActiveInjuries = client.blessures_actives && client.blessures_actives.length > 0;
      
      return hasHighPain || hasBadSleep || hasNegativeFeedback || hasActiveInjuries;
    }).slice(0, 5); // Limiter à 5 pour l'affichage
  }, [clients]);

  // Calculer l'activité récente (sessions complétées dans les 24h)
  const recentActivity = useMemo(() => {
    const now = Date.now();
    const twentyFourHoursAgo = now - (24 * 60 * 60 * 1000);
    
    const activities: Array<{ client: UserProfile; session: SessionRecord }> = [];
    
    clients.forEach(client => {
      client.sessionRecords?.forEach(sr => {
        const sessionTime = new Date(sr.date).getTime();
        if (sessionTime >= twentyFourHoursAgo && sessionTime <= now) {
          activities.push({ client, session: sr });
        }
      });
    });
    
    return activities
      .sort((a, b) => new Date(b.session.date).getTime() - new Date(a.session.date).getTime())
      .slice(0, 5); // Limiter à 5
  }, [clients]);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Titre principal */}
      <div className="mb-8">
        <h1 className="font-bebas text-4xl text-[#1F2937] mb-2">Vue d'ensemble</h1>
        <p className="text-sm text-[#6B7280] font-medium">Tableau de bord du modérateur</p>
      </div>

      {/* Grille des 3 sections critiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: À faire aujourd'hui */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bebas text-2xl text-[#1F2937]">À faire aujourd'hui</h2>
            <span className="px-3 py-1 bg-[#007c89] text-white text-xs font-semibold rounded-full">
              {todaySessions.length}
            </span>
          </div>
          
          {todaySessions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-[#6B7280] font-medium">Aucune séance prévue aujourd'hui</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todaySessions.map(({ client, session }) => (
                <button
                  key={`${client.id}-${session.id}`}
                  onClick={() => onClientClick(client)}
                  className="w-full text-left p-4 rounded-xl border border-[#E5E7EB] hover:border-[#007c89] hover:bg-[#F0FDF4] transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-[#1F2937] group-hover:text-[#007c89] transition-colors">
                        {client.nom}
                      </p>
                      {session.notes && (
                        <p className="text-xs text-[#6B7280] mt-1">{session.notes}</p>
                      )}
                    </div>
                    <span className="text-xs font-medium text-[#007c89] bg-[#E0F4F6] px-2 py-1 rounded-md">
                      {new Date(session.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Section 2: Urgences */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bebas text-2xl text-[#1F2937]">Urgences</h2>
            {urgentClients.length > 0 && (
              <span className="px-3 py-1 bg-[#EF4444] text-white text-xs font-semibold rounded-full">
                {urgentClients.length}
              </span>
            )}
          </div>
          
          {urgentClients.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-[#6B7280] font-medium">Aucune urgence détectée</p>
            </div>
          ) : (
            <div className="space-y-3">
              {urgentClients.map((client) => {
                const reasons: string[] = [];
                if (client.lastPainReport && client.lastPainReport.intensity >= 5) {
                  reasons.push('Douleur élevée');
                }
                if (client.sleepQuality === 'Mauvaise') {
                  reasons.push('Sommeil dégradé');
                }
                if (client.blessures_actives && client.blessures_actives.length > 0) {
                  reasons.push('Blessure active');
                }
                
                return (
                  <button
                    key={client.id}
                    onClick={() => onClientClick(client)}
                    className="w-full text-left p-4 rounded-xl border border-[#FEE2E2] bg-[#FEF2F2] hover:border-[#EF4444] hover:bg-[#FEE2E2] transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-[#DC2626] group-hover:text-[#B91C1C] transition-colors">
                          {client.nom}
                        </p>
                        <p className="text-xs text-[#6B7280] mt-1">
                          {reasons.join(' • ')}
                        </p>
                      </div>
                      <span className="text-lg">⚠️</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Section 3: Activité Récente (Full width) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bebas text-2xl text-[#1F2937]">Activité Récente</h2>
            <span className="px-3 py-1 bg-[#10B981] text-white text-xs font-semibold rounded-full">
              {recentActivity.length}
            </span>
          </div>
          
          {recentActivity.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-[#6B7280] font-medium">Aucune activité dans les dernières 24h</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentActivity.map(({ client, session }) => (
                <button
                  key={`${client.id}-${session.date}`}
                  onClick={() => onClientClick(client)}
                  className="text-left p-4 rounded-xl border border-[#E5E7EB] hover:border-[#10B981] hover:bg-[#F0FDF4] transition-all group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-[#1F2937] group-hover:text-[#10B981] transition-colors">
                      {client.nom}
                    </p>
                    <span className="text-xs font-medium text-[#10B981] bg-[#D1FAE5] px-2 py-1 rounded-md">
                      ✓ Complété
                    </span>
                  </div>
                  <p className="text-xs text-[#6B7280]">
                    {new Date(session.date).toLocaleString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                  {session.mood && (
                    <p className="text-xs text-[#6B7280] mt-1">
                      Humeur: {session.mood}
                    </p>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

