import React, { useState } from 'react';
import { UserProfile } from '../types';

interface ClientsTableViewProps {
  clients: UserProfile[];
  onClientClick: (client: UserProfile) => void;
  onClientSelect?: (clientId: string, selected: boolean) => void;
  selectedClients?: Set<string>;
}

type SortField = 'name' | 'lastSession' | 'progress' | 'sessions';
type SortDirection = 'asc' | 'desc';

export const ClientsTableView: React.FC<ClientsTableViewProps> = ({
  clients,
  onClientClick,
  onClientSelect,
  selectedClients = new Set()
}) => {
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedClients = [...clients].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortField) {
      case 'name':
        aValue = a.nom.toLowerCase();
        bValue = b.nom.toLowerCase();
        break;
      case 'lastSession':
        const aLast = a.sessionRecords && a.sessionRecords.length > 0
          ? new Date(a.sessionRecords[a.sessionRecords.length - 1].date).getTime()
          : 0;
        const bLast = b.sessionRecords && b.sessionRecords.length > 0
          ? new Date(b.sessionRecords[b.sessionRecords.length - 1].date).getTime()
          : 0;
        aValue = aLast;
        bValue = bLast;
        break;
      case 'progress':
        aValue = a.activeGoal?.currentValue || 0;
        bValue = b.activeGoal?.currentValue || 0;
        break;
      case 'sessions':
        aValue = a.sessionRecords?.length || 0;
        bValue = b.sessionRecords?.length || 0;
        break;
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return '↕';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-[#007c89] text-white">
            {onClientSelect && (
              <th className="p-3 text-left text-xs font-semibold uppercase">
                <input
                  type="checkbox"
                  checked={selectedClients.size === clients.length && clients.length > 0}
                  onChange={(e) => {
                    clients.forEach(client => {
                      onClientSelect(client.id, e.target.checked);
                    });
                  }}
                  className="text-white"
                />
              </th>
            )}
            <th
              className="p-3 text-left text-xs font-semibold uppercase cursor-pointer hover:bg-[#006a75]"
              onClick={() => handleSort('name')}
            >
              Nom {getSortIcon('name')}
            </th>
            <th className="p-3 text-left text-xs font-semibold uppercase">Objectif</th>
            <th
              className="p-3 text-left text-xs font-semibold uppercase cursor-pointer hover:bg-[#006a75]"
              onClick={() => handleSort('sessions')}
            >
              Sessions {getSortIcon('sessions')}
            </th>
            <th
              className="p-3 text-left text-xs font-semibold uppercase cursor-pointer hover:bg-[#006a75]"
              onClick={() => handleSort('lastSession')}
            >
              Dernière Session {getSortIcon('lastSession')}
            </th>
            <th
              className="p-3 text-left text-xs font-semibold uppercase cursor-pointer hover:bg-[#006a75]"
              onClick={() => handleSort('progress')}
            >
              Progression {getSortIcon('progress')}
            </th>
            <th className="p-3 text-left text-xs font-semibold uppercase">Programme</th>
            <th className="p-3 text-left text-xs font-semibold uppercase">Alertes</th>
          </tr>
        </thead>
        <tbody>
          {sortedClients.map((client, index) => {
            const lastSession = client.sessionRecords && client.sessionRecords.length > 0
              ? new Date(client.sessionRecords[client.sessionRecords.length - 1].date)
              : null;
            const daysSinceLastSession = lastSession
              ? Math.floor((Date.now() - lastSession.getTime()) / (1000 * 60 * 60 * 24))
              : null;

            const hasAlerts = 
              (client.lastPainReport && client.lastPainReport.intensity >= 5) ||
              (client.sleepQuality === 'Mauvaise') ||
              (client.blessures_actives && client.blessures_actives.length > 0);

            return (
              <tr
                key={client.id}
                className={`border-b border-[#007c89]/20 hover:bg-[#f3efe5] cursor-pointer ${
                  index % 2 === 0 ? 'bg-white' : 'bg-[#f9f9f9]'
                }`}
                onClick={() => onClientClick(client)}
              >
                {onClientSelect && (
                  <td className="p-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedClients.has(client.id)}
                      onChange={(e) => onClientSelect(client.id, e.target.checked)}
                      className="text-[#007c89]"
                    />
                  </td>
                )}
                <td className="p-3 text-sm font-semibold text-[#181818]">{client.nom}</td>
                <td className="p-3 text-sm text-[#6B7280]">{client.objectifPrincipal || 'N/A'}</td>
                <td className="p-3 text-sm text-[#181818]">{client.sessionRecords?.length || 0}</td>
                <td className="p-3 text-sm text-[#6B7280]">
                  {lastSession
                    ? daysSinceLastSession === 0
                      ? "Aujourd'hui"
                      : daysSinceLastSession === 1
                      ? "Hier"
                      : `Il y a ${daysSinceLastSession}j`
                    : 'Jamais'}
                </td>
                <td className="p-3 text-sm text-[#181818]">
                  {Math.round(client.activeGoal?.currentValue || 0)}%
                </td>
                <td className="p-3 text-sm">
                  {client.activeProgram ? (
                    <span className="px-2 py-1 bg-[#007c89] text-white rounded text-xs">
                      Oui
                    </span>
                  ) : (
                    <span className="text-[#6B7280] text-xs">Non</span>
                  )}
                </td>
                <td className="p-3 text-sm">
                  {hasAlerts ? (
                    <span className="px-2 py-1 bg-[#EF4444] text-white rounded text-xs">
                      ⚠️
                    </span>
                  ) : (
                    <span className="text-[#6B7280] text-xs">-</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

