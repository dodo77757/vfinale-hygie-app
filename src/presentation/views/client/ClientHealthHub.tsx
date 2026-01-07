import React, { useState, useMemo } from 'react';
import { UserProfile, PlannedSession } from '../../../../types';
import { getDayType, getTodayPlannedSession } from '../../../../utils/sessionDetection';
import { deduplicateSessions, isSameDay } from '../../../../utils/sessionUtils';
import { getWeekScheme } from '../../../domain/rules/ProgressionRules';

interface ClientHealthHubProps {
  profile: UserProfile;
  onStartWorkout?: (plannedSession?: PlannedSession, isFreeSession?: boolean) => void;
}

export const ClientHealthHub: React.FC<ClientHealthHubProps> = ({
  profile,
  onStartWorkout
}) => {
  const [height, setHeight] = useState(profile.taille ? profile.taille.replace(/\D/g, '') : '');
  const [currentWeight, setCurrentWeight] = useState(profile.poids ? profile.poids.replace(/\D/g, '') : '');
  
  // Dédupliquer les séances
  const deduplicatedPlannedSessions = useMemo(() => {
    if (!profile.plannedSessions || profile.plannedSessions.length === 0) return [];
    return deduplicateSessions(profile.plannedSessions);
  }, [profile.plannedSessions]);

  const profileWithDeduplicatedSessions = useMemo(() => ({
    ...profile,
    plannedSessions: deduplicatedPlannedSessions
  }), [profile, deduplicatedPlannedSessions]);

  const dayInfo = getDayType(profileWithDeduplicatedSessions);
  const todaySession = getTodayPlannedSession(profileWithDeduplicatedSessions);

  // Calculate BMI
  const calculateBMI = () => {
    if (!height || !currentWeight) return null;
    const heightInMeters = parseFloat(height) / 100;
    const weightInKg = parseFloat(currentWeight);
    if (heightInMeters > 0 && weightInKg > 0) {
      return (weightInKg / (heightInMeters * heightInMeters)).toFixed(1);
    }
    return null;
  };

  const bmi = calculateBMI();
  const currentStreak = profile?.currentStreak || 0;
  const weekScheme = profile?.activeProgram ? getWeekScheme(profile.activeProgram.currentWeek) : null;

  // Calculer les jours de la semaine
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayOfWeek = today.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() + diff);
  weekStart.setHours(0, 0, 0, 0);

  const weekDays = useMemo(() => {
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    const weekDaysData = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      const dayName = days[date.getDay()];
      const isToday = isSameDay(date, today);
      
      const hasCompletedSession = profile.sessionRecords?.some(sr => {
        const srDate = new Date(sr.date);
        srDate.setHours(0, 0, 0, 0);
        return isSameDay(srDate, date);
      });
      
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

  // Calculer les macros (estimation basée sur le poids)
  const calculateMacros = () => {
    if (!currentWeight) return null;
    const weight = parseFloat(currentWeight);
    return {
      protein: Math.round(weight * 2), // 2g par kg
      fats: Math.round(weight * 1), // 1g par kg
      carbs: Math.round(weight * 3) // 3g par kg
    };
  };

  const macros = calculateMacros();

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative px-6 md:px-12 lg:px-20 py-16 md:py-24 overflow-hidden bg-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Text Content */}
          <div className="space-y-6 z-10">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-[#1F2937] leading-[1.1] tracking-[-0.02em]">
              Votre santé.<br />
              <span className="bg-gradient-to-r from-[#F97316] to-[#EC4899] bg-clip-text text-transparent">Votre façon.</span>
            </h1>
            
            <p className="text-base md:text-lg text-[#6B7280] leading-[1.6] max-w-xl font-normal">
              De la force à la mobilité, nous rendons votre programme simple, personnalisé et adapté à vous.
            </p>

            {/* Programme Info */}
            {profile?.activeProgram && (
              <div className="p-6 rounded-2xl bg-gradient-to-br from-[#FEF3C7] to-white border border-[#FCD34D]/30 shadow-sm">
                <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-2">Programme Actif</p>
                <p className="text-xl font-bold text-[#1F2937] mb-1">{profile.activeProgram.name}</p>
                <p className="text-sm text-[#6B7280]">
                  Semaine {profile.activeProgram.currentWeek} / {profile.activeProgram.duration}
                </p>
              </div>
            )}
          </div>

          {/* Right: Image Placeholder with Gradient Overlay */}
          <div className="relative h-[500px] md:h-[600px] rounded-3xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#FED7AA]/40 via-[#FBCFE8]/40 to-[#FDE68A]/40"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-64 h-64 rounded-full bg-gradient-to-br from-[#F97316] to-[#EC4899] opacity-20 blur-3xl"></div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="text-6xl">💪</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Section */}
      <section className="px-6 md:px-12 lg:px-20 py-12 bg-[#F9FAFB]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-12">
              {/* Programme Details */}
              {profile?.activeProgram && weekScheme && (
                <div className="bg-white rounded-3xl p-8 border border-[#E5E7EB]/50 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)]">
                  <h2 className="text-3xl md:text-4xl font-bold text-[#1F2937] mb-6 tracking-tight">
                    Votre programme personnalisé
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-5 rounded-2xl bg-gradient-to-br from-[#FEF3C7] to-white border border-[#FCD34D]/20">
                      <p className="text-xs font-semibold text-[#6B7280] uppercase mb-2">Objectif RPE</p>
                      <p className="text-3xl font-bold text-[#1F2937]">{weekScheme.rpe}/10</p>
                    </div>
                    <div className="p-5 rounded-2xl bg-gradient-to-br from-[#DBEAFE] to-white border border-[#60A5FA]/20">
                      <p className="text-xs font-semibold text-[#6B7280] uppercase mb-2">Séries × Répétitions</p>
                      <p className="text-3xl font-bold text-[#1F2937]">{weekScheme.sets}×{weekScheme.reps}</p>
                    </div>
                    <div className="p-5 rounded-2xl bg-gradient-to-br from-[#FCE7F3] to-white border border-[#EC4899]/20">
                      <p className="text-xs font-semibold text-[#6B7280] uppercase mb-2">Repos</p>
                      <p className="text-3xl font-bold text-[#1F2937]">{weekScheme.restSeconds}s</p>
                    </div>
                  </div>
                  <p className="text-sm text-[#6B7280] mt-6 font-normal">
                    Phase: {weekScheme.phase}
                  </p>
                </div>
              )}

              {/* Séance du Jour */}
              {dayInfo.type === 'session_planned' && todaySession && (
                <div className="bg-gradient-to-br from-[#FED7AA] via-[#FBCFE8] to-[#FDE68A] rounded-3xl p-8 border border-white/50 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)]">
                  <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-3">Séance du jour</p>
                  <h3 className="text-2xl md:text-3xl font-bold text-[#1F2937] mb-6">
                    {todaySession.notes || profile.activeProgram?.name || 'Séance planifiée'}
                  </h3>
                  <button
                    onClick={() => onStartWorkout && onStartWorkout(todaySession, false)}
                    className="w-full py-5 bg-gradient-to-r from-[#F97316] to-[#EC4899] text-white rounded-full font-semibold text-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-200 shadow-lg"
                  >
                    Commencer la séance →
                  </button>
                </div>
              )}

              {/* Quote Section */}
              <div className="text-center py-12">
                <p className="text-2xl md:text-3xl lg:text-4xl font-semibold text-[#1F2937] leading-[1.3] tracking-tight">
                  L'avenir n'est pas dans les voitures ou les montres.<br />
                  <span className="bg-gradient-to-r from-[#F97316] to-[#EC4899] bg-clip-text text-transparent">C'est votre énergie, votre focus, et votre longévité.</span>
                </p>
              </div>
            </div>

            {/* Right Sidebar: Interactive Tools */}
            <div className="lg:col-span-1 space-y-6">
              {/* Interactive Tools Card */}
              <div className="p-6 rounded-3xl border border-[#E5E7EB]/50 bg-white shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)]">
                <h3 className="text-lg font-bold text-[#1F2937] mb-4">Outils interactifs</h3>
                <p className="text-sm text-[#6B7280] leading-relaxed mb-6 font-normal">
                  Vérifiez votre IMC pour commencer et voyez combien vous pourriez perdre.
                </p>
                
                {/* BMI Calculator */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-[#1F2937] mb-2">
                      Quelle est votre taille actuelle ?
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={height}
                        onChange={(e) => setHeight(e.target.value)}
                        placeholder="0"
                        className="w-full px-4 py-3 rounded-xl border-2 border-[#E5E7EB] focus:border-[#007c89] focus:outline-none text-lg font-medium pr-12"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7280] font-medium">Cm</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-[#1F2937] mb-2">
                      Quel est votre poids actuel ?
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={currentWeight}
                        onChange={(e) => setCurrentWeight(e.target.value)}
                        placeholder="0"
                        className="w-full px-4 py-3 rounded-xl border-2 border-[#E5E7EB] focus:border-[#007c89] focus:outline-none text-lg font-medium pr-12"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7280] font-medium">Kg</span>
                    </div>
                  </div>
                  
                  {bmi && (
                    <div className="p-4 rounded-xl bg-gradient-to-br from-[#FEF3C7] to-white border border-[#FCD34D]/30">
                      <p className="text-xs font-semibold text-[#6B7280] uppercase mb-1">Votre IMC</p>
                      <p className="text-3xl font-bold text-[#1F2937]">{bmi}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Macros Card */}
              {macros && (
                <div className="p-6 rounded-3xl border border-[#E5E7EB]/50 bg-white shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)]">
                  <h3 className="text-lg font-bold text-[#1F2937] mb-4">Macros recommandés</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-br from-[#FEE2E2] to-white border border-[#FCA5A5]/20">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">❤️</span>
                        <span className="text-sm font-semibold text-[#1F2937]">Protéines</span>
                      </div>
                      <span className="text-lg font-bold text-[#1F2937]">{macros.protein}g</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-br from-[#FEF3C7] to-white border border-[#FCD34D]/20">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">💧</span>
                        <span className="text-sm font-semibold text-[#1F2937]">Lipides</span>
                      </div>
                      <span className="text-lg font-bold text-[#1F2937]">{macros.fats}g</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-br from-[#E5E7EB] to-white border border-[#D1D5DB]/20">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">🍞</span>
                        <span className="text-sm font-semibold text-[#1F2937]">Glucides</span>
                      </div>
                      <span className="text-lg font-bold text-[#1F2937]">{macros.carbs}g</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Program Description */}
              <div className="p-6 rounded-3xl border border-[#E5E7EB]/50 bg-white shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)]">
                <h3 className="text-xl font-bold text-[#1F2937] mb-2">Pas un programme.</h3>
                <h3 className="text-xl font-bold bg-gradient-to-r from-[#F97316] to-[#EC4899] bg-clip-text text-transparent mb-4">Votre programme.</h3>
                <p className="text-sm text-[#6B7280] leading-relaxed font-normal">
                  Des professionnels agréés créent un plan adapté à votre corps, vos objectifs et votre mode de vie avec un accompagnement continu pour que vous ne soyez jamais seul.
                </p>
              </div>

              {/* Streak Section */}
              <div className="p-6 rounded-3xl border-2 border-[#F97316]/30 bg-gradient-to-br from-[#FEF3C7] to-white shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-[#1F2937]">
                    {currentStreak} Jours de Série
                  </h3>
                  {currentStreak > 0 && <span className="text-2xl">🔥</span>}
                </div>
                
                {/* Week Progress Indicators */}
                <div className="flex items-center justify-between gap-2 mb-4">
                  {weekDays.map((day, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1.5">
                      <div
                        className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
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
                        {day.isCompleted ? '✓' : day.isToday ? 'Auj' : day.label.slice(0, 3)}
                      </div>
                      <p className={`text-[10px] font-medium text-center ${
                        day.isToday ? 'text-[#007c89] font-semibold' : 'text-[#6B7280]'
                      }`}>
                        {day.label}
                      </p>
                    </div>
                  ))}
                </div>

                <p className="text-sm font-semibold text-[#1F2937] mb-4">
                  Vous êtes sur la bonne voie, {profile?.nom?.split(' ')[0] || 'Champion'} !
                </p>

                {dayInfo.type === 'session_planned' && todaySession ? (
                  <button
                    onClick={() => onStartWorkout && onStartWorkout(todaySession, false)}
                    className="w-full py-3 bg-gradient-to-r from-[#F97316] to-[#EC4899] text-white rounded-full font-semibold hover:shadow-lg transition-all text-sm shadow-md"
                  >
                    Commencer votre séance
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => onStartWorkout && onStartWorkout(undefined, true)}
                      className="flex-1 py-3 bg-gradient-to-r from-[#F97316] to-[#EC4899] text-white rounded-full font-semibold hover:shadow-lg transition-all text-sm shadow-md"
                    >
                      Séance libre
                    </button>
                    <button className="px-4 py-3 bg-white text-[#6B7280] border-2 border-[#E5E7EB] rounded-full font-semibold hover:border-[#007c89] hover:text-[#007c89] transition-all text-sm">
                      Passer
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
