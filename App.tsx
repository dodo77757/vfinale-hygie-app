// "Point d'entrée principal de l'application React."
import React, { useState, useEffect, useRef, useCallback, useMemo, Suspense, lazy } from 'react';
import { UserProfile, WorkoutPlan, PerformanceMetric, GoalProgressEntry, Achievement, SessionRecord } from './types';
import * as aiService from './services/geminiService';
import { StorageService } from './services/storageService';
import { extractReps, calculateSuggestedWeight, updatePR } from './services/weightCalculationService';
import { generateMultiWeekProgram, generateProgramWorkout, markSessionCompleted } from './services/programmingService';
import { CoachClientView } from './components/CoachClientView';
import { WorkoutEditor } from './components/WorkoutEditor';
import { ToastContainer } from './components/Toast';
import { SwapExerciseModal } from './components/modals/SwapExerciseModal';
import { AssessmentModal } from './components/modals/AssessmentModal';
import { CreateProgramModal } from './components/modals/CreateProgramModal';
import { CreateClientModal } from './components/modals/CreateClientModal';
import { EditClientModal } from './components/modals/EditClientModal';
import { HumanBodySVG, BODY_PART_TO_MUSCLES } from './components/HumanBodySVG';
import { ExerciseLibraryModal } from './components/modals/ExerciseLibraryModal';
import { ClientQuickViewModal } from './components/modals/ClientQuickViewModal';
import { CoachAlertsPanel } from './components/CoachAlertsPanel';
import { DataExportService } from './services/dataExportService';
import { CoachCalendarView } from './components/CoachCalendarView';
import { CoachAnalytics } from './components/CoachAnalytics';
import { PlanSessionModal } from './components/modals/PlanSessionModal';
import { BatchActionsModal } from './components/modals/BatchActionsModal';
import { SessionProgressIndicator } from './components/SessionProgressIndicator';
import { AchievementNotification } from './components/AchievementNotification';
import { MotivationalMessage } from './components/MotivationalMessage';
import { LiveStatsPanel } from './components/LiveStatsPanel';
import { checkAchievements } from './services/achievementService';
import { InfoTooltip } from './components/ui/InfoTooltip';
import { ClientSessionHistory } from './components/ClientSessionHistory';
import { SessionDetailModal } from './components/SessionDetailModal';
import { GoalTracker } from './components/GoalTracker';
import { RecoveryJournal } from './components/RecoveryJournal';
import { ClientSettings } from './components/ClientSettings';
import { SessionRatingModal } from './components/SessionRatingModal';
import { ComparisonCharts } from './components/ComparisonCharts';
import { OnboardingTutorial } from './components/OnboardingTutorial';
import { ClientCalendarView } from './components/ClientCalendarView';
import { EXERCISE_DB } from './data/exerciseLibrary';
import { useKeyboardShortcuts } from './components/ui/KeyboardShortcuts';
import { EnhancedAreaChart, EnhancedLineChart } from './components/ui/EnhancedChart';
import { useDebounce } from './hooks/useDebounce';
import { areClientsEqual, areProfilesEqual } from './utils/comparisonUtils';
import { confirmAction } from './utils/confirmDialog';
import { PerformanceBackground } from './components/shared/PerformanceBackground';
import { 
  fileToBase64Optimized, 
  optimizeFileForUpload, 
  getMimeType,
  isFileTooLarge,
  formatFileSize
} from './services/fileProcessingService';
import { checkFileDuplicate, checkTextDuplicate } from './utils/fileDuplicateCheck';
import { notificationService } from './services/notificationService';

// "Déclaration globale pour l'interface de sélection de clé API (AIStudio)."
declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
  
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
}

const COACH_AVATAR = "https://images.unsplash.com/photo-1594381898411-846e7d193883?q=80&w=256&h=256&auto=format&fit=crop";

// "Fonction utilitaire pour afficher le temps (ex: 90s -> 01:30)."
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// Composant TimerDisplay mémorisé pour éviter les re-renders inutiles
const TimerDisplay: React.FC<{ seconds: number; className?: string }> = React.memo(({ seconds, className = '' }) => {
  const formattedTime = useMemo(() => formatTime(seconds), [seconds]);
  return <span className={className}>{formattedTime}</span>;
});
TimerDisplay.displayName = 'TimerDisplay';

// Composant ClientCard mémorisé pour la liste de sélection client
const ClientCard: React.FC<{
  client: UserProfile;
  onSelect: (client: UserProfile, mode: 'DASHBOARD' | 'DAILY_CHECK') => void;
  mode: 'DASHBOARD' | 'DAILY_CHECK';
}> = React.memo(({ client, onSelect, mode }) => {
  const handleClick = () => {
    onSelect(client, mode);
  };

  return (
    <div 
      onClick={handleClick} 
      className="group p-6 rounded-xl flex flex-col gap-4 cursor-pointer bg-white border-2 border-[#007c89]/20 hover:border-[#007c89] transition-all hover:scale-[1.02] hover:shadow-xl shadow-lg relative"
    >
      <div className="flex items-center gap-6">
        <img src={client.avatar} alt={client.nom} className="w-20 h-20 rounded-xl border-2 border-[#007c89]/30 object-cover shadow-md" />
        <div>
          <h3 className="font-bebas text-2xl text-[#181818] group-hover:text-[#007c89] transition-colors">{client.nom}</h3>
          <p className="text-xs font-medium text-[#6B7280] uppercase">{client.objectifPrincipal}</p>
        </div>
      </div>
      <div className="absolute top-6 right-6 text-[#94A3B8] group-hover:text-[#007c89] font-bebas text-2xl transition-colors">⮕</div>
    </div>
  );
});
ClientCard.displayName = 'ClientCard';

// Composant CoachClientCard mémorisé pour le dashboard coach - Enrichi avec informations détaillées
const CoachClientCard: React.FC<{
  client: UserProfile;
  onSelect: (client: UserProfile, mode: 'DASHBOARD' | 'DAILY_CHECK') => void;
  onAssessment: (client: UserProfile) => void;
  onEdit: (client: UserProfile) => void;
  onQuickView?: (client: UserProfile) => void;
  onDuplicate?: (client: UserProfile) => void;
  isSelected?: boolean;
  onToggleSelect?: (clientId: string) => void;
}> = React.memo(({ client, onSelect, onAssessment, onEdit, onQuickView, onDuplicate, isSelected, onToggleSelect }) => {
  const handleSelect = () => {
    onSelect(client, 'DASHBOARD');
  };

  const handleAssessment = () => {
    onAssessment(client);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(client);
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onQuickView) onQuickView(client);
  };

  const handleToggleSelect = (e: React.ChangeEvent<HTMLInputElement> | React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleSelect) onToggleSelect(client.id);
  };

  // Calculs pour les informations affichées
  const sessionCount = client.sessionRecords?.length || 0;
  const lastSession = client.sessionRecords && client.sessionRecords.length > 0
    ? client.sessionRecords[client.sessionRecords.length - 1]
    : null;
  const lastSessionDate = lastSession ? new Date(lastSession.date) : null;
  const daysSinceLastSession = lastSessionDate 
    ? Math.floor((Date.now() - lastSessionDate.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  // Progression du programme actif
  const programProgress = client.activeProgram
    ? ((client.activeProgram.currentWeek - 1) * client.activeProgram.sessionsPerWeek + client.activeProgram.currentSession) / (client.activeProgram.duration * client.activeProgram.sessionsPerWeek) * 100
    : null;

  // Indicateurs visuels
  const hasInjuries = client.blessures_actives && client.blessures_actives.length > 0;
  const sleepQuality = client.sleepQuality === 'Excellente' ? '🟢' : client.sleepQuality === 'Moyenne' ? '🟡' : '🔴';
  const hasPainReport = client.lastPainReport && client.lastPainReport.intensity >= 5;
  const isInactive = daysSinceLastSession !== null && daysSinceLastSession > 30;

  return (
    <div 
      onClick={handleSelect}
      className={`group relative p-5 rounded-2xl flex flex-col gap-3 cursor-pointer transition-all duration-300 border-2 shadow-lg ${
        isSelected 
          ? 'bg-gradient-to-br from-[#e0f4f6] to-white border-[#007c89] shadow-xl shadow-[#007c89]/20' 
          : 'bg-gradient-to-br from-white to-[#f3efe5] border-[#007c89]/20 hover:border-[#007c89] hover:shadow-xl hover:shadow-[#007c89]/15'
      }`}
    >
      {/* Checkbox pour sélection multiple */}
      {onToggleSelect && (
        <input
          type="checkbox"
          checked={isSelected || false}
          onChange={(e) => {
            e.stopPropagation();
            handleToggleSelect(e);
          }}
          onClick={(e) => e.stopPropagation()}
          className="absolute top-3 left-3 w-5 h-5 cursor-pointer accent-[#007c89] opacity-0 group-hover:opacity-100 transition-opacity rounded"
        />
      )}

      <div className="flex items-center gap-4">
        <div className="relative">
          <img src={client.avatar} alt={client.nom} className="w-16 h-16 rounded-xl border-2 border-[#007c89]/30 object-cover shadow-md" />
          {hasInjuries && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-[#EF4444] to-[#DC2626] rounded-full border-2 border-white shadow-md"></div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bebas text-2xl text-[#181818] group-hover:text-[#007c89] transition-colors truncate">{client.nom}</h3>
          <p className="text-xs font-medium text-[#6B7280] uppercase mt-0.5 truncate">{client.objectifPrincipal || 'Aucun objectif'}</p>
        </div>
      </div>

      {/* Tags - Style joyeux */}
      {client.tags && client.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {client.tags.slice(0, 3).map((tag, idx) => (
            <span 
              key={idx}
              className="px-3 py-1 bg-[#007c89] text-white rounded-full text-[10px] font-semibold uppercase border-2 border-[#007c89] shadow-sm"
            >
              {tag}
            </span>
          ))}
          {client.tags.length > 3 && (
            <span className="px-3 py-1 text-[#6B7280] text-[10px] font-medium">+{client.tags.length - 3}</span>
          )}
        </div>
      )}

      {/* Informations enrichies - Style joyeux */}
      <div className="flex flex-wrap gap-2">
        {sessionCount > 0 && (
          <span className="px-3 py-1 bg-[#e0f4f6] text-[#007c89] rounded-full text-[10px] font-semibold border-2 border-[#007c89]/30 shadow-sm">
            {sessionCount} sessions
          </span>
        )}
        {lastSessionDate && (
          <span className={`px-3 py-1 rounded-full text-[10px] font-semibold border-2 shadow-sm ${
            isInactive 
              ? 'bg-gradient-to-r from-[#FEE2E2] to-[#FECACA] text-[#DC2626] border-[#EF4444]' 
              : 'bg-[#e0f4f6] text-[#007c89] border-[#007c89]/30'
          }`}>
            {daysSinceLastSession === 0 ? "Aujourd'hui" : daysSinceLastSession === 1 ? "Hier" : `${daysSinceLastSession}j`}
          </span>
        )}
        {hasPainReport && (
          <span className="px-3 py-1 bg-gradient-to-r from-[#FEE2E2] to-[#FECACA] text-[#DC2626] rounded-full text-[10px] font-semibold border-2 border-[#EF4444] shadow-sm">
            Douleur
          </span>
        )}
        <span className={`px-3 py-1 rounded-full text-[10px] font-semibold border-2 shadow-sm ${
          client.sleepQuality === 'Excellente' 
            ? 'bg-gradient-to-r from-[#D1FAE5] to-[#A7F3D0] text-[#059669] border-[#10B981]'
            : client.sleepQuality === 'Moyenne'
            ? 'bg-[#f3efe5] text-[#007c89] border-[#007c89]/30'
            : 'bg-gradient-to-r from-[#FEE2E2] to-[#FECACA] text-[#DC2626] border-[#EF4444]'
        }`}>
          {sleepQuality} Sommeil
        </span>
      </div>

      {/* Barres de progression - Style joyeux */}
      <div className="space-y-3">
        {programProgress !== null && client.activeProgram && (
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs font-semibold text-[#4B5563] uppercase">Programme</span>
              <span className="text-xs font-bold text-[#007c89]">{Math.round(programProgress)}%</span>
            </div>
            <div className="w-full bg-[#E5E7EB] rounded-full h-2.5 overflow-hidden shadow-inner">
              <div 
                className="bg-[#007c89] h-2.5 rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${Math.min(programProgress, 100)}%` }}
              />
            </div>
          </div>
        )}

        {client.activeGoal && (
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs font-semibold text-[#4B5563] uppercase truncate flex-1 mr-2">{client.activeGoal.label}</span>
              <span className="text-xs font-bold text-[#F59E0B]">{Math.round(client.activeGoal.currentValue)}%</span>
            </div>
            <div className="w-full bg-[#FEF3C7] rounded-full h-2.5 overflow-hidden shadow-inner">
              <div 
                className="bg-gradient-to-r from-[#FBBF24] to-[#F59E0B] h-2.5 rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${Math.min(client.activeGoal.currentValue, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Actions - Style joyeux */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        {onQuickView && (
          <button
            onClick={handleQuickView}
            className="p-2 hover:bg-[#BAE6FD]/30 rounded-lg transition-all shadow-sm"
            title="Vue rapide"
          >
            <span className="text-[#38BDF8] text-base">👁</span>
          </button>
        )}
        {onDuplicate && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate(client);
            }}
            className="p-2 hover:bg-[#FCD34D]/30 rounded-lg transition-all shadow-sm"
            title="Dupliquer"
          >
            <span className="text-[#F59E0B] text-base">📋</span>
          </button>
        )}
        <button
          onClick={handleEdit}
          className="p-2 hover:bg-[#BAE6FD]/30 rounded-lg transition-all shadow-sm"
          title="Éditer"
        >
          <span className="text-[#38BDF8] text-base">✎</span>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleAssessment();
          }}
          className="p-2 hover:bg-[#FCD34D]/30 rounded-lg transition-all shadow-sm"
          title="Bilan"
        >
          <span className="text-[#F59E0B] text-base">✚</span>
        </button>
      </div>
      
      {/* Indicateur de sélection */}
      {isSelected && (
        <div className="absolute top-2 right-2 w-3 h-3 bg-gradient-to-br from-[#38BDF8] to-[#7DD3FC] rounded-full border-2 border-white shadow-md"></div>
      )}
    </div>
  );
});
CoachClientCard.displayName = 'CoachClientCard';

// "Les différentes étapes (écrans) de l'application."
type AppStep = 'DAILY_CHECK' | 'WARMUP' | 'WORKOUT' | 'STRETCH' | 'DEBRIEF' | 'FINAL' | 'DASHBOARD';
type ViewMode = 'LOGIN' | 'CLIENT_LOGIN' | 'COACH_DASHBOARD' | 'CLIENT_APP';

// --- COMPOSANTS UI VISUELS ---
// PerformanceBackground est maintenant importé depuis components/shared/PerformanceBackground.tsx

