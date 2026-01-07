import React, { useState, useMemo } from 'react';
import { UserProfile } from '../types';

interface CalendarListViewProps {
  clients: UserProfile[];
  onClientClick?: (client: UserProfile) => void;
  onSessionClick?: (session: any, client: UserProfile) => void;
}

type SortField = 'date' | 'client' | 'type';
type SortDirection = 'asc' | 'desc';

export const CalendarListView: React.FC<CalendarListViewProps> = ({
  clients,
  onClientClick,
  onSessionClick
}) => {
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [filterType, setFilterType] = useState<'all' | 'completed' | 'planned'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Récupérer toutes les sessions
  const allSessions = useMemo(() => {
    const sessions: Array<{
      client: UserProfile;
      session: any;
      type: 'completed' | 'planned';
      date: Date;
    }> = [];

    clients.forEach(client => {
      // Sessions complétées
      if (client.sessionRecords) {
        client.sessionRecords.forEach(session => {
          sessions.push({
            client,
            session,
            type: 'completed',
            date: new Date(session.date)
          });
        });
      }

      // Sessions planifiées
      if (client.plannedSessions) {
        client.plannedSessions.forEach(plannedSession => {
          sessions.push({
            client,
            session: plannedSession,
            type: 'planned',
            date: new Date(plannedSession.date)
          });
        });
      }
    });

    return sessions;
  }, [clients]);

  // Filtrer et trier
  const filteredAndSortedSessions = useMemo(() => {
    let filtered = allSessions;

    // Filtre par type
    if (filterType !== 'all') {
      filtered = filtered.filter(s => s.type === filterType);
    }

    // Filtre par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s =>
        s.client.nom.toLowerCase().includes(query) ||
        (s.session.notes && s.session.notes.toLowerCase().includes(query))
      );
    }

    // Tri
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'date':
          comparison = a.date.getTime() - b.date.getTime();
          break;
        case 'client':
          comparison = a.client.nom.localeCompare(b.client.nom);
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [allSessions, filterType, searchQuery, sortField, sortDirection]);

  // Grouper par date
  const groupedSessions = useMemo(() => {
    const groups: Record<string, typeof filteredAndSortedSessions> = {};

    filteredAndSortedSessions.forEach(session => {
      const dateKey = session.date.toLocaleDateString('fr-FR');
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(session);
    });

    return groups;
  }, [filteredAndSortedSessions]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return '↕';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  return (
    <div className="p-6 rounded-lg bg-white border border-[#007c89]/20 shadow-md">
      {/* Header avec filtres */}
      <div className="mb-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bebas text-2xl text-[#181818] tracking-wider">Agenda</h3>
          <div className="text-sm text-[#6B7280]">
            {filteredAndSortedSessions.length} session{filteredAndSortedSessions.length > 1 ? 's' : ''}
          </div>
        </div>

        {/* Barre de recherche */}
        <div className="flex gap-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par client ou notes..."
            className="flex-1 bg-white border border-[#007c89]/30 rounded-md px-4 py-2 text-sm text-[#181818] placeholder:text-[#6B7280] focus:border-[#007c89] focus:outline-none focus:ring-2 focus:ring-[#007c89]/20"
          />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as 'all' | 'completed' | 'planned')}
            className="bg-white border border-[#007c89]/30 rounded-md px-4 py-2 text-sm text-[#181818] focus:border-[#007c89] focus:outline-none focus:ring-2 focus:ring-[#007c89]/20"
          >
            <option value="all">Tous</option>
            <option value="completed">Complétées</option>
            <option value="planned">Planifiées</option>
          </select>
        </div>

        {/* En-têtes de tri */}
        <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-[#181818] border-b border-[#007c89]/20 pb-2">
          <div
            className="col-span-4 cursor-pointer hover:text-[#007c89] flex items-center gap-1"
            onClick={() => handleSort('date')}
          >
            Date {getSortIcon('date')}
          </div>
          <div
            className="col-span-4 cursor-pointer hover:text-[#007c89] flex items-center gap-1"
            onClick={() => handleSort('client')}
          >
            Client {getSortIcon('client')}
          </div>
          <div
            className="col-span-2 cursor-pointer hover:text-[#007c89] flex items-center gap-1"
            onClick={() => handleSort('type')}
          >
            Type {getSortIcon('type')}
          </div>
          <div className="col-span-2">Actions</div>
        </div>
      </div>

      {/* Liste des sessions groupées par date */}
      <div className="space-y-6 max-h-[600px] overflow-y-auto custom-scrollbar">
        {Object.keys(groupedSessions).length === 0 ? (
          <div className="text-center py-12 text-[#6B7280]">
            <p className="text-sm">Aucune session trouvée</p>
          </div>
        ) : (
          Object.entries(groupedSessions)
            .sort(([a], [b]) => {
              const dateA = new Date(a.split('/').reverse().join('-'));
              const dateB = new Date(b.split('/').reverse().join('-'));
              return dateB.getTime() - dateA.getTime();
            })
            .map(([dateKey, sessions]) => (
              <div key={dateKey}>
                <div className="font-bebas text-lg text-[#007c89] mb-3 sticky top-0 bg-white py-2 border-b border-[#007c89]/20">
                  {dateKey}
                </div>
                <div className="space-y-2">
                  {sessions.map((item, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-12 gap-2 p-3 rounded-md border border-[#007c89]/20 hover:bg-[#f3efe5] transition-all"
                    >
                      <div className="col-span-4 text-sm text-[#181818]">
                        {item.date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div
                        className="col-span-4 text-sm font-semibold text-[#181818] cursor-pointer hover:text-[#007c89]"
                        onClick={() => onClientClick && onClientClick(item.client)}
                      >
                        {item.client.nom}
                      </div>
                      <div className="col-span-2">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            item.type === 'completed'
                              ? 'bg-[#007c89] text-white'
                              : 'bg-[#f3efe5] text-[#181818] border border-[#007c89]/30'
                          }`}
                        >
                          {item.type === 'completed' ? 'Complétée' : 'Planifiée'}
                        </span>
                      </div>
                      <div className="col-span-2 flex gap-2">
                        <button
                          onClick={() => {
                            if (onSessionClick) {
                              onSessionClick(item.session, item.client);
                            }
                          }}
                          className="text-xs text-[#007c89] hover:text-[#006a75] font-semibold"
                        >
                          Voir
                        </button>
                      </div>
                      {item.session.notes && (
                        <div className="col-span-12 text-xs text-[#6B7280] mt-2 pt-2 border-t border-[#007c89]/10">
                          {item.session.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
};

