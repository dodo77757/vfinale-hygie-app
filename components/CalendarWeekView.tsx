import React, { useState, useMemo } from 'react';
import { UserProfile } from '../types';

interface CalendarWeekViewProps {
  clients: UserProfile[];
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onClientClick?: (client: UserProfile) => void;
  onSessionClick?: (session: any, client: UserProfile) => void;
}

export const CalendarWeekView: React.FC<CalendarWeekViewProps> = ({
  clients,
  currentDate,
  onDateChange,
  onClientClick,
  onSessionClick
}) => {
  const [showHours, setShowHours] = useState(false);

  // Calculer le début de la semaine (lundi)
  const getWeekStart = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Ajuster pour lundi = 1
    return new Date(d.setDate(diff));
  };

  const weekStart = getWeekStart(currentDate);
  const weekDays = useMemo(() => {
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      days.push(date);
    }
    return days;
  }, [weekStart]);

  const dayNames = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

  // Récupérer les sessions pour chaque jour
  const getSessionsForDay = (date: Date) => {
    const sessions: Array<{ client: UserProfile; session: any; type: 'completed' | 'planned' }> = [];
    
    clients.forEach(client => {
      // Sessions complétées
      if (client.sessionRecords) {
        client.sessionRecords.forEach(session => {
          const sessionDate = new Date(session.date);
          if (
            sessionDate.getFullYear() === date.getFullYear() &&
            sessionDate.getMonth() === date.getMonth() &&
            sessionDate.getDate() === date.getDate()
          ) {
            sessions.push({ client, session, type: 'completed' });
          }
        });
      }

      // Sessions planifiées
      if (client.plannedSessions) {
        client.plannedSessions.forEach(plannedSession => {
          const plannedDate = new Date(plannedSession.date);
          if (
            plannedDate.getFullYear() === date.getFullYear() &&
            plannedDate.getMonth() === date.getMonth() &&
            plannedDate.getDate() === date.getDate()
          ) {
            sessions.push({ client, session: plannedSession, type: 'planned' });
          }
        });
      }
    });

    return sessions.sort((a, b) => {
      const dateA = new Date(a.session.date || a.session.date).getTime();
      const dateB = new Date(b.session.date || b.session.date).getTime();
      return dateA - dateB;
    });
  };

  const goToPreviousWeek = () => {
    const newDate = new Date(weekStart);
    newDate.setDate(weekStart.getDate() - 7);
    onDateChange(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(weekStart);
    newDate.setDate(weekStart.getDate() + 7);
    onDateChange(newDate);
  };

  const goToToday = () => {
    onDateChange(new Date());
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  return (
    <div className="p-6 rounded-lg bg-white border border-[#007c89]/20 shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={goToPreviousWeek}
            className="w-10 h-10 flex items-center justify-center text-[#6B7280] hover:text-[#007c89] hover:bg-[#e0f4f6] rounded-md transition-all shadow-sm font-bold text-lg"
          >
            ←
          </button>
          <h3 className="font-bebas text-2xl text-[#181818] tracking-wider">
            Semaine du {weekStart.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })} au{' '}
            {weekDays[6].toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
          </h3>
          <button
            onClick={goToNextWeek}
            className="w-10 h-10 flex items-center justify-center text-[#6B7280] hover:text-[#007c89] hover:bg-[#e0f4f6] rounded-md transition-all shadow-sm font-bold text-lg"
          >
            →
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowHours(!showHours)}
            className={`px-4 py-2 rounded-md text-xs font-semibold transition-all ${
              showHours
                ? 'bg-[#007c89] text-white'
                : 'bg-white text-[#181818] border border-[#007c89]/30 hover:bg-[#007c89]/10'
            }`}
          >
            {showHours ? 'Masquer heures' : 'Afficher heures'}
          </button>
          <button
            onClick={goToToday}
            className="px-4 py-2 bg-[#007c89] text-white rounded-md text-xs font-semibold uppercase hover:bg-[#006a75] transition-all shadow-sm hover:shadow-md"
          >
            Aujourd'hui
          </button>
        </div>
      </div>

      {/* Calendrier hebdomadaire */}
      <div className="grid grid-cols-7 gap-2">
        {/* En-têtes des jours */}
        {dayNames.map((dayName, idx) => {
          const day = weekDays[idx];
          const isTodayDay = isToday(day);
          
          return (
            <div
              key={idx}
              className={`text-center py-3 rounded-md border ${
                isTodayDay
                  ? 'bg-[#007c89] text-white border-[#007c89]'
                  : 'bg-[#e0f4f6] border-[#007c89]/20'
              }`}
            >
              <div className="text-xs font-semibold uppercase mb-1">{dayName}</div>
              <div className="text-lg font-bebas">{day.getDate()}</div>
            </div>
          );
        })}

        {/* Colonnes de sessions */}
        {weekDays.map((day, dayIdx) => {
          const sessions = getSessionsForDay(day);
          const isTodayDay = isToday(day);
          const isPast = day < new Date(new Date().setHours(0, 0, 0, 0));

          return (
            <div
              key={dayIdx}
              className={`min-h-[400px] p-3 rounded-md border ${
                isTodayDay
                  ? 'border-[#007c89] bg-[#e0f4f6] ring-2 ring-[#007c89]/20'
                  : 'border-[#007c89]/20 bg-white'
              }`}
            >
              {showHours ? (
                <div className="space-y-2">
                  {Array.from({ length: 24 }, (_, hour) => {
          const hourSessions = sessions.filter(s => {
            const sessionDate = new Date(s.session.date);
            return sessionDate.getHours() === hour;
          });

                    return (
                      <div key={hour} className="border-b border-[#007c89]/10 pb-1">
                        <div className="text-xs text-[#6B7280] mb-1">{hour}h</div>
                        {hourSessions.map((item, sessionIdx) => (
                          <div
                            key={sessionIdx}
                            onClick={() => {
                              if (onSessionClick) {
                                onSessionClick(item.session, item.client);
                              } else if (onClientClick) {
                                onClientClick(item.client);
                              }
                            }}
                            className={`text-[10px] font-semibold px-2 py-1 rounded-md mb-1 cursor-pointer transition-all ${
                              item.type === 'completed'
                                ? 'bg-[#007c89] text-white'
                                : 'bg-[#f3efe5] text-[#181818] border border-[#007c89]/30'
                            }`}
                          >
                            {item.client.nom}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-2">
                  {sessions.length === 0 ? (
                    <div className="text-xs text-[#6B7280] text-center py-4">Aucune session</div>
                  ) : (
                    sessions.map((item, sessionIdx) => (
                      <div
                        key={sessionIdx}
                        onClick={() => {
                          if (onSessionClick) {
                            onSessionClick(item.session, item.client);
                          } else if (onClientClick) {
                            onClientClick(item.client);
                          }
                        }}
                        className={`text-xs font-semibold px-2 py-2 rounded-md cursor-pointer transition-all ${
                          item.type === 'completed'
                            ? 'bg-[#007c89] text-white border border-[#007c89]'
                            : 'bg-[#f3efe5] text-[#181818] border border-[#007c89]/30'
                        }`}
                      >
                        <div className="flex items-center gap-1 mb-1">
                          {item.type === 'planned' && <span>📅</span>}
                          <span className="font-bold">{item.client.nom}</span>
                        </div>
                        {item.session.notes && (
                          <div className="text-[10px] text-[#6B7280] truncate">{item.session.notes}</div>
                        )}
                      </div>
                    ))
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
          <div className="w-4 h-4 bg-[#007c89] rounded-md border border-[#007c89]"></div>
          <span>Complétées</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-[#f3efe5] rounded-md border border-[#007c89]/30"></div>
          <span>Planifiées</span>
        </div>
      </div>
    </div>
  );
};

