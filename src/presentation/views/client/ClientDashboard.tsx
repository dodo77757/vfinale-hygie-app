import React, { useMemo, useState } from 'react';
import { UserProfile, PlannedSession } from '../../../../types';
import { GoalTracker } from '../../../../components/GoalTracker';
import { RecoveryJournal } from '../../../../components/RecoveryJournal';
import { getDayType, getTodayPlannedSession, getYesterdayMissedSession } from '../../../../utils/sessionDetection';
import { StorageService } from '../../../../services/storageService';
import { toast } from 'sonner';
import { deduplicateSessions, isSameDay } from '../../../../utils/sessionUtils';
import { ClientHealthHub } from './ClientHealthHub';

interface ClientDashboardProps {
  profile: UserProfile;
  onStartWorkout: (plannedSession?: PlannedSession, isFreeSession?: boolean) => void;
  onUpdateProfile: (updatedProfile: UserProfile) => void;
  programProgress: number;
}

export const ClientDashboard: React.FC<ClientDashboardProps> = ({
  profile,
  onStartWorkout,
  onUpdateProfile,
  programProgress
}) => {
  // Dédupliquer les séances planifiées AVANT toute utilisation
  const deduplicatedPlannedSessions = useMemo(() => {
    if (!profile.plannedSessions || profile.plannedSessions.length === 0) return [];
    return deduplicateSessions(profile.plannedSessions);
  }, [profile.plannedSessions]);

  // Créer un profil temporaire avec les séances dédupliquées pour les fonctions utilitaires
  const profileWithDeduplicatedSessions = useMemo(() => ({
    ...profile,
    plannedSessions: deduplicatedPlannedSessions
  }), [profile, deduplicatedPlannedSessions]);

  const dayInfo = getDayType(profileWithDeduplicatedSessions);
  const todaySession = getTodayPlannedSession(profileWithDeduplicatedSessions);
  const yesterdaySession = getYesterdayMissedSession(profileWithDeduplicatedSessions);

  // Vérifier s'il y a une séance complétée cette semaine
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayOfWeek = today.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() + diff);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  // Récupérer le nombre de séances autorisées par semaine selon le programme actif
  const sessionsPerWeek = profile.activeProgram?.sessionsPerWeek || 1;

  // Compter les sessions complétées dans la semaine (hors aujourd'hui)
  const completedSessionsThisWeek = (profile.sessionRecords || []).filter(sr => {
    const srDate = new Date(sr.date);
    srDate.setHours(0, 0, 0, 0);
    return srDate >= weekStart && srDate <= weekEnd && !isSameDay(srDate, today);
  }).length;

  // Compter les sessions planifiées dans la semaine (hors aujourd'hui, non complétées)
  const otherPlannedSessionsThisWeek = deduplicatedPlannedSessions.filter(ps => {
    const psDate = new Date(ps.date);
    psDate.setHours(0, 0, 0, 0);
    const isToday = isSameDay(psDate, today);
    const isInWeek = psDate >= weekStart && psDate <= weekEnd;
    const isCompleted = ps.status === 'completed';
    return !isToday && isInWeek && !isCompleted;
  }).length;

  // Total de séances dans la semaine (hors celle d'aujourd'hui)
  const totalOtherSessionsThisWeek = completedSessionsThisWeek + otherPlannedSessionsThisWeek;

  // Afficher un avertissement seulement si le quota hebdomadaire est atteint ou dépassé
  const showWarning = totalOtherSessionsThisWeek >= sessionsPerWeek;

  const [showHealthHub, setShowHealthHub] = useState(false);

  // Calculer les jours de la semaine avec statut
  const weekDays = useMemo(() => {
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    const weekDaysData = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      const dayName = days[date.getDay()];
      const isToday = isSameDay(date, today);
      
      // Vérifier si une séance est complétée ce jour
      const hasCompletedSession = profile.sessionRecords?.some(sr => {
        const srDate = new Date(sr.date);
        srDate.setHours(0, 0, 0, 0);
        return isSameDay(srDate, date);
      });
      
      // Vérifier si une séance est planifiée ce jour
      const hasPlannedSession = deduplicatedPlannedSessions.some(ps => {
        const psDate = new Date(ps.date);
        psDate.setHours(0, 0, 0, 0);
        return isSameDay(psDate, date) && ps.status !== 'completed';
      });
      
      weekDaysData.push({
        label: i === 0 ? 'Aujourd\'hui' : dayName,
        date,
        isToday,
        isCompleted: hasCompletedSession,
        isPlanned: hasPlannedSession && !hasCompletedSession,
        isPast: date < today
      });
    }
    
    return weekDaysData;
  }, [weekStart, today, profile.sessionRecords, deduplicatedPlannedSessions]);

  // Toggle between classic dashboard and health hub
  if (showHealthHub) {
    return (
      <div>
        <button
          onClick={() => setShowHealthHub(false)}
          className="mb-6 px-4 py-2 bg-white text-[#007c89] border-2 border-[#007c89] rounded-full hover:bg-[#007c89] hover:text-white transition-all text-sm font-medium"
        >
          ← Retour au Dashboard
        </button>
        <ClientHealthHub 
          profile={profile} 
          onStartWorkout={() => {
            setShowHealthHub(false);
            onStartWorkout();
          }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12 space-y-8">
      {/* Welcome Header - Design Moderne */}
      <div className="space-y-2">
        <h1 className="text-4xl md:text-5xl font-bold text-[#1F2937] leading-tight tracking-tight">
          Bonjour, <span className="text-[#007c89]">{profile?.nom?.split(' ')[0] || 'Champion'}</span>
        </h1>
        <p className="text-base md:text-lg text-[#6B7280] font-normal">
          {profile?.objectifPrincipal || 'Prêt à progresser ?'}
        </p>
      </div>

      {/* Section Progression / Streak - Nouvelle Carte Inspirée Hihealth */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] border border-[#E5E7EB]/50">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-[#1F2937] mb-1">
              {profile?.currentStreak || 0} Jours de Série
            </h2>
            <p className="text-sm text-[#6B7280] font-normal">
              Vous êtes sur la bonne voie, {profile?.nom?.split(' ')[0] || 'Champion'} ! 🔥
            </p>
          </div>
          {profile?.currentStreak && profile.currentStreak > 0 && (
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#F97316] to-[#EC4899] flex items-center justify-center shadow-lg">
              <span className="text-2xl">🔥</span>
            </div>
          )}
        </div>
        
        {/* Indicateurs Circulaires pour les 7 Jours */}
        <div className="flex items-center justify-between gap-2 mb-6">
          {weekDays.map((day, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center gap-2">
              <div
                className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center text-xs md:text-sm font-semibold transition-all ${
                  day.isCompleted
                    ? 'bg-gradient-to-br from-[#F97316] to-[#EC4899] text-white shadow-md scale-110'
                    : day.isToday
                    ? 'bg-gradient-to-br from-[#007c89] to-[#006a75] text-white shadow-md scale-110 border-2 border-white'
                    : day.isPlanned
                    ? 'bg-gradient-to-br from-[#FCD34D] to-[#FBBF24] text-[#1F2937] shadow-sm'
                    : day.isPast
                    ? 'bg-[#F3F4F6] text-[#9CA3AF]'
                    : 'bg-[#F9FAFB] text-[#D1D5DB] border-2 border-[#E5E7EB]'
                }`}
              >
                {day.isCompleted ? '✓' : day.isToday ? 'Aujourd\'hui' : day.label.slice(0, 3)}
              </div>
              <p className={`text-[10px] md:text-xs font-medium text-center ${
                day.isToday ? 'text-[#007c89] font-semibold' : 'text-[#6B7280]'
              }`}>
                {day.label}
              </p>
            </div>
          ))}
        </div>

        {/* Boutons d'action */}
        {dayInfo.type === 'session_planned' && todaySession && (
          <button
            onClick={() => onStartWorkout(todaySession, false)}
            disabled={profile.programStatus !== 'ready' && !todaySession.workoutPlan}
            className={`w-full py-4 rounded-full font-semibold text-base transition-all duration-200 ${
              profile.programStatus !== 'ready' && !todaySession.workoutPlan
                ? 'bg-[#E5E7EB] text-[#9CA3AF] cursor-not-allowed'
                : 'bg-gradient-to-r from-[#F97316] to-[#EC4899] text-white hover:shadow-lg hover:scale-[1.02] shadow-md'
            }`}
          >
            {profile.programStatus === 'generating' ? 'Programme en création...' : 'Commencer votre séance'}
          </button>
        )}
      </div>

      {/* Carte "SÉANCE DU JOUR" - Hero Section avec Dégradé Doux */}
      {dayInfo.type === 'session_planned' && todaySession && (
        <div className="relative overflow-hidden rounded-3xl shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)]">
          {/* Dégradé de fond doux (orange pêche vers rose) */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#FED7AA] via-[#FBCFE8] to-[#FDE68A] opacity-60"></div>
          <div className="relative bg-white/90 backdrop-blur-sm p-8 md:p-10 border border-white/50">
            <div className="mb-6">
              <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-3">
                Séance du jour
              </p>
              <h2 className="text-3xl md:text-4xl font-bold text-[#1F2937] leading-tight mb-2">
                {todaySession.notes || profile.activeProgram?.name || 'Séance planifiée'}
              </h2>
              <p className="text-base text-[#6B7280] font-normal">
                {new Date(todaySession.date).toLocaleDateString('fr-FR', { 
                  weekday: 'long', 
                  day: 'numeric', 
                  month: 'long' 
                })}
              </p>
            </div>
            
            <button
              onClick={() => onStartWorkout(todaySession, false)}
              disabled={profile.programStatus !== 'ready' && !todaySession.workoutPlan}
              className={`w-full py-5 rounded-full font-semibold text-lg transition-all duration-200 ${
                profile.programStatus !== 'ready' && !todaySession.workoutPlan
                  ? 'bg-[#E5E7EB] text-[#9CA3AF] cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#F97316] to-[#EC4899] text-white hover:shadow-xl hover:scale-[1.02] shadow-lg'
              }`}
            >
              {profile.programStatus === 'generating'
              ? 'Programme en création...'
              : 'Lancer la séance planifiée →'}
            </button>
          </div>
        </div>
      )}

      {/* Message d'Alerte Subtile */}
      {showWarning && (
        <div className="bg-gradient-to-br from-[#FEF3C7] to-white rounded-3xl p-6 border border-[#FCD34D]/30 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)]">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FBBF24] to-[#F59E0B] flex items-center justify-center flex-shrink-0 shadow-sm">
              <span className="text-lg">⚠️</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-[#1F2937] mb-1">Information</p>
              <p className="text-sm text-[#6B7280] leading-relaxed">
                {totalOtherSessionsThisWeek >= sessionsPerWeek
                  ? `Vous avez déjà ${totalOtherSessionsThisWeek} séance${totalOtherSessionsThisWeek > 1 ? 's' : ''} cette semaine. Votre programme autorise ${sessionsPerWeek} séance${sessionsPerWeek > 1 ? 's' : ''} par semaine.`
                  : `Vous avez ${totalOtherSessionsThisWeek} autre${totalOtherSessionsThisWeek > 1 ? 's' : ''} séance${totalOtherSessionsThisWeek > 1 ? 's' : ''} cette semaine.`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Cas B : Séance manquée hier */}
      {dayInfo.type === 'session_missed' && yesterdaySession && (
        <div className="bg-gradient-to-br from-[#FEF3C7] to-white rounded-3xl p-8 border border-[#FCD34D]/30 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)]">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FBBF24] to-[#F59E0B] flex items-center justify-center shadow-md">
              <span className="text-xl">⏰</span>
            </div>
            <div>
              <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-1">Retard détecté</p>
              <p className="text-lg font-semibold text-[#1F2937]">
                Une séance était prévue hier
              </p>
            </div>
          </div>
          <button
            onClick={() => onStartWorkout(yesterdaySession, false)}
            className="w-full py-5 bg-gradient-to-r from-[#F97316] to-[#EC4899] text-white rounded-full font-semibold text-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-200 shadow-lg"
          >
            Rattraper la séance d'hier →
          </button>
        </div>
      )}

      {/* Cas C : Jour de repos */}
      {dayInfo.type === 'rest_day' && (
        <div className="bg-white rounded-3xl p-8 border border-[#E5E7EB]/50 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)]">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#E5E7EB] to-[#D1D5DB] flex items-center justify-center">
              <span className="text-xl">😌</span>
            </div>
            <div>
              <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-1">Jour de repos</p>
              <p className="text-lg font-semibold text-[#1F2937]">
                Aucune séance planifiée aujourd'hui
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => toast.info("Fonctionnalité à venir : Séance d'étirements guidée")}
              className="py-5 bg-gradient-to-br from-[#A78BFA] to-[#8B5CF6] text-white rounded-2xl font-semibold hover:shadow-lg hover:scale-[1.02] transition-all duration-200 shadow-md"
            >
              Étirements
            </button>
            <button
              onClick={() => toast.info("Fonctionnalité à venir : Session de méditation")}
              className="py-5 bg-gradient-to-br from-[#60A5FA] to-[#3B82F6] text-white rounded-2xl font-semibold hover:shadow-lg hover:scale-[1.02] transition-all duration-200 shadow-md"
            >
              Méditation
            </button>
            <button
              onClick={() => onStartWorkout(undefined, true)}
              className="py-5 bg-gradient-to-br from-[#FCD34D] to-[#FBBF24] text-[#1F2937] rounded-2xl font-semibold hover:shadow-lg hover:scale-[1.02] transition-all duration-200 shadow-md"
            >
              Séance Libre
            </button>
          </div>
        </div>
      )}

      {/* Programme Actif - Carte Moderne */}
      {profile?.activeProgram && (
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#E5E7EB]/50 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-2">Programme Actif</p>
              <h3 className="text-2xl md:text-3xl font-bold text-[#1F2937] mb-2">
                {profile.activeProgram.name || 'Programme personnalisé'}
              </h3>
              <p className="text-sm text-[#6B7280] font-normal">
                Semaine {profile.activeProgram.currentWeek} / {profile.activeProgram.duration} • 
                Séance {profile.activeProgram.currentSession} / {profile.activeProgram.sessionsPerWeek}
              </p>
            </div>
          </div>
          
          {/* Barre de progression moderne */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-[#6B7280]">Progression</span>
              <span className="text-sm font-bold text-[#1F2937]">{Math.round(programProgress)}%</span>
            </div>
            <div className="w-full h-3 bg-[#F3F4F6] rounded-full overflow-hidden shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-[#F97316] to-[#EC4899] rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${Math.min(programProgress, 100)}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#FEF3C7] to-white border border-[#FCD34D]/20">
              <p className="text-xs font-semibold text-[#6B7280] uppercase mb-1">Phase</p>
              <p className="text-base font-semibold text-[#1F2937]">
                {(profile.activeProgram?.currentWeek || 0) <= 4 ? 'Adaptation' :
                 (profile.activeProgram?.currentWeek || 0) <= 10 ? 'Développement' :
                 (profile.activeProgram?.currentWeek || 0) <= 16 ? 'Intensification' :
                 (profile.activeProgram?.currentWeek || 0) <= 20 ? 'Spécialisation' : 'Consolidation'}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#DBEAFE] to-white border border-[#60A5FA]/20">
              <p className="text-xs font-semibold text-[#6B7280] uppercase mb-1">Focus Semaine</p>
              <p className="text-base font-semibold text-[#1F2937]">
                {profile.activeProgram?.weeks?.find(w => w.weekNumber === profile.activeProgram?.currentWeek)?.focus || 'N/A'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Liste des Séances à Venir - Redessinée */}
      {deduplicatedPlannedSessions && deduplicatedPlannedSessions.length > 0 && (() => {
        const upcomingSessions = deduplicatedPlannedSessions
          .filter(ps => {
            const psDate = new Date(ps.date);
            psDate.setHours(0, 0, 0, 0);
            return psDate > today;
          })
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .slice(0, 3);

        if (upcomingSessions.length === 0) return null;

        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-[#1F2937] mb-2">Prochaines séances</h3>
            <div className="space-y-3">
              {upcomingSessions.map((session) => {
                const sessionDate = new Date(session.date);
                const isThisWeek = sessionDate >= weekStart && sessionDate <= weekEnd;
                
                return (
                  <div
                    key={session.id}
                    className="bg-white rounded-2xl p-5 border border-[#E5E7EB]/50 shadow-[0_4px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.06)] transition-all duration-200 hover:scale-[1.01]"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-base font-bold text-[#1F2937] mb-1">
                          {sessionDate.toLocaleDateString('fr-FR', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long'
                          })}
                        </p>
                        {session.notes && (
                          <p className="text-sm text-[#6B7280] font-normal">{session.notes}</p>
                        )}
                        {profile.activeProgram && (
                          <p className="text-xs text-[#6B7280] font-normal mt-1">
                            {profile.activeProgram.name}
                          </p>
                        )}
                      </div>
                      <div className={`w-3 h-3 rounded-full ${
                        isThisWeek ? 'bg-gradient-to-br from-[#F97316] to-[#EC4899]' : 'bg-[#E5E7EB]'
                      }`}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Suivi des objectifs */}
      {profile?.activeGoal && (
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#E5E7EB]/50 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)]">
          <GoalTracker profile={profile} />
        </div>
      )}

      {/* Journal de récupération */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#E5E7EB]/50 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)]">
        <RecoveryJournal
          profile={profile}
          onSave={(entry) => {
            const updatedProfile: UserProfile = {
              ...profile,
              recoveryJournal: [...(profile?.recoveryJournal || []), entry]
            };
            const newList = StorageService.updateClient(updatedProfile);
            onUpdateProfile(updatedProfile);
          }}
        />
      </div>
    </div>
  );
};
