import React, { useState, useMemo } from 'react';
import { UserProfile, PlannedSession, SessionRecord } from '../types';
import { StorageService } from '../services/storageService';
import { notificationService } from '../services/notificationService';
import { CalendarValidationService } from '../services/calendarValidationService';

interface ClientCalendarViewProps {
  profile: UserProfile;
  onStartSession?: (plannedSession: PlannedSession) => void;
  onUpdateProfile?: (updatedProfile: UserProfile) => void;
}

export const ClientCalendarView: React.FC<ClientCalendarViewProps> = ({
  profile,
  onStartSession,
  onUpdateProfile
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedSession, setSelectedSession] = useState<PlannedSession | null>(null);

  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const weekDays = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  // Générer les jours du mois avec les sessions
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: Array<{
      date: Date;
      plannedSession: PlannedSession | null;
      completedSession: SessionRecord | null;
    }> = [];

    // Jours du mois précédent
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push({ date, plannedSession: null, completedSession: null });
    }

    // Jours du mois actuel
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      
      // Trouver session planifiée
      const plannedSession = profile.plannedSessions?.find(ps => {
        const psDate = new Date(ps.date);
        return (
          psDate.getFullYear() === year &&
          psDate.getMonth() === month &&
          psDate.getDate() === day
        );
      }) || null;

      // Trouver session complétée
      const completedSession = profile.sessionRecords?.find(sr => {
        const srDate = new Date(sr.date);
        return (
          srDate.getFullYear() === year &&
          srDate.getMonth() === month &&
          srDate.getDate() === day
        );
      }) || null;

      days.push({ date, plannedSession, completedSession });
    }

    // Compléter jusqu'à 42 jours
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      days.push({ date, plannedSession: null, completedSession: null });
    }

    return days;
  }, [profile, currentMonth]);

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentMonth.getMonth();
  };

  const isPast = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate < today;
  };

  const isTodayOrFuture = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate >= today;
  };

  const handleStartPlannedSession = (plannedSession: PlannedSession) => {
    if (onStartSession) {
      onStartSession(plannedSession);
    }
  };

  const handleCancelPlannedSession = (plannedSession: PlannedSession) => {
    if (!window.confirm('Annuler cette session planifiée ?')) return;

    const updatedProfile: UserProfile = {
      ...profile,
      plannedSessions: (profile.plannedSessions || []).filter(ps => ps.id !== plannedSession.id)
    };

    const updatedClients = StorageService.updateClient(updatedProfile);
    StorageService.saveClients(updatedClients);
    
    if (onUpdateProfile) {
      onUpdateProfile(updatedProfile);
    }
    
    notificationService.success('Session annulée');
  };

  // Sessions à venir
  const upcomingSessions = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return (profile.plannedSessions || [])
      .filter(ps => {
        const psDate = new Date(ps.date);
        psDate.setHours(0, 0, 0, 0);
        return psDate >= today;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5);
  }, [profile.plannedSessions]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-lg bg-white border border-[#007c89]/20 shadow-md">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={goToPreviousMonth}
              className="w-10 h-10 flex items-center justify-center text-[#6B7280] hover:text-[#007c89] hover:bg-[#e0f4f6] rounded-md transition-all shadow-sm font-bold text-lg"
            >
              ←
            </button>
            <h3 className="font-bebas text-2xl text-[#181818] tracking-wider">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h3>
            <button
              onClick={goToNextMonth}
              className="w-10 h-10 flex items-center justify-center text-[#6B7280] hover:text-[#007c89] hover:bg-[#e0f4f6] rounded-md transition-all shadow-sm font-bold text-lg"
            >
              →
            </button>
          </div>
          <button
            onClick={goToToday}
            className="px-4 py-2 bg-[#007c89] text-white rounded-md text-xs font-semibold uppercase hover:bg-[#006a75] transition-all shadow-sm hover:shadow-md"
          >
            Aujourd'hui
          </button>
        </div>

        {/* Calendrier */}
        <div className="grid grid-cols-7 gap-2">
          {/* En-têtes des jours */}
          {weekDays.map(day => (
            <div
              key={day}
              className="text-center text-xs font-semibold text-[#181818] uppercase py-3 bg-[#e0f4f6] rounded-md border border-[#007c89]/20"
            >
              {day}
            </div>
          ))}

          {/* Jours */}
          {calendarDays.map((dayData, idx) => {
            const isCurrentMonthDay = isCurrentMonth(dayData.date);
            const isTodayDay = isToday(dayData.date);
            const isPastDay = isPast(dayData.date);
            const isFuture = isTodayOrFuture(dayData.date);

            return (
              <div
                key={idx}
                className={`
                  min-h-[90px] p-2.5 rounded-md border transition-all duration-200 shadow-sm
                  ${isCurrentMonthDay ? 'bg-white border-[#007c89]/20 hover:border-[#007c89] hover:shadow-md' : 'bg-[#f3efe5] border-[#007c89]/10 opacity-50'}
                  ${isTodayDay ? 'border-[#007c89] bg-[#e0f4f6] ring-2 ring-[#007c89]/20 shadow-md' : ''}
                `}
              >
                <div className={`text-sm font-semibold mb-2 ${isCurrentMonthDay ? 'text-[#181818]' : 'text-[#9CA3AF]'}`}>
                  {dayData.date.getDate()}
                </div>

                {/* Session complétée */}
                {dayData.completedSession && (
                  <div className="text-[10px] font-semibold px-2 py-1 rounded-md bg-[#007c89] text-white mb-1">
                    ✅ Complétée
                  </div>
                )}

                {/* Session planifiée */}
                {dayData.plannedSession && !dayData.completedSession && (
                  <div className="space-y-1">
                    <div className="text-[10px] font-semibold px-2 py-1 rounded-md bg-[#f3efe5] text-[#181818] border border-[#007c89]/30">
                      📅 Session
                    </div>
                    {isFuture && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleStartPlannedSession(dayData.plannedSession!)}
                          className="flex-1 text-[9px] px-1.5 py-0.5 bg-[#007c89] text-white rounded hover:bg-[#006a75] transition-all"
                        >
                          Démarrer
                        </button>
                        {!isPastDay && (
                          <button
                            onClick={() => handleCancelPlannedSession(dayData.plannedSession!)}
                            className="text-[9px] px-1.5 py-0.5 bg-[#EF4444] text-white rounded hover:bg-[#DC2626] transition-all"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Légende */}
        <div className="mt-6 pt-4 border-t border-[#007c89]/20 flex flex-wrap items-center gap-4 text-xs font-semibold text-[#181818]">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-[#007c89] bg-[#e0f4f6] rounded-md shadow-sm"></div>
            <span>Aujourd'hui</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#007c89] rounded-md border border-[#007c89] shadow-sm"></div>
            <span>Complétée</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#f3efe5] rounded-md border border-[#007c89]/30 shadow-sm"></div>
            <span>Planifiée</span>
          </div>
        </div>
      </div>

      {/* Sessions à venir */}
      {upcomingSessions.length > 0 && (
        <div className="p-6 rounded-lg bg-white border border-[#007c89]/20 shadow-md">
          <h3 className="font-bebas text-xl text-[#181818] tracking-wider mb-4">Prochaines Sessions</h3>
          <div className="space-y-3">
            {upcomingSessions.map((session) => {
              const sessionDate = new Date(session.date);
              const isTodaySession = isToday(sessionDate);
              const isPastSession = isPast(sessionDate);
              
              // Vérifier si déjà complétée
              const isCompleted = profile.sessionRecords?.some(sr => {
                const srDate = new Date(sr.date);
                return (
                  srDate.getFullYear() === sessionDate.getFullYear() &&
                  srDate.getMonth() === sessionDate.getMonth() &&
                  srDate.getDate() === sessionDate.getDate()
                );
              });

              return (
                <div
                  key={session.id}
                  className={`p-4 rounded-lg border ${
                    isTodaySession
                      ? 'bg-[#e0f4f6] border-[#007c89]'
                      : 'bg-[#f3efe5] border-[#007c89]/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-[#181818]">
                        {sessionDate.toLocaleDateString('fr-FR', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long'
                        })}
                      </p>
                      {session.notes && (
                        <p className="text-xs text-[#6B7280] mt-1">{session.notes}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {isCompleted ? (
                        <span className="px-3 py-1.5 bg-[#007c89] text-white rounded-md text-xs font-semibold">
                          ✅ Complétée
                        </span>
                      ) : !isPastSession ? (
                        <>
                          <button
                            onClick={() => handleStartPlannedSession(session)}
                            className="px-4 py-1.5 bg-[#007c89] text-white rounded-md text-xs font-semibold hover:bg-[#006a75] transition-all"
                          >
                            Démarrer
                          </button>
                          <button
                            onClick={() => handleCancelPlannedSession(session)}
                            className="px-3 py-1.5 bg-[#EF4444] text-white rounded-md text-xs font-semibold hover:bg-[#DC2626] transition-all"
                          >
                            Annuler
                          </button>
                        </>
                      ) : (
                        <span className="px-3 py-1.5 bg-gray-300 text-gray-600 rounded-md text-xs font-semibold">
                          Passée
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

