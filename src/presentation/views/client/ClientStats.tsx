import React, { useMemo } from 'react';
import { UserProfile } from '../../../../types';
import { EnhancedAreaChart, EnhancedLineChart } from '../../../../components/ui/EnhancedChart';
import { ComparisonCharts } from '../../../../components/ComparisonCharts';

interface ClientStatsProps {
  profile: UserProfile;
}

export const ClientStats: React.FC<ClientStatsProps> = ({ profile }) => {
  const chartData = useMemo(() => {
    if (!profile) return { volumeData: [], goalData: [] };
    const volumeData = (profile.historique_dates || []).map((d, i) => ({
      date: d,
      v: (profile.historique_volume || [])[i] || 0
    }));
    const goalData = profile.activeGoal?.history || [];
    return { volumeData, goalData };
  }, [profile?.historique_dates, profile?.historique_volume, profile?.activeGoal?.history]);

  const dashboardStats = useMemo(() => {
    if (!profile) return { sessionCount: 0, maxVolume: 0, goalProgress: 0 };
    const sessionCount = profile.sessionRecords?.length || 0;
    const maxVolume = (profile.historique_volume || []).length > 0
      ? Math.max(...profile.historique_volume)
      : 0;
    const goalProgress = profile.activeGoal?.currentValue || 0;
    return { sessionCount, maxVolume, goalProgress };
  }, [profile?.sessionRecords, profile?.historique_volume, profile?.activeGoal?.currentValue]);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Graphiques principaux */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6">
          <EnhancedAreaChart
            data={chartData.volumeData}
            title="Volume Entraînement"
          />
        </div>
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6">
          <EnhancedLineChart
            data={chartData.goalData}
            title={`Progression Objectif (${Math.round(dashboardStats.goalProgress)}%)`}
          />
        </div>
      </div>

      {/* Métriques supplémentaires */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6 text-center hover:shadow-md transition-all">
          <p className="text-xs font-semibold text-[#007c89] uppercase mb-2 tracking-wider">Streak Actuel</p>
          <p className="text-3xl font-bebas text-[#1F2937]">{profile?.currentStreak || 0}</p>
        </div>
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6 text-center hover:shadow-md transition-all">
          <p className="text-xs font-semibold text-[#007c89] uppercase mb-2 tracking-wider">Record Streak</p>
          <p className="text-3xl font-bebas text-[#1F2937]">{profile?.longestStreak || 0}</p>
        </div>
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6 text-center hover:shadow-md transition-all">
          <p className="text-xs font-semibold text-[#007c89] uppercase mb-2 tracking-wider">Sessions</p>
          <p className="text-3xl font-bebas text-[#1F2937]">{dashboardStats.sessionCount}</p>
        </div>
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6 text-center hover:shadow-md transition-all">
          <p className="text-xs font-semibold text-[#007c89] uppercase mb-2 tracking-wider">Max Volume</p>
          <p className="text-3xl font-bebas text-[#1F2937]">{Math.round(dashboardStats.maxVolume)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6 text-center hover:shadow-md transition-all">
          <p className="text-xs font-semibold text-[#007c89] uppercase mb-2 tracking-wider">PR Battus</p>
          <p className="text-3xl font-bebas text-[#1F2937]">
            {Object.keys(profile?.personalBests || {}).length}
          </p>
        </div>
      </div>

      {/* Comparaisons temporelles */}
      {profile && (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6">
          <ComparisonCharts profile={profile} />
        </div>
      )}

      {/* Dernier conseil IA */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6">
        <p className="text-xs font-semibold text-[#007c89] uppercase tracking-wider mb-3">Dernier Conseil IA</p>
        <p className="text-lg text-[#1F2937] font-medium italic leading-relaxed">
          {profile?.dernier_feedback_ia || "Système en attente de données post-op."}
        </p>
      </div>
    </div>
  );
};

