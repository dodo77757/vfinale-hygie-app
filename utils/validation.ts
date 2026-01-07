import { z } from 'zod';
import { UserProfile, WorkoutPlan, Exercise, PhaseExercise, ActiveGoal } from '../types';

/**
 * Schémas de validation Zod pour les types de l'application
 */

export const PhaseExerciseSchema = z.object({
  nom: z.string().min(1),
  instructions: z.string(),
  duree_secondes: z.number().int().positive(),
});

export const ExerciseSchema = z.object({
  nom: z.string().min(1),
  sets: z.number().int().positive(),
  reps: z.string().min(1),
  repos: z.number().int().nonnegative(),
  description: z.string(),
  coach_tip: z.string().optional(),
  poids_suggere: z.string().optional(),
  poidsEffetue: z.number().optional(),
  repsEffectuees: z.number().optional(),
  tempsEffortEffectif: z.number().optional(),
  tempsReposEffectif: z.number().optional(),
});

export const WorkoutPlanSchema = z.object({
  phrase_lancement: z.string(),
  structure: z.enum(['CIRCUIT', 'SERIES']),
  echauffement_dynamique: z.array(PhaseExerciseSchema),
  etirements_dynamiques: z.array(PhaseExerciseSchema),
  liste_exos: z.array(ExerciseSchema),
  etirements: z.array(PhaseExerciseSchema),
  temps_estime: z.number().optional(),
});

export const ActiveGoalSchema = z.object({
  label: z.string(),
  targetValue: z.number().min(0).max(100),
  startValue: z.number().min(0).max(100),
  currentValue: z.number().min(0).max(100),
  unit: z.string(),
  deadline: z.string(),
  isSafe: z.boolean(),
  history: z.array(
    z.object({
      date: z.string(),
      value: z.number(),
    })
  ),
});

export const UserProfileSchema = z.object({
  id: z.string().min(1),
  nom: z.string().min(1),
  avatar: z.string().url().optional(),
  age: z.number().int().positive(),
  genre: z.string(),
  poids: z.string(),
  taille: z.string(),
  experience: z.enum(['Débutant', 'Intermédiaire', 'Avancé']),
  stressLevel: z.enum(['Bas', 'Moyen', 'Élevé']),
  sleepQuality: z.enum(['Mauvaise', 'Moyenne', 'Excellente']),
  materiel: z.string(),
  objectifs: z.array(z.string()),
  objectifPrincipal: z.string(),
  delaiObjectif: z.string(),
  sessionFocus: z.string().optional(),
  blessures_actives: z.array(z.string()),
  details_blessures: z.string().optional(),
  raw_assessment: z.string().optional(),
  historique_dates: z.array(z.string()),
  historique_volume: z.array(z.number()),
  sessionRecords: z.array(z.any()), // Simplified for now
  personalBests: z.record(z.any()),
  exerciseTrends: z.record(z.array(z.any())),
  activeGoal: ActiveGoalSchema.optional(),
  dernier_feedback_ia: z.string().optional(),
  activeProgram: z.any().optional(), // WeeklyProgram - can be expanded
  private_notes: z.string().optional(),
  lastPainReport: z.object({
    date: z.string(),
    location: z.string(),
    intensity: z.number().min(0).max(10),
  }).optional(),
  weeklySleepAverage: z.number().optional(),
});

/**
 * Valide une réponse API de WorkoutPlan
 */
export function validateWorkoutPlan(data: unknown): WorkoutPlan {
  try {
    return WorkoutPlanSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error for WorkoutPlan:', error.errors);
      throw new Error(`Invalid WorkoutPlan: ${error.errors.map(e => e.message).join(', ')}`);
    }
    throw error;
  }
}

/**
 * Valide un UserProfile
 */
export function validateUserProfile(data: unknown): UserProfile {
  try {
    return UserProfileSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error for UserProfile:', error.errors);
      throw new Error(`Invalid UserProfile: ${error.errors.map(e => e.message).join(', ')}`);
    }
    throw error;
  }
}

/**
 * Valide un Exercise
 */
export function validateExercise(data: unknown): Exercise {
  try {
    return ExerciseSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error for Exercise:', error.errors);
      throw new Error(`Invalid Exercise: ${error.errors.map(e => e.message).join(', ')}`);
    }
    throw error;
  }
}

/**
 * Sanitize user input string
 */
export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}

/**
 * Valide un fichier uploadé
 */
export function validateFile(file: File, options?: {
  maxSize?: number;
  allowedTypes?: string[];
}): { valid: boolean; error?: string } {
  const maxSize = options?.maxSize || 20 * 1024 * 1024; // 20MB par défaut
  const allowedTypes = options?.allowedTypes || ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `Fichier trop volumineux. Taille maximale: ${Math.round(maxSize / 1024 / 1024)}MB`,
    };
  }

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Type de fichier non autorisé. Types autorisés: ${allowedTypes.join(', ')}`,
    };
  }

  return { valid: true };
}





