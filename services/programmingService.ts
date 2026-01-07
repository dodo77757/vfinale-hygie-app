import { UserProfile, WorkoutPlan, Exercise } from '../types';
import * as aiService from './geminiService';
import { EXERCISE_DB } from '../data/exerciseLibrary';
import { 
  BodyPart, 
  filterExercisesByBodyPart, 
  prioritizeExercisesByWeaknesses,
  mapWeaknessToBodyPart 
} from '../utils/exerciseCategorization';
import { getWeekScheme, isGateKeeperWeek, evaluateGateKeeper } from '../src/domain/rules/ProgressionRules';

/**
 * Service de programmation multi-semaines avec circuits
 */

export interface WeeklyProgram {
  id: string;
  name: string;
  duration: number; // Nombre de semaines
  sessionsPerWeek: number;
  weeks: WeekProgram[];
  createdAt: string;
  currentWeek: number;
  currentSession: number;
}

export interface WeekProgram {
  weekNumber: number;
  sessions: SessionProgram[];
  focus: string; // Focus de la semaine (ex: "Force", "Volume", "Récupération")
}

export interface SessionProgram {
  sessionNumber: number;
  workoutPlan: WorkoutPlan | null;
  completed: boolean;
  completedDate?: string;
  focus: string; // Focus de la séance
}

/**
 * Détermine la phase du programme selon la semaine (sur 24 semaines)
 */
const getProgramPhase = (weekNumber: number): { phase: string; focus: string; intensity: number } => {
  if (weekNumber <= 4) {
    // Semaines 1-4: Phase d'adaptation et correction
    return { phase: 'Adaptation', focus: 'Correction Posturale & Mobilité', intensity: 0.6 };
  } else if (weekNumber <= 10) {
    // Semaines 5-10: Phase de développement de base
    return { phase: 'Développement', focus: 'Renforcement Fondamental', intensity: 0.75 };
  } else if (weekNumber <= 16) {
    // Semaines 11-16: Phase d'intensification
    return { phase: 'Intensification', focus: 'Force & Puissance', intensity: 0.9 };
  } else if (weekNumber <= 20) {
    // Semaines 17-20: Phase de spécialisation
    return { phase: 'Spécialisation', focus: 'Objectif Spécifique', intensity: 0.85 };
  } else {
    // Semaines 21-24: Phase de consolidation et optimisation
    return { phase: 'Consolidation', focus: 'Optimisation & Performance', intensity: 0.8 };
  }
};

/**
 * Rotation hebdomadaire des focus selon le cycle de 3 semaines
 */
const getWeeklyFocus = (weekNumber: number): { focus: string; intensity: number } => {
  const cyclePosition = ((weekNumber - 1) % 3) + 1;
  
  switch (cyclePosition) {
    case 1:
      return { focus: 'Force', intensity: 0.85 };
    case 2:
      return { focus: 'Hypertrophie/Volume', intensity: 0.75 };
    case 3:
      return { focus: 'Endurance/Mobilité', intensity: 0.65 };
    default:
      return { focus: 'Force', intensity: 0.85 };
  }
};

/**
 * Détermine le focus de la séance selon la phase, le numéro de séance et la rotation hebdomadaire
 */
const getSessionFocus = (
  weekNumber: number,
  sessionNumber: number,
  sessionsPerWeek: number,
  profile: UserProfile
): string => {
  const phase = getProgramPhase(weekNumber);
  const weeklyFocus = getWeeklyFocus(weekNumber);
  
  // Personnalisation selon les blessures
  const hasUpperBodyIssues = profile.blessures_actives.some(b => 
    ['Épaules', 'Cou', 'Dos', 'Lombaires', 'Poignets'].some(zone => b.includes(zone))
  );
  const hasLowerBodyIssues = profile.blessures_actives.some(b => 
    ['Genou', 'Cheville', 'Hanche', 'Pied'].some(zone => b.includes(zone))
  );
  
  // Base du focus selon la rotation hebdomadaire
  let baseFocus = weeklyFocus.focus;
  
  // Adaptation selon la phase du programme
  if (phase.phase === 'Adaptation') {
    baseFocus = 'Correction & Mobilité';
  }
  
  // Adaptation selon les blessures
  if (hasUpperBodyIssues && weekNumber <= 8) {
    return `Correction Posture Supérieure & ${baseFocus}`;
  } else if (hasLowerBodyIssues && weekNumber <= 8) {
    return `Correction Posture Inférieure & ${baseFocus}`;
  }
  
  return baseFocus;
};

/**
 * Génère un programme d'entraînement sur plusieurs semaines personnalisé
 */
