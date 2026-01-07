import React, { useState, useMemo } from 'react';
import { UserProfile, CalendarFilter, ClientGroup } from '../types';

interface CalendarFiltersProps {
  clients: UserProfile[];
  groups?: ClientGroup[];
  filter: CalendarFilter;
  onFilterChange: (filter: CalendarFilter) => void;
  onClose?: () => void;
}

export const CalendarFilters: React.FC<CalendarFiltersProps> = ({
  clients,
  groups = [],
  filter,
  onFilterChange,
  onClose
}) => {
  const [localFilter, setLocalFilter] = useState<CalendarFilter>(filter);

  const uniqueObjectives = useMemo(() => {
    const objectives = new Set<string>();
    clients.forEach(c => {
      if (c.objectifPrincipal) objectives.add(c.objectifPrincipal);
    });
    return Array.from(objectives).sort();
  }, [clients]);

  const applyFilter = () => {
    onFilterChange(localFilter);
  };

  const resetFilter = () => {
    const emptyFilter: CalendarFilter = {};
    setLocalFilter(emptyFilter);
    onFilterChange(emptyFilter);
  };

  const toggleClient = (clientId: string) => {
    const currentIds = localFilter.clientIds || [];
    const newIds = currentIds.includes(clientId)
      ? currentIds.filter(id => id !== clientId)
      : [...currentIds, clientId];
    setLocalFilter({ ...localFilter, clientIds: newIds.length > 0 ? newIds : undefined });
  };

  const toggleGroup = (groupId: string) => {
    const currentIds = localFilter.groupIds || [];
    const newIds = currentIds.includes(groupId)
      ? currentIds.filter(id => id !== groupId)
      : [...currentIds, groupId];
    setLocalFilter({ ...localFilter, groupIds: newIds.length > 0 ? newIds : undefined });
  };

  const toggleType = (type: 'completed' | 'planned') => {
    const currentTypes = localFilter.types || [];
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter(t => t !== type)
      : [...currentTypes, type];
    setLocalFilter({ ...localFilter, types: newTypes.length > 0 ? newTypes : undefined });
  };

  const hasActiveFilters = 
    (localFilter.clientIds && localFilter.clientIds.length > 0) ||
    (localFilter.groupIds && localFilter.groupIds.length > 0) ||
    (localFilter.types && localFilter.types.length > 0) ||
    localFilter.dateRange ||
    (localFilter.searchQuery && localFilter.searchQuery.trim() !== '');

  return (
    <div className="p-6 rounded-lg bg-white border border-[#007c89]/20 shadow-md space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-bebas text-xl text-[#181818]">Filtres du Calendrier</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-[#6B7280] hover:text-[#181818] text-xl"
          >
            ✕
          </button>
        )}
      </div>

      {/* Filtres par client */}
      <div>
        <label className="block text-sm font-semibold text-[#181818] mb-3">
          Clients ({localFilter.clientIds?.length || 0} sélectionné{localFilter.clientIds && localFilter.clientIds.length > 1 ? 's' : ''})
        </label>
        <div className="max-h-48 overflow-y-auto border border-[#007c89]/30 rounded-md p-3 custom-scrollbar space-y-2">
          {clients.map(client => (
            <label
              key={client.id}
              className="flex items-center gap-2 p-2 hover:bg-[#f3efe5] rounded cursor-pointer"
            >
              <input
                type="checkbox"
                checked={localFilter.clientIds?.includes(client.id) || false}
                onChange={() => toggleClient(client.id)}
                className="text-[#007c89]"
              />
              <span className="text-sm text-[#181818]">{client.nom}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Filtres par groupe */}
      {groups.length > 0 && (
        <div>
          <label className="block text-sm font-semibold text-[#181818] mb-3">
            Groupes ({localFilter.groupIds?.length || 0} sélectionné{localFilter.groupIds && localFilter.groupIds.length > 1 ? 's' : ''})
          </label>
          <div className="space-y-2">
            {groups.map(group => (
              <label
                key={group.id}
                className="flex items-center gap-2 p-2 hover:bg-[#f3efe5] rounded cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={localFilter.groupIds?.includes(group.id) || false}
                  onChange={() => toggleGroup(group.id)}
                  className="text-[#007c89]"
                />
                <span className="text-sm text-[#181818]">{group.name}</span>
                <span className="text-xs text-[#6B7280]">
                  ({group.clientIds.length} client{group.clientIds.length > 1 ? 's' : ''})
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Filtres par type */}
      <div>
        <label className="block text-sm font-semibold text-[#181818] mb-3">
          Type de session
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2 p-2 hover:bg-[#f3efe5] rounded cursor-pointer">
            <input
              type="checkbox"
              checked={localFilter.types?.includes('completed') || false}
              onChange={() => toggleType('completed')}
              className="text-[#007c89]"
            />
            <span className="text-sm text-[#181818]">Sessions complétées</span>
          </label>
          <label className="flex items-center gap-2 p-2 hover:bg-[#f3efe5] rounded cursor-pointer">
            <input
              type="checkbox"
              checked={localFilter.types?.includes('planned') || false}
              onChange={() => toggleType('planned')}
              className="text-[#007c89]"
            />
            <span className="text-sm text-[#181818]">Sessions planifiées</span>
          </label>
        </div>
      </div>

      {/* Filtres temporels */}
      <div>
        <label className="block text-sm font-semibold text-[#181818] mb-3">
          Période
        </label>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[#6B7280] mb-1">Date de début</label>
              <input
                type="date"
                value={localFilter.dateRange?.start ? localFilter.dateRange.start.toISOString().split('T')[0] : ''}
                onChange={(e) => {
                  const start = e.target.value ? new Date(e.target.value) : undefined;
                  setLocalFilter({
                    ...localFilter,
                    dateRange: start
                      ? { start, end: localFilter.dateRange?.end || start }
                      : undefined
                  });
                }}
                className="w-full bg-white border border-[#007c89]/30 rounded-md px-3 py-2 text-sm text-[#181818] focus:border-[#007c89] focus:outline-none focus:ring-2 focus:ring-[#007c89]/20"
              />
            </div>
            <div>
              <label className="block text-xs text-[#6B7280] mb-1">Date de fin</label>
              <input
                type="date"
                value={localFilter.dateRange?.end ? localFilter.dateRange.end.toISOString().split('T')[0] : ''}
                onChange={(e) => {
                  const end = e.target.value ? new Date(e.target.value) : undefined;
                  setLocalFilter({
                    ...localFilter,
                    dateRange: localFilter.dateRange?.start
                      ? { start: localFilter.dateRange.start, end: end || localFilter.dateRange.start }
                      : end ? { start: end, end } : undefined
                  });
                }}
                className="w-full bg-white border border-[#007c89]/30 rounded-md px-3 py-2 text-sm text-[#181818] focus:border-[#007c89] focus:outline-none focus:ring-2 focus:ring-[#007c89]/20"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                const today = new Date();
                const startOfWeek = new Date(today);
                startOfWeek.setDate(today.getDate() - today.getDay() + 1);
                const endOfWeek = new Date(startOfWeek);
                endOfWeek.setDate(startOfWeek.getDate() + 6);
                setLocalFilter({
                  ...localFilter,
                  dateRange: { start: startOfWeek, end: endOfWeek }
                });
              }}
              className="px-3 py-1.5 bg-white text-[#007c89] border border-[#007c89]/30 rounded-md text-xs font-semibold hover:bg-[#007c89] hover:text-white transition-all"
            >
              Cette semaine
            </button>
            <button
              onClick={() => {
                const today = new Date();
                const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                setLocalFilter({
                  ...localFilter,
                  dateRange: { start: startOfMonth, end: endOfMonth }
                });
              }}
              className="px-3 py-1.5 bg-white text-[#007c89] border border-[#007c89]/30 rounded-md text-xs font-semibold hover:bg-[#007c89] hover:text-white transition-all"
            >
              Ce mois
            </button>
          </div>
        </div>
      </div>

      {/* Recherche */}
      <div>
        <label className="block text-sm font-semibold text-[#181818] mb-2">
          Recherche
        </label>
        <input
          type="text"
          value={localFilter.searchQuery || ''}
          onChange={(e) => setLocalFilter({ ...localFilter, searchQuery: e.target.value || undefined })}
          placeholder="Rechercher par client, notes..."
          className="w-full bg-white border border-[#007c89]/30 rounded-md px-4 py-2 text-sm text-[#181818] placeholder:text-[#6B7280] focus:border-[#007c89] focus:outline-none focus:ring-2 focus:ring-[#007c89]/20"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-[#007c89]/20">
        <button
          onClick={applyFilter}
          className="flex-1 px-4 py-2 bg-[#007c89] text-white rounded-md text-sm font-semibold hover:bg-[#006a75] transition-all"
        >
          Appliquer
        </button>
        {hasActiveFilters && (
          <button
            onClick={resetFilter}
            className="px-4 py-2 bg-white text-[#181818] border border-[#007c89]/30 rounded-md text-sm font-semibold hover:bg-[#f3efe5] transition-all"
          >
            Réinitialiser
          </button>
        )}
      </div>
    </div>
  );
};

