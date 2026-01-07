import React, { useMemo } from 'react';
import { UserProfile, ActiveGoal } from '../types';

interface GoalTrackerProps {
  profile: UserProfile;
}

export const GoalTracker: React.FC<GoalTrackerProps> = ({ profile }) => {
  const goal = profile.activeGoal;

  const progress = useMemo(() => {
    if (!goal) return 0;
    return Math.min((goal.currentValue / goal.targetValue) * 100, 100);
  }, [goal]);

  const estimatedCompletionDate = useMemo(() => {
    if (!goal || !goal.history || goal.history.length < 2) return null;
    
    const recentHistory = goal.history.slice(-7); // Dernières 7 entrées
    if (recentHistory.length < 2) return null;

    const progressPerDay = recentHistory.reduce((sum, entry, index) => {
      if (index === 0) return 0;
      const prevEntry = recentHistory[index - 1];
      const daysDiff = (new Date(entry.date).getTime() - new Date(prevEntry.date).getTime()) / (1000 * 60 * 60 * 24);
      const progressDiff = entry.value - prevEntry.value;
      return sum + (progressDiff / daysDiff);
    }, 0) / (recentHistory.length - 1);

    if (progressPerDay <= 0) return null;

    const remainingProgress = goal.targetValue - goal.currentValue;
    const daysRemaining = remainingProgress / progressPerDay;
    const completionDate = new Date();
    completionDate.setDate(completionDate.getDate() + daysRemaining);

    return completionDate;
  }, [goal]);

  const trend = useMemo(() => {
    if (!goal || !goal.history || goal.history.length < 2) return 'stable';
    
    const recent = goal.history.slice(-3);
    const older = goal.history.slice(-6, -3);
    
    if (recent.length === 0 || older.length === 0) return 'stable';
    
    const recentAvg = recent.reduce((sum, e) => sum + e.value, 0) / recent.length;
    const olderAvg = older.reduce((sum, e) => sum + e.value, 0) / older.length;
    
    const diff = recentAvg - olderAvg;
    if (diff > 2) return 'up';
    if (diff < -2) return 'down';
    return 'stable';
  }, [goal]);

  if (!goal) {
    return (
      <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm">
        <p className="text-gray-600 text-center">Aucun objectif actif</p>
      </div>
    );
  }

  const circumference = 2 * Math.PI * 90; // Rayon de 90
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="p-8 rounded-3xl bg-white/95 backdrop-blur-xl border border-gray-200/50 shadow-[0_8px_32px_rgba(31,38,135,0.08)] hover:shadow-[0_12px_48px_rgba(56,189,248,0.12)] transition-all duration-500">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-2xl font-semibold text-gray-800 tracking-tight">Objectif Actuel</h3>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold backdrop-blur-sm ${
          trend === 'up' ? 'bg-teal-100/80 text-teal-700 border border-teal-200/50' :
          trend === 'down' ? 'bg-red-100/80 text-red-700 border border-red-200/50' :
          'bg-gray-100/80 text-gray-700 border border-gray-200/50'
        }`}>
          {trend === 'up' && '↑'}
          {trend === 'down' && '↓'}
          {trend === 'stable' && '→'}
          <span className="ml-1">
            {trend === 'up' ? 'En hausse' : trend === 'down' ? 'En baisse' : 'Stable'}
          </span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-center">
        {/* Graphique circulaire */}
        <div className="relative w-48 h-48">
          <svg className="transform -rotate-90" width="192" height="192">
            <circle
              cx="96"
              cy="96"
              r="90"
              stroke="#E5E7EB"
              strokeWidth="12"
              fill="none"
            />
            <circle
              cx="96"
              cy="96"
              r="90"
              stroke="#14B8A6"
              strokeWidth="12"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold text-gray-800">{Math.round(progress)}%</span>
            <span className="text-sm text-gray-600 mt-1">Complété</span>
          </div>
        </div>

        {/* Détails */}
        <div className="flex-1 space-y-4">
          <div>
            <p className="text-sm text-gray-600 uppercase mb-1">Objectif</p>
            <p className="text-lg font-semibold text-gray-800">{goal.label}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-sm hover:shadow-md transition-all duration-500">
              <p className="text-xs text-gray-600 uppercase mb-2 tracking-wider">Valeur Actuelle</p>
              <p className="text-lg font-semibold text-gray-800">
                {goal.currentValue.toFixed(1)} {goal.unit}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-sm hover:shadow-md transition-all duration-500">
              <p className="text-xs text-gray-600 uppercase mb-2 tracking-wider">Objectif</p>
              <p className="text-lg font-semibold text-gray-800">
                {goal.targetValue} {goal.unit}
              </p>
            </div>
          </div>

          {estimatedCompletionDate && (
            <div className="p-5 rounded-2xl bg-teal-50/80 backdrop-blur-sm border border-teal-200/50 shadow-sm hover:shadow-md transition-all duration-500">
              <p className="text-xs text-teal-700 uppercase mb-2 tracking-wider">Date Estimée</p>
              <p className="text-base font-semibold text-teal-800">
                {estimatedCompletionDate.toLocaleDateString('fr-FR', { 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </p>
            </div>
          )}

          {goal.deadline && (
            <div className="p-5 rounded-2xl bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-sm hover:shadow-md transition-all duration-500">
              <p className="text-xs text-gray-600 uppercase mb-2 tracking-wider">Échéance</p>
              <p className="text-base font-semibold text-gray-800">
                {new Date(goal.deadline).toLocaleDateString('fr-FR', { 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Timeline des jalons */}
      {goal.history && goal.history.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm font-semibold text-gray-800 mb-3">Progression Récente</p>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {goal.history.slice(-10).map((entry, index) => {
              const entryProgress = (entry.value / goal.targetValue) * 100;
              return (
                <div key={index} className="flex-shrink-0 text-center">
                  <div className="w-12 h-12 rounded-full bg-teal-50 border-2 border-teal-500 flex items-center justify-center mb-2">
                    <span className="text-xs font-semibold text-teal-700">{Math.round(entryProgress)}%</span>
                  </div>
                  <p className="text-xs text-gray-600">
                    {new Date(entry.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

