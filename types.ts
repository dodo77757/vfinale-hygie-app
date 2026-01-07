
// "Définition de la structure d'une proposition d'objectif (non utilisé dans la version robot actuelle)."
export interface GoalProposal {
  titre: string;
  description: string;
  icone: string;
}

// "Structure d'un exercice individuel au sein d'une séance."
export interface Exercise {
  nom: string;
  sets: number; // "Nombre de séries"
  reps: string; // "Répétitions (ex: '10-12' ou 'Echec')"
  repos: number; // "Temps de repos en secondes"
  description: string; // "Instructions d'exécution"
  coach_tip?: string; // "Conseil technique spécifique"
  poids_suggere?: string; // "Charge recommandée par l'IA"
  poidsEffetue?: number; // "Donnée réelle saisie par l'utilisateur"
  repsEffectuees?: number;
  tempsEffortEffectif?: number; // en secondes
  tempsReposEffectif?: number;   // en secondes
}

// "Structure pour les phases d'échauffement ou d'étirement (exos basés sur la durée)."
export interface PhaseExercise {
  nom: string;
  instructions: string;
  duree_secondes: number;
}

// "Structure complète d'une séance d'entraînement générée par l'IA."
export interface WorkoutPlan {
  phrase_lancement: string; // "Message de motivation au début"
  structure: 'CIRCUIT' | 'SERIES';
  echauffement_dynamique: PhaseExercise[];
  etirements_dynamiques: PhaseExercise[];
  liste_exos: Exercise[]; // "Le corps de la séance"
  etirements: PhaseExercise[]; // "Retour au calme"
  temps_estime?: number; 
}

// "Un point de donnée sur le graphique de progression de l'objectif."
export interface GoalProgressEntry {
  date: string;
  value: number; // "Pourcentage de complétion"
}

// "L'objectif actuellement suivi par l'utilisateur (le 'Vector')."
export interface ActiveGoal {
  label: string;
  targetValue: number;
  startValue: number;
  currentValue: number;
  unit: string;
  deadline: string;
  isSafe: boolean;
  history: GoalProgressEntry[]; // "Historique pour le graphique"
}

// "Métrique de performance brute pour une série validée."
export interface PerformanceMetric {
  name: string;
  volume: number; // "Poids x Reps"
  effortTime: number;
  restTime: number;
  weight: number;
  reps: number;
}

// "Archive complète d'une séance passée."
export interface SessionRecord {
  date: string;
  exercices: Exercise[];
  metrics?: PerformanceMetric[];
  tonnage: number; // "Volume total soulevé"
  mood: string;
  debrief: string; // "Le feedback généré par l'IA post-séance"
  focus?: string;
  objectifs_atteints?: boolean;
  goalValueAtSession?: number;
}

// "Entrée pour les records personnels (PR)."
export interface PerformanceEntry {
  weight: number;
  reps: number;
  date: string;
  effortTime?: number;
}

// "Le profil complet de l'utilisateur (C'est ici que les données du PDF sont stockées)."
export interface UserProfile {
  id: string; // "ID Unique pour la base de données coach"
  nom: string;
  avatar?: string;
  age: number;
  genre: string;
  poids: string;
  taille: string;
  experience: 'Débutant' | 'Intermédiaire' | 'Avancé';
  stressLevel: 'Bas' | 'Moyen' | 'Élevé';
  sleepQuality: 'Mauvaise' | 'Moyenne' | 'Excellente';
  materiel: string;
  objectifs: string[];
  objectifPrincipal: string; // "L'objectif déduit du PDF"
  delaiObjectif: string;
  sessionFocus?: string;
  blessures_actives: string[]; // "Liste des zones blessées (ex: 'Épaules')"
  details_blessures?: string; // "Texte descriptif venant de l'analyse IA du PDF"
  raw_assessment?: string; // "Texte brut du bilan physiologique inséré par le coach"
  historique_dates: string[];
  historique_volume: number[];
  sessionRecords: SessionRecord[];
  personalBests: Record<string, PerformanceEntry>;
  exerciseTrends: Record<string, PerformanceEntry[]>;
  activeGoal?: ActiveGoal;
  dernier_feedback_ia?: string; // "Conseil donné à la fin de la séance précédente"
  activeProgram?: WeeklyProgram; // "Programme d'entraînement actif"
  private_notes?: string; // "Notes privées du coach (non visibles par le client)"
  lastPainReport?: { date: string; location: string; intensity: number }; // "Dernière douleur signalée"
  weeklySleepAverage?: number; // "Moyenne de sommeil de la semaine"
  tags?: string[]; // "Tags personnalisés pour catégoriser le client"
  plannedSessions?: PlannedSession[]; // "Sessions planifiées pour le calendrier"
  achievements?: Achievement[]; // "Achievements débloqués"
  currentStreak?: number; // "Nombre de jours consécutifs avec séance"
  longestStreak?: number; // "Record de jours consécutifs"
  recoveryJournal?: RecoveryEntry[]; // "Journal de récupération"
  sessionRatings?: SessionRating[]; // "Évaluations des séances"
  preferences?: UserPreferences; // "Préférences utilisateur"
}