export const generateMultiWeekProgram = async (
  profile: UserProfile,
  duration: number = 24, // Par défaut 24 semaines
  sessionsPerWeek: number = 3, // Par défaut 3 séances/semaine
  programName?: string
): Promise<WeeklyProgram> => {
  const weeks: WeekProgram[] = [];
  
  // Nom du programme basé sur l'objectif du client
  const defaultProgramName = programName || 
    `Programme ${profile.objectifPrincipal} - ${duration} semaines`;
  
  for (let week = 1; week <= duration; week++) {
    const phase = getProgramPhase(week);
    const sessions: SessionProgram[] = [];
    
    for (let session = 1; session <= sessionsPerWeek; session++) {
      const sessionFocus = getSessionFocus(week, session, sessionsPerWeek, profile);
      
      sessions.push({
        sessionNumber: session,
        workoutPlan: null, // Sera généré à la demande avec le contexte complet
        completed: false,
        focus: sessionFocus
      });
    }
    
    weeks.push({
      weekNumber: week,
      sessions,
      focus: phase.focus
    });
  }
  
  return {
    id: `program_${Date.now()}`,
    name: defaultProgramName,
    duration,
    sessionsPerWeek,
    weeks,
    createdAt: new Date().toISOString(),
    currentWeek: 1,
    currentSession: 1
  };
};

/**
 * Détermine la répartition des exercices selon le split (sessionsPerWeek)
 */
const getExerciseSplit = (
  sessionsPerWeek: number,
  sessionNumber: number
): { upper: number; lower: number; core: number } => {
  switch (sessionsPerWeek) {
    case 1:
      // Full Body: 1 Upper + 1 Lower + 1 Core
      return { upper: 1, lower: 1, core: 1 };
    
    case 2:
      // Half Body Hybrid
      if (sessionNumber === 1) {
        // Séance 1: 2 Upper + 1 Core
        return { upper: 2, lower: 0, core: 1 };
      } else {
        // Séance 2: 2 Lower + 1 Core
        return { upper: 0, lower: 2, core: 1 };
      }
    
    case 3:
      // Push/Pull/Core Focus
      if (sessionNumber === 1) {
        // Séance 1: 3 Upper
        return { upper: 3, lower: 0, core: 0 };
      } else if (sessionNumber === 2) {
        // Séance 2: 3 Lower
        return { upper: 0, lower: 3, core: 0 };
      } else {
        // Séance 3: 3 Core
        return { upper: 0, lower: 0, core: 3 };
      }
    
    default:
      // Par défaut: Full Body
      return { upper: 1, lower: 1, core: 1 };
  }
};

/**
 * Génère le workout pour une séance spécifique du programme avec personnalisation avancée
 * IMPLÉMENTE LES RÈGLES DE SPLIT STRICTES
 */
