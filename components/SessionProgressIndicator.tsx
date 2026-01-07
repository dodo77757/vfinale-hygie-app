import React from 'react';

interface SessionProgressIndicatorProps {
  currentStep: 'WARMUP' | 'WORKOUT' | 'STRETCH';
  warmupProgress?: number; // 0-100
  workoutProgress?: {
    currentExercise: number;
    totalExercises: number;
    currentSet: number;
    totalSets: number;
  };
  stretchProgress?: number; // 0-100
}

export const SessionProgressIndicator: React.FC<SessionProgressIndicatorProps> = ({
  currentStep,
  warmupProgress = 0,
  workoutProgress,
  stretchProgress = 0
}) => {
  const getStepLabel = () => {
    switch (currentStep) {
      case 'WARMUP':
        return 'Échauffement';
      case 'WORKOUT':
        return 'Séance';
      case 'STRETCH':
        return 'Récupération';
      default:
        return '';
    }
  };

  const getOverallProgress = () => {
    if (currentStep === 'WARMUP') {
      return warmupProgress * 0.2; // 20% de la séance totale
    } else if (currentStep === 'WORKOUT') {
      const exerciseProgress = workoutProgress 
        ? ((workoutProgress.currentExercise - 1) / workoutProgress.totalExercises) * 100
        : 0;
      const setProgress = workoutProgress
        ? ((workoutProgress.currentSet - 1) / workoutProgress.totalSets) * 100
        : 0;
      const currentExerciseProgress = workoutProgress
        ? (exerciseProgress + (setProgress / workoutProgress.totalExercises))
        : 0;
      return 20 + (currentExerciseProgress * 0.6); // 20-80% de la séance
    } else {
      return 80 + (stretchProgress * 0.2); // 80-100% de la séance
    }
  };

  const overallProgress = getOverallProgress();

  return (
    <div className="fixed top-16 left-0 right-0 z-40 bg-white/90 backdrop-blur-sm border-b-2 border-[#BAE6FD] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Phase actuelle */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                currentStep === 'WARMUP' ? 'bg-[#38BDF8]' : 
                currentStep === 'WORKOUT' ? 'bg-[#FBBF24]' : 
                'bg-[#7DD3FC]'
              }`} />
              <span className="text-sm font-semibold text-[#1F2937]">{getStepLabel()}</span>
            </div>
            
            {/* Détails selon la phase */}
            {currentStep === 'WORKOUT' && workoutProgress && (
              <div className="flex items-center gap-4 text-xs text-[#6B7280]">
                <span className="font-medium">
                  Exercice {workoutProgress.currentExercise}/{workoutProgress.totalExercises}
                </span>
                <span className="font-medium">
                  Série {workoutProgress.currentSet}/{workoutProgress.totalSets}
                </span>
              </div>
            )}
          </div>

          {/* Barre de progression globale */}
          <div className="flex-1 max-w-md">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-[#6B7280]">Progression</span>
              <span className="text-xs font-bold text-[#38BDF8]">{Math.round(overallProgress)}%</span>
            </div>
            <div className="w-full bg-[#E5E7EB] rounded-full h-2 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-[#38BDF8] to-[#7DD3FC] h-2 rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


