/**
 * Protocole de Progression Standard (Hygie Protocol)
 * Périodisation linéaire stricte mais adaptative
 */

export interface WeekScheme {
  week: number;
  phase: 'Familiarisation' | 'Construction Musculaire' | 'Force Maximale';
  sets: number;
  reps: number;
  rpe: number; // Rate of Perceived Exertion (1-10)
  restSeconds: number;
}

/**
 * Carte de progression hebdomadaire (S1 à S21)
 */
export const WEEKLY_SCHEME: WeekScheme[] = [
  // Phase 1 : Familiarisation
  { week: 1, phase: 'Familiarisation', sets: 3, reps: 8, rpe: 6, restSeconds: 120 },
  { week: 2, phase: 'Familiarisation', sets: 3, reps: 10, rpe: 6.5, restSeconds: 120 },
  
  // Phase 2 : Construction Musculaire (Hypertrophie)
  { week: 3, phase: 'Construction Musculaire', sets: 3, reps: 12, rpe: 7, restSeconds: 120 },
  { week: 4, phase: 'Construction Musculaire', sets: 3, reps: 8, rpe: 7, restSeconds: 90 },
  { week: 5, phase: 'Construction Musculaire', sets: 3, reps: 10, rpe: 7, restSeconds: 90 },
  { week: 6, phase: 'Construction Musculaire', sets: 3, reps: 8, rpe: 7.5, restSeconds: 90 },
  { week: 7, phase: 'Construction Musculaire', sets: 3, reps: 8, rpe: 7.5, restSeconds: 90 },
  { week: 8, phase: 'Construction Musculaire', sets: 3, reps: 8, rpe: 8, restSeconds: 90 },
  { week: 9, phase: 'Construction Musculaire', sets: 3, reps: 10, rpe: 8, restSeconds: 90 },
  { week: 10, phase: 'Construction Musculaire', sets: 3, reps: 10, rpe: 8, restSeconds: 90 },
  { week: 11, phase: 'Construction Musculaire', sets: 3, reps: 10, rpe: 8.5, restSeconds: 90 },
  { week: 12, phase: 'Construction Musculaire', sets: 4, reps: 6, rpe: 8.5, restSeconds: 90 },
  
  // Phase 3 : Force Maximale
  { week: 13, phase: 'Force Maximale', sets: 4, reps: 5, rpe: 8.5, restSeconds: 180 },
  { week: 14, phase: 'Force Maximale', sets: 4, reps: 3, rpe: 9, restSeconds: 180 },
  { week: 15, phase: 'Force Maximale', sets: 4, reps: 6, rpe: 8.5, restSeconds: 180 },
  { week: 16, phase: 'Force Maximale', sets: 4, reps: 5, rpe: 8.5, restSeconds: 180 },
  { week: 17, phase: 'Force Maximale', sets: 5, reps: 3, rpe: 9, restSeconds: 180 },
  { week: 18, phase: 'Force Maximale', sets: 6, reps: 3, rpe: 9, restSeconds: 180 },
  { week: 19, phase: 'Force Maximale', sets: 6, reps: 3, rpe: 9, restSeconds: 180 },
  { week: 20, phase: 'Force Maximale', sets: 5, reps: 6, rpe: 8.5, restSeconds: 180 },
  { week: 21, phase: 'Force Maximale', sets: 6, reps: 3, rpe: 9, restSeconds: 180 },
];

/**
 * Récupère le schéma de progression pour une semaine donnée
 */
export const getWeekScheme = (weekNumber: number): WeekScheme | null => {
  if (weekNumber < 1 || weekNumber > 21) {
    return null;
  }
  return WEEKLY_SCHEME[weekNumber - 1];
};

/**
 * Vérifie si une semaine est la Gate Keeper (S12)
 */
export const isGateKeeperWeek = (weekNumber: number): boolean => {
  return weekNumber === 12;
};

/**
 * Évalue les conditions de passage de la Phase 2 à la Phase 3 (Gate Keeper)
 * Condition de passage : (pas de douleur) ET (RPE réel <= RPE cible)
 */
export interface GateKeeperResult {
  canProceed: boolean;
  reason: string;
  suggestedAction: 'proceed' | 'repeat_week_10' | 'repeat_week_11';
}

export const evaluateGateKeeper = (
  weekNumber: number,
  sessionRecords: any[],
  targetRPE: number
): GateKeeperResult => {
  if (!isGateKeeperWeek(weekNumber)) {
    return {
      canProceed: true,
      reason: 'Pas une semaine Gate Keeper',
      suggestedAction: 'proceed'
    };
  }

  // Récupère les sessions de la semaine 12
  const week12Sessions = sessionRecords.filter((record, index) => {
    // Approximation : on considère les dernières sessions comme étant de la semaine 12
    // En production, il faudrait vérifier la date réelle
    return index >= sessionRecords.length - 3; // 3 sessions pour la semaine 12
  });

  if (week12Sessions.length === 0) {
    return {
      canProceed: false,
      reason: 'Aucune session trouvée pour la semaine 12',
      suggestedAction: 'repeat_week_11'
    };
  }

  // Vérifie les conditions
  const hasPain = week12Sessions.some(session => 
    session.mood?.toLowerCase().includes('douleur') ||
    session.mood?.toLowerCase().includes('douloureux') ||
    session.debrief?.toLowerCase().includes('douleur')
  );

  // Pour l'instant, on suppose que si pas de douleur mentionnée, c'est OK
  // En production, il faudrait un champ RPE réel dans SessionRecord
  const actualRPE = week12Sessions[week12Sessions.length - 1]?.rpe || targetRPE;
  const rpeOk = actualRPE <= targetRPE;

  if (!hasPain && rpeOk) {
    return {
      canProceed: true,
      reason: 'Conditions de passage remplies : pas de douleur et RPE acceptable',
      suggestedAction: 'proceed'
    };
  } else {
    return {
      canProceed: false,
      reason: hasPain 
        ? 'Douleur détectée dans les sessions de la semaine 12'
        : `RPE réel (${actualRPE}) supérieur au RPE cible (${targetRPE})`,
      suggestedAction: actualRPE > targetRPE ? 'repeat_week_11' : 'repeat_week_10'
    };
  }
};

