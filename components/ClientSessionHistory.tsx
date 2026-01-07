import React, { useState, useMemo } from 'react';
import { UserProfile, SessionRecord } from '../types';

interface ClientSessionHistoryProps {
  profile: UserProfile;
  onSessionSelect?: (session: SessionRecord) => void;
}

export const ClientSessionHistory: React.FC<ClientSessionHistoryProps> = ({
  profile,
  onSessionSelect
}) => {
  const [filterDate, setFilterDate] = useState<'all' | 'week' | 'month' | '3months'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'volume' | 'duration'>('date');
  const [selectedSession, setSelectedSession] = useState<SessionRecord | null>(null);

  const filteredAndSortedSessions = useMemo(() => {
    let sessions = [...(profile.sessionRecords || [])];

    // Filtrage par date
    if (filterDate !== 'all') {
      const now = new Date();
      const cutoffDate = new Date();
      
      switch (filterDate) {
        case 'week':
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          cutoffDate.setMonth(now.getMonth() - 1);
          break;
        case '3months':
          cutoffDate.setMonth(now.getMonth() - 3);
          break;
      }

      sessions = sessions.filter(s => new Date(s.date) >= cutoffDate);
    }

    // Tri
    sessions.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'volume':
          return (b.tonnage || 0) - (a.tonnage || 0);
        case 'duration':
          const durationA = a.exercices?.reduce((sum, ex) => sum + (ex.tempsEffortEffectif || 0) + (ex.tempsReposEffectif || 0), 0) || 0;
          const durationB = b.exercices?.reduce((sum, ex) => sum + (ex.tempsEffortEffectif || 0) + (ex.tempsReposEffectif || 0), 0) || 0;
          return durationB - durationA;
        default:
          return 0;
      }
    });

    return sessions;
  }, [profile.sessionRecords, filterDate, sortBy]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateDuration = (session: SessionRecord): number => {
    return session.exercices?.reduce((sum, ex) => 
      sum + (ex.tempsEffortEffectif || 0) + (ex.tempsReposEffectif || 0), 0) || 0;
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn pb-20 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <h2 className="text-4xl md:text-5xl font-bebas text-gray-800 uppercase tracking-tight">Historique des Séances</h2>
        
        <div className="flex flex-wrap gap-3">
          {/* Filtres par date */}
          <div className="flex gap-2">
            {(['all', 'week', 'month', '3months'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setFilterDate(period)}
                className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-500 ${
                  filterDate === period
                    ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-[0_4px_20px_rgba(20,184,166,0.3)] scale-105'
                    : 'bg-white/80 backdrop-blur-sm text-gray-600 hover:bg-gray-100/80 border border-gray-200/50 shadow-sm hover:shadow-md'
                }`}
              >
                {period === 'all' ? 'Tout' : 
                 period === 'week' ? '7 jours' :
                 period === 'month' ? '1 mois' : '3 mois'}
              </button>
            ))}
          </div>

          {/* Tri */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'volume' | 'duration')}
            className="px-5 py-2.5 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200/50 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500/50 shadow-sm hover:shadow-md transition-all duration-500"
          >
            <option value="date">Trier par date</option>
            <option value="volume">Trier par volume</option>
            <option value="duration">Trier par durée</option>
          </select>
        </div>
      </div>

      {filteredAndSortedSessions.length === 0 ? (
        <div className="p-16 rounded-3xl bg-white/95 backdrop-blur-xl border border-gray-200/50 shadow-[0_4px_20px_rgba(0,0,0,0.06)] text-center">
          <p className="text-gray-600 text-lg">Aucune séance trouvée pour cette période.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5">
          {filteredAndSortedSessions.map((session, index) => {
            const duration = calculateDuration(session);
            const exerciseCount = session.exercices?.length || 0;

            return (
              <div
                key={index}
                onClick={() => {
                  setSelectedSession(session);
                  onSessionSelect?.(session);
                }}
                className="p-8 rounded-3xl bg-white/95 backdrop-blur-xl border border-gray-200/50 shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_32px_rgba(56,189,248,0.12)] transition-all duration-500 cursor-pointer hover:scale-[1.02] group"
              >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center">
                        <span className="text-2xl">💪</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">
                          {formatDate(session.date)}
                        </h3>
                        <p className="text-sm text-gray-600">{session.focus || 'Séance d\'entraînement'}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div>
                        <p className="text-xs text-gray-600 uppercase mb-1">Volume</p>
                        <p className="text-base font-semibold text-gray-800">{Math.round(session.tonnage || 0)} kg</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 uppercase mb-1">Durée</p>
                        <p className="text-base font-semibold text-gray-800">{formatDuration(duration)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 uppercase mb-1">Exercices</p>
                        <p className="text-base font-semibold text-gray-800">{exerciseCount}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 uppercase mb-1">Humeur</p>
                        <p className="text-base font-semibold text-gray-800">{session.mood || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  <button className="px-8 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-full font-semibold text-sm hover:from-teal-600 hover:to-cyan-600 transition-all duration-500 shadow-[0_4px_20px_rgba(20,184,166,0.3)] hover:shadow-[0_8px_32px_rgba(20,184,166,0.4)] hover:scale-105 relative overflow-hidden group">
                    <span className="relative z-10">Voir détails</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  </button>
                </div>

                {session.debrief && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-600 uppercase mb-2">Feedback IA</p>
                    <p className="text-sm text-gray-700 line-clamp-2">{session.debrief}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

