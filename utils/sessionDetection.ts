import { UserProfile, PlannedSession } from '../types';

/**
 * Détecte la séance planifiée pour aujourd'hui
 */
export const getTodayPlannedSession = (profile: UserProfile | null): PlannedSession | null => {
  if (!profile?.plannedSessions) return null;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return profile.plannedSessions.find(ps => {
    const psDate = new Date(ps.date);
    psDate.setHours(0, 0, 0, 0);
    return psDate.getTime() === today.getTime() && ps.status !== 'completed';
  }) || null;
};

/**
 * Détecte une séance manquée hier
 */
export const getYesterdayMissedSession = (profile: UserProfile | null): PlannedSession | null => {
  if (!profile?.plannedSessions) return null;
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);
  
  return profile.plannedSessions.find(ps => {
    const psDate = new Date(ps.date);
    psDate.setHours(0, 0, 0, 0);
    return psDate.getTime() === yesterday.getTime() && ps.status !== 'completed';
  }) || null;
};

/**
 * Détermine le type de journée (séance prévue, séance manquée, jour de repos)
 */
export type DayType = 'session_planned' | 'session_missed' | 'rest_day' | 'free_session';

export const getDayType = (profile: UserProfile | null): { type: DayType; session: PlannedSession | null } => {
  if (!profile) return { type: 'rest_day', session: null };
  
  const todaySession = getTodayPlannedSession(profile);
  if (todaySession) {
    return { type: 'session_planned', session: todaySession };
  }
  
  const yesterdaySession = getYesterdayMissedSession(profile);
  if (yesterdaySession) {
    return { type: 'session_missed', session: yesterdaySession };
  }
  
  return { type: 'rest_day', session: null };
};

