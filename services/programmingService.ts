import { UserProfile, WorkoutPlan, Exercise, PhaseExercise } from '../types';
import { EXERCISE_DB } from '../data/exerciseLibrary';
import { 
  filterExercisesByBodyPart, 
  filterExercisesByInjuries
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
 * Génère le workout pour une séance spécifique du programme
 * ALGORITHME STRICT : Pas d'IA, sélection déterministe basée sur EXERCISE_DB et Math.random()
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
  
  // ============================================
  // ÉTAPE 1 : FILTRES D'EXERCICES (PRÉ-REQUIS)
  // ============================================
  const injuries = profile.blessures_actives || [];
  
  // Filtrer EXERCISE_DB en 3 tableaux constants (après exclusion des blessures)
  const allUpperExos = filterExercisesByInjuries(
    filterExercisesByBodyPart(EXERCISE_DB, 'upper'),
    injuries
  );
  
  const allLowerExos = filterExercisesByInjuries(
    filterExercisesByBodyPart(EXERCISE_DB, 'lower'),
    injuries
  );
  
  const allCoreExos = filterExercisesByInjuries(
    filterExercisesByBodyPart(EXERCISE_DB, 'core'),
    injuries
  );
  
  // Fonction utilitaire pour sélectionner un exercice aléatoire (sans doublon)
  const randomExercise = (
    exercises: typeof EXERCISE_DB,
    excludeIds: string[] = []
  ): typeof EXERCISE_DB[0] | null => {
    const available = exercises.filter(ex => !excludeIds.includes(ex.id));
    if (available.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * available.length);
    return available[randomIndex];
  };
  
  // ============================================
  // ÉTAPE 2 : ALGORITHME DE SÉLECTION (SWITCH CASE)
  // ============================================
  let selectedExercises: typeof EXERCISE_DB = [];
  
  switch (program.sessionsPerWeek) {
    case 1: {
      // CAS 1 : 1 Séance / Semaine (Full Body)
      // Toujours 3 exercices : 1 Upper + 1 Core + 1 Lower
      const upper = randomExercise(allUpperExos);
      const core = randomExercise(allCoreExos);
      const lower = randomExercise(allLowerExos);
      
      if (upper) selectedExercises.push(upper);
      if (core) selectedExercises.push(core);
      if (lower) selectedExercises.push(lower);
      
      break;
    }
    
    case 2: {
      // CAS 2 : 2 Séances / Semaine (Half Body)
      // Regarde currentSession (modulo 2)
      const sessionMod = ((sessionNumber - 1) % 2) + 1;
      
      if (sessionMod === 1) {
        // Séance 1 (Haut) : 2 Upper + 1 Core
        const selectedIds: string[] = [];
        for (let i = 0; i < 2 && allUpperExos.length > 0; i++) {
          const exo = randomExercise(allUpperExos, selectedIds);
          if (exo) {
            selectedExercises.push(exo);
            selectedIds.push(exo.id);
          }
        }
        const core = randomExercise(allCoreExos, selectedIds);
        if (core) selectedExercises.push(core);
      } else {
        // Séance 2 (Bas) : 2 Lower + 1 Core
        const selectedIds: string[] = [];
        for (let i = 0; i < 2 && allLowerExos.length > 0; i++) {
          const exo = randomExercise(allLowerExos, selectedIds);
          if (exo) {
            selectedExercises.push(exo);
            selectedIds.push(exo.id);
          }
        }
        const core = randomExercise(allCoreExos, selectedIds);
        if (core) selectedExercises.push(core);
      }
      
      break;
    }
    
    case 3: {
      // CAS 3 : 3 Séances / Semaine (Push/Pull/Core)
      // Regarde currentSession (modulo 3)
      const sessionMod = ((sessionNumber - 1) % 3) + 1;
      
      const selectedIds: string[] = [];
      
      if (sessionMod === 1) {
        // Séance 1 : 3 Upper
        for (let i = 0; i < 3 && allUpperExos.length > 0; i++) {
          const exo = randomExercise(allUpperExos, selectedIds);
          if (exo) {
            selectedExercises.push(exo);
            selectedIds.push(exo.id);
          }
        }
      } else if (sessionMod === 2) {
        // Séance 2 : 3 Lower
        for (let i = 0; i < 3 && allLowerExos.length > 0; i++) {
          const exo = randomExercise(allLowerExos, selectedIds);
          if (exo) {
            selectedExercises.push(exo);
            selectedIds.push(exo.id);
          }
        }
      } else {
        // Séance 3 : 3 Core
        for (let i = 0; i < 3 && allCoreExos.length > 0; i++) {
          const exo = randomExercise(allCoreExos, selectedIds);
          if (exo) {
            selectedExercises.push(exo);
            selectedIds.push(exo.id);
          }
        }
      }
      
      break;
    }
    
    default: {
      // Par défaut : Full Body (1 Upper + 1 Core + 1 Lower)
      const upper = randomExercise(allUpperExos);
      const core = randomExercise(allCoreExos);
      const lower = randomExercise(allLowerExos);
      
      if (upper) selectedExercises.push(upper);
      if (core) selectedExercises.push(core);
      if (lower) selectedExercises.push(lower);
    }
  }
  
  // ============================================
  // ÉTAPE 3 : APPLICATION DES PARAMÈTRES (WEEKLY_SCHEME)
  // ============================================
  const weekScheme = getWeekScheme(weekNumber);
  
  if (!weekScheme) {
    throw new Error(`Schéma de progression introuvable pour la semaine ${weekNumber}`);
  }
  
  // Convertit les ExerciseDefinition en Exercise avec les paramètres de progression
  const exercises: Exercise[] = selectedExercises.map((exoDef) => {
    return {
      nom: exoDef.nom,
      sets: weekScheme.sets,
      reps: weekScheme.reps.toString(),
      repos: weekScheme.restSeconds,
      description: exoDef.description,
      coach_tip: `${exoDef.coach_tip || ''} | RPE Cible: ${weekScheme.rpe}/10`.trim(),
      poids_suggere: exoDef.poids_suggere
    };
  });
  
  // ============================================
  // ÉTAPE 4 : CONSTRUCTION DU WORKOUT PLAN
  // ============================================
  const phase = getProgramPhase(weekNumber);
  const weeklyFocus = getWeeklyFocus(weekNumber);
  
  // Échauffement dynamique standard
  const echauffement_dynamique: PhaseExercise[] = [
    {
      nom: 'Échauffement articulaire',
      instructions: 'Mobilisation douce de toutes les articulations (chevilles, genoux, hanches, épaules, cou)',
      duree_secondes: 300 // 5 minutes
    }
  ];
  
  // Étirements dynamiques
  const etirements_dynamiques: PhaseExercise[] = [
    {
      nom: 'Étirements dynamiques',
      instructions: 'Mouvements d\'amplitude progressive pour préparer les muscles',
      duree_secondes: 180 // 3 minutes
    }
  ];
  
  // Étirements finaux
  const etirements: PhaseExercise[] = [
    {
      nom: 'Retour au calme',
      instructions: 'Étirements statiques légers pour favoriser la récupération',
      duree_secondes: 300 // 5 minutes
    }
  ];
  
  // Calcul du temps estimé
  const tempsExercices = exercises.reduce((sum, exo) => {
    const tempsSerie = 60; // Estimation : 60 secondes par série
    const tempsRepos = (exo.sets - 1) * exo.repos;
    return sum + (exo.sets * tempsSerie) + tempsRepos;
  }, 0);
  
  const tempsTotal = echauffement_dynamique[0].duree_secondes +
    etirements_dynamiques[0].duree_secondes +
    tempsExercices +
    etirements[0].duree_secondes;
  
  const workout: WorkoutPlan = {
    phrase_lancement: `Séance ${sessionNumber} - Semaine ${weekNumber} | Focus: ${weeklyFocus.focus} | Phase: ${phase.phase}`,
    structure: 'SERIES',
    echauffement_dynamique,
    etirements_dynamiques,
    liste_exos: exercises,
    etirements,
    temps_estime: Math.round(tempsTotal / 60) // en minutes
  };
  
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

