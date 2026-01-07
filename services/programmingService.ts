import { UserProfile, WorkoutPlan } from '../types';
import * as aiService from './geminiService';

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
 * Détermine le focus de la séance selon la phase et le numéro de séance
 */
const getSessionFocus = (
  weekNumber: number,
  sessionNumber: number,
  profile: UserProfile
): string => {
  const phase = getProgramPhase(weekNumber);
  
  // Personnalisation selon les blessures
  const hasUpperBodyIssues = profile.blessures_actives.some(b => 
    ['Épaules', 'Cou', 'Dos', 'Lombaires', 'Poignets'].some(zone => b.includes(zone))
  );
  const hasLowerBodyIssues = profile.blessures_actives.some(b => 
    ['Genou', 'Cheville', 'Hanche', 'Pied'].some(zone => b.includes(zone))
  );
  
  if (sessionNumber === 1) {
    // Séance 1: Force et correction
    if (hasUpperBodyIssues && weekNumber <= 8) {
      return 'Correction Posture Supérieure & Force';
    } else if (hasLowerBodyIssues && weekNumber <= 8) {
      return 'Correction Posture Inférieure & Force';
    }
    return phase.phase === 'Adaptation' ? 'Correction & Mobilité' : 'Force Maximale';
  } else if (sessionNumber === 2) {
    // Séance 2: Volume et hypertrophie
    if (hasUpperBodyIssues || hasLowerBodyIssues) {
      return 'Renforcement Compensatoire & Volume';
    }
    return 'Volume & Hypertrophie';
  } else {
    // Séance 3: Récupération active et technique
    if (hasUpperBodyIssues || hasLowerBodyIssues) {
      return 'Récupération Active & Mobilité';
    }
    return 'Technique & Récupération';
  }
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
      const sessionFocus = getSessionFocus(week, session, profile);
      
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
 * Génère le workout pour une séance spécifique du programme avec personnalisation avancée
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
  const duration = Math.min(45 + Math.floor((weekNumber - 1) / 4) * 5, 75); // 45-75 min selon progression
  
  // Crée un contexte détaillé pour l'IA
  const context = `
    PHASE DU PROGRAMME: ${phase.phase} (Semaine ${weekNumber}/24)
    FOCUS DE LA SÉANCE: ${session.focus}
    INTENSITÉ CIBLE: ${Math.round(phase.intensity * 100)}%
    
    CONTEXTE CLIENT:
    - Objectif principal: ${profile.objectifPrincipal}
    - Blessures actives: ${profile.blessures_actives.join(', ') || 'Aucune'}
    - Détails pathologiques: ${profile.details_blessures || 'N/A'}
    - Niveau: ${profile.experience}
    - Historique: ${profile.sessionRecords.length} séances complétées
    
    CONSIGNES SPÉCIFIQUES:
    ${weekNumber <= 4 ? '- Priorité absolue à la correction posturale et à la mobilité' : ''}
    ${weekNumber > 4 && weekNumber <= 10 ? '- Développement progressif de la force de base' : ''}
    ${weekNumber > 10 && weekNumber <= 16 ? '- Intensification avec respect des limitations' : ''}
    ${weekNumber > 16 ? '- Optimisation pour atteindre l\'objectif final' : ''}
    ${profile.blessures_actives.length > 0 ? '- ÉVITER les exercices qui aggravent: ' + profile.blessures_actives.join(', ') : ''}
  `;
  
  const stateOfMind = `${session.focus} - ${phase.phase} (S${weekNumber})`;
  
  const workout = await aiService.generateWorkout(profile, duration, stateOfMind, context);
  
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