// "Entrée du journal de récupération"
export interface RecoveryEntry {
  date: string; // ISO date string
  sleepQuality: 'Mauvaise' | 'Moyenne' | 'Excellente';
  energyLevel: number; // 1-10
  painLevel: number; // 0-10
  notes?: string;
}

// "Évaluation d'une séance par le client"
export interface SessionRating {
  date: string; // ISO date string (correspond à la date de la séance)
  difficulty: number; // 1-5
  satisfaction: number; // 1-5
  pain: number; // 0-10
  comment?: string;
}

// "Préférences utilisateur"
export interface UserPreferences {
  fontSize?: 'small' | 'medium' | 'large';
  highContrast?: boolean;
  notificationsEnabled?: boolean;
  notificationFrequency?: 'daily' | 'weekly' | 'never';
  language?: string;
  theme?: 'light' | 'dark';
}

// "Session planifiée dans le calendrier"
export interface PlannedSession {
  id: string;
  date: string; // ISO date string
  clientId: string;
  notes?: string;
  isAutoGenerated?: boolean; // Si générée automatiquement depuis le programme
}

// "Achievement/Badge débloqué par le client"
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string; // Emoji ou nom d'icône
  unlockedAt: string; // ISO date string
  category: 'session' | 'progress' | 'streak' | 'pr' | 'program';
}

export interface ChatMessage {
  role: 'coach' | 'athlete';
  content: string;
  options?: string[];
}

// "Programme d'entraînement multi-semaines"
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

// "Message entre modérateur et client"
export interface Message {
  id: string;
  clientId: string;
  sender: 'moderator' | 'client';
  content: string;
  timestamp: string;
  read: boolean;
}

// "Conversation entre modérateur et client"
export interface Conversation {
  clientId: string;
  messages: Message[];
  lastMessage?: string;
  unreadCount: number;
}

// "Groupe de clients"
export interface ClientGroup {
  id: string;
  name: string;
  description?: string;
  clientIds: string[];
  createdAt: string;
  color?: string;
}

// "Historique de modification"
export interface ModificationHistory {
  id: string;
  clientId: string;
  timestamp: string;
  modifiedBy: string;
  field: string;
  oldValue: any;
  newValue: any;
  description: string;
}

// "Template de rapport"
export interface ReportTemplate {
  id: string;
  name: string;
  sections: string[];
  createdAt: string;
}

// "Template de programme"
export interface ProgramTemplate {
  id: string;
  name: string;
  duration: number;
  sessionsPerWeek: number;
  description?: string;
  createdAt: string;
}

// "Notification pour le modérateur"
export interface Notification {
  id: string;
  type: 'session' | 'pain' | 'inactivity' | 'injury' | 'system';
  clientId?: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  severity: 'low' | 'medium' | 'high';
}

// "Mode d'affichage du calendrier"
export type CalendarViewMode = 'month' | 'week' | 'list';

// "Pattern de récurrence"
export interface RecurrencePattern {
  type: 'daily' | 'weekly' | 'monthly' | 'custom';
  interval: number; // Tous les X jours/semaines/mois
  daysOfWeek?: number[]; // Pour weekly: [1,3,5] = lundi, mercredi, vendredi
  endDate?: string; // Date de fin optionnelle
  occurrences?: number; // Nombre d'occurrences
}

// "Créneau horaire pour une session"
export interface SessionTimeSlot {
  startTime?: string; // Format HH:mm
  endTime?: string; // Format HH:mm
  duration?: number; // Durée en minutes
}

// "Filtres du calendrier"
export interface CalendarFilter {
  clientIds?: string[];
  groupIds?: string[];
  types?: ('completed' | 'planned')[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  searchQuery?: string;
}

// "Schéma de couleurs du calendrier"
export interface CalendarColorScheme {
  clientColors?: Record<string, string>; // clientId -> couleur
  groupColors?: Record<string, string>; // groupId -> couleur
  defaultColor?: string;
}
