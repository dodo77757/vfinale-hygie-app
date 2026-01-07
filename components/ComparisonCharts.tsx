import React, { useMemo } from 'react';
import { UserProfile } from '../types';

interface ComparisonChartsProps {
  profile: UserProfile;
}

export const ComparisonCharts: React.FC<ComparisonChartsProps> = ({ profile }) => {
  const weeklyComparison = useMemo(() => {
    const sessions = profile.sessionRecords || [];
    if (sessions.length < 2) return null;

    const now = new Date();
    const lastWeekStart = new Date(now);
    lastWeekStart.setDate(now.getDate() - 7);
    const twoWeeksAgoStart = new Date(now);
    twoWeeksAgoStart.setDate(now.getDate() - 14);

    const thisWeekSessions = sessions.filter(s => new Date(s.date) >= lastWeekStart);
    const lastWeekSessions = sessions.filter(s => {
      const date = new Date(s.date);
      return date >= twoWeeksAgoStart && date < lastWeekStart;
    });

    const thisWeekVolume = thisWeekSessions.reduce((sum, s) => sum + (s.tonnage || 0), 0);
    const lastWeekVolume = lastWeekSessions.reduce((sum, s) => sum + (s.tonnage || 0), 0);

    return {
      thisWeek: {
        sessions: thisWeekSessions.length,
        volume: thisWeekVolume
      },
      lastWeek: {
        sessions: lastWeekSessions.length,
        volume: lastWeekVolume
      },
      volumeChange: lastWeekVolume > 0 ? ((thisWeekVolume - lastWeekVolume) / lastWeekVolume) * 100 : 0,
      sessionsChange: lastWeekSessions.length > 0 ? ((thisWeekSessions.length - lastWeekSessions.length) / lastWeekSessions.length) * 100 : 0
    };
  }, [profile.sessionRecords]);

  if (!weeklyComparison) {
    return (
      <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm">
        <p className="text-gray-600 text-center">Pas assez de données pour la comparaison</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-800">Comparaison Hebdomadaire</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Volume */}
        <div className="p-6 rounded-xl bg-white border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-gray-800">Volume Total</p>
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${
              weeklyComparison.volumeChange > 0 ? 'bg-teal-100 text-teal-700' :
              weeklyComparison.volumeChange < 0 ? 'bg-red-100 text-red-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {weeklyComparison.volumeChange > 0 && '↑'}
              {weeklyComparison.volumeChange < 0 && '↓'}
              {weeklyComparison.volumeChange === 0 && '→'}
              <span>{Math.abs(Math.round(weeklyComparison.volumeChange))}%</span>
            </div>
          </div>
          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Cette semaine</span>
                <span className="font-semibold text-gray-800">{Math.round(weeklyComparison.thisWeek.volume)} kg</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-teal-500 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min((weeklyComparison.thisWeek.volume / Math.max(weeklyComparison.lastWeek.volume, weeklyComparison.thisWeek.volume)) * 100, 100)}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Semaine dernière</span>
                <span className="font-semibold text-gray-800">{Math.round(weeklyComparison.lastWeek.volume)} kg</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gray-400 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min((weeklyComparison.lastWeek.volume / Math.max(weeklyComparison.lastWeek.volume, weeklyComparison.thisWeek.volume)) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sessions */}
        <div className="p-6 rounded-xl bg-white border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-gray-800">Nombre de Sessions</p>
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${
              weeklyComparison.sessionsChange > 0 ? 'bg-teal-100 text-teal-700' :
              weeklyComparison.sessionsChange < 0 ? 'bg-red-100 text-red-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {weeklyComparison.sessionsChange > 0 && '↑'}
              {weeklyComparison.sessionsChange < 0 && '↓'}
              {weeklyComparison.sessionsChange === 0 && '→'}
              <span>{Math.abs(Math.round(weeklyComparison.sessionsChange))}%</span>
            </div>
          </div>
          <div className="flex items-end gap-4">
            <div className="flex-1 text-center">
              <p className="text-3xl font-bebas text-gray-800">{weeklyComparison.thisWeek.sessions}</p>
              <p className="text-xs text-gray-600 mt-1">Cette semaine</p>
            </div>
            <div className="w-px h-12 bg-gray-300" />
            <div className="flex-1 text-center">
              <p className="text-3xl font-bebas text-gray-600">{weeklyComparison.lastWeek.sessions}</p>
              <p className="text-xs text-gray-600 mt-1">Semaine dernière</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