export const generateProgramWorkout = async (
  profile: UserProfile,
  program: WeeklyProgram,
  weekNumber: number,
  sessionNumber: number
): Promise<WorkoutPlan> => {
  const week = program.weeks.find(w => w.weekNumber === weekNumber);
  if (!week) {
    throw new Error(`Semaine ${weekNumber} introuvable`);
  }
  
  const session = week.sessions.find(s => s.sessionNumber === sessionNumber);
  if (!session) {
    throw new Error(`Séance ${sessionNumber} introuvable`);
  }
  
  // Si le workout existe déjà, le retourne
  if (session.workoutPlan) {
    return session.workoutPlan;
  }
  
  // Calcule la durée et l'intensité selon la phase
  const phase = getProgramPhase(weekNumber);
  const weeklyFocus = getWeeklyFocus(weekNumber);
  const duration = Math.min(45 + Math.floor((weekNumber - 1) / 4) * 5, 75); // 45-75 min selon progression
  
  // Détermine la répartition des exercices selon le split
  const split = getExerciseSplit(program.sessionsPerWeek, sessionNumber);
  
  // Récupère les faiblesses du client
  const weaknesses = [
    ...(profile.detected_faiblesses || []),
    ...(profile.blessures_actives || [])
  ];
  
  // Filtre et priorise les exercices selon le split et les faiblesses
  const selectedExercises: string[] = [];
  
  // Upper body exercises
  if (split.upper > 0) {
    let upperExercises = filterExercisesByBodyPart(EXERCISE_DB, 'upper');
    
    // Priorise selon les faiblesses upper body
    const upperWeaknesses = weaknesses.filter(w => {
      const bodyPart = mapWeaknessToBodyPart(w);
      return bodyPart === 'upper';
    });
    
    if (upperWeaknesses.length > 0) {
      upperExercises = prioritizeExercisesByWeaknesses(upperExercises, upperWeaknesses, profile.blessures_actives || []);
    }
    
    // Sélectionne les exercices prioritaires
    for (let i = 0; i < split.upper && i < upperExercises.length; i++) {
      selectedExercises.push(upperExercises[i].nom);
    }
  }
  
  // Lower body exercises
  if (split.lower > 0) {
    let lowerExercises = filterExercisesByBodyPart(EXERCISE_DB, 'lower');
    
    // Priorise selon les faiblesses lower body
    const lowerWeaknesses = weaknesses.filter(w => {
      const bodyPart = mapWeaknessToBodyPart(w);
      return bodyPart === 'lower';
    });
    
    if (lowerWeaknesses.length > 0) {
      lowerExercises = prioritizeExercisesByWeaknesses(lowerExercises, lowerWeaknesses, profile.blessures_actives || []);
    }
    
    // Sélectionne les exercices prioritaires
    for (let i = 0; i < split.lower && i < lowerExercises.length; i++) {
      selectedExercises.push(lowerExercises[i].nom);
    }
  }
  
  // Core exercises
  if (split.core > 0) {
    let coreExercises = filterExercisesByBodyPart(EXERCISE_DB, 'core');
    
    // Priorise selon les faiblesses core
    const coreWeaknesses = weaknesses.filter(w => {
      const bodyPart = mapWeaknessToBodyPart(w);
      return bodyPart === 'core';
    });
    
    if (coreWeaknesses.length > 0) {
      coreExercises = prioritizeExercisesByWeaknesses(coreExercises, coreWeaknesses, profile.blessures_actives || []);
    }
    
    // Sélectionne les exercices prioritaires
    for (let i = 0; i < split.core && i < coreExercises.length; i++) {
      selectedExercises.push(coreExercises[i].nom);
    }
  }
  
  // Crée un contexte détaillé pour l'IA avec les contraintes de split
  const splitDescription = 
    program.sessionsPerWeek === 1 
      ? `SPLIT FULL BODY: ${split.upper} exercice(s) Haut du corps + ${split.lower} exercice(s) Bas du corps + ${split.core} exercice(s) Tronc/Core`
      : program.sessionsPerWeek === 2
      ? sessionNumber === 1
        ? `SPLIT HALF BODY HYBRID - Séance 1: ${split.upper} exercice(s) Haut du corps + ${split.core} exercice(s) Core`
        : `SPLIT HALF BODY HYBRID - Séance 2: ${split.lower} exercice(s) Bas du corps + ${split.core} exercice(s) Core`
      : sessionNumber === 1
      ? `SPLIT PUSH/PULL/CORE - Séance 1 (Push): ${split.upper} exercice(s) Haut du corps`
      : sessionNumber === 2
      ? `SPLIT PUSH/PULL/CORE - Séance 2 (Pull): ${split.lower} exercice(s) Bas du corps`
      : `SPLIT PUSH/PULL/CORE - Séance 3 (Core): ${split.core} exercice(s) Tronc/Core`;
  
  const context = `
    PHASE DU PROGRAMME: ${phase.phase} (Semaine ${weekNumber}/24)
    FOCUS DE LA SÉANCE: ${session.focus}
    FOCUS HEBDOMADAIRE: ${weeklyFocus.focus} (Intensité: ${Math.round(weeklyFocus.intensity * 100)}%)
    INTENSITÉ CIBLE: ${Math.round(phase.intensity * 100)}%
    
    ${splitDescription}
    
    EXERCICES PRIORITAIRES SUGGÉRÉS (selon faiblesses détectées):
    ${selectedExercises.length > 0 ? selectedExercises.map((ex, i) => `${i + 1}. ${ex}`).join('\n') : 'Aucun exercice spécifique priorisé'}
    
    CONTEXTE CLIENT:
    - Objectif principal: ${profile.objectifPrincipal}
    - Blessures actives: ${profile.blessures_actives.join(', ') || 'Aucune'}
    - Faiblesses détectées: ${weaknesses.join(', ') || 'Aucune'}
    - Détails pathologiques: ${profile.details_blessures || 'N/A'}
    - Niveau: ${profile.experience}
    - Historique: ${profile.sessionRecords.length} séances complétées
    
    CONSIGNES SPÉCIFIQUES:
    ${weekNumber <= 4 ? '- Priorité absolue à la correction posturale et à la mobilité' : ''}
    ${weekNumber > 4 && weekNumber <= 10 ? '- Développement progressif de la force de base' : ''}
    ${weekNumber > 10 && weekNumber <= 16 ? '- Intensification avec respect des limitations' : ''}
    ${weekNumber > 16 ? '- Optimisation pour atteindre l\'objectif final' : ''}
    ${profile.blessures_actives.length > 0 ? '- ÉVITER les exercices qui aggravent: ' + profile.blessures_actives.join(', ') : ''}
    - RESPECTER STRICTEMENT le split: ${splitDescription}
    - Prioriser les exercices suggérés ci-dessus si pertinents
  `;
  
  const stateOfMind = `${session.focus} - ${weeklyFocus.focus} - ${phase.phase} (S${weekNumber})`;
  
  const workout = await aiService.generateWorkout(profile, duration, stateOfMind, context);
  
  // Applique le Protocole de Progression Standard (Hygie Protocol)
  const weekScheme = getWeekScheme(weekNumber);
  if (weekScheme) {
    // Applique les paramètres de progression aux exercices polyarticulaires (Haut/Bas)
    workout.liste_exos = workout.liste_exos.map((exo: Exercise) => {
      // Détermine si l'exercice est polyarticulaire (Haut ou Bas du corps)
      const isPolyarticular = selectedExercises.includes(exo.nom) && 
        (split.upper > 0 || split.lower > 0);
      
      if (isPolyarticular) {
        // Applique les paramètres de progression pour les exercices polyarticulaires
        return {
          ...exo,
          sets: weekScheme.sets,
          reps: weekScheme.reps.toString(),
          repos: weekScheme.restSeconds,
          // Ajoute le RPE cible dans le coach_tip si présent
          coach_tip: exo.coach_tip 
            ? `${exo.coach_tip} | RPE Cible: ${weekScheme.rpe}/10`
            : `RPE Cible: ${weekScheme.rpe}/10`
        };
      } else {
        // Pour les exercices d'isolation ou d'échauffement, garde une logique plus légère
        // Mais applique quand même le repos standardisé
        return {
          ...exo,
          repos: weekScheme.restSeconds,
          coach_tip: exo.coach_tip 
            ? `${exo.coach_tip} | RPE Cible: ${weekScheme.rpe - 1}/10 (Isolation)`
            : `RPE Cible: ${weekScheme.rpe - 1}/10 (Isolation)`
        };
      }
    });
  }
  
  // Vérifie la Gate Keeper (S12) si applicable
  if (isGateKeeperWeek(weekNumber)) {
    const gateKeeperResult = evaluateGateKeeper(
      weekNumber,
      profile.sessionRecords || [],
      weekScheme?.rpe || 8.5
    );
    
    // Si les conditions ne sont pas remplies, on pourrait ajuster le programme
    // Pour l'instant, on log juste le résultat
    console.log('Gate Keeper Evaluation:', gateKeeperResult);
  }
  
  // Met à jour le programme avec le workout généré
  session.workoutPlan = workout;
  
  return workout;
};

