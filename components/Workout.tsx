import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { UserProfile, WorkoutPlan, PerformanceMetric, PhaseExercise } from '../types';
import * as aiService from '../services/geminiService';
import { StorageService } from '../services/storageService';
import { 
  CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, XAxis, YAxis, LineChart, Line
} from 'recharts';
import { PerformanceBackground } from './shared/PerformanceBackground';
import { ProgressBar } from './shared/ProgressBar';
import { notificationService } from '../services/notificationService';

const COACH_AVATAR = "https://images.unsplash.com/photo-1594381898411-846e7d193883?q=80&w=256&h=256&auto=format&fit=crop";

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

type AppStep = 'DAILY_CHECK' | 'WARMUP' | 'WORKOUT' | 'STRETCH' | 'DEBRIEF' | 'FINAL' | 'DASHBOARD';

interface WorkoutProps {
  profile: UserProfile;
  workout: WorkoutPlan | null;
  setWorkout: React.Dispatch<React.SetStateAction<WorkoutPlan | null>>;
  step: AppStep;
  setStep: React.Dispatch<React.SetStateAction<AppStep>>;
  userRole: 'COACH' | 'CLIENT' | null;
  hasApiKey: boolean;
  onOpenKeyDialog: () => void;
  onBackToBase: () => void;
  onLogout: () => void;
  isTyping: boolean;
  setIsTyping: React.Dispatch<React.SetStateAction<boolean>>;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  setClients: React.Dispatch<React.SetStateAction<UserProfile[]>>;
}

