import React, { createContext, useContext, useState, ReactNode } from 'react';

// Types temporaires (Cursor va les remplacer par vos interfaces réelles : WorkoutPlan, SessionData, etc.)
type WorkoutPlan = any;
type SessionData = any;

interface WorkoutContextType {
  currentWorkout: WorkoutPlan | null;
  sessionData: SessionData | null;
  isSessionActive: boolean;
  startSession: (plan: WorkoutPlan) => void;
  finishSession: () => void;
  updateSessionData: (data: SessionData) => void;
  // Ajoutez ici d'autres méthodes si vous en avez (ex: validateSet, nextExercise...)
}

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

export const WorkoutProvider = ({ children }: { children: ReactNode }) => {
  const [currentWorkout, setCurrentWorkout] = useState<WorkoutPlan | null>(null);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [isSessionActive, setIsSessionActive] = useState(false);

  const startSession = (plan: WorkoutPlan) => {
    setCurrentWorkout(plan);
    setSessionData({}); // Initialise une nouvelle session vide
    setIsSessionActive(true);
  };

  const updateSessionData = (data: SessionData) => {
    setSessionData(data);
  };

  const finishSession = () => {
    // Ici on pourrait sauvegarder dans l'historique du client avant de fermer
    setIsSessionActive(false);
    setCurrentWorkout(null);
    setSessionData(null);
  };

  const value = {
    currentWorkout,
    sessionData,
    isSessionActive,
    startSession,
    finishSession,
    updateSessionData
  };

  return <WorkoutContext.Provider value={value}>{children}</WorkoutContext.Provider>;
};

export const useWorkout = () => {
  const context = useContext(WorkoutContext);
  if (context === undefined) {
    throw new Error('useWorkout doit être utilisé dans un WorkoutProvider');
  }
  return context;
};