import { UserProfile, Achievement, PerformanceMetric } from '../types';

// Définitions des achievements disponibles
const ACHIEVEMENT_DEFINITIONS: Omit<Achievement, 'unlockedAt'>[] = [
  {
    id: 'first_session',
    name: 'Première Séance',
    description: 'Vous avez complété votre première séance !',
    icon: '🎯',
    category: 'session'
  },
  {
    id: '10_sessions',
    name: 'Débutant Confirmé',
    description: '10 séances complétées !',
    icon: '🔥',
    category: 'session'
  },
  {
    id: '50_sessions',
    name: 'Expert',
    description: '50 séances complétées !',
    icon: '💪',
    category: 'session'
  },
  {
    id: '100_sessions',
    name: 'Légende',
    description: '100 séances complétées !',
    icon: '👑',
    category: 'session'
  },
  {
    id: 'pr_broken',
    name: 'Record Personnel',
    description: 'Vous avez battu un record personnel !',
    icon: '🏆',
    category: 'pr'
  },
  {
    id: 'streak_7',
    name: 'Semaine Parfaite',
    description: '7 jours consécutifs de séances !',
    icon: '⚡',
    category: 'streak'
  },
  {
    id: 'streak_30',
    name: 'Mois Parfait',
    description: '30 jours consécutifs de séances !',
    icon: '🌟',
    category: 'streak'
  },
  {
    id: 'program_complete',
    name: 'Programme Terminé',
    description: 'Vous avez complété un programme entier !',
    icon: '✅',
    category: 'program'
  },
  {
    id: 'progress_50',
    name: 'À Mi-Chemin',
    description: '50% de progression vers votre objectif !',
    icon: '📈',
    category: 'progress'
  },
  {
    id: 'progress_100',
    name: 'Objectif Atteint',
    description: 'Vous avez atteint votre objectif !',
    icon: '🎉',
    category: 'progress'
  }
];

/**
 * Vérifie et débloque les achievements basés sur le profil et les données de session
 */
export const checkAchievements = (
  profile: UserProfile,
  sessionData?: PerformanceMetric[]
): Achievement[] => {
  const unlocked: Achievement[] = [];
  const existingAchievementIds = new Set(profile.achievements?.map(a => a.id) || []);

  // Achievement: Première séance
  if (profile.sessionRecords.length === 1 && !existingAchievementIds.has('first_session')) {
    unlocked.push({
      ...ACHIEVEMENT_DEFINITIONS.find(a => a.id === 'first_session')!,
      unlockedAt: new Date().toISOString()
    });
  }

  // Achievement: Nombre de séances
  const sessionCount = profile.sessionRecords.length;
  if (sessionCount >= 10 && !existingAchievementIds.has('10_sessions')) {
    unlocked.push({
      ...ACHIEVEMENT_DEFINITIONS.find(a => a.id === '10_sessions')!,
      unlockedAt: new Date().toISOString()
    });
  }
  if (sessionCount >= 50 && !existingAchievementIds.has('50_sessions')) {
    unlocked.push({
      ...ACHIEVEMENT_DEFINITIONS.find(a => a.id === '50_sessions')!,
      unlockedAt: new Date().toISOString()
    });
  }
  if (sessionCount >= 100 && !existingAchievementIds.has('100_sessions')) {
    unlocked.push({
      ...ACHIEVEMENT_DEFINITIONS.find(a => a.id === '100_sessions')!,
      unlockedAt: new Date().toISOString()
    });
  }

  // Achievement: Streaks
  const currentStreak = profile.currentStreak || 0;
  if (currentStreak >= 7 && !existingAchievementIds.has('streak_7')) {
    unlocked.push({
      ...ACHIEVEMENT_DEFINITIONS.find(a => a.id === 'streak_7')!,
      unlockedAt: new Date().toISOString()
    });
  }
  if (currentStreak >= 30 && !existingAchievementIds.has('streak_30')) {
    unlocked.push({
      ...ACHIEVEMENT_DEFINITIONS.find(a => a.id === 'streak_30')!,
      unlockedAt: new Date().toISOString()
    });
  }

  // Achievement: Progression objectif
  if (profile.activeGoal) {
    const progress = profile.activeGoal.currentValue;
    if (progress >= 50 && !existingAchievementIds.has('progress_50')) {
      unlocked.push({
        ...ACHIEVEMENT_DEFINITIONS.find(a => a.id === 'progress_50')!,
        unlockedAt: new Date().toISOString()
      });
    }
    if (progress >= 100 && !existingAchievementIds.has('progress_100')) {
      unlocked.push({
        ...ACHIEVEMENT_DEFINITIONS.find(a => a.id === 'progress_100')!,
        unlockedAt: new Date().toISOString()
      });
    }
  }

  // Achievement: Programme complété
  if (profile.activeProgram) {
    const programProgress = ((profile.activeProgram.currentWeek - 1) * profile.activeProgram.sessionsPerWeek + profile.activeProgram.currentSession) / 
                           (profile.activeProgram.duration * profile.activeProgram.sessionsPerWeek) * 100;
    if (programProgress >= 100 && !existingAchievementIds.has('program_complete')) {
      unlocked.push({
        ...ACHIEVEMENT_DEFINITIONS.find(a => a.id === 'program_complete')!,
        unlockedAt: new Date().toISOString()
      });
    }
  }

  // Achievement: PR battu (vérifié via sessionData si disponible)
  // Note: Ceci devrait être vérifié lors de la validation de série, pas ici
  // mais on peut le détecter si un nouveau PR a été enregistré

  return unlocked;
};

/**
 * Retourne tous les achievements débloqués
 */
export const getUnlockedAchievements = (profile: UserProfile): Achievement[] => {
  return profile.achievements || [];
};

/**
 * Calcule la progression vers le prochain achievement
 */
export const getProgressToNextAchievement = (profile: UserProfile): {
  nextAchievement: Omit<Achievement, 'unlockedAt'> | null;
  progress: number;
  current: number;
  target: number;
} => {
  const existingIds = new Set(profile.achievements?.map(a => a.id) || []);
  const sessionCount = profile.sessionRecords.length;

  // Trouve le prochain achievement de session non débloqué
  if (!existingIds.has('10_sessions') && sessionCount < 10) {
    return {
      nextAchievement: ACHIEVEMENT_DEFINITIONS.find(a => a.id === '10_sessions')!,
      progress: (sessionCount / 10) * 100,
      current: sessionCount,
      target: 10
    };
  }
  if (!existingIds.has('50_sessions') && sessionCount < 50) {
    return {
      nextAchievement: ACHIEVEMENT_DEFINITIONS.find(a => a.id === '50_sessions')!,
      progress: (sessionCount / 50) * 100,
      current: sessionCount,
      target: 50
    };
  }
  if (!existingIds.has('100_sessions') && sessionCount < 100) {
    return {
      nextAchievement: ACHIEVEMENT_DEFINITIONS.find(a => a.id === '100_sessions')!,
      progress: (sessionCount / 100) * 100,
      current: sessionCount,
      target: 100
    };
  }

  // Streak
  const currentStreak = profile.currentStreak || 0;
  if (!existingIds.has('streak_7') && currentStreak < 7) {
    return {
      nextAchievement: ACHIEVEMENT_DEFINITIONS.find(a => a.id === 'streak_7')!,
      progress: (currentStreak / 7) * 100,
      current: currentStreak,
      target: 7
    };
  }

  return {
    nextAchievement: null,
    progress: 100,
    current: 0,
    target: 0
  };
};