/**
 * Marque une séance comme complétée
 */
export const markSessionCompleted = (
  program: WeeklyProgram,
  weekNumber: number,
  sessionNumber: number
): WeeklyProgram => {
  const week = program.weeks.find(w => w.weekNumber === weekNumber);
  if (!week) return program;
  
  const session = week.sessions.find(s => s.sessionNumber === sessionNumber);
  if (!session) return program;
  
  session.completed = true;
  session.completedDate = new Date().toISOString();
  
  // Avance au prochain session si toutes les séances de la semaine sont complétées
  const allSessionsCompleted = week.sessions.every(s => s.completed);
  if (allSessionsCompleted && weekNumber < program.duration) {
    program.currentWeek = weekNumber + 1;
    program.currentSession = 1;
  } else if (sessionNumber < program.sessionsPerWeek) {
    program.currentSession = sessionNumber + 1;
  }
  
  return { ...program };
};

/**
 * Calcule la progression suggérée pour la prochaine semaine
 */
export const calculateProgression = (
  profile: UserProfile,
  program: WeeklyProgram,
  currentWeek: number
): { weightIncrease: number; repIncrease: number } => {
  // Analyse les performances de la semaine
  const week = program.weeks.find(w => w.weekNumber === currentWeek);
  if (!week) {
    return { weightIncrease: 0, repIncrease: 0 };
  }
  
  const completedSessions = week.sessions.filter(s => s.completed);
  if (completedSessions.length === 0) {
    return { weightIncrease: 0, repIncrease: 0 };
  }
  
  // Progression standard : +2.5% de poids ou +1 rep par semaine
  const experienceMultiplier = {
    'Débutant': 0.5,
    'Intermédiaire': 1,
    'Avancé': 1.5
  }[profile.experience] || 1;
  
  return {
    weightIncrease: 2.5 * experienceMultiplier,
    repIncrease: Math.round(experienceMultiplier)
  };
};

