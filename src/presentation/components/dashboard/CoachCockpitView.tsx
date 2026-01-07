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
      const hasHighPain = client.lastPainReport && client.lastPainReport.intensity >= 5;
      const hasBadSleep = client.sleepQuality === 'Mauvaise';
      const hasNegativeFeedback = client.sessionRecords?.some(sr => {
        const sessionDate = new Date(sr.date);
        const daysSince = Math.floor((Date.now() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));
        return daysSince <= 7 && (sr.mood === 'Mauvais' || sr.mood === 'Très mauvais');
      });
      const hasActiveInjuries = client.blessures_actives && client.blessures_actives.length > 0;
      
      return hasHighPain || hasBadSleep || hasNegativeFeedback || hasActiveInjuries;
    }).slice(0, 5);
  }, [clients]);

  // Calculer l'activité récente
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
      .slice(0, 5);
  }, [clients]);

  // Statistiques globales
  const stats = useMemo(() => {
    const totalClients = clients.length;
    const activeClients = clients.filter(c => {
      const hasRecentSession = c.sessionRecords && c.sessionRecords.length > 0;
      const lastSessionDate = hasRecentSession 
        ? new Date(c.sessionRecords[c.sessionRecords.length - 1].date)
        : null;
      const daysSinceLastSession = lastSessionDate 
        ? Math.floor((Date.now() - lastSessionDate.getTime()) / (1000 * 60 * 60 * 24))
        : Infinity;
      return daysSinceLastSession <= 30 && (c.activeProgram || hasRecentSession);
    }).length;
    
    const totalSessions = clients.reduce((sum, c) => sum + (c.sessionRecords?.length || 0), 0);
    const programsActive = clients.filter(c => c.activeProgram).length;
    
    return { totalClients, activeClients, totalSessions, programsActive };
  }, [clients]);

  return (
    <div className="space-y-8">
      {/* Header Moderne */}
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-[#1F2937] mb-3 tracking-tight">
          Vue d'ensemble
        </h1>
        <p className="text-base text-[#6B7280] font-normal">
          Tableau de bord du modérateur
        </p>
      </div>

      {/* Statistiques Globales - Cartes Modernes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-3xl p-6 border border-[#E5E7EB]/50 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FEF3C7] to-white flex items-center justify-center">
              <span className="text-2xl">👥</span>
            </div>
          </div>
          <p className="text-3xl font-bold text-[#1F2937] mb-1">{stats.totalClients}</p>
          <p className="text-sm text-[#6B7280] font-normal">Total Clients</p>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-[#E5E7EB]/50 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#DBEAFE] to-white flex items-center justify-center">
              <span className="text-2xl">✅</span>
            </div>
          </div>
          <p className="text-3xl font-bold text-[#1F2937] mb-1">{stats.activeClients}</p>
          <p className="text-sm text-[#6B7280] font-normal">Clients Actifs</p>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-[#E5E7EB]/50 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FCE7F3] to-white flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
          </div>
          <p className="text-3xl font-bold text-[#1F2937] mb-1">{stats.totalSessions}</p>
          <p className="text-sm text-[#6B7280] font-normal">Séances Total</p>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-[#E5E7EB]/50 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#D1FAE5] to-white flex items-center justify-center">
              <span className="text-2xl">🎯</span>
            </div>
          </div>
          <p className="text-3xl font-bold text-[#1F2937] mb-1">{stats.programsActive}</p>
          <p className="text-sm text-[#6B7280] font-normal">Programmes Actifs</p>
        </div>
      </div>

      {/* Grille des 3 sections critiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: À faire aujourd'hui */}
        <div className="bg-white rounded-3xl border border-[#E5E7EB]/50 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-[#1F2937] tracking-tight">À faire aujourd'hui</h2>
            <span className="px-4 py-1.5 bg-gradient-to-r from-[#F97316] to-[#EC4899] text-white text-sm font-semibold rounded-full shadow-sm">
              {todaySessions.length}
            </span>
          </div>
          
          {todaySessions.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#F3F4F6] to-[#E5E7EB] flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📅</span>
              </div>
              <p className="text-sm text-[#6B7280] font-normal">Aucune séance prévue aujourd'hui</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todaySessions.map(({ client, session }) => (
                <button
                  key={`${client.id}-${session.id}`}
                  onClick={() => onClientClick(client)}
                  className="w-full text-left p-5 rounded-2xl border border-[#E5E7EB]/50 bg-white hover:border-[#F97316]/50 hover:bg-gradient-to-br hover:from-[#FEF3C7]/20 hover:to-white transition-all duration-200 group shadow-sm hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-[#1F2937] group-hover:text-[#F97316] transition-colors mb-1">
                        {client.nom}
                      </p>
                      {session.notes && (
                        <p className="text-sm text-[#6B7280] font-normal">{session.notes}</p>
                      )}
                    </div>
                    <span className="text-sm font-semibold text-[#F97316] bg-gradient-to-br from-[#FEF3C7] to-white px-3 py-1.5 rounded-full border border-[#FCD34D]/30">
                      {new Date(session.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Section 2: Urgences */}
        <div className="bg-white rounded-3xl border border-[#E5E7EB]/50 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-[#1F2937] tracking-tight">Urgences</h2>
            {urgentClients.length > 0 && (
              <span className="px-4 py-1.5 bg-gradient-to-r from-[#EF4444] to-[#DC2626] text-white text-sm font-semibold rounded-full shadow-sm">
                {urgentClients.length}
              </span>
            )}
          </div>
          
          {urgentClients.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#D1FAE5] to-white flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">✅</span>
              </div>
              <p className="text-sm text-[#6B7280] font-normal">Aucune urgence détectée</p>
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
                    className="w-full text-left p-5 rounded-2xl border border-[#FEE2E2] bg-gradient-to-br from-[#FEF2F2] to-white hover:border-[#EF4444]/50 hover:shadow-md transition-all duration-200 group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-[#DC2626] group-hover:text-[#B91C1C] transition-colors mb-1">
                          {client.nom}
                        </p>
                        <p className="text-sm text-[#6B7280] font-normal">
                          {reasons.join(' • ')}
                        </p>
                      </div>
                      <span className="text-2xl">⚠️</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Section 3: Activité Récente (Full width) */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-[#E5E7EB]/50 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-[#1F2937] tracking-tight">Activité Récente</h2>
            <span className="px-4 py-1.5 bg-gradient-to-r from-[#10B981] to-[#059669] text-white text-sm font-semibold rounded-full shadow-sm">
              {recentActivity.length}
            </span>
          </div>
          
          {recentActivity.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#F3F4F6] to-[#E5E7EB] flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <p className="text-sm text-[#6B7280] font-normal">Aucune activité dans les dernières 24h</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentActivity.map(({ client, session }) => (
                <button
                  key={`${client.id}-${session.date}`}
                  onClick={() => onClientClick(client)}
                  className="text-left p-5 rounded-2xl border border-[#E5E7EB]/50 bg-white hover:border-[#10B981]/50 hover:bg-gradient-to-br hover:from-[#D1FAE5]/20 hover:to-white transition-all duration-200 group shadow-sm hover:shadow-md"
                >
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-semibold text-[#1F2937] group-hover:text-[#10B981] transition-colors">
                      {client.nom}
                    </p>
                    <span className="text-xs font-semibold text-[#10B981] bg-gradient-to-br from-[#D1FAE5] to-white px-2.5 py-1 rounded-full border border-[#A7F3D0]/30">
                      ✓ Complété
                    </span>
                  </div>
                  <p className="text-xs text-[#6B7280] font-normal mb-2">
                    {new Date(session.date).toLocaleString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                  {session.mood && (
                    <p className="text-xs text-[#6B7280] font-normal">
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
