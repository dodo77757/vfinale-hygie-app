import React, { useState, useMemo } from 'react';
import { UserProfile, CalendarViewMode, CalendarFilter } from '../types';
import { StorageService } from '../services/storageService';
import { CalendarWeekView } from './CalendarWeekView';
import { CalendarListView } from './CalendarListView';
import { CalendarFilters } from './CalendarFilters';
import { CalendarStats } from './CalendarStats';
import { CalendarSearch } from './CalendarSearch';
import { CalendarColorSettings } from './CalendarColorSettings';
import { SessionDetailCalendarModal } from './modals/SessionDetailCalendarModal';
import { BatchPlanSessionsModal } from './modals/BatchPlanSessionsModal';
import { CalendarExportService } from '../services/calendarExportService';

interface CoachCalendarViewProps {
  clients: UserProfile[];
  onClientClick?: (client: UserProfile) => void;
  onDayClick?: (date: Date) => void;
  onUpdateClients?: (clients: UserProfile[]) => void;
  groups?: any[];
}

interface CalendarDay {
  date: Date;
  sessions: Array<{
    client: UserProfile;
    session: any;
    type: 'completed' | 'planned';
  }>;
}

export const CoachCalendarView: React.FC<CoachCalendarViewProps> = ({
  clients,
  onClientClick,
  onDayClick,
  onUpdateClients,
  groups = []
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [showFilters, setShowFilters] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showColors, setShowColors] = useState(false);
  const [showBatchPlan, setShowBatchPlan] = useState(false);
  const [filter, setFilter] = useState<CalendarFilter>({});
  const [selectedSession, setSelectedSession] = useState<{ session: any; client: UserProfile } | null>(null);
  const [colorScheme, setColorScheme] = useState<any>({});

  // Filtrer les clients selon les filtres
  const filteredClients = useMemo(() => {
    let filtered = clients;

    // Filtre par clients
    if (filter.clientIds && filter.clientIds.length > 0) {
      filtered = filtered.filter(c => filter.clientIds!.includes(c.id));
    }

    // Filtre par groupes
    if (filter.groupIds && filter.groupIds.length > 0) {
      filtered = filtered.filter(c => {
        return filter.groupIds!.some(groupId => {
          const group = groups.find((g: any) => g.id === groupId);
          return group && group.clientIds.includes(c.id);
        });
      });
    }

    // Filtre par recherche
    if (filter.searchQuery && filter.searchQuery.trim()) {
      const query = filter.searchQuery.toLowerCase();
      filtered = filtered.filter(c =>
        c.nom.toLowerCase().includes(query) ||
        (c.plannedSessions?.some(ps => ps.notes?.toLowerCase().includes(query)))
      );
    }

    return filtered;
  }, [clients, filter, groups]);

  // Générer les jours du mois avec les sessions
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: CalendarDay[] = [];

    // Jours du mois précédent (pour compléter la première semaine)
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push({ date, sessions: [] });
    }

    // Jours du mois actuel
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const sessions: Array<{ client: UserProfile; session: any; type: 'completed' | 'planned' }> = [];

      // Filtrer par date si défini
      if (filter.dateRange) {
        const dateStart = filter.dateRange.start;
        const dateEnd = filter.dateRange.end;
        if (date < dateStart || date > dateEnd) {
          days.push({ date, sessions: [] });
          continue;
        }
      }

      // Trouver toutes les sessions complétées de ce jour
      filteredClients.forEach(client => {
        // Filtre par type
        const showCompleted = !filter.types || filter.types.includes('completed');
        const showPlanned = !filter.types || filter.types.includes('planned');

        if (showCompleted && client.sessionRecords) {
          client.sessionRecords.forEach(session => {
            const sessionDate = new Date(session.date);
            if (
              sessionDate.getFullYear() === year &&
              sessionDate.getMonth() === month &&
              sessionDate.getDate() === day
            ) {
              sessions.push({ client, session, type: 'completed' });
            }
          });
        }

        // Trouver toutes les sessions planifiées de ce jour
        if (showPlanned && client.plannedSessions) {
          client.plannedSessions.forEach(plannedSession => {
            const plannedDate = new Date(plannedSession.date);
            if (
              plannedDate.getFullYear() === year &&
              plannedDate.getMonth() === month &&
              plannedDate.getDate() === day
            ) {
              sessions.push({ client, session: plannedSession, type: 'planned' });
            }
          });
        }
      });

      days.push({ date, sessions });
    }

    // Compléter jusqu'à 42 jours (6 semaines)
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      days.push({ date, sessions: [] });
    }

    return days;
  }, [filteredClients, currentMonth, filter]);

  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const weekDays = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

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

  const getClientColor = (clientId: string): string => {
    return colorScheme.clientColors?.[clientId] || 
           colorScheme.groupColors?.[groups.find(g => g.clientIds.includes(clientId))?.id || ''] ||
           colorScheme.defaultColor || 
           '#007c89';
  };

  return (
    <div className="space-y-6">
      {/* Header avec contrôles */}
      <div className="p-6 rounded-lg bg-white border border-[#007c89]/20 shadow-md">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div className="flex items-center gap-3">
            {viewMode === 'month' && (
              <>
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
              </>
            )}
            {viewMode === 'week' && (
              <h3 className="font-bebas text-2xl text-[#181818] tracking-wider">
                Semaine
              </h3>
            )}
            {viewMode === 'list' && (
              <h3 className="font-bebas text-2xl text-[#181818] tracking-wider">
                Agenda
              </h3>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Toggle de vue */}
            <div className="flex gap-1 bg-[#f3efe5] rounded-lg p-1 border border-[#007c89]/10">
              <button
                onClick={() => setViewMode('month')}
                className={`px-3 py-1.5 text-xs font-semibold rounded transition-all ${
                  viewMode === 'month'
                    ? 'bg-[#007c89] text-white'
                    : 'text-[#181818] hover:bg-[#007c89]/10'
                }`}
              >
                Mois
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-3 py-1.5 text-xs font-semibold rounded transition-all ${
                  viewMode === 'week'
                    ? 'bg-[#007c89] text-white'
                    : 'text-[#181818] hover:bg-[#007c89]/10'
                }`}
              >
                Semaine
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 text-xs font-semibold rounded transition-all ${
                  viewMode === 'list'
                    ? 'bg-[#007c89] text-white'
                    : 'text-[#181818] hover:bg-[#007c89]/10'
                }`}
              >
                Liste
              </button>
            </div>

            {/* Boutons d'action */}
            <button
              onClick={() => {
                setShowSearch(!showSearch);
                setShowFilters(false);
                setShowStats(false);
                setShowColors(false);
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                showSearch
                  ? 'bg-[#007c89] text-white'
                  : 'bg-white text-[#007c89] border border-[#007c89]/30 hover:bg-[#007c89] hover:text-white'
              }`}
            >
              🔍 Recherche
            </button>
            <button
              onClick={() => {
                setShowFilters(!showFilters);
                setShowSearch(false);
                setShowStats(false);
                setShowColors(false);
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                showFilters
                  ? 'bg-[#007c89] text-white'
                  : 'bg-white text-[#007c89] border border-[#007c89]/30 hover:bg-[#007c89] hover:text-white'
              }`}
            >
              Filtres
            </button>
            <button
              onClick={() => {
                setShowStats(!showStats);
                setShowSearch(false);
                setShowFilters(false);
                setShowColors(false);
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                showStats
                  ? 'bg-[#007c89] text-white'
                  : 'bg-white text-[#007c89] border border-[#007c89]/30 hover:bg-[#007c89] hover:text-white'
              }`}
            >
              Stats
            </button>
            <button
              onClick={() => setShowBatchPlan(true)}
              className="px-3 py-1.5 bg-[#007c89] text-white rounded-md text-xs font-semibold hover:bg-[#006a75] transition-all"
            >
              Planifier en masse
            </button>
            <button
              onClick={() => CalendarExportService.exportToICal(clients)}
              className="px-3 py-1.5 bg-white text-[#007c89] border border-[#007c89]/30 rounded-md text-xs font-semibold hover:bg-[#007c89] hover:text-white transition-all"
            >
              Export
            </button>
            {viewMode === 'month' && (
              <button
                onClick={goToToday}
                className="px-4 py-2 bg-[#007c89] text-white rounded-md text-xs font-semibold uppercase hover:bg-[#006a75] transition-all shadow-sm hover:shadow-md"
              >
                Aujourd'hui
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Contenu principal avec panneaux latéraux */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Vue principale */}
        <div className={`${showFilters || showStats || showSearch || showColors ? 'lg:col-span-8' : 'lg:col-span-12'}`}>
          {viewMode === 'month' && (
            <div className="p-6 rounded-lg bg-white border border-[#007c89]/20 shadow-md">
              {renderMonthView()}
            </div>
          )}
          {viewMode === 'week' && (
            <CalendarWeekView
              clients={filteredClients}
              currentDate={currentMonth}
              onDateChange={setCurrentMonth}
              onClientClick={onClientClick}
              onSessionClick={(session, client) => setSelectedSession({ session, client })}
            />
          )}
          {viewMode === 'list' && (
            <CalendarListView
              clients={filteredClients}
              onClientClick={onClientClick}
              onSessionClick={(session, client) => setSelectedSession({ session, client })}
            />
          )}
        </div>

        {/* Panneaux latéraux */}
        {(showFilters || showStats || showSearch || showColors) && (
          <div className="lg:col-span-4 space-y-6">
            {showSearch && (
              <CalendarSearch
                clients={filteredClients}
                onResultClick={(session, client) => setSelectedSession({ session, client })}
                onClose={() => setShowSearch(false)}
              />
            )}
            {showFilters && (
              <CalendarFilters
                clients={clients}
                groups={groups}
                filter={filter}
                onFilterChange={setFilter}
                onClose={() => setShowFilters(false)}
              />
            )}
            {showStats && (
              <CalendarStats clients={filteredClients} />
            )}
            {showColors && (
              <CalendarColorSettings
                clients={clients}
                groups={groups}
                onColorSchemeChange={setColorScheme}
                onClose={() => setShowColors(false)}
              />
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedSession && (
        <SessionDetailCalendarModal
          isOpen={!!selectedSession}
          onClose={() => setSelectedSession(null)}
          session={selectedSession.session}
          client={selectedSession.client}
          onUpdate={(updatedClient) => {
            if (onUpdateClients) {
              const updatedClients = StorageService.updateClient(updatedClient);
              onUpdateClients(updatedClients);
            }
          }}
        />
      )}

      <BatchPlanSessionsModal
        isOpen={showBatchPlan}
        onClose={() => setShowBatchPlan(false)}
        clients={clients}
        onUpdate={(updatedClients) => {
          if (onUpdateClients) {
            StorageService.saveClients(updatedClients);
            onUpdateClients(updatedClients);
          }
        }}
      />
    </div>
  );

  function renderMonthView() {
    return (
      <>
        {/* Calendrier - Style joyeux */}
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
            const isPast = dayData.date < new Date(new Date().setHours(0, 0, 0, 0));
            const sessionCount = dayData.sessions.length;
            const completedSessions = dayData.sessions.filter(s => s.type === 'completed');
            const plannedSessions = dayData.sessions.filter(s => s.type === 'planned');

            const handleDayClick = () => {
              if (onDayClick && isCurrentMonthDay) {
                setSelectedDay(dayData.date);
                onDayClick(dayData.date);
              }
            };

            const handleSessionClick = (e: React.MouseEvent, item: any) => {
              e.stopPropagation();
              setSelectedSession({ session: item.session, client: item.client });
            };

            const handleRemovePlannedSession = (e: React.MouseEvent, item: any) => {
              e.stopPropagation();
              if (item.type === 'planned' && onUpdateClients && window.confirm(`Supprimer la session planifiée pour ${item.client.nom} ?`)) {
                const updatedClient: UserProfile = {
                  ...item.client,
                  plannedSessions: (item.client.plannedSessions || []).filter(
                    (ps: any) => ps.id !== item.session.id
                  )
                };
                const updatedClients = clients.map(c => 
                  c.id === updatedClient.id ? updatedClient : c
                );
                StorageService.saveClients(updatedClients);
                onUpdateClients(updatedClients);
              }
            };

            return (
              <div
                key={idx}
                onClick={handleDayClick}
                className={`
                  min-h-[90px] p-2.5 rounded-md border transition-all duration-200 shadow-sm
                  ${isCurrentMonthDay ? 'bg-white border-[#007c89]/20 hover:border-[#007c89] hover:shadow-md' : 'bg-[#f3efe5] border-[#007c89]/10 opacity-50'}
                  ${isTodayDay ? 'border-[#007c89] bg-[#e0f4f6] ring-2 ring-[#007c89]/20 shadow-md' : ''}
                  ${isCurrentMonthDay && !isPast ? 'hover:border-[#007c89] cursor-pointer hover:bg-[#f3efe5]' : ''}
                  ${sessionCount > 0 ? 'cursor-pointer' : ''}
                `}
              >
                <div className={`text-sm font-semibold mb-2 flex items-center justify-between ${isCurrentMonthDay ? 'text-[#181818]' : 'text-[#9CA3AF]'}`}>
                  <span>{dayData.date.getDate()}</span>
                  {isCurrentMonthDay && !isPast && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDayClick();
                      }}
                      className="w-6 h-6 flex items-center justify-center text-[#007c89] hover:text-[#006a75] hover:bg-[#e0f4f6] rounded-md transition-all text-base font-bold shadow-sm"
                      title="Ajouter une session"
                    >
                      +
                    </button>
                  )}
                </div>
                {sessionCount > 0 && (
                  <div className="space-y-1.5">
                    {dayData.sessions.slice(0, 2).map((item, sessionIdx) => {
                      const clientColor = getClientColor(item.client.id);
                      return (
                        <div
                          key={sessionIdx}
                          onClick={(e) => handleSessionClick(e, item)}
                          className={`text-[10px] font-semibold px-2 py-1 rounded-md truncate hover:shadow-md transition-all cursor-pointer flex items-center justify-between gap-1.5 group ${
                            item.type === 'completed'
                              ? 'text-white border border-transparent shadow-sm'
                              : 'bg-[#f3efe5] text-[#181818] border border-[#007c89]/30 shadow-sm'
                          }`}
                          style={item.type === 'completed' ? { backgroundColor: clientColor } : {}}
                          title={`${item.client.nom} - ${item.type === 'completed' ? 'Complétée' : 'Planifiée'}`}
                        >
                          <span className="flex-1 truncate">
                            {item.type === 'planned' && '📅 '}
                            {item.client.nom}
                          </span>
                          {item.type === 'planned' && !isPast && (
                            <button
                              onClick={(e) => handleRemovePlannedSession(e, item)}
                              className="opacity-0 group-hover:opacity-100 text-[#EF4444] hover:text-[#DC2626] transition-opacity text-sm font-bold"
                              title="Supprimer"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      );
                    })}
                    {sessionCount > 2 && (
                      <div className="text-[10px] font-semibold text-[#6B7280] text-center">
                        +{sessionCount - 2}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Légende - Style Hygie */}
        <div className="mt-6 pt-4 border-t border-[#007c89]/20 flex flex-wrap items-center gap-4 text-xs font-semibold text-[#181818]">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-[#007c89] bg-[#e0f4f6] rounded-md shadow-sm"></div>
            <span>Aujourd'hui</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#007c89] rounded-md border border-[#007c89] shadow-sm"></div>
            <span>Complétées</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#f3efe5] rounded-md border border-[#007c89]/30 shadow-sm"></div>
            <span>Planifiées</span>
          </div>
        </div>
      </>
    );
  }
};

