import { useState, useCallback } from 'react';
import { WorkoutPlan, Exercise, PerformanceMetric, UserProfile } from '../types';
import { extractReps, calculateSuggestedWeight, updatePR } from '../services/weightCalculationService';

interface UseWorkoutOptions {
  profile: UserProfile | null;
  onSessionDataUpdate?: (data: PerformanceMetric[]) => void;
  onProfileUpdate?: (profile: UserProfile) => void;
}

export const useWorkout = (options: UseWorkoutOptions = {}) => {
  const { profile, onSessionDataUpdate, onProfileUpdate } = options;
  
  const [workout, setWorkout] = useState<WorkoutPlan | null>(null);
  const [currentExoIndex, setCurrentExoIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [sessionData, setSessionData] = useState<PerformanceMetric[]>([]);
  const [currentKg, setCurrentKg] = useState(0);

  const validateSet = useCallback((countdown: number) => {
    if (!workout || !profile) return;

    const currentExo = workout.liste_exos[currentExoIndex];
    const actualReps = extractReps(currentExo.reps);
    
    // Capture les données de la série
    const newMetric: PerformanceMetric = {
      name: currentExo.nom,
      volume: currentKg * actualReps,
      effortTime: countdown,
      restTime: currentExo.repos,
      weight: currentKg,
      reps: actualReps
    };

    const updatedSessionData = [...sessionData, newMetric];
    setSessionData(updatedSessionData);
    onSessionDataUpdate?.(updatedSessionData);
    
    // Met à jour le PR si nécessaire
    const updatedProfile = updatePR(profile, currentExo.nom, currentKg, actualReps);
    if (updatedProfile !== profile) {
      onProfileUpdate?.(updatedProfile);
    }

    // Gère la progression de la séance
    if (currentSet < currentExo.sets) {
      setCurrentSet(prev => prev + 1);
      setIsResting(true);
    } else {
      if (currentExoIndex + 1 < workout.liste_exos.length) {
        const nextIdx = currentExoIndex + 1;
        setCurrentExoIndex(nextIdx);
        setCurrentSet(1);
        setIsResting(true);
        const nextExo = workout.liste_exos[nextIdx];
        
        // Calcule le poids suggéré pour le prochain exercice
        const targetReps = extractReps(nextExo.reps);
        const suggestedWeight = calculateSuggestedWeight(profile, nextExo, targetReps);
        setCurrentKg(suggestedWeight);
      }
    }
  }, [workout, profile, currentExoIndex, currentSet, currentKg, sessionData, onSessionDataUpdate, onProfileUpdate]);

  const initializeWorkout = useCallback((newWorkout: WorkoutPlan) => {
    setWorkout(newWorkout);
    setCurrentExoIndex(0);
    setCurrentSet(1);
    setCurrentPhaseIndex(0);
    setIsResting(false);
    setSessionData([]);
    
    // Initialise le poids suggéré pour le premier exercice
    if (newWorkout.liste_exos.length > 0 && profile) {
      const firstExo = newWorkout.liste_exos[0];
      const targetReps = extractReps(firstExo.reps);
      const suggestedWeight = calculateSuggestedWeight(profile, firstExo, targetReps);
      setCurrentKg(suggestedWeight);
    }
  }, [profile]);

  const resetWorkout = useCallback(() => {
    setWorkout(null);
    setCurrentExoIndex(0);
    setCurrentSet(1);
    setCurrentPhaseIndex(0);
    setIsResting(false);
    setSessionData([]);
    setCurrentKg(0);
  }, []);

  const getCurrentExercise = useCallback((): Exercise | null => {
    if (!workout || currentExoIndex >= workout.liste_exos.length) return null;
    return workout.liste_exos[currentExoIndex];
  }, [workout, currentExoIndex]);

  return {
    workout,
    setWorkout,
    currentExoIndex,
    setCurrentExoIndex,
    currentSet,
    setCurrentSet,
    currentPhaseIndex,
    setCurrentPhaseIndex,
    isResting,
    setIsResting,
    sessionData,
    setSessionData,
    currentKg,
    setCurrentKg,
    validateSet,
    initializeWorkout,
    resetWorkout,
    getCurrentExercise
  };
};





