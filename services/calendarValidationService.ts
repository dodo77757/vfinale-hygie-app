import { UserProfile } from '../types';

/**
 * Service de validation pour le calendrier
 */
export const CalendarValidationService = {
  /**
   * Vérifie si un client a déjà une session (planifiée ou complétée) à une date donnée
   */
  hasSessionOnDate: (client: UserProfile, date: Date): boolean => {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    // Vérifier les sessions planifiées
    const hasPlannedSession = client.plannedSessions?.some(ps => {
      const psDate = new Date(ps.date);
      psDate.setHours(0, 0, 0, 0);
      return psDate.getTime() === targetDate.getTime();
    });

    if (hasPlannedSession) return true;

    // Vérifier les sessions complétées
    const hasCompletedSession = client.sessionRecords?.some(sr => {
      const srDate = new Date(sr.date);
      srDate.setHours(0, 0, 0, 0);
      return srDate.getTime() === targetDate.getTime();
    });

    return hasCompletedSession || false;
  },

  /**
   * Vérifie si une date est valide pour planifier une session (pas dans le passé, pas déjà occupée)
   */
  canPlanSessionOnDate: (client: UserProfile, date: Date): { canPlan: boolean; reason?: string } => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    // Vérifier si la date est dans le passé
    if (targetDate < now) {
      return {
        canPlan: false,
        reason: 'Impossible de planifier une session dans le passé'
      };
    }

    // Vérifier si le client a déjà une session ce jour
    if (CalendarValidationService.hasSessionOnDate(client, date)) {
      return {
        canPlan: false,
        reason: 'Ce client a déjà une session planifiée ou complétée ce jour'
      };
    }

    return { canPlan: true };
  },

  /**
   * Trouve la prochaine date disponible pour un client à partir d'une date donnée
   */
  findNextAvailableDate: (client: UserProfile, startDate: Date, maxDays: number = 30): Date | null => {
    let currentDate = new Date(startDate);
    currentDate.setHours(0, 0, 0, 0);
    const endDate = new Date(currentDate);
    endDate.setDate(endDate.getDate() + maxDays);

    while (currentDate <= endDate) {
      const validation = CalendarValidationService.canPlanSessionOnDate(client, currentDate);
      if (validation.canPlan) {
        return currentDate;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return null;
  },

  /**
   * Vérifie si un client a déjà une session (planifiée ou complétée) dans la semaine d'une date donnée
   */
  hasSessionInWeek: (client: UserProfile, date: Date): boolean => {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    // Calculer le début de la semaine (lundi)
    const dayOfWeek = targetDate.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Si dimanche, aller au lundi précédent
    const weekStart = new Date(targetDate);
    weekStart.setDate(targetDate.getDate() + diff);
    weekStart.setHours(0, 0, 0, 0);
    
    // Calculer la fin de la semaine (dimanche)
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    // Vérifier les sessions planifiées dans la semaine
    const hasPlannedSessionInWeek = client.plannedSessions?.some(ps => {
      const psDate = new Date(ps.date);
      psDate.setHours(0, 0, 0, 0);
      return psDate >= weekStart && psDate <= weekEnd;
    });

    if (hasPlannedSessionInWeek) return true;

    // Vérifier les sessions complétées dans la semaine
    const hasCompletedSessionInWeek = client.sessionRecords?.some(sr => {
      const srDate = new Date(sr.date);
      srDate.setHours(0, 0, 0, 0);
      return srDate >= weekStart && srDate <= weekEnd;
    });

    return hasCompletedSessionInWeek || false;
  },

  /**
   * Vérifie si un client peut démarrer une nouvelle séance (pas plus d'une par semaine)
   * Exclut la séance planifiée pour aujourd'hui de la vérification (car on peut la lancer)
   */
  canStartSession: (client: UserProfile, date: Date = new Date(), excludeTodayPlanned: boolean = true): { canStart: boolean; reason?: string } => {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    // Calculer le début et la fin de la semaine
    const dayOfWeek = targetDate.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const weekStart = new Date(targetDate);
    weekStart.setDate(targetDate.getDate() + diff);
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    // Vérifier les sessions complétées dans la semaine
    const hasCompletedSessionInWeek = client.sessionRecords?.some(sr => {
      const srDate = new Date(sr.date);
      srDate.setHours(0, 0, 0, 0);
      return srDate >= weekStart && srDate <= weekEnd;
    });

    if (hasCompletedSessionInWeek) {
      return {
        canStart: false,
        reason: 'Vous avez déjà complété une séance cette semaine. Une seule séance par semaine est autorisée.'
      };
    }

    // Vérifier les sessions planifiées dans la semaine (en excluant celle d'aujourd'hui si demandé)
    const hasPlannedSessionInWeek = client.plannedSessions?.some(ps => {
      const psDate = new Date(ps.date);
      psDate.setHours(0, 0, 0, 0);
      
      // Si on exclut la séance d'aujourd'hui et que c'est la séance d'aujourd'hui, on l'ignore
      if (excludeTodayPlanned && psDate.getTime() === targetDate.getTime()) {
        return false;
      }
      
      // Vérifier si la séance est dans la semaine et n'est pas déjà complétée
      const isInWeek = psDate >= weekStart && psDate <= weekEnd;
      const isCompleted = ps.status === 'completed';
      
      return isInWeek && !isCompleted;
    });

    if (hasPlannedSessionInWeek) {
      return {
        canStart: false,
        reason: 'Vous avez déjà une séance planifiée cette semaine. Une seule séance par semaine est autorisée.'
      };
    }

    return { canStart: true };
  }
};

