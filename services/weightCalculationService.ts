import { UserProfile, Exercise, PerformanceEntry } from '../types';

/**
 * Service intelligent de calcul de charges basé sur l'historique et les PR
 */

/**
 * Extrait le nombre de répétitions depuis une string (ex: "10-12" -> 10, "Echec" -> 1)
 */
export const extractReps = (repsString: string): number => {
  if (!repsString) return 1;
  
  // Si c'est "Echec" ou similaire, on prend 1 comme minimum
  if (repsString.toLowerCase().includes('echec') || repsString.toLowerCase().includes('max')) {
    return 1;
  }
  
  // Extrait le premier nombre trouvé
  const match = repsString.match(/\d+/);
  if (match) {
    return parseInt(match[0], 10);
  }
  
  return 1;
};

/**
 * Extrait le poids depuis une string (ex: "50kg" -> 50, "50 kg" -> 50)
 */
export const extractWeight = (weightString: string | undefined): number => {
  if (!weightString) return 0;
  
  const match = weightString.match(/(\d+(?:[.,]\d+)?)/);
  if (match) {
    return parseFloat(match[1].replace(',', '.'));
  }
  
  return 0;
};

/**
 * Trouve le PR (Personal Record) pour un exercice donné
 */
export const findPR = (profile: UserProfile, exerciseName: string): PerformanceEntry | null => {
  const pr = profile.personalBests[exerciseName];
  if (pr) {
    return pr;
  }
  
  // Cherche dans les tendances d'exercices
  const trends = profile.exerciseTrends[exerciseName];
  if (trends && trends.length > 0) {
    // Prend le meilleur (poids x reps le plus élevé)
    const best = trends.reduce((max, entry) => {
      const maxVolume = max.weight * max.reps;
      const entryVolume = entry.weight * entry.reps;
      return entryVolume > maxVolume ? entry : max;
    });
    return best;
  }
  
  // Cherche dans l'historique des sessions
  let bestEntry: PerformanceEntry | null = null;
  let bestVolume = 0;
  
  for (const session of profile.sessionRecords || []) {
    for (const exo of session.exercices || []) {
      if (exo.nom.toLowerCase() === exerciseName.toLowerCase()) {
        if (exo.poidsEffetue && exo.repsEffectuees) {
          const volume = exo.poidsEffetue * exo.repsEffectuees;
          if (volume > bestVolume) {
            bestVolume = volume;
            bestEntry = {
              weight: exo.poidsEffetue,
              reps: exo.repsEffectuees,
              date: session.date
            };
          }
        }
      }
    }
  }
  
  return bestEntry;
};

/**
 * Calcule le poids suggéré pour un exercice basé sur :
 * - Le PR de l'athlète
 * - L'historique récent
 * - Le nombre de répétitions cible
 * - Le niveau d'expérience
 */
export const calculateSuggestedWeight = (
  profile: UserProfile,
  exercise: Exercise,
  targetReps: number
): number => {
  const exerciseName = exercise.nom;
  const pr = findPR(profile, exerciseName);
  
  // Si pas de PR, utilise le poids suggéré par l'IA ou une estimation basée sur le poids corporel
  if (!pr) {
    const aiWeight = extractWeight(exercise.poids_suggere);
    if (aiWeight > 0) {
      return aiWeight;
    }
    
    // Estimation basée sur le poids corporel (pour débutants)
    const bodyWeight = parseFloat(profile.poids) || 70;
    const experienceMultiplier = {
      'Débutant': 0.2,
      'Intermédiaire': 0.4,
      'Avancé': 0.6
    }[profile.experience] || 0.3;
    
    return Math.round((bodyWeight * experienceMultiplier) / 2.5) * 2.5;
  }
  
  // Calcule le pourcentage du 1RM basé sur les répétitions (formule Epley)
  // 1RM = poids * (1 + reps/30)
  const estimated1RM = pr.weight * (1 + pr.reps / 30);
  
  // Pourcentage du 1RM selon le nombre de répétitions cible
  const percentageMap: Record<number, number> = {
    1: 100,
    2: 95,
    3: 93,
    4: 90,
    5: 87,
    6: 85,
    8: 80,
    10: 75,
    12: 70,
    15: 65,
    20: 60
  };
  
  // Trouve le pourcentage le plus proche
  let percentage = 75; // Par défaut
  const repKeys = Object.keys(percentageMap).map(Number).sort((a, b) => a - b);
  for (const key of repKeys) {
    if (targetReps <= key) {
      percentage = percentageMap[key];
      break;
    }
  }
  if (targetReps > 20) {
    percentage = 55;
  }
  
  // Calcule le poids suggéré
  let suggestedWeight = (estimated1RM * percentage) / 100;
  
  // Ajuste selon le niveau d'expérience (les débutants commencent plus léger)
  if (profile.experience === 'Débutant') {
    suggestedWeight *= 0.85; // 15% de marge de sécurité
  }
  
  // Arrondit à 2.5kg près
  suggestedWeight = Math.round(suggestedWeight / 2.5) * 2.5;
  
  // S'assure que c'est au moins 2.5kg (ou 0 pour poids du corps)
  if (suggestedWeight < 2.5 && suggestedWeight > 0) {
    suggestedWeight = 2.5;
  }
  
  return Math.max(0, suggestedWeight);
};

/**
 * Met à jour le PR si la performance actuelle est meilleure
 */
export const updatePR = (
  profile: UserProfile,
  exerciseName: string,
  weight: number,
  reps: number
): UserProfile => {
  const currentPR = profile.personalBests[exerciseName];
  const currentVolume = currentPR ? currentPR.weight * currentPR.reps : 0;
  const newVolume = weight * reps;
  
  if (!currentPR || newVolume > currentVolume || (newVolume === currentVolume && weight > currentPR.weight)) {
    const newPR: PerformanceEntry = {
      weight,
      reps,
      date: new Date().toISOString()
    };
    
    return {
      ...profile,
      personalBests: {
        ...profile.personalBests,
        [exerciseName]: newPR
      },
      exerciseTrends: {
        ...profile.exerciseTrends,
        [exerciseName]: [
          ...(profile.exerciseTrends[exerciseName] || []),
          newPR
        ].slice(-10) // Garde les 10 dernières entrées
      }
    };
  }
  
  return profile;
};