const ProgressBar: React.FC<{ current: number; total: number }> = React.memo(({ current, total }) => {
  const progress = useMemo(() => (current / total) * 100, [current, total]);
  return (
    <div className="fixed top-0 left-0 w-full h-2 bg-gray-200 z-[60]">
      <div 
        className="h-full bg-gradient-to-r from-[#38BDF8] to-[#7DD3FC] shadow-[0_0_10px_rgba(56,189,248,0.5)] transition-all duration-500 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
});

ProgressBar.displayName = 'ProgressBar';

// --- COMPOSANT PRINCIPAL DE L'APPLICATION ---

const App: React.FC = () => {
  // "--- ÉTATS GLOBAUX DE NAVIGATION ---"
  const [viewMode, setViewMode] = useState<ViewMode>('LOGIN');
  const [userRole, setUserRole] = useState<'COACH' | 'CLIENT' | null>(null);
  const [step, setStep] = useState<AppStep>('DAILY_CHECK');

  // "--- ÉTATS GESTION DES DONNÉES ---"
  const [clients, setClients] = useState<UserProfile[]>([]);
  // "PROFIL ACTIF (Celui qui est utilisé dans la session en cours)"
  const [profile, setProfile] = useState<UserProfile | null>(null);
  
  const [isTyping, setIsTyping] = useState(false);
  const [hasApiKey, setHasApiKey] = useState<boolean>(true);
  const [fileProcessingProgress, setFileProcessingProgress] = useState(0);
  const [fileProcessingStage, setFileProcessingStage] = useState<string>('');
  
  // "--- ÉTATS DE LA SÉANCE ---"
  const [workout, setWorkout] = useState<WorkoutPlan | null>(null);
  const [currentExoIndex, setCurrentExoIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isResting, setIsResting] = useState(false);
  const [sessionData, setSessionData] = useState<PerformanceMetric[]>([]);
  const [currentKg, setCurrentKg] = useState(0);
  const [aiFeedback, setAiFeedback] = useState('');
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([]);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [motivationalMessage, setMotivationalMessage] = useState<{ type: 'mid_session' | 'last_exercise' | 'pr_broken' | 'streak' | 'progress'; message?: string } | null>(null);
  const [selectedSessionForDetail, setSelectedSessionForDetail] = useState<SessionRecord | null>(null);
  const [dashboardTab, setDashboardTab] = useState<'stats' | 'history' | 'calendar'>('stats');
  const [currentPlannedSession, setCurrentPlannedSession] = useState<any>(null);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [sessionRatingModalOpen, setSessionRatingModalOpen] = useState(false);
  const [tutorialCompleted, setTutorialCompleted] = useState<boolean>(() => {
    return localStorage.getItem('hygie_tutorial_completed') === 'true';
  });
  const [showTutorial, setShowTutorial] = useState(false);
  
  // "--- MODALES ---"
  const [confirmExoModal, setConfirmExoModal] = useState(false);
  const [confirmSwapModal, setConfirmSwapModal] = useState(false);
  const [assessmentModalOpen, setAssessmentModalOpen] = useState(false);
  const [createClientModalOpen, setCreateClientModalOpen] = useState(false);
  const [createProgramModalOpen, setCreateProgramModalOpen] = useState(false);
  const [workoutEditorOpen, setWorkoutEditorOpen] = useState(false);
  const [exerciseLibraryModalOpen, setExerciseLibraryModalOpen] = useState(false);
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string>('');
  const [filteredExercises, setFilteredExercises] = useState<any[]>([]);
  const [editClientModalOpen, setEditClientModalOpen] = useState(false);
  const [selectedClientForEdit, setSelectedClientForEdit] = useState<UserProfile | null>(null);
  const [batchActionsModalOpen, setBatchActionsModalOpen] = useState(false);
  
  // "--- RECHERCHE ET FILTRES (COACH DASHBOARD) ---"
  const [searchQuery, setSearchQuery] = useState('');
  const [filterObjective, setFilterObjective] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [filterTag, setFilterTag] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'lastSession' | 'progress' | 'created'>('name');
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set());
  const [quickViewClient, setQuickViewClient] = useState<UserProfile | null>(null);
  
  // "--- NAVIGATION MODÉRATEUR (VUES MULTIPLES) ---"
  type ModeratorView = 'clients' | 'calendar' | 'analytics' | 'exercises' | 'import';
  const [moderatorView, setModeratorView] = useState<ModeratorView>('clients');
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(null);
  const [planSessionModalOpen, setPlanSessionModalOpen] = useState(false);
  
  // "--- PROGRAMME ---"
  const [programDuration, setProgramDuration] = useState(4);
  const [sessionsPerWeek, setSessionsPerWeek] = useState(3);
  const [programName, setProgramName] = useState('');

  // "--- FORMULAIRES & INPUTS ---"
  const [selectedClientForAssessment, setSelectedClientForAssessment] = useState<UserProfile | null>(null);
  const [assessmentText, setAssessmentText] = useState('');
  const [assessmentFile, setAssessmentFile] = useState<File | null>(null);
  const [newClientName, setNewClientName] = useState('');
  const [newClientFile, setNewClientFile] = useState<File | null>(null);
  const [newClientText, setNewClientText] = useState('');

  // "--- RÉFÉRENCES ---"
  const timerRef = useRef<number | null>(null);
  const dashboardFileInputRef = useRef<HTMLInputElement>(null);
  const importFileInputRef = useRef<HTMLInputElement>(null);
  
  // "--- RÉFÉRENCES POUR ÉVITER LES BOUCLES DE SAUVEGARDE ---"
  const lastSavedProfileRef = useRef<UserProfile | null>(null);
  const lastSavedClientsRef = useRef<UserProfile[]>([]);
  const isSavingRef = useRef(false);

  // "--- INITIALISATION ---"

  useEffect(() => {
    const loadedClients = StorageService.loadClients();
    setClients(loadedClients);
    // Initialiser les refs avec les données chargées
    lastSavedClientsRef.current = loadedClients;
    // Sauvegarde initiale pour s'assurer que les données sont persistées
    if (loadedClients.length > 0) {
      StorageService.saveClients(loadedClients);
    }
  }, []);

  useEffect(() => {
    const checkApiKey = async () => {
      if (typeof window !== 'undefined' && window.aistudio) {
        try {
        const has = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(has);
        } catch (error) {
          console.warn("Erreur lors de la vérification de la clé API:", error);
          setHasApiKey(false);
        }
      }
    };
    checkApiKey();
  }, []);

  // Debounce du profil pour éviter les sauvegardes trop fréquentes
  const debouncedProfile = useDebounce(profile, 500);

  // "--- SAUVEGARDE AUTOMATIQUE DU PROFIL ---"
  // Sauvegarde automatiquement le profil à chaque modification avec debounce
  useEffect(() => {
    if (!debouncedProfile || isSavingRef.current) return;
    
    // Vérifier si le profil a réellement changé
    if (lastSavedProfileRef.current && areProfilesEqual(lastSavedProfileRef.current, debouncedProfile)) {
      return;
    }

    isSavingRef.current = true;
    try {
      const updatedClients = StorageService.updateClient(debouncedProfile);
      lastSavedProfileRef.current = debouncedProfile;
      
      // Mettre à jour la liste des clients seulement si elle a changé
          setClients(prevClients => {
        if (areClientsEqual(prevClients, updatedClients)) {
          return prevClients;
        }
        lastSavedClientsRef.current = updatedClients;
        return updatedClients;
          });
        } catch (error) {
          console.error("Erreur lors de la sauvegarde automatique:", error);
      notificationService.error("Erreur lors de la sauvegarde automatique du profil.");
    } finally {
      isSavingRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedProfile]);

  // "--- SAUVEGARDE AUTOMATIQUE DES CLIENTS ---"
  // Sauvegarde automatique de la liste des clients avec debounce (seulement si changée par autre chose que le profil)
  const debouncedClients = useDebounce(clients, 500);
  
  useEffect(() => {
    if (debouncedClients.length === 0 || isSavingRef.current) return;
    
    // Vérifier si la liste a réellement changé
    if (areClientsEqual(lastSavedClientsRef.current, debouncedClients)) {
      return;
    }

    isSavingRef.current = true;
    try {
      StorageService.saveClients(debouncedClients);
      lastSavedClientsRef.current = debouncedClients;
    } catch (error) {
      console.error("Erreur lors de la sauvegarde automatique des clients:", error);
      notificationService.error("Erreur lors de la sauvegarde automatique des clients.");
    } finally {
      isSavingRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedClients]);

  // "--- SAUVEGARDE AVANT FERMETURE ---"
  // Sauvegarde les données avant de quitter la page
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (profile) {
        try {
          StorageService.updateClient(profile);
        } catch (error) {
          console.error("Erreur lors de la sauvegarde avant fermeture:", error);
        }
      }
      if (clients.length > 0) {
        try {
          StorageService.saveClients(clients);
        } catch (error) {
          console.error("Erreur lors de la sauvegarde des clients avant fermeture:", error);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [profile, clients]);

  const handleOpenKeyDialog = async () => {
    if (typeof window !== 'undefined' && window.aistudio) {
      try {
      await window.aistudio.openSelectKey();
      setHasApiKey(true);
      } catch (error) {
        console.error("Erreur lors de l'ouverture du dialogue de clé API:", error);
        notificationService.error("Impossible d'ouvrir le dialogue de sélection de clé API.");
      }
    }
  };

  // "--- LOGIQUE DE NAVIGATION ---"

  const handleLogin = useCallback((role: 'COACH' | 'CLIENT') => {
    setUserRole(role);
    setViewMode(role === 'COACH' ? 'COACH_DASHBOARD' : 'CLIENT_LOGIN');
  }, []);

  const selectProfileAndStart = useCallback((client: UserProfile, mode: 'DASHBOARD' | 'DAILY_CHECK') => {
     // #region agent log
     fetch('http://127.0.0.1:7242/ingest/2cfb4929-d2fb-4807-9ccf-fd780957ec5c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:337',message:'selectProfileAndStart called',data:{clientId:client?.id,clientName:client?.nom,mode,clientsCount:clients.length,clientsIds:clients.map(c=>c.id)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
     // #endregion
     const freshProfile = clients.find(c => c.id === client.id) || client;
     // #region agent log
     fetch('http://127.0.0.1:7242/ingest/2cfb4929-d2fb-4807-9ccf-fd780957ec5c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:340',message:'freshProfile determined',data:{freshProfileId:freshProfile?.id,freshProfileName:freshProfile?.nom,foundInClients:!!clients.find(c => c.id === client.id)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
     // #endregion
     setProfile(freshProfile);
     setViewMode('CLIENT_APP');
     setStep(mode);
     setSessionData([]); // Reset session data
     setWorkout(null);
  }, [clients]);

  const handleBackToBase = useCallback(() => {
    setViewMode('COACH_DASHBOARD');
    setStep('DAILY_CHECK');
    setWorkout(null);
    setProfile(null);
  }, []);

  const handleClearAllClients = useCallback(() => {
    confirmAction(
      "Êtes-vous sûr de vouloir supprimer TOUS les sujets de la base de données ? Cette action est irréversible.",
      () => {
      const emptyList = StorageService.clearAllClients();
      setClients(emptyList);
      setProfile(null);
        notificationService.success("Tous les sujets ont été supprimés.");
    }
    );
  }, []);

  // "--- LOGIQUE MÉTIER : WORKOUT & SESSION (PART 1: Fonctions de Fin) ---"

  // "Définie ici (avant usage dans handleAutoTransition) et sécurisée avec useCallback + Error Handling"
  const finishSession = useCallback(async () => {
    setIsTimerRunning(false);
    setIsTyping(true);
    
    try {
        if (profile) {
            // "Tentative de feedback IA, mais on ne bloque pas si ça échoue"
            try {
                const feedback = await aiService.generateSessionFeedback(profile, sessionData);
                setAiFeedback(feedback);
            } catch (err) {
                console.warn("Feedback IA échoué:", err);
                setAiFeedback("Session terminée. Analyse IA indisponible (Mode hors ligne).");
            }
        }
        setStep('DEBRIEF');
    } catch (e) {
        console.error("Erreur critique finishSession:", e);
        setStep('DEBRIEF'); // "Force la navigation même en cas de crash"
    } finally {
        setIsTyping(false);
    }
  }, [profile, sessionData]);

  // "--- UTILS WORKOUT TIMING ---"
  
  const handleAutoTransition = useCallback(() => {
    // Arrêter le timer immédiatement
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsTimerRunning(false);

    if (isResting) {
      setIsResting(false); 
      setCountdown(0);
      return;
    }

    if (step === 'WARMUP' && workout) {
      const combined = [...workout.echauffement_dynamique, ...workout.etirements_dynamiques];
      const nextIndex = currentPhaseIndex + 1;
      if (nextIndex < combined.length) {
        setCurrentPhaseIndex(nextIndex);
        setCountdown(combined[nextIndex].duree_secondes);
        setIsTimerRunning(true);
      } else {
        // Fin échauffement -> Start Main
        setStep('WORKOUT');
        setCurrentExoIndex(0); 
        setCurrentSet(1); 
        setCountdown(0);
        setIsResting(false);
        if(workout.liste_exos.length > 0 && profile) {
            const firstExo = workout.liste_exos[0];
            const targetReps = extractReps(firstExo.reps);
            const suggestedWeight = calculateSuggestedWeight(profile, firstExo, targetReps);
            setCurrentKg(suggestedWeight);
        }
      }
    } else if (step === 'STRETCH' && workout) {
      const nextIndex = currentPhaseIndex + 1;
      if (nextIndex < workout.etirements.length) {
        setCurrentPhaseIndex(nextIndex);
        setCountdown(workout.etirements[nextIndex].duree_secondes);
        setIsTimerRunning(true);
      } else {
        finishSession();
      }
    }
  }, [isResting, step, currentPhaseIndex, workout, profile, finishSession]);

  // Timer Effect Global
  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = window.setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1 && (step === 'WARMUP' || step === 'STRETCH' || isResting)) {
            // Arrêter le timer immédiatement
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
            setIsTimerRunning(false);
            // Appeler la transition de manière synchrone
            handleAutoTransition();
            return 0;
          }
          // Pour les timers de repos, échauffement et étirements : compte à rebours
          // Pour le timer d'effort en WORKOUT : compte à l'endroit
          return (isResting || step === 'WARMUP' || step === 'STRETCH') ? prev - 1 : prev + 1;
        });
      }, 1000);
    } else {
      // S'assurer que le timer est arrêté si isTimerRunning est false
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => { 
      if(timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isTimerRunning, isResting, step, handleAutoTransition]);
  
  // Démarrer le timer d'effort quand on commence un exercice (WORKOUT sans repos)
  useEffect(() => {
    if (step === 'WORKOUT' && !isResting && !isTimerRunning && workout) {
      // Démarrer le timer d'effort
      setCountdown(0);
      setIsTimerRunning(true);
    }
  }, [step, isResting, isTimerRunning, workout]);

  // "--- LOGIQUE MÉTIER : GESTION CLIENTS (CRUD) ---"

  const handleAnalyzeAssessment = useCallback(async () => {
    if (!selectedClientForAssessment || (!assessmentText.trim() && !assessmentFile)) return;
    
    setIsTyping(true);
    setFileProcessingProgress(0);
    setFileProcessingStage('');
    
    try {
      let analysisInput: aiService.AssessmentInput;

      if (assessmentFile) {
        // Vérifie la taille du fichier
        if (isFileTooLarge(assessmentFile)) {
          notificationService.error(`Fichier trop volumineux (${formatFileSize(assessmentFile.size)}). Veuillez utiliser un fichier de moins de 20MB.`);
          setIsTyping(false);
          return;
        }

        setFileProcessingStage('Optimisation du fichier...');
        const optimizedFile = await optimizeFileForUpload(assessmentFile);
        
        setFileProcessingStage('Conversion en Base64...');
        const base64Raw = await fileToBase64Optimized(optimizedFile, (progress) => {
          setFileProcessingProgress(Math.min(progress, 50)); // 0-50% pour la conversion
        });
        
        setFileProcessingStage('Envoi à l\'IA...');
        const base64Data = base64Raw.split(',')[1];
        const mimeType = getMimeType(optimizedFile);
        analysisInput = { inlineData: { data: base64Data, mimeType } };
        
        setFileProcessingProgress(60);
      } else {
        analysisInput = assessmentText;
        setFileProcessingProgress(30);
      }

      setFileProcessingStage('Analyse en cours...');
      setFileProcessingProgress(70);
      const analysis = await aiService.parseMedicalAssessment(analysisInput);
      setFileProcessingProgress(100);
      
      // Combine les blessures existantes avec les nouvelles détectées
      const allBlessures = [
        ...(selectedClientForAssessment.blessures_actives || []),
        ...(analysis.blessures_actives || []),
        ...(analysis.detected_faiblesses || []),
        ...(analysis.detected_limitations || [])
      ];
      // Supprime les doublons
      const uniqueBlessures = Array.from(new Set(allBlessures));
      
      // Construit les détails complets
      let detailsBlessuresComplet = analysis.details_blessures || selectedClientForAssessment.details_blessures || "";
      if (analysis.detected_antecedents) {
        detailsBlessuresComplet += ` Antécédents: ${analysis.detected_antecedents}.`;
      }
      if (analysis.detected_medications && analysis.detected_medications.length > 0) {
        detailsBlessuresComplet += ` Médications: ${analysis.detected_medications.join(', ')}.`;
      }
      
      // Mise à jour sécurisée qui préserve toutes les propriétés existantes et ajoute les nouvelles infos
      const updatedClient: UserProfile = {
        ...selectedClientForAssessment,
        // Met à jour le nom si détecté et différent
        nom: analysis.detected_name?.trim() && analysis.detected_name.trim() !== selectedClientForAssessment.nom 
          ? analysis.detected_name.trim().toUpperCase() 
          : selectedClientForAssessment.nom,
        // Met à jour les données démographiques si détectées
        age: analysis.detected_age || selectedClientForAssessment.age,
        genre: analysis.detected_genre || selectedClientForAssessment.genre,
        poids: analysis.detected_poids || selectedClientForAssessment.poids,
        taille: analysis.detected_taille || selectedClientForAssessment.taille,
        experience: analysis.detected_experience || selectedClientForAssessment.experience,
        // Met à jour les informations médicales
        blessures_actives: uniqueBlessures,
        details_blessures: detailsBlessuresComplet,
        stressLevel: analysis.stressLevel || selectedClientForAssessment.stressLevel,
        sleepQuality: analysis.sleepQuality || selectedClientForAssessment.sleepQuality,
        // Met à jour l'objectif si détecté
        objectifPrincipal: analysis.detected_objectif || selectedClientForAssessment.objectifPrincipal,
        raw_assessment: assessmentFile ? `Fichier analysé: ${assessmentFile.name}` : assessmentText,
        dernier_feedback_ia: `Bilan MAJ : ${analysis.recommendations}`
        // Toutes les autres propriétés sont préservées grâce au spread operator
      };
      
      // Log pour debug
      console.log('Client mis à jour avec les informations extraites:', {
        nom: updatedClient.nom,
        age: updatedClient.age,
        genre: updatedClient.genre,
        blessures: updatedClient.blessures_actives,
        faiblesses_detectees: analysis.detected_faiblesses,
        limitations_detectees: analysis.detected_limitations
      });

      const newClientsList = StorageService.updateClient(updatedClient);
      setClients(newClientsList);
      
      if (profile && profile.id === updatedClient.id) {
         setProfile(updatedClient);
      }

      setAssessmentModalOpen(false);
      setFileProcessingProgress(0);
      setFileProcessingStage('');
      notificationService.success("Bilan Bio-Métrique intégré avec succès.");
    } catch (e) {
      notificationService.error("Échec de l'analyse du bilan.");
    } finally {
      setIsTyping(false);
      setFileProcessingProgress(0);
      setFileProcessingStage('');
    }
  }, [selectedClientForAssessment, assessmentText, assessmentFile, profile]);

  const createNewClientProcess = async (name: string, file: File | null, text: string) => {
     console.log('createNewClientProcess appelé', { name, hasFile: !!file, hasText: !!text });
     setIsTyping(true);
     setFileProcessingProgress(0);
     setFileProcessingStage('');
     console.log('isTyping mis à true');
     
     try {
        let analysis: aiService.AssessmentAnalysis | null = null;
        let rawAssessment = "Saisie manuelle.";

        if (file || text.trim()) {
            let analysisInput: aiService.AssessmentInput;
            if (file) {
                // Vérifie la taille du fichier
                if (isFileTooLarge(file)) {
                  notificationService.error(`Fichier trop volumineux (${formatFileSize(file.size)}). Veuillez utiliser un fichier de moins de 20MB.`);
                  setIsTyping(false);
                  setFileProcessingProgress(0);
                  setFileProcessingStage('');
                  throw new Error('Fichier trop volumineux');
                }

                setFileProcessingStage('Optimisation du fichier...');
                const optimizedFile = await optimizeFileForUpload(file);
                
                setFileProcessingStage('Conversion en Base64...');
                const base64Raw = await fileToBase64Optimized(optimizedFile, (progress) => {
                  setFileProcessingProgress(Math.min(progress, 50));
                });
                
                setFileProcessingStage('Envoi à l\'IA...');
                const base64Data = base64Raw.split(',')[1];
                const mimeType = getMimeType(optimizedFile);
                analysisInput = { inlineData: { data: base64Data, mimeType } };
                rawAssessment = `Fichier: ${file.name}`;
                setFileProcessingProgress(60);
            } else {
                analysisInput = text;
                rawAssessment = text;
                setFileProcessingProgress(30);
            }
            
            setFileProcessingStage('Analyse en cours...');
            setFileProcessingProgress(70);
            
            // Ajout d'un timeout pour éviter que l'application reste bloquée
            const analysisPromise = aiService.parseMedicalAssessment(analysisInput);
            const timeoutPromise = new Promise<null>((_, reject) => 
                setTimeout(() => reject(new Error('Timeout: L\'analyse prend trop de temps (plus de 60 secondes)')), 60000)
            );
            
            try {
                analysis = await Promise.race([analysisPromise, timeoutPromise]);
            setFileProcessingProgress(100);
                console.log('Analyse terminée avec succès:', analysis);
            } catch (analysisError: any) {
                console.error("Erreur lors de l'analyse:", analysisError);
                
                // Vérifier si c'est une erreur de quota
                const isQuotaError = analysisError?.message?.includes('quota') || 
                                    analysisError?.message?.includes('429') ||
                                    analysisError?.code === 429 ||
                                    analysisError?.message?.includes('RESOURCE_EXHAUSTED');
                
                if (isQuotaError) {
                    notificationService.error("Quota API Gemini épuisé. Le client sera créé avec des valeurs par défaut. Veuillez attendre ou vérifier votre quota API.");
                } else {
                    notificationService.warning(`L'analyse automatique a échoué (${analysisError.message || 'Erreur inconnue'}). Le client sera créé avec des valeurs par défaut.`);
                }
                
                // On continue avec une analyse vide plutôt que de bloquer
                analysis = null; // On continuera avec des valeurs par défaut
                setFileProcessingProgress(100);
            }
        }

        // Priorité : nom fourni manuellement > nom détecté par IA > nom généré
        const finalName = name.trim() || analysis?.detected_name?.trim() || `SUJET_${Date.now().toString().slice(-4)}`;
        
        // Combine les blessures actives avec les faiblesses détectées pour un profil complet
        const allBlessures = [
            ...(analysis?.blessures_actives || []),
            ...(analysis?.detected_faiblesses || []),
            ...(analysis?.detected_limitations || [])
        ];
        
        // Construit les détails complets des blessures
        let detailsBlessuresComplet = analysis?.details_blessures || "Profil initialisé sans pathologie majeure.";
        if (analysis?.detected_antecedents) {
            detailsBlessuresComplet += ` Antécédents: ${analysis.detected_antecedents}.`;
        }
        if (analysis?.detected_medications && analysis.detected_medications.length > 0) {
            detailsBlessuresComplet += ` Médications: ${analysis.detected_medications.join(', ')}.`;
        }
        
        // Détermine l'expérience : détectée > déduite du niveau d'activité > par défaut
        let experienceFinale = analysis?.detected_experience;
        if (!experienceFinale && analysis?.detected_niveau_activite) {
            const niveau = analysis.detected_niveau_activite.toLowerCase();
            if (niveau.includes('débutant') || niveau.includes('sédentaire') || niveau.includes('novice')) {
                experienceFinale = 'Débutant';
            } else if (niveau.includes('intermédiaire') || niveau.includes('actif')) {
                experienceFinale = 'Intermédiaire';
            } else if (niveau.includes('avancé') || niveau.includes('expert') || niveau.includes('athlète')) {
                experienceFinale = 'Avancé';
            }
        }
        
        const newClient: UserProfile = {
            id: `client_${Date.now()}`,
            nom: finalName.toUpperCase(),
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(finalName)}&background=007c89&color=fff&size=200`,
            age: analysis?.detected_age || 30,
            genre: analysis?.detected_genre || 'Non spécifié',
            poids: analysis?.detected_poids || '70',
            taille: analysis?.detected_taille || '175',
            experience: experienceFinale || 'Débutant',
            stressLevel: analysis?.stressLevel || 'Moyen',
            sleepQuality: analysis?.sleepQuality || 'Moyenne',
            materiel: 'Standard',
            objectifs: [],
            objectifPrincipal: analysis?.detected_objectif || 'RECONDITIONNEMENT GÉNÉRAL',
            delaiObjectif: '12 SEMAINES',
            blessures_actives: allBlessures.length > 0 ? allBlessures : [],
            details_blessures: detailsBlessuresComplet,
            raw_assessment: rawAssessment,
            historique_dates: [],
            historique_volume: [],
            sessionRecords: [],
            personalBests: {},
            exerciseTrends: {},
            activeGoal: {
                label: analysis?.detected_objectif || 'INITIALISATION',
                targetValue: 100,
                startValue: 0,
                currentValue: 0,
                unit: '%',
                deadline: '12 SEMAINES',
                isSafe: true,
                history: []
            },
            dernier_feedback_ia: analysis?.recommendations || "Nouveau sujet créé. En attente de première session."
        };
        
        // Log pour debug
        console.log('Client créé avec les informations extraites:', {
            nom: newClient.nom,
            age: newClient.age,
            genre: newClient.genre,
            poids: newClient.poids,
            taille: newClient.taille,
            experience: newClient.experience,
            blessures: newClient.blessures_actives,
            objectif: newClient.objectifPrincipal,
            faiblesses_detectees: analysis?.detected_faiblesses,
            limitations_detectees: analysis?.detected_limitations
        });

        // Génère automatiquement un programme de 24 semaines personnalisé
        setFileProcessingStage('Création du programme personnalisé...');
        setFileProcessingProgress(85);
        const program = await generateMultiWeekProgram(newClient, 24, 3);
        newClient.activeProgram = program;
        setFileProcessingProgress(95);

        console.log('Ajout du client au storage...');
        const newClientsList = StorageService.addClient(newClient);
        console.log('Liste des clients après ajout:', newClientsList.length);
        console.log('Client ajouté trouvé dans la liste:', !!newClientsList.find(c => c.id === newClient.id));
        setClients(newClientsList);
        setFileProcessingProgress(100);
        console.log('createNewClientProcess terminé avec succès');
        return newClient;

     } catch (e) {
        throw e;
     } finally {
        setIsTyping(false);
        setFileProcessingProgress(0);
        setFileProcessingStage('');
     }
  };

  const handleCreateClientSubmit = useCallback(async () => {
    if (!newClientName.trim() && !newClientFile) {
        notificationService.error("Nom ou Fichier requis.");
        return;
    }
    try {
        await createNewClientProcess(newClientName, newClientFile, newClientText);
        setCreateClientModalOpen(false);
        setNewClientName('');
        setNewClientFile(null);
        setNewClientText('');
        notificationService.success("Nouveau sujet intégré avec succès.");
    } catch(e: any) {
        // L'erreur est déjà gérée dans createNewClientProcess avec notificationService
        if (e.message !== 'Client dupliqué' && e.message !== 'Fichier trop volumineux') {
          notificationService.error("Erreur lors de la création du client.");
        }
    }
  }, [newClientName, newClientFile, newClientText]);

  const handleDashboardFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('handleDashboardFileSelect appelé', { hasApiKey, files: e.target.files });
    
    if (!hasApiKey) {
        notificationService.error("Veuillez d'abord configurer votre clé API.");
        return;
    }
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        console.log('Fichier sélectionné:', { name: file.name, size: file.size, type: file.type });
        
        // Vérifie la taille avant de commencer
        if (isFileTooLarge(file)) {
            notificationService.error(`Fichier trop volumineux (${formatFileSize(file.size)}). Veuillez utiliser un fichier de moins de 20MB.`);
            e.target.value = '';
            return;
        }
        
        console.log('Début du traitement du fichier...');
        try {
            console.log('Appel de createNewClientProcess...');
            const newClient = await createNewClientProcess('', file, '');
            console.log('Client créé avec succès:', newClient);
            console.log('ID du client:', newClient.id);
            console.log('Nom du client:', newClient.nom);
            
            // Vérifier que le client a bien été ajouté à la liste
            const updatedClients = StorageService.loadClients();
            console.log('Clients dans le storage:', updatedClients.length);
            const clientExists = updatedClients.find(c => c.id === newClient.id);
            console.log('Client trouvé dans le storage:', !!clientExists);
            
            // Mettre à jour la liste des clients dans l'état
            setClients(updatedClients);
            setProfile(newClient);
            
            console.log('Génération du workout...');
            try {
            const plan = await aiService.generateWorkout(newClient, 45, "Protocole Initial");
                console.log('Workout généré:', plan);
            setWorkout(plan);
            } catch (workoutError: any) {
                console.error("Erreur lors de la génération du workout:", workoutError);
                
                // Vérifier si c'est une erreur de quota
                const isQuotaError = workoutError?.message?.includes('quota') || 
                                    workoutError?.message?.includes('429') ||
                                    workoutError?.code === 429 ||
                                    workoutError?.message?.includes('RESOURCE_EXHAUSTED');
                
                if (isQuotaError) {
                    notificationService.error("Quota API Gemini épuisé. Le client a été créé mais le workout ne peut pas être généré pour le moment. Veuillez attendre ou vérifier votre quota API.");
                } else {
                    notificationService.warning("Client créé mais le workout n'a pas pu être généré. Vous pourrez le générer manuellement.");
                }
                // On continue sans workout - l'utilisateur pourra le générer plus tard
            }
            
            console.log('Navigation vers CLIENT_APP...');
            console.log('viewMode avant:', viewMode);
            setViewMode('CLIENT_APP');
            setStep('DAILY_CHECK');
            
            console.log('Import terminé avec succès');
            notificationService.success("Client importé avec succès.");
        } catch (err: any) {
            console.error("Erreur lors de l'import du fichier:", err);
            console.error("Type d'erreur:", typeof err);
            console.error("Message:", err?.message);
            console.error("Stack trace:", err?.stack);
            // L'erreur est déjà gérée dans createNewClientProcess avec notificationService
            if (err.message !== 'Client dupliqué' && err.message !== 'Fichier trop volumineux') {
              notificationService.error(`Erreur lors de l'import rapide: ${err.message || 'Erreur inconnue'}`);
            }
        } finally {
            e.target.value = '';
            console.log('Nettoyage terminé');
        }
    } else {
        console.log('Aucun fichier sélectionné');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasApiKey]);

  // "--- LOGIQUE MÉTIER : START & EXECUTION SÉANCE ---"

  const handleStartWorkout = useCallback(async () => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/2cfb4929-d2fb-4807-9ccf-fd780957ec5c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:700',message:'handleStartWorkout called',data:{profileExists:!!profile,profileId:profile?.id,profileName:profile?.nom,hasActiveProgram:!!profile?.activeProgram},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    if (!profile) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/2cfb4929-d2fb-4807-9ccf-fd780957ec5c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:702',message:'handleStartWorkout early return - profile is null',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      return;
    }
    
    // Si un programme actif existe, utilise la séance du programme
    if (profile?.activeProgram) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/2cfb4929-d2fb-4807-9ccf-fd780957ec5c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:705',message:'Using active program',data:{programName:profile.activeProgram?.name,currentWeek:profile.activeProgram?.currentWeek,currentSession:profile.activeProgram?.currentSession},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      const program = profile.activeProgram;
      setIsTyping(true);
      try {
        const plan = await generateProgramWorkout(profile, program, program.currentWeek, program.currentSession);
        setWorkout(plan);
        
        // En mode coach, on peut directement éditer
        if (userRole === 'COACH') {
          setIsTyping(false);
          setWorkoutEditorOpen(true);
          return;
        }
        
        setStep('WARMUP');
        setCurrentPhaseIndex(0);
        setCountdown(plan.echauffement_dynamique[0]?.duree_secondes || 10);
        setIsTimerRunning(true);
        
        // Initialise le poids suggéré pour le premier exercice
        if (plan.liste_exos.length > 0 && profile) {
          const firstExo = plan.liste_exos[0];
          const targetReps = extractReps(firstExo.reps);
          const suggestedWeight = calculateSuggestedWeight(profile, firstExo, targetReps);
          setCurrentKg(suggestedWeight);
        }
      } catch (e) {
        notificationService.error("Erreur génération séance du programme.");
      } finally {
        setIsTyping(false);
      }
      return;
    }
    
    // Si pas de programme, en crée un automatiquement de 24 semaines
    setIsTyping(true);
    try {
      // Génère un programme de 24 semaines personnalisé
      const program = await generateMultiWeekProgram(profile, 24, 3);
      const updatedProfile = { ...profile, activeProgram: program };
      const newClientsList = StorageService.updateClient(updatedProfile);
      setClients(newClientsList);
      setProfile(updatedProfile);
      
      // Génère la première séance du programme
      const plan = await generateProgramWorkout(updatedProfile, program, 1, 1);
      setWorkout(plan);
      
      // En mode coach, on peut directement éditer
      if (userRole === 'COACH') {
        setIsTyping(false);
        setWorkoutEditorOpen(true);
        return;
      }
      
      setStep('WARMUP');
      setCurrentPhaseIndex(0);
      setCountdown(plan.echauffement_dynamique[0]?.duree_secondes || 10);
      setIsTimerRunning(true);
      
      // Initialise le poids suggéré pour le premier exercice
      if (plan.liste_exos.length > 0 && updatedProfile) {
        const firstExo = plan.liste_exos[0];
        const targetReps = extractReps(firstExo.reps);
        const suggestedWeight = calculateSuggestedWeight(updatedProfile, firstExo, targetReps);
        setCurrentKg(suggestedWeight);
      }
    } catch (e) {
      notificationService.error("Erreur génération programme. Vérifiez la clé API.");
    } finally {
      setIsTyping(false);
    }
  }, [profile, userRole]);

  const handleCreateProgram = useCallback(async (name: string, duration: number, sessionsPerWeek: number) => {
    if (!profile || !name.trim()) {
      notificationService.error("Veuillez entrer un nom pour le programme.");
      return;
    }
    
    setIsTyping(true);
    try {
      const program = await generateMultiWeekProgram(profile, duration, sessionsPerWeek, name);
      const updatedProfile = { ...profile, activeProgram: program };
      const newClientsList = StorageService.updateClient(updatedProfile);
      setClients(newClientsList);
      setProfile(updatedProfile);
      setCreateProgramModalOpen(false);
      setProgramName('');
      notificationService.success(`Programme "${name}" créé avec succès !`);
    } catch (e) {
      notificationService.error("Erreur lors de la création du programme.");
    } finally {
      setIsTyping(false);
    }
  }, [profile]);

  const validateSet = useCallback(() => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/2cfb4929-d2fb-4807-9ccf-fd780957ec5c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:801',message:'validateSet called',data:{workoutExists:!!workout,profileExists:!!profile,currentExoIndex,currentSet},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    if (!workout || !profile) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/2cfb4929-d2fb-4807-9ccf-fd780957ec5c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:803',message:'validateSet early return',data:{workoutExists:!!workout,profileExists:!!profile},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      return;
    }
    const currentExo = workout.liste_exos[currentExoIndex];
    const actualReps = extractReps(currentExo.reps);
    
    // "On capture les données de la série pour l'historique"
    setSessionData(prev => [...prev, {
      name: currentExo.nom,
      volume: currentKg * actualReps,
      effortTime: countdown,
      restTime: currentExo.repos,
      weight: currentKg,
      reps: actualReps
    }]);
    
    // Met à jour le PR si nécessaire
    const previousPR = profile.personalBests[currentExo.nom];
    const updatedProfile = updatePR(profile, currentExo.nom, currentKg, actualReps);
    if (updatedProfile !== profile) {
      setProfile(updatedProfile);
      // Détecte si un PR a été battu
      const newPR = updatedProfile.personalBests[currentExo.nom];
      if (previousPR && newPR && (newPR.weight > previousPR.weight || (newPR.weight === previousPR.weight && newPR.reps > previousPR.reps))) {
        setMotivationalMessage({ type: 'pr_broken', message: `Nouveau record personnel sur ${currentExo.nom} ! 🏆` });
        setTimeout(() => setMotivationalMessage(null), 4000);
      }
      // La sauvegarde automatique se fera via le useEffect qui surveille profile
    }
    
    // Messages de motivation contextuels
    if (currentExoIndex === workout.liste_exos.length - 1 && currentSet === currentExo.sets) {
      setMotivationalMessage({ type: 'last_exercise' });
      setTimeout(() => setMotivationalMessage(null), 4000);
    } else if (currentExoIndex === Math.floor(workout.liste_exos.length / 2) && currentSet === 1) {
      setMotivationalMessage({ type: 'mid_session' });
      setTimeout(() => setMotivationalMessage(null), 4000);
    }

    if (currentSet < currentExo.sets) {
      setCurrentSet(prev => prev + 1);
      setIsResting(true);
      setCountdown(currentExo.repos);
      setIsTimerRunning(true);
    } else {
      if (currentExoIndex + 1 < workout.liste_exos.length) {
        const nextIdx = currentExoIndex + 1;
        setCurrentExoIndex(nextIdx);
        setCurrentSet(1);
        setIsResting(true);
        const nextExo = workout.liste_exos[nextIdx];
        setCountdown(nextExo.repos);
        setIsTimerRunning(true);
        
        // Calcule le poids suggéré basé sur les PR et l'historique
        const targetReps = extractReps(nextExo.reps);
        const suggestedWeight = calculateSuggestedWeight(profile, nextExo, targetReps);
        setCurrentKg(suggestedWeight);
      } else {
        setIsTimerRunning(false);
        setStep('STRETCH');
        setCurrentPhaseIndex(0);
        setCountdown(workout.etirements[0]?.duree_secondes || 30);
        setIsTimerRunning(true);
      }
    }
    setConfirmExoModal(false);
  }, [workout, profile, currentExoIndex, currentSet, currentKg, countdown, isResting]);

  const handleSwapExercise = useCallback(async () => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/2cfb4929-d2fb-4807-9ccf-fd780957ec5c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:849',message:'handleSwapExercise called',data:{workoutExists:!!workout,profileExists:!!profile,currentExoIndex},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    if (!workout || !profile) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/2cfb4929-d2fb-4807-9ccf-fd780957ec5c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:851',message:'handleSwapExercise early return',data:{workoutExists:!!workout,profileExists:!!profile},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      return;
    }
    setIsTyping(true);
    setConfirmSwapModal(false);
    try {
      const newExo = await aiService.swapExercise(profile, workout.liste_exos[currentExoIndex]);
      const newList = [...workout.liste_exos];
      newList[currentExoIndex] = newExo;
      setWorkout({ ...workout, liste_exos: newList });
      
      // Calcule le poids suggéré basé sur les PR et l'historique
      const targetReps = extractReps(newExo.reps);
      const suggestedWeight = calculateSuggestedWeight(profile, newExo, targetReps);
      setCurrentKg(suggestedWeight);
    } finally {
      setIsTyping(false);
    }
  }, [workout, profile, currentExoIndex]);

  // "--- LOGIQUE MÉTIER : ARCHIVAGE ET SAUVEGARDE ---"

  const archiveAndExit = useCallback(async () => {
    if (!profile || !workout) return;
    setIsTyping(true);
    try {
      let progressResult;
      
      // "Bloc Try-Catch spécifique pour l'analyse IA afin que la sauvegarde ne soit pas bloquée si l'IA plante"
      try {
        progressResult = await aiService.analyzeGoalProgress(profile, sessionData);
      } catch (e) {
        console.warn("Erreur analyse IA progress:", e);
        // "Fallback manuel si l'IA échoue"
        progressResult = {
            progressIncrement: 1,
            isOnTrack: true,
            adjustmentAdvice: "Session enregistrée (Mode Dégradé - Analyse IA indisponible).",
            currentEstimatedCompletion: Math.min((profile.activeGoal?.currentValue || 0) + 1, 100)
        };
      }
      
      const tonnage = sessionData.reduce((acc, curr) => acc + curr.volume, 0);
      const date = new Date().toLocaleDateString('fr-FR');
      const today = new Date().toISOString().split('T')[0];
      
      // Met à jour le programme si actif
      let updatedProgram = profile?.activeProgram;
      if (updatedProgram) {
        updatedProgram = markSessionCompleted(updatedProgram, updatedProgram.currentWeek, updatedProgram.currentSession);
      }
      
      // Calcule les streaks (jours consécutifs avec séance)
      const lastSessionDate = profile.sessionRecords && profile.sessionRecords.length > 0
        ? new Date(profile.sessionRecords[profile.sessionRecords.length - 1].date).toISOString().split('T')[0]
        : null;
      
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      let currentStreak = profile.currentStreak || 0;
      let longestStreak = profile.longestStreak || 0;
      
      if (lastSessionDate === yesterdayStr || lastSessionDate === today) {
        // Continue le streak
        currentStreak = (profile.currentStreak || 0) + 1;
      } else {
        // Nouveau streak
        currentStreak = 1;
      }
      
      if (currentStreak > longestStreak) {
        longestStreak = currentStreak;
        setMotivationalMessage({ type: 'streak', message: `Nouveau record de série : ${currentStreak} jours ! ⚡` });
        setTimeout(() => setMotivationalMessage(null), 4000);
      }
      
      // Crée un profil temporaire pour vérifier les achievements
      const tempProfile: UserProfile = {
        ...profile,
        sessionRecords: [...(profile.sessionRecords || []), {
          date: new Date().toISOString(),
          exercices: workout.liste_exos,
          tonnage,
          mood: progressResult.isOnTrack ? 'En progression' : 'Ajustement requis',
          debrief: aiFeedback + "\n" + progressResult.adjustmentAdvice
        }],
        currentStreak,
        longestStreak
      };
      
      // Vérifie et débloque les achievements
      const newAchievementsUnlocked = checkAchievements(tempProfile, sessionData);
      if (newAchievementsUnlocked.length > 0) {
        setNewAchievements(newAchievementsUnlocked);
      }
      
      // Supprimer la session planifiée si elle existe (synchronisation avec calendrier)
      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);
      const remainingPlannedSessions = (profile.plannedSessions || []).filter(ps => {
        const psDate = new Date(ps.date);
        psDate.setHours(0, 0, 0, 0);
        // Garder les sessions planifiées qui ne sont pas pour aujourd'hui
        return psDate.getTime() !== todayDate.getTime();
      });

      const updatedProfile: UserProfile = {
        ...profile,
        // "Utilisation de || [] pour sécuriser les anciens profils qui n'auraient pas ces champs"
        historique_dates: [...(profile.historique_dates || []), date],
        historique_volume: [...(profile.historique_volume || []), tonnage],
        dernier_feedback_ia: progressResult.adjustmentAdvice,
        activeGoal: profile.activeGoal ? {
          ...profile.activeGoal,
          currentValue: progressResult.currentEstimatedCompletion,
          history: [...(profile.activeGoal?.history || []), { date, value: progressResult.currentEstimatedCompletion }]
        } : {
          currentValue: progressResult.currentEstimatedCompletion,
          history: [{ date, value: progressResult.currentEstimatedCompletion }]
        },
        sessionRecords: [...(profile.sessionRecords || []), {
          date: new Date().toISOString(),
          exercices: workout.liste_exos,
          tonnage,
          mood: progressResult.isOnTrack ? 'En progression' : 'Ajustement requis',
          debrief: aiFeedback + "\n" + progressResult.adjustmentAdvice
        }],
        plannedSessions: remainingPlannedSessions, // Supprime la session planifiée d'aujourd'hui
        activeProgram: updatedProgram,
        achievements: [...(profile.achievements || []), ...newAchievementsUnlocked],
        currentStreak,
        longestStreak
      };

      // "Sauvegarde Persistante"
      const newList = StorageService.updateClient(updatedProfile);
      setClients(newList);
      setProfile(updatedProfile);
      
      // Afficher le modal d'évaluation pour les clients
      if (userRole === 'CLIENT') {
        setSessionRatingModalOpen(true);
      }
      
      setStep('FINAL');
    } catch (e) {
      console.error(e);
      notificationService.error("Erreur critique lors de la sauvegarde de la session.");
    } finally {
      setIsTyping(false);
    }
  }, [profile, workout, sessionData, aiFeedback]);

  const currentWarmupPhase = useMemo(() => {
    if (step !== 'WARMUP' || !workout) return null;
    const combined = [...workout.echauffement_dynamique, ...workout.etirements_dynamiques];
    return combined[currentPhaseIndex];
  }, [step, workout, currentPhaseIndex]);

  // Mémoriser les données des graphiques pour éviter les recalculs
  const chartData = useMemo(() => {
    if (!profile) return { volumeData: [], goalData: [] };
    const volumeData = (profile.historique_dates || []).map((d, i) => ({ 
      date: d, 
      v: (profile.historique_volume || [])[i] || 0 
    }));
    const goalData = profile.activeGoal?.history || [];
    return { volumeData, goalData };
  }, [profile?.historique_dates, profile?.historique_volume, profile?.activeGoal?.history]);

  // Mémoriser les calculs de statistiques
  const dashboardStats = useMemo(() => {
    if (!profile) return { sessionCount: 0, maxVolume: 0, goalProgress: 0 };
    const sessionCount = (profile.sessionRecords || []).length;
    const maxVolume = (profile.historique_volume || []).length > 0 
      ? Math.max(...profile.historique_volume) 
      : 0;
    const goalProgress = profile.activeGoal?.currentValue || 0;
    return { sessionCount, maxVolume, goalProgress };
  }, [profile?.sessionRecords, profile?.historique_volume, profile?.activeGoal?.currentValue]);

  // Calculer le temps estimé d'un workout
  const calculateEstimatedWorkoutTime = useCallback((workout: WorkoutPlan | null): number => {
    if (!workout) return 0;
    
    // Temps d'échauffement
    const warmupTime = workout.echauffement_dynamique.reduce((sum, ex) => sum + ex.duree_secondes, 0) +
                       workout.etirements_dynamiques.reduce((sum, ex) => sum + ex.duree_secondes, 0);
    
    // Temps d'exercices (estimation : 60s par série + temps de repos)
    const exerciseTime = workout.liste_exos.reduce((sum, ex) => {
      const setsTime = ex.sets * 60; // 60 secondes par série (effort)
      const restTime = (ex.sets - 1) * ex.repos; // Repos entre séries
      return sum + setsTime + restTime;
    }, 0);
    
    // Temps d'étirements
    const stretchTime = workout.etirements.reduce((sum, ex) => sum + ex.duree_secondes, 0);
    
    return Math.round((warmupTime + exerciseTime + stretchTime) / 60); // Retourne en minutes
  }, []);

  // Mémoriser le calcul de progression du programme
  const programProgress = useMemo(() => {
    if (!profile?.activeProgram) return 0;
    const { currentWeek, currentSession, duration, sessionsPerWeek } = profile.activeProgram;
    if (!currentWeek || !currentSession || !duration || !sessionsPerWeek) return 0;
    return ((currentWeek - 1) * sessionsPerWeek + currentSession) / (duration * sessionsPerWeek) * 100;
  }, [profile?.activeProgram?.currentWeek, profile?.activeProgram?.currentSession, profile?.activeProgram?.duration, profile?.activeProgram?.sessionsPerWeek]);

  // Filtrage et tri des clients pour le dashboard coach
  const filteredAndSortedClients = useMemo(() => {
    let filtered = [...clients];

    // Filtre par recherche (nom)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(client => 
        client.nom.toLowerCase().includes(query) ||
        (client.objectifPrincipal && client.objectifPrincipal.toLowerCase().includes(query))
      );
    }

    // Filtre par objectif
    if (filterObjective !== 'all') {
      filtered = filtered.filter(client => 
        client.objectifPrincipal === filterObjective
      );
    }

    // Filtre par statut (actif/inactif)
    if (filterStatus !== 'all') {
      filtered = filtered.filter(client => {
        const hasRecentSession = client.sessionRecords && client.sessionRecords.length > 0;
        const lastSessionDate = hasRecentSession 
          ? new Date(client.sessionRecords[client.sessionRecords.length - 1].date)
          : null;
        const daysSinceLastSession = lastSessionDate 
          ? Math.floor((Date.now() - lastSessionDate.getTime()) / (1000 * 60 * 60 * 24))
          : Infinity;
        
        if (filterStatus === 'active') {
          return daysSinceLastSession <= 30 && (client.activeProgram || hasRecentSession);
        } else {
          return daysSinceLastSession > 30 || (!client.activeProgram && !hasRecentSession);
        }
      });
    }

    // Filtre par tag
    if (filterTag !== 'all') {
      filtered = filtered.filter(client => 
        client.tags && client.tags.includes(filterTag)
      );
    }

    // Tri
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.nom.localeCompare(b.nom);
        case 'lastSession':
          const aLastSession = a.sessionRecords && a.sessionRecords.length > 0
            ? new Date(a.sessionRecords[a.sessionRecords.length - 1].date).getTime()
            : 0;
          const bLastSession = b.sessionRecords && b.sessionRecords.length > 0
            ? new Date(b.sessionRecords[b.sessionRecords.length - 1].date).getTime()
            : 0;
          return bLastSession - aLastSession;
        case 'progress':
          const aProgress = a.activeGoal?.currentValue || 0;
          const bProgress = b.activeGoal?.currentValue || 0;
          return bProgress - aProgress;
        case 'created':
          // Utiliser l'ID comme proxy pour la date de création (plus ancien = ID plus petit)
          return a.id.localeCompare(b.id);
        default:
          return 0;
      }
    });

    return filtered;
  }, [clients, searchQuery, filterObjective, filterStatus, filterTag, sortBy]);

  // Liste des objectifs uniques pour le filtre
  const uniqueObjectives = useMemo(() => {
    const objectives = new Set<string>();
    clients.forEach(client => {
      if (client.objectifPrincipal) {
        objectives.add(client.objectifPrincipal);
      }
    });
    return Array.from(objectives).sort();
  }, [clients]);

  // Liste des tags uniques pour le filtre
  const uniqueTags = useMemo(() => {
    const tags = new Set<string>();
    clients.forEach(client => {
      if (client.tags && client.tags.length > 0) {
        client.tags.forEach(tag => tags.add(tag));
      }
    });
    return Array.from(tags).sort();
  }, [clients]);

  // Gestion de la bibliothèque d'exercices
  const handleBodyPartClick = useCallback((bodyPart: string) => {
    const muscleNames = BODY_PART_TO_MUSCLES[bodyPart] || [];
    if (muscleNames.length === 0) {
      notificationService.warning(`Aucun exercice trouvé pour ${bodyPart}`);
      return;
    }
    
    // Filtrer les exercices qui ciblent au moins un des muscles de cette partie du corps
    const exercises = EXERCISE_DB.filter(exercise => 
      exercise.target.some(targetMuscle => 
        muscleNames.some(muscle => 
          targetMuscle.toLowerCase().includes(muscle.toLowerCase()) ||
          muscle.toLowerCase().includes(targetMuscle.toLowerCase())
        )
      )
    );
    
    if (exercises.length === 0) {
      notificationService.warning(`Aucun exercice trouvé pour ${bodyPart}`);
      return;
    }
    
    setFilteredExercises(exercises);
    setSelectedMuscleGroup(bodyPart);
    setExerciseLibraryModalOpen(true);
  }, []);

  // Duplication de client
  const handleDuplicateClient = useCallback((client: UserProfile) => {
    const duplicatedClient: UserProfile = {
      ...client,
      id: `client_${Date.now()}`,
      nom: `${client.nom} (COPIE)`,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(client.nom + ' COPIE')}&background=FFD700&color=000&size=200`,
      historique_dates: [],
      historique_volume: [],
      sessionRecords: [],
      personalBests: {},
      exerciseTrends: {},
      activeGoal: client.activeGoal ? {
        ...client.activeGoal,
        currentValue: 0,
        history: []
      } : undefined,
      activeProgram: undefined, // Ne pas dupliquer le programme actif
      dernier_feedback_ia: "Client dupliqué. Nouveau profil initialisé."
    };

    const newClientsList = StorageService.addClient(duplicatedClient);
    setClients(newClientsList);
    notificationService.success(`Client "${client.nom}" dupliqué avec succès`);
  }, []);

  // IMPORTANT: Tous les hooks doivent être définis AVANT les returns conditionnels
  const handleSaveEditedWorkout = useCallback((editedWorkout: WorkoutPlan) => {
    if (!profile) return;
    setWorkout(editedWorkout);
    
    // Si c'est un programme actif, met à jour le workout dans le programme
    if (profile.activeProgram) {
      const program = profile.activeProgram;
      const week = program.weeks?.find(w => w.weekNumber === program.currentWeek);
      const session = week?.sessions?.find(s => s.sessionNumber === program.currentSession);
      if (session) {
        session.workoutPlan = editedWorkout;
        const updatedProfile = { ...profile, activeProgram: program };
        const newClientsList = StorageService.updateClient(updatedProfile);
        setClients(newClientsList);
        setProfile(updatedProfile);
      }
    }
    
    setWorkoutEditorOpen(false);
    notificationService.success("Protocole modifié et sauvegardé. Le client verra la version mise à jour.");
  }, [profile]);

  // "--- RENDERERS (AFFICHAGE) ---"

  if (viewMode === 'LOGIN') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#F0F9FF] via-white to-[#FFFBF0] p-6">
        <div className="w-full max-w-md text-center space-y-8">
          <div className="space-y-3">
            <h1 className="logo-hygie text-5xl md:text-6xl bg-gradient-to-r from-[#1F2937] to-[#4B5563] bg-clip-text text-transparent">HYGIE</h1>
            <p className="tagline text-sm md:text-base text-[#6B7280]">SPORT. SANTÉ. PERFORMANCE.</p>
          </div>
          <div className="space-y-4 pt-8">
             <button 
               onClick={() => handleLogin('COACH')} 
               className="btn-blue w-full text-base font-semibold"
             >
               Accès Modérateur
             </button>
             <button 
               onClick={() => handleLogin('CLIENT')} 
               className="btn-yellow w-full text-base font-semibold"
             >
               Espace Client
             </button>
          </div>
        </div>
      </div>
    );
  }

  if (viewMode === 'CLIENT_LOGIN') {
    return (
      <div className="h-[100dvh] flex flex-col items-center justify-center bg-gradient-to-br from-[#F0F9FF] via-white to-[#FFFBF0] p-6 relative overflow-y-auto custom-scrollbar">
        <div className="z-10 w-full max-w-4xl space-y-8 animate-fadeIn my-auto">
          <div className="text-center mb-10">
             <h2 className="font-bebas text-4xl md:text-6xl tracking-widest text-[#1F2937] leading-none mb-4">Identification Requise</h2>
             <p className="text-sm font-medium text-[#6B7280] tracking-wide">Sélectionnez votre profil</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {clients.map((client) => (
                <ClientCard 
                  key={client.id} 
                  client={client} 
                  onSelect={selectProfileAndStart} 
                  mode="DAILY_CHECK"
                />
             ))}
          </div>
          <button onClick={() => setViewMode('LOGIN')} className="block mx-auto px-6 py-3 text-sm font-semibold text-[#6B7280] hover:text-[#1F2937] transition-all">← Retour</button>
        </div>
      </div>
    );
  }

  if (viewMode === 'COACH_DASHBOARD') {
      return (
          <div className="h-[100dvh] flex flex-col bg-[#f3efe5] overflow-hidden">
             {/* LOADER IA GLOBAL - Pour l'import de fichiers */}
             {isTyping && (
               <div className="fixed inset-0 z-[1000] bg-[#181818]/95 flex flex-col items-center justify-center backdrop-blur-md">
                  <div className="w-16 h-16 border-4 border-[#007c89] border-t-transparent rounded-full animate-spin mb-6" />
                  <p className="font-bebas text-2xl text-white tracking-[0.5em] animate-pulse mb-4">
                    {fileProcessingStage || 'TRAITEMENT EN COURS...'}
                  </p>
                  {fileProcessingProgress > 0 && (
                    <div className="w-64 max-w-xs">
                      <div className="w-full bg-[#181818] rounded-full h-2 mb-2">
                        <div 
                          className="bg-[#007c89] h-2 rounded-full transition-all duration-300"
                          style={{ width: `${fileProcessingProgress}%` }}
                        />
                </div>
                      <p className="text-xs font-mono text-gray-400 text-center">{fileProcessingProgress}%</p>
                    </div>
                  )}
               </div>
             )}
             
             <header className="h-16 shrink-0 border-b border-[#007c89]/20 flex items-center justify-between px-6 bg-white/80 backdrop-blur-xl z-50 shadow-sm">
                <h1 className="font-bebas text-xl tracking-[0.2em] text-[#007c89]">HYGIE MODÉRATEUR</h1>
                
                {/* Navigation par onglets - Style Hygie */}
                <div className="flex gap-1 items-center bg-[#f3efe5] rounded-lg p-1 shadow-sm border border-[#007c89]/10">
                   <button
                      onClick={() => setModeratorView('clients')}
                      className={`px-4 py-2 text-sm font-semibold rounded-md transition-all duration-200 font-montserrat ${
                        moderatorView === 'clients'
                          ? 'bg-[#007c89] text-white shadow-md'
                          : 'text-[#181818] hover:bg-[#007c89]/10'
                      }`}
                   >
                      Clients
                   </button>
                   <button
                      onClick={() => setModeratorView('calendar')}
                      className={`px-4 py-2 text-sm font-semibold rounded-md transition-all duration-200 font-montserrat ${
                        moderatorView === 'calendar'
                          ? 'bg-[#007c89] text-white shadow-md'
                          : 'text-[#181818] hover:bg-[#007c89]/10'
                      }`}
                   >
                      Calendrier
                   </button>
                   <button
                      onClick={() => setModeratorView('analytics')}
                      className={`px-4 py-2 text-sm font-semibold rounded-md transition-all duration-200 font-montserrat ${
                        moderatorView === 'analytics'
                          ? 'bg-[#007c89] text-white shadow-md'
                          : 'text-[#181818] hover:bg-[#007c89]/10'
                      }`}
                   >
                      Stats
                   </button>
                   <button
                      onClick={() => setModeratorView('exercises')}
                      className={`px-4 py-2 text-sm font-semibold rounded-md transition-all duration-200 font-montserrat ${
                        moderatorView === 'exercises'
                          ? 'bg-[#007c89] text-white shadow-md'
                          : 'text-[#181818] hover:bg-[#007c89]/10'
                      }`}
                   >
                      Exercices
                   </button>
                   <button
                      onClick={() => setModeratorView('import')}
                      className={`px-4 py-2 text-sm font-semibold rounded-md transition-all duration-200 font-montserrat ${
                        moderatorView === 'import'
                          ? 'bg-[#007c89] text-white shadow-md'
                          : 'text-[#181818] hover:bg-[#007c89]/10'
                      }`}
                   >
                      Import
                   </button>
                </div>

                <div className="flex gap-2 items-center">
                   <button 
                      onClick={() => DataExportService.exportToJSON(clients, selectedClients.size > 0 ? selectedClients : undefined)}
                      className="px-4 py-2 text-xs font-semibold text-[#007c89] bg-white border border-[#007c89]/30 hover:bg-[#007c89] hover:text-white rounded-md transition-all duration-200 shadow-sm hover:shadow-md"
                      title="Exporter en JSON"
                   >
                      JSON
                   </button>
                   <button 
                      onClick={() => DataExportService.exportToCSV(clients, selectedClients.size > 0 ? selectedClients : undefined)}
                      className="px-4 py-2 text-xs font-semibold text-[#007c89] bg-white border border-[#007c89]/30 hover:bg-[#007c89] hover:text-white rounded-md transition-all duration-200 shadow-sm hover:shadow-md"
                      title="Exporter en CSV"
                   >
                      CSV
                   </button>
                   <button 
                      onClick={() => importFileInputRef.current?.click()}
                      className="px-4 py-2 text-xs font-semibold text-white bg-[#007c89] hover:bg-[#006a75] rounded-md transition-all duration-200 shadow-sm hover:shadow-md"
                      title="Importer depuis JSON"
                   >
                      Import
                   </button>
                   <input 
                      type="file" 
                      ref={importFileInputRef} 
                      className="hidden" 
                      accept=".json" 
                      onChange={async (e) => {
                        if (e.target.files && e.target.files[0]) {
                          try {
                            const importedClients = await DataExportService.importFromJSON(e.target.files[0]);
                            const newClients = [...clients, ...importedClients];
                            setClients(newClients);
                            StorageService.saveClients(newClients);
                          } catch (error) {
                            // Erreur déjà gérée dans le service
                          }
                          e.target.value = '';
                        }
                      }}
                   />
                    <div className="w-px h-6 bg-[#007c89]/20 mx-1"></div>
                    <button onClick={handleClearAllClients} className="px-4 py-2 text-xs font-semibold text-white bg-[#EF4444] hover:bg-[#DC2626] rounded-md transition-all duration-200 shadow-sm hover:shadow-md">Supprimer</button>
                    <button onClick={() => setViewMode('LOGIN')} className="px-4 py-2 text-xs font-semibold text-[#181818] hover:text-[#007c89] transition-all duration-200">Déconnexion</button>
                </div>
             </header>

             <main className="flex-1 overflow-y-auto custom-scrollbar p-6 relative z-10 bg-[#f3efe5]">
                <div className="w-full max-w-7xl mx-auto space-y-6 animate-fadeIn">
                   {/* VUE CLIENTS */}
                   {moderatorView === 'clients' && (
                      <>
                         {/* Barre de recherche et filtres - Style Hygie */}
                         <div className="p-6 rounded-lg bg-white border border-[#007c89]/20 shadow-md space-y-4">
                      {/* Barre de recherche - Style Hygie */}
                      <div className="flex gap-3 items-center">
                         <div className="flex-1 relative">
                            <input
                               type="text"
                               value={searchQuery}
                               onChange={(e) => setSearchQuery(e.target.value)}
                               placeholder="Rechercher un client..."
                               className="w-full bg-white border border-[#007c89]/30 rounded-md px-4 py-3 pl-11 text-sm text-[#181818] placeholder:text-[#6B7280] focus:border-[#007c89] focus:outline-none focus:ring-2 focus:ring-[#007c89]/20 transition-all"
                            />
                            <span className="absolute left-4 top-3.5 text-[#007c89] text-lg">🔍</span>
                         </div>
                         {(searchQuery || filterObjective !== 'all' || filterStatus !== 'all' || filterTag !== 'all') && (
                            <button
                               onClick={() => {
                                  setSearchQuery('');
                                  setFilterObjective('all');
                                  setFilterStatus('all');
                                  setFilterTag('all');
                                  setSortBy('name');
                               }}
                               className="px-5 py-3 bg-[#007c89] text-white rounded-md text-sm font-semibold hover:bg-[#006a75] transition-all shadow-sm hover:shadow-md"
                            >
                               Réinitialiser
                            </button>
                         )}
                   </div>

                      {/* Filtres et tri - Style moderne */}
                      <div className="flex flex-wrap gap-3 items-center">
                         {/* Filtre par objectif */}
                         <select
                            value={filterObjective}
                            onChange={(e) => setFilterObjective(e.target.value)}
                            className="bg-white border border-[#007c89]/30 rounded-md px-3 py-2 text-sm text-[#181818] focus:border-[#007c89] focus:outline-none focus:ring-2 focus:ring-[#007c89]/20 transition-all"
                         >
                            <option value="all">Tous les objectifs</option>
                            {uniqueObjectives.map(obj => (
                               <option key={obj} value={obj}>{obj}</option>
                            ))}
                         </select>

                         {/* Filtre par statut */}
                         <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
                            className="bg-white border border-[#007c89]/30 rounded-md px-3 py-2 text-sm text-[#181818] focus:border-[#007c89] focus:outline-none focus:ring-2 focus:ring-[#007c89]/20 transition-all"
                         >
                            <option value="all">Tous les statuts</option>
                            <option value="active">Actifs</option>
                            <option value="inactive">Inactifs</option>
                         </select>

                         {/* Filtre par tag */}
                         {uniqueTags.length > 0 && (
                            <select
                               value={filterTag}
                               onChange={(e) => setFilterTag(e.target.value)}
                               className="bg-white border border-[#007c89]/30 rounded-md px-3 py-2 text-sm text-[#181818] focus:border-[#007c89] focus:outline-none focus:ring-2 focus:ring-[#007c89]/20 transition-all"
                            >
                               <option value="all">Tous les tags</option>
                               {uniqueTags.map(tag => (
                                  <option key={tag} value={tag}>{tag}</option>
                               ))}
                            </select>
                         )}

                         {/* Tri */}
                         <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as 'name' | 'lastSession' | 'progress' | 'created')}
                            className="bg-white border border-[#007c89]/30 rounded-md px-3 py-2 text-sm text-[#181818] focus:border-[#007c89] focus:outline-none focus:ring-2 focus:ring-[#007c89]/20 transition-all"
                         >
                            <option value="name">Nom</option>
                            <option value="lastSession">Dernière session</option>
                            <option value="progress">Progression</option>
                            <option value="created">Date de création</option>
                         </select>

                         {/* Compteur de résultats */}
                         <div className="ml-auto px-3 py-2 bg-[#e0f4f6] rounded-md border border-[#007c89]/20">
                            <span className="text-sm font-medium text-[#181818]">
                               <span className="text-[#007c89] font-semibold">{filteredAndSortedClients.length}</span>
                               <span className="text-[#6B7280] mx-1">/</span>
                               <span>{clients.length}</span>
                            </span>
                            </div>
                         </div>

                      {/* Actions en lot - Style Hygie */}
                      {selectedClients.size > 0 && (
                         <div className="flex items-center gap-2 pt-3 border-t border-[#007c89]/20">
                            <span className="text-xs font-semibold text-[#007c89] px-3 py-1.5 bg-[#e0f4f6] rounded-md border border-[#007c89]/30">
                               {selectedClients.size} sélectionné{selectedClients.size > 1 ? 's' : ''}
                            </span>
                            <button
                               onClick={() => DataExportService.exportToJSON(clients, selectedClients)}
                               className="px-3 py-1.5 bg-white text-[#007c89] border border-[#007c89]/30 rounded-md text-xs font-semibold hover:bg-[#007c89] hover:text-white transition-all"
                            >
                               Exporter
                            </button>
                            <button
                               onClick={() => {
                                  if (window.confirm(`Supprimer ${selectedClients.size} client(s) ?`)) {
                                     const newClients = clients.filter(c => !selectedClients.has(c.id));
                                     setClients(newClients);
                                     StorageService.saveClients(newClients);
                                     setSelectedClients(new Set());
                                     notificationService.success(`${selectedClients.size} client(s) supprimé(s)`);
                                  }
                               }}
                               className="px-3 py-1.5 bg-[#EF4444] text-white rounded-md text-xs font-semibold hover:bg-[#DC2626] transition-all"
                            >
                               Supprimer
                            </button>
                            <button
                               onClick={() => setSelectedClients(new Set())}
                               className="px-3 py-1.5 bg-white text-[#181818] border border-[#007c89]/30 rounded-md text-xs font-semibold hover:bg-[#f3efe5] transition-all"
                            >
                               Annuler
                            </button>
                         </div>
                      )}
                      </div>

                         {/* Statistiques globales et Alertes - Style Hygie */}
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Statistiques - Cards style Hygie */}
                            <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
                               <div className="p-5 rounded-lg bg-white border border-[#007c89]/30 shadow-md">
                                  <div className="text-xs font-semibold text-[#007c89] uppercase mb-2 tracking-wider">Clients</div>
                                  <div className="font-bebas text-3xl text-[#181818]">{clients.length}</div>
                               </div>
                               <div className="p-5 rounded-lg bg-white border border-[#007c89]/30 shadow-md">
                                  <div className="text-xs font-semibold text-[#007c89] uppercase mb-2 tracking-wider">Sessions</div>
                                  <div className="font-bebas text-3xl text-[#181818]">
                                     {clients.reduce((sum, c) => sum + (c.sessionRecords?.length || 0), 0)}
                                  </div>
                               </div>
                               <div className="p-5 rounded-lg bg-[#007c89] border border-[#007c89] shadow-md">
                                  <div className="text-xs font-semibold text-white uppercase mb-2 tracking-wider">Actifs</div>
                                  <div className="font-bebas text-3xl text-white">
                                     {clients.filter(c => {
                                        const hasRecentSession = c.sessionRecords && c.sessionRecords.length > 0;
                                        const lastSessionDate = hasRecentSession 
                                          ? new Date(c.sessionRecords[c.sessionRecords.length - 1].date)
                                          : null;
                                        const daysSinceLastSession = lastSessionDate 
                                          ? Math.floor((Date.now() - lastSessionDate.getTime()) / (1000 * 60 * 60 * 24))
                                          : Infinity;
                                        return daysSinceLastSession <= 30 && (c.activeProgram || hasRecentSession);
                                     }).length}
                                  </div>
                               </div>
                               <div className="p-5 rounded-lg bg-white border border-[#EF4444]/30 shadow-md">
                                  <div className="text-xs font-semibold text-[#EF4444] uppercase mb-2 tracking-wider">Alertes</div>
                                  <div className="font-bebas text-3xl text-[#EF4444]">
                                     {clients.filter(c => 
                                        (c.lastPainReport && c.lastPainReport.intensity >= 5) ||
                                        (c.sleepQuality === 'Mauvaise') ||
                                        (c.blessures_actives && c.blessures_actives.length > 0)
                                     ).length}
                                  </div>
                               </div>
                            </div>

                            {/* Panneau d'alertes */}
                            <div className="md:col-span-1">
                               <CoachAlertsPanel
                                  clients={clients}
                                  onClientClick={(client) => {
                                     setQuickViewClient(client);
                                  }}
                               />
                            </div>
                         </div>

                         {/* Liste des Clients - Style Hygie */}
                         {filteredAndSortedClients.length === 0 ? (
                            <div className="p-12 rounded-lg bg-white border border-[#007c89]/20 text-center shadow-md">
                               <p className="text-[#181818] font-bebas text-xl mb-2">Aucun client trouvé</p>
                               <p className="text-[#6B7280] text-sm font-medium">Modifiez vos filtres de recherche</p>
                            </div>
                         ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                               {filteredAndSortedClients.map(client => (
                                  <CoachClientCard
                                    key={client.id}
                                    client={client}
                                    onSelect={selectProfileAndStart}
                                    onAssessment={(c) => {
                                      setSelectedClientForAssessment(c);
                                      setAssessmentModalOpen(true);
                                    }}
                                    onEdit={(c) => {
                                      setSelectedClientForEdit(c);
                                      setEditClientModalOpen(true);
                                    }}
                                    onQuickView={(c) => {
                                      setQuickViewClient(c);
                                    }}
                                    onDuplicate={handleDuplicateClient}
                                    isSelected={selectedClients.has(client.id)}
                                    onToggleSelect={(id) => {
                                      const newSelected = new Set(selectedClients);
                                      if (newSelected.has(id)) {
                                        newSelected.delete(id);
                                      } else {
                                        newSelected.add(id);
                                      }
                                      setSelectedClients(newSelected);
                                    }}
                                  />
                   ))}
                </div>
                         )}
                      </>
                   )}

                   {/* VUE CALENDRIER */}
                   {moderatorView === 'calendar' && (
                      <>
                         <CoachCalendarView
                            clients={clients}
                            groups={[]}
                            onClientClick={(client) => {
                              setQuickViewClient(client);
                            }}
                            onDayClick={(date) => {
                              setSelectedCalendarDate(date);
                              setPlanSessionModalOpen(true);
                            }}
                            onUpdateClients={(updatedClients) => {
                              setClients(updatedClients);
                              StorageService.saveClients(updatedClients);
                            }}
                         />
                         <PlanSessionModal
                            isOpen={planSessionModalOpen}
                            onClose={() => {
                              setPlanSessionModalOpen(false);
                              setSelectedCalendarDate(null);
                            }}
                            selectedDate={selectedCalendarDate}
                            clients={clients}
                            onUpdate={(updatedClients) => {
                              setClients(updatedClients);
                              StorageService.saveClients(updatedClients);
                            }}
                         />
                      </>
                   )}

                   {/* VUE STATISTIQUES */}
                   {moderatorView === 'analytics' && (
                      <CoachAnalytics clients={clients} />
                   )}

                   {/* VUE EXERCICES */}
                   {moderatorView === 'exercises' && (
                      <div className="p-6 rounded-lg bg-white border border-[#007c89]/20 shadow-md flex flex-col items-center justify-center gap-4 min-h-[600px] group relative overflow-visible">
                         <h3 className="font-bebas text-xl text-[#007c89] mb-1">Bibliothèque d'Exercices</h3>
                         <p className="text-xs text-[#6B7280] uppercase text-center mb-2">Cliquez sur une partie du corps</p>
                         <div className="flex-1 w-full flex items-center justify-center">
                           <HumanBodySVG onBodyPartClick={handleBodyPartClick} />
                        </div>
                      </div>
                   )}

                   {/* VUE IMPORT */}
                   {moderatorView === 'import' && (
                      <div className="space-y-4">
                         <div 
                            onClick={() => dashboardFileInputRef.current?.click()} 
                            className="p-12 rounded-lg bg-white border-2 border-dashed border-[#007c89]/30 hover:border-[#007c89] cursor-pointer flex flex-col items-center justify-center gap-4 min-h-[300px] group relative overflow-hidden transition-all duration-300 shadow-md"
                         >
                            <input type="file" ref={dashboardFileInputRef} className="hidden" accept="image/*,.pdf" onChange={handleDashboardFileSelect} />
                            <div className="text-5xl text-[#007c89] group-hover:text-[#006a75] transition-colors">⇪</div>
                            <h3 className="font-bebas text-2xl text-[#181818] group-hover:text-[#007c89] transition-colors">Import Rapide</h3>
                            <p className="text-sm text-[#6B7280] uppercase text-center">Glisser un fichier ou cliquer</p>
                            <button 
                               onClick={(e) => { e.stopPropagation(); setCreateClientModalOpen(true); }} 
                               className="absolute bottom-6 text-xs font-semibold text-[#007c89] hover:text-[#006a75] uppercase transition-colors"
                            >
                               Ou création manuelle
                            </button>
                         </div>
                         
                         <div className="p-5 rounded-lg bg-white border border-[#007c89]/20 shadow-md">
                            <h3 className="font-bebas text-lg text-[#181818] mb-3">Import depuis JSON</h3>
                            <button 
                               onClick={() => importFileInputRef.current?.click()}
                               className="w-full px-6 py-3 bg-[#007c89] text-white rounded-md text-sm font-semibold uppercase hover:bg-[#006a75] transition-all shadow-sm hover:shadow-md"
                            >
                               📤 Sélectionner un fichier JSON
                            </button>
                    </div>
                 </div>
             )}
          </div>
             </main>

             {/* Modale Création Manuelle (Coach) */}
             {createClientModalOpen && (
               <Suspense fallback={<div className="fixed inset-0 z-[1000] bg-black/95 flex items-center justify-center"><div className="w-16 h-16 border-4 border-[var(--primary-teal)] border-t-transparent rounded-full animate-spin" /></div>}>
                 <CreateClientModal
                   isOpen={createClientModalOpen}
                   onClose={() => {
                     setCreateClientModalOpen(false);
                     setNewClientName('');
                     setNewClientFile(null);
                     setNewClientText('');
                   }}
                   onSubmit={handleCreateClientSubmit}
                   isProcessing={isTyping}
                 />
               </Suspense>
             )}

             {/* Modale Bibliothèque d'Exercices */}
             <ExerciseLibraryModal
               isOpen={exerciseLibraryModalOpen}
               onClose={() => {
                 setExerciseLibraryModalOpen(false);
                 setSelectedMuscleGroup('');
                 setFilteredExercises([]);
               }}
               exercises={filteredExercises}
               muscleGroup={selectedMuscleGroup}
             />

             {/* Modale Édition Client */}
             <EditClientModal
               isOpen={editClientModalOpen}
               onClose={() => {
                 setEditClientModalOpen(false);
                 setSelectedClientForEdit(null);
               }}
               client={selectedClientForEdit}
               onUpdate={(updatedClient) => {
                 const updatedClients = StorageService.updateClient(updatedClient);
                 setClients(updatedClients);
                 if (profile?.id === updatedClient.id) {
                   setProfile(updatedClient);
                 }
               }}
             />

             {/* Modale Vue Rapide Client */}
             <ClientQuickViewModal
               isOpen={!!quickViewClient}
               onClose={() => setQuickViewClient(null)}
               client={quickViewClient}
             />
          </div>
      );
  }

  return (
    <CoachClientView userRole={userRole}>
      <div className="h-[100dvh] flex flex-col bg-gradient-to-br from-[#F0F9FF] via-white to-[#FFFBF0] relative overflow-hidden">
      {(step === 'WARMUP' || step === 'WORKOUT') && <PerformanceBackground />}
      {(step === 'WARMUP' || step === 'WORKOUT' || step === 'STRETCH') && <ProgressBar current={step === 'WARMUP' ? 1 : step === 'WORKOUT' ? 2 : 3} total={3} />}
        
      {/* LOADER IA GLOBAL - Doit être en dehors du bloc profile pour s'afficher pendant l'import */}
      {isTyping && (
        <div className="fixed inset-0 z-[1000] bg-white/95 flex flex-col items-center justify-center backdrop-blur-md">
           <div className="w-16 h-16 border-4 border-[#38BDF8] border-t-transparent rounded-full animate-spin mb-6" />
           <p className="font-bebas text-2xl text-[#1F2937] tracking-[0.5em] animate-pulse mb-4">
             {fileProcessingStage || 'TRAITEMENT EN COURS...'}
           </p>
           {fileProcessingProgress > 0 && (
             <div className="w-64 max-w-xs">
               <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                 <div 
                   className="bg-gradient-to-r from-[#38BDF8] to-[#7DD3FC] h-3 rounded-full transition-all duration-300"
                   style={{ width: `${fileProcessingProgress}%` }}
                 />
               </div>
               <p className="text-sm font-medium text-gray-600 text-center">{fileProcessingProgress}%</p>
             </div>
           )}
        </div>
      )}
        
        {/* Vérification de sécurité : profile doit exister */}
        {!profile && !isTyping && (
          <div className="h-[100dvh] flex items-center justify-center">
            <div className="text-center">
              <p className="text-red-400 font-bebas text-2xl mb-4">Erreur : Profil introuvable</p>
              <button 
                onClick={() => setViewMode('LOGIN')} 
                className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700"
              >
                Retour à l'accueil
              </button>
            </div>
          </div>
        )}

        {profile && (
          <>
        {/* #region agent log */}
        {(() => { fetch('http://127.0.0.1:7242/ingest/2cfb4929-d2fb-4807-9ccf-fd780957ec5c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:1116',message:'Rendering with profile',data:{profileId:profile?.id,profileName:profile?.nom,hasActiveProgram:!!profile?.activeProgram,viewMode,step},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{}); return null; })()}
        {/* #endregion */}

      <header className="h-16 shrink-0 border-b border-[#BAE6FD]/30 flex items-center justify-between px-6 bg-white/70 backdrop-blur-2xl z-50 shadow-[0_1px_20px_rgba(0,0,0,0.04)]">
         <div className="flex items-center gap-4">
            <div className="hidden sm:block">
                <h1 className="font-bebas text-xl text-[#1F2937]">HYGIE <span className="bg-gradient-to-r from-[#FBBF24] to-[#F59E0B] bg-clip-text text-transparent">ELITE</span></h1>
                <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">{profile?.nom || ''}</p>
            </div>
         </div>
         <div className="flex gap-3 items-center">
            {userRole === 'COACH' && <button onClick={handleBackToBase} className="px-4 py-2 bg-gradient-to-r from-[#EF4444] to-[#F87171] text-white border-2 border-[#DC2626] rounded-xl font-semibold text-xs uppercase shadow-md hover:shadow-lg transition-all">RETOUR BASE</button>}
            {!hasApiKey && <button onClick={handleOpenKeyDialog} className="px-4 py-2 bg-gradient-to-r from-[#FCD34D] to-[#FBBF24] text-[#1F2937] rounded-xl font-semibold text-xs shadow-md hover:shadow-lg transition-all">API KEY</button>}
            {step !== 'DASHBOARD' && <button onClick={() => setStep('DASHBOARD')} className="text-xs font-semibold text-[#4B5563] uppercase border-2 border-[#BAE6FD] px-4 py-2 rounded-xl hover:bg-[#BAE6FD]/30 hover:text-[#1F2937] transition-all shadow-sm">Stats</button>}
            {userRole === 'CLIENT' && (
              <>
                <button 
                  onClick={() => setSettingsModalOpen(true)} 
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors"
                  title="Paramètres"
                >
                  ⚙️
                </button>
                <button onClick={() => setViewMode('LOGIN')} className="text-xs font-semibold text-[#6B7280] hover:text-[#1F2937] transition-all">Déconnexion</button>
              </>
            )}
         </div>
      </header>

      <main className={`flex-1 relative z-10 overflow-y-auto custom-scrollbar p-6 ${(step === 'WARMUP' || step === 'WORKOUT' || step === 'STRETCH') ? 'pt-24' : ''}`}>
        
        {/* Breadcrumb contextuel */}
        {step !== 'DAILY_CHECK' && step !== 'DASHBOARD' && (
          <div className="max-w-7xl mx-auto mb-4 text-sm text-[#6B7280]">
            <span className="hover:text-[#1F2937] cursor-pointer" onClick={() => setStep('DAILY_CHECK')}>Accueil</span>
            <span className="mx-2 text-[#BAE6FD]">›</span>
            <span className="text-[#1F2937] font-semibold">
              {step === 'WARMUP' ? 'Échauffement' : 
               step === 'WORKOUT' ? (workout ? `Exercice ${workout.liste_exos[currentExoIndex]?.nom || ''}` : 'Séance') :
               step === 'STRETCH' ? 'Récupération' : 'Séance'}
            </span>
          </div>
        )}
        
        {/* STEP: DAILY CHECK */}
        {step === 'DAILY_CHECK' && (
            <div className="max-w-4xl mx-auto py-12 text-center space-y-8 animate-fadeIn">
                {/* #region agent log */}
                {(() => { fetch('http://127.0.0.1:7242/ingest/2cfb4929-d2fb-4807-9ccf-fd780957ec5c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:1134',message:'Rendering DAILY_CHECK step',data:{profileExists:!!profile,profileId:profile?.id,hasActiveProgram:!!profile?.activeProgram,activeProgramName:profile?.activeProgram?.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{}); return null; })()}
                {/* #endregion */}
                <div className="p-12 rounded-[32px] bg-white/95 backdrop-blur-xl border border-[#BAE6FD]/40 shadow-[0_8px_32px_rgba(31,38,135,0.08)] space-y-10 hover:shadow-[0_12px_48px_rgba(56,189,248,0.12)] transition-all duration-500">
                    <h2 className="text-5xl md:text-7xl font-bebas text-[#1F2937] uppercase tracking-tight"><span className="bg-gradient-to-r from-[#FBBF24] via-[#F59E0B] to-[#F97316] bg-clip-text text-transparent drop-shadow-sm">{profile?.nom?.split(' ')[0] || 'Client'}</span></h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left bg-gradient-to-br from-[#F0F9FF]/80 via-white to-[#FFFBF0]/60 backdrop-blur-sm p-8 rounded-3xl border border-[#BAE6FD]/30 shadow-[0_4px_20px_rgba(186,230,253,0.15)]">
                        <div>
                            <p className="text-xs font-semibold text-[#6B7280] uppercase mb-2">Objectif</p>
                            <p className="text-xl font-bebas text-[#1F2937]">{profile?.objectifPrincipal || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-[#6B7280] uppercase mb-2">Pathologies</p>
                            <p className="text-sm font-medium text-[#DC2626]">{profile?.blessures_actives?.join(', ') || 'Aucune'}</p>
                        </div>
                    </div>

                    {/* Suivi des objectifs amélioré */}
                    {profile?.activeGoal && (
                        <GoalTracker profile={profile} />
                    )}
                    
                    {/* Affichage du programme actif */}
                    {profile?.activeProgram && (
                        <div className="bg-gradient-to-br from-[#BAE6FD]/90 via-white to-[#E0F2FE]/80 backdrop-blur-sm p-8 rounded-3xl border border-[#38BDF8]/40 shadow-[0_8px_32px_rgba(56,189,248,0.15)] hover:shadow-[0_12px_48px_rgba(56,189,248,0.2)] transition-all duration-500">
                            <div className="flex items-center justify-between mb-4">
                                <div className="text-left">
                                    <p className="text-xs font-semibold text-[#38BDF8] uppercase mb-1">Programme Personnalisé</p>
                                    <p className="text-2xl font-bebas text-[#1F2937]">{profile.activeProgram?.name || 'N/A'}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-semibold text-[#6B7280] uppercase">Semaine {profile.activeProgram?.currentWeek || 0}/{profile.activeProgram?.duration || 0}</p>
                                    <p className="text-xs font-semibold text-[#6B7280] uppercase">Séance {profile.activeProgram?.currentSession || 0}/{profile.activeProgram?.sessionsPerWeek || 0}</p>
                                </div>
                            </div>
                            <div className="w-full bg-[#E5E7EB] rounded-full h-3 mb-2 shadow-inner">
                                <div 
                                    className="bg-gradient-to-r from-[#38BDF8] to-[#7DD3FC] h-3 rounded-full transition-all shadow-sm"
                                    style={{ width: `${programProgress}%` }}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4 mt-4">
                                <div>
                                    <p className="text-xs font-semibold text-[#6B7280] uppercase mb-1">Phase</p>
                                    <p className="text-sm font-bebas text-[#1F2937]">
                                        {(profile.activeProgram?.currentWeek || 0) <= 4 ? 'Adaptation' :
                                         (profile.activeProgram?.currentWeek || 0) <= 10 ? 'Développement' :
                                         (profile.activeProgram?.currentWeek || 0) <= 16 ? 'Intensification' :
                                         (profile.activeProgram?.currentWeek || 0) <= 20 ? 'Spécialisation' : 'Consolidation'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-[#6B7280] uppercase mb-1">Focus Semaine</p>
                                    <p className="text-sm font-bebas text-[#1F2937]">
                                        {profile.activeProgram?.weeks?.find(w => w.weekNumber === profile.activeProgram?.currentWeek)?.focus || 'N/A'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Journal de récupération */}
                    {userRole === 'CLIENT' && (
                        <RecoveryJournal
                            profile={profile!}
                            onSave={(entry) => {
                                const updatedProfile: UserProfile = {
                                    ...profile!,
                                    recoveryJournal: [...(profile?.recoveryJournal || []), entry]
                                };
                                const newList = StorageService.updateClient(updatedProfile);
                                setClients(newList);
                                setProfile(updatedProfile);
                            }}
                        />
                    )}

                    {/* Sessions planifiées à venir */}
                    {userRole === 'CLIENT' && profile?.plannedSessions && profile.plannedSessions.length > 0 && (() => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const upcomingSessions = profile.plannedSessions
                            .filter(ps => {
                                const psDate = new Date(ps.date);
                                psDate.setHours(0, 0, 0, 0);
                                return psDate >= today;
                            })
                            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                            .slice(0, 3);
                        
                        if (upcomingSessions.length === 0) return null;
                        
                        return (
                            <div className="bg-gradient-to-br from-[#BAE6FD]/90 via-white to-[#E0F2FE]/80 backdrop-blur-sm p-6 rounded-3xl border border-[#38BDF8]/40 shadow-[0_8px_32px_rgba(56,189,248,0.15)]">
                                <p className="text-xs font-semibold text-[#38BDF8] uppercase mb-3 tracking-wider">Sessions Planifiées</p>
                                <div className="space-y-2">
                                    {upcomingSessions.map((session) => {
                                        const sessionDate = new Date(session.date);
                                        const isToday = sessionDate.toDateString() === new Date().toDateString();
                                        return (
                                            <div
                                                key={session.id}
                                                className={`p-3 rounded-lg border ${
                                                    isToday
                                                        ? 'bg-[#38BDF8]/20 border-[#38BDF8]'
                                                        : 'bg-white/50 border-[#38BDF8]/30'
                                                }`}
                                            >
                                                <p className="text-sm font-semibold text-[#1F2937]">
                                                    {sessionDate.toLocaleDateString('fr-FR', {
                                                        weekday: 'long',
                                                        day: 'numeric',
                                                        month: 'long'
                                                    })}
                                                    {isToday && ' (Aujourd\'hui)'}
                                                </p>
                                                {session.notes && (
                                                    <p className="text-xs text-[#6B7280] mt-1">{session.notes}</p>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })()}
                    
                    <div className="flex gap-4 flex-col">
                        {!profile?.activeProgram && userRole !== 'COACH' && (
                            <button onClick={() => setCreateProgramModalOpen(true)} className="w-full py-6 bg-gradient-to-r from-[#38BDF8] to-[#7DD3FC] text-[#1F2937] rounded-2xl font-bebas text-2xl hover:from-[#0EA5E9] hover:to-[#38BDF8] transition-all uppercase shadow-lg hover:shadow-xl">Créer Programme</button>
                        )}
                        {userRole === 'COACH' ? (
                            <div className="space-y-3">
                                {workout ? (
                                    <button 
                                        onClick={() => setWorkoutEditorOpen(true)} 
                                        className="w-full py-8 bg-gradient-to-r from-[#EF4444] to-[#F87171] text-white rounded-2xl font-bebas text-4xl hover:scale-105 transition-all uppercase border-2 border-[#DC2626] shadow-xl"
                                    >
                                        ÉDITER LE PROTOCOLE
                                    </button>
                                ) : (
                                    <button 
                                        onClick={handleStartWorkout} 
                                        className="w-full py-8 bg-gradient-to-r from-[#FCD34D] to-[#FBBF24] text-[#1F2937] rounded-2xl font-bebas text-4xl hover:scale-105 transition-all uppercase shadow-xl hover:shadow-2xl"
                                    >
                                        {profile?.activeProgram ? `GÉNÉRER SÉANCE ${profile.activeProgram?.currentSession || 0}` : 'GÉNÉRER PROTOCOLE'}
                                    </button>
                                )}
                            </div>
                        ) : (
                            <button 
                                onClick={handleStartWorkout} 
                                className={`${profile?.activeProgram ? 'w-full' : 'flex-1'} py-10 bg-gradient-to-r from-[#FCD34D] via-[#FBBF24] to-[#F59E0B] text-[#1F2937] rounded-3xl font-bebas text-4xl hover:scale-[1.02] transition-all duration-500 uppercase shadow-[0_8px_32px_rgba(251,191,36,0.3)] hover:shadow-[0_12px_48px_rgba(249,115,22,0.4)] relative overflow-hidden group`}
                            >
                                <span className="relative z-10">{profile?.activeProgram ? `SÉANCE ${profile.activeProgram?.currentSession || 0}` : 'LANCER LE PROTOCOLE'}</span>
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* STEP: WARMUP */}
        {step === 'WARMUP' && currentWarmupPhase && (
            <div className="h-full flex flex-col items-center justify-center text-center animate-fadeIn">
                <p className="text-xs font-semibold text-[#38BDF8] uppercase tracking-wider mb-6 opacity-80">Phase Pré-Opérationnelle</p>
                <h2 className="text-4xl md:text-6xl font-bebas text-[#1F2937] mb-10 max-w-3xl px-4 tracking-tight drop-shadow-sm">{currentWarmupPhase.nom}</h2>
                <div className="relative w-56 h-56 md:w-72 md:h-72 mb-12">
                  <div className="absolute inset-0 rounded-full border-2 border-[#38BDF8]/60 bg-gradient-to-br from-[#BAE6FD]/80 via-[#7DD3FC] to-[#38BDF8] backdrop-blur-sm shadow-[0_8px_64px_rgba(56,189,248,0.4)] animate-pulse-soft"></div>
                  <div className="absolute inset-0 rounded-full flex items-center justify-center text-7xl md:text-9xl font-bebas text-white drop-shadow-[0_0_40px_rgba(56,189,248,0.9)] font-bold timer-large">
                    {countdown}
                </div>
                  <div className="absolute -inset-4 rounded-full border border-[#7DD3FC]/30 animate-ping"></div>
                </div>
                <button 
                  onClick={handleAutoTransition} 
                  className="px-10 md:px-12 py-4 md:py-5 bg-gradient-to-r from-[#38BDF8] via-[#7DD3FC] to-[#0EA5E9] rounded-full font-bebas text-xl md:text-2xl text-white border border-[#0EA5E9]/30 hover:from-[#0EA5E9] hover:via-[#38BDF8] hover:to-[#7DD3FC] transition-all duration-500 button-touch focus:outline-none focus:ring-4 focus:ring-[#BAE6FD]/50 shadow-[0_8px_32px_rgba(56,189,248,0.4)] hover:shadow-[0_12px_48px_rgba(14,165,233,0.5)] hover:scale-105 relative overflow-hidden group"
                  aria-label="Passer à l'étape suivante"
                >
                  <span className="relative z-10">PASSER ⮕</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                </button>
            </div>
        )}

        {/* STEP: WORKOUT */}
        {step === 'WORKOUT' && workout && (
            <div className="max-w-6xl mx-auto h-full flex flex-col justify-center animate-fadeIn">
                {/* Panneau de statistiques en temps réel */}
                <LiveStatsPanel sessionData={sessionData} elapsedTime={sessionStartTime ? Math.floor((Date.now() - sessionStartTime) / 1000) : 0} />
                
                {/* Messages de motivation */}
                {motivationalMessage && (
                  <MotivationalMessage type={motivationalMessage.type} message={motivationalMessage.message} />
                )}
                
                <div className="p-8 rounded-3xl border-2 border-[#BAE6FD] bg-white shadow-xl relative">
                    {/* Indicateurs améliorés */}
                    <div className="absolute top-6 right-8 text-right hidden md:block">
                        <div className="bg-gradient-to-br from-[#BAE6FD]/90 via-white to-[#E0F2FE]/80 backdrop-blur-sm p-5 rounded-2xl border border-[#38BDF8]/40 shadow-[0_4px_20px_rgba(56,189,248,0.15)] space-y-3">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#38BDF8] to-[#7DD3FC] flex items-center justify-center text-white font-bold text-xs">
                                    {currentExoIndex + 1}/{workout.liste_exos.length}
                                </div>
                                <span className="text-xs font-semibold text-[#1F2937]">Exercice</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FCD34D] to-[#FBBF24] flex items-center justify-center text-[#1F2937] font-bold text-xs">
                                    {currentSet}/{workout.liste_exos[currentExoIndex].sets}
                                </div>
                                <span className="text-xs font-semibold text-[#1F2937]">Série</span>
                            </div>
                            {(() => {
                              const estimatedTime = calculateEstimatedWorkoutTime(workout);
                              const elapsedSeconds = sessionStartTime ? Math.floor((Date.now() - sessionStartTime) / 1000) : 0;
                              const elapsedMinutes = Math.floor(elapsedSeconds / 60);
                              const elapsedSecs = elapsedSeconds % 60;
                              return (
                                <div className="pt-2 border-t border-[#BAE6FD]">
                                  <p className="text-[10px] font-semibold text-[#6B7280] uppercase">Temps</p>
                                  <p className="text-xs font-bold text-[#38BDF8]">
                                    {elapsedMinutes}:{elapsedSecs.toString().padStart(2, '0')} / ~{estimatedTime} min
                                  </p>
                                </div>
                              );
                            })()}
                        </div>
                    </div>
                    <div className="mb-8 pr-20">
                         <h2 className="text-4xl md:text-6xl font-bebas text-[#1F2937] uppercase">{workout.liste_exos[currentExoIndex].nom}</h2>
                         <p className="text-sm text-[#6B7280] font-medium mt-2">{workout.liste_exos[currentExoIndex].description}</p>
                    </div>
                    
                    <div className="flex flex-col md:flex-row gap-8 items-center workout-layout">
                        {/* TIMER D'EFFORT - Style énergique avec orange/jaune */}
                        {!isResting && (
                          <div className="flex-1 w-full aspect-square md:aspect-video rounded-3xl flex flex-col items-center justify-center relative overflow-hidden bg-gradient-to-br from-[#FED7AA] via-[#FCD34D] to-[#FBBF24] border-2 border-[#F59E0B]/50 shadow-[0_8px_48px_rgba(251,191,36,0.4)] backdrop-blur-sm hover:shadow-[0_12px_64px_rgba(249,115,22,0.5)] transition-all duration-500 group">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(251,191,36,0.2)_0%,_transparent_70%)] animate-pulse"></div>
                            <div className="relative z-10 flex flex-col items-center">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-2 h-2 bg-[#F97316] rounded-full animate-ping"></div>
                                <p className="text-xs font-semibold text-[#1F2937] uppercase tracking-wide font-bold">TEMPS D'EFFORT</p>
                                <div className="w-2 h-2 bg-[#F97316] rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
                        </div>
                              <TimerDisplay 
                                seconds={countdown}
                                className="text-7xl md:text-[10rem] font-bebas text-[#1F2937] tabular-nums drop-shadow-[0_0_20px_rgba(245,158,11,0.8)] font-bold"
                              />
                              <div className="mt-4 flex gap-1">
                                {[...Array(3)].map((_, i) => (
                                  <div key={i} className="w-1.5 h-1.5 bg-[#F97316] rounded-full animate-pulse" style={{ animationDelay: `${i * 0.2}s` }}></div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* TIMER DE REPOS - Style calme avec bleu craie */}
                        {isResting && (
                          <div className="flex-1 w-full aspect-square md:aspect-video rounded-3xl flex flex-col items-center justify-center relative overflow-hidden bg-gradient-to-br from-[#BAE6FD]/90 via-[#7DD3FC] to-[#38BDF8] border-2 border-[#0EA5E9]/50 backdrop-blur-sm shadow-[0_8px_48px_rgba(56,189,248,0.3)] hover:shadow-[0_12px_64px_rgba(14,165,233,0.4)] transition-all duration-500">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(56,189,248,0.15)_0%,_transparent_70%)]"></div>
                            <div className="relative z-10 flex flex-col items-center">
                              <div className="flex items-center gap-2 mb-2">
                                <svg className="w-4 h-4 text-[#1F2937] animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                </svg>
                                <p className="text-xs font-semibold text-[#1F2937] uppercase tracking-wide font-bold">RÉCUPÉRATION</p>
                                <svg className="w-4 h-4 text-[#1F2937] animate-pulse" style={{ animationDelay: '0.5s' }} fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                </svg>
                              </div>
                              <TimerDisplay 
                                seconds={countdown}
                                className="text-7xl md:text-[10rem] font-bebas text-white tabular-nums drop-shadow-[0_0_20px_rgba(56,189,248,0.6)] font-bold"
                              />
                              <button 
                                onClick={() => { 
                                  if (timerRef.current) {
                                    clearInterval(timerRef.current);
                                    timerRef.current = null;
                                  }
                                  setIsResting(false); 
                                  setCountdown(0);
                                  setIsTimerRunning(false);
                                }} 
                                className="mt-6 px-8 py-3 bg-gradient-to-r from-[#38BDF8] to-[#7DD3FC] text-[#1F2937] font-bebas rounded-full button-touch focus:outline-none focus:ring-4 focus:ring-[#BAE6FD] shadow-lg hover:shadow-xl transition-all hover:scale-105"
                                aria-label="Passer le temps de repos"
                              >
                                SKIP REPOS
                              </button>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex-1 w-full space-y-6">
                            <div className="flex items-center justify-center gap-4 md:gap-6 bg-gradient-to-br from-[#F0F9FF] to-white p-4 md:p-6 rounded-2xl border-2 border-[#BAE6FD] shadow-md">
                                <button 
                                  onClick={() => setCurrentKg(Math.max(0, currentKg - 2.5))} 
                                  className="w-12 h-12 md:w-14 md:h-14 rounded-full border-2 border-[#BAE6FD] text-2xl text-[#1F2937] hover:bg-[#BAE6FD] hover:border-[#38BDF8] transition-all button-touch focus:outline-none focus:ring-4 focus:ring-[#BAE6FD] shadow-sm"
                                  aria-label="Diminuer le poids de 2.5 kg"
                                >
                                  -
                                </button>
                                <div className="text-center w-24 md:w-32">
                                    <span className="text-4xl md:text-6xl font-bebas text-[#1F2937] tabular-nums">{currentKg}</span>
                                    <p className="text-xs font-semibold text-[#6B7280] uppercase">Kg</p>
                                </div>
                                <button 
                                  onClick={() => setCurrentKg(currentKg + 2.5)} 
                                  className="w-12 h-12 md:w-14 md:h-14 rounded-full border-2 border-[#BAE6FD] text-2xl text-[#1F2937] hover:bg-[#BAE6FD] hover:border-[#38BDF8] transition-all button-touch focus:outline-none focus:ring-4 focus:ring-[#BAE6FD] shadow-sm"
                                  aria-label="Augmenter le poids de 2.5 kg"
                                >
                                  +
                                </button>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <button 
                                  onClick={() => setConfirmSwapModal(true)} 
                                  className="py-4 border-2 border-[#BAE6FD] rounded-2xl font-bebas text-xl text-[#4B5563] uppercase hover:text-[#1F2937] hover:bg-[#BAE6FD]/30 transition-all button-touch focus:outline-none focus:ring-4 focus:ring-[#BAE6FD] shadow-sm"
                                  aria-label="Remplacer cet exercice"
                                >
                                  Remplacer
                                </button>
                                <button 
                                    onClick={() => !isResting && validateSet()} 
                                    disabled={isResting} 
                                    className={`py-4 rounded-2xl font-bebas text-xl text-[#1F2937] uppercase button-touch focus:outline-none focus:ring-4 focus:ring-[#FCD34D] shadow-lg ${isResting ? 'bg-gray-300 opacity-50 cursor-not-allowed' : 'bg-gradient-to-r from-[#FCD34D] to-[#FBBF24] hover:scale-105 transition-transform hover:shadow-xl'}`}
                                    aria-label={isResting ? 'En attente de la fin du repos' : 'Valider cette série'}
                                >
                                    Valider Série
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* STEP: STRETCH */}
        {step === 'STRETCH' && (
           <div className="h-full flex flex-col items-center justify-center text-center animate-fadeIn">
                <p className="text-xs font-semibold text-[#38BDF8] uppercase tracking-wider mb-6 opacity-80">Récupération Finale</p>
                <h2 className="text-6xl font-bebas text-[#1F2937] mb-10 max-w-3xl tracking-tight drop-shadow-sm">{workout?.etirements[currentPhaseIndex]?.nom || "Terminé"}</h2>
                <div className="w-72 h-72 rounded-full border-2 border-[#BAE6FD]/60 flex items-center justify-center text-9xl font-bebas text-[#1F2937] bg-gradient-to-br from-[#BAE6FD]/80 via-[#7DD3FC] to-[#38BDF8] backdrop-blur-sm shadow-[0_8px_64px_rgba(56,189,248,0.3)] mb-12 animate-pulse-soft">
                    {countdown}
                </div>
                <button onClick={handleAutoTransition} className="px-12 py-5 bg-gradient-to-r from-[#38BDF8] via-[#7DD3FC] to-[#0EA5E9] rounded-full font-bebas text-2xl text-white border border-[#0EA5E9]/30 hover:from-[#0EA5E9] hover:via-[#38BDF8] hover:to-[#7DD3FC] transition-all duration-500 shadow-[0_8px_32px_rgba(56,189,248,0.4)] hover:shadow-[0_12px_48px_rgba(14,165,233,0.5)] hover:scale-105 relative overflow-hidden group">
                  <span className="relative z-10">TERMINER ⮕</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                </button>
            </div>
        )}

        {/* STEP: DASHBOARD */}
        {step === 'DASHBOARD' && (
            <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn pb-20 px-4">
                {/* Header avec nom et métriques - Style Hygie */}
                <div className="bg-white rounded-lg border border-[#007c89]/20 shadow-md p-6 mb-6">
                    <div className="flex items-center gap-6 mb-6">
                        <img 
                            src={profile?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.nom || '')}&background=007c89&color=fff&size=200`} 
                            alt={profile?.nom} 
                            className="w-16 h-16 rounded-full border-2 border-[#007c89]/30 object-cover"
                        />
                        <div>
                            <h2 className="text-3xl font-bebas text-[#181818] mb-1">{profile?.nom}</h2>
                            <p className="text-sm font-medium text-[#007c89] uppercase">{profile?.objectifPrincipal || 'Objectif non défini'}</p>
                        </div>
                    </div>
                    
                    {/* Métriques principales - Style Hygie */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 rounded-lg bg-white border border-[#007c89]/20 shadow-sm">
                            <p className="text-xs font-semibold text-[#007c89] uppercase mb-2 tracking-wider">SESSIONS</p>
                            <p className="text-3xl font-bebas text-[#181818]">{dashboardStats.sessionCount}</p>
                        </div>
                        <div className="p-4 rounded-lg bg-white border border-[#007c89]/20 shadow-sm">
                            <p className="text-xs font-semibold text-[#007c89] uppercase mb-2 tracking-wider">DERNIÈRE SESSION</p>
                            <p className="text-xl font-bebas text-[#181818]">
                                {profile?.sessionRecords && profile.sessionRecords.length > 0
                                    ? (() => {
                                        const lastSession = profile.sessionRecords[profile.sessionRecords.length - 1];
                                        const lastDate = new Date(lastSession.date);
                                        const today = new Date();
                                        const diffTime = today.getTime() - lastDate.getTime();
                                        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                                        if (diffDays === 0) return "AUJOURD'HUI";
                                        if (diffDays === 1) return "HIER";
                                        return `IL Y A ${diffDays}J`;
                                      })()
                                    : "JAMAIS"}
                            </p>
                        </div>
                        <div className="p-4 rounded-lg bg-white border border-[#007c89]/20 shadow-sm">
                            <p className="text-xs font-semibold text-[#007c89] uppercase mb-2 tracking-wider">PROGRESSION</p>
                            <p className="text-3xl font-bebas text-[#181818]">{Math.round(dashboardStats.goalProgress)}%</p>
                        </div>
                        <div className="p-4 rounded-lg bg-white border border-[#007c89]/20 shadow-sm">
                            <p className="text-xs font-semibold text-[#007c89] uppercase mb-2 tracking-wider">SOMMEIL</p>
                            <p className="text-3xl font-bebas text-[#181818]">
                                {(() => {
                                    const recentEntries = profile?.recoveryJournal?.slice(-7) || [];
                                    if (recentEntries.length === 0) return "N/A";
                                    const avgSleep = recentEntries.reduce((sum, e) => sum + (e.sleepHours || 0), 0) / recentEntries.length;
                                    return `${avgSleep.toFixed(1)}H`;
                                })()}
                            </p>
                        </div>
                    </div>
                </div>
                
                {/* Programme actif - Style Hygie */}
                {profile?.activeProgram && (
                    <div className="bg-white rounded-lg border border-[#007c89]/20 shadow-md p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <p className="text-xs font-semibold text-[#007c89] uppercase mb-1 tracking-wider">PROGRAMME ACTIF</p>
                                <p className="text-xl font-bebas text-[#181818]">{profile.activeProgram.name || 'Programme personnalisé'}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-semibold text-[#181818]">Semaine {profile.activeProgram.currentWeek || 0} / {profile.activeProgram.duration || 0}</p>
                            </div>
                        </div>
                        <div className="w-full bg-[#E5E7EB] rounded-full h-3 mb-2 shadow-inner">
                            <div 
                                className="bg-[#007c89] h-3 rounded-full transition-all shadow-sm"
                                style={{ width: `${programProgress}%` }}
                            />
                        </div>
                        <p className="text-xs font-semibold text-[#6B7280]">{Math.round(programProgress)}% complété</p>
                    </div>
                )}
                
                {/* Onglets - Style Hygie */}
                <div className="flex gap-2 justify-center">
                    <button
                        onClick={() => setDashboardTab('stats')}
                        className={`px-6 py-3 rounded-md font-semibold transition-all ${
                            dashboardTab === 'stats'
                                ? 'bg-[#007c89] text-white shadow-md'
                                : 'bg-white border border-[#007c89]/30 text-[#181818] hover:bg-[#007c89]/10'
                        }`}
                    >
                        Statistiques
                    </button>
                    <button
                        onClick={() => setDashboardTab('history')}
                        className={`px-6 py-3 rounded-md font-semibold transition-all ${
                            dashboardTab === 'history'
                                ? 'bg-[#007c89] text-white shadow-md'
                                : 'bg-white border border-[#007c89]/30 text-[#181818] hover:bg-[#007c89]/10'
                        }`}
                    >
                        Historique
                    </button>
                    <button
                        onClick={() => setDashboardTab('calendar')}
                        className={`px-6 py-3 rounded-md font-semibold transition-all ${
                            dashboardTab === 'calendar'
                                ? 'bg-[#007c89] text-white shadow-md'
                                : 'bg-white border border-[#007c89]/30 text-[#181818] hover:bg-[#007c89]/10'
                        }`}
                    >
                        Calendrier
                    </button>
                </div>

                {dashboardTab === 'calendar' ? (
                    profile && (
                        <ClientCalendarView
                            profile={profile}
                            onStartSession={(plannedSession) => {
                                // Sauvegarder la session planifiée pour la synchronisation après archivage
                                setCurrentPlannedSession(plannedSession);
                                
                                // Démarrer le workout
                                handleStartWorkout();
                            }}
                            onUpdateProfile={(updatedProfile) => {
                                const updatedClients = StorageService.updateClient(updatedProfile);
                                setClients(updatedClients);
                                setProfile(updatedProfile);
                            }}
                        />
                    )
                ) : dashboardTab === 'stats' ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                           <EnhancedAreaChart
                             data={chartData.volumeData}
                             title="Volume Entraînement"
                           />
                           <EnhancedLineChart
                             data={chartData.goalData}
                             title={`Progression Objectif (${dashboardStats.goalProgress}%)`}
                           />
                        </div>

                        {/* Métriques supplémentaires - Style Hygie */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <div className="p-6 rounded-lg bg-white border border-[#007c89]/20 shadow-md text-center hover:shadow-lg transition-all">
                                <p className="text-xs font-semibold text-[#007c89] uppercase mb-2 tracking-wider">Streak Actuel</p>
                                <p className="text-3xl font-bebas text-[#181818]">{profile?.currentStreak || 0}</p>
                            </div>
                            <div className="p-6 rounded-lg bg-white border border-[#007c89]/20 shadow-md text-center hover:shadow-lg transition-all">
                                <p className="text-xs font-semibold text-[#007c89] uppercase mb-2 tracking-wider">Record Streak</p>
                                <p className="text-3xl font-bebas text-[#181818]">{profile?.longestStreak || 0}</p>
                            </div>
                            <div className="p-6 rounded-lg bg-white border border-[#007c89]/20 shadow-md text-center hover:shadow-lg transition-all">
                                <p className="text-xs font-semibold text-[#007c89] uppercase mb-2 tracking-wider">Sessions</p>
                                <p className="text-3xl font-bebas text-[#181818]">{dashboardStats.sessionCount}</p>
                            </div>
                            <div className="p-6 rounded-lg bg-white border border-[#007c89]/20 shadow-md text-center hover:shadow-lg transition-all">
                                <p className="text-xs font-semibold text-[#007c89] uppercase mb-2 tracking-wider">Max Volume</p>
                                <p className="text-3xl font-bebas text-[#181818]">{Math.round(dashboardStats.maxVolume)}</p>
                            </div>
                            <div className="p-6 rounded-lg bg-white border border-[#007c89]/20 shadow-md text-center hover:shadow-lg transition-all">
                                <p className="text-xs font-semibold text-[#007c89] uppercase mb-2 tracking-wider">PR Battus</p>
                                <p className="text-3xl font-bebas text-[#181818]">
                                    {Object.keys(profile?.personalBests || {}).length}
                                </p>
                            </div>
                        </div>

                        {/* Comparaisons temporelles */}
                        {profile && (
                            <ComparisonCharts profile={profile} />
                        )}

                        <div className="p-10 rounded-lg bg-white border border-[#007c89]/20 shadow-md flex flex-col md:flex-row gap-8 items-center justify-between hover:shadow-lg transition-all">
                            <div className="text-center md:text-left">
                                <p className="text-xs font-semibold text-[#007c89] uppercase tracking-wider mb-3">Dernier Conseil IA</p>
                                <p className="text-lg md:text-xl text-[#181818] font-medium italic leading-relaxed">
                                    {profile?.dernier_feedback_ia || "Système en attente de données post-op."}
                                </p>
                            </div>
                        </div>
                    </>
                ) : (
                    profile && (
                        <ClientSessionHistory 
                            profile={profile} 
                            onSessionSelect={(session) => setSelectedSessionForDetail(session)}
                        />
                    )
                )}

                <button onClick={() => setStep('DAILY_CHECK')} className="w-full py-6 bg-[#007c89] text-white font-bebas text-2xl rounded-md uppercase hover:bg-[#006a75] transition-all shadow-md hover:shadow-lg">Retour</button>
            </div>
        )}

        {/* STEP: DEBRIEF & FINAL */}
        {(step === 'DEBRIEF' || step === 'FINAL') && (
            <div className="max-w-3xl mx-auto py-20 animate-fadeIn">
               <div className="p-10 rounded-3xl bg-white border-2 border-[#BAE6FD] shadow-xl space-y-8 text-center">
                   <h2 className="text-5xl font-bebas bg-gradient-to-r from-[#FBBF24] to-[#F59E0B] bg-clip-text text-transparent uppercase">{step === 'DEBRIEF' ? 'Analyse Terminée' : 'Mission Accomplie'}</h2>
                   <div className="bg-gradient-to-br from-[#F0F9FF] to-white p-6 rounded-2xl border-2 border-[#BAE6FD]">
                       <p className="text-[#1F2937] font-medium leading-relaxed whitespace-pre-wrap">{aiFeedback || profile?.dernier_feedback_ia || 'Aucun feedback disponible'}</p>
                   </div>
                   {step === 'DEBRIEF' ? (
                       <button onClick={archiveAndExit} className="w-full py-6 bg-gradient-to-r from-[#FCD34D] to-[#FBBF24] text-[#1F2937] font-bebas text-3xl rounded-2xl uppercase hover:scale-105 transition-all shadow-xl hover:shadow-2xl">Archiver Session</button>
                   ) : (
                       <button onClick={() => setStep('DASHBOARD')} className="w-full py-6 bg-gradient-to-r from-[#38BDF8] to-[#7DD3FC] text-[#1F2937] font-bebas text-3xl rounded-2xl uppercase hover:from-[#0EA5E9] hover:to-[#38BDF8] transition-all shadow-xl hover:shadow-2xl">Voir Statistiques</button>
                   )}
               </div>
            </div>
        )}
      </main>

      {/* MODALE SWAP EXERCISE */}
      {confirmSwapModal && (
        <SwapExerciseModal
          isOpen={confirmSwapModal}
          onClose={() => setConfirmSwapModal(false)}
          onConfirm={handleSwapExercise}
          isProcessing={isTyping}
        />
      )}
      
      {/* MODALE ASSESSMENT (UPDATE) */}
      {assessmentModalOpen && selectedClientForAssessment && (
        <AssessmentModal
          client={selectedClientForAssessment}
          isOpen={assessmentModalOpen}
          onClose={() => {
            setAssessmentModalOpen(false);
            setSelectedClientForAssessment(null);
            setAssessmentText('');
            setAssessmentFile(null);
          }}
          onAnalyze={handleAnalyzeAssessment}
          isProcessing={isTyping}
          processingProgress={fileProcessingProgress}
          processingStage={fileProcessingStage}
        />
      )}

      {/* MODALE ÉDITEUR DE WORKOUT */}
      {workoutEditorOpen && workout && (
        <WorkoutEditor
          workout={workout}
          onSave={handleSaveEditedWorkout}
          onCancel={() => setWorkoutEditorOpen(false)}
        />
      )}

      {/* MODALE CRÉATION PROGRAMME */}
      {createProgramModalOpen && (
        <CreateProgramModal
          isOpen={createProgramModalOpen}
          onClose={() => {
            setCreateProgramModalOpen(false);
            setProgramName('');
          }}
          onSubmit={handleCreateProgram}
          isProcessing={isTyping}
        />
      )}

          </>
      )}

      {/* Modal de détails de séance */}
      <SessionDetailModal
          session={selectedSessionForDetail}
          isOpen={!!selectedSessionForDetail}
          onClose={() => setSelectedSessionForDetail(null)}
      />

      {/* Modal de paramètres */}
      {settingsModalOpen && profile && (
          <ClientSettings
              profile={profile}
              onSave={(preferences) => {
                  const updatedProfile: UserProfile = {
                      ...profile,
                      preferences
                  };
                  const newList = StorageService.updateClient(updatedProfile);
                  setClients(newList);
                  setProfile(updatedProfile);
              }}
              onClose={() => setSettingsModalOpen(false)}
          />
      )}

      {/* Modal d'évaluation de séance */}
      <SessionRatingModal
          isOpen={sessionRatingModalOpen}
          onClose={() => setSessionRatingModalOpen(false)}
          onSave={(rating) => {
              const updatedProfile: UserProfile = {
                  ...profile!,
                  sessionRatings: [...(profile?.sessionRatings || []), rating]
              };
              const newList = StorageService.updateClient(updatedProfile);
              setClients(newList);
              setProfile(updatedProfile);
          }}
      />

      {/* Tutoriel d'onboarding */}
      <OnboardingTutorial
          isOpen={showTutorial}
          onClose={() => setShowTutorial(false)}
          onComplete={() => {
              setTutorialCompleted(true);
              localStorage.setItem('hygie_tutorial_completed', 'true');
          }}
      />
    </div>
      <ToastContainer />
    </CoachClientView>
  );
};

export default App;