export const Workout: React.FC<WorkoutProps> = ({
  profile,
  workout,
  setWorkout,
  step,
  setStep,
  userRole,
  hasApiKey,
  onOpenKeyDialog,
  onBackToBase,
  onLogout,
  isTyping,
  setIsTyping,
  setProfile,
  setClients
}) => {
  const [currentExoIndex, setCurrentExoIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isResting, setIsResting] = useState(false);
  const [sessionData, setSessionData] = useState<PerformanceMetric[]>([]);
  const [currentKg, setCurrentKg] = useState(0);
  const [aiFeedback, setAiFeedback] = useState('');
  const [confirmSwapModal, setConfirmSwapModal] = useState(false);
  const timerRef = useRef<number | null>(null);

  const finishSession = useCallback(async () => {
    setIsTimerRunning(false);
    setIsTyping(true);
    
    try {
        try {
            const feedback = await aiService.generateSessionFeedback(profile, sessionData);
            setAiFeedback(feedback);
        } catch (err) {
            console.warn("Feedback IA échoué:", err);
            setAiFeedback("Session terminée. Analyse IA indisponible (Mode hors ligne).");
        }
        setStep('DEBRIEF');
    } catch (e) {
        console.error("Erreur critique finishSession:", e);
        setStep('DEBRIEF');
    } finally {
        setIsTyping(false);
    }
  }, [profile, sessionData, setIsTyping, setStep]);

  const handleAutoTransition = useCallback(() => {
    if (isResting) {
      setIsResting(false); 
      setCountdown(0);
      return;
    }

    if (step === 'WARMUP' && workout) {
      const combined = [...workout.echauffement_dynamique, ...workout.etirements_dynamiques];
      if (currentPhaseIndex + 1 < combined.length) {
        setCurrentPhaseIndex(p => p + 1);
        setCountdown(combined[currentPhaseIndex + 1].duree_secondes);
      } else {
        setStep('WORKOUT');
        setCurrentExoIndex(0); 
        setCurrentSet(1); 
        setCountdown(0);
        setIsResting(false);
        if(workout.liste_exos.length > 0) {
            const sugg = workout.liste_exos[0].poids_suggere?.replace(/\D/g,'') || '0';
            setCurrentKg(parseInt(sugg) || 0);
        }
        setIsTimerRunning(true);
      }
    } else if (step === 'STRETCH' && workout) {
      if (currentPhaseIndex + 1 < workout.etirements.length) {
        setCurrentPhaseIndex(p => p + 1);
        setCountdown(workout.etirements[currentPhaseIndex + 1].duree_secondes);
      } else {
        finishSession();
      }
    }
  }, [isResting, step, currentPhaseIndex, workout, finishSession, setStep]);

  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = window.setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1 && (step === 'WARMUP' || step === 'STRETCH' || isResting)) {
            handleAutoTransition();
            return 0;
          }
          return (isResting || step === 'WARMUP' || step === 'STRETCH') ? prev - 1 : prev + 1;
        });
      }, 1000);
    }
    return () => { if(timerRef.current) clearInterval(timerRef.current); };
  }, [isTimerRunning, isResting, step, handleAutoTransition]);

  const handleStartWorkout = async () => {
    if (!profile) return;
    if (workout) {
       setStep('WARMUP');
       setCurrentPhaseIndex(0);
       setCountdown(workout.echauffement_dynamique[0]?.duree_secondes || 10);
       setIsTimerRunning(true);
       return;
    }

    setIsTyping(true);
    try {
      const plan = await aiService.generateWorkout(profile, 45, "Focus Correction & Renforcement");
      setWorkout(plan);
      setStep('WARMUP');
      setCurrentPhaseIndex(0);
      setCountdown(plan.echauffement_dynamique[0].duree_secondes);
      setIsTimerRunning(true);
    } catch (e) {
      notificationService.error("Erreur génération séance. Vérifiez la clé API.");
    } finally {
      setIsTyping(false);
    }
  };

  const validateSet = () => {
    if (!workout) return;
    const currentExo = workout.liste_exos[currentExoIndex];
    
    setSessionData(prev => [...prev, {
      name: currentExo.nom,
      volume: currentKg * (parseInt(currentExo.reps) || 1),
      effortTime: countdown,
      restTime: currentExo.repos,
      weight: currentKg,
      reps: parseInt(currentExo.reps) || 1
    }]);

    if (currentSet < currentExo.sets) {
      setCurrentSet(prev => prev + 1);
      setIsResting(true);
      setCountdown(currentExo.repos);
    } else {
      if (currentExoIndex + 1 < workout.liste_exos.length) {
        const nextIdx = currentExoIndex + 1;
        setCurrentExoIndex(nextIdx);
        setCurrentSet(1);
        setIsResting(true);
        const nextExo = workout.liste_exos[nextIdx];
        setCountdown(nextExo.repos);
        
        const suggestion = nextExo.poids_suggere?.replace(/\D/g,'') || '0';
        setCurrentKg(parseInt(suggestion) || 0);
      } else {
        setStep('STRETCH');
        setCurrentPhaseIndex(0);
        setCountdown(workout.etirements[0]?.duree_secondes || 30);
      }
    }
  };

  const handleSwapExercise = async () => {
    if (!workout || !profile) return;
    setIsTyping(true);
    setConfirmSwapModal(false);
    try {
      const newExo = await aiService.swapExercise(profile, workout.liste_exos[currentExoIndex]);
      const newList = [...workout.liste_exos];
      newList[currentExoIndex] = newExo;
      setWorkout({ ...workout, liste_exos: newList });
      const suggestion = newExo.poids_suggere?.replace(/\D/g,'') || '0';
      setCurrentKg(parseInt(suggestion) || 0);
    } finally {
      setIsTyping(false);
    }
  };

  const archiveAndExit = async () => {
    if (!profile || !workout) return;
    setIsTyping(true);
    try {
      let progressResult;
      
      try {
        progressResult = await aiService.analyzeGoalProgress(profile, sessionData);
      } catch (e) {
        console.warn("Erreur analyse IA progress:", e);
        progressResult = {
            progressIncrement: 1,
            isOnTrack: true,
            adjustmentAdvice: "Session enregistrée (Mode Dégradé - Analyse IA indisponible).",
            currentEstimatedCompletion: Math.min((profile.activeGoal?.currentValue || 0) + 1, 100)
        };
      }
      
      const tonnage = sessionData.reduce((acc, curr) => acc + curr.volume, 0);
      const date = new Date().toLocaleDateString('fr-FR');
      
      const updatedProfile: UserProfile = {
        ...profile,
        historique_dates: [...(profile.historique_dates || []), date],
        historique_volume: [...(profile.historique_volume || []), tonnage],
        dernier_feedback_ia: progressResult.adjustmentAdvice,
        activeGoal: {
          ...profile.activeGoal!,
          currentValue: progressResult.currentEstimatedCompletion,
          history: [...(profile.activeGoal?.history || []), { date, value: progressResult.currentEstimatedCompletion }]
        },
        sessionRecords: [...(profile.sessionRecords || []), {
          date: new Date().toISOString(),
          exercices: workout.liste_exos,
          tonnage,
          mood: progressResult.isOnTrack ? 'En progression' : 'Ajustement requis',
          debrief: aiFeedback + "\n" + progressResult.adjustmentAdvice
        }]
      };

      const newList = StorageService.updateClient(updatedProfile);
      setClients(newList);
      setProfile(updatedProfile);
      
      setStep('FINAL');
    } catch (e) {
      console.error(e);
      notificationService.error("Erreur critique lors de la sauvegarde de la session.");
    } finally {
      setIsTyping(false);
    }
  };

  const currentWarmupPhase = useMemo(() => {
    if (step !== 'WARMUP' || !workout) return null;
    const combined = [...workout.echauffement_dynamique, ...workout.etirements_dynamiques];
    return combined[currentPhaseIndex];
  }, [step, workout, currentPhaseIndex]);

  return (
    <div className={`h-[100dvh] flex flex-col relative overflow-hidden ${
      step === 'WORKOUT' ? 'bg-[#f3efe5]' : 'bg-[#0d0d0d]'
    }`}>
      {(step === 'WARMUP' || (step === 'WORKOUT' && false)) && <PerformanceBackground />}
      {(step === 'WARMUP' || step === 'WORKOUT' || step === 'STRETCH') && <ProgressBar current={step === 'WARMUP' ? 1 : step === 'WORKOUT' ? 2 : 3} total={3} />}

      <header className="h-20 shrink-0 border-b border-[#007c89]/20 flex items-center justify-between px-6 bg-white z-50 shadow-sm">
         <div className="flex items-center gap-6">
            <div>
                <h1 className="font-bebas text-2xl text-[#181818]">HYGIE <span className="text-[#007c89]">ELITE</span></h1>
                <p className="text-[10px] font-mono text-[#6B7280] uppercase tracking-widest">{profile.nom}</p>
            </div>
            {step === 'WORKOUT' && workout && (
                <div className="hidden md:block border-l border-[#007c89]/20 pl-6">
                    <p className="text-xs font-mono text-[#6B7280]">
                        Accueil {'>'} Exercice {workout.liste_exos[currentExoIndex].nom}
                    </p>
                </div>
            )}
         </div>
         <div className="flex gap-3 items-center">
            {userRole === 'COACH' && <button onClick={onBackToBase} className="px-4 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-full font-bebas text-xs uppercase hover:bg-red-100 transition-all">RETOUR BASE</button>}
            {!hasApiKey && <button onClick={onOpenKeyDialog} className="px-3 py-1.5 bg-[#FBBF24] text-[#181818] rounded-full font-bebas text-xs hover:bg-[#F59E0B] transition-all">API KEY</button>}
            {step !== 'DASHBOARD' && <button onClick={() => setStep('DASHBOARD')} className="text-xs font-semibold text-[#007c89] uppercase border border-[#007c89]/30 px-4 py-1.5 rounded-full hover:bg-[#007c89] hover:text-white transition-all">STATS</button>}
            <button className="text-[#6B7280] hover:text-[#181818] transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            </button>
            {userRole === 'CLIENT' && <button onClick={onLogout} className="text-xs text-[#6B7280] uppercase hover:text-[#181818] transition-colors">Déconnexion</button>}
         </div>
      </header>

      <main className="flex-1 relative z-10 overflow-y-auto custom-scrollbar p-6">
        
        {/* STEP: DAILY CHECK */}
        {step === 'DAILY_CHECK' && (
            <div className="max-w-4xl mx-auto py-20 text-center space-y-10 animate-fadeIn">
                <div className="hud-card p-12 rounded-[3rem] bg-[#161616] border-gray-700 space-y-8">
                    <h2 className="text-6xl md:text-8xl font-bebas text-white uppercase"><span className="text-[var(--primary-gold)]">{profile.nom.split(' ')[0]}</span></h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left bg-black/30 p-8 rounded-3xl border border-gray-800">
                        <div>
                            <p className="text-[10px] font-mono text-gray-500 uppercase">Objectif</p>
                            <p className="text-xl font-bebas text-white">{profile.objectifPrincipal}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-mono text-gray-500 uppercase">Pathologies</p>
                            <p className="text-sm font-mono text-red-300">{profile.blessures_actives.join(', ') || 'Aucune'}</p>
                        </div>
                    </div>
                    <button onClick={handleStartWorkout} className="w-full py-8 bg-[var(--primary-gold)] text-black rounded-[2rem] font-bebas text-5xl hover:scale-105 transition-all uppercase">LANCER LE PROTOCOLE</button>
                </div>
            </div>
        )}

        {/* STEP: WARMUP */}
        {step === 'WARMUP' && currentWarmupPhase && (
            <div className="h-full flex flex-col items-center justify-center text-center animate-fadeIn">
                <p className="text-[10px] font-mono text-[var(--primary-teal)] uppercase tracking-[1em] mb-4 opacity-70">PHASE PRÉ-OPÉRATIONNELLE</p>
                <h2 className="text-6xl font-bebas text-white mb-6 max-w-3xl">{currentWarmupPhase.nom}</h2>
                <div className="w-64 h-64 rounded-full border-4 border-[var(--primary-teal)] flex items-center justify-center text-8xl font-bebas text-white bg-black/50 backdrop-blur mb-10">
                    {countdown}
                </div>
                <button onClick={handleAutoTransition} className="px-10 py-4 bg-gray-800 rounded-full font-bebas text-2xl text-white border border-gray-700 hover:border-[var(--primary-teal)] transition-all">PASSER ⮕</button>
            </div>
        )}

        {/* STEP: WORKOUT */}
        {step === 'WORKOUT' && workout && (
            <div className="max-w-7xl mx-auto h-full flex flex-col animate-fadeIn py-6">
                <div className="grid grid-cols-12 gap-6 flex-1">
                    {/* Panneau de statistiques - Gauche */}
                    <div className="col-span-12 lg:col-span-3">
                        <div className="bg-white rounded-2xl p-6 border border-[#007c89]/20 shadow-md h-full">
                            <h3 className="text-sm font-bebas text-[#181818] uppercase mb-4 tracking-wider">Statistiques</h3>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-[#007c89]/10 flex items-center justify-center">
                                        <span className="text-xl">💪</span>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-semibold text-[#6B7280] uppercase">Volume</p>
                                        <p className="text-lg font-bebas text-[#181818]">
                                            {sessionData.reduce((acc, curr) => acc + curr.volume, 0)} kg
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-[#007c89]/10 flex items-center justify-center">
                                        <span className="text-xl">📋</span>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-semibold text-[#6B7280] uppercase">Séries</p>
                                        <p className="text-lg font-bebas text-[#181818]">
                                            {sessionData.length}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-[#007c89]/10 flex items-center justify-center">
                                        <span className="text-xl">⏱️</span>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-semibold text-[#6B7280] uppercase">Effort</p>
                                        <p className="text-lg font-bebas text-[#181818]">
                                            {formatTime(sessionData.reduce((acc, curr) => acc + curr.effortTime, 0))}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-[#007c89]/10 flex items-center justify-center">
                                        <span className="text-xl">🔥</span>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-semibold text-[#6B7280] uppercase">Calories</p>
                                        <p className="text-lg font-bebas text-[#181818]">
                                            ~{Math.round(sessionData.reduce((acc, curr) => acc + curr.volume, 0) * 0.1)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contenu principal - Centre */}
                    <div className="col-span-12 lg:col-span-6 flex flex-col gap-6">
                        {/* Panneau de progression - Haut */}
                        <div className="bg-[#e0f4f6] rounded-2xl p-4 border border-[#007c89]/20 shadow-md">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div>
                                        <p className="text-[10px] font-semibold text-[#007c89] uppercase">Exercice</p>
                                        <p className="text-lg font-bebas text-[#181818]">
                                            {currentExoIndex + 1}/{workout.liste_exos.length}
                                        </p>
                                    </div>
                                    <div className="px-3 py-1 bg-[#FBBF24] rounded-full">
                                        <p className="text-[10px] font-semibold text-[#181818] uppercase">Série</p>
                                        <p className="text-sm font-bebas text-[#181818]">
                                            {currentSet}/{workout.liste_exos[currentExoIndex].sets}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-semibold text-[#007c89] uppercase">Temps</p>
                                    <p className="text-sm font-bebas text-[#181818]">
                                        {formatTime(sessionData.reduce((acc, curr) => acc + curr.effortTime, 0))} / ~40 min
                                    </p>
                                </div>
                            </div>
                    </div>
                    
                        {/* Titre de l'exercice */}
                        <div className="bg-white rounded-2xl p-6 border border-[#007c89]/20 shadow-md">
                            <h2 className="text-3xl md:text-4xl font-bebas text-[#181818] uppercase mb-2">
                                {workout.liste_exos[currentExoIndex].nom}
                            </h2>
                            <p className="text-sm text-[#6B7280] font-mono">
                                {workout.liste_exos[currentExoIndex].description}
                            </p>
                        </div>
                        
                        {/* Timer principal - Centre */}
                        <div className={`flex-1 rounded-2xl flex flex-col items-center justify-center transition-all ${
                            isResting 
                                ? 'bg-[#e0f4f6] border-2 border-[#007c89]' 
                                : 'bg-[#FBBF24] border-2 border-[#FBBF24]'
                        } shadow-lg`}>
                            <p className="text-xs font-semibold text-[#181818] uppercase tracking-widest mb-2">
                                {isResting ? 'RÉCUPÉRATION' : 'TEMPS D\'EFFORT'}
                            </p>
                            <span className="text-7xl md:text-8xl font-bebas text-[#181818] tabular-nums mb-4">
                                {formatTime(countdown)}
                            </span>
                            {isResting && (
                                <button 
                                    onClick={() => { setIsResting(false); setCountdown(0); }} 
                                    className="px-6 py-2 bg-[#007c89] text-white font-bebas rounded-full text-sm hover:bg-[#006a75] transition-all"
                                >
                                    SKIP REPOS
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Panneau de contrôle - Droite */}
                    <div className="col-span-12 lg:col-span-3">
                        <div className="bg-[#e0f4f6] rounded-2xl p-6 border border-[#007c89]/20 shadow-md h-full flex flex-col justify-between">
                            {/* Contrôle du poids */}
                            <div>
                                <p className="text-xs font-semibold text-[#007c89] uppercase mb-4">Poids</p>
                                <div className="flex items-center justify-center gap-4 bg-white rounded-xl p-4 border border-[#007c89]/20">
                                    <button 
                                        onClick={() => setCurrentKg(Math.max(0, currentKg - 2.5))} 
                                        className="w-10 h-10 rounded-lg border-2 border-[#007c89] text-2xl text-[#007c89] hover:bg-[#007c89] hover:text-white transition-all flex items-center justify-center font-bold"
                                    >
                                        −
                                    </button>
                                    <div className="text-center min-w-[80px]">
                                        <span className="text-4xl font-bebas text-[#181818] tabular-nums">{currentKg}</span>
                                        <p className="text-[10px] font-semibold text-[#6B7280] uppercase">KG</p>
                                    </div>
                                    <button 
                                        onClick={() => setCurrentKg(currentKg + 2.5)} 
                                        className="w-10 h-10 rounded-lg border-2 border-[#007c89] text-2xl text-[#007c89] hover:bg-[#007c89] hover:text-white transition-all flex items-center justify-center font-bold"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            {/* Boutons d'action */}
                            <div className="space-y-3 mt-6">
                                <button 
                                    onClick={() => setConfirmSwapModal(true)} 
                                    className="w-full py-3 bg-white text-[#007c89] border-2 border-[#007c89] rounded-xl font-bebas text-sm uppercase hover:bg-[#007c89] hover:text-white transition-all"
                                >
                                    Remplacer
                                </button>
                                <button 
                                    onClick={() => !isResting && validateSet()} 
                                    disabled={isResting} 
                                    className={`w-full py-3 rounded-xl font-bebas text-sm uppercase transition-all ${
                                        isResting 
                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                                            : 'bg-[#FBBF24] text-[#181818] hover:bg-[#F59E0B] hover:scale-105'
                                    }`}
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
                <p className="text-[10px] font-mono text-[var(--primary-silver)] uppercase tracking-[1em] mb-4 opacity-70">RÉCUPÉRATION FINALE</p>
                <h2 className="text-6xl font-bebas text-white mb-6 max-w-3xl">{workout?.etirements[currentPhaseIndex]?.nom || "Terminé"}</h2>
                <div className="w-64 h-64 rounded-full border-4 border-white/10 flex items-center justify-center text-8xl font-bebas text-white bg-black/50 backdrop-blur mb-10">
                    {countdown}
                </div>
                <button onClick={handleAutoTransition} className="px-10 py-4 bg-gray-800 rounded-full font-bebas text-2xl text-white border border-gray-700 hover:border-white transition-all">TERMINER ⮕</button>
            </div>
        )}

        {/* STEP: DASHBOARD */}
        {step === 'DASHBOARD' && (
            <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn pb-20">
                <h2 className="text-5xl font-bebas text-white uppercase text-center">Données Vectorielles</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="hud-card p-6 rounded-3xl h-[300px] border-gray-700">
                      <p className="text-[10px] font-mono text-gray-500 uppercase mb-4">Volume Entraînement</p>
                      <ResponsiveContainer width="100%" height="90%">
                          <AreaChart data={(profile.historique_dates || []).map((d, i) => ({ date: d, v: (profile.historique_volume || [])[i] || 0 }))}>
                             <Area type="monotone" dataKey="v" stroke="#FFD700" fill="rgba(255, 215, 0, 0.1)" />
                             <CartesianGrid stroke="#333" vertical={false} />
                             <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #333' }} />
                          </AreaChart>
                      </ResponsiveContainer>
                   </div>
                   <div className="hud-card p-6 rounded-3xl h-[300px] border-gray-700">
                      <p className="text-[10px] font-mono text-blue-400 uppercase mb-4">Progression Objectif ({profile.activeGoal?.currentValue}%)</p>
                      <ResponsiveContainer width="100%" height="90%">
                          <LineChart data={profile.activeGoal?.history || []}>
                             <Line type="step" dataKey="value" stroke="#3B82F6" strokeWidth={3} dot={{r:4}} />
                             <YAxis domain={[0, 100]} hide />
                          </LineChart>
                      </ResponsiveContainer>
                   </div>
                </div>

                <div className="hud-card p-8 rounded-[2.5rem] bg-black/40 flex flex-col md:flex-row gap-8 items-center justify-between border-gray-800">
                    <div className="text-center md:text-left">
                        <p className="text-[9px] font-mono text-gray-500 uppercase tracking-widest mb-1">Dernier Conseil IA</p>
                        <p className="text-lg md:text-xl text-[var(--primary-gold)] font-light italic leading-relaxed">
                            {profile.dernier_feedback_ia || "Système en attente de données post-op."}
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <div className="text-center border-l border-gray-800 pl-6">
                            <p className="text-[9px] font-mono text-gray-500 uppercase tracking-widest mb-1">Sessions</p>
                            <p className="text-4xl font-bebas text-white">{(profile.sessionRecords || []).length}</p>
                        </div>
                        <div className="text-center border-l border-gray-800 pl-6">
                            <p className="text-[9px] font-mono text-gray-500 uppercase tracking-widest mb-1">Max Tonnage</p>
                            <p className="text-4xl font-bebas text-white">
                                {(profile.historique_volume || []).length > 0 ? Math.max(...profile.historique_volume) : 0}
                            </p>
                        </div>
                    </div>
                </div>

                <button onClick={() => setStep('DAILY_CHECK')} className="w-full py-6 bg-white text-black font-bebas text-3xl rounded-2xl uppercase hover:bg-[var(--primary-gold)] transition-colors">Retour</button>
            </div>
        )}

        {/* STEP: DEBRIEF & FINAL */}
        {(step === 'DEBRIEF' || step === 'FINAL') && (
            <div className="max-w-3xl mx-auto py-20 animate-fadeIn">
               <div className="hud-card p-10 rounded-[3rem] bg-[#161616] space-y-8 text-center border-gray-700">
                   <h2 className="text-5xl font-bebas text-[var(--primary-gold)] uppercase">{step === 'DEBRIEF' ? 'ANALYSE TERMINÉE' : 'MISSION ACCOMPLIE'}</h2>
                   <div className="bg-black/40 p-6 rounded-2xl border border-gray-800">
                       <p className="text-gray-300 font-light leading-relaxed whitespace-pre-wrap">{aiFeedback || profile.dernier_feedback_ia}</p>
                   </div>
                   {step === 'DEBRIEF' ? (
                       <button onClick={archiveAndExit} className="w-full py-6 bg-[var(--primary-gold)] text-black font-bebas text-3xl rounded-2xl uppercase hover:scale-105 transition-transform">ARCHIVER SESSION</button>
                   ) : (
                       <button onClick={() => setStep('DASHBOARD')} className="w-full py-6 bg-gray-800 text-white font-bebas text-3xl rounded-2xl uppercase hover:bg-white hover:text-black transition-colors">VOIR STATISTIQUES</button>
                   )}
               </div>
            </div>
        )}
      </main>

      {/* MODALE SWAP EXERCISE */}
      {confirmSwapModal && (
          <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-6">
             <div className="hud-card p-8 rounded-3xl max-w-sm w-full text-center space-y-6 border-gray-700">
                <h3 className="font-bebas text-3xl text-white">REMPLACER EXERCICE ?</h3>
                <p className="text-gray-400 text-xs font-mono">L'IA va chercher une alternative compatible avec vos blessures.</p>
                <div className="flex gap-4">
                   <button onClick={() => setConfirmSwapModal(false)} className="flex-1 py-3 bg-gray-900 text-gray-500 rounded-xl hover:text-white">ANNULER</button>
                   <button onClick={handleSwapExercise} className="flex-1 py-3 bg-white text-black font-bebas text-xl rounded-xl hover:bg-[var(--primary-gold)]">CONFIRMER</button>
                </div>
             </div>
          </div>
      )}

      {/* LOADER IA GLOBAL */}
      {isTyping && (
        <div className="fixed inset-0 z-[1000] bg-black/95 flex flex-col items-center justify-center backdrop-blur-md">
           <div className="w-16 h-16 border-4 border-[var(--primary-teal)] border-t-transparent rounded-full animate-spin mb-6" />
           <p className="font-bebas text-2xl text-white tracking-[0.5em] animate-pulse">TRAITEMENT NEURAL...</p>
        </div>
      )}
    </div>
  );
};

