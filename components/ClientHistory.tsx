import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { HistoryService, ModificationHistory } from '../services/historyService';

interface ClientHistoryProps {
  client: UserProfile;
  onClose?: () => void;
}

export const ClientHistory: React.FC<ClientHistoryProps> = ({
  client,
  onClose
}) => {
  const [history, setHistory] = useState<ModificationHistory[]>([]);

  useEffect(() => {
    const clientHistory = HistoryService.getClientHistory(client.id);
    setHistory(clientHistory);
  }, [client.id]);

  const getFieldLabel = (field: string): string => {
    const labels: Record<string, string> = {
      'nom': 'Nom',
      'age': 'Âge',
      'genre': 'Genre',
      'poids': 'Poids',
      'taille': 'Taille',
      'experience': 'Expérience',
      'stressLevel': 'Niveau de stress',
      'sleepQuality': 'Qualité du sommeil',
      'objectifPrincipal': 'Objectif principal',
      'delaiObjectif': 'Délai objectif',
      'materiel': 'Matériel',
      'blessures_actives': 'Blessures actives',
      'tags': 'Tags',
      'private_notes': 'Notes privées',
      'activeProgram': 'Programme actif'
    };
    return labels[field] || field;
  };

  const getModifiedByLabel = (modifiedBy: string): string => {
    switch (modifiedBy) {
      case 'moderator':
        return 'Modérateur';
      case 'client':
        return 'Client';
      case 'system':
        return 'Système';
      default:
        return modifiedBy;
    }
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return 'Aucun';
    if (Array.isArray(value)) return value.join(', ') || 'Aucun';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  if (history.length === 0) {
    return (
      <div className="p-6 rounded-lg bg-white border border-[#007c89]/20 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bebas text-xl text-[#181818]">Historique des modifications</h3>
          {onClose && (
            <button
              onClick={onClose}
              className="text-[#6B7280] hover:text-[#181818] text-xl"
            >
              ✕
            </button>
          )}
        </div>
        <p className="text-sm text-[#6B7280] text-center py-8">
          Aucune modification enregistrée pour ce client
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-lg bg-white border border-[#007c89]/20 shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bebas text-xl text-[#181818]">Historique des modifications</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-[#6B7280] hover:text-[#181818] text-xl"
          >
            ✕
          </button>
        )}
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
        {history.map((entry) => (
          <div
            key={entry.id}
            className="p-4 bg-[#f3efe5] rounded-md border border-[#007c89]/20"
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-[#007c89] uppercase">
                    {getFieldLabel(entry.field)}
                  </span>
                  <span className="text-xs text-[#6B7280]">
                    par {getModifiedByLabel(entry.modifiedBy)}
                  </span>
                </div>
                <p className="text-sm text-[#181818] font-medium">
                  {entry.description}
                </p>
              </div>
              <span className="text-xs text-[#6B7280] whitespace-nowrap ml-4">
                {new Date(entry.timestamp).toLocaleString('fr-FR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
            
            {(entry.oldValue !== null && entry.oldValue !== undefined) && (
              <div className="mt-2 pt-2 border-t border-[#007c89]/10">
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-[#6B7280] font-semibold">Ancienne valeur:</span>
                    <p className="text-[#181818] mt-1 break-words">
                      {formatValue(entry.oldValue)}
                    </p>
                  </div>
                  <div>
                    <span className="text-[#6B7280] font-semibold">Nouvelle valeur:</span>
                    <p className="text-[#181818] mt-1 break-words">
                      {formatValue(entry.newValue)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

