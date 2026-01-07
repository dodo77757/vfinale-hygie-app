import React, { useState, useEffect } from 'react';
import { UserProfile, ClientGroup } from '../types';

interface ClientGroupsProps {
  clients: UserProfile[];
  onGroupChange?: (groups: ClientGroup[]) => void;
}

const STORAGE_KEY = 'hygie_client_groups';

export const ClientGroups: React.FC<ClientGroupsProps> = ({
  clients,
  onGroupChange
}) => {
  const [groups, setGroups] = useState<ClientGroup[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    if (onGroupChange) {
      onGroupChange(groups);
    }
  }, [groups, onGroupChange]);

  const saveGroups = (updatedGroups: ClientGroup[]) => {
    setGroups(updatedGroups);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedGroups));
  };

  const createGroup = () => {
    if (!newGroupName.trim()) return;

    const newGroup: ClientGroup = {
      id: `group_${Date.now()}`,
      name: newGroupName.trim(),
      description: newGroupDescription.trim() || undefined,
      clientIds: [],
      createdAt: new Date().toISOString(),
      color: `#${Math.floor(Math.random()*16777215).toString(16)}`
    };

    saveGroups([...groups, newGroup]);
    setNewGroupName('');
    setNewGroupDescription('');
    setShowCreateForm(false);
  };

  const deleteGroup = (groupId: string) => {
    if (!window.confirm('Supprimer ce groupe ?')) return;
    saveGroups(groups.filter(g => g.id !== groupId));
  };

  const addClientToGroup = (groupId: string, clientId: string) => {
    const updated = groups.map(group => {
      if (group.id === groupId && !group.clientIds.includes(clientId)) {
        return { ...group, clientIds: [...group.clientIds, clientId] };
      }
      return group;
    });
    saveGroups(updated);
  };

  const removeClientFromGroup = (groupId: string, clientId: string) => {
    const updated = groups.map(group => {
      if (group.id === groupId) {
        return { ...group, clientIds: group.clientIds.filter(id => id !== clientId) };
      }
      return group;
    });
    saveGroups(updated);
  };

  return (
    <div className="p-6 rounded-lg bg-white border border-[#007c89]/20 shadow-md space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-bebas text-2xl text-[#181818]">Groupes de Clients</h3>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-4 py-2 bg-[#007c89] text-white rounded-md text-sm font-semibold hover:bg-[#006a75] transition-all"
        >
          {showCreateForm ? 'Annuler' : 'Créer un groupe'}
        </button>
      </div>

      {showCreateForm && (
        <div className="p-4 bg-[#f3efe5] rounded-lg border border-[#007c89]/20">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-semibold text-[#181818] mb-2">
                Nom du groupe
              </label>
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Ex: Débutants, Blessures genou..."
                className="w-full bg-white border border-[#007c89]/30 rounded-md px-4 py-2 text-sm text-[#181818] focus:border-[#007c89] focus:outline-none focus:ring-2 focus:ring-[#007c89]/20"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#181818] mb-2">
                Description (optionnel)
              </label>
              <input
                type="text"
                value={newGroupDescription}
                onChange={(e) => setNewGroupDescription(e.target.value)}
                placeholder="Description du groupe..."
                className="w-full bg-white border border-[#007c89]/30 rounded-md px-4 py-2 text-sm text-[#181818] focus:border-[#007c89] focus:outline-none focus:ring-2 focus:ring-[#007c89]/20"
              />
            </div>
            <button
              onClick={createGroup}
              className="w-full px-4 py-2 bg-[#007c89] text-white rounded-md text-sm font-semibold hover:bg-[#006a75] transition-all"
            >
              Créer
            </button>
          </div>
        </div>
      )}

      {groups.length === 0 ? (
        <div className="text-center py-12 text-[#6B7280]">
          <p className="text-sm">Aucun groupe créé</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map(group => {
            const groupClients = clients.filter(c => group.clientIds.includes(c.id));
            const availableClients = clients.filter(c => !group.clientIds.includes(c.id));

            return (
              <div
                key={group.id}
                className="p-4 bg-[#f3efe5] rounded-lg border border-[#007c89]/20"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: group.color }}
                      />
                      <h4 className="font-bebas text-lg text-[#181818]">{group.name}</h4>
                    </div>
                    {group.description && (
                      <p className="text-xs text-[#6B7280] mt-1">{group.description}</p>
                    )}
                    <p className="text-xs text-[#6B7280] mt-1">
                      {groupClients.length} client{groupClients.length > 1 ? 's' : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteGroup(group.id)}
                    className="text-[#EF4444] hover:text-[#DC2626] text-sm"
                  >
                    Supprimer
                  </button>
                </div>

                <div className="mt-3">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {groupClients.map(client => (
                      <span
                        key={client.id}
                        className="px-2 py-1 bg-white rounded text-xs text-[#181818] flex items-center gap-1"
                      >
                        {client.nom}
                        <button
                          onClick={() => removeClientFromGroup(group.id, client.id)}
                          className="text-[#EF4444] hover:text-[#DC2626]"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>

                  {availableClients.length > 0 && (
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          addClientToGroup(group.id, e.target.value);
                          e.target.value = '';
                        }
                      }}
                      className="w-full bg-white border border-[#007c89]/30 rounded-md px-3 py-2 text-sm text-[#181818] focus:border-[#007c89] focus:outline-none focus:ring-2 focus:ring-[#007c89]/20"
                    >
                      <option value="">Ajouter un client...</option>
                      {availableClients.map(client => (
                        <option key={client.id} value={client.id}>
                          {client.nom}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

