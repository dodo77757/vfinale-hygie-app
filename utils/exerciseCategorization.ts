import { ExerciseDefinition } from '../data/exerciseLibrary';

export type BodyPart = 'upper' | 'lower' | 'core';

/**
 * Détermine le bodyPart d'un exercice en analysant sa category et ses targets
 */
export const getExerciseBodyPart = (exercise: ExerciseDefinition): BodyPart => {
  const category = exercise.category.toLowerCase();
  const targets = exercise.target.map(t => t.toLowerCase()).join(' ');

  // Core / Tronc
  if (
    category.includes('gainage') ||
    category.includes('core') ||
    category.includes('anti-rotation') ||
    category.includes('anti rotation') ||
    category.includes('stabilité lombraire') ||
    targets.includes('transverse') ||
    targets.includes('obliques') ||
    targets.includes('core') ||
    targets.includes('abdos') ||
    targets.includes('multifides')
  ) {
    return 'core';
  }

  // Lower / Bas du corps
  if (
    category.includes('membres inférieurs') ||
    category.includes('jambes') ||
    category.includes('quadriceps') ||
    category.includes('fessier') ||
    category.includes('ischio') ||
    category.includes('mollets') ||
    category.includes('péroniers') ||
    category.includes('tibial') ||
    category.includes('genou') ||
    category.includes('cheville') ||
    category.includes('hanche') ||
    targets.includes('quadriceps') ||
    targets.includes('fessier') ||
    targets.includes('ischio') ||
    targets.includes('mollets') ||
    targets.includes('péroniers') ||
    targets.includes('tibial') ||
    targets.includes('adducteurs') ||
    targets.includes('vmo') ||
    targets.includes('gastrocnémien')
  ) {
    return 'lower';
  }

  // Upper / Haut du corps (par défaut si ce n'est ni core ni lower)
  return 'upper';
};

/**
 * Filtre les exercices par bodyPart
 */
export const filterExercisesByBodyPart = (
  exercises: ExerciseDefinition[],
  bodyPart: BodyPart
): ExerciseDefinition[] => {
  return exercises.filter(ex => getExerciseBodyPart(ex) === bodyPart);
};

/**
 * Priorise les exercices selon les faiblesses et blessures du client
 */
export const prioritizeExercisesByWeaknesses = (
  exercises: ExerciseDefinition[],
  weaknesses: string[],
  injuries: string[]
): ExerciseDefinition[] => {
  const allConcerns = [...weaknesses, ...injuries].map(w => w.toLowerCase());

  return exercises.sort((a, b) => {
    // Score pour l'exercice a
    const scoreA = calculateRelevanceScore(a, allConcerns);
    // Score pour l'exercice b
    const scoreB = calculateRelevanceScore(b, allConcerns);

    return scoreB - scoreA; // Tri décroissant (plus pertinent en premier)
  });
};

/**
 * Calcule un score de pertinence pour un exercice selon les préoccupations du client
 */
const calculateRelevanceScore = (
  exercise: ExerciseDefinition,
  concerns: string[]
): number => {
  let score = 0;

  // Vérifier les triggers (codes déclencheurs)
  const triggers = exercise.triggers.map(t => t.toLowerCase());
  concerns.forEach(concern => {
    if (triggers.some(trigger => trigger.includes(concern) || concern.includes(trigger))) {
      score += 10; // Forte priorité si trigger correspond
    }
  });

  // Vérifier les targets (muscles ciblés)
  const targets = exercise.target.map(t => t.toLowerCase());
  concerns.forEach(concern => {
    if (targets.some(target => target.includes(concern) || concern.includes(target))) {
      score += 5; // Priorité moyenne si target correspond
    }
  });

  // Vérifier la category
  const category = exercise.category.toLowerCase();
  concerns.forEach(concern => {
    if (category.includes(concern) || concern.includes(category)) {
      score += 3; // Priorité faible si category correspond
    }
  });

  return score;
};

/**
 * Mappe les faiblesses textuelles vers des zones corporelles
 */
export const mapWeaknessToBodyPart = (weakness: string): BodyPart | null => {
  const w = weakness.toLowerCase();

  // Upper body
  if (
    w.includes('épaule') ||
    w.includes('épaule') ||
    w.includes('cou') ||
    w.includes('dos') ||
    w.includes('lombaire') ||
    w.includes('poignet') ||
    w.includes('biceps') ||
    w.includes('triceps') ||
    w.includes('pectoraux') ||
    w.includes('trapèze') ||
    w.includes('rhomboïde') ||
    w.includes('deltoïde')
  ) {
    return 'upper';
  }

  // Lower body
  if (
    w.includes('genou') ||
    w.includes('cheville') ||
    w.includes('hanche') ||
    w.includes('pied') ||
    w.includes('fessier') ||
    w.includes('quadriceps') ||
    w.includes('ischio') ||
    w.includes('mollet') ||
    w.includes('péronier') ||
    w.includes('tibial')
  ) {
    return 'lower';
  }

  // Core
  if (
    w.includes('core') ||
    w.includes('abdos') ||
    w.includes('transverse') ||
    w.includes('oblique') ||
    w.includes('lombaire') ||
    w.includes('stabilité')
  ) {
    return 'core';
  }

  return null;
};

