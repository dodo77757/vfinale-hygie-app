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
  }
};

