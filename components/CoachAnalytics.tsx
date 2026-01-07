import React, { useMemo, useState } from 'react';
import { UserProfile } from '../types';
import { EnhancedAreaChart, EnhancedLineChart } from './ui/EnhancedChart';

interface CoachAnalyticsProps {
  clients: UserProfile[];
}

type TimeFilter = '7d' | '30d' | '90d' | '1y' | 'all';

export const CoachAnalytics: React.FC<CoachAnalyticsProps> = ({ clients }) => {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  // Volume total par semaine
  const weeklyVolumeData = useMemo(() => {
    const volumeByWeek: Record<string, number> = {};
    
    clients.forEach(client => {
      if (client.historique_dates && client.historique_volume) {
        client.historique_dates.forEach((date, idx) => {
          const weekKey = getWeekKey(new Date(date));
          volumeByWeek[weekKey] = (volumeByWeek[weekKey] || 0) + (client.historique_volume[idx] || 0);
        });
      }
    });

    return Object.entries(volumeByWeek)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, value]) => ({ date, value }));
  }, [clients]);

  // Taux de complétion des programmes
  const programCompletionRate = useMemo(() => {
    const clientsWithProgram = clients.filter(c => c.activeProgram);
    if (clientsWithProgram.length === 0) return 0;

    const totalProgress = clientsWithProgram.reduce((sum, c) => {
      if (!c.activeProgram) return sum;
      const progress = ((c.activeProgram.currentWeek - 1) * c.activeProgram.sessionsPerWeek + c.activeProgram.currentSession) / (c.activeProgram.duration * c.activeProgram.sessionsPerWeek) * 100;
      return sum + progress;
    }, 0);

    return totalProgress / clientsWithProgram.length;
  }, [clients]);

  // Distribution des objectifs
  const objectiveDistribution = useMemo(() => {
    const distribution: Record<string, number> = {};
    clients.forEach(client => {
      const objective = client.objectifPrincipal || 'Non défini';
      distribution[objective] = (distribution[objective] || 0) + 1;
    });
    return Object.entries(distribution)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5); // Top 5
  }, [clients]);

  // Évolution moyenne de progression
  const averageProgressData = useMemo(() => {
    const progressByDate: Record<string, number[]> = {};
    
    clients.forEach(client => {
      if (client.activeGoal?.history) {
        client.activeGoal.history.forEach(entry => {
          const dateKey = entry.date.split('T')[0];
          if (!progressByDate[dateKey]) {
            progressByDate[dateKey] = [];
          }
          progressByDate[dateKey].push(entry.value);
        });
      }
    });

    return Object.entries(progressByDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, values]) => ({
        date,
        value: values.reduce((sum, v) => sum + v, 0) / values.length
      }));
  }, [clients]);

  // Fonction helper pour obtenir la clé de semaine
  function getWeekKey(date: Date): string {
    const year = date.getFullYear();
    const week = getWeekNumber(date);
    return `${year}-W${week.toString().padStart(2, '0')}`;
  }

  function getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }

  // Filtre temporel
  const getDateFilter = () => {
    const now = Date.now();
    switch (timeFilter) {
      case '7d':
        return now - 7 * 24 * 60 * 60 * 1000;
      case '30d':
        return now - 30 * 24 * 60 * 60 * 1000;
      case '90d':
        return now - 90 * 24 * 60 * 60 * 1000;
      case '1y':
        return now - 365 * 24 * 60 * 60 * 1000;
      default:
        return 0;
    }
  };

  const dateFilter = getDateFilter();

  // Volume filtré par période
  const filteredWeeklyVolumeData = useMemo(() => {
    if (timeFilter === 'all') return weeklyVolumeData;
    
    return weeklyVolumeData.filter(entry => {
      const entryDate = new Date(entry.date).getTime();
      return entryDate >= dateFilter;
    });
  }, [weeklyVolumeData, timeFilter, dateFilter]);

  // Tendance de progression (calcul simple de régression linéaire)
  const progressTrend = useMemo(() => {
    if (averageProgressData.length < 2) return 0;
    
    const recent = averageProgressData.slice(-7);
    if (recent.length < 2) return 0;
    
    const first = recent[0].value;
    const last = recent[recent.length - 1].value;
    return last - first;
  }, [averageProgressData]);

  // Heatmap d'activité (sessions par jour de la semaine)
  const activityHeatmap = useMemo(() => {
    const heatmap: Record<string, number> = {};
    const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    
    clients.forEach(client => {
      if (client.sessionRecords) {
        client.sessionRecords.forEach(session => {
          const date = new Date(session.date);
          const dayName = days[date.getDay()];
          heatmap[dayName] = (heatmap[dayName] || 0) + 1;
        });
      }
    });
    
    return days.map(day => ({
      day,
      count: heatmap[day] || 0
    }));
  }, [clients]);

  return (
    <div className="p-6 rounded-lg bg-white border border-[#007c89]/20 shadow-md space-y-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bebas text-2xl text-[#181818] tracking-wider">Statistiques Avancées</h3>
        
        {/* Filtres temporels */}
        <div className="flex gap-2">
          {(['7d', '30d', '90d', '1y', 'all'] as TimeFilter[]).map(filter => (
            <button
              key={filter}
              onClick={() => setTimeFilter(filter)}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                timeFilter === filter
                  ? 'bg-[#007c89] text-white'
                  : 'bg-white text-[#181818] border border-[#007c89]/30 hover:bg-[#007c89]/10'
              }`}
            >
              {filter === '7d' ? '7j' : filter === '30d' ? '30j' : filter === '90d' ? '90j' : filter === '1y' ? '1an' : 'Tout'}
            </button>
          ))}
        </div>
      </div>

      {/* Métriques clés - Style Hygie */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-lg bg-[#007c89] border border-[#007c89] shadow-md">
          <div className="text-xs font-semibold text-white uppercase mb-2 tracking-wider">Complétion</div>
          <div className="font-bebas text-3xl text-white">
            {Math.round(programCompletionRate)}%
          </div>
        </div>
        <div className="p-5 rounded-lg bg-white border border-[#007c89]/30 shadow-md">
          <div className="text-xs font-semibold text-[#007c89] uppercase mb-2 tracking-wider">Avec Programme</div>
          <div className="font-bebas text-3xl text-[#181818]">
            {clients.filter(c => c.activeProgram).length}
          </div>
        </div>
        <div className="p-5 rounded-lg bg-white border border-[#007c89]/30 shadow-md">
          <div className="text-xs font-semibold text-[#007c89] uppercase mb-2 tracking-wider">Progression</div>
          <div className="font-bebas text-3xl text-[#181818]">
            {Math.round(clients.reduce((sum, c) => sum + (c.activeGoal?.currentValue || 0), 0) / Math.max(clients.length, 1))}%
          </div>
        </div>
        <div className="p-5 rounded-lg bg-white border border-[#007c89]/30 shadow-md">
          <div className="text-xs font-semibold text-[#007c89] uppercase mb-2 tracking-wider">Volume Total</div>
          <div className="font-bebas text-3xl text-[#181818]">
            {Math.round(clients.reduce((sum, c) => sum + (c.historique_volume?.reduce((s, v) => s + v, 0) || 0), 0) / 1000)}k kg
          </div>
        </div>
      </div>

      {/* Tendance de progression */}
      {progressTrend !== 0 && (
        <div className="p-5 rounded-lg bg-white border border-[#007c89]/20 shadow-md">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bebas text-[#181818] uppercase tracking-wider font-semibold">Tendance de Progression</p>
            <span className={`text-sm font-bold ${progressTrend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {progressTrend > 0 ? '↑' : '↓'} {Math.abs(progressTrend).toFixed(1)}%
            </span>
          </div>
          <p className="text-xs text-[#6B7280] mt-2">
            {progressTrend > 0 ? 'Progression positive sur les 7 derniers points' : 'Régression sur les 7 derniers points'}
          </p>
        </div>
      )}

      {/* Graphique volume total par semaine */}
      {filteredWeeklyVolumeData.length > 0 && (
        <div className="p-5 rounded-lg bg-white border border-[#007c89]/20 shadow-md">
          <p className="text-sm font-bebas text-[#181818] uppercase tracking-wider mb-4 font-semibold">Volume Total par Semaine</p>
          <div className="h-48">
            <EnhancedAreaChart data={filteredWeeklyVolumeData} />
          </div>
        </div>
      )}

      {/* Heatmap d'activité */}
      {activityHeatmap.length > 0 && (
        <div className="p-5 rounded-lg bg-white border border-[#007c89]/20 shadow-md">
          <p className="text-sm font-bebas text-[#181818] uppercase tracking-wider mb-4 font-semibold">Répartition des Sessions par Jour</p>
          <div className="grid grid-cols-7 gap-2">
            {activityHeatmap.map(({ day, count }) => {
              const maxCount = Math.max(...activityHeatmap.map(h => h.count));
              const intensity = maxCount > 0 ? (count / maxCount) * 100 : 0;
              
              return (
                <div key={day} className="text-center">
                  <div
                    className="h-16 rounded-md flex items-center justify-center text-white text-xs font-semibold mb-1"
                    style={{
                      backgroundColor: `rgba(0, 124, 137, ${0.3 + intensity / 100 * 0.7})`
                    }}
                  >
                    {count}
                  </div>
                  <p className="text-xs text-[#6B7280]">{day.substring(0, 3)}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Graphique progression moyenne */}
      {averageProgressData.length > 0 && (
        <div className="p-5 rounded-lg bg-white border border-[#007c89]/20 shadow-md">
          <p className="text-sm font-bebas text-[#181818] uppercase tracking-wider mb-4 font-semibold">Évolution Moyenne de Progression</p>
          <div className="h-48">
            <EnhancedLineChart data={averageProgressData} />
          </div>
        </div>
      )}

      {/* Distribution des objectifs */}
      {objectiveDistribution.length > 0 && (
        <div className="p-5 rounded-lg bg-white border border-[#007c89]/20 shadow-md">
          <p className="text-sm font-bebas text-[#181818] uppercase tracking-wider mb-4 font-semibold">Distribution des Objectifs</p>
          <div className="space-y-3">
            {objectiveDistribution.map(([objective, count]) => {
              const percentage = (count / clients.length) * 100;
              return (
                <div key={objective} className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-[#181818] font-semibold truncate flex-1 mr-2">{objective}</span>
                    <span className="text-[#6B7280] font-bold">{count} ({Math.round(percentage)}%)</span>
                  </div>
                  <div className="w-full bg-[#E5E7EB] rounded-full h-3 overflow-hidden shadow-inner">
                    <div
                      className="bg-[#007c89] h-3 rounded-full transition-all duration-500 shadow-sm"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

