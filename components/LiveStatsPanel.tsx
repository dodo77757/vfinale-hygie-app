import React, { useState } from 'react';
import { PerformanceMetric } from '../types';

interface LiveStatsPanelProps {
  sessionData: PerformanceMetric[];
  elapsedTime?: number; // en secondes
}

export const LiveStatsPanel: React.FC<LiveStatsPanelProps> = ({
  sessionData,
  elapsedTime = 0
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const totalVolume = sessionData.reduce((sum, metric) => sum + metric.volume, 0);
  const totalSets = sessionData.length;
  const totalEffortTime = sessionData.reduce((sum, metric) => sum + metric.effortTime, 0);
  
  // Estimation calories (approximatif : 0.1 cal/kg soulevé)
  const estimatedCalories = Math.round(totalVolume * 0.1);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isCollapsed) {
    return (
      <div className="fixed top-24 left-4 z-[100]">
        <button
          onClick={() => setIsCollapsed(false)}
          className="bg-teal-500 hover:bg-teal-600 text-white p-4 rounded-full shadow-md hover:shadow-lg transition-all duration-200"
          title="Afficher les statistiques"
        >
          <span className="text-2xl">📊</span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed top-24 left-4 z-[100] animate-fadeIn">
      <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition-all duration-200 min-w-[240px]">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">Statistiques</h3>
          <button
            onClick={() => setIsCollapsed(true)}
            className="text-gray-600 hover:text-gray-800 transition-colors duration-200 rounded-full w-8 h-8 flex items-center justify-center hover:bg-gray-50"
            title="Réduire"
          >
            <span className="text-lg leading-none">−</span>
          </button>
        </div>
        
        <div className="space-y-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center">
              <span className="text-xl">💪</span>
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Volume</p>
              <p className="text-base font-semibold text-gray-800">{Math.round(totalVolume)} kg</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center">
              <span className="text-xl">📋</span>
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Séries</p>
              <p className="text-base font-semibold text-gray-800">{totalSets}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center">
              <span className="text-xl">⏱️</span>
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Effort</p>
              <p className="text-base font-semibold text-gray-800">{formatTime(totalEffortTime)}</p>
            </div>
          </div>
          
          {estimatedCalories > 0 && (
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center">
                <span className="text-xl">🔥</span>
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Calories</p>
                <p className="text-base font-semibold text-gray-800">~{estimatedCalories}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

