import React, { useMemo } from 'react';
import { UserProfile } from '../types';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface CalendarStatsProps {
  clients: UserProfile[];
}

export const CalendarStats: React.FC<CalendarStatsProps> = ({ clients }) => {
  // Calculer les statistiques
  const stats = useMemo(() => {
    const allPlannedSessions = clients.flatMap(c => c.plannedSessions || []);
    const allCompletedSessions = clients.flatMap(c => c.sessionRecords || []);
    
    // Sessions planifiées vs complétées
    const plannedCount = allPlannedSessions.length;
    const completedCount = allCompletedSessions.length;
    
    // Sessions complétées qui étaient planifiées
    const completedPlanned = allPlannedSessions.filter(planned => {
      const plannedDate = new Date(planned.date);
      return allCompletedSessions.some(completed => {
        const completedDate = new Date(completed.date);
        return (
          plannedDate.getFullYear() === completedDate.getFullYear() &&
          plannedDate.getMonth() === completedDate.getMonth() &&
          plannedDate.getDate() === completedDate.getDate() &&
          planned.clientId === completed.clientId
        );
      });
    }).length;
    
    const completionRate = plannedCount > 0 ? (completedPlanned / plannedCount) * 100 : 0;
    
    // Sessions en retard (planifiées dans le passé non complétées)
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const overdueSessions = allPlannedSessions.filter(planned => {
      const plannedDate = new Date(planned.date);
      plannedDate.setHours(0, 0, 0, 0);
      if (plannedDate >= now) return false;
      
      // Vérifier si complétée
      return !allCompletedSessions.some(completed => {
        const completedDate = new Date(completed.date);
        completedDate.setHours(0, 0, 0, 0);
        return (
          plannedDate.getTime() === completedDate.getTime() &&
          planned.clientId === completed.clientId
        );
      });
    }).length;
    
    // Charge de travail par jour de la semaine
    const workloadByDay: Record<number, number> = {};
    allPlannedSessions.forEach(planned => {
      const date = new Date(planned.date);
      const dayOfWeek = date.getDay();
      workloadByDay[dayOfWeek] = (workloadByDay[dayOfWeek] || 0) + 1;
    });
    
    // Charge de travail par semaine (7 dernières semaines)
    const workloadByWeek: Array<{ week: string; weekLabel: string; planned: number; completed: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (i * 7));
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      // Format: "01/07" pour le début de semaine
      const weekKey = weekStart.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
      const weekLabel = `${weekKey}`;
      
      const planned = allPlannedSessions.filter(ps => {
        const date = new Date(ps.date);
        date.setHours(0, 0, 0, 0);
        return date >= weekStart && date <= weekEnd;
      }).length;
      
      const completed = allCompletedSessions.filter(cs => {
        const date = new Date(cs.date);
        date.setHours(0, 0, 0, 0);
        return date >= weekStart && date <= weekEnd;
      }).length;
      
      workloadByWeek.push({ week: weekKey, weekLabel, planned, completed });
    }
    
    // Répartition par client
    const sessionsByClient: Record<string, { planned: number; completed: number }> = {};
    clients.forEach(client => {
      sessionsByClient[client.id] = {
        planned: client.plannedSessions?.length || 0,
        completed: client.sessionRecords?.length || 0
      };
    });
    
    return {
      plannedCount,
      completedCount,
      completionRate,
      overdueSessions,
      workloadByDay,
      workloadByWeek,
      sessionsByClient
    };
  }, [clients]);

  const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  return (
    <div className="p-6 rounded-lg bg-white border border-[#007c89]/20 shadow-md space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-bebas text-2xl text-[#181818] tracking-wider">Statistiques du Calendrier</h3>
      </div>

      {/* Métriques clés */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-lg bg-[#007c89] border border-[#007c89] shadow-md">
          <div className="text-[10px] font-semibold text-white uppercase mb-1 tracking-wider">
            Planifiées
          </div>
          <div className="font-bebas text-2xl text-white">{stats.plannedCount}</div>
        </div>
        <div className="p-4 rounded-lg bg-white border border-[#007c89]/30 shadow-md">
          <div className="text-[10px] font-semibold text-[#007c89] uppercase mb-1 tracking-wider">
            Complétées
          </div>
          <div className="font-bebas text-2xl text-[#181818]">{stats.completedCount}</div>
        </div>
        <div className="p-4 rounded-lg bg-white border border-[#007c89]/30 shadow-md">
          <div className="text-[10px] font-semibold text-[#007c89] uppercase mb-1 tracking-wider">
            Taux Complétion
          </div>
          <div className="font-bebas text-2xl text-[#181818]">
            {Math.round(stats.completionRate)}%
          </div>
        </div>
        <div className="p-4 rounded-lg bg-white border border-[#EF4444]/30 shadow-md">
          <div className="text-[10px] font-semibold text-[#EF4444] uppercase mb-1 tracking-wider">
            En Retard
          </div>
          <div className="font-bebas text-2xl text-[#EF4444]">{stats.overdueSessions}</div>
        </div>
      </div>

      {/* Graphique charge hebdomadaire */}
      <div className="p-4 rounded-lg bg-[#f3efe5] border border-[#007c89]/20 shadow-md">
        <p className="text-xs font-bebas text-[#181818] uppercase tracking-wider mb-3 font-semibold">
          Charge de Travail (7 dernières semaines)
        </p>
        <div className="h-40">
          {stats.workloadByWeek.length > 0 ? (
            <CalendarWorkloadChart data={stats.workloadByWeek} />
          ) : (
            <div className="flex items-center justify-center h-full text-[#6B7280] text-xs">
              Aucune donnée disponible
            </div>
          )}
        </div>
        {stats.workloadByWeek.length > 0 && (
          <div className="mt-3 flex items-center justify-center gap-4 text-[10px]">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-[#007c89]"></div>
              <span className="text-[#181818]">Planifiées</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-[#10B981]"></div>
              <span className="text-[#181818]">Complétées</span>
            </div>
          </div>
        )}
      </div>

      {/* Répartition par jour de semaine */}
      <div className="p-4 rounded-lg bg-[#f3efe5] border border-[#007c89]/20 shadow-md">
        <p className="text-xs font-bebas text-[#181818] uppercase tracking-wider mb-3 font-semibold">
          Répartition par Jour de Semaine
        </p>
        <div className="space-y-2">
          {dayNames.map((dayName, idx) => {
            const count = stats.workloadByDay[idx] || 0;
            const maxCount = Math.max(...Object.values(stats.workloadByDay), 1);
            const percentage = (count / maxCount) * 100;

            return (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#181818] font-semibold">{dayName}</span>
                  <span className="text-[#6B7280] font-bold text-[10px]">{count} session{count > 1 ? 's' : ''}</span>
                </div>
                <div className="w-full bg-[#E5E7EB] rounded-full h-2 overflow-hidden shadow-inner">
                  <div
                    className="bg-[#007c89] h-2 rounded-full transition-all duration-500 shadow-sm"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top clients */}
      <div className="p-4 rounded-lg bg-[#f3efe5] border border-[#007c89]/20 shadow-md">
        <p className="text-xs font-bebas text-[#181818] uppercase tracking-wider mb-3 font-semibold">
          Répartition par Client
        </p>
        <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
          {Object.entries(stats.sessionsByClient)
            .sort(([, a], [, b]) => (b.planned + b.completed) - (a.planned + a.completed))
            .slice(0, 5)
            .map(([clientId, counts]) => {
              const client = clients.find(c => c.id === clientId);
              if (!client) return null;

              return (
                <div key={clientId} className="flex items-center justify-between p-2 bg-white rounded-md border border-[#007c89]/10">
                  <span className="text-xs text-[#181818] font-semibold truncate flex-1">{client.nom}</span>
                  <div className="flex gap-2 text-[10px] ml-2">
                    <span className="text-[#6B7280]">
                      P: <span className="font-bold text-[#181818]">{counts.planned}</span>
                    </span>
                    <span className="text-[#6B7280]">
                      C: <span className="font-bold text-[#181818]">{counts.completed}</span>
                    </span>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};

// Composant graphique personnalisé pour la charge de travail
interface CalendarWorkloadChartProps {
  data: Array<{ week: string; weekLabel: string; planned: number; completed: number }>;
}

const CalendarWorkloadChart: React.FC<CalendarWorkloadChartProps> = ({ data }) => {
  const chartData = data.map(w => ({
    semaine: w.weekLabel,
    planifiées: w.planned,
    complétées: w.completed
  }));

  const maxValue = Math.max(
    ...chartData.map(d => Math.max(d.planifiées, d.complétées)),
    1
  );

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-[#007c89]/30 rounded-md p-2 shadow-lg">
          <p className="text-[10px] font-semibold text-[#007c89] uppercase mb-1">
            {payload[0].payload.semaine}
          </p>
          <div className="space-y-1">
            <p className="text-xs text-[#181818]">
              <span className="font-semibold text-[#007c89]">Planifiées:</span>{' '}
              <span className="font-bold">{payload[0].payload.planifiées}</span>
            </p>
            <p className="text-xs text-[#181818]">
              <span className="font-semibold text-[#10B981]">Complétées:</span>{' '}
              <span className="font-bold">{payload[0].payload.complétées}</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={chartData}
        margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
      >
        <defs>
          <linearGradient id="gradientPlanned" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#007c89" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#007c89" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradientCompleted" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="semaine"
          stroke="#6B7280"
          tick={{ fill: '#6B7280', fontSize: 9 }}
          interval={0}
          angle={-45}
          textAnchor="end"
          height={50}
        />
        <YAxis
          stroke="#6B7280"
          tick={{ fill: '#6B7280', fontSize: 9 }}
          domain={[0, Math.ceil(maxValue * 1.1)]}
          tickFormatter={(value) => `${value}`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="planifiées"
          stroke="#007c89"
          strokeWidth={2}
          fill="url(#gradientPlanned)"
          dot={{ fill: '#007c89', r: 3 }}
          activeDot={{ r: 5 }}
        />
        <Area
          type="monotone"
          dataKey="complétées"
          stroke="#10B981"
          strokeWidth={2}
          fill="url(#gradientCompleted)"
          dot={{ fill: '#10B981', r: 3 }}
          activeDot={{ r: 5 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

