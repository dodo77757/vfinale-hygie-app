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
   * Vérifie si un client peut démarrer une nouvelle séance
   * Respecte le nombre de séances autorisées par semaine selon le programme actif (sessionsPerWeek)
   * Exclut la séance planifiée pour aujourd'hui de la vérification (car on peut la lancer)
   */
  canStartSession: (client: UserProfile, date: Date = new Date(), excludeTodayPlanned: boolean = true): { canStart: boolean; reason?: string } => {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    // Récupérer le nombre de séances autorisées par semaine selon le programme actif
    const sessionsPerWeek = client.activeProgram?.sessionsPerWeek || 1; // Par défaut 1 si pas de programme

    // Calculer le début et la fin de la semaine
    const dayOfWeek = targetDate.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const weekStart = new Date(targetDate);
    weekStart.setDate(targetDate.getDate() + diff);
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    // Compter les sessions complétées dans la semaine
    const completedSessionsInWeek = (client.sessionRecords || []).filter(sr => {
      const srDate = new Date(sr.date);
      srDate.setHours(0, 0, 0, 0);
      return srDate >= weekStart && srDate <= weekEnd;
    }).length;

    // Compter les sessions planifiées dans la semaine (non complétées, en excluant celle d'aujourd'hui si demandé)
    const plannedSessionsInWeek = (client.plannedSessions || []).filter(ps => {
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
    }).length;

    // Total de séances dans la semaine (complétées + planifiées)
    const totalSessionsInWeek = completedSessionsInWeek + plannedSessionsInWeek;

    // Vérifier si le quota hebdomadaire est atteint
    if (totalSessionsInWeek >= sessionsPerWeek) {
      return {
        canStart: false,
        reason: `Vous avez déjà ${totalSessionsInWeek} séance${totalSessionsInWeek > 1 ? 's' : ''} cette semaine (${completedSessionsInWeek} complétée${completedSessionsInWeek > 1 ? 's' : ''}, ${plannedSessionsInWeek} planifiée${plannedSessionsInWeek > 1 ? 's' : ''}). Votre programme autorise ${sessionsPerWeek} séance${sessionsPerWeek > 1 ? 's' : ''} par semaine.`
      };
    }

    return { canStart: true };
  },

  /**
   * Validation complète de la planification d'une session avec toutes les règles intelligentes
   * Retourne un objet avec le niveau de validation et les messages d'avertissement
   */
  validateSessionPlanning: (
    client: UserProfile,
    targetDate: Date
  ): {
    canPlan: boolean;
    severity: 'error' | 'warning' | 'info' | 'success';
    message?: string;
    details?: string[];
    canForce?: boolean; // Si true, le coach peut forcer la planification
  } => {
    const target = new Date(targetDate);
    target.setHours(0, 0, 0, 0);
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const warnings: string[] = [];
    let severity: 'error' | 'warning' | 'info' | 'success' = 'success';

    // === RÈGLE 1: ANTI-DOUBLON (STRICT - BLOQUE) ===
    if (CalendarValidationService.hasSessionOnDate(client, targetDate)) {
      return {
        canPlan: false,
        severity: 'error',
        message: 'Séance déjà planifiée',
        details: ['Une séance existe déjà à cette date exacte.'],
        canForce: false // Pas de forçage pour les doublons
      };
    }

    // === RÈGLE 2: VOLUME HEBDOMADAIRE (LA JAUGE) ===
    const sessionsPerWeek = client.activeProgram?.sessionsPerWeek || 3;
    
    // Calculer le début et la fin de la semaine
    const dayOfWeek = target.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const weekStart = new Date(target);
    weekStart.setDate(target.getDate() + diff);
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    // Compter les sessions planifiées dans la semaine (non complétées)
    const plannedInWeek = (client.plannedSessions || []).filter(ps => {
      const psDate = new Date(ps.date);
      psDate.setHours(0, 0, 0, 0);
      const isInWeek = psDate >= weekStart && psDate <= weekEnd;
      const isNotCompleted = ps.status !== 'completed';
      return isInWeek && isNotCompleted;
    }).length;

    // Compter les sessions complétées dans la semaine
    const completedInWeek = (client.sessionRecords || []).filter(sr => {
      const srDate = new Date(sr.date);
      srDate.setHours(0, 0, 0, 0);
      return srDate >= weekStart && srDate <= weekEnd;
    }).length;

    const totalSessionsInWeek = plannedInWeek + completedInWeek;

    if (totalSessionsInWeek >= sessionsPerWeek) {
      severity = 'warning';
      warnings.push(
        `Volume hebdomadaire dépassé (${totalSessionsInWeek}/${sessionsPerWeek}). Surchauffe possible.`
      );
    }

    // === RÈGLE 3: RÉCUPÉRATION (LE BUFFER) ===
    const isBeginner = client.tags?.includes('Débutant') || 
                       client.niveau === 'Débutant' ||
                       (client.activeProgram?.currentWeek || 0) <= 2;

    // Vérifier la veille
    const yesterday = new Date(target);
    yesterday.setDate(target.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    const hasSessionYesterday = CalendarValidationService.hasSessionOnDate(client, yesterday);

    // Vérifier le lendemain
    const tomorrow = new Date(target);
    tomorrow.setDate(target.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const hasSessionTomorrow = CalendarValidationService.hasSessionOnDate(client, tomorrow);

    if (hasSessionYesterday || hasSessionTomorrow) {
      if (isBeginner) {
        severity = severity === 'error' ? 'error' : 'warning';
        warnings.push(
          `Récupération insuffisante : Une séance est déjà prévue ${hasSessionYesterday ? 'hier' : 'demain'}.`
        );
      } else {
        // Pour les non-débutants, c'est juste un avertissement info
        if (severity === 'success') severity = 'info';
        warnings.push(
          `Séance rapprochée : Une séance est prévue ${hasSessionYesterday ? 'hier' : 'demain'}.`
        );
      }
    }

    // === RÈGLE 4: DATE DANS LE PASSÉ ===
    if (target < now) {
      return {
        canPlan: false,
        severity: 'error',
        message: 'Date invalide',
        details: ['Impossible de planifier une session dans le passé.'],
        canForce: false
      };
    }

    // === CONSTRUCTION DU MESSAGE FINAL ===
    let message: string | undefined;
    if (warnings.length > 0) {
      message = warnings[0]; // Premier avertissement comme message principal
    }

    return {
      canPlan: true, // On peut toujours planifier, mais avec des avertissements
      severity,
      message,
      details: warnings.length > 1 ? warnings.slice(1) : undefined,
      canForce: severity !== 'error' // On peut forcer sauf pour les erreurs
    };
  },

  /**
   * Obtient le statut d'un jour pour un client (pour le feedback visuel)
   */
  getDayStatus: (
    client: UserProfile,
    date: Date
  ): 'ideal' | 'warning' | 'rest' | 'blocked' | 'neutral' => {
    const target = new Date(date);
    target.setHours(0, 0, 0, 0);

    // Bloqué si déjà une séance
    if (CalendarValidationService.hasSessionOnDate(client, date)) {
      return 'blocked';
    }

    // Vérifier la veille et le lendemain
    const yesterday = new Date(target);
    yesterday.setDate(target.getDate() - 1);
    const hasYesterday = CalendarValidationService.hasSessionOnDate(client, yesterday);

    const tomorrow = new Date(target);
    tomorrow.setDate(target.getDate() + 1);
    const hasTomorrow = CalendarValidationService.hasSessionOnDate(client, tomorrow);

    const isBeginner = client.tags?.includes('Débutant') || 
                       client.niveau === 'Débutant' ||
                       (client.activeProgram?.currentWeek || 0) <= 2;

    // Si débutant et séance hier/demain, c'est un warning
    if (isBeginner && (hasYesterday || hasTomorrow)) {
      return 'warning';
    }

    // Si non-débutant et séance hier/demain, c'est acceptable mais pas idéal
    if (hasYesterday || hasTomorrow) {
      return 'neutral';
    }

    // Sinon, jour idéal
    return 'ideal';
  }
};

